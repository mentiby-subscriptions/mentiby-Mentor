import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseB = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL_B!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_B!
)

export async function POST(request: NextRequest) {
  try {
    const { tableName, sessionId, date, time, newLinks, mentorId } = await request.json()

    if (!tableName || !newLinks || newLinks.length === 0) {
      return NextResponse.json(
        { error: 'Table name and links are required' },
        { status: 400 }
      )
    }

    // First, fetch the current session to get existing materials
    let query = supabaseB.from(tableName).select('initial_session_material, id, date, time')

    // Build query based on available identifiers
    if (sessionId) {
      query = query.eq('id', sessionId)
    } else if (date && time) {
      query = query.eq('date', date).eq('time', time)
    } else if (date && mentorId) {
      query = query.eq('date', date).eq('mentor_id', mentorId)
    } else {
      return NextResponse.json(
        { error: 'Session identifier required (id, or date+time, or date+mentorId)' },
        { status: 400 }
      )
    }

    const { data: session, error: fetchError } = await query.single()

    if (fetchError) {
      console.error('Error fetching session:', fetchError)
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Get existing materials and append new ones
    const existingMaterials = session.initial_session_material || ''
    const existingLinks = existingMaterials
      .split(',')
      .map((link: string) => link.trim())
      .filter((link: string) => link.length > 0)

    // Add new links (avoid duplicates)
    const allLinks = [...existingLinks]
    for (const newLink of newLinks) {
      const trimmedLink = newLink.trim()
      if (trimmedLink && !allLinks.includes(trimmedLink)) {
        allLinks.push(trimmedLink)
      }
    }

    const updatedMaterials = allLinks.join(', ')

    // Update the session
    let updateQuery = supabaseB
      .from(tableName)
      .update({ initial_session_material: updatedMaterials })

    if (sessionId) {
      updateQuery = updateQuery.eq('id', sessionId)
    } else if (date && time) {
      updateQuery = updateQuery.eq('date', date).eq('time', time)
    } else if (date && mentorId) {
      updateQuery = updateQuery.eq('date', date).eq('mentor_id', mentorId)
    }

    const { error: updateError } = await updateQuery

    if (updateError) {
      console.error('Error updating session material:', updateError)
      return NextResponse.json(
        { error: 'Failed to update session material' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Session material updated successfully',
      materials: updatedMaterials,
      linkCount: allLinks.length
    })

  } catch (error: any) {
    console.error('Update session material error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

// GET endpoint to fetch current materials for a session
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tableName = searchParams.get('table')
    const date = searchParams.get('date')
    const time = searchParams.get('time')
    const mentorId = searchParams.get('mentor_id')

    if (!tableName) {
      return NextResponse.json({ error: 'Table name is required' }, { status: 400 })
    }

    let query = supabaseB.from(tableName).select('initial_session_material, id')

    if (date && time) {
      query = query.eq('date', date).eq('time', time)
    } else if (date && mentorId) {
      query = query.eq('date', date).eq('mentor_id', parseInt(mentorId))
    } else {
      return NextResponse.json({ error: 'Date and time/mentorId required' }, { status: 400 })
    }

    const { data: session, error } = await query.single()

    if (error) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    const materials = session.initial_session_material || ''
    const links = materials
      .split(',')
      .map((link: string) => link.trim())
      .filter((link: string) => link.length > 0)

    return NextResponse.json({
      materials,
      links,
      linkCount: links.length
    })

  } catch (error: any) {
    console.error('Fetch session material error:', error)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// PUT endpoint to replace/update all materials (used for deletion)
export async function PUT(request: NextRequest) {
  try {
    const { tableName, date, time, materials } = await request.json()

    if (!tableName || !date || !time) {
      return NextResponse.json(
        { error: 'Table name, date, and time are required' },
        { status: 400 }
      )
    }

    // Update the session with the new materials string
    const { error: updateError } = await supabaseB
      .from(tableName)
      .update({ initial_session_material: materials || '' })
      .eq('date', date)
      .eq('time', time)

    if (updateError) {
      console.error('Error updating session material:', updateError)
      return NextResponse.json(
        { error: 'Failed to update session material' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Session material updated successfully'
    })

  } catch (error: any) {
    console.error('Update session material error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}
