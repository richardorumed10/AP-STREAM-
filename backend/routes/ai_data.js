const express = require('express');
const router = express.Router();
const db = require('../db');

/*
 * AP-STREAM AI DATA — Phase 1
 * Read-only analytics/data assistant.
 *
 * IMPORTANT:
 * This module never executes SQL supplied by the user or AI.
 * All database queries below are fixed, parameterized queries.
 */

const ALLOWED_TABLES = [
  'users',
  'artists',
  'songs',
  'videos',
  'short_videos',
  'analytics'
];

function getUserId(req) {
  const value =
    req.user?.id ??
    req.user?.userId ??
    req.auth?.userId ??
    req.auth?.id ??
    req.headers['x-user-id'];

  if (!value) return null;

  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

async function logQuery({ conversationId, userId, intent, queryType, success }) {
  try {
    await db.query(
      `INSERT INTO ai_data_query_logs
       (conversation_id, user_id, intent, query_type, success)
       VALUES ($1, $2, $3, $4, $5)`,
      [conversationId || null, userId || null, intent || null, queryType || null, success]
    );
  } catch (err) {
    console.error('AI DATA query log error:', err.message);
  }
}

async function getStats() {
  const result = await db.query(`
    SELECT
      (SELECT COUNT(*) FROM users) AS users,
      (SELECT COUNT(*) FROM artists) AS artists,
      (SELECT COUNT(*) FROM songs) AS songs,
      (SELECT COUNT(*) FROM videos) AS videos,
      (SELECT COUNT(*) FROM short_videos) AS short_videos,
      (SELECT COUNT(*) FROM analytics) AS analytics_events
  `);

  return result.rows[0];
}

async function getRecentMedia(limit = 10) {
  const result = await db.query(`
    SELECT *
    FROM (
      SELECT
        'video' AS media_type,
        id,
        title,
        created_at
      FROM videos

      UNION ALL

      SELECT
        'song' AS media_type,
        id,
        title,
        created_at
      FROM songs

      UNION ALL

      SELECT
        'short' AS media_type,
        id,
        caption AS title,
        created_at
      FROM short_videos
    ) media
    ORDER BY created_at DESC
    LIMIT $1
  `, [limit]);

  return result.rows;
}

async function getTopShorts(limit = 10) {
  const result = await db.query(`
    SELECT
      id,
      user_id,
      caption,
      likes_count,
      views_count,
      created_at
    FROM short_videos
    ORDER BY views_count DESC NULLS LAST
    LIMIT $1
  `, [limit]);

  return result.rows;
}

async function getTopAnalytics(limit = 20) {
  const result = await db.query(`
    SELECT
      event_type,
      COUNT(*)::integer AS event_count
    FROM analytics
    GROUP BY event_type
    ORDER BY event_count DESC
    LIMIT $1
  `, [limit]);

  return result.rows;
}

async function getCountsByDay(days = 7) {
  const result = await db.query(`
    SELECT
      created_at::date AS day,
      COUNT(*)::integer AS events
    FROM analytics
    WHERE created_at >= CURRENT_DATE - ($1::integer - 1)
    GROUP BY created_at::date
    ORDER BY day ASC
  `, [days]);

  return result.rows;
}

function classifyQuestion(message) {
  const text = String(message || '').toLowerCase();

  if (
    text.includes('how many') ||
    text.includes('count') ||
    text.includes('number of') ||
    text.includes('total') ||
    text.includes('stats') ||
    text.includes('statistics')
  ) {
    return 'stats';
  }

  if (
    text.includes('recent') ||
    text.includes('latest') ||
    text.includes('newest')
  ) {
    return 'recent_media';
  }

  if (
    text.includes('short') &&
    (
      text.includes('top') ||
      text.includes('popular') ||
      text.includes('most viewed') ||
      text.includes('most liked')
    )
  ) {
    return 'top_shorts';
  }

  if (
    text.includes('analytics') ||
    text.includes('events') ||
    text.includes('event type')
  ) {
    return 'analytics';
  }

  if (
    text.includes('daily') ||
    text.includes('per day') ||
    text.includes('by day')
  ) {
    return 'daily_analytics';
  }

  return 'stats';
}

/*
 * GET /api/ai/data/schema
 */
router.get('/schema', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        table_name,
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = ANY($1::text[])
      ORDER BY table_name, ordinal_position
    `, [ALLOWED_TABLES]);

    const schema = {};

    for (const row of result.rows) {
      if (!schema[row.table_name]) {
        schema[row.table_name] = [];
      }

      schema[row.table_name].push({
        name: row.column_name,
        type: row.data_type
      });
    }

    res.json({
      success: true,
      tables: schema
    });
  } catch (err) {
    console.error('AI DATA schema error:', err);
    res.status(500).json({
      success: false,
      error: 'Unable to read AP-STREAM data schema'
    });
  }
});

/*
 * GET /api/ai/data/tables
 */
router.get('/tables', (req, res) => {
  res.json({
    success: true,
    tables: ALLOWED_TABLES
  });
});

/*
 * POST /api/ai/data/conversations
 */
router.post('/conversations', async (req, res) => {
  try {
    const userId = getUserId(req);
    const title = String(req.body?.title || 'New AI Data Chat').slice(0, 200);

    const result = await db.query(
      `INSERT INTO ai_data_conversations (user_id, title)
       VALUES ($1, $2)
       RETURNING id, user_id, title, created_at, updated_at`,
      [userId, title]
    );

    res.status(201).json({
      success: true,
      conversation: result.rows[0]
    });
  } catch (err) {
    console.error('AI DATA conversation create error:', err);
    res.status(500).json({
      success: false,
      error: 'Unable to create AI Data conversation'
    });
  }
});

/*
 * GET /api/ai/data/conversations
 */
router.get('/conversations', async (req, res) => {
  try {
    const userId = getUserId(req);

    const result = await db.query(
      `SELECT id, user_id, title, created_at, updated_at
       FROM ai_data_conversations
       WHERE ($1::integer IS NULL OR user_id = $1)
       ORDER BY updated_at DESC
       LIMIT 100`,
      [userId]
    );

    res.json({
      success: true,
      conversations: result.rows
    });
  } catch (err) {
    console.error('AI DATA conversations error:', err);
    res.status(500).json({
      success: false,
      error: 'Unable to load AI Data conversations'
    });
  }
});

/*
 * GET /api/ai/data/conversations/:id
 */
router.get('/conversations/:id', async (req, res) => {
  try {
    const conversationId = Number(req.params.id);

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conversation id'
      });
    }

    const conversation = await db.query(
      `SELECT id, user_id, title, created_at, updated_at
       FROM ai_data_conversations
       WHERE id = $1`,
      [conversationId]
    );

    if (!conversation.rows.length) {
      return res.status(404).json({
        success: false,
        error: 'Conversation not found'
      });
    }

    const messages = await db.query(
      `SELECT id, role, content, data_json, created_at
       FROM ai_data_messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    res.json({
      success: true,
      conversation: conversation.rows[0],
      messages: messages.rows
    });
  } catch (err) {
    console.error('AI DATA conversation read error:', err);
    res.status(500).json({
      success: false,
      error: 'Unable to load conversation'
    });
  }
});

