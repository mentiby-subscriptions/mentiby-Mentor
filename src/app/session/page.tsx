'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import AuthWrapper from '@/components/auth/AuthWrapper'
import { 
  Calendar, Clock, Video, FileText, ArrowLeft, ArrowRight,
  Users, LogOut, Loader2, RefreshCw, Sparkles, Link2, Plus,
  Trash2, Check, ExternalLink, ChevronLeft,
  BookOpen, AlertCircle
} from 'lucide-react'

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface SessionDetails {
  id: number
  week_number: number
  session_number: number
  date: string
  time: string
  day: string
  session_type: string
  subject_type: string
  subject_name: string
  subject_topic: string
  initial_session_material: string
  session_material: string
  session_recording: string
  mentor_id: number
  teams_meeting_link: string
  materialLinks: string[]
}

interface ScheduleRow {
  id: number
  week_number: number
  session_number: number
  date: string | null
  time: string | null
  day: string | null
}

function SessionDetailsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, signOut } = useAuth()
  
  const tableName = searchParams.get('table')
  const date = searchParams.get('date')
  const time = searchParams.get('time')
  const batchName = searchParams.get('batch') || 'Unknown Batch'

  const [session, setSession] = useState<SessionDetails | null>(null)
  const [allSessions, setAllSessions] = useState<ScheduleRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Material form state
  const [newLinks, setNewLinks] = useState<string[]>([''])
  const [savingMaterial, setSavingMaterial] = useState(false)
  const [materialSuccess, setMaterialSuccess] = useState(false)
  
  // Reschedule state - copied from CohortScheduleEditor
  const [showReschedule, setShowReschedule] = useState<'postpone' | 'prepone' | null>(null)
  const [newDateForMove, setNewDateForMove] = useState<string>('')
  const [newTimeForMove, setNewTimeForMove] = useState<string>('')
  const [isMovingSession, setIsMovingSession] = useState(false)

  // Fetch all sessions for the table (needed for date range calculation)
  const fetchAllSessions = async () => {
    if (!tableName) return

    try {
      const response = await fetch(`/api/cohort/schedule?tableName=${tableName}`)
      const data = await response.json()
      if (data.schedule) {
        setAllSessions(data.schedule)
      }
    } catch (err) {
      console.error('Error fetching all sessions:', err)
    }
  }

  const fetchSession = async () => {
    if (!tableName || !date || !time) {
      setError('Missing session parameters')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await fetch(
        `/api/mentor/session-details?table=${tableName}&date=${date}&time=${time}`
      )
      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to fetch session')
        return
      }

      setSession(data.session)
    } catch (err: any) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSession()
    fetchAllSessions()
  }, [tableName, date, time])

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-IN', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  }

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'TBD'
    const [hours, minutes] = timeStr.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hour12 = h % 12 || 12
    return `${hour12}:${minutes} ${ampm}`
  }

  // Transform Graph API recording URL to our streaming endpoint
  const getRecordingUrl = (recordingUrl: string) => {
    // Check if it's a Microsoft Graph API URL
    if (recordingUrl.includes('graph.microsoft.com') && recordingUrl.includes('/recordings/')) {
      // Extract meetingId and recordingId from URL
      // Format: .../onlineMeetings/{meetingId}/recordings/{recordingId}/content
      const match = recordingUrl.match(/onlineMeetings\/([^/]+)\/recordings\/([^/]+)/)
      if (match) {
        const [, meetingId, recordingId] = match
        return `/api/recording/stream?meetingId=${encodeURIComponent(meetingId)}&recordingId=${encodeURIComponent(recordingId)}`
      }
    }
    // Return original URL if not a Graph API URL (e.g., direct SharePoint/OneDrive link)
    return recordingUrl
  }

  // Add material handlers
  const addLinkField = () => setNewLinks([...newLinks, ''])
  const removeLinkField = (index: number) => {
    if (newLinks.length > 1) setNewLinks(newLinks.filter((_, i) => i !== index))
  }
  const updateLink = (index: number, value: string) => {
    const updated = [...newLinks]
    updated[index] = value
    setNewLinks(updated)
  }

  const handleSaveMaterial = async () => {
    const validLinks = newLinks.filter(link => link.trim().length > 0)
    if (validLinks.length === 0) return

    setSavingMaterial(true)
    try {
      const response = await fetch('/api/mentor/session-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          date,
          time,
          newLinks: validLinks
        })
      })

      if (response.ok) {
        setMaterialSuccess(true)
        setNewLinks([''])
        await fetchSession()
        setTimeout(() => setMaterialSuccess(false), 3000)
      }
    } catch (err) {
      console.error('Error saving material:', err)
    } finally {
      setSavingMaterial(false)
    }
  }

  // Helper to format date as YYYY-MM-DD in local timezone (from CohortScheduleEditor)
  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Get the next session for date validation (from CohortScheduleEditor)
  const getNextSession = (currentRow: SessionDetails): ScheduleRow | null => {
    const sortedSessions = [...allSessions].sort((a, b) => {
      const weekDiff = (a.week_number || 0) - (b.week_number || 0)
      if (weekDiff !== 0) return weekDiff
      return (a.session_number || 0) - (b.session_number || 0)
    })

    const currentIndex = sortedSessions.findIndex(row => row.id === currentRow.id)
    
    if (currentIndex >= 0 && currentIndex < sortedSessions.length - 1) {
      return sortedSessions[currentIndex + 1]
    }

    return null
  }

  // Get the previous session for minimum date (from CohortScheduleEditor)
  const getPreviousSession = (currentRow: SessionDetails): ScheduleRow | null => {
    const sortedSessions = [...allSessions].sort((a, b) => {
      const weekDiff = (a.week_number || 0) - (b.week_number || 0)
      if (weekDiff !== 0) return weekDiff
      return (a.session_number || 0) - (b.session_number || 0)
    })

    const currentIndex = sortedSessions.findIndex(row => row.id === currentRow.id)
    
    if (currentIndex > 0) {
      return sortedSessions[currentIndex - 1]
    }

    return null
  }

  // Get available dates for postpone - dates after current session (from CohortScheduleEditor)
  const getPostponeDates = (): string[] => {
    if (!session) return []
    
    const sessionDate = new Date(String(session.date).split('T')[0] + 'T12:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get next session's date as upper limit
    const nextSession = getNextSession(session)
    let maxDate: Date
    if (nextSession && nextSession.date) {
      maxDate = new Date(String(nextSession.date).split('T')[0] + 'T12:00:00')
      maxDate.setDate(maxDate.getDate() - 1)
    } else {
      maxDate = new Date(sessionDate)
      maxDate.setDate(maxDate.getDate() + 30)
    }

    // Get existing dates to exclude
    const existingDates = new Set(
      allSessions
        .filter(s => s.id !== session.id && s.date)
        .map(s => String(s.date).split('T')[0])
    )

    const dates: string[] = []
    let currentDate = new Date(Math.max(sessionDate.getTime() + 86400000, today.getTime()))
    
    while (currentDate <= maxDate) {
      const dateStr = formatDateLocal(currentDate)
      if (!existingDates.has(dateStr)) {
        dates.push(dateStr)
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  // Get available dates for prepone - dates before current session (from CohortScheduleEditor)
  const getPreponeDates = (): string[] => {
    if (!session) return []
    
    const sessionDate = new Date(String(session.date).split('T')[0] + 'T12:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get previous session's date as lower limit
    const prevSession = getPreviousSession(session)
    let minDate: Date
    if (prevSession && prevSession.date) {
      minDate = new Date(String(prevSession.date).split('T')[0] + 'T12:00:00')
      minDate.setDate(minDate.getDate() + 1)
    } else {
      minDate = new Date(sessionDate)
      minDate.setDate(minDate.getDate() - 30)
    }

    // Ensure minDate is not before today
    if (minDate < today) {
      minDate = today
    }

    // Get existing dates to exclude
    const existingDates = new Set(
      allSessions
        .filter(s => s.id !== session.id && s.date)
        .map(s => String(s.date).split('T')[0])
    )

    const dates: string[] = []
    let currentDate = new Date(minDate)
    const maxDate = new Date(sessionDate)
    maxDate.setDate(maxDate.getDate() - 1)
    
    while (currentDate <= maxDate) {
      const dateStr = formatDateLocal(currentDate)
      if (!existingDates.has(dateStr)) {
        dates.push(dateStr)
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  // Get current session's time for placeholder (from CohortScheduleEditor)
  const getSelectedSessionTime = (): string => {
    return session?.time || ''
  }

  // Get current session's date
  const getSelectedSessionDate = (): string => {
    return session?.date?.split('T')[0] || ''
  }

  // Validate time for postpone/prepone when date is unchanged (from CohortScheduleEditor)
  const isTimeValidForMove = (newTime: string, mode: 'postpone' | 'prepone'): boolean => {
    const currentTime = getSelectedSessionTime()?.substring(0, 5)
    if (!currentTime || !newTime) return true
    
    const [currHour, currMin] = currentTime.split(':').map(Number)
    const [newHour, newMin] = newTime.split(':').map(Number)
    const currMinutes = currHour * 60 + currMin
    const newMinutes = newHour * 60 + newMin
    
    if (mode === 'prepone') {
      return newMinutes < currMinutes
    } else {
      return newMinutes > currMinutes
    }
  }

  // Get time constraints for display (from CohortScheduleEditor)
  const getTimeConstraintText = (mode: 'postpone' | 'prepone'): string => {
    const currentTime = getSelectedSessionTime()?.substring(0, 5)
    if (!currentTime) return ''
    
    if (mode === 'prepone') {
      return `Select time before ${currentTime}`
    } else {
      return `Select time after ${currentTime}`
    }
  }

  // Handle session move (postpone/prepone) - from CohortScheduleEditor
  const handleMoveSession = async (type: 'postpone' | 'prepone') => {
    if (!session) return

    const currentDate = getSelectedSessionDate()
    const currentTime = getSelectedSessionTime()?.substring(0, 5) || ''
    const effectiveDate = newDateForMove || currentDate
    const effectiveTime = newTimeForMove || currentTime

    // Check if anything changed
    const dateChanged = effectiveDate !== currentDate
    const timeChanged = effectiveTime !== currentTime

    if (!dateChanged && !timeChanged) {
      alert('Please change either date or time')
      return
    }

    // If only time changed (same date), validate time direction
    if (!dateChanged && timeChanged) {
      if (!isTimeValidForMove(effectiveTime, type)) {
        if (type === 'prepone') {
          alert(`For prepone on same date, time must be before ${currentTime}`)
        } else {
          alert(`For postpone on same date, time must be after ${currentTime}`)
        }
        return
      }
    }

    setIsMovingSession(true)

    try {
      // Get the new day name
      const dateObj = new Date(effectiveDate + 'T12:00:00')
      const dayName = DAYS_OF_WEEK[dateObj.getDay()]

      // Update via API
      const response = await fetch('/api/cohort/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          id: session.id,
          field: 'date',
          value: effectiveDate
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update date')
      }

      // Update day
      await fetch('/api/cohort/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          id: session.id,
          field: 'day',
          value: dayName
        })
      })

      // Clear meeting link
      await fetch('/api/cohort/schedule', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableName,
          id: session.id,
          field: 'teams_meeting_link',
          value: null
        })
      })

      // Update time if changed
      if (timeChanged) {
        await fetch('/api/cohort/schedule', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tableName,
            id: session.id,
            field: 'time',
            value: effectiveTime
          })
        })
      }

      // Navigate to the new session page
      router.replace(`/session?table=${tableName}&date=${effectiveDate}&time=${effectiveTime}&batch=${encodeURIComponent(batchName)}`)
      setShowReschedule(null)
      setNewDateForMove('')
      setNewTimeForMove('')

    } catch (err: any) {
      console.error(`Error ${type}ing session:`, err)
      alert(err.message || `Failed to ${type} session`)
    } finally {
      setIsMovingSession(false)
    }
  }

  // Reset move selections when closing modal
  const resetMoveSelections = () => {
    setNewDateForMove('')
    setNewTimeForMove('')
    setShowReschedule(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-400 animate-spin" />
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl text-white mb-2">Session Not Found</h2>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => router.push('/home')}
            className="px-4 py-2 bg-violet-500 text-white rounded-lg"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  const postponeDates = getPostponeDates()
  const preponeDates = getPreponeDates()

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
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.push('/home')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-white">Session Details</h1>
                <p className="text-slate-500 text-xs">{batchName}</p>
              </div>
            </div>

            <button
              onClick={signOut}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Session Header Card */}
        <div className="bg-gradient-to-br from-violet-600/20 via-indigo-600/10 to-slate-900/50 border border-violet-500/20 rounded-2xl p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
            <div>
              <span className="inline-block px-3 py-1 bg-violet-500/20 text-violet-300 text-sm rounded-lg font-medium mb-3">
                {batchName}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                {session.subject_name || 'Session'}
              </h2>
              <p className="text-slate-400">{session.subject_topic || 'No topic specified'}</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchSession}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide">Date</span>
              </div>
              <p className="text-white font-medium">{formatDate(session.date)}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Clock className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide">Time</span>
              </div>
              <p className="text-white font-medium">{formatTime(session.time)}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <BookOpen className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide">Type</span>
              </div>
              <p className="text-white font-medium">{session.session_type || 'Regular'}</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
              <div className="flex items-center gap-2 text-slate-400 mb-1">
                <Users className="w-4 h-4" />
                <span className="text-xs uppercase tracking-wide">Subject Type</span>
              </div>
              <p className="text-white font-medium">{session.subject_type || 'General'}</p>
            </div>
          </div>

          {/* Join Button */}
          {session.teams_meeting_link ? (
            <a
              href={session.teams_meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold rounded-xl transition-all shadow-lg shadow-emerald-500/20"
            >
              <Video className="w-5 h-5" />
              Join Meeting
            </a>
          ) : (
            <div className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700/50 text-slate-400 font-medium rounded-xl">
              <Video className="w-5 h-5" />
              No Meeting Link Yet
            </div>
          )}
        </div>

        {/* Reschedule Buttons - copied styling from CohortScheduleEditor */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button
            onClick={() => {
              setShowReschedule('prepone')
              setNewDateForMove('')
              setNewTimeForMove('')
            }}
            className="flex items-center justify-center gap-3 px-4 py-4 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 hover:border-cyan-500/50 text-cyan-400 rounded-xl transition-all group"
          >
            <div className="p-2 rounded-lg bg-cyan-500/10 group-hover:bg-cyan-500/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <span className="font-medium">Prepone Class</span>
          </button>
          <button
            onClick={() => {
              setShowReschedule('postpone')
              setNewDateForMove('')
              setNewTimeForMove('')
            }}
            className="flex items-center justify-center gap-3 px-4 py-4 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 hover:border-orange-500/50 text-orange-400 rounded-xl transition-all group"
          >
            <span className="font-medium">Postpone Class</span>
            <div className="p-2 rounded-lg bg-orange-500/10 group-hover:bg-orange-500/20 transition-colors">
              <ArrowRight className="w-5 h-5" />
            </div>
          </button>
        </div>

        {/* Reschedule Modal - copied from CohortScheduleEditor */}
        {showReschedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={resetMoveSelections} />
            <div className="relative w-full max-w-lg bg-slate-900/95 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
              {/* Modal Header */}
              <div className={`px-6 py-5 border-b border-slate-700/50 ${
                showReschedule === 'postpone' 
                  ? 'bg-gradient-to-r from-orange-500/10 to-amber-500/10' 
                  : 'bg-gradient-to-r from-cyan-500/10 to-blue-500/10'
              }`}>
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${
                    showReschedule === 'postpone' 
                      ? 'bg-orange-500/10' 
                      : 'bg-cyan-500/10'
                  }`}>
                    {showReschedule === 'postpone' ? (
                      <ArrowRight className="h-6 w-6 text-orange-400" />
                    ) : (
                      <ArrowLeft className="h-6 w-6 text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {showReschedule === 'postpone' ? 'Postpone Class' : 'Prepone Class'}
                    </h3>
                    <p className="text-sm text-slate-400">
                      {showReschedule === 'postpone' 
                        ? 'Move this session to a later date'
                        : 'Move this session to an earlier date'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-6">
                {/* Current Session Info */}
                <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <p className="text-xs uppercase tracking-wide text-slate-500 mb-2">Current Schedule</p>
                  <p className="text-white font-medium">{session.subject_name}</p>
                  <p className="text-slate-400 text-sm mt-1">
                    {formatDate(session.date)} at {formatTime(session.time)}
                  </p>
                </div>

                {/* Date & Time Selection - copied from CohortScheduleEditor */}
                <div className={`space-y-4 p-4 border rounded-xl ${
                  showReschedule === 'postpone' 
                    ? 'bg-orange-500/5 border-orange-500/30' 
                    : 'bg-cyan-500/5 border-cyan-500/30'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Date Selection */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium ${
                        showReschedule === 'postpone' ? 'text-orange-400' : 'text-cyan-400'
                      }`}>
                        New Date ({showReschedule === 'postpone' ? postponeDates.length : preponeDates.length} available)
                      </label>
                      {(showReschedule === 'postpone' ? postponeDates.length > 0 : preponeDates.length > 0) ? (
                        <select
                          value={newDateForMove}
                          onChange={(e) => setNewDateForMove(e.target.value)}
                          className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 text-white ${
                            showReschedule === 'postpone' 
                              ? 'border-orange-500/50 focus:ring-orange-500' 
                              : 'border-cyan-500/50 focus:ring-cyan-500'
                          }`}
                        >
                          <option value="">Keep current date</option>
                          {(showReschedule === 'postpone' ? postponeDates : preponeDates).map(d => {
                            const dateObj = new Date(d + 'T12:00:00')
                            const dayName = DAYS_OF_WEEK[dateObj.getDay()]
                            const formatted = dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                            return <option key={d} value={d}>{formatted} ({dayName})</option>
                          })}
                        </select>
                      ) : (
                        <p className="text-sm text-amber-400 py-3">
                          No {showReschedule === 'postpone' ? 'later' : 'earlier'} dates available
                        </p>
                      )}
                      <p className="text-xs text-slate-500">
                        Current: {new Date(getSelectedSessionDate() + 'T12:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>

                    {/* Time Selection */}
                    <div className="space-y-2">
                      <label className={`block text-sm font-medium ${
                        showReschedule === 'postpone' ? 'text-orange-400' : 'text-cyan-400'
                      }`}>
                        New Time
                      </label>
                      <input
                        type="time"
                        value={newTimeForMove || getSelectedSessionTime()?.substring(0, 5) || ''}
                        onChange={(e) => setNewTimeForMove(e.target.value)}
                        className={`w-full px-4 py-3 bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 text-white ${
                          showReschedule === 'postpone' 
                            ? 'border-orange-500/50 focus:ring-orange-500' 
                            : 'border-cyan-500/50 focus:ring-cyan-500'
                        }`}
                      />
                      {!newDateForMove && (
                        <p className="text-xs text-amber-400">
                          {getTimeConstraintText(showReschedule)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Note */}
                <p className="text-xs text-slate-500">
                  Note: The meeting link will be cleared and a new one will need to be generated.
                </p>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-slate-700/50 flex gap-3">
                <button
                  onClick={resetMoveSelections}
                  className="flex-1 px-4 py-3 text-slate-400 hover:text-white hover:bg-slate-800/50 rounded-xl transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleMoveSession(showReschedule)}
                  disabled={isMovingSession}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    showReschedule === 'postpone' 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white'
                      : 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white'
                  }`}
                >
                  {isMovingSession ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      {showReschedule === 'postpone' ? 'Postponing...' : 'Preponing...'}
                    </>
                  ) : (
                    <>
                      {showReschedule === 'postpone' ? (
                        <ArrowRight className="h-5 w-5" />
                      ) : (
                        <ArrowLeft className="h-5 w-5" />
                      )}
                      {showReschedule === 'postpone' ? 'Postpone Session' : 'Prepone Session'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Session Materials Section */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-white/5">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-violet-400" />
              Session Materials
            </h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Existing Materials */}
            {session.materialLinks && session.materialLinks.length > 0 ? (
              <div>
                <p className="text-sm font-medium text-slate-300 mb-3">Added Materials</p>
                <div className="space-y-2">
                  {session.materialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.startsWith('http') ? link : `https://${link}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-blue-400 hover:text-blue-300 hover:border-blue-500/30 transition-colors group"
                    >
                      <Link2 className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate flex-1">{link}</span>
                      <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-slate-600" />
                </div>
                <p className="text-slate-400 mb-1">No materials added yet</p>
                <p className="text-slate-500 text-sm">Add links to slides, notes, or resources</p>
              </div>
            )}

            {/* Add New Materials */}
            <div className="border-t border-slate-700/50 pt-6">
              <p className="text-sm font-medium text-slate-300 mb-3">Add New Materials</p>
              <div className="space-y-3">
                {newLinks.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Link2 className="w-4 h-4 text-slate-500" />
                      </div>
                      <input
                        type="url"
                        value={link}
                        onChange={(e) => updateLink(index, e.target.value)}
                        placeholder="https://drive.google.com/..."
                        className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50 text-sm"
                      />
                    </div>
                    {newLinks.length > 1 && (
                      <button
                        onClick={() => removeLinkField(index)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={addLinkField}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-violet-400 hover:text-violet-300 hover:bg-violet-500/10 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Another Link
                </button>

                <button
                  onClick={handleSaveMaterial}
                  disabled={savingMaterial || newLinks.every(l => !l.trim())}
                  className="flex items-center gap-2 px-4 py-2 bg-violet-500 hover:bg-violet-400 disabled:bg-slate-700 text-white font-medium text-sm rounded-lg transition-colors disabled:cursor-not-allowed"
                >
                  {savingMaterial ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : materialSuccess ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                  {materialSuccess ? 'Saved!' : 'Save Materials'}
                </button>
              </div>
            </div>

            {/* Recording Link */}
            {session.session_recording && (
              <div className="border-t border-slate-700/50 pt-6">
                <p className="text-sm font-medium text-slate-300 mb-3">Session Recording</p>
                <a
                  href={getRecordingUrl(session.session_recording)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 hover:text-emerald-300 transition-colors group"
                >
                  <Video className="w-5 h-5" />
                  <span>View Recording</span>
                  <ExternalLink className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function SessionPageWrapper() {
  return (
    <AuthWrapper>
      <SessionDetailsPage />
    </AuthWrapper>
  )
}
