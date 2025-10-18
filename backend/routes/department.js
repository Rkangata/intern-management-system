const express = require('express');
const router = express.Router();
const { getAllDepartments, getSubdepartments } = require('../config/departments');

// @route   GET /api/departments
// @desc    Get all departments
// @access  Public
router.get('/', (req, res) => {
  try {
    const departments = getAllDepartments();
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/departments/:code/subdepartments
// @desc    Get subdepartments for a specific department
// @access  Public
router.get('/:code/subdepartments', (req, res) => {
  try {
    const subdepartments = getSubdepartments(req.params.code);
    res.json(subdepartments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;