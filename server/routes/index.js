const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const router = express.Router();

// Middleware
const auth = require('../middleware/auth');
const uploader = require('../middleware/upload');

// Controllers
const authController = require('../controllers/auth');
const itemController = require('../controllers/item');
const systemController = require('../controllers/system');

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
router.use('/', express.static('./dist'));

router.use('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../', 'dist', 'index.html'));
});

module.exports = router;
