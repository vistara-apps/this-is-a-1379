import React from 'react'
import { Routes, Route } from 'react-router-dom'
import AppShell from './components/AppShell'
import LandingPage from './pages/LandingPage'
import Dashboard from './pages/Dashboard'
import DeploymentWizard from './pages/DeploymentWizard'
import ProjectDetails from './pages/ProjectDetails'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/deploy" element={<DeploymentWizard />} />
        <Route path="/project/:id" element={<ProjectDetails />} />
      </Routes>
    </AppShell>
  )
}

export default App