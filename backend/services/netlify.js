const axios = require('axios');

class NetlifyService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://api.netlify.com/api/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'User-Agent': 'DeployMate/1.0',
      },
      timeout: 30000,
    });
  }

  // Create a new site
  async createSite(siteConfig) {
    try {
      const {
        name,
        repo,
        buildCommand = 'npm run build',
        buildDir = 'dist',
        branch = 'main',
        environmentVariables = {},
      } = siteConfig;

      const payload = {
        name,
        repo: {
          provider: 'github',
          repo_path: repo,
          repo_branch: branch,
          cmd: buildCommand,
          dir: buildDir,
        },
        build_settings: {
          cmd: buildCommand,
          dir: buildDir,
          env: environmentVariables,
        },
      };

      const response = await this.client.post('/sites', payload);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Netlify createSite error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Get site details
  async getSite(siteId) {
    try {
      const response = await this.client.get(`/sites/${siteId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Netlify getSite error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Update site
  async updateSite(siteId, updates) {
    try {
      const response = await this.client.patch(`/sites/${siteId}`, updates);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Netlify updateSite error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Delete site
  async deleteSite(siteId) {
    try {
      await this.client.delete(`/sites/${siteId}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Netlify deleteSite error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Get site builds
  async getSiteBuilds(siteId, options = {}) {
    try {
      const { page = 1, per_page = 10 } = options;
      const response = await this.client.get(`/sites/${siteId}/builds`, {
        params: { page, per_page },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Netlify getSiteBuilds error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Trigger new build
  async triggerBuild(siteId) {
    try {
      const response = await this.client.post(`/sites/${siteId}/builds`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Netlify triggerBuild error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Get build details
  async getBuild(siteId, buildId) {
    try {
      const response = await this.client.get(`/sites/${siteId}/builds/${buildId}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Netlify getBuild error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Get build log
  async getBuildLog(siteId, buildId) {
    try {
      const response = await this.client.get(`/sites/${siteId}/builds/${buildId}/log`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Netlify getBuildLog error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Create environment variable
  async createEnvironmentVariable(siteId, key, value) {
    try {
      const response = await this.client.post(`/sites/${siteId}/env`, {
        key,
        value,
        scopes: ['builds', 'functions'],
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Netlify createEnvironmentVariable error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Get environment variables
  async getEnvironmentVariables(siteId) {
    try {
      const response = await this.client.get(`/sites/${siteId}/env`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Netlify getEnvironmentVariables error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Delete environment variable
  async deleteEnvironmentVariable(siteId, key) {
    try {
      await this.client.delete(`/sites/${siteId}/env/${key}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('Netlify deleteEnvironmentVariable error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }

  // Get user information
  async getUser() {
    try {
      const response = await this.client.get('/user');
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('Netlify getUser error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.message,
      };
    }
  }
}

module.exports = NetlifyService;

