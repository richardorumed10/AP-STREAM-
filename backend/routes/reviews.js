const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/businesses/:businessId/reviews
router.get('/businesses/:businessId/reviews', async (req, res) => {
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
       FROM ap_business_reviews
       WHERE business_id = $1
         AND COALESCE(status, 'active') = 'active'
       ORDER BY created_at DESC
       LIMIT 100`,
      [businessId]
    );

    res.json({
      success: true,
      count: result.rows.length,
      reviews: result.rows
    });
  } catch (error) {
    console.error('AP-STREAM review list error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not load reviews'
    });
  }
});

// POST /api/businesses/:businessId/reviews
router.post('/businesses/:businessId/reviews', async (req, res) => {
  try {
    const businessId = Number(req.params.businessId);
    const reviewerId = req.body.reviewer_id ?? null;
    const rating = Number(req.body.rating);
    const reviewText = req.body.review_text ?? null;

    if (!Number.isInteger(businessId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid business ID'
      });
    }

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating must be an integer from 1 to 5'
      });
    }

    const business = await db.query(
      `SELECT id FROM ap_businesses
       WHERE id = $1 AND COALESCE(status, 'active') = 'active'`,
      [businessId]
    );

    if (!business.rows.length) {
      return res.status(404).json({
        success: false,
        error: 'Business not found'
      });
    }

    const result = await db.query(
      `INSERT INTO ap_business_reviews
       (business_id, reviewer_id, rating, review_text, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING *`,
      [businessId, reviewerId, rating, reviewText]
    );

    res.status(201).json({
      success: true,
      review: result.rows[0]
    });
  } catch (error) {
    console.error('AP-STREAM review creation error:', error);
    res.status(500).json({
      success: false,
      error: 'Could not create review'
    });
  }
});

module.exports = router;
