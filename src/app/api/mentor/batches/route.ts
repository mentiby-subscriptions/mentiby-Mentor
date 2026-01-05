import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseB = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL_B!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_B!
)

// Format batch name: basic1_1_schedule -> Basic 1.1
function formatBatchName(tableName: string): string {
  // Remove _schedule suffix
  let name = tableName.replace('_schedule', '')
  
  // Add space between letters and first number (e.g., basic1 -> basic 1)
  name = name.replace(/([a-zA-Z])(\d)/, '$1 $2')
  
  // Replace underscores with dots (e.g., 1_1 -> 1.1)
  name = name.replace(/_/g, '.')
  
  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1)
}

export async function GET(request: NextRequest) {
  try {
    // Get mentor_id from query params
    const { searchParams } = new URL(request.url)
    const mentorId = searchParams.get('mentor_id')

    if (!mentorId) {
      return NextResponse.json(
        { error: 'Mentor ID is required' },
        { status: 400 }
      )
    }

    // Get all schedule tables using the RPC function
    const { data: tables, error: tablesError } = await supabaseB
      .rpc('get_schedule_tables')

    if (tablesError) {
      console.error('Error fetching schedule tables:', tablesError)
      return NextResponse.json(
        { error: 'Failed to fetch schedule tables' },
        { status: 500 }
      )
    }

    if (!tables || tables.length === 0) {
      return NextResponse.json({ batches: [] })
    }

    // Query each schedule table for this mentor's batches
    const mentorBatches: { 
      tableName: string
      batchName: string
      sessionCount: number
    }[] = []

    for (const table of tables) {
      const tableName = table.table_name

      // Query the schedule table for rows where mentor_id matches
      // Using raw query since table names are dynamic
      const { data: sessions, error: sessionError } = await supabaseB
        .from(tableName)
        .select('*')
        .eq('mentor_id', parseInt(mentorId))

      if (sessionError) {
        console.error(`Error querying ${tableName}:`, sessionError)
        continue
      }

      if (sessions && sessions.length > 0) {
        mentorBatches.push({
          tableName,
          batchName: formatBatchName(tableName),
          sessionCount: sessions.length
        })
      }
    }

    return NextResponse.json({ 
      batches: mentorBatches,
      totalBatches: mentorBatches.length
    })

  } catch (error: any) {
    console.error('Fetch mentor batches error:', error)
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    )
  }
}

