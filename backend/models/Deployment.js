const mongoose = require('mongoose');

const deploymentSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  commitHash: {
    type: String,
    required: true,
  },
  commitMessage: {
    type: String,
    maxlength: 500,
  },
  branch: {
    type: String,
    required: true,
    default: 'main',
  },
  status: {
    type: String,
    enum: ['pending', 'building', 'deploying', 'success', 'failed', 'cancelled'],
    default: 'pending',
  },
  statusMessage: {
    type: String,
  },
  deploymentUrl: {
    type: String,
  },
  buildLogs: [{
    timestamp: {
      type: Date,
      default: Date.now,
    },
    level: {
      type: String,
      enum: ['info', 'warn', 'error'],
      default: 'info',
    },
    message: {
      type: String,
      required: true,
    },
  }],
  buildDuration: {
    type: Number, // in milliseconds
  },
  deployDuration: {
    type: Number, // in milliseconds
  },
  buildStartedAt: {
    type: Date,
  },
  buildFinishedAt: {
    type: Date,
  },
  deployStartedAt: {
    type: Date,
  },
  deployFinishedAt: {
    type: Date,
  },
  triggeredBy: {
    type: String,
    enum: ['webhook', 'manual', 'api'],
    default: 'manual',
  },
  providerDeploymentId: {
    type: String, // Vercel deployment ID, Netlify deploy ID, etc.
  },
  environment: {
    type: String,
    enum: ['production', 'staging', 'development'],
    default: 'production',
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed, // Store provider-specific metadata
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for better query performance
deploymentSchema.index({ projectId: 1, createdAt: -1 });
deploymentSchema.index({ userId: 1 });
deploymentSchema.index({ status: 1 });
deploymentSchema.index({ commitHash: 1 });

// Pre-save middleware to update the updatedAt field
deploymentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add build log
deploymentSchema.methods.addBuildLog = function(level, message) {
  this.buildLogs.push({
    level,
    message,
    timestamp: new Date(),
  });
  return this.save();
};

// Method to update status
deploymentSchema.methods.updateStatus = function(status, message = null) {
  this.status = status;
  if (message) {
    this.statusMessage = message;
  }

  // Set timestamps based on status
  const now = new Date();
  if (status === 'building' && !this.buildStartedAt) {
    this.buildStartedAt = now;
  } else if (status === 'deploying' && !this.deployStartedAt) {
    this.deployStartedAt = now;
  } else if (['success', 'failed', 'cancelled'].includes(status)) {
    if (this.buildStartedAt && !this.buildFinishedAt) {
      this.buildFinishedAt = now;
      this.buildDuration = now - this.buildStartedAt;
    }
    if (this.deployStartedAt && !this.deployFinishedAt) {
      this.deployFinishedAt = now;
      this.deployDuration = now - this.deployStartedAt;
    }
  }

  return this.save();
};

// Method to get total duration
deploymentSchema.methods.getTotalDuration = function() {
  if (this.buildDuration && this.deployDuration) {
    return this.buildDuration + this.deployDuration;
  }
  return null;
};

// Static method to get deployment stats for a project
deploymentSchema.statics.getProjectStats = async function(projectId) {
  const stats = await this.aggregate([
    { $match: { projectId: mongoose.Types.ObjectId(projectId) } },
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id] = stat.count;
    return acc;
  }, {});
};

// Virtual for formatted duration
deploymentSchema.virtual('formattedDuration').get(function() {
  const totalMs = this.getTotalDuration();
  if (!totalMs) return null;

  const seconds = Math.floor(totalMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  return `${remainingSeconds}s`;
});

// Ensure virtual fields are serialized
deploymentSchema.set('toJSON', { virtuals: true });
deploymentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Deployment', deploymentSchema);

