import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateOTP, hashOTP, generateOTPEmailHTML } from '@/lib/otp'
import { sendEmail } from '@/lib/email'

// Use DB B for everything (mentor check + auth)
const supabaseB = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL_B!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_B!
)

// Hardcoded access password for mentor dashboard
const MENTOR_ACCESS_PASSWORD = 'Createimpact@4468'

const OTP_EXPIRY_MINUTES = 5

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    // Validate password first
    if (!password) {
      return NextResponse.json(
        { error: 'Access password is required' },
        { status: 400 }
      )
    }

    if (password !== MENTOR_ACCESS_PASSWORD) {
      return NextResponse.json(
        { error: 'Credentials not matched' },
        { status: 401 }
      )
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if email exists in Mentor Details table (DB B)
    const { data: mentor, error: mentorError } = await supabaseB
      .from('Mentor Details')
      .select('mentor_id, Name, "Email address"')
      .ilike('Email address', normalizedEmail)
      .single()

    if (mentorError || !mentor) {
      return NextResponse.json(
        { error: 'Credentials not matched' },
        { status: 401 }
      )
    }

    // Rate limit: check if an unused OTP was created < 60s ago
    const { data: recentOtp } = await supabaseB
      .from('otp_codes')
      .select('created_at')
      .eq('email', normalizedEmail)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (recentOtp) {
      const createdAt = new Date(recentOtp.created_at).getTime()
      if (Date.now() - createdAt < 60 * 1000) {
        return NextResponse.json(
          { error: 'Please wait before requesting a new code.' },
          { status: 429 }
        )
      }
    }

    // Invalidate any previous unused OTPs for this email
    await supabaseB
      .from('otp_codes')
      .update({ used: true })
      .eq('email', normalizedEmail)
      .eq('used', false)

    // Generate and store new OTP
    const otp = generateOTP()
    const otpHash = hashOTP(otp)
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000).toISOString()

    const { error: insertError } = await supabaseB
      .from('otp_codes')
      .insert({
        email: normalizedEmail,
        otp_hash: otpHash,
        mentor_id: mentor.mentor_id,
        mentor_name: mentor.Name,
        expires_at: expiresAt,
      })

    if (insertError) {
      console.error('OTP insert error:', insertError)
      return NextResponse.json(
        { error: 'Failed to generate verification code.' },
        { status: 500 }
      )
    }

    // Send OTP email via Resend
    const emailHtml = generateOTPEmailHTML(mentor.Name, otp)
    const sent = await sendEmail({
      to: normalizedEmail,
      subject: 'Your MentiBY Login Code',
      html: emailHtml,
    })

    if (!sent) {
      return NextResponse.json(
        { error: 'Failed to send verification email. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Verification code sent successfully',
      mentorName: mentor.Name
    })

  } catch (error: any) {
    console.error('Send OTP error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
