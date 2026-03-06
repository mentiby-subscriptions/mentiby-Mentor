export interface MentorUser {
  id: string
  email: string
  mentorId?: number
  name?: string
}

interface SendOTPResponse {
  success: boolean
  message: string
  mentorName: string
  error?: string
}

interface VerifyOTPResponse {
  success: boolean
  session: {
    access_token: string
    refresh_token: string
  }
  user: MentorUser & { role: string }
  error?: string
}

export const authService = {
  // Send OTP to mentor email (still uses /api/auth/magic-link endpoint)
  async sendMagicLink(email: string, password: string): Promise<{ data: SendOTPResponse | null; error: string | null }> {
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        return { data: null, error: data.error || 'Failed to send verification code' }
      }

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Network error' }
    }
  },

  // Verify OTP and get session tokens
  async verifyOTP(email: string, otp: string): Promise<{ data: VerifyOTPResponse | null; error: string | null }> {
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })

      const data = await response.json()

      if (!response.ok) {
        return { data: null, error: data.error || 'Verification failed' }
      }

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Network error' }
    }
  }
}
