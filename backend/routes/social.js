const express = require("express");
const router = express.Router();
const db = require("../db");
const authenticateToken = require("../middleware/auth");

/*
  AP-STREAM Social APIs
  Uses the existing PostgreSQL database.
  No schema changes.
*/

/* =========================
   PLAYLISTS
========================= */

// Get current user's playlists
router.get("/playlists", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    const result = await db.query(
      `SELECT id, name, description, created_at
       FROM playlists
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      playlists: result.rows
    });
  } catch (error) {
    console.error("Playlists GET error:", error);
    res.status(500).json({
      success: false,
      error: "Could not load playlists"
    });
  }
});

// Create playlist
router.post("/playlists", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.userId);
    const { name, description = "" } = req.body || {};

    if (!name || !String(name).trim()) {
      return res.status(400).json({
        success: false,
        error: "Playlist name is required"
      });
    }

    const result = await db.query(
      `INSERT INTO playlists (user_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, user_id, name, description, created_at`,
      [userId, String(name).trim(), String(description || "")]
    );

    res.status(201).json({
      success: true,
      playlist: result.rows[0]
    });
  } catch (error) {
    console.error("Playlist create error:", error);
    res.status(500).json({
      success: false,
      error: "Could not create playlist"
    });
  }
});


/* =========================
   FOLLOWERS
========================= */

// Get followers/following for a user
router.get("/followers", async (req, res) => {
  try {
    const userId = Number(req.query.user_id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid user_id is required"
      });
    }

    const followers = await db.query(
      `SELECT follower_id, following_id, created_at
       FROM followers
       WHERE following_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    const following = await db.query(
      `SELECT follower_id, following_id, created_at
       FROM followers
       WHERE follower_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      followers: followers.rows,
      following: following.rows,
      follower_count: followers.rowCount,
      following_count: following.rowCount
    });
  } catch (error) {
    console.error("Followers GET error:", error);
    res.status(500).json({
      success: false,
      error: "Could not load followers"
    });
  }
});

// Follow a user
router.post("/followers", authenticateToken, async (req, res) => {
  try {
    const followerId = Number(req.user.userId);
    const followingId = Number(req.body?.following_id);

    if (!Number.isInteger(followingId) || followingId <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid following_id is required"
      });
    }

    if (followerId === followingId) {
      return res.status(400).json({
        success: false,
        error: "You cannot follow yourself"
      });
    }

    await db.query(
      `INSERT INTO followers (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [followerId, followingId]
    );

    res.status(201).json({
      success: true,
      follower_id: followerId,
      following_id: followingId
    });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({
      success: false,
      error: "Could not follow user"
    });
  }
});

// Unfollow a user
router.delete("/followers/:followingId", authenticateToken, async (req, res) => {
  try {
    const followerId = Number(req.user.userId);
    const followingId = Number(req.params.followingId);

    await db.query(
      `DELETE FROM followers
       WHERE follower_id = $1 AND following_id = $2`,
      [followerId, followingId]
    );

    res.json({
      success: true
    });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({
      success: false,
      error: "Could not unfollow user"
    });
  }
});


/* =========================
   LIKES
========================= */

// Get likes for a media item
router.get("/likes", async (req, res) => {
  try {
    const songId = req.query.song_id ? Number(req.query.song_id) : null;
    const videoId = req.query.video_id ? Number(req.query.video_id) : null;
    const shortVideoId = req.query.short_video_id
      ? Number(req.query.short_video_id)
      : null;

    if (!songId && !videoId && !shortVideoId) {
      return res.status(400).json({
        success: false,
        error: "Provide song_id, video_id, or short_video_id"
      });
    }

    const result = await db.query(
      `SELECT COUNT(*)::integer AS count
       FROM likes
       WHERE ($1::integer IS NOT NULL AND song_id = $1)
          OR ($2::integer IS NOT NULL AND video_id = $2)
          OR ($3::integer IS NOT NULL AND short_video_id = $3)`,
      [songId, videoId, shortVideoId]
    );

    res.json({
      success: true,
      count: result.rows[0].count
    });
  } catch (error) {
    console.error("Likes GET error:", error);
    res.status(500).json({
      success: false,
      error: "Could not load likes"
    });
  }
});

// Like media
router.post("/likes", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    const songId = req.body?.song_id ? Number(req.body.song_id) : null;
    const videoId = req.body?.video_id ? Number(req.body.video_id) : null;
    const shortVideoId = req.body?.short_video_id
      ? Number(req.body.short_video_id)
      : null;

    const targets = [songId, videoId, shortVideoId].filter(Boolean);

    if (targets.length !== 1) {
      return res.status(400).json({
        success: false,
        error: "Provide exactly one media target"
      });
    }

    const result = await db.query(
      `INSERT INTO likes (user_id, song_id, video_id, short_video_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, songId, videoId, shortVideoId]
    );

    res.status(201).json({
      success: true,
      like: result.rows[0]
    });
  } catch (error) {
    console.error("Like POST error:", error);
    res.status(500).json({
      success: false,
      error: "Could not save like"
    });
  }
});


/* =========================
   COMMENTS
========================= */

// Get comments
router.get("/comments", async (req, res) => {
  try {
    const songId = req.query.song_id ? Number(req.query.song_id) : null;
    const videoId = req.query.video_id ? Number(req.query.video_id) : null;
    const shortVideoId = req.query.short_video_id
      ? Number(req.query.short_video_id)
      : null;

    if (!songId && !videoId && !shortVideoId) {
      return res.status(400).json({
        success: false,
        error: "Provide song_id, video_id, or short_video_id"
      });
    }

    const result = await db.query(
      `SELECT id, user_id, song_id, video_id, short_video_id,
              content, created_at
       FROM comments
       WHERE ($1::integer IS NOT NULL AND song_id = $1)
          OR ($2::integer IS NOT NULL AND video_id = $2)
          OR ($3::integer IS NOT NULL AND short_video_id = $3)
       ORDER BY created_at DESC`,
      [songId, videoId, shortVideoId]
    );

    res.json({
      success: true,
      comments: result.rows
    });
  } catch (error) {
    console.error("Comments GET error:", error);
    res.status(500).json({
      success: false,
      error: "Could not load comments"
    });
  }
});

// Create comment
router.post("/comments", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    const songId = req.body?.song_id ? Number(req.body.song_id) : null;
    const videoId = req.body?.video_id ? Number(req.body.video_id) : null;
    const shortVideoId = req.body?.short_video_id
      ? Number(req.body.short_video_id)
      : null;

    const content = String(req.body?.content || "").trim();

    const targets = [songId, videoId, shortVideoId].filter(Boolean);

    if (targets.length !== 1) {
      return res.status(400).json({
        success: false,
        error: "Provide exactly one media target"
      });
    }

    if (!content) {
      return res.status(400).json({
        success: false,
        error: "Comment content is required"
      });
    }

    const result = await db.query(
      `INSERT INTO comments
       (user_id, song_id, video_id, short_video_id, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, songId, videoId, shortVideoId, content]
    );

    res.status(201).json({
      success: true,
      comment: result.rows[0]
    });
  } catch (error) {
    console.error("Comment POST error:", error);
    res.status(500).json({
      success: false,
      error: "Could not save comment"
    });
  }
});


/* =========================
   NOTIFICATIONS
========================= */

// Current user's notifications
router.get("/notifications", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    const result = await db.query(
      `SELECT user_id, type, title, message, is_read, created_at
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      notifications: result.rows
    });
  } catch (error) {
    console.error("Notifications GET error:", error);
    res.status(500).json({
      success: false,
      error: "Could not load notifications"
    });
  }
});

// Mark current user's notifications as read
router.patch("/notifications/read", authenticateToken, async (req, res) => {
  try {
    const userId = Number(req.user.userId);

    await db.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true
    });
  } catch (error) {
    console.error("Notifications READ error:", error);
    res.status(500).json({
      success: false,
      error: "Could not update notifications"
    });
  }
});

module.exports = router;
