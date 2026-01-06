'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AuthWrapper from '@/components/auth/AuthWrapper'
import { 
  Calendar, Clock, Video, FileText,
  Users, Edit3, LogOut, Loader2, RefreshCw,
  BookOpen, Sparkles
} from 'lucide-react'

interface SessionData {
  id: string
  date: string
  day: string
  time: string
  subject: string
  topic: string
  batchName: string
  tableName: string
  meetingLink?: string
}

function HomePage() {
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [sessionsByDate, setSessionsByDate] = useState<Record<string, SessionData[]>>({})
  const [todaySession, setTodaySession] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dates, setDates] = useState<string[]>([])

  // Navigate to session details page
  const goToSession = (session: SessionData) => {
    sessionStorage.setItem('sessionPageData', JSON.stringify({
      table: session.tableName,
      date: session.date,
      time: session.time,
      batch: session.batchName,
      from: 'home'
    }))
    router.push('/session')
  }

  const fetchSessions = async () => {
    if (!user?.mentorId) return

    setLoading(true)
    try {
      const response = await fetch(`/api/mentor/sessions?mentor_id=${user.mentorId}&days=5`)
      const data = await response.json()

      if (response.ok) {
        setSessions(data.sessions || [])
        setSessionsByDate(data.sessionsByDate || {})
        setTodaySession(data.todaySession)
        setDates(data.dates || [])
      }
    } catch (error) {
      console.error('Error fetching sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [user?.mentorId])

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: dateStr === dates[0],
      isTomorrow: dateStr === dates[1]
    }
  }

  const getTimeColor = (time: string) => {
    if (!time) return 'text-slate-400'
    const hour = parseInt(time.split(':')[0])
    if (hour < 12) return 'text-amber-400'
    if (hour < 17) return 'text-blue-400'
    return 'text-violet-400'
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
              className="px-4 sm:px-6 py-3 text-sm font-medium text-violet-400 border-b-2 border-violet-400 bg-violet-500/5 whitespace-nowrap"
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
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Welcome */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
            Welcome back, <span className="text-violet-400">{user?.name?.split(' ')[0] || 'Mentor'}</span>! 👋
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">Here&apos;s your schedule for the next 5 days</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Today's Session Card */}
            <div className="lg:col-span-1">
              <div className="bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-slate-900/50 border border-violet-500/20 rounded-2xl p-5 sm:p-6 h-full">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    Today&apos;s Session
                  </h3>
                  <span className="text-xs text-slate-400">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </div>

                {todaySession ? (
                  <div className="space-y-4">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
                      <div className="flex items-start justify-between mb-3">
                        <span className="px-2 py-1 bg-violet-500/20 text-violet-300 text-xs rounded-md font-medium">
                          {todaySession.batchName}
                        </span>
                        <span className={`text-sm font-mono ${getTimeColor(todaySession.time)}`}>
                          {todaySession.time || 'TBD'}
                        </span>
                      </div>
                      <h4 className="text-white font-medium mb-1">{todaySession.subject}</h4>
                      <p className="text-slate-400 text-sm mb-4 line-clamp-2">{todaySession.topic || 'No topic specified'}</p>
                      
                      {/* Join Button */}
                      {todaySession.meetingLink ? (
                        <a
                          href={todaySession.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-medium rounded-lg transition-all duration-200 shadow-lg shadow-emerald-500/20"
                        >
                          <Video className="w-4 h-4" />
                          Join Session
                        </a>
                      ) : (
                        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700/50 text-slate-400 font-medium rounded-lg cursor-not-allowed">
                          <Video className="w-4 h-4" />
                          No Meeting Link
                        </button>
                      )}
                    </div>

                    {/* Session Materials */}
                    <div className="bg-slate-800/30 rounded-xl p-4 border border-dashed border-slate-700/50">
                      <div className="flex items-center gap-3 text-slate-400">
                        <FileText className="w-5 h-5" />
                        <div>
                          <p className="text-sm font-medium">Session Materials</p>
                          <p className="text-xs text-slate-500">Add notes, slides, or resources</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => goToSession(todaySession)}
                        className="mt-3 w-full px-3 py-2 border border-slate-600/50 hover:border-violet-500/50 hover:bg-violet-500/10 text-slate-400 hover:text-violet-300 text-sm rounded-lg transition-colors flex items-center justify-center gap-2"
                      >
                        <FileText className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-4">
                      <Calendar className="w-8 h-8 text-slate-600" />
                    </div>
                    <p className="text-slate-400 mb-1">No session today</p>
                    <p className="text-slate-500 text-sm">Enjoy your day off! 🎉</p>
                  </div>
                )}
              </div>
            </div>

            {/* Calendar View */}
            <div className="lg:col-span-2">
              <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-violet-400" />
                    Upcoming Schedule
                  </h3>
                  <button
                    onClick={fetchSessions}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-5 divide-x divide-white/5">
                  {dates.map((dateStr, index) => {
                    const { day, date, month, isToday, isTomorrow } = formatDate(dateStr)
                    const daySessions = sessionsByDate[dateStr] || []

                    return (
                      <div
                        key={dateStr}
                        className={`min-h-[280px] sm:min-h-[320px] ${isToday ? 'bg-violet-500/5' : ''}`}
                      >
                        {/* Date Header */}
                        <div className={`px-2 sm:px-3 py-3 text-center border-b border-white/5 ${isToday ? 'bg-violet-500/10' : ''}`}>
                          <p className="text-[10px] sm:text-xs text-slate-500 uppercase tracking-wide">{day}</p>
                          <p className={`text-lg sm:text-2xl font-bold ${isToday ? 'text-violet-400' : 'text-white'}`}>{date}</p>
                          <p className="text-[10px] sm:text-xs text-slate-500">{month}</p>
                          {isToday && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-violet-500 text-white text-[8px] sm:text-[10px] rounded font-medium">
                              TODAY
                            </span>
                          )}
                          {isTomorrow && (
                            <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-700 text-slate-300 text-[8px] sm:text-[10px] rounded font-medium">
                              TOMORROW
                            </span>
                          )}
                        </div>

                        {/* Sessions */}
                        <div className="p-1.5 sm:p-2 space-y-1.5 sm:space-y-2">
                          {daySessions.length > 0 ? (
                            daySessions.map((session) => (
                              <div
                                key={session.id}
                                onClick={() => goToSession(session)}
                                className="group p-2 sm:p-2.5 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 hover:border-violet-500/30 rounded-lg sm:rounded-xl transition-all cursor-pointer"
                              >
                                <div className="flex items-center gap-1 mb-1">
                                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-500" />
                                  <span className={`text-[10px] sm:text-xs font-mono ${getTimeColor(session.time)}`}>
                                    {session.time || 'TBD'}
                                  </span>
                                </div>
                                <p className="text-white text-[10px] sm:text-xs font-medium line-clamp-2 mb-1 group-hover:text-violet-300 transition-colors">
                                  {session.subject}
                                </p>
                                <p className="text-[9px] sm:text-[10px] text-violet-400/80 truncate">
                                  {session.batchName}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="flex items-center justify-center h-20 sm:h-24">
                              <p className="text-slate-600 text-[10px] sm:text-xs">No sessions</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      
    </div>
  )
}

export default function HomePageWrapper() {
  return (
    <AuthWrapper>
      <HomePage />
    </AuthWrapper>
  )
}
