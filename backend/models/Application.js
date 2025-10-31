const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // ========================================
  // INTERN DOCUMENTS (Different from Attachee)
  // ========================================
  // For INTERNS only:
  appointmentLetter: {
    type: String,
    required: function() {
      return this.applicantRole === 'intern';
    }
  },
  degreeCertificate: {
    type: String,
    required: function() {
      return this.applicantRole === 'intern';
    }
  },
  transcripts: {
    type: String,
    required: function() {
      return this.applicantRole === 'intern';
    }
  },
  nationalIdOrPassport: {
    type: String,
    required: function() {
      return this.applicantRole === 'intern';
    }
  },
  kraPinCertificate: {
    type: String,
    required: function() {
      return this.applicantRole === 'intern';
    }
  },
  goodConductCertificate: {
    type: String,
    required: function() {
      return this.applicantRole === 'intern';
    }
  },
  passportPhotos: {
    type: String,
    required: function() {
      return this.applicantRole === 'intern';
    }
  },
  shifCard: {
    type: String,
    required: function() {
      return this.applicantRole === 'intern';
    }
  },
  insuranceCover: {
    type: String,
    required: function() {
      return this.applicantRole === 'intern';
    }
  },
  nssfCard: {
    type: String,
    required: function() {
      return this.applicantRole === 'intern';
    }
  },
  bioDataForm: {
    type: String,
    required: function() {
      return this.applicantRole === 'intern';
    }
  },

  // ========================================
  // ATTACHEE DOCUMENTS (Different from Intern)
  // ========================================
  // For ATTACHEES only:
  applicationLetter: {
    type: String,
    required: function() {
      return this.applicantRole === 'attachee';
    }
  },
  cv: {
    type: String,
    required: function() {
      return this.applicantRole === 'attachee';
    }
  },
  attacheeTranscripts: {
    type: String,
    required: function() {
      return this.applicantRole === 'attachee';
    }
  },
  recommendationLetter: {
    type: String,
    required: function() {
      return this.applicantRole === 'attachee';
    }
  },
  attacheeNationalId: {
    type: String,
    required: function() {
      return this.applicantRole === 'attachee';
    }
  },
  attacheeInsurance: {
    type: String,
    required: function() {
      return this.applicantRole === 'attachee';
    }
  },
  goodConductCertOrReceipt: {
    type: String,
    required: function() {
      return this.applicantRole === 'attachee';
    }
  },

  // ========================================
  // COMMON FIELDS FOR BOTH
  // ========================================
  applicantRole: {
    type: String,
    enum: ['intern', 'attachee'],
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

  // ========================================
  // REVIEW & COMMENTS
  // ========================================
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

  // ========================================
  // TIMESTAMPS
  // ========================================
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