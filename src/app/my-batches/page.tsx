'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuthWrapper from '@/components/auth/AuthWrapper'
import { useAuth } from '@/contexts/AuthContext'
import { 
  GraduationCap, Users, ChevronRight, Loader2, RefreshCw, 
  LogOut, Calendar, Edit3, Sparkles
} from 'lucide-react'

interface Batch {
  tableName: string
  batchName: string
  sessionCount: number
}

function MyBatchesContent() {
  const router = useRouter()
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

  const handleSelectBatch = (batch: Batch) => {
    sessionStorage.setItem('selectedBatch', JSON.stringify(batch))
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-slate-950 to-indigo-950/20" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white">
                  Menti<span className="text-violet-400">BY</span>
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm">Mentor Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-white font-medium text-sm">{user?.name || 'Mentor'}</p>
                <p className="text-slate-500 text-xs">{user?.email}</p>
              </div>
              <button
                onClick={signOut}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="relative z-10 border-b border-white/5 bg-slate-900/30 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => router.push('/home')}
              className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 inline-block mr-2" />
              Home
            </button>
            <button
              className="px-4 sm:px-6 py-3 text-sm font-medium text-violet-400 border-b-2 border-violet-400 bg-violet-500/5 whitespace-nowrap"
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              My Batches
            </button>
            <button
              onClick={() => router.push('/edit-sessions')}
              className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              <Edit3 className="w-4 h-4 inline-block mr-2" />
              Edit Sessions
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Welcome Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-3">
            Your <span className="text-violet-400">Batches</span>
          </h2>
          <p className="text-slate-400 text-sm sm:text-lg">
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
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <p className="text-slate-400 text-sm sm:text-base">
                <span className="text-white font-semibold">{batches.length}</span> batch{batches.length !== 1 ? 'es' : ''} assigned to you
              </p>
              <button
                onClick={fetchBatches}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {batches.map((batch, index) => (
                <button
                  key={batch.tableName}
                  onClick={() => handleSelectBatch(batch)}
                  className="group relative bg-gradient-to-b from-slate-800/50 to-slate-900/50 border border-white/5 hover:border-violet-500/30 rounded-2xl p-5 sm:p-6 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-violet-500/10"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Glow effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-b from-violet-500/0 to-violet-500/0 group-hover:from-violet-500/5 group-hover:to-transparent rounded-2xl transition-all duration-300" />
                  
                  <div className="relative">
                    {/* Icon */}
                    <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-violet-500/20 to-indigo-500/20 border border-violet-500/20 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 sm:w-7 sm:h-7 text-violet-400" />
                    </div>

                    {/* Batch Name */}
                    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
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

export default function MyBatchesPage() {
  return (
    <AuthWrapper>
      <MyBatchesContent />
    </AuthWrapper>
  )
}
