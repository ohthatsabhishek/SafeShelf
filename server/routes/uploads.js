const express = require('express');
const path = require('path');
const fs = require('fs/promises');
const crypto = require('crypto');
const multer = require('multer');
const auth = require('../middleware/auth');
const router = express.Router();
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1, fields: 10, parts: 12 },
  fileFilter: (req, file, cb) => ALLOWED_MIME.has(file.mimetype)
    ? cb(null, true)
    : cb(Object.assign(new Error('Only JPEG, PNG or WebP images are allowed.'), { status: 400 }))
});
function detectImage(buffer) {
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return { ext: '.png', mime: 'image/png' };
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return { ext: '.jpg', mime: 'image/jpeg' };
  if (buffer.length >= 12 && buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') return { ext: '.webp', mime: 'image/webp' };
  return null;
}
router.post('/image', auth, (req, res, next) => {
  upload.single('image')(req, res, async err => {
    if (err) return next(err);
    try {
      if (!req.file) return res.status(400).json({ error: 'Choose an image file.' });
      const detected = detectImage(req.file.buffer);
      if (!detected || detected.mime !== req.file.mimetype) return res.status(400).json({ error: 'The uploaded file content does not match a supported image type.' });
      await fs.mkdir(UPLOAD_DIR, { recursive: true });
      const filename = `${crypto.randomUUID()}${detected.ext}`;
      await fs.writeFile(path.join(UPLOAD_DIR, filename), req.file.buffer, { flag: 'wx', mode: 0o640 });
      res.status(201).json({ url: `/uploads/${filename}`, filename });
    } catch (e) { next(e); }
  });
});
module.exports = router;
