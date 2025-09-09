const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// GitHub OAuth routes
router.get('/github',
  passport.authenticate('github', { scope: ['user:email', 'repo'] })
);

router.get('/github/callback',
  passport.authenticate('github', { failureRedirect: '/login' }),
  async (req, res) => {
    try {
      const token = generateToken(req.user._id);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=oauth_failed`);
    }
  }
);

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-githubAccessToken');
    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user data',
    });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const { name, email } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;

    await user.save();

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile',
    });
  }
});

// Logout (client-side token removal)
router.post('/logout', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// Refresh token
router.post('/refresh', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found',
      });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        token,
        user,
      },
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to refresh token',
    });
  }
});

// Get user subscription info
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('subscriptionTier subscriptionStatus deploymentLimit buildMinutesLimit');

    // Get deployment count for current month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const Deployment = require('../models/Deployment');
    const deploymentCount = await Deployment.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
    });

    res.json({
      success: true,
      data: {
        tier: user.subscriptionTier,
        status: user.subscriptionStatus,
        limits: {
          deployments: {
            used: deploymentCount,
            limit: user.deploymentLimit,
          },
          buildMinutes: {
            used: 0, // TODO: Implement build minutes tracking
            limit: user.buildMinutesLimit,
          },
        },
      },
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get subscription info',
    });
  }
});

module.exports = router;

