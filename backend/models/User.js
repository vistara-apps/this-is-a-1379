const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  githubId: {
    type: String,
    required: true,
    unique: true,
  },
  githubUsername: {
    type: String,
    required: true,
  },
  githubProfileUrl: {
    type: String,
  },
  githubAccessToken: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'starter', 'professional', 'enterprise'],
    default: 'free',
  },
  subscriptionStatus: {
    type: String,
    enum: ['active', 'inactive', 'cancelled', 'past_due'],
    default: 'active',
  },
  stripeCustomerId: {
    type: String,
  },
  deploymentLimit: {
    type: Number,
    default: 5, // Free tier limit
  },
  buildMinutesLimit: {
    type: Number,
    default: 100, // Free tier limit
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
});

// Index for better query performance
userSchema.index({ githubId: 1 });
userSchema.index({ email: 1 });
userSchema.index({ subscriptionTier: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return this.name;
});

// Method to check if user can deploy
userSchema.methods.canDeploy = function() {
  // Check subscription limits
  if (this.subscriptionTier === 'free') {
    // Implement deployment count check
    return true; // For now, allow all free users
  }
  return this.subscriptionStatus === 'active';
};

// Method to get remaining deployments
userSchema.methods.getRemainingDeployments = function() {
  // This would typically query the database for deployment count
  // For now, return a mock value
  return this.deploymentLimit;
};

// Method to update subscription
userSchema.methods.updateSubscription = function(tier, status = 'active') {
  this.subscriptionTier = tier;
  this.subscriptionStatus = status;

  // Update limits based on tier
  switch (tier) {
    case 'free':
      this.deploymentLimit = 5;
      this.buildMinutesLimit = 100;
      break;
    case 'starter':
      this.deploymentLimit = 50;
      this.buildMinutesLimit = 1000;
      break;
    case 'professional':
      this.deploymentLimit = 200;
      this.buildMinutesLimit = 5000;
      break;
    case 'enterprise':
      this.deploymentLimit = -1; // Unlimited
      this.buildMinutesLimit = -1; // Unlimited
      break;
    default:
      break;
  }

  return this.save();
};

module.exports = mongoose.model('User', userSchema);

