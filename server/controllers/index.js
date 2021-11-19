const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');
const router = express.Router();

// Include cookie parser
router.use(cookieParser());

if (!process.env.PRODUCTION) {
    router.use(cors());
}

// Include all controllers
router.use('/api/item', require('./item').router);

// Serve static angular build
router.use('/', express.static('./dist'));

router.use('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../', 'dist', 'index.html'));
});

module.exports = router;
