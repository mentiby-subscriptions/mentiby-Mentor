'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from './LoginForm'
import { Shield, Loader2 } from 'lucide-react'

interface AuthWrapperProps {
  children: React.ReactNode
}

export default function AuthWrapper({ children }: AuthWrapperProps) {
  const { user, loading, isAuthenticated, refreshAuth } = useAuth()
  const [mounted, setMounted] = useState(false)

  // Ensure we're on the client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Show loading spinner while checking auth or if not yet mounted
  if (loading || !mounted) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-slate-950 to-indigo-950/40" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
        
        <div className="relative text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 via-indigo-500 to-violet-600 rounded-2xl mb-5 shadow-lg shadow-violet-500/30 ring-1 ring-white/10">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Loader2 className="w-6 h-6 text-violet-400 animate-spin" />
            <h2 className="text-xl font-semibold text-white">
              Verifying Access...
            </h2>
          </div>
          <p className="text-slate-400">
            Checking your session
          </p>
        </div>
      </div>
    )
  }

  // Show login form if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <LoginForm
        onSuccess={() => {
          refreshAuth()
        }}
      />
    )
  }

  // User is authenticated - show the dashboard
  return <>{children}</>
} 
