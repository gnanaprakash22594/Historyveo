import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') || '/'

  if (code) {
    // Only try to process auth if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('Skipping auth callback - Supabase not configured')
      return NextResponse.redirect(new URL('/auth/signin?error=config_missing', request.url))
    }

    try {
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Auth callback error:', error)
        return NextResponse.redirect(new URL('/auth/signin?error=auth_failed', request.url))
      }

      if (data.user) {
        // Check if user profile exists
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (!profile) {
          // Create user profile
          const { error: profileError } = await supabase
            .from('users')
            .insert({
              id: data.user.id,
              email: data.user.email!,
              full_name: data.user.user_metadata?.full_name || null,
              role: 'user' as const,
            } as any)

          if (profileError) {
            console.error('Profile creation error:', profileError)
          }
        }

        // Set session cookie
        const response = NextResponse.redirect(new URL(next, request.url))
        
        // Set auth cookie
        response.cookies.set('sb-access-token', data.session?.access_token || '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })

        response.cookies.set('sb-refresh-token', data.session?.refresh_token || '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })

        return response
      }
    } catch (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(new URL('/auth/signin?error=auth_failed', request.url))
    }
  }

  // If no code, redirect to sign in
  return NextResponse.redirect(new URL('/auth/signin', request.url))
}
