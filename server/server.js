const express = require('express');
require('./config/database');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public', { index: false }));

// Routes
app.use(require('./routes'));

app.listen(port, async () => {
    console.log(`Listening at :${port}`);
});
