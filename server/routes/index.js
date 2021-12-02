const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const cors = require('cors');

const router = express.Router();

// Middleware
const auth = require('../middleware/auth');

// Controllers
const itemController = require('../controllers/item');
const userController = require('../controllers/user');
const systemController = require('../controllers/system');

// Include cookie parser
router.use(cookieParser());

// Set CORS headers
if (!process.env.PRODUCTION) {
  router.use(cors({ exposedHeaders: 'Content-Disposition' }));
}

// Item routes
router.get(
  '/api/item/download',
  auth.isAuthenticated(),
  itemController.download
);
router.post('/api/item/scan', auth.isAuthenticated(), itemController.scan);
router.get('/api/item/:id', auth.isAuthenticated(), itemController.getOne);
router.delete('/api/item', auth.isAuthenticated(), itemController.remove);
router.get('/api/item', auth.isAuthenticated(), itemController.getAll);

// User routes
router.post('/api/user/setup', userController.setup);
router.post('/api/user/login', userController.login);
router.post(
  '/api/user/refresh',
  auth.isAuthenticated(),
  userController.refresh
);
router.post('/api/user/logout', auth.isAuthenticated(), userController.logout);

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
