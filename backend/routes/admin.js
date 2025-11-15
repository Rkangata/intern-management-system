const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const {
  sendAccountCreatedEmail,
  sendPasswordResetEmail,
} = require("../utils/emailService");
const bcrypt = require("bcryptjs");

// ========================================================
// 👥 CREATE USER - ✅ SENDS EMAIL WITH TEMPORARY PASSWORD
// ========================================================

// @route   POST /api/admin/create-user
// @desc    Admin creates any type of user
// @access  Private (admin only)
router.post("/create-user", protect, authorize("admin"), async (req, res) => {
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
      subdepartment,
    } = req.body;

    console.log("=== CREATE USER REQUEST ===");
    console.log("Role:", role);
    console.log("Department:", department);
    console.log("Subdepartment:", subdepartment);
    console.log("Created by:", req.user.email);

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Generate temporary password
    const tempPassword = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();

    // Prepare user data
    const userData = {
      firstName,
      middleName: middleName || "",
      lastName,
      email,
      password: tempPassword,
      phoneNumber,
      role,
    };

    // Add department (required for all except admin)
    if (role !== "admin") {
      userData.department = department;

      // Subdepartment only for roles that need it
      // COS and PS work at department level only
      if (["intern", "attachee", "hr", "hod"].includes(role)) {
        userData.subdepartment = subdepartment || "NONE";
      }
    }

    // Add extra fields for interns or attachees
    if (role === "intern" || role === "attachee") {
      userData.institution = institution;
      userData.course = course;
      userData.yearOfStudy = yearOfStudy;
    }

    console.log("Creating user with data:", {
      ...userData,
      password: "[HIDDEN]",
    });

    // Create user
    const user = await User.create(userData);

    console.log("User created successfully:", user._id);

    // ✅ Send account created email with temporary password
    await sendAccountCreatedEmail(user, tempPassword, req.user.fullName);

    console.log("Account email sent to:", user.email);
    console.log("=== END CREATE USER ===");

    // ✅ SECURITY: Don't return password in production
    // Only show confirmation that email was sent
    res.status(201).json({
      message:
        "User created successfully. Login credentials have been sent to their email.",
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
      emailSent: true,
      // ⚠️ DEVELOPMENT ONLY: Remove this in production
      ...(process.env.NODE_ENV === "development" && {
        temporaryPassword: tempPassword,
      }),
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({ message: error.message });
  }
});

// ========================================================
// 👥 GET ALL STAFF USERS
// ========================================================

// @route   GET /api/admin/users
// @desc    Get all staff users (HR, HOD, COS, PS)
// @access  Private (admin only)
router.get("/users", protect, authorize("admin"), async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["hr", "hod", "chief_of_staff", "principal_secretary"] },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================================
// 👥 GET ALL APPLICANTS
// ========================================================

// @route   GET /api/admin/all-applicants
// @desc    Get all interns and attachees
// @access  Private (admin only)
router.get("/all-applicants", protect, authorize("admin"), async (req, res) => {
  try {
    const applicants = await User.find({
      role: { $in: ["intern", "attachee"] },
    })
      .select("-password")
      .sort({ createdAt: -1 });

    res.json(applicants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================================
// 🗑️ DELETE USER
// ========================================================

// @route   DELETE /api/admin/users/:id
// @desc    Delete user
// @access  Private (admin only)
router.delete("/users/:id", protect, authorize("admin"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent deleting admin users
    if (user.role === "admin") {
      return res.status(400).json({ message: "Cannot delete admin users" });
    }

    await user.deleteOne();

    console.log("User deleted:", user.email, "by", req.user.email);

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ========================================================
// 🔑 RESET USER PASSWORD - ✅ SENDS EMAIL
// ========================================================

// @route   PUT /api/admin/users/:id/reset-password
// @desc    Admin resets user password
// @access  Private (admin only)
router.put(
  "/users/:id/reset-password",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log("=== ADMIN PASSWORD RESET ===");
      console.log("Resetting password for:", user.email);
      console.log("Reset by admin:", req.user.email);

      // Generate and hash new password
      const newPassword = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );

      console.log("Password reset successfully");

      // ✅ Send password reset email
      await sendPasswordResetEmail(user, newPassword);

      console.log("Password reset email sent");
      console.log("=== END ADMIN PASSWORD RESET ===");

      // ✅ SECURITY: Don't return password in production
      res.json({
        message: `Password reset email has been sent to ${user.email}`,
        emailSent: true,
        // ⚠️ DEVELOPMENT ONLY: Remove this in production
        ...(process.env.NODE_ENV === "development" && { newPassword }),
      });
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// ========================================================
// 🔄 RESEND CREDENTIALS EMAIL
// ========================================================

// @route   POST /api/admin/users/:id/resend-credentials
// @desc    Resend login credentials to user
// @access  Private (admin only)
router.post(
  "/users/:id/resend-credentials",
  protect,
  authorize("admin"),
  async (req, res) => {
    try {
      const user = await User.findById(req.params.id);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      console.log("=== RESEND CREDENTIALS ===");
      console.log("User:", user.email);
      console.log("Requested by:", req.user.email);

      // Generate new temporary password
      const tempPassword = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      await User.updateOne(
        { _id: user._id },
        { $set: { password: hashedPassword } }
      );

      // Send email with new credentials
      await sendAccountCreatedEmail(user, tempPassword, req.user.fullName);

      console.log("Credentials resent successfully");
      console.log("=== END RESEND CREDENTIALS ===");

      res.json({
        message: `New credentials have been sent to ${user.email}`,
        emailSent: true,
      });
    } catch (error) {
      console.error("Resend credentials error:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

module.exports = router;
