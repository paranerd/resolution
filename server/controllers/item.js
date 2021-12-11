const crypto = require('crypto');
const sharp = require('sharp');
const probe = require('probe-image-size');
const ffmpeg = require('fluent-ffmpeg');
const archiver = require('archiver');
const mime = require('mime-types');
const fs = require('fs');
const path = require('path');
const { ExifImage } = require('exif');

const Item = require('../models/item');

// Temp path for zip files while downloading
const TMP_PATH = path.join(__dirname, '..', 'tmp');

// Path to video thumbnails
const THUMBNAIL_PATH = path.join(__dirname, '..', 'thumbnails');

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
 * @param {String} str
 * @param {Number} index
 * @param {String} newValue
 * @returns {String}
 */
function replaceAtIndex(str, index, newValue) {
  return (
    str.substring(0, index) + newValue + str.substring(index + newValue.length)
  );
}

/**
 * Parse file create time.
 *
 * @param {String} filePath
 * @param {Object} exif
 * @returns
 */
function parseCreatedTime(filePath, exif) {
  let created;

  if (exif) {
    // Parse from EXIF if exists
    created =
      exif?.exif?.DateTimeOriginal ||
      exif?.exif?.CreateDate ||
      exif?.ModifyDate;

    if (created) {
      // Replace ':' with '-' in date
      created = replaceAtIndex(created, 4, '-');
      created = replaceAtIndex(created, 7, '-');
    }
  }

  // Default to file modification time
  created = created || fs.statSync(filePath).mtime;

  return Date.parse(created);
}

/**
 * Calculate file hash.
 *
 * @param {string} filePath
 * @returns {Promise}
 */
