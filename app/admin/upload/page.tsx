"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Upload as UploadIcon, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Play,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Plus,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import Navigation from '@/components/navigation'

interface UploadForm {
  title: string
  description: string
  era: string
  topic: string
  region: string
  tags: string
  language: string
  visibility: 'public' | 'unlisted' | 'private'
  series_id?: string
  episode_number?: number
  youtube_url?: string
  thumbnail_url?: string
  content_type: 'video' | 'image' | 'document'
  file?: File
}

const ERA_OPTIONS = ['Ancient', 'Medieval', 'Renaissance', 'Early Modern', 'Modern', 'Contemporary']
const TOPIC_OPTIONS = ['Civilization', 'War', 'Art & Science', 'Technology', 'Politics', 'Culture', 'Religion', 'Economics']
const REGION_OPTIONS = ['Global', 'Europe', 'Asia', 'Africa', 'Americas', 'Middle East', 'Oceania']
const LANGUAGE_OPTIONS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']
const CONTENT_TYPES = [
  { value: 'video', label: 'Video', icon: VideoIcon },
  { value: 'image', label: 'Image', icon: ImageIcon },
  { value: 'document', label: 'Document', icon: FileText }
]

export default function AdminUploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [series, setSeries] = useState<any[]>([])
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<UploadForm>({
    title: '',
    description: '',
    era: '',
    topic: '',
    region: '',
    tags: '',
    language: 'en',
    visibility: 'public',
    youtube_url: '',
    thumbnail_url: '',
    content_type: 'video'
  })

  useEffect(() => {
    setMounted(true)
    checkUser()
    fetchSeries()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }

      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile || (profile as any).role !== 'admin') {
        toast({
          title: "Access denied",
          description: "You need admin privileges to access this page.",
          variant: "destructive",
        })
        router.push('/admin/login')
        return
      }

      setUser(profile)
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchSeries = async () => {
    const { data } = await supabase
      .from('series')
      .select('id, title')
      .order('title')
    
    if (data) {
      setSeries(data)
    }
  }

  const handleFormChange = (field: keyof UploadForm, value: string | number) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (file: File) => {
    if (file) {
      // Determine content type based on file extension
      const extension = file.name.split('.').pop()?.toLowerCase()
      let contentType: 'video' | 'image' | 'document' = 'document'
      
      if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
        contentType = 'video'
      } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
        contentType = 'image'
      }

      setForm(prev => ({ 
        ...prev, 
        file,
        content_type: contentType,
        title: prev.title || file.name.split('.')[0] // Auto-fill title from filename
      }))
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0])
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `uploads/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filePath, file)

    if (uploadError) {
      throw new Error(`Upload error: ${uploadError.message}`)
    }

    const { data: { publicUrl } } = supabase.storage
      .from('media')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleSubmit = async () => {
    if (!user || !form.title || !form.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (!form.file && !form.youtube_url) {
      toast({
        title: "No content",
        description: "Please upload a file or provide a YouTube URL.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      let mediaUrl = form.youtube_url
      let thumbnailUrl = form.thumbnail_url

      // Upload file if provided
      if (form.file) {
        mediaUrl = await uploadFile(form.file)
        
        // Generate thumbnail for videos
        if (form.content_type === 'video') {
          // For now, use a placeholder. In production, you'd generate thumbnails
          thumbnailUrl = '/api/thumbnails/generate' // Placeholder
        } else if (form.content_type === 'image') {
          thumbnailUrl = mediaUrl
        }
      }

      // Create content record
      const { error: contentError } = await supabase
        .from('videos')
        .insert({
          title: form.title,
          slug: generateSlug(form.title),
          description: form.description,
          era: form.era || null,
          topic: form.topic || null,
          region: form.region || null,
          tags: form.tags ? form.tags.split(',').map(tag => tag.trim()) : null,
          language: form.language,
          visibility: form.visibility,
          status: 'ready',
          series_id: form.series_id || null,
          episode_number: form.episode_number || null,
          created_by: user.id,
          youtube_url: form.youtube_url || null,
          youtube_video_id: form.youtube_url ? form.youtube_url.split('v=')[1] : null,
          youtube_thumbnail_url: thumbnailUrl,
          content_type: form.content_type,
          media_url: mediaUrl
        } as any)

      if (contentError) {
        throw contentError
      }

      toast({
        title: "Content uploaded successfully!",
        description: "Your content is now available on the platform.",
      })

      // Reset form
      setForm({
        title: '',
        description: '',
        era: '',
        topic: '',
        region: '',
        tags: '',
        language: 'en',
        visibility: 'public',
        youtube_url: '',
        thumbnail_url: '',
        content_type: 'video'
      })

      router.push('/admin')

    } catch (error) {
      console.error('Error uploading content:', error)
      toast({
        title: "Error",
        description: "Failed to upload content. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const removeFile = () => {
    setForm(prev => ({ ...prev, file: undefined }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
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
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Upload Content</h1>
              <p className="text-xl text-muted-foreground">
                Add new historical content to the platform
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin')}>
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Content Information</CardTitle>
            <CardDescription>
              Fill in the details for your historical content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Type Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">Content Type *</label>
              <div className="grid grid-cols-3 gap-3">
                {CONTENT_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <Button
                      key={type.value}
                      type="button"
                      variant={form.content_type === type.value ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => handleFormChange('content_type', type.value)}
                    >
                      <Icon className="h-6 w-6" />
                      <span>{type.label}</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                {form.content_type === 'video' ? 'Video File' : 
                 form.content_type === 'image' ? 'Image File' : 'Document File'} *
              </label>
              
              {!form.file ? (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <UploadIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-lg font-medium mb-2">
                    Drop your file here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports {form.content_type === 'video' ? 'MP4, AVI, MOV, WMV, FLV, WebM' :
                              form.content_type === 'image' ? 'JPG, PNG, GIF, WebP, SVG' :
                              'PDF, DOC, DOCX, TXT'} files
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    accept={
                      form.content_type === 'video' ? 'video/*' :
                      form.content_type === 'image' ? 'image/*' :
                      '.pdf,.doc,.docx,.txt'
                    }
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        handleFileSelect(e.target.files[0])
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {form.content_type === 'video' ? <VideoIcon className="h-8 w-8 text-blue-500" /> :
                       form.content_type === 'image' ? <ImageIcon className="h-8 w-8 text-green-500" /> :
                       <FileText className="h-8 w-8 text-orange-500" />}
                      <div>
                        <p className="font-medium">{form.file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(form.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={removeFile}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Or Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or use YouTube URL
                </span>
              </div>
            </div>

            {/* YouTube URL */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">YouTube URL</label>
              <Input
                placeholder="https://www.youtube.com/watch?v=..."
                value={form.youtube_url}
                onChange={(e) => handleFormChange('youtube_url', e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Provide a YouTube URL as an alternative to file upload
              </p>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  placeholder="Enter content title"
                  value={form.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe your content..."
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Era</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.era}
                  onChange={(e) => handleFormChange('era', e.target.value)}
                >
                  <option value="">Select era</option>
                  {ERA_OPTIONS.map(era => (
                    <option key={era} value={era}>{era}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Topic</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.topic}
                  onChange={(e) => handleFormChange('topic', e.target.value)}
                >
                  <option value="">Select topic</option>
                  {TOPIC_OPTIONS.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Region</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.region}
                  onChange={(e) => handleFormChange('region', e.target.value)}
                >
                  <option value="">Select region</option>
                  {REGION_OPTIONS.map(region => (
                    <option key={region} value={region}>{region}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.language}
                  onChange={(e) => handleFormChange('language', e.target.value)}
                >
                  {LANGUAGE_OPTIONS.map(lang => (
                    <option key={lang} value={lang}>{lang.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Visibility</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.visibility}
                  onChange={(e) => handleFormChange('visibility', e.target.value as any)}
                >
                  <option value="public">Public</option>
                  <option value="unlisted">Unlisted</option>
                  <option value="private">Private</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Series (Optional)</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.series_id || ''}
                  onChange={(e) => handleFormChange('series_id', e.target.value)}
                >
                  <option value="">No series</option>
                  {series.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>

              {form.series_id && (
                <div>
                  <label className="block text-sm font-medium mb-2">Episode Number</label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={form.episode_number || ''}
                    onChange={(e) => handleFormChange('episode_number', parseInt(e.target.value) || 0)}
                  />
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <Input
                  placeholder="war, civilization, ancient, technology"
                  value={form.tags}
                  onChange={(e) => handleFormChange('tags', e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin')}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading || !form.title || !form.description || (!form.file && !form.youtube_url)}
                className="min-w-[120px]"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  'Upload Content'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
