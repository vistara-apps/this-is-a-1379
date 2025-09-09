import React from 'react'
import { CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react'

const DeploymentStatusBadge = ({ status, size = 'default' }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'success':
        return {
          icon: CheckCircle,
          text: 'Success',
          className: 'bg-green-100 text-green-800 border-green-200'
        }
      case 'failed':
        return {
          icon: XCircle,
          text: 'Failed',
          className: 'bg-red-100 text-red-800 border-red-200'
        }
      case 'inProgress':
        return {
          icon: Clock,
          text: 'In Progress',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
        }
      case 'pending':
        return {
          icon: AlertCircle,
          text: 'Pending',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
      default:
        return {
          icon: AlertCircle,
          text: 'Unknown',
          className: 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon
  
  const sizeClasses = size === 'sm' 
    ? 'px-2 py-1 text-xs' 
    : 'px-3 py-1 text-sm'
  
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'

  return (
    <span className={`inline-flex items-center space-x-1 ${sizeClasses} font-medium rounded-full border ${config.className}`}>
      <Icon className={iconSize} />
      <span>{config.text}</span>
    </span>
  )
}

export default DeploymentStatusBadge