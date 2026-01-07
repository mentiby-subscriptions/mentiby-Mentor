import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseB = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL_B!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_B!
)

// Format batch name: basic1_1_schedule -> Basic 1.1
function formatBatchName(tableName: string): string {
  let name = tableName.replace('_schedule', '')
  name = name.replace(/([a-zA-Z])(\d)/, '$1 $2')
  name = name.replace(/_/g, '.')
  return name.charAt(0).toUpperCase() + name.slice(1)
}

// Get date string in YYYY-MM-DD format for IST
function getISTDateString(daysFromNow: number = 0): string {
  const date = new Date()
  date.setHours(date.getHours() + 5, date.getMinutes() + 30) // Convert to IST
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString().split('T')[0]
}

export interface SessionData {
  id: string
  date: string
  day: string
  time: string
  subject: string
  topic: string
  batchName: string
  tableName: string
  meetingLink?: string
  mentorId: number
  swappedMentorId?: number | null
  isSwappedToMe?: boolean  // This session was swapped TO this mentor
  isSwappedAway?: boolean  // This session was swapped AWAY from this mentor
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const mentorId = searchParams.get('mentor_id')
    const days = parseInt(searchParams.get('days') || '5')

    if (!mentorId) {
      return NextResponse.json({ error: 'Mentor ID is required' }, { status: 400 })
    }

    // Get all schedule tables
    const { data: tables, error: tablesError } = await supabaseB.rpc('get_schedule_tables')

    if (tablesError) {
      console.error('Error fetching schedule tables:', tablesError)
      return NextResponse.json({ error: 'Failed to fetch schedule tables' }, { status: 500 })
    }

    if (!tables || tables.length === 0) {
      return NextResponse.json({ sessions: [], todaySession: null })
    }

    // Get dates for next N days
    const dates: string[] = []
    for (let i = 0; i < days; i++) {
      dates.push(getISTDateString(i))
    }
    const todayDate = dates[0]

    const allSessions: SessionData[] = []

    // Query each schedule table
    for (const table of tables) {
      const tableName = table.table_name
      const batchName = formatBatchName(tableName)
      const mentorIdNum = parseInt(mentorId)

      // Query 1: Sessions where this mentor is the original mentor
      const { data: originalSessions, error: originalError } = await supabaseB
        .from(tableName)
        .select('*')
        .eq('mentor_id', mentorIdNum)
        .in('date', dates)
        .order('date', { ascending: true })

      if (originalError) {
        console.error(`Error querying ${tableName} for original:`, originalError)
      }

      // Query 2: Sessions where this mentor is the swapped mentor
      const { data: swappedSessions, error: swappedError } = await supabaseB
        .from(tableName)
        .select('*')
        .eq('swapped_mentor_id', mentorIdNum)
        .in('date', dates)
        .order('date', { ascending: true })

      if (swappedError) {
        console.error(`Error querying ${tableName} for swapped:`, swappedError)
      }

      // Process original sessions
      if (originalSessions) {
        for (const session of originalSessions) {
          // If swapped_mentor_id is set and it's not this mentor, this session is swapped away
          const isSwappedAway = session.swapped_mentor_id && session.swapped_mentor_id !== mentorIdNum
          
          // Skip sessions that are swapped away (they'll show up for the swapped mentor)
          if (isSwappedAway) continue

          allSessions.push({
            id: `${tableName}-${session.id || session.date}-${session.time}`,
            date: session.date,
            day: session.day || '',
            time: session.time || session.start_time || '',
            subject: session.subject || session.subject_name || '',
            topic: session.topic || session.subject_topic || '',
            batchName,
            tableName,
            meetingLink: session.teams_meeting_link || session.meeting_link || session.teams_link || '',
            mentorId: session.mentor_id,
            swappedMentorId: session.swapped_mentor_id,
            isSwappedToMe: false,
            isSwappedAway: false
          })
        }
      }

      // Process swapped sessions (sessions swapped TO this mentor)
      if (swappedSessions) {
        for (const session of swappedSessions) {
          // Only include if the original mentor is different
          if (session.mentor_id !== mentorIdNum) {
            allSessions.push({
              id: `${tableName}-${session.id || session.date}-${session.time}-swapped`,
              date: session.date,
              day: session.day || '',
              time: session.time || session.start_time || '',
              subject: session.subject || session.subject_name || '',
              topic: session.topic || session.subject_topic || '',
              batchName,
              tableName,
              meetingLink: session.teams_meeting_link || session.meeting_link || session.teams_link || '',
              mentorId: session.mentor_id,
              swappedMentorId: session.swapped_mentor_id,
              isSwappedToMe: true,
              isSwappedAway: false
            })
          }
        }
      }
    }

    // Sort by date and time
    allSessions.sort((a, b) => {
      const dateCompare = a.date.localeCompare(b.date)
      if (dateCompare !== 0) return dateCompare
      return (a.time || '').localeCompare(b.time || '')
    })

    // Find today's session
    const todaySessions = allSessions.filter(s => s.date === todayDate)
    const todaySession = todaySessions.length > 0 ? todaySessions[0] : null

    // Group sessions by date
    const sessionsByDate: Record<string, SessionData[]> = {}
    for (const session of allSessions) {
      if (!sessionsByDate[session.date]) {
        sessionsByDate[session.date] = []
      }
      sessionsByDate[session.date].push(session)
    }

    return NextResponse.json({
      sessions: allSessions,
      sessionsByDate,
      todaySession,
      todaySessions,
      dates
    })

  } catch (error: any) {
    console.error('Fetch sessions error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

