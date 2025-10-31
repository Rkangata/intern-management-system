const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, generateToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { sendWelcomeEmail } = require('../utils/emailService');

// ========================================================
// 🧍 USER REGISTRATION (UPDATED WITH SPLIT NAMES)
// ========================================================

// @route   POST /api/auth/register
// @desc    Register new user (intern/attachee)
// @access  Public
router.post('/register', upload.single('profilePicture'), async (req, res) => {
  try {
    const {
      firstName,
      middleName,
      lastName,
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

    console.log('=== REGISTRATION REQUEST ===');
    console.log('Name:', firstName, middleName, lastName);
    console.log('Email:', email);
    console.log('Role:', role);

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Only allow intern and attachee registration through this route
    if (role !== 'intern' && role !== 'attachee') {
      return res.status(400).json({ message: 'Invalid role for registration' });
    }

    // Create user with split names
    const user = await User.create({
      firstName,
      middleName: middleName || '', // Optional
      lastName,
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

    console.log('User created successfully:', user.email);
    console.log('Full name:', user.fullName);
    console.log('=== END REGISTRATION ===');

    // Send welcome email
    if (user) {
      await sendWelcomeEmail(user);

      res.status(201).json({
        _id: user._id,
        firstName: user.firstName,
        middleName: user.middleName,
        lastName: user.lastName,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        token: generateToken(user._id),
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================================
// 🔐 LOGIN (WITH SPLIT NAME RESPONSE)
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

    if (!email || !password) {
      return res.status(400).json({ message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (role && user.role !== role) {
      return res.status(401).json({ message: `Invalid credentials for ${role}` });
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if active (only if explicitly false)
    if (user.isActive === false) {
      return res.status(401).json({ message: 'Your account has been deactivated' });
    }

    console.log('Login successful for:', user.email);
    console.log('=== END LOGIN ===');

    res.json({
      _id: user._id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
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
      // Update split name fields
      user.firstName = req.body.firstName || user.firstName;
      user.middleName = req.body.middleName || user.middleName;
      user.lastName = req.body.lastName || user.lastName;
      
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
        firstName: updatedUser.firstName,
        middleName: updatedUser.middleName,
        lastName: updatedUser.lastName,
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
        firstName: updatedUser.firstName,
        middleName: updatedUser.middleName,
        lastName: updatedUser.lastName,
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
// 🔑 PASSWORD RESET
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
      return res.status(404).json({ message: 'If the email exists, a reset link will be sent' });
    }

    console.log('User found:', user.email);

    const tempPassword =
      Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    console.log('New temp password generated:', tempPassword);

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