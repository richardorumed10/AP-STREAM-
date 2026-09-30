const express = require("express");
const router = express.Router();
const pool = require("./db");

router.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW() AS time");
    res.json({
      success: true,
      service: "AP-STREAM Database",
      connected: true,
      time: result.rows[0].time
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      service: "AP-STREAM Database",
      connected: false,
      error: error.message
    });
  }
});

module.exports = router;
