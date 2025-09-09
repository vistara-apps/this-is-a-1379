import React, { useState } from 'react'
import { Check, ChevronRight, ChevronLeft } from 'lucide-react'
import RepositorySelector from './RepositorySelector'
import ProviderSelect from './ProviderSelect'
import CodeInput from './CodeInput'

const WizardForm = ({ steps, currentStep, onNext, onPrev, onDeploy, formData, updateFormData }) => {
  const [isDeploying, setIsDeploying] = useState(false)

  const handleDeploy = async () => {
    setIsDeploying(true)
    await onDeploy()
    setIsDeploying(false)
  }

  const isStepValid = (step) => {
    switch (step) {
      case 1:
        return formData.projectName.trim() !== ''
      case 2:
        return formData.repository !== null
      case 3:
        return formData.cloudProvider !== '' && formData.deploymentTarget !== ''
      case 4:
        return formData.buildCommand.trim() !== ''
      default:
        return true
    }
  }

  const canProceed = isStepValid(currentStep)

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-250 ${
                step.id < currentStep
                  ? 'bg-primary border-primary text-white'
                  : step.id === currentStep
                  ? 'border-primary text-primary bg-primary/10'
                  : 'border-gray-300 text-gray-400'
              }`}>
                {step.id < currentStep ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <span className="text-sm font-medium">{step.id}</span>
                )}
              </div>
              
              {index < steps.length - 1 && (
                <div className={`h-1 w-12 mx-2 transition-all duration-250 ${
                  step.id < currentStep ? 'bg-primary' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-center">
          <h2 className="text-xl font-semibold text-text-primary">
            {steps[currentStep - 1].name}
          </h2>
          <p className="text-text-secondary">
            {steps[currentStep - 1].description}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <div className="card mb-8">
        {currentStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-text-primary">Project Details</h3>
            
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={formData.projectName}
                onChange={(e) => updateFormData('projectName', e.target.value)}
                placeholder="Enter your project name"
                className="input-field"
              />
              <p className="text-xs text-text-secondary mt-1">
                This will be used to identify your project in the dashboard
              </p>
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-text-primary">Connect Repository</h3>
            <RepositorySelector
              selectedRepo={formData.repository}
              onSelect={(repo) => updateFormData('repository', repo)}
            />
          </div>
        )}

        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-text-primary">Choose Deployment Target</h3>
            <ProviderSelect
              selectedProvider={formData.cloudProvider}
              selectedTarget={formData.deploymentTarget}
              onProviderSelect={(provider) => updateFormData('cloudProvider', provider)}
              onTargetSelect={(target) => updateFormData('deploymentTarget', target)}
            />
          </div>
        )}

        {currentStep === 4 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-text-primary">Build Configuration</h3>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Build Command
                </label>
                <CodeInput
                  value={formData.buildCommand}
                  onChange={(value) => updateFormData('buildCommand', value)}
                  placeholder="npm run build"
                  variant="singleline"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Command to build your application
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Output Directory
                </label>
                <CodeInput
                  value={formData.outputDirectory}
                  onChange={(value) => updateFormData('outputDirectory', value)}
                  placeholder="dist"
                  variant="singleline"
                />
                <p className="text-xs text-text-secondary mt-1">
                  Directory containing build output
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Environment Variables (Optional)
              </label>
              <CodeInput
                value={formData.environmentVariables.join('\n')}
                onChange={(value) => updateFormData('environmentVariables', value.split('\n').filter(Boolean))}
                placeholder="NODE_ENV=production&#10;API_URL=https://api.example.com"
                variant="multiline"
              />
              <p className="text-xs text-text-secondary mt-1">
                One environment variable per line (KEY=value)
              </p>
            </div>
          </div>
        )}

        {currentStep === 5 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-text-primary">Review & Deploy</h3>
            
            <div className="bg-gray-50 rounded-md p-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-text-secondary block">Project Name</span>
                  <span className="text-text-primary font-medium">{formData.projectName}</span>
                </div>
                
                <div>
                  <span className="text-text-secondary block">Repository</span>
                  <span className="text-text-primary font-medium">
                    {formData.repository?.name || 'Not selected'}
                  </span>
                </div>
                
                <div>
                  <span className="text-text-secondary block">Cloud Provider</span>
                  <span className="text-text-primary font-medium">{formData.cloudProvider}</span>
                </div>
                
                <div>
                  <span className="text-text-secondary block">Deployment Type</span>
                  <span className="text-text-primary font-medium">{formData.deploymentTarget}</span>
                </div>
                
                <div>
                  <span className="text-text-secondary block">Build Command</span>
                  <code className="text-text-primary bg-white px-2 py-1 rounded text-xs">
                    {formData.buildCommand}
                  </code>
                </div>
                
                <div>
                  <span className="text-text-secondary block">Output Directory</span>
                  <code className="text-text-primary bg-white px-2 py-1 rounded text-xs">
                    {formData.outputDirectory}
                  </code>
                </div>
              </div>
              
              {formData.environmentVariables.length > 0 && (
                <div>
                  <span className="text-text-secondary block text-sm">Environment Variables</span>
                  <div className="mt-1 space-y-1">
                    {formData.environmentVariables.map((env, index) => (
                      <code key={index} className="text-text-primary bg-white px-2 py-1 rounded text-xs block">
                        {env}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <p className="text-blue-800 text-sm">
                <strong>Ready to deploy!</strong> Your application will be built and deployed to {formData.cloudProvider}. 
                This process typically takes 2-5 minutes.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onPrev}
          disabled={currentStep === 1}
          className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
            currentStep === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
          }`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {currentStep < steps.length ? (
          <button
            onClick={onNext}
            disabled={!canProceed}
            className={`flex items-center space-x-2 px-6 py-3 rounded-md font-medium transition-all duration-150 ${
              canProceed
                ? 'bg-primary text-white hover:opacity-90'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <span>Continue</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleDeploy}
            disabled={isDeploying}
            className={`px-8 py-3 rounded-md font-medium transition-all duration-150 ${
              isDeploying
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary text-white hover:opacity-90'
            }`}
          >
            {isDeploying ? 'Deploying...' : 'Deploy Project'}
          </button>
        )}
      </div>
    </div>
  )
}

export default WizardForm