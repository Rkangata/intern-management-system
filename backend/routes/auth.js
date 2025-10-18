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
// 🔐 LOGIN
// ========================================================

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.comparePassword(password))) {
      if (user.role !== role) {
        return res.status(401).json({ message: 'Invalid credentials or role' });
      }

      res.json({
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
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
// 🏢 DEPARTMENT ASSIGNMENT (UPDATED)
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
// 🔑 PASSWORD RESET (FORGOT PASSWORD)
// ========================================================

// @route   POST /api/auth/forgot-password
// @desc    Request password reset (for all users)
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return res.status(404).json({ message: 'If the email exists, a reset link will be sent' });
    }

    // Generate a temporary password
    const tempPassword =
      Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    user.password = tempPassword;
    await user.save();

    console.log(`Password reset for ${email}: ${tempPassword}`);

    res.json({
      message: 'Password reset successful',
      temporaryPassword: tempPassword,
      userName: user.fullName,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
