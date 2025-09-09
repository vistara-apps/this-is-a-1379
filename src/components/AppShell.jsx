import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Cloud, Menu, X, User, LogOut } from 'lucide-react'

const AppShell = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const location = useLocation()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', current: location.pathname === '/dashboard' },
    { name: 'Deploy', href: '/deploy', current: location.pathname === '/deploy' },
  ]

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen)

  const handleAuth = () => {
    setIsLoggedIn(!isLoggedIn)
  }

  return (
    <div className="min-h-screen bg-bg">
      <nav className="bg-surface shadow-card">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-md flex items-center justify-center">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-text-primary">DeployMate</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {isLoggedIn && navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                    item.current
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              <button
                onClick={handleAuth}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  isLoggedIn
                    ? 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                    : 'bg-primary text-white hover:opacity-90'
                }`}
              >
                {isLoggedIn ? (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={toggleMenu}
                className="p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-gray-100"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden bg-surface border-t border-gray-200">
            <div className="px-6 py-4 space-y-3">
              {isLoggedIn && navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    item.current
                      ? 'bg-primary text-white'
                      : 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              <button
                onClick={() => {
                  handleAuth()
                  setIsMenuOpen(false)
                }}
                className={`flex items-center space-x-2 w-full text-left px-3 py-2 rounded-md text-base font-medium ${
                  isLoggedIn
                    ? 'text-text-secondary hover:text-text-primary hover:bg-gray-100'
                    : 'bg-primary text-white'
                }`}
              >
                {isLoggedIn ? (
                  <>
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}

export default AppShell