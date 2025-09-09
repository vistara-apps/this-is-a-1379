const axios = require('axios');

class GitHubService {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.baseURL = 'https://api.github.com';
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DeployMate/1.0',
      },
      timeout: 10000,
    });
  }

  // Get user repositories
  async getUserRepos(options = {}) {
    try {
      const { page = 1, per_page = 30, sort = 'updated', type = 'owner' } = options;

      const response = await this.client.get('/user/repos', {
        params: {
          page,
          per_page,
          sort,
          type,
          affiliation: 'owner,collaborator',
        },
      });

      return {
        success: true,
        data: response.data,
        pagination: this.parsePagination(response.headers.link),
      };
    } catch (error) {
      console.error('GitHub getUserRepos error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Get repository details
  async getRepo(owner, repo) {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('GitHub getRepo error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Get repository branches
  async getRepoBranches(owner, repo) {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/branches`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('GitHub getRepoBranches error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Create webhook
  async createWebhook(owner, repo, webhookConfig) {
    try {
      const config = {
        config: {
          url: webhookConfig.url,
          content_type: 'json',
          secret: webhookConfig.secret,
        },
        events: webhookConfig.events || ['push'],
        active: true,
      };

      const response = await this.client.post(`/repos/${owner}/${repo}/hooks`, config);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('GitHub createWebhook error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Delete webhook
  async deleteWebhook(owner, repo, hookId) {
    try {
      await this.client.delete(`/repos/${owner}/${repo}/hooks/${hookId}`);
      return {
        success: true,
      };
    } catch (error) {
      console.error('GitHub deleteWebhook error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Get commit details
  async getCommit(owner, repo, sha) {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/commits/${sha}`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('GitHub getCommit error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Get repository contents (for build configuration detection)
  async getRepoContents(owner, repo, path = '', ref = 'main') {
    try {
      const response = await this.client.get(`/repos/${owner}/${repo}/contents/${path}`, {
        params: { ref },
      });
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      console.error('GitHub getRepoContents error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  // Check if repository has specific files (package.json, etc.)
  async checkRepoFiles(owner, repo, files, ref = 'main') {
    try {
      const results = {};

      for (const file of files) {
        try {
          const response = await this.client.get(`/repos/${owner}/${repo}/contents/${file}`, {
            params: { ref },
          });
          results[file] = {
            exists: true,
            size: response.data.size,
            sha: response.data.sha,
          };
        } catch (error) {
          if (error.response?.status === 404) {
            results[file] = { exists: false };
          } else {
            results[file] = { exists: false, error: error.message };
          }
        }
      }

      return {
        success: true,
        data: results,
      };
    } catch (error) {
      console.error('GitHub checkRepoFiles error:', error.message);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Parse GitHub API pagination links
  parsePagination(linkHeader) {
    if (!linkHeader) return null;

    const links = {};
    const linkPattern = /<([^>]+)>;\s*rel="([^"]+)"/g;
    let match;

    while ((match = linkPattern.exec(linkHeader)) !== null) {
      links[match[2]] = match[1];
    }

    return links;
  }

  // Validate webhook signature
  static validateWebhookSignature(payload, signature, secret) {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload, 'utf8');
    const expectedSignature = `sha256=${hmac.digest('hex')}`;
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

module.exports = GitHubService;

