const express = require("express");

const router = express.Router();

// Artist upload information
router.post("/upload", (req, res) => {
  const { title, type, description } = req.body;

  if (!title || !type) {
    return res.status(400).json({
      message: "Title and type are required"
    });
  }

  res.status(201).json({
    message: "Artist upload received",
    upload: {
      title,
      type,
      description: description || ""
    }
  });
});

module.exports = router;
