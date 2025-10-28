const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendWelcomeEmail } = require('../utils/emailService'); // ✅ Email service import

// ========================================================
// 🧍 USER REGISTRATION
// ========================================================

// @route   POST /api/auth/register
// @desc    Register new user (intern/attachee)
// @access  Public
router.post('/register', upload.single('profilePicture'), async (req, res) => {
  try {
    const {
      fullName,
      email,
      password,
      phoneNumber,
      role,
      institution,
      course,
      yearOfStudy,
      department,
      subdepartment,
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Only allow intern and attachee registration through this route
    if (role !== 'intern' && role !== 'attachee') {
      return res.status(400).json({ message: 'Invalid role for registration' });
    }

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      phoneNumber,
      role,
      institution,
      course,
      yearOfStudy,
      department,
      subdepartment,
      profilePicture: req.file ? req.file.path : null,
    });

    // ✅ Send welcome email after registration
    if (user) {
      await sendWelcomeEmail(user);

      res.status(201).json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================================
// 🔐 LOGIN (UPDATED WITH isActive CHECK TEMPORARILY DISABLED)
// ========================================================

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Email:', email);
    console.log('Role:', role);

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    // Find user and explicitly include password
    const user = await User.findOne({ email }).select('+password');

    console.log('User found:', user ? 'Yes' : 'No');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('User role:', user.role);
    console.log('Requested role:', role);

    // Check if role matches (if role is provided)
    if (role && user.role !== role) {
      return res.status(401).json({ message: `Invalid credentials for ${role}` });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // TEMPORARILY COMMENTED OUT
    // // Check if user is active
    // if (!user.isActive) {
    //   return res.status(401).json({ message: 'Your account has been deactivated' });
    // }

    console.log('Login successful for:', user.email);
    console.log('=== END LOGIN ===');

    res.json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      department: user.department,
      subdepartment: user.subdepartment,
      token: generateToken(user._id),
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================================
// 👤 USER PROFILE
// ========================================================

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, upload.single('profilePicture'), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.fullName = req.body.fullName || user.fullName;
      user.phoneNumber = req.body.phoneNumber || user.phoneNumber;
      user.institution = req.body.institution || user.institution;
      user.course = req.body.course || user.course;
      user.yearOfStudy = req.body.yearOfStudy || user.yearOfStudy;
      user.department = req.body.department || user.department;
      user.subdepartment = req.body.subdepartment || user.subdepartment;

      if (req.file) {
        user.profilePicture = req.file.path;
      }

      if (req.body.password) {
        user.password = req.body.password;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        phoneNumber: updatedUser.phoneNumber,
        institution: updatedUser.institution,
        course: updatedUser.course,
        yearOfStudy: updatedUser.yearOfStudy,
        department: updatedUser.department,
        subdepartment: updatedUser.subdepartment,
        profilePicture: updatedUser.profilePicture,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================================
// 🏢 DEPARTMENT ASSIGNMENT
// ========================================================

// @route   PUT /api/auth/set-department
// @desc    Set department for all users except admin
// @access  Private
router.put('/set-department', protect, async (req, res) => {
  try {
    const { department, subdepartment } = req.body;

    // Admin doesn't need department
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admins do not need departments' });
    }

    const user = await User.findById(req.user._id);

    if (user) {
      user.department = department;
      user.subdepartment = subdepartment || 'NONE';

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        subdepartment: updatedUser.subdepartment,
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================================
// 🔑 PASSWORD RESET (UPDATED WITH DEBUGGING)
// ========================================================

// @route   POST /api/auth/forgot-password
// @desc    Request password reset (for all users)
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    console.log('=== PASSWORD RESET REQUEST ===');
    console.log('Email:', email);

    const user = await User.findOne({ email });

    if (!user) {
      // Don't reveal if user exists for security
      return res.status(404).json({ message: 'If the email exists, a reset link will be sent' });
    }

    console.log('User found:', user.email);

    // Generate a temporary password
    const tempPassword =
      Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    console.log('New temp password generated:', tempPassword);

    // Directly set password (will be hashed by pre-save hook)
    user.password = tempPassword;
    await user.save();

    console.log('Password updated successfully');
    console.log('=== END PASSWORD RESET ===');

    res.json({
      message: 'Password reset successful',
      temporaryPassword: tempPassword,
      userName: user.fullName,
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
