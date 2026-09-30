const express = require('express');
const router = express.Router();
const db = require('../db');
const authenticateToken = require('../middleware/auth');

router.use(authenticateToken);

function getUserId(req) {
  return Number(req.user?.id || req.user?.userId || req.user?.user_id);
}

router.get('/inbox', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Invalid user identity' });
    }

    const result = await db.query(
      `SELECT m.id, m.sender_id,
              u.username AS sender_username,
              u.email AS sender_email,
              m.subject, m.body, m.is_read,
              m.is_starred, m.created_at
       FROM mail_messages m
       LEFT JOIN users u ON u.id = m.sender_id
       WHERE m.recipient_id = $1
         AND m.folder = 'inbox'
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [userId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Mail inbox error:', error);
    res.status(500).json({ message: 'Failed to load inbox' });
  }
});

router.get('/sent', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Invalid user identity' });
    }

    const result = await db.query(
      `SELECT m.id, m.recipient_id,
              u.username AS recipient_username,
              u.email AS recipient_email,
              m.subject, m.body, m.is_read,
              m.is_starred, m.created_at
       FROM mail_messages m
       LEFT JOIN users u ON u.id = m.recipient_id
       WHERE m.sender_id = $1
         AND m.folder = 'sent'
       ORDER BY m.created_at DESC
       LIMIT 100`,
      [userId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Mail sent error:', error);
    res.status(500).json({ message: 'Failed to load sent mail' });
  }
});

router.get('/drafts', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Invalid user identity' });
    }

    const result = await db.query(
      `SELECT id, recipient_id, subject, body,
              is_starred, created_at, updated_at
       FROM mail_messages
       WHERE sender_id = $1
         AND folder = 'draft'
       ORDER BY updated_at DESC
       LIMIT 100`,
      [userId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Mail drafts error:', error);
    res.status(500).json({ message: 'Failed to load drafts' });
  }
});

router.get('/trash', async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Invalid user identity' });
    }

    const result = await db.query(
      `SELECT id, sender_id, recipient_id, subject, body,
              is_read, is_starred, created_at
       FROM mail_messages
       WHERE (sender_id = $1 OR recipient_id = $1)
         AND folder = 'trash'
       ORDER BY created_at DESC
       LIMIT 100`,
      [userId]
    );

    res.json({ messages: result.rows });
  } catch (error) {
    console.error('Mail trash error:', error);
    res.status(500).json({ message: 'Failed to load trash' });
  }
});

router.post('/send', async (req, res) => {
  const client = await db.connect();

  try {
    const senderId = getUserId(req);

    if (!Number.isInteger(senderId) || senderId <= 0) {
      return res.status(401).json({ message: 'Invalid user identity' });
    }

    const recipient = String(req.body?.recipient || '').trim();
    const subject = String(req.body?.subject || '').trim();
    const body = String(req.body?.body || '');

    if (!recipient) {
      return res.status(400).json({ message: 'Recipient is required' });
    }

    if (!body.trim()) {
      return res.status(400).json({ message: 'Message body is required' });
    }

    const recipientResult = await client.query(
      `SELECT id
       FROM users
       WHERE LOWER(username) = LOWER($1)
          OR LOWER(email) = LOWER($1)
       LIMIT 1`,
      [recipient]
    );

    if (recipientResult.rows.length === 0) {
      return res.status(404).json({
        message: 'AP-STREAM user or email address not found'
      });
    }

    const recipientId = recipientResult.rows[0].id;

    await client.query('BEGIN');

    const sentResult = await client.query(
      `INSERT INTO mail_messages
        (sender_id, recipient_id, subject, body, folder)
       VALUES ($1, $2, $3, $4, 'sent')
       RETURNING id, created_at`,
      [senderId, recipientId, subject, body]
    );

    await client.query(
      `INSERT INTO mail_messages
        (sender_id, recipient_id, subject, body, folder)
       VALUES ($1, $2, $3, $4, 'inbox')`,
      [senderId, recipientId, subject, body]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Mail sent successfully',
      mail: sentResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Mail send error:', error);
    res.status(500).json({ message: 'Failed to send mail' });
  } finally {
    client.release();
  }
});

router.post('/draft', async (req, res) => {
  try {
    const senderId = getUserId(req);

    if (!Number.isInteger(senderId) || senderId <= 0) {
      return res.status(401).json({ message: 'Invalid user identity' });
    }

    const recipient = String(req.body?.recipient || '').trim();
    const subject = String(req.body?.subject || '').trim();
    const body = String(req.body?.body || '');

    let recipientId = null;

    if (recipient) {
      const result = await db.query(
        `SELECT id
         FROM users
         WHERE LOWER(username) = LOWER($1)
            OR LOWER(email) = LOWER($1)
         LIMIT 1`,
        [recipient]
      );

      if (result.rows.length > 0) {
        recipientId = result.rows[0].id;
      }
    }

    const result = await db.query(
      `INSERT INTO mail_messages
        (sender_id, recipient_id, subject, body, folder)
       VALUES ($1, $2, $3, $4, 'draft')
       RETURNING id, recipient_id, subject, body,
                 created_at, updated_at`,
      [senderId, recipientId, subject, body]
    );

    res.status(201).json({
      message: 'Draft saved',
      mail: result.rows[0]
    });
  } catch (error) {
    console.error('Mail draft error:', error);
    res.status(500).json({ message: 'Failed to save draft' });
  }
});

router.patch('/:id/read', async (req, res) => {
  try {
    const userId = getUserId(req);
    const mailId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Invalid user identity' });
    }

    if (!Number.isInteger(mailId) || mailId <= 0) {
      return res.status(400).json({ message: 'Invalid mail ID' });
    }

    const result = await db.query(
      `UPDATE mail_messages
       SET is_read = TRUE, updated_at = NOW()
       WHERE id = $1 AND recipient_id = $2
       RETURNING id, is_read`,
      [mailId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Mail not found' });
    }

    res.json({
      message: 'Mail marked as read',
      mail: result.rows[0]
    });
  } catch (error) {
    console.error('Mail read error:', error);
    res.status(500).json({ message: 'Failed to update mail' });
  }
});

router.patch('/:id/star', async (req, res) => {
  try {
    const userId = getUserId(req);
    const mailId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Invalid user identity' });
    }

    const result = await db.query(
      `UPDATE mail_messages
       SET is_starred = NOT is_starred, updated_at = NOW()
       WHERE id = $1
         AND (sender_id = $2 OR recipient_id = $2)
       RETURNING id, is_starred`,
      [mailId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Mail not found' });
    }

    res.json({
      message: 'Mail star updated',
      mail: result.rows[0]
    });
  } catch (error) {
    console.error('Mail star error:', error);
    res.status(500).json({ message: 'Failed to update star' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const userId = getUserId(req);
    const mailId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({ message: 'Invalid user identity' });
    }

    const result = await db.query(
      `UPDATE mail_messages
       SET folder = 'trash', updated_at = NOW()
       WHERE id = $1
         AND (sender_id = $2 OR recipient_id = $2)
       RETURNING id, folder`,
      [mailId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Mail not found' });
    }

    res.json({
      message: 'Mail moved to trash',
      mail: result.rows[0]
    });
  } catch (error) {
    console.error('Mail delete error:', error);
    res.status(500).json({ message: 'Failed to delete mail' });
  }
});

module.exports = router;
