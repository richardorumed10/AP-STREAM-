const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

const cloudUploadDir = path.join(__dirname, '..', 'uploads', 'cloud');
fs.mkdirSync(cloudUploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, cloudUploadDir);
  },

  filename: (_req, file, cb) => {
    const safeName = path.basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, '_');

    const uniqueName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 10)}-${safeName}`;

    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 250 * 1024 * 1024
  }
});

// POST /api/cloud/upload
router.post('/cloud/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const visibility = req.body.visibility || 'private';

    const metadata = {
      source: 'AP-STREAM Cloud',
      original_filename: req.file.originalname
    };

    const storagePath = path.relative(
      path.join(__dirname, '..'),
      req.file.path
    );

    const result = await db.query(
      `INSERT INTO ap_cloud_files
       (owner_id, filename, storage_path, mime_type, size_bytes, visibility, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        req.user.userId,
        req.file.originalname,
        storagePath,
        req.file.mimetype || null,
        req.file.size,
        visibility,
        metadata
      ]
    );

    res.status(201).json({
      success: true,
      file: result.rows[0],
      url: `/uploads/cloud/${req.file.filename}`
    });
  } catch (error) {
    console.error('Cloud upload error:', error);

    if (req.file?.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_) {}
    }

    res.status(500).json({
      success: false,
      error: 'Could not store cloud file'
    });
  }
});

module.exports = router;
