import * as fs from 'fs';
import * as path from 'path';
import { Request, Response } from 'express';
import ExifReader from 'exifreader';
import crypto from 'crypto';
import sharp from 'sharp';
import probe from 'probe-image-size';
import ffmpeg, { FfprobeData, FfprobeStream } from 'fluent-ffmpeg';
import archiver from 'archiver';
import mime from 'mime-types';

import Item from '../models/item.js';

interface Metadata {
  created?: number;
  height?: number;
  width?: number;
  orientation?: number;
  duration?: number;
  streams?: FfprobeStream[];
  format?: FfprobeData;
}
// Temp path for zip files while downloading
const tmpDir = process.env.TMP_DIR ?? path.join(process.env.MEDIA_DIR!, 'tmp');

// Path to video thumbnails
const thumbnailDir =
  process.env.THUMBNAIL_DIR ?? path.join(process.env.MEDIA_DIR!, 'thumbnails');

// This filters the item attributes sent to the client
const clientProjection = {
  _id: 0,
  id: 1,
  type: 1,
  height: 1,
  width: 1,
  created: 1,
  duration: 1,
};

/**
 * Replace substring at index.
 *
 * @param {string} str
 * @param {number} index
 * @param {string} newValue
 * @returns {string}
 */
function replaceAtIndex(str: string, index: number, newValue: string) {
  return (
    str.substring(0, index) + newValue + str.substring(index + newValue.length)
  );
}

/**
 * Parse file create time.
 *
 * @param {String} filePath
 * @param {Object} exif
 * @returns {number}
 */
function parseCreatedTime(
  filePath: string,
  exif: ExifReader.Tags & ExifReader.XmpTags & ExifReader.IccTags
): number {
  let created: string | undefined;

  if (exif.DateTimeOriginal) {
    // Parse from EXIF if exists
    created = (exif.DateTimeOriginal.value as string[])[0];

    if (created) {
      // Replace ':' with '-' in date
      created = replaceAtIndex(created, 4, '-');
      created = replaceAtIndex(created, 7, '-');
    }
  }

  // Default to file modification time
  created = created ?? fs.statSync(filePath).mtime.toString();

  return Date.parse(created);
}

/**
 * Calculate file hash.
 *
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function getFileHash(filePath: string) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    const hash = crypto.createHash('md5');
    hash.setEncoding('hex');

    stream.on('end', () => {
      hash.end();

      resolve(hash.read());
    });

    stream.on('error', (err: string) => {
      reject(err);
    });

    // Pipe file to hash object
    stream.pipe(hash);
  });
}

/**
 * Generate thumbnail from video.
 *
 * @param {string} id
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function generateVideoThumbnail(
  id: string,
  filePath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Make sure the thumbnail folder exists
    if (!fs.existsSync(thumbnailDir!)) {
      fs.mkdirSync(thumbnailDir!, { recursive: true });
    }

    ffmpeg(filePath)
      .screenshots({
        count: 1,
        filename: `${id}.jpg`,
        folder: thumbnailDir,
      })
      .on('end', () => {
        resolve(`${thumbnailDir}/${id}.jpg`);
      })
      .on('error', (err: string) => {
        reject(err);
      });
  });
}

/**
 * Read image metadata from EXIF.
 *
 * @param {string} filePath
 * @returns {Promise}
 */
async function readImageMetadata(filePath: string): Promise<Metadata> {
  // Get image dimensions
  const dimensions = await probe(fs.createReadStream(filePath));

  // Check if image is rotated (to switch width and height)
  const rotated =
    dimensions.orientation && [6, 8].includes(dimensions.orientation);

  try {
    const tags = await ExifReader.load(filePath);

    return {
      created: parseCreatedTime(filePath, tags),
      height: rotated ? dimensions.width : dimensions.height,
      width: rotated ? dimensions.height : dimensions.width,
    };
  } catch (err: unknown) {
    throw new Error(err as string);
  }
}

/**
 * Get video dimensions from metadata.
 *
 * @param {Stream[]} streams
 * @returns {{height: number, width: number}}}
 */
function getVideoDimensions(streams: FfprobeStream[]) {
  for (let i = 0; i < streams.length; i += 1) {
    if (Object.prototype.hasOwnProperty.call(streams[i], 'height')) {
      return {
        height: streams[i].height,
        width: streams[i].width,
      };
    }
  }

  return {};
}

/**
 * Read video metadata.
 *
 * @param {string} filePath
 * @returns {Promise<Metadata>}
 */
async function readVideoMetadata(filePath: string): Promise<Metadata> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err: string, metadata: FfprobeData) => {
      if (err) {
        reject(err);
      } else {
        // Check if image is rotated (to switch width and height)
        const rotated = ['90', '270'].includes(
          metadata.streams![0].tags?.rotate
        );

        // Get video dimensions
        const dimensions = getVideoDimensions(metadata.streams!);

        resolve({
          created: Date.parse(metadata.format?.tags?.creation_time as string),
          duration: Math.round(metadata.format!.duration ?? 0),
          width: rotated ? dimensions.height : dimensions.width,
          height: rotated ? dimensions.width : dimensions.height,
        });
      }
    });
  });
}

