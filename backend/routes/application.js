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

// =============================================================
// 📝 SUBMIT APPLICATION (Intern / Attachee)
// =============================================================
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
        recommendationLetter: req.files.recommendationLetter
          ? req.files.recommendationLetter[0].path
          : null,
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

// =============================================================
// 👤 GET USER APPLICATIONS
// =============================================================
router.get('/my-applications', protect, authorize('intern', 'attachee'), async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user._id })
      .populate('user', 'fullName email phoneNumber')
      .sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// =============================================================
// 🧾 HR REVIEW - Forward to HOD
// =============================================================
router.put('/:id/hr-review', protect, authorize('hr'), async (req, res) => {
  try {
    const { comments, hodDepartment, hodSubdepartment } = req.body;

    console.log('=== HR REVIEW REQUEST ===');
    console.log('Application ID:', req.params.id);
    console.log('Comments:', comments);
    console.log('HOD Department:', hodDepartment);
    console.log('HOD Subdepartment:', hodSubdepartment);

    if (!comments || !comments.trim()) {
      return res.status(400).json({ message: 'Comments are required' });
    }

    if (!hodDepartment || !hodSubdepartment) {
      return res.status(400).json({ message: 'HOD department and subdepartment are required' });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    console.log('Before Update:', {
      dept: application.preferredDepartment,
      subdept: application.preferredSubdepartment,
    });

    application.hrComments = comments;
    application.preferredDepartment = hodDepartment;
    application.preferredSubdepartment = hodSubdepartment;
    application.status = 'hod_review';
    application.reviewedBy = req.user._id;
    application.reviewedAt = Date.now();

    await application.save();

    console.log('After Update:', {
      dept: application.preferredDepartment,
      subdept: application.preferredSubdepartment,
      status: application.status,
    });
    console.log('=== END HR REVIEW ===');

    await application.populate('user', '-password');

    res.json(application);
  } catch (error) {
    console.error('HR Review error:', error);
    res.status(500).json({ message: error.message });
  }
});

// =============================================================
// 🏢 HOD REVIEW - Final Decision
// =============================================================
router.put('/:id/hod-review', protect, authorize('hod'), async (req, res) => { 
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

// =============================================================
// 📊 ANALYTICS ROUTE
// =============================================================
router.get('/analytics/stats', protect, authorize('hr', 'hod'), async (req, res) => {
  try {
    const applications = await Application.find().populate('user', 'fullName email institution course role');

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
    const approvalRate =
      totalProcessed > 0 ? ((statusCounts.approved / totalProcessed) * 100).toFixed(1) : 0;

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

// =============================================================
// 🔍 GET ALL APPLICATIONS (UPDATED FOR HODs)
// =============================================================
router.get('/', protect, authorize('hr', 'hod', 'admin'), async (req, res) => {
  try {
    let query = {};

    // ✅ If HOD, show ALL applications in their department, regardless of status
    if (req.user.role === 'hod') {
      query.preferredDepartment = req.user.department;
      query.preferredSubdepartment = req.user.subdepartment;

      console.log('=== HOD BACKEND FILTER ===');
      console.log('HOD User:', req.user.email);
      console.log('HOD Department:', req.user.department);
      console.log('HOD Subdepartment:', req.user.subdepartment);
      console.log('Query:', query);
    }

    // ✅ Apply optional filters for HR or Admin
    if (req.query.status && req.user.role !== 'hod') query.status = req.query.status;
    if (req.query.department && req.user.role === 'hr') query.preferredDepartment = req.query.department;
    if (req.query.subdepartment && req.user.role === 'hr') query.preferredSubdepartment = req.query.subdepartment;

    const applications = await Application.find(query)
      .populate('user', '-password')
      .sort({ createdAt: -1 });

    console.log('Found Applications:', applications.length);

    if (req.user.role === 'hod') {
      console.log(
        'Application Details:',
        applications.map(app => ({
          id: app._id,
          dept: app.preferredDepartment,
          subdept: app.preferredSubdepartment,
          status: app.status,
        }))
      );
      console.log('=== END BACKEND DEBUG ===');
    }

    res.json(applications);
  } catch (error) {
    console.error('Fetch applications error:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
