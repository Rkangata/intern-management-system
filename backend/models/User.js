const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // ✅ SPLIT NAME FIELDS
  firstName: {
    type: String,
    required: [true, "First name is required"],
    trim: true,
  },
  middleName: {
    type: String,
    trim: true,
    default: "", // Optional
  },
  lastName: {
    type: String,
    required: [true, "Last name is required"],
    trim: true,
  },

  // ✅ KEEP fullName as virtual field for backward compatibility
  fullName: {
    type: String,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  phoneNumber: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: [
      "intern",
      "attachee",
      "hr",
      "hod",
      "admin",
      "chief_of_staff",
      "principal_secretary",
    ],
    required: true,
  },

  // ✅ Additional fields for interns/attachees
  institution: {
    type: String,
    required: function () {
      return this.role === "intern" || this.role === "attachee";
    },
  },
  course: {
    type: String,
    required: function () {
      return this.role === "intern" || this.role === "attachee";
    },
  },
  yearOfStudy: {
    type: String,
    required: function () {
      return this.role === "intern" || this.role === "attachee";
    },
  },

  // ✅ Department fields
  // Required for all except admin
  // COS and PS only need department (no subdepartment)
  department: {
    type: String,
    required: function () {
      return this.role !== "admin";
    },
  },
  subdepartment: {
    type: String,
    required: function () {
      // Only required for roles that work at subdepartment level
      return ["intern", "attachee", "hr", "hod"].includes(this.role);
    },
  },

  // ✅ Optional fields for all users
  profilePicture: {
    type: String,
    default: "",
  },

  // ✅ New field for user activity status
  isActive: {
    type: Boolean,
    default: true,
  },

  // ✅ NEW: Force password change on first login
  mustChangePassword: {
    type: Boolean,
    default: false,
  },

  // ✅ NEW: Track who created this user (for HR-created accounts)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ✅ Auto-generate fullName before saving
userSchema.pre("save", function (next) {
  // Generate fullName from individual fields
  if (this.firstName && this.lastName) {
    this.fullName = this.middleName
      ? `${this.firstName} ${this.middleName} ${this.lastName}`.trim()
      : `${this.firstName} ${this.lastName}`.trim();
  }
  next();
});

// ✅ Encrypt password before saving
userSchema.pre("save", async function (next) {
  // Only hash if password is modified
  if (!this.isModified("password")) {
    return next();
  }

  console.log("Hashing password for user:", this.email);
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log("Password hashed successfully");
  next();
});

// ✅ Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  console.log("Comparing passwords for user:", this.email);
  const match = await bcrypt.compare(enteredPassword, this.password);
  console.log("Password match result:", match);
  return match;
};

// ✅ Virtual field to get full name (for queries that use fullName)
userSchema.virtual("displayName").get(function () {
  return this.middleName
    ? `${this.firstName} ${this.middleName} ${this.lastName}`
    : `${this.firstName} ${this.lastName}`;
});

// ✅ Export User model
module.exports = mongoose.model("User", userSchema);
