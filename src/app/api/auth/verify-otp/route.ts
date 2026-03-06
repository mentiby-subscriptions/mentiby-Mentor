import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { hashOTP } from '@/lib/otp'

const supabaseB = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL_B!,
  process.env.SUPABASE_SERVICE_ROLE_KEY_B!
)

const MAX_OTP_ATTEMPTS = 5

export async function POST(request: NextRequest) {
  try {
    const { email, otp } = await request.json()

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and verification code are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()
    const otpHash = hashOTP(otp.toString().trim())

    // Find the most recent unused, unexpired OTP for this email
    const { data: otpRecord, error: fetchError } = await supabaseB
      .from('otp_codes')
      .select('*')
      .eq('email', normalizedEmail)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (fetchError || !otpRecord) {
      return NextResponse.json(
        { error: 'Verification code expired or not found. Please request a new one.' },
        { status: 401 }
      )
    }

    // Check attempt limit
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      await supabaseB
        .from('otp_codes')
        .update({ used: true })
        .eq('id', otpRecord.id)

      return NextResponse.json(
        { error: 'Too many failed attempts. Please request a new code.' },
        { status: 429 }
      )
    }

    // Increment attempt counter
    await supabaseB
      .from('otp_codes')
      .update({ attempts: otpRecord.attempts + 1 })
      .eq('id', otpRecord.id)

    // Verify OTP hash
    if (otpRecord.otp_hash !== otpHash) {
      const remaining = MAX_OTP_ATTEMPTS - otpRecord.attempts - 1
      return NextResponse.json(
        { error: `Invalid code. ${remaining} attempt(s) remaining.` },
        { status: 401 }
      )
    }

    // Mark OTP as used
    await supabaseB
      .from('otp_codes')
      .update({ used: true })
      .eq('id', otpRecord.id)

    // Create/get user in Supabase Auth so they appear in Authentication > Users
    // Try to create first; if user already exists, update instead
    let userId: string

    const { data: newUser, error: createError } = await supabaseB.auth.admin.createUser({
      email: normalizedEmail,
      email_confirm: true,
      user_metadata: {
        role: 'mentor',
        mentor_id: otpRecord.mentor_id,
        mentor_name: otpRecord.mentor_name,
      },
    })

    if (createError) {
      if (createError.message?.includes('already been registered') || createError.status === 422) {
        // User exists — find and update them
        const { data: existingUsers } = await supabaseB.auth.admin.listUsers({
          page: 1,
          perPage: 1,
        })
        // listUsers doesn't filter by email, so we need to use getUserByEmail pattern
        // Use a direct approach: generate the link which will work for existing users
        const { data: linkCheck, error: linkCheckError } = await supabaseB.auth.admin.generateLink({
          type: 'magiclink',
          email: normalizedEmail,
        })
        if (linkCheckError || !linkCheck.user) {
          console.error('Find existing user error:', linkCheckError)
          return NextResponse.json(
            { error: 'Failed to establish session. Please try again.' },
            { status: 500 }
          )
        }
        userId = linkCheck.user.id
        // Update metadata
        await supabaseB.auth.admin.updateUserById(userId, {
          user_metadata: {
            role: 'mentor',
            mentor_id: otpRecord.mentor_id,
            mentor_name: otpRecord.mentor_name,
          },
        })
      } else {
        console.error('Create user error:', createError)
        return NextResponse.json(
          { error: 'Failed to establish session. Please try again.' },
          { status: 500 }
        )
      }
    } else {
      userId = newUser.user!.id
    }

    // Generate a magic link server-side (not emailed) to get session tokens
    const { data: linkData, error: linkError } = await supabaseB.auth.admin.generateLink({
      type: 'magiclink',
      email: normalizedEmail,
    })

    if (linkError || !linkData) {
      console.error('Generate link error:', linkError)
      return NextResponse.json(
        { error: 'Failed to establish session. Please try again.' },
        { status: 500 }
      )
    }

    // Exchange the hashed token for a Supabase session
    const { data: sessionData, error: verifyError } = await supabaseB.auth.verifyOtp({
      token_hash: linkData.properties.hashed_token,
      type: 'magiclink',
    })

    if (verifyError || !sessionData.session) {
      console.error('Verify session error:', verifyError)
      return NextResponse.json(
        { error: 'Failed to establish session. Please try again.' },
        { status: 500 }
      )
    }

    // Return the session tokens to the client
    // The client will use supabaseB.auth.setSession() to establish the session
    return NextResponse.json({
      success: true,
      session: {
        access_token: sessionData.session.access_token,
        refresh_token: sessionData.session.refresh_token,
      },
      user: {
        id: sessionData.user?.id || userId,
        email: normalizedEmail,
        mentorId: otpRecord.mentor_id,
        name: otpRecord.mentor_name,
        role: 'mentor',
      },
    })

  } catch (error: any) {
    console.error('Verify OTP error:', error)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
