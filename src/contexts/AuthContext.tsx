'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import type { Session, User } from '@supabase/supabase-js'

// Create Supabase B client directly here to avoid import issues
const supabaseB = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL_B!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY_B!
)

export interface MentorUser {
  id: string
  email: string
  mentorId?: number
  name?: string
}

interface AuthContextType {
  user: MentorUser | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signOut: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function userToMentor(user: User | null): MentorUser | null {
  if (!user) return null
  return {
    id: user.id,
    email: user.email || '',
    mentorId: user.user_metadata?.mentor_id,
    name: user.user_metadata?.mentor_name || user.user_metadata?.full_name || user.email?.split('@')[0]
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MentorUser | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let isCancelled = false

    // Get initial session with timeout
    const initAuth = async () => {
      try {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
        
        const sessionPromise = supabaseB.auth.getSession()
        
        const result = await Promise.race([sessionPromise, timeoutPromise]) as any
        
        if (!isCancelled && result?.data?.session) {
          setSession(result.data.session)
          setUser(userToMentor(result.data.session.user))
        }
      } catch (error) {
        console.error('Init auth error:', error)
      } finally {
        if (!isCancelled) {
        setLoading(false)
        }
      }
    }

    initAuth()

    // Listen for auth state changes
    const { data: { subscription } } = supabaseB.auth.onAuthStateChange((event, newSession) => {
      if (isCancelled) return
      
      console.log('Auth event:', event)
      setSession(newSession)
      setUser(userToMentor(newSession?.user || null))
      setLoading(false)
    })

    return () => {
      isCancelled = true
      subscription.unsubscribe()
    }
  }, [mounted])

  const signOut = async () => {
    try {
      await supabaseB.auth.signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
            setUser(null)
            setSession(null)
  }

  const refreshAuth = async () => {
    try {
      const { data } = await supabaseB.auth.getSession()
      if (data.session) {
        setSession(data.session)
        setUser(userToMentor(data.session.user))
          } else {
        setSession(null)
          setUser(null)
        }
    } catch (error) {
      console.error('Refresh auth error:', error)
  }
  }

  if (!mounted) {
    return null
  }

  return (
    <AuthContext.Provider value={{
      user,
      session,
      loading,
      isAuthenticated: !!session,
      signOut,
      refreshAuth
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 
