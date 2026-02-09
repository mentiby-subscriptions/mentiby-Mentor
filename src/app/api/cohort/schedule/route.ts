import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// GET - Fetch schedule data
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('tableName')
    const mentorId = searchParams.get('mentor_id')

    if (!tableName) {
      return NextResponse.json(
        { error: 'Table name is required' },
        { status: 400 }
      )
    }

    const supabaseB = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL_B!,
      process.env.SUPABASE_SERVICE_ROLE_KEY_B!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    let data, error

    // If mentor_id is provided, filter to only show classes where mentor is primary or swapped mentor
    if (mentorId) {
      const mentorIdNum = parseInt(mentorId)
      
      // Fetch sessions where mentor is the primary mentor
      const { data: primarySessions, error: primaryError } = await supabaseB
        .from(tableName)
        .select('*')
        .eq('mentor_id', mentorIdNum)
        .order('week_number', { ascending: true })
        .order('session_number', { ascending: true })

      if (primaryError) {
        console.error('Error fetching primary sessions:', primaryError)
        return NextResponse.json(
          { error: primaryError.message },
          { status: 500 }
        )
      }

      // Fetch sessions where mentor is the swapped mentor
      const { data: swappedSessions, error: swappedError } = await supabaseB
        .from(tableName)
        .select('*')
        .eq('swapped_mentor_id', mentorIdNum)
        .order('week_number', { ascending: true })
        .order('session_number', { ascending: true })

      if (swappedError) {
        console.error('Error fetching swapped sessions:', swappedError)
        return NextResponse.json(
          { error: swappedError.message },
          { status: 500 }
        )
      }

      // Combine and deduplicate (in case mentor is both primary and swapped - edge case)
      const allSessions = [...(primarySessions || []), ...(swappedSessions || [])]
      const uniqueSessionsMap = new Map()
      allSessions.forEach(session => {
        uniqueSessionsMap.set(session.id, session)
      })
      
      // Convert to array and sort by week_number and session_number
      data = Array.from(uniqueSessionsMap.values()).sort((a, b) => {
        if (a.week_number !== b.week_number) {
          return a.week_number - b.week_number
        }
        return a.session_number - b.session_number
      })
      error = null
    } else {
      // No mentor_id filter - return all sessions (for admin/editor views)
      const result = await supabaseB
        .from(tableName)
        .select('*')
        .order('week_number', { ascending: true })
        .order('session_number', { ascending: true })
      
      data = result.data
      error = result.error
    }

    if (error) {
      console.error('Error fetching schedule:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ schedule: data })

  } catch (error: any) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}

// PATCH - Update a single cell
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { tableName, id, field, value } = body

    if (!tableName || !id || !field) {
      return NextResponse.json(
        { error: 'tableName, id, and field are required' },
        { status: 400 }
      )
    }

    const supabaseB = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL_B!,
      process.env.SUPABASE_SERVICE_ROLE_KEY_B!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const { data, error } = await supabaseB
      .from(tableName)
      .update({ [field]: value })
      .eq('id', id)
      .select()

    if (error) {
      console.error('Error updating schedule:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data })

  } catch (error: any) {
    console.error('Error updating schedule:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}

