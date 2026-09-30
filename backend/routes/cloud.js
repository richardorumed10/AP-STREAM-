const express = require('express');
const fs = require('fs');
const path = require('path');
const db = require('../db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

const getUserId = (req) => Number(req.user?.userId);

// GET /api/cloud/files
// Public files are visible to everyone.
// Private files are visible only to their owner.
router.get('/cloud/files', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);

    const result = await db.query(
      `SELECT *
       FROM ap_cloud_files
       WHERE visibility = 'public'
          OR owner_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      files: result.rows
    });
  } catch (error) {
    console.error('Cloud files error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not load cloud files'
    });
  }
});

// GET /api/cloud/files/:id
router.get('/cloud/files/:id', authenticateToken, async (req, res) => {
  try {
    const fileId = Number(req.params.id);
    const userId = getUserId(req);

    if (!Number.isInteger(fileId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file ID'
      });
    }

    const result = await db.query(
      `SELECT *
       FROM ap_cloud_files
       WHERE id = $1
         AND (visibility = 'public' OR owner_id = $2)
       LIMIT 1`,
      [fileId, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    res.json({
      success: true,
      file: result.rows[0]
    });
  } catch (error) {
    console.error('Cloud file error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not load cloud file'
    });
  }
});

// DELETE /api/cloud/files/:id
// Only the owner can delete their Cloud file.
router.delete('/cloud/files/:id', authenticateToken, async (req, res) => {
  try {
    const fileId = Number(req.params.id);
    const userId = getUserId(req);

    if (!Number.isInteger(fileId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid file ID'
      });
    }

    const result = await db.query(
      `SELECT *
       FROM ap_cloud_files
       WHERE id = $1
         AND owner_id = $2
       LIMIT 1`,
      [fileId, userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: 'File not found or not owned by you'
      });
    }

    const file = result.rows[0];

    const cloudDir = path.resolve(
      __dirname,
      '..',
      'uploads',
      'cloud'
    );

    const physicalPath = path.resolve(
      __dirname,
      '..',
      file.storage_path
    );

    let physicalFileDeleted = false;

    // Safety check: only delete files physically inside uploads/cloud.
    if (
      physicalPath.startsWith(cloudDir + path.sep) &&
      fs.existsSync(physicalPath)
    ) {
      fs.unlinkSync(physicalPath);
      physicalFileDeleted = true;
    }

    await db.query(
      `DELETE FROM ap_cloud_files
       WHERE id = $1
         AND owner_id = $2`,
      [fileId, userId]
    );

    res.json({
      success: true,
      deleted_id: String(fileId),
      physical_file_deleted: physicalFileDeleted
    });
  } catch (error) {
    console.error('Cloud delete error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not delete cloud file'
    });
  }
});

// POST /api/cloud/files
// Metadata-only Cloud record.
router.post('/cloud/files', authenticateToken, async (req, res) => {
  try {
    const userId = getUserId(req);

    const {
      filename,
      storage_path,
      mime_type,
      size_bytes,
      visibility = 'private',
      metadata = {}
    } = req.body;

    if (!filename || !storage_path) {
      return res.status(400).json({
        success: false,
        error: 'filename and storage_path are required'
      });
    }

    const result = await db.query(
      `INSERT INTO ap_cloud_files
       (owner_id, filename, storage_path, mime_type, size_bytes, visibility, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        userId,
        filename,
        storage_path,
        mime_type || null,
        size_bytes || null,
        visibility,
        metadata
      ]
    );

    res.status(201).json({
      success: true,
      file: result.rows[0]
    });
  } catch (error) {
    console.error('Cloud metadata error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not create cloud file'
    });
  }
});


// AP-STREAM Satellite Telemetry
router.get('/cloud/satellite', async (req, res) => {
  try {
    const response = await fetch('http://127.0.0.1:8787/telemetry');

    if (!response.ok) {
      return res.status(502).json({
        service: 'AP-STREAM Satellite',
        status: 'offline',
        error: `Ground Station returned HTTP ${response.status}`
      });
    }

    const telemetry = await response.json();

    res.json({
      service: 'AP-STREAM Satellite',
      status: 'online',
      groundStation: {
        status: 'online',
        endpoint: 'http://127.0.0.1:8787/telemetry'
      },
      telemetry
    });
  } catch (error) {
    console.error('Satellite telemetry error:', error.message);

    res.status(503).json({
      service: 'AP-STREAM Satellite',
      status: 'offline',
      groundStation: {
        status: 'offline'
      },
      error: 'Ground Station telemetry unavailable'
    });
  }
});

module.exports = router;
