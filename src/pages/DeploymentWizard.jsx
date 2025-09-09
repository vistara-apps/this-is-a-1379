import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WizardForm from '../components/WizardForm'
import ProviderSelect from '../components/ProviderSelect'
import RepositorySelector from '../components/RepositorySelector'
import CodeInput from '../components/CodeInput'

const DeploymentWizard = () => {
  const navigate = useNavigate()
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    projectName: '',
    repository: null,
    cloudProvider: '',
    deploymentTarget: '',
    buildCommand: '',
    outputDirectory: '',
    environmentVariables: []
  })

  const steps = [
    { id: 1, name: 'Project Setup', description: 'Configure your project details' },
    { id: 2, name: 'Repository', description: 'Connect your code repository' },
    { id: 3, name: 'Provider', description: 'Choose your deployment target' },
    { id: 4, name: 'Configuration', description: 'Set build and deployment settings' },
    { id: 5, name: 'Deploy', description: 'Review and deploy your application' }
  ]

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleDeploy = async () => {
    // Mock deployment process
    console.log('Deploying with data:', formData)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Redirect to dashboard
    navigate('/dashboard')
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">Deploy New Project</h1>
        <p className="text-text-secondary">Get your application live in minutes</p>
      </div>

      <WizardForm
        steps={steps}
        currentStep={currentStep}
        onNext={nextStep}
        onPrev={prevStep}
        onDeploy={handleDeploy}
        formData={formData}
        updateFormData={updateFormData}
      />
    </div>
  )
}

export default DeploymentWizard