/*
 * DELETE /api/ai/data/conversations/:id
 */
router.delete('/conversations/:id', async (req, res) => {
  try {
    const conversationId = Number(req.params.id);

    if (!Number.isInteger(conversationId) || conversationId <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid conversation id'
      });
    }

    await db.query(
      `DELETE FROM ai_data_conversations WHERE id = $1`,
      [conversationId]
    );

    res.json({
      success: true
    });
  } catch (err) {
    console.error('AI DATA conversation delete error:', err);
    res.status(500).json({
      success: false,
      error: 'Unable to delete conversation'
    });
  }
});

/*
 * POST /api/ai/data/query
 *
 * Safe structured data queries.
 */
router.post('/query', async (req, res) => {
  const userId = getUserId(req);
  const intent = String(req.body?.intent || '').trim();

  try {
    let data;
    let queryType;

    switch (intent) {
      case 'stats':
        data = await getStats();
        queryType = 'platform_stats';
        break;

      case 'recent_media':
        data = await getRecentMedia(20);
        queryType = 'recent_media';
        break;

      case 'top_shorts':
        data = await getTopShorts(20);
        queryType = 'top_shorts';
        break;

      case 'analytics':
        data = await getTopAnalytics(20);
        queryType = 'analytics_events';
        break;

      case 'daily_analytics':
        data = await getCountsByDay(30);
        queryType = 'daily_analytics';
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Unsupported data query'
        });
    }

    await logQuery({
      userId,
      intent,
      queryType,
      success: true
    });

    res.json({
      success: true,
      intent,
      data
    });
  } catch (err) {
    await logQuery({
      userId,
      intent,
      success: false
    });

    console.error('AI DATA query error:', err);

    res.status(500).json({
      success: false,
      error: 'Data query failed'
    });
  }
});

