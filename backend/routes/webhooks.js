const express = require('express');
const crypto = require('crypto');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');

const router = express.Router();

// Middleware to verify GitHub webhook signature
const verifyGitHubWebhook = (req, res, next) => {
  const signature = req.headers['x-hub-signature-256'];
  const event = req.headers['x-github-event'];

  if (!signature || !event) {
    return res.status(400).json({ message: 'Missing webhook signature or event type' });
  }

  // For now, we'll skip signature verification in development
  // In production, you should verify the signature using the webhook secret
  if (process.env.NODE_ENV === 'production') {
    const projectId = req.params.projectId;
    // TODO: Get webhook secret from project and verify signature
  }

  req.githubEvent = event;
  next();
};

// GitHub webhook endpoint
router.post('/github/:projectId', verifyGitHubWebhook, async (req, res) => {
  try {
    const { projectId } = req.params;
    const event = req.githubEvent;
    const payload = req.body;

    // Find the project
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Only process push events to the main branch
    if (event === 'push') {
      const { ref, head_commit, repository } = payload;

      // Check if push is to the configured branch
      if (ref === `refs/heads/${project.defaultBranch}`) {
        console.log(`Received push to ${project.defaultBranch} for project ${project.name}`);

        // Create deployment record
        const deployment = new Deployment({
          projectId: project._id,
          userId: project.userId,
          commitHash: head_commit.id,
          commitMessage: head_commit.message,
          branch: project.defaultBranch,
          status: 'pending',
          triggeredBy: 'webhook',
        });

        await deployment.save();

        // Add initial log
        await deployment.addBuildLog('info', `Deployment triggered by push to ${project.defaultBranch}`);
        await deployment.addBuildLog('info', `Commit: ${head_commit.id}`);
        await deployment.addBuildLog('info', `Message: ${head_commit.message}`);

        // TODO: Trigger the actual build and deployment process
        // This would queue the deployment for processing

        console.log(`Created deployment ${deployment._id} for project ${project.name}`);
      }
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ message: 'Webhook received' });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Vercel webhook endpoint (for deployment status updates)
router.post('/vercel/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const payload = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the latest deployment for this project
    const deployment = await Deployment.findOne({
      projectId: project._id,
      status: { $in: ['building', 'deploying'] }
    }).sort({ createdAt: -1 });

    if (deployment) {
      // Update deployment status based on Vercel webhook
      if (payload.type === 'deployment.succeeded') {
        await deployment.updateStatus('success', 'Deployment completed successfully');
        await deployment.addBuildLog('info', 'Vercel deployment succeeded');

        // Update project with deployment URL
        if (payload.payload?.deployment?.url) {
          await project.updateDeploymentUrl(payload.payload.deployment.url);
        }
      } else if (payload.type === 'deployment.failed') {
        await deployment.updateStatus('failed', 'Deployment failed');
        await deployment.addBuildLog('error', 'Vercel deployment failed');
      } else if (payload.type === 'deployment.created') {
        await deployment.updateStatus('building', 'Build started on Vercel');
        await deployment.addBuildLog('info', 'Build started on Vercel');
      }
    }

    res.status(200).json({ message: 'Webhook processed' });

  } catch (error) {
    console.error('Vercel webhook error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Netlify webhook endpoint
router.post('/netlify/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const payload = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find the latest deployment for this project
    const deployment = await Deployment.findOne({
      projectId: project._id,
      status: { $in: ['building', 'deploying'] }
    }).sort({ createdAt: -1 });

    if (deployment) {
      // Update deployment status based on Netlify webhook
      if (payload.state === 'ready') {
        await deployment.updateStatus('success', 'Deployment completed successfully');
        await deployment.addBuildLog('info', 'Netlify deployment succeeded');

        // Update project with deployment URL
        if (payload.ssl_url) {
          await project.updateDeploymentUrl(payload.ssl_url);
        }
      } else if (payload.state === 'error') {
        await deployment.updateStatus('failed', 'Deployment failed');
        await deployment.addBuildLog('error', 'Netlify deployment failed');
      } else if (payload.state === 'building') {
        await deployment.updateStatus('building', 'Build started on Netlify');
        await deployment.addBuildLog('info', 'Build started on Netlify');
      }
    }

    res.status(200).json({ message: 'Webhook processed' });

  } catch (error) {
    console.error('Netlify webhook error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

