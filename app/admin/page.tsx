"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Upload, 
  Image, 
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/navigation'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  console.log('AdminDashboard component rendering, loading:', loading, 'user:', user)

  useEffect(() => {
    console.log('AdminDashboard useEffect running')
    // Simple auth check
    const checkAuth = async () => {
      console.log('Starting admin auth check...')
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        console.log('Auth result:', { user, error: authError })
        
        if (authError) {
          console.error('Auth error:', authError)
          window.location.href = '/admin/login'
          return
        }
        
        if (!user) {
          console.log('No user found, redirecting to login')
          window.location.href = '/admin/login'
          return
        }

        console.log('User found, checking profile...', user.id)
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        console.log('Profile result:', { profile, error: profileError })
        
        if (profileError) {
          console.error('Profile error:', profileError)
          window.location.href = '/admin/login'
          return
        }
        
        if (!profile) {
          console.log('No profile found')
          window.location.href = '/admin/login'
          return
        }

        if ((profile as any).role !== 'admin') {
          console.log('User is not admin, role:', (profile as any).role)
          window.location.href = '/admin/login'
          return
        }

        console.log('Admin user verified successfully, setting user state')
        setUser(profile)
      } catch (error) {
        console.error('Unexpected error in auth check:', error)
        window.location.href = '/admin/login'
        return
      } finally {
        console.log('Setting loading to false')
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  // Simple loading state
  if (loading) {
    console.log('Rendering loading state')
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading admin panel...</p>
              <p className="text-sm text-muted-foreground mt-2">Check browser console for debug info</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If no user, show nothing (will redirect)
  if (!user) {
    console.log('No user found, showing redirect message')
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Redirecting to Login</h2>
              <p className="text-muted-foreground">Please wait...</p>
              <p className="text-sm text-muted-foreground mt-2">If this takes too long, check the console</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  console.log('Rendering admin dashboard content')

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Admin Dashboard</h1>
            <p className="text-xl text-muted-foreground">Manage your HistoryVeo content</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Featured Content Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Plus className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Featured Content</CardTitle>
                <CardDescription>
                  Add YouTube videos to your homepage featured section
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Upload YouTube videos with custom thumbnails and descriptions to showcase on your homepage.
                </p>
                <Button 
                  onClick={() => window.location.href = '/admin/featured'}
                  className="w-full"
                  size="lg"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Manage Featured Content
                </Button>
              </CardContent>
            </Card>

            {/* Hero Section Management */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center">
                  <Image className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Hero Section</CardTitle>
                <CardDescription>
                  Upload hero background images and videos
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-muted-foreground mb-6">
                  Set the background image or video for your homepage hero section.
                </p>
                <Button 
                  onClick={() => window.location.href = '/admin/hero'}
                  className="w-full"
                  size="lg"
                >
                  <Image className="mr-2 h-4 w-4" />
                  Manage Hero Section
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats */}
          <div className="mt-12">
            <Card>
              <CardHeader>
                <CardTitle>Quick Overview</CardTitle>
                <CardDescription>Your content summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">0</div>
                    <div className="text-sm text-muted-foreground">Featured Videos</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">0</div>
                    <div className="text-sm text-muted-foreground">Hero Media</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">0</div>
                    <div className="text-sm text-muted-foreground">Total Views</div>
                  </div>
                  <div className="p-4 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">0</div>
                    <div className="text-sm text-muted-foreground">Total Likes</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
