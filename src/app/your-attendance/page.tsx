'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoadingAnimation from '@/components/LoadingAnimation'
import { 
  ArrowLeft, Loader2, RefreshCw, Users, Home,
  CheckCircle2, XCircle, Award, TrendingUp, Calendar,
  Sparkles, LogOut, UserCheck
} from 'lucide-react'

interface AttendanceData {
  mentor_id: number
  name: string
  email: string | null
  total_classes: number
  present: number
  absent: number
  special_attendance: number
  attendance_percent: number
  updated_at?: string
}

export default function YourAttendancePage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  
  const [loading, setLoading] = useState(true)
  const [calculating, setCalculating] = useState(false)
  const [attendance, setAttendance] = useState<AttendanceData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Calculate and fetch attendance
  const calculateAttendance = async () => {
    if (!user?.mentorId) return

    setCalculating(true)
    setError(null)

    try {
      // First, trigger calculation
      const calcResponse = await fetch('/api/mentor-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId: user.mentorId })
      })

      const calcData = await calcResponse.json()

      if (!calcResponse.ok) {
        throw new Error(calcData.error || 'Failed to calculate attendance')
      }

      // Set the data from calculation response
      setAttendance(calcData.data)
    } catch (err: any) {
      console.error('Error calculating attendance:', err)
      setError(err.message || 'Something went wrong')
    } finally {
      setCalculating(false)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.mentorId) {
      calculateAttendance()
    }
  }, [user?.mentorId])

  const handleLogout = async () => {
    await signOut()
    router.push('/login')
  }

  // Get color based on percentage
  const getPercentColor = (percent: number) => {
    if (percent >= 90) return 'text-emerald-400'
    if (percent >= 75) return 'text-green-400'
    if (percent >= 60) return 'text-yellow-400'
    if (percent >= 40) return 'text-orange-400'
    return 'text-red-400'
  }

  const getPercentBgColor = (percent: number) => {
    if (percent >= 90) return 'from-emerald-500/20 to-green-500/20 border-emerald-500/30'
    if (percent >= 75) return 'from-green-500/20 to-teal-500/20 border-green-500/30'
    if (percent >= 60) return 'from-yellow-500/20 to-amber-500/20 border-yellow-500/30'
    if (percent >= 40) return 'from-orange-500/20 to-red-500/20 border-orange-500/30'
    return 'from-red-500/20 to-rose-500/20 border-red-500/30'
  }

  if (!user) {
    return (
      <LoadingAnimation 
        title="Loading" 
        steps={['Please wait...']}
        icon={<UserCheck className="w-8 h-8 text-white" />}
      />
    )
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
                className="px-4 sm:px-6 py-3 text-sm font-medium text-white bg-gradient-to-r from-violet-500/20 to-indigo-500/20 rounded-lg whitespace-nowrap"
              >
                <Award className="w-4 h-4 inline-block mr-2" />
                Your Attendance
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
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Your Attendance</h1>
            <p className="text-slate-400">Track your class attendance and performance</p>
          </div>
          <button
            onClick={calculateAttendance}
            disabled={calculating}
            className="flex items-center gap-2 px-4 py-2 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/30 text-violet-400 rounded-xl transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${calculating ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{calculating ? 'Calculating...' : 'Refresh'}</span>
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            {/* Spinning rings */}
            <div className="relative mb-8">
              <div className="w-28 h-28 rounded-full border-4 border-transparent border-t-violet-500 border-r-indigo-500 animate-spin" />
              <div className="absolute inset-2 w-[96px] h-[96px] rounded-full border-4 border-transparent border-b-cyan-400 border-l-purple-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 bg-gradient-to-br from-violet-500 via-indigo-500 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/50 animate-pulse">
                  <UserCheck className="w-7 h-7 text-white" />
                </div>
              </div>
              <div className="absolute -top-2 -right-2 w-4 h-4 bg-violet-400 rounded-full animate-bounce" />
              <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              <div className="absolute top-1/2 -right-4 w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.6s' }} />
            </div>
            <h2 className="text-xl font-bold bg-gradient-to-r from-violet-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent mb-2">
              Calculating Attendance
            </h2>
            <div className="flex space-x-1 mb-3">
              <div className="w-2 h-2 bg-violet-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-slate-500 text-sm">Scanning your completed classes...</p>
          </div>
        ) : error ? (
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">Error</h3>
            <p className="text-red-400">{error}</p>
            <button
              onClick={calculateAttendance}
              className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : attendance ? (
          <div className="space-y-6">
            {/* Main Percentage Card */}
            <div className={`bg-gradient-to-br ${getPercentBgColor(attendance.attendance_percent)} border rounded-3xl p-8 sm:p-10`}>
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full mb-6">
                  <TrendingUp className="w-4 h-4 text-white" />
                  <span className="text-white text-sm font-medium">Attendance Rate</span>
                </div>
                
                <div className={`text-7xl sm:text-8xl font-bold ${getPercentColor(attendance.attendance_percent)} mb-4`}>
                  {attendance.attendance_percent}%
                </div>
                
                <p className="text-slate-300 text-lg">
                  {attendance.attendance_percent >= 90 ? '🎉 Excellent! Keep it up!' :
                   attendance.attendance_percent >= 75 ? '👍 Good performance!' :
                   attendance.attendance_percent >= 60 ? '📈 Room for improvement' :
                   attendance.attendance_percent >= 40 ? '⚠️ Needs attention' :
                   '🚨 Critical - Please improve attendance'}
                </p>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Classes */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Total Classes</span>
                </div>
                <p className="text-3xl font-bold text-white">{attendance.total_classes}</p>
              </div>

              {/* Present */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Present</span>
                </div>
                <p className="text-3xl font-bold text-emerald-400">{attendance.present}</p>
              </div>

              {/* Absent */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-red-500/20 rounded-lg">
                    <XCircle className="w-5 h-5 text-red-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Absent</span>
                </div>
                <p className="text-3xl font-bold text-red-400">{attendance.absent}</p>
              </div>

              {/* Special (Covered for others) */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Award className="w-5 h-5 text-purple-400" />
                  </div>
                  <span className="text-slate-400 text-sm">Special</span>
                </div>
                <p className="text-3xl font-bold text-purple-400">{attendance.special_attendance}</p>
                <p className="text-xs text-slate-500 mt-1">Covered for others</p>
              </div>
            </div>

            {/* Info Card */}
            <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-6">
              <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                How is this calculated?
              </h3>
              <ul className="space-y-3 text-sm text-slate-400">
                <li className="flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Present:</strong> Classes you were assigned and completed</span>
                </li>
                <li className="flex items-start gap-3">
                  <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Absent:</strong> Classes you were assigned but not completed or other mentor took</span>
                </li>
                <li className="flex items-start gap-3">
                  <Award className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span><strong className="text-white">Special:</strong> Classes you took on behalf of other mentors</span>
                </li>
              </ul>
            </div>

            {/* Last Updated */}
            {attendance.updated_at && (
              <p className="text-center text-slate-500 text-sm">
                Last calculated: {new Date(attendance.updated_at).toLocaleString('en-IN')}
              </p>
            )}
          </div>
        ) : (
          <div className="bg-slate-800/30 border border-slate-700/30 rounded-2xl p-12 text-center">
            <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Attendance Data</h3>
            <p className="text-slate-400 mb-6">Click refresh to calculate your attendance</p>
            <button
              onClick={calculateAttendance}
              disabled={calculating}
              className="px-6 py-3 bg-violet-500 hover:bg-violet-600 text-white rounded-xl transition-colors disabled:opacity-50"
            >
              Calculate Now
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

