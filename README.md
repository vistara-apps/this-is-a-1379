# DeployMate 🚀

**Your fastest path from code to cloud.**

DeployMate is a comprehensive deployment platform that simplifies the process of deploying applications across multiple cloud providers. Built for solo developers and small teams, it provides an intuitive interface for managing deployments with minimal configuration.

## ✨ Features

### Core Features
- **One-Click Deployment Wizard** - Intuitive wizard guiding users through cloud provider selection and configuration
- **Multi-Cloud Support** - Deploy to Vercel, Netlify, AWS, and DigitalOcean
- **Containerized Deployments** - Support for Docker containers with automated orchestration
- **Automated CI/CD Pipelines** - GitHub integration with automatic deployments on push
- **Serverless Hosting** - Seamless integration with serverless platforms

### Advanced Features
- **Real-time Deployment Monitoring** - Live logs and status updates
- **Rollback Capabilities** - Easy rollback to previous deployments
- **Environment Management** - Support for multiple environments (dev, staging, prod)
- **Custom Domains** - Domain management and SSL certificates
- **Team Collaboration** - Role-based access control and team management
- **Usage Analytics** - Detailed insights into deployments and performance

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, MongoDB, Passport.js
- **Authentication**: GitHub OAuth, JWT
- **Cloud Providers**: Vercel, Netlify, AWS SDK, DigitalOcean API
- **Containerization**: Docker, Docker Compose
- **Caching**: Redis
- **Testing**: Jest, Supertest

### Project Structure
```
├── src/                    # Frontend React application
│   ├── components/         # Reusable UI components
│   ├── pages/             # Page components
│   ├── hooks/             # Custom React hooks
│   └── utils/             # Utility functions
├── backend/               # Backend Node.js API
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/          # MongoDB models
│   ├── routes/          # API routes
│   ├── services/        # Business logic services
│   ├── workers/         # Background job workers
│   └── __tests__/       # Unit and integration tests
├── docs/                 # Documentation
├── docker/              # Docker configurations
└── scripts/             # Build and deployment scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB
- Redis (optional, for caching)
- GitHub account for OAuth
- API tokens for cloud providers

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vistara-apps/this-is-a-1379.git
   cd this-is-a-1379
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   npm install

   # Backend
   cd backend
   npm install
   cd ..
   ```

3. **Environment setup**
   ```bash
   # Copy environment files
   cp .env.example .env
   cp backend/.env.example backend/.env

   # Edit environment variables
   nano .env
   nano backend/.env
   ```

4. **Start development servers**
   ```bash
   # Using Docker Compose (recommended)
   docker-compose up -d

   # Or manually
   # Terminal 1: Start backend
   cd backend && npm run dev

   # Terminal 2: Start frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017
   - Redis: localhost:6379

## 🔧 Configuration

### Environment Variables

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_GITHUB_CLIENT_ID=your-github-client-id
```

#### Backend (backend/.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/deploymate
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-super-secret-jwt-key
FRONTEND_URL=http://localhost:5173

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:5000/api/auth/github/callback

# Cloud Provider APIs
VERCEL_ACCESS_TOKEN=your-vercel-token
NETLIFY_ACCESS_TOKEN=your-netlify-token
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
DIGITALOCEAN_ACCESS_TOKEN=your-do-token
```

## 📖 Usage

### Creating Your First Deployment

1. **Sign up/Login** with GitHub OAuth
2. **Connect Repository** - Grant access to your GitHub repositories
3. **Configure Project**:
   - Select cloud provider (Vercel, Netlify, AWS, DigitalOcean)
   - Choose deployment type (Static, Serverless, Container)
   - Set build commands and environment variables
4. **Deploy** - Click deploy and watch real-time logs
5. **Access** - Get your live application URL

### Supported Deployment Types

#### Static Site Deployment
Perfect for React, Vue, Angular, and other frontend frameworks.

**Example configuration:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm install"
}
```

#### Serverless Functions
Deploy API endpoints and background functions.

**Example structure:**
```
functions/
├── api/
│   ├── users.js
│   └── posts.js
└── package.json
```

#### Container Deployment
Deploy full-stack applications with Docker.

**Example Dockerfile:**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔌 API Documentation

### Authentication
```javascript
// Login with GitHub OAuth
GET /api/auth/github

// Get current user
GET /api/auth/me
Authorization: Bearer <token>

// Update profile
PUT /api/auth/profile
```

### Projects
```javascript
// Get all projects
GET /api/projects

// Create project
POST /api/projects

// Get project details
GET /api/projects/:id

// Update project
PUT /api/projects/:id

// Delete project
DELETE /api/projects/:id
```

### Deployments
```javascript
// Get deployments
GET /api/deployments

// Trigger deployment
POST /api/projects/:id/deploy

// Get deployment logs
GET /api/deployments/:id/logs

// Cancel deployment
POST /api/deployments/:id/cancel
```

## 🧪 Testing

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend tests (if configured)
npm test
```

### Test Coverage
```bash
npm run test:coverage
```

## 🚀 Deployment

### Production Deployment

1. **Build the application**
   ```bash
   npm run build
   ```

2. **Start production server**
   ```bash
   npm start
   ```

### Docker Deployment
```bash
# Build and run with Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Cloud Deployment Options

#### Vercel
```bash
vercel --prod
```

#### Netlify
```bash
netlify deploy --prod
```

#### AWS
```bash
# Using AWS CLI
aws s3 sync dist/ s3://your-bucket-name
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow ESLint configuration
- Write tests for new features
- Update documentation
- Use conventional commit messages

## 📋 Roadmap

### Phase 1 (Current)
- ✅ Basic deployment functionality
- ✅ GitHub integration
- ✅ Multi-cloud support
- ✅ Real-time logs

### Phase 2 (Upcoming)
- 🔄 Team collaboration features
- 🔄 Advanced analytics
- 🔄 Custom domain management
- 🔄 Environment branching

### Phase 3 (Future)
- 🔄 Kubernetes integration
- 🔄 Multi-region deployments
- 🔄 Advanced security features
- 🔄 Enterprise features

## 🐛 Troubleshooting

### Common Issues

**Build Failures**
- Check build commands in project configuration
- Verify environment variables
- Review build logs for specific errors

**Authentication Issues**
- Verify GitHub OAuth configuration
- Check JWT token expiration
- Confirm API credentials

**Deployment Timeouts**
- Optimize build process
- Check network connectivity
- Verify cloud provider limits

### Support
- 📧 Email: support@deploymate.app
- 💬 Discord: [Join our community](https://discord.gg/deploymate)
- 📖 Documentation: [docs.deploymate.app](https://docs.deploymate.app)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- React community for amazing frontend tools
- Express.js for robust backend framework
- MongoDB for flexible document database
- All cloud providers for excellent APIs
- Open source community for inspiration

---

**Made with ❤️ by the DeployMate team**

*DeployMate - Simplifying deployment, one click at a time.*

