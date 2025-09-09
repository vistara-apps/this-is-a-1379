import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, ExternalLink, Github, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import DeploymentStatusBadge from '../components/DeploymentStatusBadge'

const Dashboard = () => {
  const [projects, setProjects] = useState([])
  const [deployments, setDeployments] = useState([])

  // Mock data - in real app this would come from API
  useEffect(() => {
    const mockProjects = [
      {
        id: 1,
        name: 'My Portfolio',
        repoUrl: 'https://github.com/user/portfolio',
        cloudProvider: 'Vercel',
        deploymentTarget: 'Static Site',
        createdAt: '2024-01-15',
        lastDeployment: {
          status: 'success',
          deployedAt: '2024-01-20T10:30:00Z',
          url: 'https://portfolio.vercel.app'
        }
      },
      {
        id: 2,
        name: 'E-commerce API',
        repoUrl: 'https://github.com/user/ecommerce-api',
        cloudProvider: 'AWS',
        deploymentTarget: 'Container',
        createdAt: '2024-01-10',
        lastDeployment: {
          status: 'failed',
          deployedAt: '2024-01-19T15:45:00Z',
          url: null
        }
      },
      {
        id: 3,
        name: 'Blog Site',
        repoUrl: 'https://github.com/user/blog',
        cloudProvider: 'Netlify',
        deploymentTarget: 'Static Site',
        createdAt: '2024-01-05',
        lastDeployment: {
          status: 'inProgress',
          deployedAt: '2024-01-20T12:15:00Z',
          url: 'https://blog.netlify.app'
        }
      }
    ]

    const mockDeployments = [
      {
        id: 1,
        projectId: 1,
        commitHash: 'abc123f',
        status: 'success',
        deployedAt: '2024-01-20T10:30:00Z',
        url: 'https://portfolio.vercel.app'
      },
      {
        id: 2,
        projectId: 2,
        commitHash: 'def456a',
        status: 'failed',
        deployedAt: '2024-01-19T15:45:00Z',
        url: null
      },
      {
        id: 3,
        projectId: 3,
        commitHash: 'ghi789b',
        status: 'inProgress',
        deployedAt: '2024-01-20T12:15:00Z',
        url: 'https://blog.netlify.app'
      }
    ]

    setProjects(mockProjects)
    setDeployments(mockDeployments)
  }, [])

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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-text-primary mb-2">Dashboard</h1>
          <p className="text-text-secondary">Manage your projects and deployments</p>
        </div>
        <Link
          to="/deploy"
          className="btn-primary flex items-center space-x-2 mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </Link>
      </div>

      {/* Projects Grid */}
      <div className="mb-12">
        <h2 className="text-xl font-semibold text-text-primary mb-6">Your Projects</h2>
        
        {projects.length === 0 ? (
          <div className="card text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-text-secondary" />
            </div>
            <h3 className="text-lg font-medium text-text-primary mb-2">No projects yet</h3>
            <p className="text-text-secondary mb-6">Deploy your first application to get started</p>
            <Link to="/deploy" className="btn-primary">
              Create Project
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="card hover:shadow-lg transition-all duration-250">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary">{project.name}</h3>
                  <DeploymentStatusBadge status={project.lastDeployment.status} />
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2 text-sm text-text-secondary">
                    <Github className="w-4 h-4" />
                    <span className="truncate">{project.repoUrl.split('/').pop()}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 ${getProviderColor(project.cloudProvider)} rounded-full`}></div>
                      <span className="text-sm text-text-secondary">{project.cloudProvider}</span>
                    </div>
                    <span className="text-sm text-text-secondary">{project.deploymentTarget}</span>
                  </div>
                  
                  {project.lastDeployment.deployedAt && (
                    <div className="flex items-center space-x-2 text-sm text-text-secondary">
                      <Clock className="w-4 h-4" />
                      <span>
                        {new Date(project.lastDeployment.deployedAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-between">
                  <Link
                    to={`/project/${project.id}`}
                    className="text-primary hover:text-primary/80 font-medium text-sm"
                  >
                    View Details
                  </Link>
                  
                  {project.lastDeployment.url && project.lastDeployment.status === 'success' && (
                    <a
                      href={project.lastDeployment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 text-accent hover:text-accent/80 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Visit Site</span>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Deployments */}
      <div>
        <h2 className="text-xl font-semibold text-text-primary mb-6">Recent Deployments</h2>
        
        <div className="card">
          {deployments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-text-secondary">No deployments yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deployments.map((deployment) => {
                const project = projects.find(p => p.id === deployment.projectId)
                return (
                  <div key={deployment.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex items-center space-x-4">
                      <DeploymentStatusBadge status={deployment.status} size="sm" />
                      <div>
                        <h4 className="font-medium text-text-primary">{project?.name}</h4>
                        <p className="text-sm text-text-secondary">
                          Commit: {deployment.commitHash}
                        </p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-text-secondary">
                        {new Date(deployment.deployedAt).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-text-secondary">
                        {new Date(deployment.deployedAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard