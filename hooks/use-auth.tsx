
import React, { createContext, useContext } from 'react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { type User } from '@supabase/supabase-js'

interface SignUpProps {
  email?: string
  password?: string
}

interface SignInProps {
  email?: string
  password?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: ({ email, password }: SignUpProps) => Promise<any>
  signIn: ({ email, password }: SignInProps) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        setUser(session?.user ?? null)
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async ({ email, password }: SignUpProps) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email: email!,
        password: password!,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      if (error) throw error
      return data
    } catch (error: any) {
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async ({ email, password }: SignInProps) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email!,
        password: password!,
      })
      if (error) throw error
      return data
    } catch (error: any) {
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
    } catch (error: any) {
      if (error) throw error
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
