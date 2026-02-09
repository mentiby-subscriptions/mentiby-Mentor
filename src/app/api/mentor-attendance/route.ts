import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This endpoint calculates attendance for a specific mentor based on completed classes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { mentorId } = body

    if (!mentorId) {
      return NextResponse.json({ 
        error: 'mentorId is required' 
      }, { status: 400 })
    }

    // Initialize Supabase clients
    const supabaseMain = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const supabaseB = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL_B!,
      process.env.SUPABASE_SERVICE_ROLE_KEY_B!
    )

    console.log(`=== MENTOR ATTENDANCE CALCULATION FOR MENTOR ${mentorId} ===`)

    // Step 1: Get the specific mentor from Mentor Details table
    const { data: mentor, error: mentorError } = await supabaseB
      .from('Mentor Details')
      .select('mentor_id, Name, "Email address"')
      .eq('mentor_id', mentorId)
      .single()
    
    if (mentorError || !mentor) {
      console.error('Error fetching mentor:', mentorError)
      return NextResponse.json({ 
        error: 'Mentor not found',
        details: mentorError?.message 
      }, { status: 404 })
    }

    console.log(`Processing mentor: ${mentor.Name} (ID: ${mentorId})`)

    // Step 2: Get all cohort schedule tables dynamically
    const { data: tables, error: tablesError } = await supabaseB.rpc('get_schedule_tables')
    
    let cohortTables: string[] = []
    if (tablesError || !tables) {
      console.log('RPC not available, cannot get schedule tables')
      return NextResponse.json({ 
        error: 'Failed to get schedule tables. Please ensure get_schedule_tables RPC exists.',
        details: tablesError?.message 
      }, { status: 500 })
    } else {
      cohortTables = tables.map((row: any) => row.table_name)
    }

    console.log(`Found ${cohortTables.length} cohort tables:`, cohortTables)

    // Get today's date in YYYY-MM-DD format (IST)
    const now = new Date()
    now.setHours(now.getHours() + 5, now.getMinutes() + 30) // Convert to IST
    const todayDate = now.toISOString().split('T')[0]
    console.log(`Today's date (IST): ${todayDate}`)

    // Step 3: Process the specific mentor
    const mentorName = mentor.Name || 'Unknown'
    const mentorEmail = mentor['Email address'] || null

    let totalCompletedClasses = 0
    let presentCount = 0
    let absentCount = 0
    let specialAttendance = 0  // Classes taken on behalf of other mentors

    // Search all cohort tables for this mentor's assigned classes
    for (const tableName of cohortTables) {
      try {
        // Get ALL past classes assigned to this mentor (regardless of recording status)
        // Past = date < today
        const { data: allPastClasses, error: pastClassesError } = await supabaseB
          .from(tableName)
          .select('id, date, mentor_id, swapped_mentor_id, session_recording')
          .eq('mentor_id', mentorId)
          .lt('date', todayDate) // Only past classes

        if (pastClassesError) {
          console.log(`  Error querying ${tableName}:`, pastClassesError.message)
          continue
        }

        if (allPastClasses && allPastClasses.length > 0) {
          console.log(`  Found ${allPastClasses.length} past assigned classes in ${tableName}`)

          for (const cls of allPastClasses) {
            totalCompletedClasses++

            const hasRecording = cls.session_recording !== null && cls.session_recording !== ''
            const wasSwapped = cls.swapped_mentor_id !== null && cls.swapped_mentor_id !== undefined

            if (!hasRecording && !wasSwapped) {
              // No recording AND no swap = mentor did nothing = ABSENT
              absentCount++
              console.log(`    Class ${cls.id} (${cls.date}): ABSENT (no recording, no action taken)`)
            } else if (wasSwapped) {
              // Swapped mentor took the class = original mentor was absent
              absentCount++
              console.log(`    Class ${cls.id} (${cls.date}): ABSENT (swapped to mentor ${cls.swapped_mentor_id})`)
            } else {
              // Has recording and no swap = original mentor was present
              presentCount++
              console.log(`    Class ${cls.id} (${cls.date}): PRESENT`)
            }
          }
        }

        // Also check for special attendance: classes where this mentor is the swapped mentor
        // (they took someone else's class) - only count completed ones with recordings
        const { data: swappedClasses, error: swappedError } = await supabaseB
          .from(tableName)
          .select('id, date, mentor_id, swapped_mentor_id, session_recording')
          .eq('swapped_mentor_id', mentorId)
          .lt('date', todayDate) // Only past classes
          .not('session_recording', 'is', null)
          .neq('session_recording', '')

        if (!swappedError && swappedClasses && swappedClasses.length > 0) {
          console.log(`  Found ${swappedClasses.length} SPECIAL classes in ${tableName} (took for other mentors)`)
          specialAttendance += swappedClasses.length
          
          for (const cls of swappedClasses) {
            console.log(`    Class ${cls.id} (${cls.date}): SPECIAL (covered for mentor ${cls.mentor_id})`)
          }
        }

      } catch (err: any) {
        console.log(`  Error processing ${tableName}:`, err.message)
      }
    }

    // Calculate attendance percentage (special attendance not included in %)
    const attendancePercent = totalCompletedClasses > 0 
      ? Math.round((presentCount / totalCompletedClasses) * 100 * 100) / 100 
      : 0

    console.log(`Summary for ${mentorName}: Total=${totalCompletedClasses}, Present=${presentCount}, Absent=${absentCount}, Special=${specialAttendance}, Attendance=${attendancePercent}%`)

    // Step 4: Save to Mentor attendance table in main DB
    const { error: upsertError } = await supabaseMain
      .from('mentor_attendance')
      .upsert({
        mentor_id: mentorId,
        name: mentorName,
        email: mentorEmail,
        total_classes: totalCompletedClasses,
        present: presentCount,
        absent: absentCount,
        special_attendance: specialAttendance,
        attendance_percent: attendancePercent,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'mentor_id'
      })

    if (upsertError) {
      console.error(`Error saving attendance for ${mentorName}:`, upsertError.message)
      return NextResponse.json({ 
        error: 'Failed to save attendance',
        details: upsertError.message 
      }, { status: 500 })
    }

    console.log(`✅ Saved attendance for ${mentorName}`)
    console.log('=== MENTOR ATTENDANCE CALCULATION COMPLETED ===')

    return NextResponse.json({
      success: true,
      message: `Attendance calculated for ${mentorName}`,
      data: {
        mentor_id: mentorId,
        name: mentorName,
        email: mentorEmail,
        total_classes: totalCompletedClasses,
        present: presentCount,
        absent: absentCount,
        special_attendance: specialAttendance,
        attendance_percent: attendancePercent
      }
    })

  } catch (error: any) {
    console.error('Error calculating mentor attendance:', error)
    return NextResponse.json({ 
      error: 'Failed to calculate mentor attendance',
      details: error.message 
    }, { status: 500 })
  }
}

// GET endpoint to fetch current attendance data
export async function GET() {
  try {
    const supabaseMain = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data, error } = await supabaseMain
      .from('mentor_attendance')
      .select('*')
      .order('attendance_percent', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      data 
    })

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 })
  }
}

