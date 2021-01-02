const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
const router = express.Router();

// Read .env
require('dotenv').config();

// Set port
const port = process.env.PORT || 8080;

// Route all requests to Angular's index.html
router.get('*', (req, res) => {
    res.sendFile('index.html', { root: path.join(__dirname, 'dist', 'openphotos') });
});

// Handle requests to static assets
app.use(express.static(__dirname + '/dist/openphotos'));

// Set up body parser
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
app.use(bodyParser.json({ type: 'application/vnd.api+json' }));

// Connect router to app
app.use('/', router);

// Start server
app.listen(port, () => console.log(`Listening on port ${port}`));