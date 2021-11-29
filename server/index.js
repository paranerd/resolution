const app = require('./app');

// Read ENV variables
require('dotenv').config();

// Connect to MongoDB
require('./config/database').connect();

const port = process.env.PORT || 8080;

app.listen(port, async () => {
  console.log(`Listening at :${port}`);
});
