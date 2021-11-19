const express = require('express');
const path = require('path')
const app = express();
require('dotenv').config()

const port = process.env.PORT || 8080;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(port, () => console.log(`Listening on port ${port}`));
