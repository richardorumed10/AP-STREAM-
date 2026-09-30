const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth");

/*
  AP-STREAM Messages API
  Conversation membership is required for all private operations.
*/

/* =========================
   LIST MY CONVERSATIONS
========================= */

router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    const result = await db.query(
      `SELECT c.id, c.created_at
       FROM conversations c
       INNER JOIN conversation_members cm
         ON cm.conversation_id = c.id
       WHERE cm.user_id = $1
       ORDER BY c.created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      conversations: result.rows
    });
  } catch (error) {
    console.error("Conversations GET error:", error);
    res.status(500).json({
      success: false,
      error: "Could not load conversations"
    });
  }
});


/* =========================
   CREATE CONVERSATION
========================= */

router.post("/conversations", authenticateToken, async (req, res) => {
  const client = await db.connect();

  try {
    const userId = Number(req.user.userId);

    let memberIds = Array.isArray(req.body?.member_ids)
      ? req.body.member_ids.map(Number)
      : [];

    memberIds = memberIds.filter(
      (id) => Number.isInteger(id) && id > 0
    );

    memberIds.push(userId);

    memberIds = [...new Set(memberIds)];

    if (memberIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: "A conversation requires at least two users"
      });
    }

    await client.query("BEGIN");

    const conversation = await client.query(
      `INSERT INTO conversations
       DEFAULT VALUES
       RETURNING id, created_at`
    );

    const conversationId = conversation.rows[0].id;

    for (const memberId of memberIds) {
      await client.query(
        `INSERT INTO conversation_members
         (conversation_id, user_id)
         VALUES ($1, $2)`,
        [conversationId, memberId]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      success: true,
      conversation: conversation.rows[0],
      member_ids: memberIds
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Conversation create error:", error);

    res.status(500).json({
      success: false,
      error: "Could not create conversation"
    });
  } finally {
    client.release();
  }
});


/* =========================
   ADD MEMBER
========================= */

router.post(
  "/conversations/:conversationId/members",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = Number(req.user.userId);
      const conversationId = Number(req.params.conversationId);
      const newUserId = Number(req.body?.user_id);

      if (!Number.isInteger(conversationId) || conversationId <= 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid conversation_id"
        });
      }

      if (!Number.isInteger(newUserId) || newUserId <= 0) {
        return res.status(400).json({
          success: false,
          error: "Valid user_id is required"
        });
      }

      const membership = await db.query(
        `SELECT 1
         FROM conversation_members
         WHERE conversation_id = $1
         AND user_id = $2`,
        [conversationId, userId]
      );

      if (membership.rowCount === 0) {
        return res.status(403).json({
          success: false,
          error: "You are not a member of this conversation"
        });
      }

      await db.query(
        `INSERT INTO conversation_members
         (conversation_id, user_id)
         VALUES ($1, $2)
         ON CONFLICT DO NOTHING`,
        [conversationId, newUserId]
      );

      res.status(201).json({
        success: true,
        conversation_id: conversationId,
        user_id: newUserId
      });
    } catch (error) {
      console.error("Conversation member error:", error);

      res.status(500).json({
        success: false,
        error: "Could not add conversation member"
      });
    }
  }
);


/* =========================
   GET MESSAGES
========================= */

router.get(
  "/conversations/:conversationId/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = Number(req.user.userId);
      const conversationId = Number(req.params.conversationId);

      const membership = await db.query(
        `SELECT 1
         FROM conversation_members
         WHERE conversation_id = $1
         AND user_id = $2`,
        [conversationId, userId]
      );

      if (membership.rowCount === 0) {
        return res.status(403).json({
          success: false,
          error: "You are not a member of this conversation"
        });
      }

      const result = await db.query(
        `SELECT id, conversation_id, sender_id, content, created_at
         FROM messages
         WHERE conversation_id = $1
         ORDER BY created_at ASC`,
        [conversationId]
      );

      res.json({
        success: true,
        messages: result.rows
      });
    } catch (error) {
      console.error("Messages GET error:", error);

      res.status(500).json({
        success: false,
        error: "Could not load messages"
      });
    }
  }
);


/* =========================
   SEND MESSAGE
========================= */

router.post(
  "/conversations/:conversationId/messages",
  authenticateToken,
  async (req, res) => {
    try {
      const userId = Number(req.user.userId);
      const conversationId = Number(req.params.conversationId);
      const content = String(req.body?.content || "").trim();

      if (!content) {
        return res.status(400).json({
          success: false,
          error: "Message content is required"
        });
      }

      const membership = await db.query(
        `SELECT 1
         FROM conversation_members
         WHERE conversation_id = $1
         AND user_id = $2`,
        [conversationId, userId]
      );

      if (membership.rowCount === 0) {
        return res.status(403).json({
          success: false,
          error: "You are not a member of this conversation"
        });
      }

      const result = await db.query(
        `INSERT INTO messages
         (conversation_id, sender_id, content)
         VALUES ($1, $2, $3)
         RETURNING id, conversation_id, sender_id, content, created_at`,
        [conversationId, userId, content]
      );

      res.status(201).json({
        success: true,
        message: result.rows[0]
      });
    } catch (error) {
      console.error("Message POST error:", error);

      res.status(500).json({
        success: false,
        error: "Could not send message"
      });
    }
  }
);

module.exports = router;
