import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Zap, Shield, Layers, Cloud, Github, CheckCircle } from 'lucide-react'

const LandingPage = () => {
  const features = [
    {
      icon: Zap,
      title: 'One-Click Deployment',
      description: 'Deploy your applications in seconds with our intuitive wizard that handles all the complexity for you.'
    },
    {
      icon: Layers,
      title: 'Container Support',
      description: 'Deploy Dockerized applications without managing complex orchestration tools like Kubernetes.'
    },
    {
      icon: Shield,
      title: 'Automated CI/CD',
      description: 'Set up continuous integration and deployment pipelines that trigger on every code change.'
    },
    {
      icon: Cloud,
      title: 'Multi-Cloud Support',
      description: 'Deploy to AWS, Vercel, Netlify, and more - all from a single interface.'
    }
  ]

  const providers = [
    { name: 'Vercel', color: 'bg-black' },
    { name: 'AWS', color: 'bg-orange-500' },
    { name: 'Netlify', color: 'bg-teal-500' },
    { name: 'GitHub', color: 'bg-gray-800' }
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent"></div>
        
        <div className="max-w-6xl mx-auto px-6 py-20 relative">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold text-text-primary mb-6 animate-fade-in">
              DeployMate
            </h1>
            <p className="text-xl md:text-2xl text-text-secondary mb-4 animate-slide-up">
              Select no your devard
            </p>
            <p className="text-lg text-text-secondary mb-12 max-w-2xl mx-auto animate-slide-up">
              Deploy to cloud platforms, serverless, and containers fast-responsive 
              PAN supporting and deploying to existing platforms.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Link
                to="/deploy"
                className="btn-primary flex items-center space-x-2 text-lg px-8 py-4 animate-slide-up"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/dashboard"
                className="btn-secondary flex items-center space-x-2 text-lg px-8 py-4 animate-slide-up"
              >
                <Github className="w-5 h-5" />
                <span>View Demo</span>
              </Link>
            </div>

            {/* Provider Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-16">
              {providers.map((provider, index) => (
                <div
                  key={provider.name}
                  className="card text-center py-8 hover:shadow-lg transition-all duration-250 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`w-12 h-12 ${provider.color} rounded-lg mx-auto mb-3 flex items-center justify-center`}>
                    <span className="text-white font-bold text-lg">{provider.name[0]}</span>
                  </div>
                  <h3 className="font-medium text-text-primary">{provider.name}</h3>
                </div>
              ))}
            </div>

            {/* Mock Dashboard Preview */}
            <div className="card max-w-4xl mx-auto animate-slide-up">
              <div className="bg-gray-100 rounded-md p-4 mb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="text-sm text-text-secondary">deploymate.app</div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-white rounded w-3/4"></div>
                  <div className="h-4 bg-white rounded w-1/2"></div>
                  <div className="h-4 bg-white rounded w-5/6"></div>
                </div>
              </div>
              <p className="text-text-secondary text-sm">
                Intuitive dashboard to manage all your deployments
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-6">
              Everything you need to deploy fast
            </h2>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto">
              From code to cloud in minutes, not hours. DeployMate handles the complexity 
              so you can focus on building great applications.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="card hover:shadow-lg transition-all duration-250 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-text-primary mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-accent">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to deploy faster?
          </h2>
          <p className="text-xl text-white/90 mb-8">
            Join thousands of developers who've simplified their deployment workflow.
          </p>
          <Link
            to="/deploy"
            className="inline-flex items-center space-x-2 bg-white text-primary px-8 py-4 rounded-md font-medium text-lg hover:bg-gray-50 transition-colors duration-150"
          >
            <span>Start Deploying Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  )
}

export default LandingPage