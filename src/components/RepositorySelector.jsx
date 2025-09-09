import React, { useState, useEffect } from 'react'
import { Github, Search, Check, Star, GitBranch } from 'lucide-react'

const RepositorySelector = ({ selectedRepo, onSelect }) => {
  const [repos, setRepos] = useState([])
  const [isConnected, setIsConnected] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // Mock repositories data
  const mockRepos = [
    {
      id: 1,
      name: 'my-portfolio',
      fullName: 'user/my-portfolio',
      description: 'Personal portfolio website built with React and Tailwind CSS',
      private: false,
      defaultBranch: 'main',
      language: 'JavaScript',
      stars: 12,
      updatedAt: '2024-01-20T10:30:00Z'
    },
    {
      id: 2,
      name: 'ecommerce-api',
      fullName: 'user/ecommerce-api',
      description: 'RESTful API for e-commerce platform using Node.js and Express',
      private: true,
      defaultBranch: 'main',
      language: 'TypeScript',
      stars: 5,
      updatedAt: '2024-01-19T15:45:00Z'
    },
    {
      id: 3,
      name: 'blog-site',
      fullName: 'user/blog-site',
      description: 'Static blog site generated with Gatsby',
      private: false,
      defaultBranch: 'master',
      language: 'JavaScript',
      stars: 8,
      updatedAt: '2024-01-18T09:20:00Z'
    },
    {
      id: 4,
      name: 'mobile-app',
      fullName: 'user/mobile-app',
      description: 'React Native mobile application',
      private: true,
      defaultBranch: 'develop',
      language: 'TypeScript',
      stars: 3,
      updatedAt: '2024-01-17T14:10:00Z'
    }
  ]

  const connectGitHub = async () => {
    setIsLoading(true)
    // Simulate GitHub OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsConnected(true)
    setRepos(mockRepos)
    setIsLoading(false)
  }

  const filteredRepos = repos.filter(repo =>
    repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    repo.description?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getLanguageColor = (language) => {
    const colors = {
      JavaScript: 'bg-yellow-500',
      TypeScript: 'bg-blue-500',
      Python: 'bg-green-500',
      React: 'bg-cyan-500',
      Vue: 'bg-emerald-500',
      HTML: 'bg-orange-500'
    }
    return colors[language] || 'bg-gray-500'
  }

  if (!isConnected) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <Github className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-lg font-medium text-text-primary mb-2">Connect your GitHub account</h3>
        <p className="text-text-secondary mb-6 max-w-md mx-auto">
          We need access to your repositories to set up automatic deployments. 
          Your code stays private and secure.
        </p>
        <button
          onClick={connectGitHub}
          disabled={isLoading}
          className={`btn-primary flex items-center space-x-2 mx-auto ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <Github className="w-5 h-5" />
          <span>{isLoading ? 'Connecting...' : 'Connect GitHub'}</span>
        </button>
        
        <div className="mt-8 text-xs text-text-secondary">
          <p>We only request permissions for:</p>
          <ul className="mt-2 space-y-1">
            <li>• Reading your repository list</li>
            <li>• Setting up deployment webhooks</li>
            <li>• Accessing repository content for builds</li>
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-secondary" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search repositories..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
      </div>

      {/* Repository List */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredRepos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary">
              {searchTerm ? 'No repositories match your search.' : 'No repositories found.'}
            </p>
          </div>
        ) : (
          filteredRepos.map((repo) => (
            <button
              key={repo.id}
              onClick={() => onSelect(repo)}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-150 ${
                selectedRepo?.id === repo.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-medium text-text-primary truncate">{repo.name}</h4>
                    {repo.private && (
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                        Private
                      </span>
                    )}
                  </div>
                  
                  {repo.description && (
                    <p className="text-sm text-text-secondary mb-3 leading-relaxed">
                      {repo.description}
                    </p>
                  )}
                  
                  <div className="flex items-center space-x-4 text-xs text-text-secondary">
                    {repo.language && (
                      <div className="flex items-center space-x-1">
                        <div className={`w-3 h-3 ${getLanguageColor(repo.language)} rounded-full`}></div>
                        <span>{repo.language}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3" />
                      <span>{repo.stars}</span>
                    </div>
                    
                    <div className="flex items-center space-x-1">
                      <GitBranch className="w-3 h-3" />
                      <span>{repo.defaultBranch}</span>
                    </div>
                    
                    <span>Updated {new Date(repo.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {selectedRepo?.id === repo.id && (
                  <Check className="w-5 h-5 text-primary flex-shrink-0 ml-4" />
                )}
              </div>
            </button>
          ))
        )}
      </div>

      {/* Selected Repository Info */}
      {selectedRepo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Check className="w-5 h-5 text-green-600" />
            <span className="font-medium text-green-900">Repository Selected</span>
          </div>
          <p className="text-sm text-green-800">
            <strong>{selectedRepo.fullName}</strong> will be connected for automatic deployments.
            We'll monitor the <strong>{selectedRepo.defaultBranch}</strong> branch for changes.
          </p>
        </div>
      )}
    </div>
  )
}

export default RepositorySelector