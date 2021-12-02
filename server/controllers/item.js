const sharp = require('sharp');
const sizeOf = require('image-size');
const archiver = require('archiver');
const mime = require('mime-types');
const fs = require('fs');
const path = require('path');
const { ExifImage } = require('exif');

const Item = require('../models/item');

// Temp path for zip files while downloading
const TMP_PATH = path.join(__dirname, '..', 'tmp');

/**
 * Read EXIF data.
 *
 * @param {string} filePath
 * @returns {Promise}
 */
async function readExif(filePath) {
  return new Promise((resolve, reject) => {
    try {
      // eslint-disable-next-line no-new
      new ExifImage({ image: filePath }, (err, exifData) => {
        if (err) {
          reject(err);
        } else {
          resolve(exifData);
        }
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Import file into database
 *
 * @param {string} absPath
 * @returns {Item}
 */
async function importFile(absPath) {
  // Only handle images
  // Get image dimensions
  const dimensions = sizeOf(absPath);

  // Check if image is rotated (to switch width and height)
  const rotated = [6, 8].includes(dimensions.orientation);

  // Read EXIF data (JPEG only)
  let exif = null;
  try {
    exif = await readExif(absPath);
  } catch (err) {
    if (!['NO_EXIF_SEGMENT', 'NOT_A_JPEG'].includes(err.code)) {
      console.error(err);
    }
  }

  return Item.updateOrCreate(
    { path: absPath },
    {
      filename: path.basename(absPath),
      height: rotated ? dimensions.width : dimensions.height,
      width: rotated ? dimensions.height : dimensions.width,
      orientation: dimensions.orientation || 1,
      exif: {
        dateTimeOriginal: exif?.exif?.DateTimeOriginal || null,
      },
    }
  );
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
    const absPath = path.join(currentPath, filename);

    if (fs.lstatSync(absPath).isDirectory()) {
      count += await scanRecursive(absPath);
    } else if (mime.lookup(absPath).startsWith('image/')) {
      await importFile(absPath);

      count += 1;
    }
  }
  /* eslint-enable no-await-in-loop */

  return count;
}

async function scan(req, res) {
  try {
    const count = await scanRecursive(process.env.MEDIA_DIR);

    console.log(`Scanned ${count} item(s)`);

    res.status(200).json({ msg: count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Error scanning media' });
  }
}

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
      resolve(resolve(outputPath));
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

async function getOne(req, res) {
  try {
    const item = await Item.findOne({ id: req.params.id });

    if (!item) {
      res.sendStatus(404);
      return;
    }

    const width = parseInt(req.query.w, 10) || item.width;
    const height = parseInt(req.query.h, 10) || item.height;

    res.type(mime.lookup(item.path));

    // Get the resized image
    resize(item.path, width, height).pipe(res);
  } catch (err) {
    console.error(err);
    const status = err.status ? err.status : 500;
    res.status(status).json({ error: err.message });
  }
}

async function getAll(req, res) {
  try {
    const query = {};

    if (req.query.id) {
      query.id = req.query.id;
    }

    const matchQuery = { $match: query };

    const aggregation = [matchQuery];

    // Get current page
    const page =
      req.query.page && req.query.page > 0 ? parseInt(req.query.page, 10) : 1;

    // Results per page
    const pageSize = !Number.isNaN(Number(req.query.limit))
      ? Number(req.query.limit)
      : 100000000;

    const items = await Item.aggregate(
      aggregation.concat([
        { $skip: (page - 1) * pageSize },
        { $project: { _id: 0, id: 1, height: 1, width: 1 } },
        { $limit: pageSize },
      ])
    ).allowDiskUse(true);

    // Get total number of results without limit
    const count = await Item.aggregate([
      matchQuery,
      { $project: { _id: 1 } },
      { $count: 'total' },
    ]);
    const total = count.length ? count[0].total : 0;

    // Set pages
    const pages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;

    res.json({
      items,
      page,
      pageSize,
      pages,
      total,
    });
  } catch (err) {
    console.error(err);
    const status = err.status ? err.status : 500;
    res.status(status).send(err.message);
  }
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
  await Promise.all(fileImports);

  res.sendStatus(200);
}

module.exports = {
  scan,
  getAll,
  getOne,
  download,
  remove,
  upload,
};
