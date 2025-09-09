import React from 'react'

const CodeInput = ({ value, onChange, placeholder, variant = 'singleline' }) => {
  const baseClasses = "font-mono text-sm bg-gray-900 text-green-400 rounded-md p-3 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder-gray-500"
  
  if (variant === 'multiline') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className={`${baseClasses} w-full resize-vertical min-h-[100px]`}
      />
    )
  }
  
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`${baseClasses} w-full`}
    />
  )
}

export default CodeInput