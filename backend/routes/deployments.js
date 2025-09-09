const express = require('express');
const Deployment = require('../models/Deployment');
const { authenticateToken, validateProjectOwnership } = require('../middleware/auth');

const router = express.Router();

// Get all deployments for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, projectId } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (status) query.status = status;
    if (projectId) query.projectId = projectId;

    const deployments = await Deployment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('projectId', 'name repoName repoOwner')
      .populate('userId', 'name avatar');

    const total = await Deployment.countDocuments(query);

    res.json({
      success: true,
      data: {
        deployments,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get deployments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deployments',
    });
  }
});

// Get single deployment
router.get('/:deploymentId', authenticateToken, async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.deploymentId)
      .populate('projectId')
      .populate('userId', 'name avatar');

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found',
      });
    }

    // Check if user owns this deployment
    if (deployment.userId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: deployment,
    });
  } catch (error) {
    console.error('Get deployment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deployment',
    });
  }
});

// Get deployment logs
router.get('/:deploymentId/logs', authenticateToken, async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.deploymentId);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found',
      });
    }

    // Check if user owns this deployment
    if (deployment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    res.json({
      success: true,
      data: {
        logs: deployment.buildLogs,
        status: deployment.status,
        buildDuration: deployment.buildDuration,
        deployDuration: deployment.deployDuration,
      },
    });
  } catch (error) {
    console.error('Get deployment logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deployment logs',
    });
  }
});

// Cancel deployment (if still pending/building)
router.post('/:deploymentId/cancel', authenticateToken, async (req, res) => {
  try {
    const deployment = await Deployment.findById(req.params.deploymentId);

    if (!deployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found',
      });
    }

    // Check if user owns this deployment
    if (deployment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Only allow cancellation if deployment is still in progress
    if (!['pending', 'building', 'deploying'].includes(deployment.status)) {
      return res.status(400).json({
        success: false,
        message: 'Deployment cannot be cancelled at this stage',
      });
    }

    await deployment.updateStatus('cancelled', 'Cancelled by user');

    res.json({
      success: true,
      message: 'Deployment cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel deployment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel deployment',
    });
  }
});

// Redeploy (create new deployment based on existing one)
router.post('/:deploymentId/redeploy', [
  authenticateToken,
  require('../middleware/auth').checkDeploymentLimit,
], async (req, res) => {
  try {
    const originalDeployment = await Deployment.findById(req.params.deploymentId)
      .populate('projectId');

    if (!originalDeployment) {
      return res.status(404).json({
        success: false,
        message: 'Deployment not found',
      });
    }

    // Check if user owns this deployment
    if (originalDeployment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Create new deployment
    const newDeployment = new Deployment({
      projectId: originalDeployment.projectId._id,
      userId: req.user._id,
      commitHash: originalDeployment.commitHash,
      branch: originalDeployment.branch,
      status: 'pending',
      triggeredBy: 'manual',
      environment: originalDeployment.environment,
    });

    await newDeployment.save();

    // TODO: Trigger actual deployment process

    res.status(201).json({
      success: true,
      data: newDeployment,
    });
  } catch (error) {
    console.error('Redeploy error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to redeploy',
    });
  }
});

// Get deployment statistics
router.get('/stats/overview', authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get deployment stats for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const stats = await Deployment.aggregate([
      {
        $match: {
          userId: userId,
          createdAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const totalDeployments = stats.reduce((sum, stat) => sum + stat.count, 0);
    const successfulDeployments = stats.find(stat => stat._id === 'success')?.count || 0;
    const failedDeployments = stats.find(stat => stat._id === 'failed')?.count || 0;

    const successRate = totalDeployments > 0 ? (successfulDeployments / totalDeployments) * 100 : 0;

    res.json({
      success: true,
      data: {
        totalDeployments,
        successfulDeployments,
        failedDeployments,
        successRate: Math.round(successRate * 100) / 100,
        statusBreakdown: stats,
      },
    });
  } catch (error) {
    console.error('Get deployment stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deployment statistics',
    });
  }
});

module.exports = router;

