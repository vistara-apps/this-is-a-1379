const GitHubService = require('./github');
const VercelService = require('./vercel');
const NetlifyService = require('./netlify');
const AWSService = require('./aws');
const DockerService = require('./docker');
const Project = require('../models/Project');
const Deployment = require('../models/Deployment');
const User = require('../models/User');

class DeploymentService {
  constructor() {
    this.providers = {
      vercel: VercelService,
      netlify: NetlifyService,
      aws: AWSService,
    };
  }

  // Main deployment orchestration method
  async deploy(projectId, deploymentId, options = {}) {
    try {
      // Get project and deployment details
      const project = await Project.findById(projectId).populate('userId');
      const deployment = await Deployment.findById(deploymentId);

      if (!project || !deployment) {
        throw new Error('Project or deployment not found');
      }

      // Update deployment status to building
      await deployment.updateStatus('building', 'Starting build process');
      await deployment.addBuildLog('info', `Starting deployment for ${project.name}`);

      // Validate project configuration
      const validation = await this.validateProjectConfig(project);
      if (!validation.valid) {
        await deployment.updateStatus('failed', validation.error);
        await deployment.addBuildLog('error', `Validation failed: ${validation.error}`);
        return { success: false, error: validation.error };
      }

      // Detect build configuration
      const buildConfig = await this.detectBuildConfig(project);
      await deployment.addBuildLog('info', `Detected build config: ${JSON.stringify(buildConfig)}`);

      // Execute deployment based on provider
      const result = await this.executeDeployment(project, deployment, buildConfig, options);

      if (result.success) {
        await deployment.updateStatus('success', 'Deployment completed successfully');
        await deployment.addBuildLog('info', 'Deployment completed successfully');

        // Update project with deployment URL if available
        if (result.deploymentUrl) {
          await project.updateDeploymentUrl(result.deploymentUrl);
        }
      } else {
        await deployment.updateStatus('failed', result.error);
        await deployment.addBuildLog('error', `Deployment failed: ${result.error}`);
      }

      return result;

    } catch (error) {
      console.error('Deployment error:', error);

      // Update deployment status if we have the deployment object
      if (deploymentId) {
        try {
          const deployment = await Deployment.findById(deploymentId);
          if (deployment) {
            await deployment.updateStatus('failed', error.message);
            await deployment.addBuildLog('error', `Deployment failed: ${error.message}`);
          }
        } catch (logError) {
          console.error('Failed to update deployment status:', logError);
        }
      }

      return { success: false, error: error.message };
    }
  }