async function getFileHash(filePath) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath);
    const hash = crypto.createHash('md5');
    hash.setEncoding('hex');

    stream.on('end', () => {
      hash.end();

      resolve(hash.read());
    });

    stream.on('error', (err) => {
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
 * @returns {Promise}
 */
async function generateVideoThumbnail(id, filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg(filePath)
      .screenshots({
        count: 1,
        filename: `${id}.jpg`,
        folder: THUMBNAIL_PATH,
      })
      .on('end', () => {
        resolve(`${THUMBNAIL_PATH}/${id}.jpg`);
      })
      .on('error', (err) => {
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
async function readImageMetadata(filePath) {
  // Get image dimensions
  const dimensions = await probe(fs.createReadStream(filePath));

  // Check if image is rotated (to switch width and height)
  const rotated = [6, 8].includes(dimensions.orientation);

  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line no-new
      new ExifImage({ image: filePath }, (err, exifData) => {
        if (err && !['NO_EXIF_SEGMENT', 'NOT_A_JPEG'].includes(err.code)) {
          reject(err);
        } else {
          resolve({
            created: parseCreatedTime(filePath, exifData),
            height: rotated ? dimensions.width : dimensions.height,
            width: rotated ? dimensions.height : dimensions.width,
          });
        }
      });
    } catch (err) {
      if (!['NO_EXIF_SEGMENT', 'NOT_A_JPEG'].includes(err.code)) {
        reject(err);
      }
    }
  });
}

/**
 * Get video dimensions from metadata.
 *
 * @param {Object} streams
 * @returns {Object}
 */
function getVideoDimensions(streams) {
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
 * @returns {Promise}
 */
async function readVideoMetadata(filePath) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        // Check if image is rotated (to switch width and height)
        const rotated = ['90', '270'].includes(
          metadata.streams[0].tags?.rotate
        );

        // Get video dimensions
        const dimensions = getVideoDimensions(metadata.streams);

        resolve({
          created: Date.parse(metadata.format.tags.creation_time),
          duration: Math.round(metadata.format.duration),
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
async function hasChanged(item) {
  const currentHash = getFileHash(item.path);

  return currentHash !== item.hash;
}

/**
 * Import file into database.
 *
 * @param {string} absPath
 * @returns {Item}
 */
async function importFile(absPath) {
  // Get MIME type
  const type = mime.lookup(absPath).split('/')[0];

  // Only support images and videos
  if (!['image', 'video'].includes(type)) {
    return null;
  }

  // Check if item already exists
  const exists = await Item.findOne({ path: absPath });

  // Check if file has been modified
  if (exists && !(await hasChanged(exists))) {
    return null;
  }

  // Read metadata
  let metadata = null;

  try {
    metadata =
      type === 'image'
        ? await readImageMetadata(absPath)
        : await readVideoMetadata(absPath);
  } catch (err) {
    console.error(err);
  }

  const item = await Item.updateOrCreate(
    { path: absPath },
    {
      type,
      hash: await getFileHash(absPath),
      filename: path.basename(absPath),
      created: metadata.created,
      height: metadata.height,
      width: metadata.width,
      orientation: metadata.orientation || 1,
      duration: type === 'image' ? 0 : metadata.duration,
    }
  );

  // Generate video thumbnail
  if (type === 'video') {
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
async function scanRecursive(currentPath) {
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
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function scan(req, res) {
  try {
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
 * @param {array} items
 * @returns {Promise}
 */
async function zip(items) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(TMP_PATH)) {
      fs.mkdirSync(TMP_PATH, { recursive: true });
    }

    // Determine output path
    const outputFilename = `resolution-${getTimestring()}.zip`;
    const outputPath = path.join(TMP_PATH, outputFilename);

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
    archive.on('warning', (err) => {
      reject(err);
    });

    archive.on('error', (err) => {
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
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function download(req, res) {
  const { ids } = req.query;

  const items = await Item.find({ id: { $in: ids } });
  let downloadPath;
  let removeAfterDownload = false;

  try {
    if (items.length === 1) {
      downloadPath = items[0].path;
    } else {
      removeAfterDownload = true;
      downloadPath = await zip(items);
    }
  } catch (err) {
    console.error(err);
    const status = err.status ? err.status : 500;
    res.status(status).json({ error: err.message });
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
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function remove(req, res) {
  const { ids } = req.body;

  const items = await Item.find({ id: { $in: ids } });

  /* eslint-disable no-await-in-loop */
  for (let i = 0; i < items.length; i += 1) {
    const item = items[i];

    try {
      fs.unlinkSync(item.path);
    } catch (err) {
      if (err.code === 'ENOENT') {
        console.error(`File ${item.path} does not exist`);
      }
    }

    await Item.deleteOne(item);
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
function resize(imagePath, width, height) {
  const readStream = fs.createReadStream(imagePath);

  readStream.on('error', (err) => {
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
 * @param {Express.Request} req
 * @param {Express.Response} res
 * @param {Item} item
 */
function streamVideo(req, res, item) {
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
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function getOne(req, res) {
  try {
    const item = await Item.findOne({ id: req.params.id });

    if (!item) {
      res.sendStatus(404);
      return;
    }

    const width = parseInt(req.query.w, 10) || item.width;
    const height = parseInt(req.query.h, 10) || item.height;

    let filePath = item.path;

    if (item.type === 'video' && req.query.thumbnail) {
      filePath = item.thumbnailPath;
    }

    // Set MIME type
    res.type(mime.lookup(filePath));

    if (item.type === 'image' || req.query.thumbnail) {
      // Get the resized image
      resize(filePath, width, height).pipe(res);
    } else {
      streamVideo(req, res, item);
    }
  } catch (err) {
    console.error(err);
    const status = err.status ? err.status : 500;
    res.status(status).json({ error: err.message });
  }
}

/**
 * Get basic info for all items.
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function getAll(req, res) {
  try {
    const query = {};

    if (req.query.id) {
      query.id = req.query.id;
    }

    const matchQuery = { $match: query };

    const aggregation = [matchQuery];

    // Set sort order
    const sortAggregation = {};
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
    console.error(err);
    const status = err.status ? err.status : 500;
    res.status(status).send(err.message);
  }
}

/**
 * Removes object properties from an array of objects.
 *
 * @param {Array} arr
 * @param {Object} projection
 * @returns {Array}
 */
function project(arr, projection) {
  return arr.map((el) => {
    const obj = {};

    Object.keys(el.toJSON()).forEach((key) => {
      if (Object.keys(projection).includes(key) && projection[key] === 1) {
        obj[key] = el[key];
      }
    });

    return obj;
  });
}

/**
 * Upload file(s).
 *
 * @param {Express.Request} req
 * @param {Express.Response} res
 */
async function upload(req, res) {
  const fileImports = [];

  // Start imports simultaneously
  req.files.forEach((file) => fileImports.push(importFile(file.path)));

  // Wait for all imports to finish
  let uploadedItems = await Promise.all(fileImports);

  // Remove non-imports
  uploadedItems = uploadedItems.filter((item) => item !== null);

  // Filter item properties
  const returnItems = project(uploadedItems, clientProjection);

  res.status(200).json({ items: returnItems });
}

module.exports = {
  scan,
  getAll,
  getOne,
  download,
  remove,
  upload,
  streamVideo,
};
