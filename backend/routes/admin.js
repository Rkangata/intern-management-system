const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   POST /api/admin/create-user
// @desc    Admin creates any type of user
// @access  Private (admin only)
router.post('/create-user', protect, authorize('admin'), async (req, res) => {
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

    console.log('=== CREATE USER REQUEST ===');
    console.log('Role:', role);
    console.log('Department:', department);
    console.log('Subdepartment:', subdepartment);

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

    // Prepare user data
    const userData = {
      firstName,
      middleName: middleName || '',
      lastName,
      email,
      password: tempPassword,
      phoneNumber,
      role,
    };

    // Add department (required for all except admin)
    if (role !== 'admin') {
      userData.department = department;
      
      // Subdepartment only for roles that need it
      // COS and PS work at department level only
      if (['intern', 'attachee', 'hr', 'hod'].includes(role)) {
        userData.subdepartment = subdepartment || 'NONE';
      }
    }

    // Add extra fields for interns or attachees
    if (role === 'intern' || role === 'attachee') {
      userData.institution = institution;
      userData.course = course;
      userData.yearOfStudy = yearOfStudy;
    }

    console.log('Creating user with data:', { ...userData, password: '[HIDDEN]' });

    // Create user
    const user = await User.create(userData);

    console.log('User created successfully:', user._id);
    console.log('=== END CREATE USER ===');

    res.status(201).json({
      message: 'User created successfully',
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
      },
      temporaryPassword: tempPassword,
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/users
// @desc    Get all staff users (HR, HOD, COS, PS)
// @access  Private (admin only)
router.get('/users', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find({ 
      role: { $in: ['hr', 'hod', 'chief_of_staff', 'principal_secretary'] } 
    })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/admin/all-applicants
// @desc    Get all interns and attachees
// @access  Private (admin only)
router.get('/all-applicants', protect, authorize('admin'), async (req, res) => {
  try {
    const applicants = await User.find({ role: { $in: ['intern', 'attachee'] } })
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(applicants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (admin only)
router.delete('/users/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    await user.deleteOne();
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/admin/users/:id/reset-password
// @desc    Reset user password
// @access  Private (admin only)
router.put('/users/:id/reset-password', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new password
    const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
    user.password = newPassword;
    await user.save();

    res.json({
      message: 'Password reset successfully',
      newPassword,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;