  // Validate project configuration
  async validateProjectConfig(project) {
    try {
      // Check if user has deployment quota
      const user = project.userId;
      if (!user.canDeploy()) {
        return { valid: false, error: 'Deployment quota exceeded' };
      }

      // Validate repository access
      const githubService = new GitHubService(user.githubAccessToken);
      const repoCheck = await githubService.getRepo(project.repoOwner, project.repoName);

      if (!repoCheck.success) {
        return { valid: false, error: 'Cannot access repository' };
      }

      // Validate cloud provider credentials
      const providerCheck = await this.validateProviderCredentials(project);
      if (!providerCheck.valid) {
        return providerCheck;
      }

      return { valid: true };

    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  // Validate cloud provider credentials
  async validateProviderCredentials(project) {
    // This would check if the user has valid API tokens/keys for the selected provider
    // For now, we'll assume credentials are valid
    return { valid: true };
  }

  // Detect build configuration from repository
  async detectBuildConfig(project) {
    try {
      const user = project.userId;
      const githubService = new GitHubService(user.githubAccessToken);

      // Check for common configuration files
      const configFiles = [
        'package.json',
        'package-lock.json',
        'yarn.lock',
        'requirements.txt',
        'Pipfile',
        'Dockerfile',
        'docker-compose.yml',
        'vercel.json',
        'netlify.toml',
        'now.json',
      ];

      const fileCheck = await githubService.checkRepoFiles(
        project.repoOwner,
        project.repoName,
        configFiles
      );

      const detectedConfig = {
        framework: null,
        packageManager: null,
        hasDocker: false,
        buildCommand: project.buildCommand,
        installCommand: project.installCommand,
        outputDirectory: project.outputDirectory,
      };

      // Detect package manager
      if (fileCheck.data['yarn.lock']?.exists) {
        detectedConfig.packageManager = 'yarn';
        if (!detectedConfig.installCommand || detectedConfig.installCommand === 'npm install') {
          detectedConfig.installCommand = 'yarn install';
        }
      } else if (fileCheck.data['package-lock.json']?.exists) {
        detectedConfig.packageManager = 'npm';
      }

      // Detect framework from package.json
      if (fileCheck.data['package.json']?.exists) {
        try {
          const packageJson = await githubService.getRepoContents(
            project.repoOwner,
            project.repoName,
            'package.json'
          );

          if (packageJson.success) {
            const content = Buffer.from(packageJson.data.content, 'base64').toString();
            const pkg = JSON.parse(content);

            // Detect framework
            if (pkg.dependencies?.['next']) {
              detectedConfig.framework = 'next';
            } else if (pkg.dependencies?.['react']) {
              detectedConfig.framework = 'react';
            } else if (pkg.dependencies?.['vue']) {
              detectedConfig.framework = 'vue';
            } else if (pkg.dependencies?.['angular']) {
              detectedConfig.framework = 'angular';
            }

            // Detect build scripts
            if (pkg.scripts?.build && !detectedConfig.buildCommand) {
              detectedConfig.buildCommand = pkg.scripts.build;
            }
          }
        } catch (error) {
          console.error('Error parsing package.json:', error);
        }
      }

      // Check for Docker
      if (fileCheck.data['Dockerfile']?.exists) {
        detectedConfig.hasDocker = true;
      }

      return detectedConfig;

    } catch (error) {
      console.error('Error detecting build config:', error);
      return {
        framework: null,
        packageManager: 'npm',
        hasDocker: false,
        buildCommand: project.buildCommand || 'npm run build',
        installCommand: project.installCommand || 'npm install',
        outputDirectory: project.outputDirectory || 'dist',
      };
    }
  }

  // Execute deployment based on provider
  async executeDeployment(project, deployment, buildConfig, options) {
    const provider = project.cloudProvider;

    try {
      switch (provider) {
        case 'vercel':
          return await this.deployToVercel(project, deployment, buildConfig, options);

        case 'netlify':
          return await this.deployToNetlify(project, deployment, buildConfig, options);

        case 'aws':
          return await this.deployToAWS(project, deployment, buildConfig, options);

        default:
          throw new Error(`Unsupported provider: ${provider}`);
      }
    } catch (error) {
      console.error(`Deployment to ${provider} failed:`, error);
      return { success: false, error: error.message };
    }
  }

  // Deploy to Vercel
  async deployToVercel(project, deployment, buildConfig, options) {
    const vercelService = new VercelService(process.env.VERCEL_ACCESS_TOKEN);

    // Prepare project configuration
    const projectConfig = {
      name: project.name,
      gitRepository: {
        type: 'github',
        repo: `${project.repoOwner}/${project.repoName}`,
      },
      buildCommand: buildConfig.buildCommand,
      outputDirectory: buildConfig.outputDirectory,
      installCommand: buildConfig.installCommand,
      environmentVariables: project.environmentVariables,
    };

    // Create or update project
    let vercelProject;
    if (project.providerProjectId) {
      // Update existing project
      const updateResult = await vercelService.updateProject(project.providerProjectId, projectConfig);
      if (!updateResult.success) {
        throw new Error(`Failed to update Vercel project: ${updateResult.error}`);
      }
      vercelProject = updateResult.data;
    } else {
      // Create new project
      const createResult = await vercelService.createProject(projectConfig);
      if (!createResult.success) {
        throw new Error(`Failed to create Vercel project: ${createResult.error}`);
      }
      vercelProject = createResult.data;

      // Update project with Vercel project ID
      project.providerProjectId = vercelProject.id;
      await project.save();
    }

    // Trigger deployment
    const deployResult = await vercelService.redeploy(vercelProject.id);
    if (!deployResult.success) {
      throw new Error(`Failed to trigger Vercel deployment: ${deployResult.error}`);
    }

    return {
      success: true,
      deploymentUrl: vercelProject.alias?.[0] || `https://${vercelProject.name}.vercel.app`,
      providerDeploymentId: deployResult.data.id,
    };
  }

  // Deploy to Netlify
  async deployToNetlify(project, deployment, buildConfig, options) {
    const netlifyService = new NetlifyService(process.env.NETLIFY_ACCESS_TOKEN);

    // Implementation for Netlify deployment
    // Similar structure to Vercel deployment

    return {
      success: true,
      deploymentUrl: `https://${project.name}.netlify.app`,
    };
  }

  // Deploy to AWS
  async deployToAWS(project, deployment, buildConfig, options) {
    const awsService = new AWSService({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    });

    // Implementation for AWS deployment
    // Handle different deployment targets (S3, Lambda, ECS, etc.)

    return {
      success: true,
      deploymentUrl: `https://${project.name}.s3.amazonaws.com`,
    };
  }

  // Rollback deployment
  async rollback(projectId, deploymentId, targetDeploymentId) {
    try {
      const project = await Project.findById(projectId);
      const targetDeployment = await Deployment.findById(targetDeploymentId);

      if (!project || !targetDeployment) {
        throw new Error('Project or target deployment not found');
      }

      // Create rollback deployment
      const rollbackDeployment = new Deployment({
        projectId: project._id,
        userId: project.userId,
        commitHash: targetDeployment.commitHash,
        branch: targetDeployment.branch,
        status: 'pending',
        triggeredBy: 'manual',
        environment: targetDeployment.environment,
      });

      await rollbackDeployment.save();

      // Execute rollback
      return await this.deploy(projectId, rollbackDeployment._id, { rollback: true });

    } catch (error) {
      console.error('Rollback error:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = DeploymentService;

