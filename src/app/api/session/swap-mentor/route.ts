import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmail } from '@/lib/email'

// WhatsApp Cloud API Configuration
const WHATSAPP_API_URL = 'https://graph.facebook.com/v19.0'

// Format phone number for WhatsApp (must be E.164 format without +)
function formatPhoneForWhatsApp(phone: string | number | null | undefined): string | null {
  if (!phone) return null
  
  // Convert to string in case it's a number
  const phoneStr = String(phone)
  let cleaned = phoneStr.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    cleaned = '91' + cleaned
  } else if (cleaned.startsWith('0')) {
    cleaned = '91' + cleaned.substring(1)
  } else if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1)
  }
  
  if (cleaned.length < 10 || cleaned.length > 15) {
    return null
  }
  
  return cleaned
}

// Send WhatsApp template message
async function sendWhatsAppMessage(params: {
  to: string
  templateName: string
  templateLanguage?: string
  components?: any[]
}): Promise<boolean> {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  
  if (!phoneNumberId || !accessToken) {
    console.log('WhatsApp not configured - skipping WhatsApp message')
    return false
  }
  
  try {
    const url = `${WHATSAPP_API_URL}/${phoneNumberId}/messages`
    
    const body: any = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: {
          code: params.templateLanguage || 'en'
        }
      }
    }
    
    if (params.components && params.components.length > 0) {
      body.template.components = params.components
    }
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      console.error(`WhatsApp API error for ${params.to}:`, errorData)
      return false
    }
    
    const data = await response.json()
    console.log(`✅ WhatsApp sent to ${params.to}, message_id: ${data.messages?.[0]?.id}`)
    return true
    
  } catch (error: any) {
    console.error(`WhatsApp send error for ${params.to}:`, error.message)
    return false
  }
}

