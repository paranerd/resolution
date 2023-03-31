import mongoose from 'mongoose';

let retries = 0;
const maxRetries = 3;
const secondsBetweenRetries = 5;
const server = process.env.DOCKER ? 'mongo' : '127.0.0.1';
const database =
  process.env.NODE_ENV === 'test' ? 'resolution-dev' : 'resolution';
const connectionString = `mongodb://${server}:27017/${database}`;
const connectionParams = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
};

/**
 * Connect to MongoDB with retry.
 */
export default async function connect() {
  try {
    await mongoose.connect(connectionString, connectionParams);
  } catch (err) {
    console.error(`Failed to connect to mongo on startup`, err);

    if (retries < maxRetries) {
      console.error(`Retrying in ${secondsBetweenRetries}s...`);
      retries++;
      setTimeout(connect, secondsBetweenRetries * 1000);
    } else {
      console.error(`Max retries reached. Exiting...`);
    }
  }
}
