'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import XPLeaderboard from '@/components/XPLeaderboard'
import { 
  Home, Users, Award, Trophy, LogOut, Sparkles
} from 'lucide-react'

export default function XPLeaderboardPage() {
  const router = useRouter()
  const { signOut } = useAuth()

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-950/20 via-slate-950 to-indigo-950/20" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-violet-600/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
                MentiBY
              </span>
            </div>
            
            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 bg-slate-800/50 rounded-xl p-1 overflow-x-auto">
              <button
                onClick={() => router.push('/home')}
                className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Home className="w-4 h-4 inline-block mr-2" />
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
                onClick={() => router.push('/your-attendance')}
                className="px-4 sm:px-6 py-3 text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-colors whitespace-nowrap"
              >
                <Award className="w-4 h-4 inline-block mr-2" />
                Your Attendance
              </button>
              <button
                className="px-4 sm:px-6 py-3 text-sm font-medium text-amber-400 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-lg whitespace-nowrap"
              >
                <Trophy className="w-4 h-4 inline-block mr-2" />
                XP Leaderboard
              </button>
            </div>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <XPLeaderboard />
      </main>
    </div>
  )
}

