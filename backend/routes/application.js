const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');
const {
  sendApplicationSubmittedEmail,
  sendHRReviewEmail,
  sendFinalDecisionEmail,
} = require('../utils/emailService');

// @route   POST /api/applications
// @desc    Submit new application
// @access  Private (intern/attachee)
router.post(
  '/',
  protect,
  authorize('intern', 'attachee'),
  upload.fields([
    { name: 'applicationLetter', maxCount: 1 },
    { name: 'cv', maxCount: 1 },
    { name: 'transcripts', maxCount: 1 },
    { name: 'recommendationLetter', maxCount: 1 },
    { name: 'nationalId', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { startDate, endDate, preferredDepartment, preferredSubdepartment } = req.body;

      const existingApplication = await Application.findOne({
        user: req.user._id,
        status: { $in: ['pending', 'hr_review', 'hod_review'] },
      });

      if (existingApplication) {
        return res.status(400).json({ message: 'You already have a pending application' });
      }

      const application = await Application.create({
        user: req.user._id,
        applicationLetter: req.files.applicationLetter[0].path,
        cv: req.files.cv[0].path,
        transcripts: req.files.transcripts ? req.files.transcripts[0].path : null,
        recommendationLetter: req.files.recommendationLetter ? req.files.recommendationLetter[0].path : null,
        nationalId: req.files.nationalId[0].path,
        startDate,
        endDate,
        preferredDepartment,
        preferredSubdepartment: preferredSubdepartment || 'NONE',
      });

      await sendApplicationSubmittedEmail(req.user, application);
      res.status(201).json(application);
    } catch (error) {
      console.error('Application submission error:', error);
      res.status(500).json({ message: error.message });
    }
  }
);

// @route   GET /api/applications/my-applications
// @desc    Get current user's applications
// @access  Private (intern/attachee)
router.get(
  '/my-applications',
  protect,
  authorize('intern', 'attachee'),
  async (req, res) => {
    try {
      const applications = await Application.find({ user: req.user._id })
        .populate('user', 'fullName email phoneNumber')
        .sort({ createdAt: -1 });
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// @route   PUT /api/applications/hr-review/:id
// @desc    HR reviews application
// @access  Private (hr)
router.put('/hr-review/:id', protect, authorize('hr'), async (req, res) => {
  try {
    const { action, comments } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) return res.status(404).json({ message: 'Application not found' });

    application.reviewedByHR = req.user._id;
    application.hrComments = comments;
    application.status = action === 'approve' ? 'hod_review' : 'rejected';
    await application.save();

    const user = await User.findById(application.user);
    await sendHRReviewEmail(user, application, comments);
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   PUT /api/applications/hod-review/:id
// @desc    HOD makes final decision
// @access  Private (hod)
router.put('/hod-review/:id', protect, authorize('hod'), async (req, res) => {
  try {
    const { action, comments } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) return res.status(404).json({ message: 'Application not found' });

    application.reviewedByHOD = req.user._id;
    application.hodComments = comments;
    application.status = action === 'approve' ? 'approved' : 'rejected';
    await application.save();

    const user = await User.findById(application.user);
    await sendFinalDecisionEmail(user, application, action === 'approve', comments);
    res.json(application);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/applications/analytics/stats
// @desc    Get analytics data
// @access  Private (hr/hod)
router.get('/analytics/stats', protect, authorize('hr', 'hod'), async (req, res) => {
  try {
    const applications = await Application.find()
      .populate('user', 'fullName email institution course role');

    const statusCounts = {
      pending: applications.filter(a => a.status === 'pending').length,
      hr_review: applications.filter(a => a.status === 'hr_review').length,
      hod_review: applications.filter(a => a.status === 'hod_review').length,
      approved: applications.filter(a => a.status === 'approved').length,
      rejected: applications.filter(a => a.status === 'rejected').length,
    };

    const roleCounts = {
      intern: applications.filter(a => a.user?.role === 'intern').length,
      attachee: applications.filter(a => a.user?.role === 'attachee').length,
    };

    const departmentCounts = {};
    const institutionCounts = {};
    applications.forEach(a => {
      const dept = a.preferredDepartment || 'Not Specified';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;

      const institution = a.user?.institution || 'Not Specified';
      institutionCounts[institution] = (institutionCounts[institution] || 0) + 1;
    });

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const monthlyData = {};
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      months.push(key);
      monthlyData[key] = 0;
    }

    applications.forEach(a => {
      const date = new Date(a.createdAt);
      if (date >= sixMonthsAgo) {
        const key = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (monthlyData.hasOwnProperty(key)) monthlyData[key]++;
      }
    });

    const timelineData = months.map(month => ({ month, count: monthlyData[month] }));

    const totalProcessed = statusCounts.approved + statusCounts.rejected;
    const approvalRate = totalProcessed > 0
      ? ((statusCounts.approved / totalProcessed) * 100).toFixed(1)
      : 0;

    const recentApplications = applications
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)
      .map(a => ({
        id: a._id,
        name: a.user?.fullName,
        role: a.user?.role,
        department: a.preferredDepartment,
        status: a.status,
        createdAt: a.createdAt,
      }));

    res.json({
      total: applications.length,
      statusCounts,
      roleCounts,
      departmentCounts,
      institutionCounts,
      timelineData,
      approvalRate,
      recentApplications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/applications
// @desc    Filter applications (HR/HOD view)
// @access  Private (hr/hod)
router.get('/', protect, authorize('hr', 'hod'), async (req, res) => {
  try {
    const { status, department, subdepartment, role, search, startDate, endDate, sortBy, sortOrder } = req.query;

    let query = {};
    if (req.user.role === 'hod') {
      query.preferredDepartment = req.user.department;
      query.preferredSubdepartment = req.user.subdepartment;
    }
    if (status && status !== 'all') query.status = status;
    if (department && req.user.role === 'hr') query.preferredDepartment = department;
    if (subdepartment && req.user.role === 'hr') query.preferredSubdepartment = subdepartment;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    let applications = await Application.find(query)
      .populate('user', 'fullName email phoneNumber institution course role')
      .populate('reviewedByHR', 'fullName')
      .populate('reviewedByHOD', 'fullName');

    if (role && role !== 'all') {
      applications = applications.filter(a => a.user && a.user.role === role);
    }

    if (search) {
      const q = search.toLowerCase();
      applications = applications.filter(a =>
        a.user?.fullName?.toLowerCase().includes(q) ||
        a.user?.email?.toLowerCase().includes(q) ||
        a.user?.institution?.toLowerCase().includes(q) ||
        a.preferredDepartment?.toLowerCase().includes(q)
      );
    }

    const sort = sortBy || 'createdAt';
    const order = sortOrder === 'asc' ? 1 : -1;
    applications.sort((a, b) => {
      let av, bv;
      switch (sort) {
        case 'name': av = a.user?.fullName || ''; bv = b.user?.fullName || ''; break;
        case 'department': av = a.preferredDepartment || ''; bv = b.preferredDepartment || ''; break;
        case 'status': av = a.status || ''; bv = b.status || ''; break;
        case 'startDate': av = new Date(a.startDate); bv = new Date(b.startDate); break;
        default: av = new Date(a.createdAt); bv = new Date(b.createdAt);
      }
      return (av < bv ? -1 : av > bv ? 1 : 0) * order;
    });

    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
