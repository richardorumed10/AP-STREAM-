const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/places
// Search places by name/category/city
router.get('/', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const category = String(req.query.category || '').trim();
    const city = String(req.query.city || '').trim();

    const values = [];
    const conditions = [];

    if (q) {
      values.push(`%${q}%`);
      conditions.push(`(
        name ILIKE $${values.length}
        OR description ILIKE $${values.length}
        OR address ILIKE $${values.length}
      )`);
    }

    if (category) {
      values.push(category);
      conditions.push(`category ILIKE $${values.length}`);
    }

    if (city) {
      values.push(city);
      conditions.push(`city ILIKE $${values.length}`);
    }

    const where = conditions.length
      ? `WHERE ${conditions.join(' AND ')}`
      : '';

    const result = await db.query(
      `SELECT *
       FROM ap_places
       ${where}
       ORDER BY updated_at DESC
       LIMIT 100`,
      values
    );

    res.json({
      success: true,
      count: result.rows.length,
      places: result.rows
    });
  } catch (error) {
    console.error('AP-STREAM Places search error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not search places'
    });
  }
});

// GET /api/places/nearby?lat=...&lng=...&radius=...
router.get('/nearby', async (req, res) => {
  try {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    const radius = Number(req.query.radius || 10);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return res.status(400).json({
        success: false,
        error: 'Valid lat and lng are required'
      });
    }

    if (!Number.isFinite(radius) || radius <= 0 || radius > 100) {
      return res.status(400).json({
        success: false,
        error: 'Radius must be between 0 and 100 km'
      });
    }

    const result = await db.query(
      `SELECT
         p.*,
         (
           6371 * acos(
             LEAST(1, GREATEST(-1,
               cos(radians($1)) *
               cos(radians(p.latitude)) *
               cos(radians(p.longitude) - radians($2)) +
               sin(radians($1)) *
               sin(radians(p.latitude))
             ))
           )
         ) AS distance_km
       FROM ap_places p
       WHERE p.latitude IS NOT NULL
         AND p.longitude IS NOT NULL
       ORDER BY distance_km
       LIMIT 100`,
      [lat, lng]
    );

    const places = result.rows.filter(
      place => Number(place.distance_km) <= radius
    );

    res.json({
      success: true,
      latitude: lat,
      longitude: lng,
      radius_km: radius,
      count: places.length,
      places
    });
  } catch (error) {
    console.error('AP-STREAM nearby places error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not find nearby places'
    });
  }
});

// GET /api/places/:id
router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid place ID'
      });
    }

    const result = await db.query(
      'SELECT * FROM ap_places WHERE id = $1',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({
        success: false,
        error: 'Place not found'
      });
    }

    res.json({
      success: true,
      place: result.rows[0]
    });
  } catch (error) {
    console.error('AP-STREAM place lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not load place'
    });
  }
});

// POST /api/places
router.post('/', async (req, res) => {
  try {
    const {
      name,
      category,
      description,
      address,
      city,
      country,
      latitude,
      longitude,
      phone,
      website,
      opening_hours,
      photos,
      metadata
    } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Place name is required'
      });
    }

    const result = await db.query(
      `INSERT INTO ap_places
       (
         name, category, description, address, city, country,
         latitude, longitude, phone, website,
         opening_hours, photos, metadata
       )
       VALUES (
         $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
         COALESCE($11::jsonb, '{}'::jsonb),
         COALESCE($12::jsonb, '[]'::jsonb),
         COALESCE($13::jsonb, '{}'::jsonb)
       )
       RETURNING *`,
      [
        String(name).trim(),
        category || null,
        description || null,
        address || null,
        city || null,
        country || 'Uganda',
        Number.isFinite(Number(latitude)) ? Number(latitude) : null,
        Number.isFinite(Number(longitude)) ? Number(longitude) : null,
        phone || null,
        website || null,
        JSON.stringify(opening_hours || {}),
        JSON.stringify(photos || []),
        JSON.stringify(metadata || {})
      ]
    );

    res.status(201).json({
      success: true,
      place: result.rows[0]
    });
  } catch (error) {
    console.error('AP-STREAM place creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not create place'
    });
  }
});

module.exports = router;
