import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, ExternalLink, Github, Settings, Play, Trash2 } from 'lucide-react'
import DeploymentStatusBadge from '../components/DeploymentStatusBadge'

const ProjectDetails = () => {
  const { id } = useParams()
  const [project, setProject] = useState(null)
  const [deployments, setDeployments] = useState([])
  const [isDeploying, setIsDeploying] = useState(false)

  useEffect(() => {
    // Mock project data - in real app this would come from API
    const mockProject = {
      id: parseInt(id),
      name: 'My Portfolio',
      repoUrl: 'https://github.com/user/portfolio',
      cloudProvider: 'Vercel',
      deploymentTarget: 'Static Site',
      createdAt: '2024-01-15',
      buildCommand: 'npm run build',
      outputDirectory: 'dist',
      lastDeployment: {
        status: 'success',
        deployedAt: '2024-01-20T10:30:00Z',
        url: 'https://portfolio.vercel.app'
      }
    }

    const mockDeployments = [
      {
        id: 1,
        commitHash: 'abc123f',
        message: 'Update homepage design',
        status: 'success',
        deployedAt: '2024-01-20T10:30:00Z',
        url: 'https://portfolio.vercel.app'
      },
      {
        id: 2,
        commitHash: 'def456a',
        message: 'Fix responsive layout',
        status: 'success',
        deployedAt: '2024-01-19T15:45:00Z',
        url: 'https://portfolio.vercel.app'
      },
      {
        id: 3,
        commitHash: 'ghi789b',
        message: 'Add contact form',
        status: 'failed',
        deployedAt: '2024-01-18T09:20:00Z',
        url: null
      }
    ]

    setProject(mockProject)
    setDeployments(mockDeployments)
  }, [id])

  const handleRedeploy = async () => {
    setIsDeploying(true)
    // Simulate deployment
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsDeploying(false)
    
    // Add new deployment to list
    const newDeployment = {
      id: Date.now(),
      commitHash: 'new123x',
      message: 'Manual redeploy',
      status: 'success',
      deployedAt: new Date().toISOString(),
      url: project.lastDeployment.url
    }
    setDeployments(prev => [newDeployment, ...prev])
  }

  if (!project) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="card text-center py-12">
          <p className="text-text-secondary">Loading project details...</p>
        </div>
      </div>
    )
  }

  const getProviderColor = (provider) => {
    switch (provider.toLowerCase()) {
      case 'vercel': return 'bg-black'
      case 'aws': return 'bg-orange-500'
      case 'netlify': return 'bg-teal-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <Link
          to="/dashboard"
          className="p-2 hover:bg-gray-100 rounded-md transition-colors duration-150"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-text-primary">{project.name}</h1>
          <p className="text-text-secondary">Project details and deployment history</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRedeploy}
            disabled={isDeploying}
            className={`btn-primary flex items-center space-x-2 ${
              isDeploying ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <Play className="w-4 h-4" />
            <span>{isDeploying ? 'Deploying...' : 'Redeploy'}</span>
          </button>
          <button className="btn-secondary flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Project Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Current Deployment */}
          <div className="card">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Current Deployment</h2>
            <div className="flex items-center justify-between mb-4">
              <DeploymentStatusBadge status={project.lastDeployment.status} />
              {project.lastDeployment.url && (
                <a
                  href={project.lastDeployment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-accent hover:text-accent/80"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Visit Site</span>
                </a>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">Last Deployed:</span>
                <span className="text-text-primary">
                  {new Date(project.lastDeployment.deployedAt).toLocaleDateString()}
                </span>
              </div>
              {project.lastDeployment.url && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">URL:</span>
                  <a
                    href={project.lastDeployment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline truncate max-w-xs"
                  >
                    {project.lastDeployment.url}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Deployment History */}
          <div className="card">
            <h2 className="text-xl font-semibold text-text-primary mb-4">Deployment History</h2>
            <div className="space-y-4">
              {deployments.map((deployment) => (
                <div key={deployment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-4">
                    <DeploymentStatusBadge status={deployment.status} size="sm" />
                    <div>
                      <p className="font-medium text-text-primary text-sm">
                        {deployment.message}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {deployment.commitHash} • {new Date(deployment.deployedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {deployment.url && deployment.status === 'success' && (
                    <a
                      href={deployment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent hover:text-accent/80 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Project Info Sidebar */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="card">
            <h3 className="font-semibold text-text-primary mb-4">Project Info</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-text-secondary block">Repository</span>
                <a
                  href={project.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-primary hover:underline"
                >
                  <Github className="w-4 h-4" />
                  <span className="truncate">{project.repoUrl.split('/').slice(-2).join('/')}</span>
                </a>
              </div>
              
              <div>
                <span className="text-text-secondary block">Provider</span>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-3 h-3 ${getProviderColor(project.cloudProvider)} rounded-full`}></div>
                  <span className="text-text-primary">{project.cloudProvider}</span>
                </div>
              </div>
              
              <div>
                <span className="text-text-secondary block">Type</span>
                <span className="text-text-primary">{project.deploymentTarget}</span>
              </div>
              
              <div>
                <span className="text-text-secondary block">Created</span>
                <span className="text-text-primary">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Build Settings */}
          <div className="card">
            <h3 className="font-semibold text-text-primary mb-4">Build Settings</h3>
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-text-secondary block">Build Command</span>
                <code className="text-text-primary bg-gray-100 px-2 py-1 rounded text-xs block mt-1">
                  {project.buildCommand}
                </code>
              </div>
              
              <div>
                <span className="text-text-secondary block">Output Directory</span>
                <code className="text-text-primary bg-gray-100 px-2 py-1 rounded text-xs block mt-1">
                  {project.outputDirectory}
                </code>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="card border border-red-200">
            <h3 className="font-semibold text-red-600 mb-4">Danger Zone</h3>
            <button className="flex items-center space-x-2 text-red-600 hover:text-red-700 text-sm">
              <Trash2 className="w-4 h-4" />
              <span>Delete Project</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProjectDetails