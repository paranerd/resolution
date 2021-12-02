const multer = require('multer');
const fs = require('fs');

const uploadDir = process.env.UPLOAD_DIR;

// Create upload directory if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set upload path and filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Only allow images and videos to be uploaded
const fileFilter = (req, file, cb) => {
  cb(
    null,
    file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')
  );
};

// Initialize multer
const upload = multer({ storage, fileFilter });

module.exports = upload;
