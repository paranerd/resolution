const app = require('./app');

// Read ENV variables
require('dotenv').config();

// Read local ENV variables
require('dotenv').config({ path: '.env.local' });

// Connect to MongoDB
require('./util/database').connect();

const port = process.env.PORT || 8080;

app.listen(port, async () => {
  console.log(`Listening at :${port}`);
});
