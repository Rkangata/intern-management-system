const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/documents/:filename
// @desc    Download document
// @access  Private
router.get('/:filename', protect, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filepath = path.join(__dirname, '..', 'uploads', 'documents', filename);

    // Check if file exists
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.download(filepath);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;