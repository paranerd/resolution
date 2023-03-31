import express from 'express';
import routes from './routes/index.js';

const app = express();
app.disable('x-powered-by');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public', { index: false }));

// Routes
app.use(routes);

export default app;
