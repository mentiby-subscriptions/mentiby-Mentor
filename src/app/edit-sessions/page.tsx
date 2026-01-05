'use client'

import { useRouter } from 'next/navigation'
import AuthWrapper from '@/components/auth/AuthWrapper'
import { useAuth } from '@/contexts/AuthContext'
import { 
  Calendar, Edit3, Users, LogOut, ArrowLeft,
  Sparkles, Construction
} from 'lucide-react'

function EditSessionsPage() {
  const router = useRouter()
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-slate-950 to-indigo-950/20" />
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
              onClick={() => router.push('/my-batches')}
              className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
            >
              <Users className="w-4 h-4 inline-block mr-2" />
              My Batches
            </button>
            <button
              className="px-4 sm:px-6 py-3 text-sm font-medium text-violet-400 border-b-2 border-violet-400 bg-violet-500/5 whitespace-nowrap"
            >
              <Edit3 className="w-4 h-4 inline-block mr-2" />
              Edit Sessions
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content - Coming Soon */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center">
          <div className="w-24 h-24 bg-slate-800/50 border border-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Construction className="w-12 h-12 text-amber-400" />
          </div>
          <h2 className="text-3xl font-bold text-white mb-3">Edit Sessions</h2>
          <p className="text-slate-400 mb-8 max-w-md mx-auto">
            This feature is coming soon. You&apos;ll be able to edit your session details, topics, and materials here.
          </p>
          <button
            onClick={() => router.push('/home')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-violet-500/20 hover:bg-violet-500/30 border border-violet-500/30 text-violet-400 rounded-xl transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>
      </main>
    </div>
  )
}

export default function EditSessionsPageWrapper() {
  return (
    <AuthWrapper>
      <EditSessionsPage />
    </AuthWrapper>
  )
}

