import { createClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { GetServerSidePropsContext } from 'next'

// Environment variables with validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Development mode fallbacks to allow app to run without Supabase
const isDevelopment = process.env.NODE_ENV === 'development'
const fallbackUrl = 'https://placeholder.supabase.co'
const fallbackKey = 'placeholder_key'

// Use fallbacks in development if variables are missing
const cleanSupabaseUrl = supabaseUrl ? supabaseUrl.trim().replace(/\/$/, '') : (isDevelopment ? fallbackUrl : '')
const cleanSupabaseAnonKey = supabaseAnonKey ? supabaseAnonKey.trim() : (isDevelopment ? fallbackKey : '')

// Validate environment variables (only throw in production)
if (!supabaseUrl && !isDevelopment) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseAnonKey && !isDevelopment) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

// Warn in development if using fallbacks
if (isDevelopment && (!supabaseUrl || !supabaseAnonKey)) {
  console.warn('⚠️  Using Supabase fallback values in development. Some features may not work.')
  console.warn('   To enable full functionality, set up your environment variables:')
  console.warn('   - NEXT_PUBLIC_SUPABASE_URL')
  console.warn('   - NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

// Validate URL format (skip validation for fallback)
if (cleanSupabaseUrl !== fallbackUrl) {
  try {
    new URL(cleanSupabaseUrl)
  } catch (error) {
    console.error('Invalid NEXT_PUBLIC_SUPABASE_URL format:', cleanSupabaseUrl)
    if (!isDevelopment) {
      throw new Error(`Invalid NEXT_PUBLIC_SUPABASE_URL format: ${cleanSupabaseUrl}`)
    }
  }
}

console.log('Supabase configuration loaded:', { 
  url: cleanSupabaseUrl, 
  hasAnonKey: !!cleanSupabaseAnonKey,
  isDevelopment,
  usingFallbacks: cleanSupabaseUrl === fallbackUrl
})

// Client-side Supabase client
export const supabase = createClient(cleanSupabaseUrl, cleanSupabaseAnonKey)

// Browser client for client-side usage
export const createSupabaseBrowserClient = () => {
  return createBrowserClient(cleanSupabaseUrl, cleanSupabaseAnonKey)
}

// Server client for server-side usage (API routes, getServerSideProps)
export const createSupabaseServerClient = (context?: GetServerSidePropsContext) => {
  if (context) {
    // For getServerSideProps context
    return createServerClient(cleanSupabaseUrl, cleanSupabaseAnonKey, {
      cookies: {
        get(name: string) {
          return context.req.cookies[name]
        },
        set(name: string, value: string, options: any) {
          context.res.setHeader('Set-Cookie', `${name}=${value}; Path=/; ${options.httpOnly ? 'HttpOnly;' : ''} ${options.secure ? 'Secure;' : ''} SameSite=Lax`)
        },
        remove(name: string, options: any) {
          context.res.setHeader('Set-Cookie', `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT`)
        },
      },
    })
  } else {
    // For API routes - use a simpler approach
    return createClient(cleanSupabaseUrl, cleanSupabaseAnonKey)
  }
}

// For API routes specifically
export const createSupabaseServerClientForAPI = () => {
  return createClient(cleanSupabaseUrl, cleanSupabaseAnonKey)
}

// Middleware helper for authentication
export const createSupabaseMiddlewareClient = (
  request: NextRequest,
  response: NextResponse
) => {
  return createServerClient(cleanSupabaseUrl, cleanSupabaseAnonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: any) {
        request.cookies.set({
          name,
          value,
          ...options,
        })
        response.cookies.set({
          name,
          value,
          ...options,
        })
      },
      remove(name: string, options: any) {
        request.cookies.set({
          name,
          value: '',
          ...options,
        })
        response.cookies.set({
          name,
          value: '',
          ...options,
        })
      },
    },
  })
}

// Service role client for admin operations
export const createSupabaseServiceRoleClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceRoleKey) {
    if (isDevelopment) {
      console.warn('⚠️  Missing SUPABASE_SERVICE_ROLE_KEY in development mode')
      return createClient(cleanSupabaseUrl, fallbackKey)
    }
    console.error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }

  return createClient(
    cleanSupabaseUrl, 
    serviceRoleKey.trim(), 
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseAnonKey && cleanSupabaseUrl !== fallbackUrl)
}

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          subscription: string
          created_at: string
        }
        Insert: {
          id: string
          email: string
          subscription?: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          subscription?: string
          created_at?: string
        }
      }
      history: {
        Row: {
          id: string
          user_id: string
          query: string
          response: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          query: string
          response: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          query?: string
          response?: string
          created_at?: string
        }
      }
    }
  }
} 