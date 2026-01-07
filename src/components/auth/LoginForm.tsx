'use client'

import React, { useState, useEffect } from 'react'
import { Mail, Shield, AlertCircle, CheckCircle, Loader2, ExternalLink } from 'lucide-react'
import { authService } from '@/lib/auth'

interface LoginFormProps {
  onSuccess?: () => void
}

export default function LoginForm({ onSuccess }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [mentorName, setMentorName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [linkSent, setLinkSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const { data, error: sendError } = await authService.sendMagicLink(email)

      if (sendError || !data) {
        setError(sendError || 'Failed to send verification link')
        return
      }

      setMentorName(data.mentorName)
      setLinkSent(true)
      setCountdown(60)
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Send magic link error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return
    setError(null)
    setIsLoading(true)

    try {
      const { data, error: sendError } = await authService.sendMagicLink(email)

      if (sendError || !data) {
        setError(sendError || 'Failed to resend verification link')
        return
      }

      setCountdown(60)
    } catch (err) {
      setError('Failed to resend. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChangeEmail = () => {
    setLinkSent(false)
    setError(null)
    setMentorName('')
  }

  if (!isClient) return null

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/40 via-slate-950 to-indigo-950/40" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-conic from-violet-600/10 via-transparent to-indigo-600/10 rounded-full blur-2xl" />
      </div>

      {/* Grid Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }}
      />

      <div className="relative w-full max-w-md">
        {/* Login Card */}
        <div className="relative bg-gradient-to-b from-slate-900/80 to-slate-950/90 backdrop-blur-2xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl shadow-violet-950/20">
          {/* Glow Effect */}
          <div className="absolute -inset-px bg-gradient-to-b from-violet-500/20 via-transparent to-transparent rounded-3xl pointer-events-none" />
          
          {/* Header */}
          <div className="relative text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 via-indigo-500 to-violet-600 rounded-2xl mb-5 shadow-lg shadow-violet-500/30 ring-1 ring-white/10">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Menti<span className="text-violet-400">BY</span>
            </h1>
            <p className="text-slate-400 mt-2 text-sm">
              Mentor Dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="relative mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Content */}
          {!linkSent ? (
            <form onSubmit={handleSendLink} className="relative space-y-6">
            <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email Address
              </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-500 group-focus-within:text-violet-400 transition-colors" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                    className="block w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500/50 transition-all duration-200"
                    placeholder="mentor@example.com"
                />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Enter your registered mentor email
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading || !email}
                className="group w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:from-slate-700 disabled:to-slate-700 text-white font-semibold py-3.5 px-4 rounded-xl transition-all duration-300 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 disabled:shadow-none flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Link...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Login Link
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="relative space-y-6">
              {/* Success State */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-xl font-semibold text-white mb-2">Check your email!</h2>
                <p className="text-slate-400 text-sm">
                  Hi <span className="text-violet-400 font-medium">{mentorName}</span>, we sent a login link to
                </p>
                <p className="text-white font-medium mt-1">{email}</p>
            </div>

              {/* Instructions */}
              <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-violet-400 text-xs font-bold">1</span>
                  </div>
                  <p className="text-slate-300 text-sm">Open your email inbox</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-violet-400 text-xs font-bold">2</span>
                  </div>
                  <p className="text-slate-300 text-sm">Click the login link in the email</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-violet-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-violet-400 text-xs font-bold">3</span>
                  </div>
                  <p className="text-slate-300 text-sm">You&apos;ll be automatically logged in</p>
                </div>
              </div>

              {/* Open Gmail Button */}
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full bg-slate-800/50 hover:bg-slate-700/50 border border-slate-700/50 text-white font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open Gmail
              </a>

              {/* Resend & Change Email */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleChangeEmail}
                  className="text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Change email
                </button>
                <button
                  onClick={handleResend}
                  disabled={countdown > 0 || isLoading}
                  className="text-sm text-violet-400 hover:text-violet-300 disabled:text-slate-600 transition-colors disabled:cursor-not-allowed"
                >
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend link'}
                </button>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="relative mt-8 pt-6 border-t border-slate-800/50 text-center">
            <p className="text-slate-600 text-xs">
              Only registered mentors can access this dashboard
            </p>
          </div>
        </div>

        {/* Security Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800/50 rounded-full">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-slate-500 text-xs">Secured with Supabase Auth</span>
          </div>
        </div>
      </div>
    </div>
  )
} 