/**
 * Check if item's file has changed based on hash.
 *
 * @param {Item} item
 * @returns {boolean}
 */
async function hasChanged(item: Item) {
  const currentHash = await getFileHash(item.path);

  return currentHash !== item.hash;
}

/**
 * Import file into database.
 *
 * @param {string} absPath
 * @returns {Item}
 */
async function importFile(absPath: string): Promise<Item | null> {
  const all = await Item.find({});

  const mimeType = mime.lookup(absPath);

  if (!mimeType) {
    console.log(`MIME type of ${absPath} could not be determined. Skipping.`);
    return null;
  }

  // Get MIME type
  const mediaType = mimeType.split('/')[0];

  // Only support images and videos
  if (!['image', 'video'].includes(mediaType)) {
    return null;
  }

  // Check if item already exists
  const exists = await Item.findOne({ path: absPath });

  // Check if file has been modified
  if (exists && !(await hasChanged(exists))) {
    return null;
  }

  // Read metadata
  let metadata: Metadata = {};

  try {
    metadata =
      mediaType === 'image'
        ? await readImageMetadata(absPath)
        : await readVideoMetadata(absPath);
  } catch (err) {
    console.error(err);
  }

  const item = await Item.updateOrCreate(
    { path: absPath },
    {
      type: mediaType,
      hash: await getFileHash(absPath),
      filename: path.basename(absPath),
      created: metadata.created,
      height: metadata.height,
      width: metadata.width,
      orientation: metadata.orientation ?? 1,
      duration: mediaType === 'image' ? 0 : metadata.duration,
    }
  );

  // Generate video thumbnail
  if (mediaType === 'video') {
    const thumbnailPath = await generateVideoThumbnail(item.id, absPath);

    // Update item
    item.thumbnailPath = thumbnailPath;
    await item.save();
  }

  return exists ? null : item;
}

/**
 * Recursively scan path for images and store to database.
 *
 * @param {string} currentPath
 * @returns {number}
 */
async function scanRecursive(currentPath: string) {
  const files = fs.readdirSync(currentPath);
  let count = 0;

  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < files.length; i += 1) {
    const filename = files[i];
    const filePath = path.join(currentPath, filename);

    if (fs.lstatSync(filePath).isDirectory()) {
      count += await scanRecursive(filePath);
    } else {
      const imported = await importFile(filePath);

      count += imported ? 1 : 0;
    }
  }
  /* eslint-enable no-await-in-loop */

  return count;
}

/**
 * Scan files.
 *
 * @param {Request} req
 * @param {Response} res
 */
