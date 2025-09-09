const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');

const execAsync = util.promisify(exec);

class DockerService {
  constructor(options = {}) {
    this.dockerHost = options.dockerHost || 'unix:///var/run/docker.sock';
    this.registry = options.registry || 'docker.io';
    this.workingDir = options.workingDir || '/tmp/deploymate-builds';
  }

  // Build Docker image
  async buildImage(contextPath, dockerfile = 'Dockerfile', imageName, buildArgs = {}) {
    try {
      // Ensure working directory exists
      await fs.mkdir(this.workingDir, { recursive: true });

      // Prepare build command
      let buildCommand = `docker build -f ${dockerfile} -t ${imageName}`;

      // Add build arguments
      Object.entries(buildArgs).forEach(([key, value]) => {
        buildCommand += ` --build-arg ${key}="${value}"`;
      });

      buildCommand += ` ${contextPath}`;

      console.log('Building Docker image:', buildCommand);

      const { stdout, stderr } = await execAsync(buildCommand, {
        cwd: this.workingDir,
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
      });

      console.log('Docker build stdout:', stdout);
      if (stderr) console.log('Docker build stderr:', stderr);

      return {
        success: true,
        imageName,
        output: stdout,
      };
    } catch (error) {
      console.error('Docker build error:', error);
      return {
        success: false,
        error: error.message,
        stderr: error.stderr,
      };
    }
  }

  // Push image to registry
  async pushImage(imageName, registryAuth = {}) {
    try {
      // Login to registry if credentials provided
      if (registryAuth.username && registryAuth.password) {
        await this.loginToRegistry(registryAuth);
      }

      console.log('Pushing Docker image:', imageName);

      const { stdout, stderr } = await execAsync(`docker push ${imageName}`, {
        cwd: this.workingDir,
      });

      console.log('Docker push stdout:', stdout);
      if (stderr) console.log('Docker push stderr:', stderr);

      return {
        success: true,
        imageName,
        output: stdout,
      };
    } catch (error) {
      console.error('Docker push error:', error);
      return {
        success: false,
        error: error.message,
        stderr: error.stderr,
      };
    }
  }

  // Login to Docker registry
  async loginToRegistry(auth) {
    try {
      const { username, password, registry = this.registry } = auth;

      const loginCommand = `echo "${password}" | docker login ${registry} -u ${username} --password-stdin`;

      const { stdout, stderr } = await execAsync(loginCommand, {
        cwd: this.workingDir,
      });

      console.log('Docker login successful');
      return { success: true };
    } catch (error) {
      console.error('Docker login error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate Dockerfile for common frameworks
  async generateDockerfile(project, buildConfig) {
    try {
      let dockerfile = '';

      switch (buildConfig.framework) {
        case 'next':
          dockerfile = this.generateNextJsDockerfile(buildConfig);
          break;
        case 'react':
          dockerfile = this.generateReactDockerfile(buildConfig);
          break;
        case 'vue':
          dockerfile = this.generateVueDockerfile(buildConfig);
          break;
        case 'angular':
          dockerfile = this.generateAngularDockerfile(buildConfig);
          break;
        case 'node':
          dockerfile = this.generateNodeDockerfile(buildConfig);
          break;
        default:
          dockerfile = this.generateGenericDockerfile(buildConfig);
      }

      // Write Dockerfile to project directory
      const dockerfilePath = path.join(this.workingDir, project.name, 'Dockerfile');
      await fs.mkdir(path.dirname(dockerfilePath), { recursive: true });
      await fs.writeFile(dockerfilePath, dockerfile);

      return {
        success: true,
        dockerfilePath,
        content: dockerfile,
      };
    } catch (error) {
      console.error('Dockerfile generation error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Generate Next.js Dockerfile
  generateNextJsDockerfile(buildConfig) {
    return `# Use Node.js runtime
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package*.json yarn.lock* ./
RUN \\
  if [ -f yarn.lock ]; then yarn --frozen-lockfile --network-timeout 600000; \\
  else echo "Lockfile not found." && exit 1; \\
  fi

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

# Start the server
CMD ["node", "server.js"]`;
  }

  // Generate React Dockerfile
  generateReactDockerfile(buildConfig) {
    return `# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/build /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`;
  }

  // Generate Vue.js Dockerfile
  generateVueDockerfile(buildConfig) {
    return `# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`;
  }

  // Generate Angular Dockerfile
  generateAngularDockerfile(buildConfig) {
    return `# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build --prod

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=build /app/dist/* /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]`;
  }

  // Generate generic Node.js Dockerfile
  generateNodeDockerfile(buildConfig) {
    return `# Use Node.js runtime
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Change ownership
RUN chown -R nextjs:nodejs /usr/src/app
USER nextjs

EXPOSE 3000

CMD ["npm", "start"]`;
  }

  // Generate generic Dockerfile
  generateGenericDockerfile(buildConfig) {
    return `# Use a base image
FROM node:18-alpine

# Create app directory
WORKDIR /usr/src/app

# Copy package files if they exist
COPY package*.json ./

# Install dependencies if package.json exists
RUN if [ -f package.json ]; then npm ci --only=production; fi

# Copy source code
COPY . .

# Expose port
EXPOSE 3000

# Default command
CMD ["npm", "start"]`;
  }

  // Generate nginx configuration for static sites
  async generateNginxConfig(project) {
    const nginxConfig = `server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Enable gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}`;

    const nginxPath = path.join(this.workingDir, project.name, 'nginx.conf');
    await fs.mkdir(path.dirname(nginxPath), { recursive: true });
    await fs.writeFile(nginxPath, nginxConfig);

    return nginxPath;
  }

  // Check if Docker is available
  async checkDockerAvailability() {
    try {
      const { stdout } = await execAsync('docker --version');
      return {
        success: true,
        version: stdout.trim(),
      };
    } catch (error) {
      return {
        success: false,
        error: 'Docker is not available',
      };
    }
  }

  // Get Docker system info
  async getDockerInfo() {
    try {
      const { stdout } = await execAsync('docker info --format json');
      return {
        success: true,
        info: JSON.parse(stdout),
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

module.exports = DockerService;

