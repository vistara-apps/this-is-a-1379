const express = require('express');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Get subscription plans
router.get('/plans', (req, res) => {
  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      features: [
        '5 deployments per month',
        '100 build minutes',
        'Basic support',
        'Vercel & Netlify integration'
      ],
      limits: {
        deployments: 5,
        buildMinutes: 100,
      },
    },
    {
      id: 'starter',
      name: 'Starter',
      price: 9.99,
      features: [
        '50 deployments per month',
        '1,000 build minutes',
        'Priority support',
        'All cloud providers',
        'Custom domains'
      ],
      limits: {
        deployments: 50,
        buildMinutes: 1000,
      },
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 29.99,
      features: [
        '200 deployments per month',
        '5,000 build minutes',
        'Premium support',
        'Advanced analytics',
        'Team collaboration',
        'Custom integrations'
      ],
      limits: {
        deployments: 200,
        buildMinutes: 5000,
      },
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99.99,
      features: [
        'Unlimited deployments',
        'Unlimited build minutes',
        'Dedicated support',
        'Advanced security',
        'Custom SLAs',
        'On-premise deployment'
      ],
      limits: {
        deployments: -1, // Unlimited
        buildMinutes: -1, // Unlimited
      },
    },
  ];

  res.json({
    success: true,
    data: plans,
  });
});

// Update subscription (mock implementation)
router.post('/subscribe', authenticateToken, async (req, res) => {
  try {
    const { planId } = req.body;

    const validPlans = ['free', 'starter', 'professional', 'enterprise'];
    if (!validPlans.includes(planId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid plan ID',
      });
    }

    const user = await User.findById(req.user._id);
    await user.updateSubscription(planId);

    res.json({
      success: true,
      message: `Successfully subscribed to ${planId} plan`,
      data: {
        tier: user.subscriptionTier,
        limits: {
          deployments: user.deploymentLimit,
          buildMinutes: user.buildMinutesLimit,
        },
      },
    });
  } catch (error) {
    console.error('Subscription update error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update subscription',
    });
  }
});

// Cancel subscription
router.post('/cancel', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user.subscriptionTier === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel free subscription',
      });
    }

    await user.updateSubscription('free', 'cancelled');

    res.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription',
    });
  }
});

// Get billing history (mock)
router.get('/history', authenticateToken, async (req, res) => {
  try {
    // In a real implementation, this would fetch from Stripe or payment processor
    const mockHistory = [
      {
        id: 'inv_001',
        date: '2024-01-15',
        amount: 29.99,
        status: 'paid',
        plan: 'Professional',
      },
      {
        id: 'inv_002',
        date: '2023-12-15',
        amount: 29.99,
        status: 'paid',
        plan: 'Professional',
      },
    ];

    res.json({
      success: true,
      data: mockHistory,
    });
  } catch (error) {
    console.error('Get billing history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get billing history',
    });
  }
});

// Get usage statistics
router.get('/usage', authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Get current month usage
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const Deployment = require('../models/Deployment');
    const deploymentCount = await Deployment.countDocuments({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
    });

    // Calculate build minutes used (simplified)
    const deployments = await Deployment.find({
      userId: user._id,
      createdAt: { $gte: startOfMonth },
      status: 'success',
    });

    let buildMinutesUsed = 0;
    deployments.forEach(deployment => {
      if (deployment.buildDuration) {
        buildMinutesUsed += Math.ceil(deployment.buildDuration / (1000 * 60)); // Convert to minutes
      }
    });

    res.json({
      success: true,
      data: {
        currentMonth: {
          deployments: {
            used: deploymentCount,
            limit: user.deploymentLimit,
            remaining: Math.max(0, user.deploymentLimit - deploymentCount),
          },
          buildMinutes: {
            used: buildMinutesUsed,
            limit: user.buildMinutesLimit,
            remaining: user.buildMinutesLimit === -1 ? -1 : Math.max(0, user.buildMinutesLimit - buildMinutesUsed),
          },
        },
        resetDate: new Date(startOfMonth.getTime() + 31 * 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('Get usage error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get usage statistics',
    });
  }
});

module.exports = router;

