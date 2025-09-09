# DeployMate API Documentation

## Overview

DeployMate provides a comprehensive REST API for managing deployments, projects, and user accounts. The API follows RESTful conventions and uses JSON for request/response bodies.

## Base URL

```
https://api.deploymate.app/v1
```

## Authentication

All API requests require authentication using JWT tokens. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Authentication Endpoints

#### POST /auth/github
Initiate GitHub OAuth authentication.

#### GET /auth/github/callback
Handle GitHub OAuth callback.

#### GET /auth/me
Get current user information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "user_id",
    "githubUsername": "username",
    "email": "user@example.com",
    "subscriptionTier": "free",
    "deploymentLimit": 5,
    "buildMinutesLimit": 100
  }
}
```

#### POST /auth/refresh
Refresh JWT token.

## Projects

### GET /projects
Get all projects for the authenticated user.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "project_id",
      "name": "My Portfolio",
      "repoUrl": "https://github.com/user/portfolio",
      "cloudProvider": "vercel",
      "deploymentTarget": "static",
      "status": "active",
      "createdAt": "2024-01-15T10:00:00Z",
      "lastDeployment": {
        "status": "success",
        "deployedAt": "2024-01-20T10:30:00Z",
        "url": "https://portfolio.vercel.app"
      }
    }
  ]
}
```

### POST /projects
Create a new project.

**Request Body:**
```json
{
  "name": "My Project",
  "description": "Project description",
  "repoUrl": "https://github.com/user/repo",
  "cloudProvider": "vercel",
  "deploymentTarget": "static",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "environmentVariables": [
    {
      "key": "NODE_ENV",
      "value": "production",
      "isSecret": false
    }
  ]
}
```

### GET /projects/:projectId
Get project details.

### PUT /projects/:projectId
Update project configuration.

### DELETE /projects/:projectId
Delete project.

### POST /projects/:projectId/deploy
Trigger manual deployment.

**Request Body:**
```json
{
  "commitHash": "abc123",
  "branch": "main"
}
```

## Deployments

### GET /deployments
Get all deployments for the authenticated user.

**Query Parameters:**
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (pending, building, deploying, success, failed)
- `projectId`: Filter by project ID

### GET /deployments/:deploymentId
Get deployment details.

### GET /deployments/:deploymentId/logs
Get deployment logs.

**Response:**
```json
{
  "success": true,
  "data": {
    "logs": [
      {
        "timestamp": "2024-01-20T10:30:00Z",
        "level": "info",
        "message": "Starting build process"
      }
    ],
    "status": "success",
    "buildDuration": 45000,
    "deployDuration": 30000
  }
}
```

### POST /deployments/:deploymentId/cancel
Cancel a running deployment.

### POST /deployments/:deploymentId/redeploy
Redeploy using the same configuration.

## Billing & Subscriptions

### GET /billing/plans
Get available subscription plans.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "free",
      "name": "Free",
      "price": 0,
      "features": [
        "5 deployments per month",
        "100 build minutes",
        "Basic support"
      ],
      "limits": {
        "deployments": 5,
        "buildMinutes": 100
      }
    }
  ]
}
```

### POST /billing/subscribe
Update subscription plan.

**Request Body:**
```json
{
  "planId": "professional"
}
```

### GET /billing/usage
Get current usage statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "currentMonth": {
      "deployments": {
        "used": 3,
        "limit": 50,
        "remaining": 47
      },
      "buildMinutes": {
        "used": 45,
        "limit": 1000,
        "remaining": 955
      }
    },
    "resetDate": "2024-02-01T00:00:00Z"
  }
}
```

## Webhooks

### POST /webhooks/github/:projectId
Handle GitHub webhook events.

**Headers:**
```
X-GitHub-Event: push
X-Hub-Signature-256: sha256=signature
```

### POST /webhooks/vercel/:projectId
Handle Vercel deployment webhooks.

### POST /webhooks/netlify/:projectId
Handle Netlify deployment webhooks.

## Error Handling

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errors": ["Detailed error messages"] // Optional
}
```

### HTTP Status Codes

- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting

API requests are rate limited to 100 requests per 15 minutes per IP address.

## SDKs and Libraries

- JavaScript/Node.js SDK: `npm install @deploymate/sdk`
- Python SDK: `pip install deploymate`
- Go SDK: `go get github.com/deploymate/go-sdk`

## Support

For API support, contact support@deploymate.app or visit our documentation at docs.deploymate.app.

