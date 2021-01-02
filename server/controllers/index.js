const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const router = express.Router();

// Include cookie parser
router.use(cookieParser());

if (!process.env.PRODUCTION) {
    router.use(cors());
}

// Include all controllers
router.use('/api/item', require('./item').router);

module.exports = router;