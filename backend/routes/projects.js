const express = require('express');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const { authenticateToken, checkDeploymentLimit, validateProjectOwnership } = require('../middleware/auth');

const router = express.Router();

// Get all projects for authenticated user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .populate('lastDeployment');

    res.json({
      success: true,
      data: projects,
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get projects',
    });
  }
});

// Get single project
router.get('/:projectId', authenticateToken, validateProjectOwnership, async (req, res) => {
  try {
    const project = await Project.findById(req.project._id)
      .populate('lastDeployment')
      .populate('userId', 'name avatar');

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get project',
    });
  }
});

// Create new project
router.post('/', [
  authenticateToken,
  checkDeploymentLimit,
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Project name is required and must be less than 100 characters'),
  body('repoUrl').isURL().withMessage('Valid repository URL is required'),
  body('cloudProvider').isIn(['vercel', 'netlify', 'aws', 'digitalocean']).withMessage('Invalid cloud provider'),
  body('deploymentTarget').isIn(['static', 'serverless', 'container']).withMessage('Invalid deployment target'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      name,
      description,
      repoUrl,
      cloudProvider,
      deploymentTarget,
      buildCommand = 'npm run build',
      outputDirectory = 'dist',
      installCommand = 'npm install',
      nodeVersion = '18',
      environmentVariables = [],
    } = req.body;

    // Parse repository URL to get owner and name
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+?)(\.git)?$/);
    if (!repoMatch) {
      return res.status(400).json({
        success: false,
        message: 'Invalid GitHub repository URL',
      });
    }

    const repoOwner = repoMatch[1];
    const repoName = repoMatch[2];

    // Generate webhook secret
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    // Create project
    const project = new Project({
      userId: req.user._id,
      name,
      description,
      repoUrl,
      repoName,
      repoOwner,
      cloudProvider,
      deploymentTarget,
      buildCommand,
      outputDirectory,
      installCommand,
      nodeVersion,
      environmentVariables,
      webhookSecret,
    });

    await project.save();

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create project',
    });
  }
});

// Update project
router.put('/:projectId', [
  authenticateToken,
  validateProjectOwnership,
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Project name must be less than 100 characters'),
  body('repoUrl').optional().isURL().withMessage('Valid repository URL is required'),
  body('cloudProvider').optional().isIn(['vercel', 'netlify', 'aws', 'digitalocean']).withMessage('Invalid cloud provider'),
  body('deploymentTarget').optional().isIn(['static', 'serverless', 'container']).withMessage('Invalid deployment target'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const allowedFields = [
      'name', 'description', 'buildCommand', 'outputDirectory',
      'installCommand', 'nodeVersion', 'environmentVariables'
    ];

    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const project = await Project.findByIdAndUpdate(
      req.project._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update project',
    });
  }
});

// Delete project
router.delete('/:projectId', authenticateToken, validateProjectOwnership, async (req, res) => {
  try {
    // Delete associated deployments
    await Deployment.deleteMany({ projectId: req.project._id });

    // Delete project
    await Project.findByIdAndDelete(req.project._id);

    res.json({
      success: true,
      message: 'Project deleted successfully',
    });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete project',
    });
  }
});

// Get project deployments
router.get('/:projectId/deployments', authenticateToken, validateProjectOwnership, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const deployments = await Deployment.find({ projectId: req.project._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'name avatar');

    const total = await Deployment.countDocuments({ projectId: req.project._id });

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
    console.error('Get project deployments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get deployments',
    });
  }
});

// Trigger manual deployment
router.post('/:projectId/deploy', [
  authenticateToken,
  validateProjectOwnership,
  checkDeploymentLimit,
], async (req, res) => {
  try {
    const { commitHash, branch = 'main' } = req.body;

    // Create deployment record
    const deployment = new Deployment({
      projectId: req.project._id,
      userId: req.user._id,
      commitHash: commitHash || 'manual-deploy',
      branch,
      status: 'pending',
      triggeredBy: 'manual',
    });

    await deployment.save();

    // TODO: Trigger actual deployment process
    // This would integrate with the deployment service

    res.status(201).json({
      success: true,
      data: deployment,
    });
  } catch (error) {
    console.error('Manual deployment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger deployment',
    });
  }
});

module.exports = router;

