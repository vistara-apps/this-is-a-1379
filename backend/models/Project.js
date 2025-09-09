const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100,
  },
  description: {
    type: String,
    maxlength: 500,
  },
  repoUrl: {
    type: String,
    required: true,
  },
  repoName: {
    type: String,
    required: true,
  },
  repoOwner: {
    type: String,
    required: true,
  },
  defaultBranch: {
    type: String,
    default: 'main',
  },
  cloudProvider: {
    type: String,
    required: true,
    enum: ['vercel', 'netlify', 'aws', 'digitalocean'],
  },
  deploymentTarget: {
    type: String,
    required: true,
    enum: ['static', 'serverless', 'container'],
  },
  buildCommand: {
    type: String,
    default: 'npm run build',
  },
  outputDirectory: {
    type: String,
    default: 'dist',
  },
  installCommand: {
    type: String,
    default: 'npm install',
  },
  nodeVersion: {
    type: String,
    default: '18',
  },
  environmentVariables: [{
    key: {
      type: String,
      required: true,
    },
    value: {
      type: String,
      required: true,
    },
    isSecret: {
      type: Boolean,
      default: false,
    },
  }],
  webhookSecret: {
    type: String,
    required: true,
  },
  webhookId: {
    type: String,
  },
  deploymentUrl: {
    type: String,
  },
  providerProjectId: {
    type: String, // Vercel project ID, Netlify site ID, etc.
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'error'],
    default: 'active',
  },
  lastDeployment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Deployment',
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
projectSchema.index({ userId: 1 });
projectSchema.index({ repoUrl: 1 });
projectSchema.index({ cloudProvider: 1 });
projectSchema.index({ status: 1 });

// Pre-save middleware to update the updatedAt field
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to get deployment count
projectSchema.methods.getDeploymentCount = async function() {
  const Deployment = mongoose.model('Deployment');
  return await Deployment.countDocuments({ projectId: this._id });
};

// Method to get recent deployments
projectSchema.methods.getRecentDeployments = async function(limit = 10) {
  const Deployment = mongoose.model('Deployment');
  return await Deployment.find({ projectId: this._id })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('userId', 'name avatar');
};

// Method to update deployment URL
projectSchema.methods.updateDeploymentUrl = function(url) {
  this.deploymentUrl = url;
  return this.save();
};

// Method to deactivate project
projectSchema.methods.deactivate = function() {
  this.status = 'inactive';
  return this.save();
};

// Method to reactivate project
projectSchema.methods.reactivate = function() {
  this.status = 'active';
  return this.save();
};

// Virtual for full repository URL
projectSchema.virtual('fullRepoUrl').get(function() {
  return `https://github.com/${this.repoOwner}/${this.repoName}`;
});

// Ensure virtual fields are serialized
projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Project', projectSchema);

