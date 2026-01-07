'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'

interface LoadingAnimationProps {
  title?: string
  steps?: string[]
  icon?: React.ReactNode
}

export default function LoadingAnimation({ 
  title = 'Loading',
  steps = ['Please wait...'],
  icon
}: LoadingAnimationProps) {
  const [loadingStep, setLoadingStep] = useState(0)

  useEffect(() => {
    if (steps.length > 1) {
      const interval = setInterval(() => {
        setLoadingStep(prev => (prev + 1) % steps.length)
      }, 1500)
      return () => clearInterval(interval)
    }
  }, [steps.length])

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center justify-center">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-slate-950 to-indigo-950/20" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      {/* Loading Animation */}
      <div className="relative z-10 flex flex-col items-center">
        {/* Spinning rings */}
        <div className="relative mb-8">
          {/* Outer spinning ring */}
          <div className="w-32 h-32 rounded-full border-4 border-transparent border-t-violet-500 border-r-indigo-500 animate-spin" />
          
          {/* Inner spinning ring (opposite direction) */}
          <div 
            className="absolute inset-2 w-28 h-28 rounded-full border-4 border-transparent border-b-cyan-400 border-l-purple-500 animate-spin" 
            style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} 
          />
          
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/50 animate-pulse">
              {icon || <Loader2 className="w-8 h-8 text-white animate-spin" />}
            </div>
          </div>
          
          {/* Floating particles */}
          <div className="absolute -top-2 -right-2 w-4 h-4 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
          <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
          <div className="absolute top-1/2 -right-4 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }} />
        </div>

        {/* Loading text */}
        <div className="text-center">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-3">
            {title}
          </h2>
          <div className="flex items-center justify-center space-x-2 text-slate-400">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4 h-6 transition-all duration-300">
            {steps[loadingStep]}
          </p>
        </div>

        {/* Progress bar */}
        {steps.length > 1 && (
          <div className="w-64 h-1 bg-slate-800 rounded-full mt-6 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-violet-500 via-indigo-500 to-purple-500 rounded-full animate-pulse"
              style={{ 
                width: `${((loadingStep + 1) / steps.length) * 100}%`,
                transition: 'width 0.5s ease-out'
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