/*
 * POST /api/ai/data/chat
 *
 * Converts a natural-language question into one of the
 * fixed safe data intents above.
 */
router.post('/chat', async (req, res) => {
  const userId = getUserId(req);
  const message = String(req.body?.message || '').trim();
  let conversationId = req.body?.conversationId
    ? Number(req.body.conversationId)
    : null;

  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  if (message.length > 4000) {
    return res.status(400).json({
      success: false,
      error: 'Message is too long'
    });
  }

  try {
    if (!conversationId) {
      const conversation = await db.query(
        `INSERT INTO ai_data_conversations (user_id, title)
         VALUES ($1, $2)
         RETURNING id`,
        [userId, message.slice(0, 80)]
      );

      conversationId = conversation.rows[0].id;
    }

    await db.query(
      `INSERT INTO ai_data_messages
       (conversation_id, role, content)
       VALUES ($1, 'user', $2)`,
      [conversationId, message]
    );

    const intent = classifyQuestion(message);

    let data;
    let queryType;

    switch (intent) {
      case 'recent_media':
        data = await getRecentMedia(20);
        queryType = 'recent_media';
        break;

      case 'top_shorts':
        data = await getTopShorts(20);
        queryType = 'top_shorts';
        break;

      case 'analytics':
        data = await getTopAnalytics(20);
        queryType = 'analytics_events';
        break;

      case 'daily_analytics':
        data = await getCountsByDay(30);
        queryType = 'daily_analytics';
        break;

      default:
        data = await getStats();
        queryType = 'platform_stats';
    }

    const aiPrompt = [
      'You are AP-STREAM AI Data, the read-only data assistant for AP-STREAM.',
      'Answer the user using ONLY the supplied database result.',
      'Do not invent numbers or facts.',
      'Be concise and clear.',
      'If the data does not answer the question, say that the available data is insufficient.',
      '',
      `User question: ${message}`,
      '',
      `Detected data type: ${queryType}`,
      '',
      `Database result: ${JSON.stringify(data)}`
    ].join('\n');

    let answer = '';

    try {
      const aiUrl =
        String(process.env.APSTREAM_LOCAL_AI_URL || '').trim() ||
        'http://127.0.0.1:8081/v1/chat/completions';

      const aiResponse = await fetch(aiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content:
                'You are AP-STREAM AI, an independent local AI assistant. You are answering read-only AP-STREAM Data questions.'
            },
            {
              role: 'user',
              content: aiPrompt
            }
          ],
          temperature: 0.2,
          max_tokens: 256
        })
      });

      const aiData = await aiResponse.json();

      if (aiResponse.ok) {
        answer =
          aiData?.choices?.[0]?.message?.content?.trim() || '';
      }
    } catch (aiError) {
      console.error('AI DATA local AI error:', aiError.message);
    }

    if (!answer) {
      answer = `AP-STREAM Data result for: ${message}`;
    }

    await db.query(
      `INSERT INTO ai_data_messages
       (conversation_id, role, content, data_json)
       VALUES ($1, 'assistant', $2, $3)`,
      [
        conversationId,
        answer,
        JSON.stringify(data)
      ]
    );

    await db.query(
      `UPDATE ai_data_conversations
       SET updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [conversationId]
    );

    await logQuery({
      conversationId,
      userId,
      intent,
      queryType,
      success: true
    });

    res.json({
      success: true,
      conversationId,
      intent,
      queryType,
      answer,
      data
    });
  } catch (err) {
    await logQuery({
      conversationId,
      userId,
      intent: 'chat',
      queryType: 'chat',
      success: false
    });

    console.error('AI DATA chat error:', err);

    res.status(500).json({
      success: false,
      error: 'AI Data chat failed'
    });
  }
});

/*
 * GET /api/ai/data/status
 */
router.get('/status', async (req, res) => {
  try {
    await db.query('SELECT 1');

    res.json({
      success: true,
      service: 'AP-STREAM AI Data',
      status: 'online',
      mode: 'read-only',
      tables: ALLOWED_TABLES
    });
  } catch (err) {
    res.status(503).json({
      success: false,
      service: 'AP-STREAM AI Data',
      status: 'offline'
    });
  }
});

module.exports = router;
