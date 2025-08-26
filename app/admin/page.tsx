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
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('AdminDashboard useEffect running')
    
    // Simple timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Timeout reached, setting loading to false')
      setLoading(false)
    }, 3000) // 3 second timeout
    
    // Quick auth check
    const quickCheck = async () => {
      try {
        console.log('Quick auth check starting...')
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Quick auth result:', user ? 'User found' : 'No user')
        
        if (!user) {
          console.log('No user, redirecting to login')
          window.location.href = '/admin/login'
          return
        }
        
        // Skip complex role checking for now
        console.log('User found, proceeding to dashboard')
        setLoading(false)
      } catch (error) {
        console.error('Quick auth error:', error)
        setLoading(false)
      }
    }
    
    quickCheck()
    
    return () => clearTimeout(timeoutId)
  }, [])

  console.log('AdminDashboard component rendering, loading:', loading)

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
              <p className="text-sm text-muted-foreground mt-2">This will timeout in 3 seconds</p>
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
