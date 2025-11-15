const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const { sendAccountCreatedEmail } = require('../utils/emailService');

// ========================================================
// 👥 HR CREATE INTERN/ATTACHEE USER
// ========================================================

// @route   POST /api/hr/create-user
// @desc    HR creates intern or attachee account
// @access  Private (HR only)
router.post('/create-user', protect, authorize('hr'), async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
      email,
      phoneNumber,
      role,
      institution,
      course,
      yearOfStudy,
      department,
      subdepartment
    } = req.body;

    console.log('=== HR CREATE USER REQUEST ===');
    console.log('Role:', role);
    console.log('Created by HR:', req.user.email);

    // Validate role - HR can only create interns and attachees
    if (role !== 'intern' && role !== 'attachee') {
      return res.status(403).json({ 
        message: 'HR can only create intern and attachee accounts' 
      });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }

    // Validate required fields for interns/attachees
    if (!institution || !course || !yearOfStudy) {
      return res.status(400).json({ 
        message: 'Institution, course, and year of study are required for interns/attachees' 
      });
    }

    if (!department || !subdepartment) {
      return res.status(400).json({ 
        message: 'Department and subdepartment are required' 
      });
    }

    // Generate temporary password (6 characters)
    const tempPassword = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Prepare user data
    const userData = {
      firstName,
      middleName: middleName || '',
      lastName,
      email,
      password: tempPassword,
      phoneNumber,
      role,
      institution,
      course,
      yearOfStudy,
      department,
      subdepartment,
      mustChangePassword: true, // ✅ Force password change on first login
      createdBy: req.user._id // ✅ Track who created this user
    };

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });

    // Create user
    const user = await User.create(userData);

    console.log('User created successfully:', user._id);

    // ✅ Send account created email with temporary password
    await sendAccountCreatedEmail(user, tempPassword, req.user.fullName);

    console.log('Account email sent to:', user.email);
    console.log('=== END HR CREATE USER ===');

    // ✅ Return success response
    res.status(201).json({
      message: 'User account created successfully. Login credentials have been sent to their email.',
      user: {
        _id: user._id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        subdepartment: user.subdepartment,
        mustChangePassword: user.mustChangePassword
      },
      emailSent: true,
      // ⚠️ DEVELOPMENT ONLY: Remove this in production
      ...(process.env.NODE_ENV === 'development' && { temporaryPassword: tempPassword })
    });
  } catch (error) {
    console.error('HR create user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================================
// 👥 GET HR-CREATED USERS
// ========================================================

// @route   GET /api/hr/created-users
// @desc    Get all users created by this HR officer
// @access  Private (HR only)
router.get('/created-users', protect, authorize('hr'), async (req, res) => {
  try {
    const users = await User.find({ 
      createdBy: req.user._id,
      role: { $in: ['intern', 'attachee'] }
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;