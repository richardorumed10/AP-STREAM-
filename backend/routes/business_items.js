const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/businesses/:businessId/items
router.get('/businesses/:businessId/items', async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);

    if (!Number.isInteger(businessId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business ID'
      });
    }

    const result = await db.query(
      `SELECT *
       FROM ap_business_items
       WHERE business_id = $1
         AND COALESCE(active, true) = true
       ORDER BY created_at DESC, id DESC
       LIMIT 200`,
      [businessId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      items: result.rows
    });
  } catch (error) {
    console.error('GET business items error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not load business items'
    });
  }
});

// GET /api/businesses/:businessId/items/:itemId
router.get('/businesses/:businessId/items/:itemId', async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const itemId = Number(req.params.itemId);

    if (!Number.isInteger(businessId) || !Number.isInteger(itemId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business or item ID'
      });
    }

    const result = await db.query(
      `SELECT *
       FROM ap_business_items
       WHERE id = $1
         AND business_id = $2
         AND COALESCE(active, true) = true
       LIMIT 1`,
      [itemId, businessId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found'
      });
    }

    res.json({
      success: true,
      item: result.rows[0]
    });
  } catch (error) {
    console.error('GET business item error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not load business item'
    });
  }
});

// POST /api/businesses/:businessId/items
router.post('/businesses/:businessId/items', async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const {
      name,
      description = null,
      price = null,
      currency = 'UGX',
      image_url = null,
      item_type = 'product',
      active = true
    } = req.body || {};

    if (!Number.isInteger(businessId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business ID'
      });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        error: 'Item name is required'
      });
    }

    const business = await db.query(
      `SELECT id
       FROM ap_businesses
       WHERE id = $1
         AND COALESCE(status, 'active') = 'active'
       LIMIT 1`,
      [businessId]
    );

    if (business.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    const result = await db.query(
      `INSERT INTO ap_business_items
       (business_id, name, description, price, currency, image_url, item_type, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        businessId,
        String(name).trim(),
        description,
        price,
        currency,
        image_url,
        item_type,
        active
      ]
    );

    res.status(201).json({
      success: true,
      item: result.rows[0]
    });
  } catch (error) {
    console.error('POST business item error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not create business item'
    });
  }
});

module.exports = router;
