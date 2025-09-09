const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ message: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'Invalid token' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Middleware to check if user has required subscription tier
const requireSubscription = (requiredTier) => {
  return (req, res, next) => {
    const user = req.user;
    const tierHierarchy = {
      'free': 0,
      'starter': 1,
      'professional': 2,
      'enterprise': 3,
    };

    if (tierHierarchy[user.subscriptionTier] < tierHierarchy[requiredTier]) {
      return res.status(403).json({
        message: `This feature requires ${requiredTier} subscription or higher`,
        requiredTier,
        currentTier: user.subscriptionTier,
      });
    }

    next();
  };
};

// Middleware to check deployment limits
const checkDeploymentLimit = async (req, res, next) => {
  try {
    const user = req.user;

    // Skip check for enterprise users (unlimited)
    if (user.subscriptionTier === 'enterprise') {
      return next();
    }

    // Get current deployment count for this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const Deployment = require('../models/Deployment');
    const deploymentCount = await Deployment.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
    });

    if (deploymentCount >= user.deploymentLimit) {
      return res.status(429).json({
        message: 'Deployment limit reached for this month',
        limit: user.deploymentLimit,
        used: deploymentCount,
        resetDate: new Date(startOfMonth.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    next();
  } catch (error) {
    console.error('Error checking deployment limit:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware to validate project ownership
const validateProjectOwnership = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const user = req.user;

    const Project = require('../models/Project');
    const project = await Project.findOne({
      _id: projectId,
      userId: user._id,
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found or access denied' });
    }

    req.project = project;
    next();
  } catch (error) {
    console.error('Error validating project ownership:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Middleware for optional authentication (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const user = await User.findById(decoded.userId);

      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Don't fail, just continue without user
    next();
  }
};

module.exports = {
  authenticateToken,
  requireSubscription,
  checkDeploymentLimit,
  validateProjectOwnership,
  optionalAuth,
};

