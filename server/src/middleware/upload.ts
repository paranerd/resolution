import * as fs from 'fs';
import * as path from 'path';
import { Request } from 'express';
import multer from 'multer';

/**
 * Return upload directory.
 * Create if not exists.
 *
 * @returns {string} Upload directory
 */
function getUploadDir() {
  const uploadDir =
    process.env.UPLOAD_DIR ?? path.join(process.env.MEDIA_DIR!, 'upload');

  // Create upload directory if not exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  return uploadDir;
}

// Set upload path and filename
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, getUploadDir());
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname);
  },
});

// Only allow images and videos to be uploaded
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: (a: null, b: boolean) => void
) => {
  cb(
    null,
    file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')
  );
};

// Initialize multer
export default multer({ storage, fileFilter });
