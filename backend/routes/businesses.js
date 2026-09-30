const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/businesses
// Search businesses with optional q/category/status
router.get('/', async (req, res) => {
  try {
    const { q, category, status } = req.query;

    const conditions = [];
    const values = [];
    let n = 1;

    if (q) {
      conditions.push(`(
        b.name ILIKE $${n}
        OR b.description ILIKE $${n}
        OR b.category ILIKE $${n}
      )`);
      values.push(`%${q}%`);
      n++;
    }

    if (category) {
      conditions.push(`b.category ILIKE $${n}`);
      values.push(category);
      n++;
    }

    if (status) {
      conditions.push(`b.status = $${n}`);
      values.push(status);
      n++;
    } else {
      conditions.push(`b.status = 'active'`);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await db.query(
      `SELECT
         b.*,
         p.name AS place_name,
         p.address AS place_address,
         p.city AS place_city,
         p.country AS place_country,
         p.latitude,
         p.longitude
       FROM ap_businesses b
       LEFT JOIN ap_places p ON p.id = b.place_id
       ${where}
       ORDER BY b.created_at DESC
       LIMIT 100`,
      values
    );

    res.json({
      success: true,
      count: result.rows.length,
      businesses: result.rows
    });
  } catch (error) {
    console.error('AP-STREAM business list error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not load businesses'
    });
  }
});

// GET /api/businesses/:id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business ID'
      });
    }

    const result = await db.query(
      `SELECT
         b.*,
         p.name AS place_name,
         p.address AS place_address,
         p.city AS place_city,
         p.country AS place_country,
         p.latitude,
         p.longitude
       FROM ap_businesses b
       LEFT JOIN ap_places p ON p.id = b.place_id
       WHERE b.id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    res.json({
      success: true,
      business: result.rows[0]
    });
  } catch (error) {
    console.error('AP-STREAM business lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not load business'
    });
  }
});

// POST /api/businesses
router.post('/', async (req, res) => {
  try {
    const {
      place_id,
      owner_id,
      name,
      category,
      description,
      phone,
      email,
      website
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Business name is required'
      });
    }

    if (place_id !== undefined && place_id !== null) {
      const place = await db.query(
        'SELECT id FROM ap_places WHERE id = $1',
        [Number(place_id)]
      );

      if (!place.rows.length) {
        return res.status(400).json({
          success: false,
          error: 'Place not found'
        });
      }
    }

    const result = await db.query(
      `INSERT INTO ap_businesses
       (place_id, owner_id, name, category, description,
        phone, email, website, verification_status, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'unverified', 'active')
       RETURNING *`,
      [
        place_id ?? null,
        owner_id ?? null,
        String(name).trim(),
        category ?? null,
        description ?? null,
        phone ?? null,
        email ?? null,
        website ?? null
      ]
    );

    res.status(201).json({
      success: true,
      business: result.rows[0]
    });
  } catch (error) {
    console.error('AP-STREAM business creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not create business'
    });
  }
});

module.exports = router;
