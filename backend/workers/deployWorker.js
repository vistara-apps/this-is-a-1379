const DeploymentService = require('../services/deploymentService');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');

class DeployWorker {
  constructor() {
    this.deploymentService = new DeploymentService();
    this.activeDeployments = new Map();
  }

  // Start a deployment process
  async startDeployment(projectId, deploymentId, options = {}) {
    try {
      const deployId = `deploy-${projectId}-${deploymentId}`;

      // Check if deployment is already running
      if (this.activeDeployments.has(deployId)) {
        throw new Error('Deployment is already running for this project');
      }

      // Get project and deployment details
      const project = await Project.findById(projectId).populate('userId');
      const deployment = await Deployment.findById(deploymentId);

      if (!project || !deployment) {
        throw new Error('Project or deployment not found');
      }

      // Track active deployment
      this.activeDeployments.set(deployId, {
        projectId,
        deploymentId,
        startTime: new Date(),
        status: 'running',
      });

      // Start deployment (async)
      this.executeDeployment(project, deployment, options)
        .then((result) => {
          console.log(`Deployment ${deployId} completed:`, result);
        })
        .catch((error) => {
          console.error(`Deployment ${deployId} failed:`, error);
        })
        .finally(() => {
          // Clean up active deployment
          this.activeDeployments.delete(deployId);
        });

      return {
        success: true,
        deployId,
        message: 'Deployment started successfully',
      };
    } catch (error) {
      console.error('Start deployment error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Execute deployment
  async executeDeployment(project, deployment, options = {}) {
    try {
      // Update deployment status to deploying
      await deployment.updateStatus('deploying', 'Starting deployment process');
      await deployment.addBuildLog('info', 'Starting deployment to cloud provider');

      const startTime = Date.now();

      // Execute deployment based on provider
      const result = await this.deploymentService.deploy(
        project._id,
        deployment._id,
        options
      );

      const deployDuration = Date.now() - startTime;
      deployment.deployDuration = deployDuration;

      if (result.success) {
        await deployment.updateStatus('success', 'Deployment completed successfully');
        await deployment.addBuildLog('info', `Deployment completed successfully. URL: ${result.deploymentUrl || 'N/A'}`);

        // Update project with deployment URL
        if (result.deploymentUrl) {
          await project.updateDeploymentUrl(result.deploymentUrl);
        }
      } else {
        await deployment.updateStatus('failed', result.error);
        await deployment.addBuildLog('error', `Deployment failed: ${result.error}`);
      }

      return result;

    } catch (error) {
      console.error('Deployment execution error:', error);

      // Update deployment status
      await deployment.updateStatus('failed', error.message);
      await deployment.addBuildLog('error', `Deployment failed: ${error.message}`);

      throw error;
    }
  }

  // Get deployment status
  getDeploymentStatus(deployId) {
    return this.activeDeployments.get(deployId) || null;
  }

  // Cancel deployment
  async cancelDeployment(deployId) {
    try {
      const deployment = this.activeDeployments.get(deployId);
      if (!deployment) {
        return { success: false, error: 'Deployment not found' };
      }

      // Update deployment status to cancelled
      const deployRecord = await Deployment.findById(deployment.deploymentId);
      if (deployRecord) {
        await deployRecord.updateStatus('cancelled', 'Deployment cancelled by user');
        await deployRecord.addBuildLog('info', 'Deployment cancelled by user');
      }

      // Clean up
      this.activeDeployments.delete(deployId);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all active deployments
  getActiveDeployments() {
    return Array.from(this.activeDeployments.entries()).map(([deployId, deployment]) => ({
      deployId,
      ...deployment,
    }));
  }

  // Retry failed deployment
  async retryDeployment(projectId, deploymentId) {
    try {
      const deployment = await Deployment.findById(deploymentId);

      if (!deployment) {
        return { success: false, error: 'Deployment not found' };
      }

      // Check if deployment can be retried
      if (!['failed', 'cancelled'].includes(deployment.status)) {
        return { success: false, error: 'Deployment is not in a retryable state' };
      }

      // Create new deployment record
      const newDeployment = new Deployment({
        projectId: deployment.projectId,
        userId: deployment.userId,
        commitHash: deployment.commitHash,
        branch: deployment.branch,
        status: 'pending',
        triggeredBy: 'manual',
        environment: deployment.environment,
      });

      await newDeployment.save();

      // Start new deployment
      return await this.startDeployment(projectId, newDeployment._id);
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Rollback to previous deployment
  async rollbackDeployment(projectId, targetDeploymentId) {
    try {
      const targetDeployment = await Deployment.findById(targetDeploymentId);

      if (!targetDeployment) {
        return { success: false, error: 'Target deployment not found' };
      }

      // Create rollback deployment
      const rollbackDeployment = new Deployment({
        projectId: targetDeployment.projectId,
        userId: targetDeployment.userId,
        commitHash: targetDeployment.commitHash,
        branch: targetDeployment.branch,
        status: 'pending',
        triggeredBy: 'manual',
        environment: targetDeployment.environment,
      });

      await rollbackDeployment.save();
      await rollbackDeployment.addBuildLog('info', `Rolling back to deployment ${targetDeploymentId}`);

      // Start rollback deployment
      return await this.startDeployment(projectId, rollbackDeployment._id, { rollback: true });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Clean up completed deployments
  cleanupCompletedDeployments() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [deployId, deployment] of this.activeDeployments.entries()) {
      // Remove deployments older than max age
      if ((now - deployment.startTime.getTime()) > maxAge) {
        this.activeDeployments.delete(deployId);
      }
    }
  }

  // Initialize cleanup interval
  startCleanupInterval() {
    // Clean up every hour
    setInterval(() => {
      this.cleanupCompletedDeployments();
    }, 60 * 60 * 1000);
  }
}

module.exports = DeployWorker;

