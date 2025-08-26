"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Image as ImageIcon, Video as VideoIcon, Upload, Trash2 } from 'lucide-react'

export default function AppearanceSettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [mounted, setMounted] = useState(false)
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
    const getPublic = (path: string) => supabase.storage.from('media').getPublicUrl(path).data.publicUrl

    const imageJpg = await exists('branding/hero.jpg')
    const imagePng = await exists('branding/hero.png')
    const videoMp4 = await exists('branding/hero.mp4')
    const videoWebm = await exists('branding/hero.webm')

    setCurrentImageUrl(imageJpg ? getPublic('branding/hero.jpg') : imagePng ? getPublic('branding/hero.png') : undefined)
    setCurrentVideoUrl(videoMp4 ? getPublic('branding/hero.mp4') : videoWebm ? getPublic('branding/hero.webm') : undefined)
  }

  const exists = async (path: string) => {
    const { data, error } = await supabase.storage.from('media').list(path.substring(0, path.lastIndexOf('/')) || '', { limit: 100 })
    if (error) return false
    const file = path.split('/').pop()
    return !!data?.find((o) => o.name === file)
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
      toast({ title: 'Hero image updated' })
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
      toast({ title: 'Hero video updated' })
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' })
    } finally {
      setUploading(false)
    }
  }

  const removeImage = async () => {
    setUploading(true)
    try {
      await supabase.storage.from('media').remove(['branding/hero.jpg', 'branding/hero.png'])
      setCurrentImageUrl(undefined)
      toast({ title: 'Hero image removed' })
    } finally {
      setUploading(false)
    }
  }

  const removeVideo = async () => {
    setUploading(true)
    try {
      await supabase.storage.from('media').remove(['branding/hero.mp4', 'branding/hero.webm'])
      setCurrentVideoUrl(undefined)
      toast({ title: 'Hero video removed' })
    } finally {
      setUploading(false)
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

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Appearance</h1>
            <p className="text-xl text-muted-foreground">Manage landing page hero background</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin')}>
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="h-5 w-5" /> Hero Image</CardTitle>
              <CardDescription>Upload JPG/PNG. Displayed when no video is set.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {currentImageUrl ? (
                  <img src={currentImageUrl} className="w-full h-full object-cover" alt="Hero" />
                ) : (
                  <div className="text-muted-foreground">No image uploaded</div>
                )}
              </div>
              <div className="flex gap-3">
                <input ref={imageInputRef} type="file" accept="image/png,image/jpeg" className="hidden" onChange={(e) => onUploadImage(e.target.files?.[0])} />
                <Button variant="outline" onClick={() => imageInputRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" /> Upload Image
                </Button>
                {currentImageUrl && (
                  <Button variant="outline" onClick={removeImage} disabled={uploading} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Video */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><VideoIcon className="h-5 w-5" /> Hero Video</CardTitle>
              <CardDescription>Upload MP4/WEBM. Loops muted behind content.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {currentVideoUrl ? (
                  <video src={currentVideoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                ) : (
                  <div className="text-muted-foreground">No video uploaded</div>
                )}
              </div>
              <div className="flex gap-3">
                <input ref={videoInputRef} type="file" accept="video/mp4,video/webm" className="hidden" onChange={(e) => onUploadVideo(e.target.files?.[0])} />
                <Button variant="outline" onClick={() => videoInputRef.current?.click()} disabled={uploading}>
                  <Upload className="h-4 w-4 mr-2" /> Upload Video
                </Button>
                {currentVideoUrl && (
                  <Button variant="outline" onClick={removeVideo} disabled={uploading} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
