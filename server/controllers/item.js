const express = require('express');
const sharp = require('sharp');
const sizeOf = require('image-size');
const archiver = require('archiver');
const mime = require('mime-types');
const fs = require('fs');
const path = require('path');
const Item = require('../models/item');
const Errors = require('../util/errors');

const router = express.Router();

const TMP_PATH = path.join(__dirname, '..', 'tmp');

router.get('/scan', async (req, res) => {
    await scan(process.env.MEDIA_DIR);
    res.send('Done.');
});

async function scan(currentPath) {
    const files = fs.readdirSync(currentPath);

    for (const file of files) {
        const absPath = path.join(currentPath, file);

        if (fs.lstatSync(absPath).isDirectory()) {
            await scan(absPath);
            continue;
        }

        // Only handle images
        if (!mime.lookup(absPath).startsWith('image/')) {
            continue;
        }

        const dimensions = sizeOf(absPath);
        const item = await Item.findOrCreate({
            title: file,
            path: absPath,
            height: dimensions.height,
            width: dimensions.width,
        });

        await item.save();
    }
}

router.get('/download', async (req, res) => {
    const ids = req.query.ids;

    const items = await Item.find({id: {$in: ids}});
    let downloadPath;
    let removeAfterDownload = false;

    try {
        if (items.length === 1) {
            downloadPath = items[0].path;
        }
        else {
            removeAfterDownload = true;
            downloadPath = await zip(items);
        }
    } catch (err) {
        console.error(err);
        const status = err.status ? err.status : 500;
        res.status(status).json({'error': err.message});
        return;
    }

    res.download(downloadPath, function(err) {
        if (err) {
            console.error("Error downloading:", err);
        }
        else {
            console.log("Downloaded", downloadPath);
        }

        if (removeAfterDownload) {
            fs.unlinkSync(downloadPath);
        }
    });
});

router.get('/:id', async (req, res) => {
    const width = parseInt(req.query.w) || 300;
    const height = parseInt(req.query.h) || 300;

    try {
        const item = await Item.findOne({id: req.params.id});

        res.type('image/jpeg');
    
        // Get the resized image
        resize(item.path, width, height).pipe(res);
    } catch (err) {
        console.error(err);
        const status = err.status ? err.status : 500;
        res.status(status).json({'error': err.message});
    }
});

router.get('/', async (req, res) => {
    try {
        const query = {};

        if (req.query.id) {
            query.id = req.query.id;
        }

        const matchQuery = {$match: query};

        const aggregation = [matchQuery];

        // Get current page
        const page = (req.query.page && req.query.page > 0) ? parseInt(req.query.page) : 1;

        // Results per page
        const pageSize = !isNaN(Number(req.query.limit)) ? Number(req.query.limit) : 100000000;

        const items = await Item.aggregate(aggregation.concat([{$skip: (page - 1) * pageSize}, {$limit: pageSize}])).allowDiskUse(true);

        // Get total number of results without limit
        const count = await Item.aggregate([matchQuery, {$project: {_id: 1}}, {$count: "total"}]);
        const total = count.length ? count[0]['total'] : 0;

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
});

function getTimestring() {
    const date = new Date();
    const year = date.getFullYear();
    const month = ("0" + date.getMonth()).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    const hours = ("0" + date.getHours()).slice(-2);
    const minutes = ("0" + date.getMinutes()).slice(-2);
    const seconds = ("0" + date.getSeconds()).slice(-2);
    const millis = date.getMilliseconds();

    return year + "-" + month + "-" + day + "_" + hours + "" + minutes + "" + seconds + "." + millis;
}

async function zip(items) {
    return new Promise((resolve, reject) => {
        if (!fs.existsSync(TMP_PATH)) {
            fs.mkdirSync(TMP_PATH, {recursive: true});
        }

        // Determine output path
        const outputFilename = getTimestring() + '.zip';
        const outputPath = path.join(TMP_PATH, outputFilename);

        // Open output as stream
        const output = fs.createWriteStream(outputPath);

        // Set compression level.
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        output.on('close', function() {
            resolve(resolve(outputPath));
        });

        // Error handling
        archive.on('warning', function(err) {
            reject(err);
        });

        archive.on('error', function(err) {
            reject(err);
        });

        archive.pipe(output);

        // Add all files
        for (const item of items) {
            archive.file(item.path, { name: path.basename(item.path) });
        }

        archive.finalize();
    });
}

function resize(p, height, width) {
    const readStream = fs.createReadStream(p);

    readStream.on('error', (err) => {
        throw err;
    });

    // Define transformation
    const transform = sharp().jpeg().resize(height, width).withMetadata();

    return readStream.pipe(transform);
}

module.exports = {
    router
};