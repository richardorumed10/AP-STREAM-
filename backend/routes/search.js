const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: Number(process.env.PGPORT || 5432),
  database: process.env.PGDATABASE || 'apstream',
  user: process.env.PGUSER || 'u0_a221',
  password: process.env.PGPASSWORD || undefined
});

/*
 * GET /api/search?q=example
 *
 * AP-STREAM Web Search API
 */
router.get('/search', async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();

    if (!q) {
      return res.status(400).json({
        error: 'Search query is required',
        results: []
      });
    }

    const page = Math.max(
      parseInt(req.query.page || '1', 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit || '10', 10) || 10,
        1
      ),
      50
    );

    const offset = (page - 1) * limit;

    const result = await pool.query(
      `
      SELECT
        id,
        url,
        title,
        description,
        content,
        status_code,
        last_crawled_at,
        ts_rank(
          search_vector,
          websearch_to_tsquery('simple', $1)
        ) AS relevance
      FROM ap_search_pages
      WHERE
        search_vector @@ websearch_to_tsquery('simple', $1)
        AND status_code >= 200
        AND status_code < 400
      ORDER BY
        relevance DESC,
        last_crawled_at DESC NULLS LAST
      LIMIT $2
      OFFSET $3
      `,
      [q, limit, offset]
    );

    const countResult = await pool.query(
      `
      SELECT COUNT(*)::integer AS total
      FROM ap_search_pages
      WHERE
        search_vector @@ websearch_to_tsquery('simple', $1)
        AND status_code >= 200
        AND status_code < 400
      `,
      [q]
    );

    const total = countResult.rows[0].total;

    res.json({
      engine: 'AP-STREAM Search',
      query: q,
      page,
      limit,
      total,
      results: result.rows.map(row => ({
        id: row.id,
        title: row.title || row.url,
        url: row.url,
        description:
          row.description ||
          String(row.content || '').slice(0, 300),
        relevance: Number(row.relevance || 0),
        crawled_at: row.last_crawled_at
      }))
    });

  } catch (error) {
    console.error('[AP-STREAM SEARCH]', error);

    res.status(500).json({
      error: 'AP-STREAM Search failed',
      results: []
    });
  }
});

/*
 * GET /api/search/stats
 */
router.get('/search/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM ap_search_sites)::integer AS sites,
        (SELECT COUNT(*) FROM ap_search_pages)::integer AS pages,
        (SELECT COUNT(*) FROM ap_search_links)::integer AS links,
        (SELECT COUNT(*)
         FROM ap_search_crawl_jobs
         WHERE status = 'queued')::integer AS queued_jobs
    `);

    res.json({
      engine: 'AP-STREAM Search',
      status: 'online',
      stats: result.rows[0]
    });

  } catch (error) {
    console.error('[AP-STREAM SEARCH STATS]', error);

    res.status(500).json({
      error: 'Unable to read search statistics'
    });
  }
});

module.exports = router;