// Generate swap notification email HTML
function generateSwapNotificationEmailHTML(params: {
  superMentorName: string
  cohortName: string
  sessionDate: string
  sessionTime: string
  subjectName: string
  originalMentorName: string
  newMentorName: string
  swappedBy: string
}): string {
  const { superMentorName, cohortName, sessionDate, sessionTime, subjectName, originalMentorName, newMentorName, swappedBy } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Mentor Swap Alert - MentiBY</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #dc2626, #f97316); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">
        ⚠️ Mentor Swap Alert
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 14px;">A class has been reassigned to a different mentor</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <h2 style="color: #333; margin-top: 0;">Hello ${superMentorName}! 👋</h2>
      
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        A mentor swap has been made for an upcoming session. Please review the details below:
      </p>
      
      <!-- Session Details Card -->
      <div style="background: linear-gradient(135deg, #fef2f2, #fecaca); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #dc2626;">
        <h3 style="color: #991b1b; margin-top: 0; margin-bottom: 15px;">📋 Session Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #991b1b; font-weight: 600; width: 40%;">Cohort:</td>
            <td style="padding: 8px 0; color: #7f1d1d;">${cohortName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #991b1b; font-weight: 600;">📅 Date:</td>
            <td style="padding: 8px 0; color: #7f1d1d;">${sessionDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #991b1b; font-weight: 600;">⏰ Time:</td>
            <td style="padding: 8px 0; color: #7f1d1d;">${sessionTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #991b1b; font-weight: 600;">📚 Subject:</td>
            <td style="padding: 8px 0; color: #7f1d1d;">${subjectName}</td>
          </tr>
        </table>
      </div>
      
      <!-- Swap Details Card -->
      <div style="background: linear-gradient(135deg, #f0fdf4, #bbf7d0); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #16a34a;">
        <h3 style="color: #166534; margin-top: 0; margin-bottom: 15px;">🔄 Swap Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #166534; font-weight: 600; width: 40%;">Original Mentor:</td>
            <td style="padding: 8px 0; color: #14532d;">${originalMentorName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #166534; font-weight: 600;">➡️ New Mentor:</td>
            <td style="padding: 8px 0; color: #14532d; font-weight: bold;">${newMentorName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #166534; font-weight: 600;">👤 Swapped By:</td>
            <td style="padding: 8px 0; color: #14532d;">${swappedBy}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #166534; font-weight: 600;">🕐 Swapped At:</td>
            <td style="padding: 8px 0; color: #14532d;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
          </tr>
        </table>
      </div>
      
      <p style="color: #666; font-size: 14px; text-align: center; margin-top: 20px;">
        This notification is sent to all Super Mentors for tracking purposes.
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background: #1f2937; padding: 20px; text-align: center;">
      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
        © 2025 MentiBY. All rights reserved.
      </p>
      <p style="color: #6b7280; margin: 8px 0 0 0; font-size: 11px;">
        Super Mentor Notification System
      </p>
    </div>
  </div>
</body>
</html>
  `
}

// Build WhatsApp template components for swap notification
function buildSwapWhatsAppComponents(params: {
  superMentorName: string
  cohortName: string
  sessionDate: string
  sessionTime: string
  subjectName: string
  originalMentorName: string
  newMentorName: string
}): any[] {
  // Template: "Hi {{1}}, mentor swap alert for {{2}} on {{3}} at {{4}}. Subject: {{5}}. Changed from {{6}} to {{7}}."
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.superMentorName },
        { type: 'text', text: params.cohortName },
        { type: 'text', text: params.sessionDate },
        { type: 'text', text: params.sessionTime },
        { type: 'text', text: params.subjectName },
        { type: 'text', text: params.originalMentorName },
        { type: 'text', text: params.newMentorName }
      ]
    }
  ]
}

// Generate email for the NEW mentor who is assigned the class
function generateNewMentorAssignmentEmailHTML(params: {
  mentorName: string
  cohortName: string
  sessionDate: string
  sessionTime: string
  subjectName: string
  subjectTopic: string
  originalMentorName: string
  meetingLink: string
}): string {
  const { mentorName, cohortName, sessionDate, sessionTime, subjectName, subjectTopic, originalMentorName, meetingLink } = params

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Class Assigned to You - MentiBY</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f4;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; margin-top: 20px; margin-bottom: 20px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #8b5cf6, #6366f1); padding: 30px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">
        🔄 Class Assigned to You
      </h1>
      <p style="color: rgba(255,255,255,0.9); margin-top: 8px; font-size: 14px;">A session has been swapped to you</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px;">
      <h2 style="color: #333; margin-top: 0;">Hello ${mentorName}! 👋</h2>
      
      <p style="color: #666; font-size: 16px; line-height: 1.6;">
        A class has been <strong>assigned to you</strong> that was originally scheduled for <strong>${originalMentorName}</strong>. 
        Please review the session details below:
      </p>
      
      <!-- Session Details Card -->
      <div style="background: linear-gradient(135deg, #ede9fe, #ddd6fe); border-radius: 12px; padding: 20px; margin: 20px 0; border-left: 4px solid #8b5cf6;">
        <h3 style="color: #5b21b6; margin-top: 0; margin-bottom: 15px;">📋 Session Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #5b21b6; font-weight: 600; width: 35%;">Cohort:</td>
            <td style="padding: 8px 0; color: #4c1d95;">${cohortName}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #5b21b6; font-weight: 600;">📅 Date:</td>
            <td style="padding: 8px 0; color: #4c1d95;">${sessionDate}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #5b21b6; font-weight: 600;">⏰ Time:</td>
            <td style="padding: 8px 0; color: #4c1d95;">${sessionTime}</td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #5b21b6; font-weight: 600;">📚 Subject:</td>
            <td style="padding: 8px 0; color: #4c1d95;">${subjectName}</td>
          </tr>
          ${subjectTopic ? `
          <tr>
            <td style="padding: 8px 0; color: #5b21b6; font-weight: 600;">📖 Topic:</td>
            <td style="padding: 8px 0; color: #4c1d95;">${subjectTopic}</td>
          </tr>
          ` : ''}
        </table>
      </div>
      
      <!-- Join Button -->
      ${meetingLink ? `
      <div style="text-align: center; margin: 30px 0;">
        <a href="${meetingLink}" style="display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; text-decoration: none; padding: 14px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(139,92,246,0.4);">
          🎥 Join Session on Teams
        </a>
      </div>
      ` : `
      <div style="text-align: center; margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px;">
        <p style="color: #6b7280; margin: 0;">Meeting link will be generated soon. Check your dashboard.</p>
      </div>
      `}
      
      <p style="color: #666; font-size: 14px; text-align: center; margin-top: 20px;">
        Please prepare for this session. If you have any questions, contact your Super Mentor.
      </p>
      
      <!-- Dashboard Link -->
      <div style="text-align: center; margin: 15px 0;">
        <a href="https://mentiby-mentor.vercel.app" style="display: inline-block; background: linear-gradient(135deg, #f97316, #ea580c); color: white; text-decoration: none; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 600;">
          Open Mentor Dashboard
        </a>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="background: #1f2937; padding: 20px; text-align: center;">
      <p style="color: #9ca3af; margin: 0; font-size: 12px;">
        © 2025 MentiBY. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
  `
}

// Build WhatsApp template components for new mentor assignment
function buildNewMentorWhatsAppComponents(params: {
  mentorName: string
  cohortName: string
  sessionDate: string
  sessionTime: string
  subjectName: string
  meetingLink: string
}): any[] {
  // Template: "Hi {{1}}, a class for {{2}} on {{3}} at {{4}} has been assigned to you. Subject: {{5}}. Join: {{6}}"
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.mentorName },
        { type: 'text', text: params.cohortName },
        { type: 'text', text: params.sessionDate },
        { type: 'text', text: params.sessionTime },
        { type: 'text', text: params.subjectName },
        { type: 'text', text: params.meetingLink }
      ]
    }
  ]
}

// POST /api/session/swap-mentor - Swap mentor for a session
export async function POST(request: NextRequest) {
  try {
    const { tableName, sessionId, swappedMentorId, swappedByName } = await request.json()

    if (!tableName || !sessionId) {
      return NextResponse.json(
        { error: 'Missing required fields: tableName, sessionId' },
        { status: 400 }
      )
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

    // Fetch session details before update
    const { data: session, error: sessionError } = await supabaseB
      .from(tableName)
      .select('*')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    // Fetch original mentor details
    const { data: originalMentor } = await supabaseB
      .from('Mentor Details')
      .select('mentor_id, Name, "Email address"')
      .eq('mentor_id', session.mentor_id)
      .single()

    // Fetch new mentor details (if swapping, not removing)
    let newMentor: any = null
    if (swappedMentorId) {
      const { data: mentor } = await supabaseB
        .from('Mentor Details')
        .select('mentor_id, Name, "Email address", "Mobile number"')
        .eq('mentor_id', swappedMentorId)
        .single()
      newMentor = mentor
    }

    // Update the swapped_mentor_id
    const { error } = await supabaseB
      .from(tableName)
      .update({ swapped_mentor_id: swappedMentorId || null })
      .eq('id', sessionId)

    if (error) {
      console.error('Error updating swapped mentor:', error)
      return NextResponse.json(
        { error: 'Failed to update mentor' },
        { status: 500 }
      )
    }

    // Only send notifications if actually swapping (not removing swap)
    if (swappedMentorId && newMentor) {
      // Fetch all super mentors from main database
      const { data: superMentors, error: smError } = await supabaseMain
        .from('supermentor_details')
        .select('*')

      if (smError) {
        console.error('Error fetching super mentors:', smError)
      }

      if (superMentors && superMentors.length > 0) {
        console.log(`Sending swap notifications to ${superMentors.length} super mentors`)

        // Parse cohort name from table name
        const cohortName = tableName.replace('_schedule', '').replace(/_/g, '.').replace(/([a-z])(\d)/, '$1 $2')

        // Format session date and time
        const sessionDate = session.date 
          ? new Date(session.date).toLocaleDateString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })
          : 'TBD'

        const sessionTime = session.time
          ? new Date(`2000-01-01T${session.time}`).toLocaleTimeString('en-IN', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })
          : 'TBD'

        const originalMentorName = originalMentor?.Name || 'Unknown Mentor'
        const newMentorName = newMentor?.Name || 'Unknown Mentor'
        const swappedBy = swappedByName || 'A Mentor'

        // WhatsApp template name for swap alerts
        const SWAP_WA_TEMPLATE = process.env.WHATSAPP_SWAP_TEMPLATE || 'mentor_swap_alert'

        let emailsSent = 0
        let whatsAppSent = 0

        for (const superMentor of superMentors) {
          // Send Email
          if (superMentor.email) {
            const emailHtml = generateSwapNotificationEmailHTML({
              superMentorName: superMentor.name,
              cohortName: cohortName.charAt(0).toUpperCase() + cohortName.slice(1),
              sessionDate,
              sessionTime,
              subjectName: session.subject_name || 'Session',
              originalMentorName,
              newMentorName,
              swappedBy
            })

            const sent = await sendEmail({
              to: superMentor.email,
              subject: `⚠️ Mentor Swap Alert: ${cohortName} - ${session.subject_name || 'Session'}`,
              html: emailHtml
            })

            if (sent) {
              emailsSent++
              console.log(`✅ Swap notification email sent to ${superMentor.email}`)
            }
          }

          // Send WhatsApp
          const phone = formatPhoneForWhatsApp(superMentor.phone_num)
          if (phone) {
            const waComponents = buildSwapWhatsAppComponents({
              superMentorName: superMentor.name,
              cohortName: cohortName.charAt(0).toUpperCase() + cohortName.slice(1),
              sessionDate,
              sessionTime,
              subjectName: session.subject_name || 'Session',
              originalMentorName,
              newMentorName
            })

            const waSent = await sendWhatsAppMessage({
              to: phone,
              templateName: SWAP_WA_TEMPLATE,
              components: waComponents
            })

            if (waSent) {
              whatsAppSent++
              console.log(`✅ Swap notification WhatsApp sent to ${phone}`)
            }
          }

          // Rate limit: wait 500ms between messages
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        console.log(`Swap notifications sent to super mentors: ${emailsSent} emails, ${whatsAppSent} WhatsApp`)
      }

      // Send notification to the NEW MENTOR (swapped mentor)
      const newMentorEmail = newMentor?.['Email address']
      const newMentorPhone = formatPhoneForWhatsApp(newMentor?.['Mobile number'])
      const cohortNameFormatted = tableName.replace('_schedule', '').replace(/_/g, '.').replace(/([a-z])(\d)/, '$1 $2')
      const cohortDisplay = cohortNameFormatted.charAt(0).toUpperCase() + cohortNameFormatted.slice(1)

      // Format session date and time for new mentor email
      const formattedSessionDate = session.date 
        ? new Date(session.date).toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })
        : 'TBD'

      const formattedSessionTime = session.time
        ? new Date(`2000-01-01T${session.time}`).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
          })
        : 'TBD'

      if (newMentorEmail) {
        console.log(`Sending swap assignment email to new mentor: ${newMentorEmail}`)
        
        const newMentorEmailHtml = generateNewMentorAssignmentEmailHTML({
          mentorName: newMentor?.Name || 'Mentor',
          cohortName: cohortDisplay,
          sessionDate: formattedSessionDate,
          sessionTime: formattedSessionTime,
          subjectName: session.subject_name || 'Session',
          subjectTopic: session.subject_topic || '',
          originalMentorName: originalMentor?.Name || 'Unknown',
          meetingLink: session.teams_meeting_link || ''
        })

        const sent = await sendEmail({
          to: newMentorEmail,
          subject: `🔄 Class Assigned to You: ${cohortDisplay} - ${session.subject_name || 'Session'}`,
          html: newMentorEmailHtml
        })

        if (sent) {
          console.log(`✅ Assignment email sent to new mentor: ${newMentorEmail}`)
        }
      }

      // Send WhatsApp to new mentor
      if (newMentorPhone) {
        console.log(`Sending swap assignment WhatsApp to new mentor: ${newMentorPhone}`)
        
        const NEW_MENTOR_WA_TEMPLATE = process.env.WHATSAPP_NEW_MENTOR_TEMPLATE || 'class_assigned_mentor'
        
        const waComponents = buildNewMentorWhatsAppComponents({
          mentorName: newMentor?.Name || 'Mentor',
          cohortName: cohortDisplay,
          sessionDate: formattedSessionDate,
          sessionTime: formattedSessionTime,
          subjectName: session.subject_name || 'Session',
          meetingLink: session.teams_meeting_link || 'Check Dashboard'
        })

        const waSent = await sendWhatsAppMessage({
          to: newMentorPhone,
          templateName: NEW_MENTOR_WA_TEMPLATE,
          components: waComponents
        })

        if (waSent) {
          console.log(`✅ Assignment WhatsApp sent to new mentor: ${newMentorPhone}`)
        }
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: swappedMentorId ? 'Mentor swapped successfully' : 'Mentor swap removed'
    })

  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error.message || 'An error occurred' },
      { status: 500 }
    )
  }
}