async function scan(req: Request, res: Response) {
  try {
    if (!process.env.MEDIA_DIR) {
      throw new Error('MEDIA_DIR not set');
    }

    const count = await scanRecursive(process.env.MEDIA_DIR);

    res.status(200).json({ msg: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error scanning media' });
  }
}

/**
 * Get current datetime as YYYY-MM-DD_HHmmss.uuu.
 *
 * @returns {string}
 */
function getTimestring() {
  const date = new Date();
  const year = date.getFullYear();
  const month = `0${date.getMonth()}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  const hours = `0${date.getHours()}`.slice(-2);
  const minutes = `0${date.getMinutes()}`.slice(-2);
  const seconds = `0${date.getSeconds()}`.slice(-2);
  const millis = date.getMilliseconds();

  return `${year}-${month}-${day}_${hours}${minutes}${seconds}.${millis}`;
}

/**
 * Zip files.
 *
 * @param {string[]} items
 * @returns {Promise<string>}
 */
async function zip(items: Item[]): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(tmpDir!)) {
      fs.mkdirSync(tmpDir!, { recursive: true });
    }

    // Determine output path
    const outputFilename = `resolution-${getTimestring()}.zip`;
    const outputPath = path.join(tmpDir!, outputFilename);

    // Open output as stream
    const output = fs.createWriteStream(outputPath);

    // Set compression level.
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    output.on('close', () => {
      resolve(outputPath);
    });

    // Error handling
    archive.on('warning', (err: string) => {
      reject(err);
    });

    archive.on('error', (err: string) => {
      reject(err);
    });

    archive.pipe(output);

    // Add all files
    items.forEach((item) => {
      archive.file(item.path, { name: path.basename(item.path) });
    });

    archive.finalize();
  });
}

/**
 * Download file(s).
 * Zip if multiple files.
 *
 * @param {Request} req
 * @param {Response} res
 */
async function download(
  req: Request & { query: { ids: string[] } },
  res: Response
) {
  const { ids } = req.query;

  const items = await Item.find({ id: { $in: ids } });
  let downloadPath: string;
  let removeAfterDownload = false;

  try {
    if (items.length === 1) {
      downloadPath = items[0].path;
    } else {
      removeAfterDownload = true;
      downloadPath = await zip(items);
    }
  } catch (err) {
    const error = err as Error & { status?: number };
    console.error(err);
    const status = error.status ? error.status : 500;
    res.status(status).json({ error: error.message });
    return;
  }

  res.download(downloadPath, (err) => {
    if (err) {
      console.error('Error downloading:', err);
    }

    if (removeAfterDownload) {
      fs.unlinkSync(downloadPath);
    }
  });
}

/**
 * Remove file(s).
 *
 * @param {Request} req
 * @param {Response} res
 */
async function remove(req: Request, res: Response) {
  const { ids } = req.body;

  const items = await Item.find({ id: { $in: ids } });

  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];

    try {
      fs.unlinkSync(item.path);
    } catch (err) {
      const error = err as Error & { code?: string };
      if (error.code === 'ENOENT') {
        console.error(`File ${item.path} does not exist`);
      }
    }

    await Item.deleteOne({ id: item.id });
  }
  /* eslint-disable no-await-in-loop */

  res.sendStatus(200);
}

/**
 * Resize image.
 *
 * @param {string} imagePath
 * @param {number} width
 * @param {number} height
 * @returns {Stream}
 */
function resize(imagePath: string, width: number, height: number) {
  const readStream = fs.createReadStream(imagePath);

  readStream.on('error', (err: string) => {
    throw err;
  });

  // Define transformation
  const transform = sharp()
    .jpeg()
    .rotate()
    .resize(width, height)
    .withMetadata();

  return readStream.pipe(transform);
}

/**
 * Send video in chunks.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Item} item
 */
function streamVideo(req: Request, res: Response, item: Item) {
  const filePath = item.path;
  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const { range } = req.headers;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res
        .status(416)
        .send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
      return;
    }

    const chunksize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
}

/**
 * Get single item.
 *
 * @param {Request} req
 * @param {Response} res
 */
async function getOne(req: Request, res: Response) {
  try {
    const item = await Item.findOne({ id: req.params.id });

    if (!item) {
      res.sendStatus(404);
      return;
    }

    const width = parseInt(req.query.w as string, 10) || item.width;
    const height = parseInt(req.query.h as string, 10) || item.height;

    const filePath =
      item.type === 'video' && req.query.thumbnail
        ? item.thumbnailPath
        : item.path;

    const mimeType = mime.lookup(filePath);

    if (!mimeType) {
      throw new Error('Invalid file type');
    }

    // Set MIME type
    res.type(mimeType);

    if (item.type === 'image' || req.query.thumbnail) {
      // Get the resized image
      resize(filePath, width, height).pipe(res);
    } else {
      streamVideo(req, res, item);
    }
  } catch (err) {
    const error = err as Error & { status?: number };
    console.error(err);
    const status = error.status ? error.status : 500;
    res.status(status).json({ error: error.message });
  }
}

/**
 * Get basic info for all items.
 *
 * @param {Request} req
 * @param {Response} res
 */
async function getAll(req: Request, res: Response) {
  try {
    const query: { id?: string } = {};

    if (req.query.id) {
      query.id = req.query.id as string;
    }

    const matchQuery: Record<string, unknown> = { $match: query };

    const aggregation = [matchQuery];

    // Set sort order
    const sortAggregation: { created?: number } = {};
    sortAggregation.created = -1;
    aggregation.push({ $sort: sortAggregation });

    const items = await Item.aggregate(
      aggregation.concat([
        {
          $project: clientProjection,
        },
      ])
    ).allowDiskUse(true);

    res.json({
      items,
    });
  } catch (err) {
    const error = err as Error & { status?: number };
    console.error(err);
    const status = error.status ? error.status : 500;
    res.status(status).send(error.message);
  }
}

/**
 * Removes object properties from an array of objects.
 *
 * @param {Array} arr
 * @param {Object} projection
 * @returns {Array}
 */
function project(arr: Item[], projection: Record<string, unknown>) {
  return arr.map((el) => {
    const obj: Record<string, unknown> = {};

    Object.keys(el.toJSON()).forEach((key) => {
      if (Object.keys(projection).includes(key) && projection[key] === 1) {
        obj[key] = el.get(key);
      }
    });

    return obj;
  });
}

/**
 * Upload file(s).
 *
 * @param {Request} req
 * @param {Response} res
 */
async function upload(req: Request, res: Response) {
  const fileImports = (req.files as Express.Multer.File[]).map((file) => {
    return importFile(file.path);
  });

  // Wait for all imports to finish
  const importResults = await Promise.all(fileImports);

  // Remove non-imports
  const successfullyUploaded = importResults.filter(
    (item): item is Item => item !== null
  );

  // Filter item properties
  const returnItems = project(successfullyUploaded, clientProjection);

  res.status(200).json({ items: returnItems });
}

export default { scan, getAll, getOne, download, remove, upload, streamVideo };
