const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  phoneNumber: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['intern', 'attachee', 'hr', 'hod', 'admin'],
    required: true
  },

  // ✅ Additional fields for interns/attachees
  institution: {
    type: String,
    required: function () {
      return this.role === 'intern' || this.role === 'attachee';
    }
  },
  course: {
    type: String,
    required: function () {
      return this.role === 'intern' || this.role === 'attachee';
    }
  },
  yearOfStudy: {
    type: String,
    required: function () {
      return this.role === 'intern' || this.role === 'attachee';
    }
  },

  // ✅ Department fields (required for all except admin)
  department: {
    type: String,
    required: function () {
      return this.role !== 'admin';
    }
  },
  subdepartment: {
    type: String,
    required: function () {
      return this.role !== 'admin';
    }
  },

  // ✅ Optional fields for all users
  profilePicture: {
    type: String,
    default: ''
  },

  // ✅ New field for user activity status
  isActive: {
    type: Boolean,
    default: true // Ensures new users are active by default
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ✅ Encrypt password before saving
userSchema.pre('save', async function(next) {
  // Only hash if password is modified
  if (!this.isModified('password')) {
    return next();
  }

  console.log('Hashing password for user:', this.email);
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  console.log('Password hashed successfully');
  next();
});

// ✅ Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  console.log('Comparing passwords for user:', this.email);
  const match = await bcrypt.compare(enteredPassword, this.password);
  console.log('Password match result:', match);
  return match;
};

// ✅ Export User model
module.exports = mongoose.model('User', userSchema);
