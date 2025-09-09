const { Worker } = require('worker_threads');
const path = require('path');
const PipelineService = require('../services/pipelineService');

class BuildWorker {
  constructor() {
    this.pipelineService = new PipelineService();
    this.activeBuilds = new Map();
  }

  // Start a build process
  async startBuild(projectId, deploymentId, options = {}) {
    try {
      const buildId = `build-${projectId}-${deploymentId}`;

      // Check if build is already running
      if (this.activeBuilds.has(buildId)) {
        throw new Error('Build is already running for this deployment');
      }

      // Start pipeline
      const pipelineResult = await this.pipelineService.startPipeline(
        projectId,
        deploymentId,
        options
      );

      if (!pipelineResult.success) {
        throw new Error(pipelineResult.error);
      }

      // Track active build
      this.activeBuilds.set(buildId, {
        pipelineId: pipelineResult.pipelineId,
        startTime: new Date(),
        status: 'running',
      });

      return {
        success: true,
        buildId,
        pipelineId: pipelineResult.pipelineId,
      };
    } catch (error) {
      console.error('Start build error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Get build status
  getBuildStatus(buildId) {
    const build = this.activeBuilds.get(buildId);
    if (!build) {
      return null;
    }

    // Get pipeline status
    const pipelineStatus = this.pipelineService.getPipelineStatus(build.pipelineId);

    return {
      buildId,
      status: pipelineStatus ? pipelineStatus.status : 'unknown',
      startTime: build.startTime,
      pipeline: pipelineStatus,
    };
  }

  // Cancel build
  async cancelBuild(buildId) {
    try {
      const build = this.activeBuilds.get(buildId);
      if (!build) {
        return { success: false, error: 'Build not found' };
      }

      // Cancel pipeline
      const cancelResult = await this.pipelineService.cancelPipeline(build.pipelineId);

      if (cancelResult.success) {
        this.activeBuilds.delete(buildId);
      }

      return cancelResult;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Get all active builds
  getActiveBuilds() {
    return Array.from(this.activeBuilds.entries()).map(([buildId, build]) => ({
      buildId,
      ...build,
      pipeline: this.pipelineService.getPipelineStatus(build.pipelineId),
    }));
  }

  // Clean up completed builds
  cleanupCompletedBuilds() {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [buildId, build] of this.activeBuilds.entries()) {
      const pipelineStatus = this.pipelineService.getPipelineStatus(build.pipelineId);

      // Remove builds that are completed or older than max age
      if (
        (pipelineStatus && ['success', 'failed', 'cancelled'].includes(pipelineStatus.status)) ||
        (now - build.startTime.getTime()) > maxAge
      ) {
        this.activeBuilds.delete(buildId);
      }
    }
  }

  // Initialize cleanup interval
  startCleanupInterval() {
    // Clean up every hour
    setInterval(() => {
      this.cleanupCompletedBuilds();
    }, 60 * 60 * 1000);
  }
}

module.exports = BuildWorker;

