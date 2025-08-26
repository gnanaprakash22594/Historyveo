"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Upload as UploadIcon, 
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Plus,
  Trash2,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import { generateSlug } from '@/lib/utils'
import Navigation from '@/components/navigation'

interface MediaUploadForm {
  title: string
  description: string
  content_type: 'video' | 'image' | 'document'
  files: File[]
  tags: string
  visibility: 'public' | 'unlisted' | 'private'
  category?: string
  language: string
}

const CONTENT_TYPES = [
  { value: 'video', label: 'Video', icon: VideoIcon, accept: 'video/*', maxSize: 500 },
  { value: 'image', label: 'Image', icon: ImageIcon, accept: 'image/*', maxSize: 50 },
  { value: 'document', label: 'Document', icon: FileText, accept: '.pdf,.doc,.docx,.txt,.rtf', maxSize: 100 }
]

const CATEGORIES = ['Historical', 'Educational', 'Art', 'Science', 'Culture', 'Politics', 'Technology', 'Other']
const LANGUAGES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']

export default function MediaUploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState<MediaUploadForm>({
    title: '',
    description: '',
    content_type: 'image',
    files: [],
    tags: '',
    visibility: 'public',
    category: '',
    language: 'en'
  })

  useEffect(() => {
    checkUser()
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
      router.push('/auth/signin')
    }
  }

  const handleFormChange = (field: keyof MediaUploadForm, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files)
    const validFiles = newFiles.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase()
      const maxSize = CONTENT_TYPES.find(t => t.value === form.content_type)?.maxSize || 50
      
      // Check file size (MB)
      if (file.size / 1024 / 1024 > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds the maximum size of ${maxSize}MB for ${form.content_type}s.`,
          variant: "destructive",
        })
        return false
      }

      // Check file type
      if (form.content_type === 'video') {
        if (!['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(extension || '')) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported video format.`,
            variant: "destructive",
          })
          return false
        }
      } else if (form.content_type === 'image') {
        if (!['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported image format.`,
            variant: "destructive",
          })
          return false
        }
      } else if (form.content_type === 'document') {
        if (!['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(extension || '')) {
          toast({
            title: "Invalid file type",
            description: `${file.name} is not a supported document format.`,
            variant: "destructive",
          })
          return false
        }
      }

      return true
    })

    if (validFiles.length > 0) {
      setForm(prev => ({ 
        ...prev, 
        files: [...prev.files, ...validFiles],
        title: prev.title || validFiles[0].name.split('.')[0] // Auto-fill title from first filename
      }))
    }
  }

  const removeFile = (index: number) => {
    setForm(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }))
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
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const uploadFile = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `media/${form.content_type}s/${fileName}`

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
    if (!user || !form.title || !form.description || form.files.length === 0) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields and upload at least one file.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)

    try {
      const uploadPromises = form.files.map(file => uploadFile(file))
      const uploadedUrls = await Promise.all(uploadPromises)

      // Create content records for each uploaded file
      const contentPromises = form.files.map((file, index) => {
        const mediaUrl = uploadedUrls[index]
        const thumbnailUrl = form.content_type === 'image' ? mediaUrl : undefined

        return supabase
          .from('videos')
          .insert({
            title: `${form.title} - ${file.name}`,
            slug: generateSlug(`${form.title} - ${file.name}`),
            description: form.description,
            content_type: form.content_type,
            media_url: mediaUrl,
            thumbnail_url: thumbnailUrl,
            tags: form.tags ? form.tags.split(',').map(tag => tag.trim()) : null,
            language: form.language,
            visibility: form.visibility,
            status: 'ready',
            created_by: user.id,
            category: form.category || null
          } as any)
      })

      await Promise.all(contentPromises)

      toast({
        title: "Media uploaded successfully!",
        description: `${form.files.length} file(s) have been uploaded and are now available.`,
      })

      // Reset form
      setForm({
        title: '',
        description: '',
        content_type: 'image',
        files: [],
        tags: '',
        visibility: 'public',
        category: '',
        language: 'en'
      })

      router.push('/admin/media')

    } catch (error) {
      console.error('Error uploading media:', error)
      toast({
        title: "Error",
        description: "Failed to upload media. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
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
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Upload Media</h1>
              <p className="text-xl text-muted-foreground">
                Add new media files to the library
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/admin/media')}>
              Back to Media Library
            </Button>
          </div>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Media Information</CardTitle>
            <CardDescription>
              Upload and configure your media files
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
                      onClick={() => {
                        handleFormChange('content_type', type.value)
                        setForm(prev => ({ ...prev, files: [] })) // Clear files when changing type
                      }}
                    >
                      <Icon className="h-6 w-6" />
                      <span>{type.label}</span>
                      <span className="text-xs opacity-75">Max {type.maxSize}MB</span>
                    </Button>
                  )
                })}
              </div>
            </div>

            {/* File Upload */}
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                {form.content_type === 'video' ? 'Video Files' : 
                 form.content_type === 'image' ? 'Image Files' : 'Document Files'} *
              </label>
              
              {form.files.length === 0 ? (
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
                    Drop your files here or click to browse
                  </p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Supports {CONTENT_TYPES.find(t => t.value === form.content_type)?.accept} files
                    <br />
                    Maximum size: {CONTENT_TYPES.find(t => t.value === form.content_type)?.maxSize}MB per file
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose Files
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept={CONTENT_TYPES.find(t => t.value === form.content_type)?.accept}
                    onChange={(e) => handleFileSelect(e.target.files)}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {form.files.map((file, index) => (
                    <div key={index} className="border rounded-lg p-4 bg-muted/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {(() => {
                            const Icon = CONTENT_TYPES.find(t => t.value === form.content_type)?.icon || FileText
                            return <Icon className="h-8 w-8 text-blue-500" />
                          })()}
                          <div>
                            <p className="font-medium">{file.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add More Files
                  </Button>
                </div>
              )}
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  placeholder="Enter media title"
                  value={form.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe your media content..."
                  value={form.description}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={form.category}
                  onChange={(e) => handleFormChange('category', e.target.value)}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map(category => (
                    <option key={category} value={category}>{category}</option>
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
                  {LANGUAGES.map(lang => (
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                <Input
                  placeholder="historical, education, art, culture"
                  value={form.tags}
                  onChange={(e) => handleFormChange('tags', e.target.value)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/media')}
                disabled={uploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={uploading || !form.title || !form.description || form.files.length === 0}
                className="min-w-[120px]"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Uploading...
                  </>
                ) : (
                  `Upload ${form.files.length} File${form.files.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
