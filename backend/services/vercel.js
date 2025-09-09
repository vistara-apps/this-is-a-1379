const axios = require('axios');

class VercelService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://api.vercel.com';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  // Create a new project
  async createProject(projectConfig) {
    try {
      const {
        name,
        gitRepository,
        buildCommand = 'npm run build',
        outputDirectory = 'dist',
        installCommand = 'npm install',
        rootDirectory = '',
        environmentVariables = [],
      } = projectConfig;

      const payload = {
        name,
        gitRepository,
        buildCommand,
        outputDirectory,
        installCommand,
        rootDirectory,
        env: environmentVariables.map(env => ({
          key: env.key,
          value: env.value,
          type: env.isSecret ? 'secret' : 'plain',
        })),
      };

      const response = await this.client.post('/v9/projects', payload);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Vercel createProject error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Get project details
  async getProject(projectId) {
    try {
      const response = await this.client.get(`/v9/projects/${projectId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Vercel getProject error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Update project
  async updateProject(projectId, updates) {
    try {
      const response = await this.client.patch(`/v9/projects/${projectId}`, updates);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Vercel updateProject error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Delete project
  async deleteProject(projectId) {
    try {
      await this.client.delete(`/v9/projects/${projectId}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Vercel deleteProject error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Get deployments for a project
  async getProjectDeployments(projectId, options = {}) {
    try {
      const { limit = 20, since, until } = options;
      const params = { limit };

      if (since) params.since = since;
      if (until) params.until = until;

      const response = await this.client.get(`/v6/deployments`, {
        params: { projectId, ...params },
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Vercel getProjectDeployments error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Get deployment details
  async getDeployment(deploymentId) {
    try {
      const response = await this.client.get(`/v13/deployments/${deploymentId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Vercel getDeployment error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Redeploy a project
  async redeploy(projectId, options = {}) {
    try {
      const { gitSource } = options;

      const payload = {};
      if (gitSource) {
        payload.gitSource = gitSource;
      }

      const response = await this.client.post(`/v13/deployments`, {
        projectId,
        ...payload,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Vercel redeploy error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Get deployment logs
  async getDeploymentLogs(deploymentId) {
    try {
      const response = await this.client.get(`/v2/deployments/${deploymentId}/events`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Vercel getDeploymentLogs error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Create environment variable
  async createEnvironmentVariable(projectId, envVar) {
    try {
      const { key, value, type = 'plain', target = ['production'] } = envVar;

      const response = await this.client.post(`/v10/projects/${projectId}/env`, {
        key,
        value,
        type,
        target,
      });

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Vercel createEnvironmentVariable error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Get environment variables
  async getEnvironmentVariables(projectId) {
    try {
      const response = await this.client.get(`/v9/projects/${projectId}/env`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Vercel getEnvironmentVariables error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Delete environment variable
  async deleteEnvironmentVariable(projectId, envId) {
    try {
      await this.client.delete(`/v9/projects/${projectId}/env/${envId}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Vercel deleteEnvironmentVariable error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Get user information
  async getUser() {
    try {
      const response = await this.client.get('/v2/user');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Vercel getUser error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }
}

module.exports = VercelService;

