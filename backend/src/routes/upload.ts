import { Router } from 'express';
import multer from 'multer';
import { db } from '../lib/db.js';
import { env } from '../config/env.js';
import { ApiError, asyncHandler } from '../lib/errors.js';
import { requireAuth, user } from '../lib/auth.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024 },
});

router.use(requireAuth);

// POST /api/upload — multipart file upload to Supabase Storage (service role).
// Returns the stored object path. Used for complaint images + resolution proof.
router.post(
  '/',
  upload.single('file'),
  asyncHandler(async (req, res) => {
    const me = user(req);
    const file = req.file;
    if (!file) throw new ApiError(422, 'No file provided');

    const prefix = String(req.body?.prefix ?? 'upload').replace(/[^a-zA-Z0-9_-]/g, '-');
    const ext = (file.originalname.split('.').pop() || 'bin').toLowerCase();
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
