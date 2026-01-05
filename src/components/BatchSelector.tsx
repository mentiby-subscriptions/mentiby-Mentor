'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { GraduationCap, Users, ChevronRight, Loader2, RefreshCw, LogOut, Calendar } from 'lucide-react'

interface Batch {
  tableName: string
  batchName: string
  sessionCount: number
}

interface BatchSelectorProps {
  onSelectBatch: (batch: Batch) => void
}

export default function BatchSelector({ onSelectBatch }: BatchSelectorProps) {
  const { user, signOut } = useAuth()
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBatches = async () => {
    if (!user?.mentorId) {
      setError('No mentor ID found in session')
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/mentor/batches?mentor_id=${user.mentorId}`)
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch batches')
        return
      }

      setBatches(data.batches || [])
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBatches()
  }, [user?.mentorId])

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background */}
      <div className="fixed inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/30 via-slate-950 to-indigo-950/30" />
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Menti<span className="text-violet-400">BY</span>
                </h1>
                <p className="text-slate-400 text-sm">Mentor Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-white font-medium">{user?.name || 'Mentor'}</p>
                <p className="text-slate-400 text-sm">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-white mb-3">
            Welcome back, <span className="text-violet-400">{user?.name?.split(' ')[0] || 'Mentor'}</span>! 👋
          </h2>
          <p className="text-slate-400 text-lg">
            Select a batch to view and manage your sessions
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-12 h-12 text-violet-400 animate-spin mb-4" />
            <p className="text-slate-400">Loading your batches...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="max-w-md mx-auto">
            <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-6 text-center">
              <p className="text-red-400 mb-4">{error}</p>
              <button
                onClick={fetchBatches}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && batches.length === 0 && (
          <div className="max-w-md mx-auto text-center py-20">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No batches assigned</h3>
            <p className="text-slate-400 mb-6">
              You don&apos;t have any batches assigned yet. Please contact the admin.
            </p>
            <button
              onClick={fetchBatches}
              className="inline-flex items-center gap-2 px-4 py-2 bg-violet-500/20 hover:bg-violet-500/30 text-violet-400 rounded-lg transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        )}

        {/* Batch Grid */}
        {!loading && !error && batches.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-8">
              <p className="text-slate-400">
                <span className="text-white font-semibold">{batches.length}</span> batch{batches.length !== 1 ? 'es' : ''} assigned to you
              </p>
              <button
                onClick={fetchBatches}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.map((batch, index) => (
                <button
                  key={batch.tableName}
                  onClick={() => onSelectBatch(batch)}
                  className="group relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-white/5 hover:border-violet-500/30 rounded-2xl p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-violet-500/0 to-violet-500/0 group-hover:from-violet-500/5 group-hover:to-transparent rounded-2xl transition-all duration-300" />
                  
                  <div className="relative">
                    {/* Icon */}
                    <div className="w-14 h-14 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users className="w-7 h-7 text-violet-400" />
                    </div>

                    {/* Batch Name */}
                    <h3 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                      {batch.batchName}
                    </h3>

                    {/* Session Count */}
                    <p className="text-slate-400 text-sm mb-4">
                      {batch.sessionCount} session{batch.sessionCount !== 1 ? 's' : ''} assigned
                    </p>

                    {/* Arrow */}
                    <div className="flex items-center text-violet-400 text-sm font-medium">
                      <span>View Dashboard</span>
                      <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

