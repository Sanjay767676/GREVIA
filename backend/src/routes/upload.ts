import { Router } from 'express';
import multer from 'multer';
import { db } from '../lib/db.js';
import { env } from '../config/env.js';
import { ApiError, asyncHandler } from '../lib/errors.js';
import { requireAuth, user } from '../lib/auth.js';

const router = Router();

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

// Keep files in memory and stream them to Supabase Storage.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      cb(new ApiError(422, 'Only image files can be uploaded'));
      return;
    }
    cb(null, true);
  },
});

const uploadSingle = upload.single('file');

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/heic': 'heic',
  'image/heif': 'heif',
};

router.use(requireAuth);

// POST /api/upload - multipart file upload to Supabase Storage (service role).
// Returns the stored object path. Used for complaint images + resolution proof.
router.post(
  '/',
  (req, res, next) => {
    uploadSingle(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          next(new ApiError(413, 'Image is too large (max 8 MB)'));
          return;
        }
        next(new ApiError(422, err.message));
        return;
      }
      next(err);
    });
  },
  asyncHandler(async (req, res) => {
    const me = user(req);
    const file = req.file;
    if (!file) throw new ApiError(422, 'No file provided');

    const prefix = String(req.body?.prefix ?? 'upload').replace(/[^a-zA-Z0-9_-]/g, '-');
    const rawExt = (file.originalname.split('.').pop() ?? '').toLowerCase();
    const ext = EXT_BY_MIME[file.mimetype] ?? (/^[a-z0-9]{1,5}$/.test(rawExt) ? rawExt : 'bin');
    const path = `${me.sub}/${prefix}-${Date.now()}.${ext}`;

    const { error } = await db()
      .storage.from(env.storageBucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype || 'application/octet-stream',
        upsert: false,
      });
    if (error) throw new ApiError(500, `Upload failed: ${error.message}`);

    res.json({ path });
  }),
);

export default router;
