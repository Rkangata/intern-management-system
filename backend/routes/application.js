const express = require("express");
const router = express.Router();
const Application = require("../models/Application");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  sendApplicationSubmittedEmail,
  sendHRReviewEmail,
  sendFinalDecisionEmail,
  sendHODApprovalToHREmail, // ✅ NEW IMPORT
  sendOfferEmail, // ✅ NEW IMPORT
} = require("../utils/emailService");

// =============================================================
// 📝 SUBMIT APPLICATION (Intern / Attachee) - UPDATED
// =============================================================
router.post(
  "/",
  protect,
  authorize("intern", "attachee"),
  upload.fields([
    // Intern documents
    { name: "appointmentLetter", maxCount: 1 },
    { name: "degreeCertificate", maxCount: 1 },
    { name: "transcripts", maxCount: 1 },
    { name: "nationalIdOrPassport", maxCount: 1 },
    { name: "kraPinCertificate", maxCount: 1 },
    { name: "goodConductCertificate", maxCount: 1 },
    { name: "passportPhotos", maxCount: 1 },
    { name: "shifCard", maxCount: 1 },
    { name: "insuranceCover", maxCount: 1 },
    { name: "nssfCard", maxCount: 1 },
    { name: "bioDataForm", maxCount: 1 },
    // Attachee documents
    { name: "applicationLetter", maxCount: 1 },
    { name: "cv", maxCount: 1 },
    { name: "attacheeTranscripts", maxCount: 1 },
    { name: "recommendationLetter", maxCount: 1 },
    { name: "attacheeNationalId", maxCount: 1 },
    { name: "attacheeInsurance", maxCount: 1 },
    { name: "goodConductCertOrReceipt", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        startDate,
        endDate,
        preferredDepartment,
        preferredSubdepartment,
        applicantRole,
      } = req.body;

      console.log("=== APPLICATION SUBMISSION ===");
      console.log("User:", req.user.email);
      console.log("Role:", applicantRole);
      console.log("Files received:", Object.keys(req.files));

      // Check for existing pending application
      const existingApplication = await Application.findOne({
        user: req.user._id,
        status: {
          $in: ["pending", "hr_review", "hod_review", "hr_final_review"],
        },
      });

      if (existingApplication) {
        return res
          .status(400)
          .json({ message: "You already have a pending application" });
      }

      // Build application data based on role
      const applicationData = {
        user: req.user._id,
        applicantRole: applicantRole || req.user.role,
        startDate,
        endDate,
        preferredDepartment,
        preferredSubdepartment: preferredSubdepartment || "NONE",
      };

      // Add role-specific documents
      const role = applicantRole || req.user.role;
      if (role === "intern") {
        applicationData.appointmentLetter =
          req.files.appointmentLetter?.[0]?.path;
        applicationData.degreeCertificate =
          req.files.degreeCertificate?.[0]?.path;
        applicationData.transcripts = req.files.transcripts?.[0]?.path;
        applicationData.nationalIdOrPassport =
          req.files.nationalIdOrPassport?.[0]?.path;
        applicationData.kraPinCertificate =
          req.files.kraPinCertificate?.[0]?.path;
        applicationData.goodConductCertificate =
          req.files.goodConductCertificate?.[0]?.path;
        applicationData.passportPhotos = req.files.passportPhotos?.[0]?.path;
        applicationData.shifCard = req.files.shifCard?.[0]?.path;
        applicationData.insuranceCover = req.files.insuranceCover?.[0]?.path;
        applicationData.nssfCard = req.files.nssfCard?.[0]?.path;
        applicationData.bioDataForm = req.files.bioDataForm?.[0]?.path;

        // Validate required intern documents
        if (
          !applicationData.appointmentLetter ||
          !applicationData.degreeCertificate ||
          !applicationData.transcripts ||
          !applicationData.nationalIdOrPassport ||
          !applicationData.kraPinCertificate ||
          !applicationData.goodConductCertificate
        ) {
          return res
            .status(400)
            .json({ message: "Missing required intern documents" });
        }
      } else {
        applicationData.applicationLetter =
          req.files.applicationLetter?.[0]?.path;
        applicationData.cv = req.files.cv?.[0]?.path;
        applicationData.attacheeTranscripts =
          req.files.attacheeTranscripts?.[0]?.path;
        applicationData.recommendationLetter =
          req.files.recommendationLetter?.[0]?.path;
        applicationData.attacheeNationalId =
          req.files.attacheeNationalId?.[0]?.path;
        applicationData.attacheeInsurance =
          req.files.attacheeInsurance?.[0]?.path;
        applicationData.goodConductCertOrReceipt =
          req.files.goodConductCertOrReceipt?.[0]?.path;

        // Validate required attachee documents
        if (
          !applicationData.applicationLetter ||
          !applicationData.cv ||
          !applicationData.attacheeTranscripts ||
          !applicationData.attacheeNationalId
        ) {
          return res
            .status(400)
            .json({ message: "Missing required attachee documents" });
        }
      }

      const application = await Application.create(applicationData);

      console.log("Application created:", application._id);
      console.log("=== END APPLICATION SUBMISSION ===");

      await sendApplicationSubmittedEmail(req.user, application);
      res.status(201).json(application);
    } catch (error) {
      console.error("Application submission error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// =============================================================
// 👤 GET USER APPLICATIONS
// =============================================================
router.get(
  "/my-applications",
  protect,
  authorize("intern", "attachee"),
  async (req, res) => {
    try {
      const applications = await Application.find({ user: req.user._id })
        .populate(
          "user",
          "firstName middleName lastName email phoneNumber institution course yearOfStudy role"
        )
        .sort({ createdAt: -1 });
      res.json(applications);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// =============================================================
// 🧾 HR REVIEW - Forward to HOD
// =============================================================
router.put("/:id/hr-review", protect, authorize("hr"), async (req, res) => {
  try {
    const { comments, hodDepartment, hodSubdepartment } = req.body;

    console.log("=== HR REVIEW REQUEST ===");
    console.log("Application ID:", req.params.id);
    console.log("Comments:", comments);
    console.log("HOD Department:", hodDepartment);
    console.log("HOD Subdepartment:", hodSubdepartment);

    if (!comments || !comments.trim()) {
      return res.status(400).json({ message: "Comments are required" });
    }

    if (!hodDepartment || !hodSubdepartment) {
      return res
        .status(400)
        .json({ message: "HOD department and subdepartment are required" });
    }

    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    console.log("Before Update:", {
      dept: application.preferredDepartment,
      subdept: application.preferredSubdepartment,
    });

    application.hrComments = comments;
    application.preferredDepartment = hodDepartment;
    application.preferredSubdepartment = hodSubdepartment;
    application.status = "hod_review";
    application.reviewedBy = req.user._id;
    application.reviewedAt = Date.now();

    await application.save();

    console.log("After Update:", {
      dept: application.preferredDepartment,
      subdept: application.preferredSubdepartment,
      status: application.status,
    });
    console.log("=== END HR REVIEW ===");

    await application.populate("user", "-password");

    res.json(application);
  } catch (error) {
    console.error("HR Review error:", error);
    res.status(500).json({ message: error.message });
  }
});

// =============================================================
// 🏢 HOD REVIEW - ✅ UPDATED: Sends back to HR for final review
// =============================================================
router.put("/:id/hod-review", protect, authorize("hod"), async (req, res) => {
  try {
    const { action, comments } = req.body;

    console.log("=== HOD REVIEW REQUEST ===");
    console.log("Application ID:", req.params.id);
    console.log("Action:", action);
    console.log("Comments:", comments);

    if (!comments || !comments.trim()) {
      return res.status(400).json({ message: "Comments are required" });
    }

    if (!action || !["approve", "reject"].includes(action)) {
      return res
        .status(400)
        .json({ message: "Valid action (approve/reject) is required" });
    }

    const application = await Application.findById(req.params.id).populate(
      "user"
    );

    if (!application) {
      return res.status(404).json({ message: "Application not found" });
    }

    // Check if application is for this HOD's department
    if (
      application.preferredDepartment !== req.user.department ||
      application.preferredSubdepartment !== req.user.subdepartment
    ) {
      return res.status(403).json({
        message: "You can only review applications for your department",
      });
    }

    // Update application with HOD decision
    application.reviewedByHOD = req.user._id;
    application.hodComments = comments;
    application.hodReviewDate = Date.now();

    if (action === "approve") {
      // ✅ NEW WORKFLOW: Send back to HR for final review
      application.status = "hr_final_review";

      await application.save();

      console.log("HOD approved - sent back to HR for final review");

      // ✅ Notify HR that application is ready for offer email
      // Find HR users in the same department
      const hrUsers = await User.find({
        role: "hr",
        department: application.preferredDepartment,
      });

      // Send notification to all HR users in that department
      for (const hrUser of hrUsers) {
        await sendHODApprovalToHREmail(
          hrUser,
          application,
          application.user,
          comments
        );
      }

      res.json({
        ...application.toObject(),
        message: "Application approved and sent to HR for final review",
      });
    } else {
      // Rejected - final status
      application.status = "rejected";
      await application.save();

      console.log("HOD rejected application");

      // Send rejection email to applicant
      const user = await User.findById(application.user);
      await sendFinalDecisionEmail(user, application, false, comments);

      res.json({
        ...application.toObject(),
        message: "Application rejected",
      });
    }

    console.log("=== END HOD REVIEW ===");
  } catch (error) {
    console.error("HOD Review error:", error);
    res.status(500).json({ message: error.message });
  }
});

// =============================================================
// 📧 NEW: HR FINAL REVIEW - Send Offer Email
// =============================================================
router.put(
  "/:id/hr-final-review",
  protect,
  authorize("hr"),
  async (req, res) => {
    try {
      const { offerMessage } = req.body;

      console.log("=== HR FINAL REVIEW REQUEST ===");
      console.log("Application ID:", req.params.id);
      console.log("HR User:", req.user.email);

      if (!offerMessage || !offerMessage.trim()) {
        return res.status(400).json({ message: "Offer message is required" });
      }

      const application = await Application.findById(req.params.id).populate(
        "user"
      );

      if (!application) {
        return res.status(404).json({ message: "Application not found" });
      }

      if (application.status !== "hr_final_review") {
        return res.status(400).json({
          message: "Application is not ready for final review",
        });
      }

      // Update application to approved
      application.status = "approved";
      application.hrFinalComments = offerMessage;
      application.hrFinalReviewDate = Date.now();
      application.offerEmailSent = true;
      application.offerEmailSentAt = Date.now();
      application.offerEmailSentBy = req.user._id;

      await application.save();

      console.log("HR sent offer email - Application approved");

      // Send offer email to applicant
      const user = await User.findById(application.user);
      await sendOfferEmail(user, application, offerMessage);

      console.log("=== END HR FINAL REVIEW ===");

      res.json({
        ...application.toObject(),
        message: "Offer email sent successfully! Application approved.",
      });
    } catch (error) {
      console.error("HR Final Review error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// =============================================================
// 📊 ANALYTICS ROUTE - UPDATED FOR ROLE-SPECIFIC DATA
// =============================================================
router.get(
  "/analytics/stats",
  protect,
  authorize("hr", "hod", "chief_of_staff", "principal_secretary"),
  async (req, res) => {
    try {
      let query = {};

      // Apply role-based filters for analytics too
      if (req.user.role === "hod") {
        query.preferredDepartment = req.user.department;
        query.preferredSubdepartment = req.user.subdepartment;
      } else if (
        req.user.role === "chief_of_staff" ||
        req.user.role === "principal_secretary"
      ) {
        query.preferredDepartment = req.user.department;
      }

      const applications = await Application.find(query).populate(
        "user",
        "firstName middleName lastName email institution course role"
      );

      const statusCounts = {
        pending: applications.filter((a) => a.status === "pending").length,
        hr_review: applications.filter((a) => a.status === "hr_review").length,
        hod_review: applications.filter((a) => a.status === "hod_review")
          .length,
        hr_final_review: applications.filter(
          (a) => a.status === "hr_final_review"
        ).length, // ✅ NEW STATUS
        approved: applications.filter((a) => a.status === "approved").length,
        rejected: applications.filter((a) => a.status === "rejected").length,
      };

      // Role counts based on applicantRole field
      const roleCounts = {
        intern: applications.filter((a) => a.applicantRole === "intern").length,
        attachee: applications.filter((a) => a.applicantRole === "attachee")
          .length,
      };

      const departmentCounts = {};
      const institutionCounts = {};

      applications.forEach((a) => {
        const dept = a.preferredDepartment || "Not Specified";
        departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;

        const institution = a.user?.institution || "Not Specified";
        institutionCounts[institution] =
          (institutionCounts[institution] || 0) + 1;
      });

      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      const monthlyData = {};
      const months = [];

      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const key = date.toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        });
        months.push(key);
        monthlyData[key] = 0;
      }

      applications.forEach((a) => {
        const date = new Date(a.createdAt);
        if (date >= sixMonthsAgo) {
          const key = date.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
          });
          if (monthlyData.hasOwnProperty(key)) monthlyData[key]++;
        }
      });

      const timelineData = months.map((month) => ({
        month,
        count: monthlyData[month],
      }));

      const totalProcessed = statusCounts.approved + statusCounts.rejected;
      const approvalRate =
        totalProcessed > 0
          ? ((statusCounts.approved / totalProcessed) * 100).toFixed(1)
          : 0;

      const recentApplications = applications
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map((a) => ({
          id: a._id,
          name: `${a.user?.firstName} ${a.user?.lastName}`,
          role: a.applicantRole,
          department: a.preferredDepartment,
          subdepartment: a.preferredSubdepartment,
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
  }
);

// =============================================================
// 🔍 GET ALL APPLICATIONS (UPDATED FOR ALL ROLES)
// =============================================================
router.get(
  "/",
  protect,
  authorize("hr", "hod", "admin", "chief_of_staff", "principal_secretary"),
  async (req, res) => {
    try {
      let query = {};

      // HOD - only their subdepartment
      if (req.user.role === "hod") {
        query.preferredDepartment = req.user.department;
        query.preferredSubdepartment = req.user.subdepartment;

        console.log("=== HOD BACKEND FILTER ===");
        console.log("HOD User:", req.user.email);
        console.log("HOD Department:", req.user.department);
        console.log("HOD Subdepartment:", req.user.subdepartment);
        console.log("Query:", query);
      }

      // COS and PS - only their department (all subdepartments)
      if (
        req.user.role === "chief_of_staff" ||
        req.user.role === "principal_secretary"
      ) {
        query.preferredDepartment = req.user.department;

        console.log("=== COS/PS BACKEND FILTER ===");
        console.log("User:", req.user.email);
        console.log("Role:", req.user.role);
        console.log("Department:", req.user.department);
        console.log("Query:", query);
      }

      // HR and Admin see all (no department filter)

      // Status filter (applies to all roles)
      if (req.query.status) {
        query.status = req.query.status;
      }

      // Additional filters for HR and Admin only
      if (req.user.role === "hr" || req.user.role === "admin") {
        if (req.query.department)
          query.preferredDepartment = req.query.department;
        if (req.query.subdepartment)
          query.preferredSubdepartment = req.query.subdepartment;
        if (req.query.role) query.applicantRole = req.query.role;
      }

      const applications = await Application.find(query)
        .populate("user", "-password")
        .sort({ createdAt: -1 });

      console.log("Found Applications:", applications.length);

      if (
        req.user.role === "hod" ||
        req.user.role === "chief_of_staff" ||
        req.user.role === "principal_secretary"
      ) {
        console.log(
          "Application Details:",
          applications.map((app) => ({
            id: app._id,
            dept: app.preferredDepartment,
            subdept: app.preferredSubdepartment,
            role: app.applicantRole,
            status: app.status,
          }))
        );
        console.log("=== END BACKEND DEBUG ===");
      }

      res.json(applications);
    } catch (error) {
      console.error("Fetch applications error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
