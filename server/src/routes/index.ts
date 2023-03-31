import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import * as path from 'path';

const router = express.Router();

// Middleware
import auth from '../middleware/auth.js';
import uploader from '../middleware/upload.js';

// Controllers
import authController from '../controllers/auth.js';
import itemController from '../controllers/item.js';
import systemController from '../controllers/system.js';

// Include cookie parser
router.use(cookieParser());

// Set CORS headers
if (!process.env.PRODUCTION) {
  router.use(cors({ exposedHeaders: 'Content-Disposition' }));
}

// Auth routes
router.post('/api/auth/setup', authController.setup);
router.post('/api/auth/login', authController.login);
router.post('/api/auth/logout', auth.isAuthenticated(), authController.logout);
router.post(
  '/api/auth/refresh',
  auth.isAuthenticated(),
  authController.refresh
);

// Item routes
router.get(
  '/api/item/download',
  auth.isAuthenticated(),
  itemController.download
);
router.post(
  '/api/item/upload',
  uploader.array('files'),
  auth.isAuthenticated(),
  itemController.upload
);
router.post('/api/item/scan', auth.isAuthenticated(), itemController.scan);
router.get('/api/item/:id', auth.isAuthenticated(), itemController.getOne);
router.delete('/api/item', auth.isAuthenticated(), itemController.remove);
router.get('/api/item', auth.isAuthenticated(), itemController.getAll);

// System routes
router.get(
  '/api/system/cast-app-id',
  auth.isAuthenticated(),
  systemController.getCastAppId
);

// Frontend
router.use('/', express.static('./static'));

router.use('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'static', 'index.html'));
});

export default router;
