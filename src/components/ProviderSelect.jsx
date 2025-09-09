import React from 'react'
import { Check, Cloud, Server, Globe } from 'lucide-react'

const ProviderSelect = ({ selectedProvider, selectedTarget, onProviderSelect, onTargetSelect }) => {
  const providers = [
    {
      id: 'vercel',
      name: 'Vercel',
      description: 'Perfect for frontend frameworks and static sites',
      icon: '▲',
      color: 'bg-black',
      targets: ['Static Site', 'Serverless Functions']
    },
    {
      id: 'netlify',
      name: 'Netlify',
      description: 'JAMstack platform with built-in CI/CD',
      icon: '◆',
      color: 'bg-teal-500',
      targets: ['Static Site', 'Serverless Functions']
    },
    {
      id: 'aws',
      name: 'AWS',
      description: 'Scalable cloud infrastructure for any workload',
      icon: '☁',
      color: 'bg-orange-500',
      targets: ['Container', 'Serverless Functions', 'EC2 Instance']
    },
    {
      id: 'digitalocean',
      name: 'DigitalOcean',
      description: 'Simple cloud hosting for developers',
      icon: '🌊',
      color: 'bg-blue-500',
      targets: ['Container', 'Droplet']
    }
  ]

  const deploymentTargets = [
    {
      id: 'static',
      name: 'Static Site',
      description: 'HTML, CSS, JS files served via CDN',
      icon: Globe,
      suitable: ['vercel', 'netlify']
    },
    {
      id: 'serverless',
      name: 'Serverless Functions',
      description: 'Auto-scaling functions with pay-per-use',
      icon: Cloud,
      suitable: ['vercel', 'netlify', 'aws']
    },
    {
      id: 'container',
      name: 'Container',
      description: 'Dockerized applications with orchestration',
      icon: Server,
      suitable: ['aws', 'digitalocean']
    }
  ]

  const availableTargets = selectedProvider 
    ? deploymentTargets.filter(target => target.suitable.includes(selectedProvider))
    : deploymentTargets

  return (
    <div className="space-y-8">
      {/* Provider Selection */}
      <div>
        <h4 className="text-base font-medium text-text-primary mb-4">Choose Cloud Provider</h4>
        <div className="grid md:grid-cols-2 gap-4">
          {providers.map((provider) => (
            <button
              key={provider.id}
              onClick={() => {
                onProviderSelect(provider.id)
                // Reset target selection when provider changes
                if (selectedProvider !== provider.id) {
                  onTargetSelect('')
                }
              }}
              className={`text-left p-4 rounded-lg border-2 transition-all duration-150 ${
                selectedProvider === provider.id
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${provider.color} rounded-lg flex items-center justify-center text-white font-bold`}>
                    {provider.icon}
                  </div>
                  <div>
                    <h5 className="font-medium text-text-primary">{provider.name}</h5>
                  </div>
                </div>
                {selectedProvider === provider.id && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {provider.description}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {provider.targets.map((target) => (
                  <span
                    key={target}
                    className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded"
                  >
                    {target}
                  </span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Deployment Target Selection */}
      {selectedProvider && (
        <div>
          <h4 className="text-base font-medium text-text-primary mb-4">Select Deployment Type</h4>
          <div className="grid md:grid-cols-3 gap-4">
            {availableTargets.map((target) => (
              <button
                key={target.id}
                onClick={() => onTargetSelect(target.name)}
                className={`text-left p-4 rounded-lg border-2 transition-all duration-150 ${
                  selectedTarget === target.name
                    ? 'border-primary bg-primary/5'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                    <target.icon className="w-4 h-4 text-text-secondary" />
                  </div>
                  {selectedTarget === target.name && (
                    <Check className="w-5 h-5 text-primary" />
                  )}
                </div>
                <h5 className="font-medium text-text-primary mb-2">{target.name}</h5>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {target.description}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Provider-specific notes */}
      {selectedProvider && selectedTarget && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2">Deployment Notes</h5>
          <p className="text-sm text-blue-800">
            {selectedProvider === 'vercel' && selectedTarget === 'Static Site' && 
              'Vercel will automatically detect your framework and configure the build settings. Perfect for React, Vue, Next.js, and other modern frameworks.'}
            {selectedProvider === 'netlify' && selectedTarget === 'Static Site' && 
              'Netlify provides continuous deployment from Git with built-in forms, functions, and split testing capabilities.'}
            {selectedProvider === 'aws' && selectedTarget === 'Container' && 
              'AWS will deploy your Docker container using ECS or EKS. Make sure your application includes a Dockerfile.'}
            {selectedProvider === 'digitalocean' && selectedTarget === 'Container' && 
              'DigitalOcean App Platform will build and deploy your container with automatic scaling and load balancing.'}
          </p>
        </div>
      )}
    </div>
  )
}

export default ProviderSelect