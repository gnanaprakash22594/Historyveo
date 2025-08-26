"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Upload, 
  Image, 
  Video, 
  Users, 
  Settings, 
  BarChart3, 
  Shield,
  Plus,
  Edit,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/navigation'

interface AdminStats {
  totalVideos: number
  totalUsers: number
  totalSeries: number
  pendingUploads: number
}

export default function AdminDashboard() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [authTimeout, setAuthTimeout] = useState(false)
  const [stats, setStats] = useState<AdminStats>({
    totalVideos: 0,
    totalUsers: 0,
    totalSeries: 0,
    pendingUploads: 0
  })

  useEffect(() => {
    setMounted(true)
    
    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.log('Authentication timeout, redirecting to login')
        setAuthTimeout(true)
        setLoading(false)
        router.push('/admin/login')
      }
    }, 10000) // 10 second timeout

    checkUser()

    return () => clearTimeout(timeoutId)
  }, [])

  const checkUser = async () => {
    try {
      console.log('Checking user authentication...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error:', authError)
        router.push('/admin/login')
        return
      }
      
      if (!user) {
        console.log('No user found, redirecting to login')
        router.push('/admin/login')
        return
      }

      console.log('User found, checking profile...', user.id)
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        toast({
          title: "Profile Error",
          description: "Failed to load user profile.",
          variant: "destructive",
        })
        router.push('/admin/login')
        return
      }

      if (!profile) {
        console.log('No profile found')
        toast({
          title: "Access denied",
          description: "User profile not found.",
          variant: "destructive",
        })
        router.push('/admin/login')
        return
      }

      if ((profile as any).role !== 'admin') {
        console.log('User is not admin, role:', (profile as any).role)
        toast({
          title: "Access denied",
          description: "You need admin privileges to access this page.",
          variant: "destructive",
        })
        router.push('/admin/login')
        return
      }

      console.log('Admin user verified, setting user state')
      setUser(profile)
      await fetchStats()
    } catch (error) {
      console.error('Error checking user:', error)
      toast({
        title: "Authentication Error",
        description: "Failed to verify user authentication.",
        variant: "destructive",
      })
      router.push('/admin/login')
    } finally {
      console.log('Setting loading to false')
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const [videos, users, series, uploads] = await Promise.all([
        supabase.from('videos').select('id', { count: 'exact' }),
        supabase.from('users').select('id', { count: 'exact' }),
        supabase.from('series').select('id', { count: 'exact' }),
        supabase.from('uploads').select('id', { count: 'exact' }).eq('status', 'processing')
      ])

      setStats({
        totalVideos: videos.count || 0,
        totalUsers: users.count || 0,
        totalSeries: series.count || 0,
        pendingUploads: uploads.count || 0
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  // Prevent hydration mismatch
  if (!mounted) {
    return null
  }

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Loading Admin Panel</h2>
              <p className="text-muted-foreground">Verifying your admin privileges...</p>
              <p className="text-sm text-muted-foreground mt-2">This may take a few seconds</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If authentication timed out, show error
  if (authTimeout) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2 text-destructive">Authentication Timeout</h2>
              <p className="text-muted-foreground">Please try logging in again</p>
              <Button 
                onClick={() => router.push('/admin/login')}
                className="mt-4"
              >
                Go to Login
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render content (will redirect)
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Redirecting to Login</h2>
              <p className="text-muted-foreground">Please wait...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-xl text-muted-foreground">
            Welcome back, {user.full_name || user.email}
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Videos</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalVideos}</div>
              <p className="text-xs text-muted-foreground">
                Historical content available
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Series</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSeries}</div>
              <p className="text-xs text-muted-foreground">
                Content series created
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Uploads</CardTitle>
              <Upload className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingUploads}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting processing
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Content Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Content Management
              </CardTitle>
              <CardDescription>
                Upload and manage videos, images, and series
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/upload">
                <Button className="w-full" variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Upload New Content
                </Button>
              </Link>
              <Link href="/admin/videos">
                <Button className="w-full" variant="outline">
                  <Video className="h-4 w-4 mr-2" />
                  Manage Videos
                </Button>
              </Link>
              <Link href="/admin/series">
                <Button className="w-full" variant="outline">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Manage Series
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Media Library */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Media Library
              </CardTitle>
              <CardDescription>
                Organize and manage media assets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/media">
                <Button className="w-full" variant="outline">
                  <Image className="h-4 w-4 mr-2" />
                  Browse Media
                </Button>
              </Link>
              <Link href="/admin/media/upload">
                <Button className="w-full" variant="outline">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Media
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* User Management */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>
                Manage user accounts and permissions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/users">
                <Button className="w-full" variant="outline">
                  <Users className="h-4 w-4 mr-2" />
                  View Users
                </Button>
              </Link>
              <Link href="/admin/users/roles">
                <Button className="w-full" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  Manage Roles
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                System Settings
              </CardTitle>
              <CardDescription>
                Configure application settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin/settings">
                <Button className="w-full" variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  General Settings
                </Button>
              </Link>
              <Link href="/admin/settings/api">
                <Button className="w-full" variant="outline">
                  <Shield className="h-4 w-4 mr-2" />
                  API Configuration
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
