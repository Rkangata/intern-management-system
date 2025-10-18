const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  applicationLetter: {
    type: String,
    required: true
  },
  cv: {
    type: String,
    required: true
  },
  transcripts: {
    type: String
  },
  recommendationLetter: {
    type: String
  },
  nationalId: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    required: true
  },
  preferredDepartment: {
    type: String,
    required: true
  },
  preferredSubdepartment: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'hr_review', 'hod_review', 'approved', 'rejected'],
    default: 'pending'
  },
  hrComments: {
    type: String
  },
  hodComments: {
    type: String
  },
  reviewedByHR: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedByHOD: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  hrReviewDate: {
    type: Date
  },
  hodReviewDate: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
applicationSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Application', applicationSchema);