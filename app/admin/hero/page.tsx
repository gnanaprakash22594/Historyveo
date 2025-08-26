"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Image as ImageIcon, Video as VideoIcon, Upload, Trash2, ArrowLeft } from 'lucide-react'

export default function HeroManagementPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>()
  const [currentVideoUrl, setCurrentVideoUrl] = useState<string | undefined>()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    checkUserAndLoad()
  }, [])

  const checkUserAndLoad = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }
      const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (!profile || (profile as any).role !== 'admin') {
        router.push('/admin/login')
        return
      }
      setUser(profile)
      await refreshMedia()
    } finally {
      setLoading(false)
    }
  }

  const refreshMedia = async () => {
    try {
      const getPublic = (path: string) => supabase.storage.from('media').getPublicUrl(path).data.publicUrl

      const imageJpg = await exists('branding/hero.jpg')
      const imagePng = await exists('branding/hero.png')
      const videoMp4 = await exists('branding/hero.mp4')
      const videoWebm = await exists('branding/hero.webm')

      setCurrentImageUrl(imageJpg ? getPublic('branding/hero.jpg') : imagePng ? getPublic('branding/hero.png') : undefined)
      setCurrentVideoUrl(videoMp4 ? getPublic('branding/hero.mp4') : videoWebm ? getPublic('branding/hero.webm') : undefined)
    } catch (error) {
      console.error('Error refreshing media:', error)
    }
  }

  const exists = async (path: string) => {
    try {
      const { data, error } = await supabase.storage.from('media').list(path.substring(0, path.lastIndexOf('/')) || '', { limit: 100 })
      if (error) return false
      const file = path.split('/').pop()
      return !!data?.find((o) => o.name === file)
    } catch {
      return false
    }
  }

  const uploadFile = async (file: File, targetName: string) => {
    const path = `branding/${targetName}`
    const { error } = await supabase.storage.from('media').upload(path, file, { upsert: true })
    if (error) throw error
    return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
  }

  const onUploadImage = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const publicUrl = await uploadFile(file, 'hero.' + (file.type.includes('png') ? 'png' : 'jpg'))
      setCurrentImageUrl(publicUrl)
      toast({ title: 'Hero image updated successfully!' })
      await refreshMedia()
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const onUploadVideo = async (file?: File) => {
    if (!file) return
    setUploading(true)
    try {
      const ext = file.type.includes('webm') ? 'webm' : 'mp4'
      const publicUrl = await uploadFile(file, `hero.${ext}`)
      setCurrentVideoUrl(publicUrl)
      toast({ title: 'Hero video updated successfully!' })
      await refreshMedia()
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const removeHeroMedia = async (type: 'image' | 'video') => {
    try {
      if (type === 'image') {
        await supabase.storage.from('media').remove(['branding/hero.jpg', 'branding/hero.png'])
        setCurrentImageUrl(undefined)
        toast({ title: 'Hero image removed' })
      } else {
        await supabase.storage.from('media').remove(['branding/hero.mp4', 'branding/hero.webm'])
        setCurrentVideoUrl(undefined)
        toast({ title: 'Hero video removed' })
      }
    } catch (error) {
      toast({ title: 'Failed to remove media', variant: 'destructive' })
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
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    )
  }

  // If not authenticated, don't render content (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Hero Section Management</h1>
              <p className="text-muted-foreground">Upload background images and videos for your homepage</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Hero Image Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Hero Image
                </CardTitle>
                <CardDescription>
                  Upload a background image for your hero section (JPG or PNG)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentImageUrl && (
                  <div className="relative">
                    <img 
                      src={currentImageUrl} 
                      alt="Current hero image" 
                      className="w-full h-48 object-cover rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeHeroMedia('image')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Input
                    ref={imageInputRef}
                    type="file"
                    accept="image/jpeg,image/png"
                    onChange={(e) => onUploadImage(e.target.files?.[0])}
                    className="hidden"
                  />
                  <Button
                    onClick={() => imageInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {currentImageUrl ? 'Change Image' : 'Upload Image'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Hero Video Upload */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <VideoIcon className="h-5 w-5" />
                  Hero Video
                </CardTitle>
                <CardDescription>
                  Upload a background video for your hero section (MP4 or WebM)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentVideoUrl && (
                  <div className="relative">
                    <video 
                      src={currentVideoUrl} 
                      className="w-full h-48 object-cover rounded-lg"
                      controls
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => removeHeroMedia('video')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Input
                    ref={videoInputRef}
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={(e) => onUploadVideo(e.target.files?.[0])}
                    className="hidden"
                  />
                  <Button
                    onClick={() => videoInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        {currentVideoUrl ? 'Change Video' : 'Upload Video'}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Instructions */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>• Upload an image or video to set as your homepage hero background</p>
                <p>• The hero section will automatically display your uploaded media</p>
                <p>• Supported formats: JPG, PNG for images; MP4, WebM for videos</p>
                <p>• You can remove existing media by clicking the trash icon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
