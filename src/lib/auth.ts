// Simple auth service for sending magic links

export interface MentorUser {
  id: string
  email: string
  mentorId?: number
  name?: string
}

interface SendMagicLinkResponse {
  success: boolean
  message: string
  mentorName: string
  error?: string
}

export const authService = {
  // Send magic link to mentor email
  async sendMagicLink(email: string, password: string): Promise<{ data: SendMagicLinkResponse | null; error: string | null }> {
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })

      const data = await response.json()

      if (!response.ok) {
        return { data: null, error: data.error || 'Failed to send verification link' }
      }

      return { data, error: null }
    } catch (error: any) {
      return { data: null, error: error.message || 'Network error' }
    }
  }
}
