const DeploymentService = require('./deploymentService');
const GitHubService = require('./github');
const DockerService = require('./docker');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const User = require('../models/User');

class PipelineService {
  constructor() {
    this.deploymentService = new DeploymentService();
    this.dockerService = new DockerService();
    this.activePipelines = new Map(); // Track running pipelines
  }

  // Start deployment pipeline
  async startPipeline(projectId, deploymentId, options = {}) {
    try {
      const pipelineId = `${projectId}-${deploymentId}`;

      // Check if pipeline is already running
      if (this.activePipelines.has(pipelineId)) {
        throw new Error('Pipeline is already running for this deployment');
      }

      // Mark pipeline as active
      this.activePipelines.set(pipelineId, {
        status: 'running',
        startTime: new Date(),
        steps: [],
      });

      // Start pipeline execution (async)
      this.executePipeline(projectId, deploymentId, options)
        .then((result) => {
          console.log(`Pipeline ${pipelineId} completed:`, result);
        })
        .catch((error) => {
          console.error(`Pipeline ${pipelineId} failed:`, error);
        })
        .finally(() => {
          // Clean up active pipeline
          this.activePipelines.delete(pipelineId);
        });

      return {
        success: true,
        pipelineId,
        message: 'Pipeline started successfully',
      };
    } catch (error) {
      console.error('Start pipeline error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Execute pipeline
  async executePipeline(projectId, deploymentId, options = {}) {
    const pipelineId = `${projectId}-${deploymentId}`;
    const pipeline = this.activePipelines.get(pipelineId);

    try {
      // Get project and deployment details
      const project = await Project.findById(projectId).populate('userId');
      const deployment = await Deployment.findById(deploymentId);

      if (!project || !deployment) {
        throw new Error('Project or deployment not found');
      }

      // Pipeline steps
      const steps = [
        { name: 'validate', function: this.validatePipeline.bind(this) },
        { name: 'prepare', function: this.prepareBuild.bind(this) },
        { name: 'build', function: this.buildApplication.bind(this) },
        { name: 'test', function: this.runTests.bind(this) },
        { name: 'deploy', function: this.deployApplication.bind(this) },
        { name: 'cleanup', function: this.cleanupPipeline.bind(this) },
      ];

      // Execute each step
      for (const step of steps) {
        try {
          pipeline.steps.push({
            name: step.name,
            status: 'running',
            startTime: new Date(),
          });

          await deployment.addBuildLog('info', `Starting ${step.name} step`);

          const result = await step.function(project, deployment, options);

          if (!result.success) {
            throw new Error(`Step ${step.name} failed: ${result.error}`);
          }

          // Update step status
          const currentStep = pipeline.steps[pipeline.steps.length - 1];
          currentStep.status = 'completed';
          currentStep.endTime = new Date();
          currentStep.duration = currentStep.endTime - currentStep.startTime;

          await deployment.addBuildLog('info', `${step.name} step completed successfully`);

        } catch (error) {
          // Update step status to failed
          const currentStep = pipeline.steps[pipeline.steps.length - 1];
          currentStep.status = 'failed';
          currentStep.endTime = new Date();
          currentStep.error = error.message;

          await deployment.addBuildLog('error', `${step.name} step failed: ${error.message}`);

          // Mark deployment as failed
          await deployment.updateStatus('failed', error.message);

          throw error;
        }
      }

      // Mark deployment as successful
      await deployment.updateStatus('success', 'Pipeline completed successfully');

      return {
        success: true,
        pipelineId,
        steps: pipeline.steps,
      };

    } catch (error) {
      console.error('Pipeline execution error:', error);

      // Update pipeline status
      if (pipeline) {
        pipeline.status = 'failed';
        pipeline.error = error.message;
        pipeline.endTime = new Date();
      }

      throw error;
    }
  }

  // Validate pipeline prerequisites
  async validatePipeline(project, deployment, options) {
    try {
      // Check Docker availability for container deployments
      if (project.deploymentTarget === 'container') {
        const dockerCheck = await this.dockerService.checkDockerAvailability();
        if (!dockerCheck.success) {
          throw new Error('Docker is not available for container deployment');
        }
      }

      // Validate cloud provider credentials
      const providerCheck = await this.validateProviderCredentials(project);
      if (!providerCheck.valid) {
        throw new Error(`Invalid ${project.cloudProvider} credentials`);
      }

      // Check repository access
      const githubService = new GitHubService(project.userId.githubAccessToken);
      const repoCheck = await githubService.getRepo(project.repoOwner, project.repoName);
      if (!repoCheck.success) {
        throw new Error('Cannot access repository');
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Prepare build environment
  async prepareBuild(project, deployment, options) {
    try {
      // Create build directory
      const buildDir = `/tmp/deploymate-builds/${project._id}-${deployment._id}`;
      await require('fs').promises.mkdir(buildDir, { recursive: true });

      // Clone repository
      const cloneResult = await this.cloneRepository(project, buildDir);
      if (!cloneResult.success) {
        throw new Error(`Failed to clone repository: ${cloneResult.error}`);
      }

      // Checkout specific commit
      const checkoutResult = await this.checkoutCommit(buildDir, deployment.commitHash);
      if (!checkoutResult.success) {
        throw new Error(`Failed to checkout commit: ${checkoutResult.error}`);
      }

      return { success: true, buildDir };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Build application
  async buildApplication(project, deployment, options) {
    try {
      const buildDir = options.buildDir;
      if (!buildDir) {
        throw new Error('Build directory not provided');
      }

      const startTime = Date.now();

      // Install dependencies
      const installResult = await this.installDependencies(project, buildDir);
      if (!installResult.success) {
        throw new Error(`Dependency installation failed: ${installResult.error}`);
      }

      // Run build command
      const buildResult = await this.runBuildCommand(project, buildDir);
      if (!buildResult.success) {
        throw new Error(`Build failed: ${buildResult.error}`);
      }

      // For container deployments, build Docker image
      if (project.deploymentTarget === 'container') {
        const dockerResult = await this.buildDockerImage(project, buildDir);
        if (!dockerResult.success) {
          throw new Error(`Docker build failed: ${dockerResult.error}`);
        }
      }

      const buildDuration = Date.now() - startTime;
      deployment.buildDuration = buildDuration;

      return { success: true, buildDuration };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Run tests
  async runTests(project, deployment, options) {
    try {
      // Skip tests if no test script defined
      const packageJson = require('path').join(options.buildDir, 'package.json');
      const fs = require('fs');

      if (!fs.existsSync(packageJson)) {
        return { success: true, message: 'No package.json found, skipping tests' };
      }

      const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));

      if (!pkg.scripts || !pkg.scripts.test) {
        return { success: true, message: 'No test script defined, skipping tests' };
      }

      // Run test command
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      const testCommand = 'npm test';
      const { stdout, stderr } = await execAsync(testCommand, {
        cwd: options.buildDir,
        timeout: 300000, // 5 minutes timeout
      });

      if (stderr && !stderr.includes('npm WARN')) {
        throw new Error(`Tests failed: ${stderr}`);
      }

      return { success: true, output: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Deploy application
  async deployApplication(project, deployment, options) {
    try {
      const startTime = Date.now();

      // Use deployment service to handle the actual deployment
      const deployResult = await this.deploymentService.deploy(
        project._id,
        deployment._id,
        options
      );

      if (!deployResult.success) {
        throw new Error(`Deployment failed: ${deployResult.error}`);
      }

      const deployDuration = Date.now() - startTime;
      deployment.deployDuration = deployDuration;

      return {
        success: true,
        deployDuration,
        deploymentUrl: deployResult.deploymentUrl,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Cleanup pipeline
  async cleanupPipeline(project, deployment, options) {
    try {
      // Clean up build directory
      if (options.buildDir) {
        const fs = require('fs');
        const path = require('path');

        // Remove build directory
        fs.rmSync(options.buildDir, { recursive: true, force: true });
      }

      return { success: true };
    } catch (error) {
      console.error('Cleanup error:', error);
      // Don't fail the pipeline for cleanup errors
      return { success: true, warning: error.message };
    }
  }

  // Helper methods
  async cloneRepository(project, buildDir) {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      const cloneUrl = `https://github.com/${project.repoOwner}/${project.repoName}.git`;
      const { stdout, stderr } = await execAsync(`git clone ${cloneUrl} .`, {
        cwd: buildDir,
      });

      return { success: true, output: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async checkoutCommit(buildDir, commitHash) {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      const { stdout } = await execAsync(`git checkout ${commitHash}`, {
        cwd: buildDir,
      });

      return { success: true, output: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async installDependencies(project, buildDir) {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      const installCommand = project.installCommand || 'npm install';
      const { stdout, stderr } = await execAsync(installCommand, {
        cwd: buildDir,
        timeout: 300000, // 5 minutes timeout
      });

      return { success: true, output: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async runBuildCommand(project, buildDir) {
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);

      const buildCommand = project.buildCommand || 'npm run build';
      const { stdout, stderr } = await execAsync(buildCommand, {
        cwd: buildDir,
        timeout: 600000, // 10 minutes timeout
      });

      return { success: true, output: stdout };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async buildDockerImage(project, buildDir) {
    try {
      const imageName = `${project.name}:${Date.now()}`;
      const result = await this.dockerService.buildImage(buildDir, 'Dockerfile', imageName);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async validateProviderCredentials(project) {
    // This would validate API tokens/keys for the selected provider
    // For now, assume credentials are valid
    return { valid: true };
  }

  // Get pipeline status
  getPipelineStatus(pipelineId) {
    return this.activePipelines.get(pipelineId) || null;
  }

  // Get all active pipelines
  getActivePipelines() {
    return Array.from(this.activePipelines.entries()).map(([id, pipeline]) => ({
      id,
      ...pipeline,
    }));
  }

  // Cancel pipeline
  async cancelPipeline(pipelineId) {
    try {
      const pipeline = this.activePipelines.get(pipelineId);
      if (!pipeline) {
        return { success: false, error: 'Pipeline not found' };
      }

      // Mark pipeline as cancelled
      pipeline.status = 'cancelled';
      pipeline.endTime = new Date();

      // Clean up
      this.activePipelines.delete(pipelineId);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = PipelineService;

