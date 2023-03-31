import './config.js';
import connect from './util/database.js';
import app from './app.js';

if (!process.env.MEDIA_DIR) {
  throw new Error('MEDIA_DIR not set');
}

// Connect to MongoDB
connect();

const port = process.env.PORT || 8080;

app.listen(port, async () => {
  console.log(`Listening at :${port}`);
});
