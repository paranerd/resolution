const express = require('express');
const bodyParser = require('body-parser');
require('./config/database');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public', {index: false}));
app.use(require('./controllers'));

app.listen(port, async () => {
    console.log(`Listening at :${port}`);
});