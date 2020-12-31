const express = require('express');
const path = require('path');

const router = express.Router();

const PUBLIC_DIR = path.join(__dirname, '..', 'public');

router.get('*', function(req, res) {
    res.sendFile('cast.html', { root: PUBLIC_DIR });
});

module.exports = {
    router
};