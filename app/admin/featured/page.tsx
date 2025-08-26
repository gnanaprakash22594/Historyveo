"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navigation from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Image as ImageIcon, Upload, Trash2, ArrowLeft, Plus, Play } from 'lucide-react'

interface FeaturedItem {
  id: string
  title: string
  description: string
  youtubeUrl: string
  thumbnailUrl: string
  createdAt: number
}

export default function FeaturedAdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [items, setItems] = useState<FeaturedItem[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
    loadFeaturedItems()
    
    // Simple timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.log('Featured page timeout reached, setting loading to false')
      setLoading(false)
    }, 3000) // 3 second timeout
    
    const checkUser = async () => {
      try {
        console.log('Featured page: Quick auth check starting...')
        const { data: { user } } = await supabase.auth.getUser()
        console.log('Featured page: Quick auth result:', user ? 'User found' : 'No user')
        
        if (!user) {
          console.log('Featured page: No user, redirecting to login')
          window.location.href = '/admin/login'
          return
        }
        
        // Skip complex role checking for now
        console.log('Featured page: User found, proceeding to dashboard')
        setLoading(false)
      } catch (e) {
        console.error('Featured page: Quick auth error:', e)
        setLoading(false)
      }
    }
    
    checkUser()
    
    return () => clearTimeout(timeoutId)
  }, [])

  const loadFeaturedItems = async () => {
    try {
      console.log('Loading featured items from database...')
      
      const { data: dbVideos, error: dbError } = await supabase
        .from('videos')
        .select('*')
        .eq('visibility', 'public')
        .eq('status', 'ready')
        .not('youtube_video_id', 'is', null)
        .order('created_at', { ascending: false })

      if (dbError) {
        console.error('Error fetching from database:', dbError)
        toast({ 
          title: 'Error loading content', 
          description: 'Could not fetch featured content from database.', 
          variant: 'destructive' 
        })
        setItems([])
        return
      }

      // Convert database videos to FeaturedItem format
      const dbFormattedItems: FeaturedItem[] = (dbVideos || []).map(video => ({
        id: video.id || `db-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: video.title || 'Untitled',
        description: video.description || 'No description',
        youtubeUrl: `https://www.youtube.com/watch?v=${video.youtube_video_id}`,
        thumbnailUrl: video.thumbnail_url || video.youtube_thumbnail_url || '',
        createdAt: new Date(video.created_at || Date.now()).getTime()
      } as any))

      console.log('Loaded database items:', dbFormattedItems.length)
      setItems(dbFormattedItems)
      
    } catch (error) {
      console.error('Error loading featured items:', error)
      toast({ 
        title: 'Error loading content', 
        description: 'Failed to load featured content.', 
        variant: 'destructive' 
      })
      setItems([])
    }
  }

  const uploadThumbnail = async (file: File) => {
    console.log('uploadThumbnail called with file:', file.name)
    
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const name = `featured-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const path = `featured/${name}`
      
      console.log('Uploading to path:', path)
      
      const { error } = await supabase.storage.from('media').upload(path, file)
      if (error) {
        console.error('Supabase upload error:', error)
        throw error
      }
      
      console.log('File uploaded successfully, getting public URL')
      const publicUrl = supabase.storage.from('media').getPublicUrl(path).data.publicUrl
      console.log('Public URL:', publicUrl)
      
      return publicUrl
    } catch (error) {
      console.error('Error in uploadThumbnail:', error)
      throw error
    }
  }

  const parseYouTubeId = (input: string): string | null => {
    const val = (input || '').trim()
    if (!val) return null
    
    // If user pasted bare ID (11 chars typical)
    const idLike = /^[a-zA-Z0-9_-]{10,}$/
    if (idLike.test(val) && !val.includes('http')) return val

    // Ensure URL has protocol for URL parsing
    const ensureUrl = (s: string) => (s.startsWith('http://') || s.startsWith('https://') ? s : `https://${s}`)
    
    try {
      const u = new URL(ensureUrl(val))
      const host = u.hostname.replace('www.', '')
      
      // youtu.be/<id>
      if (host === 'youtu.be') {
        const p = u.pathname.replace(/^\//, '')
        return p ? p.split('/')[0] : null
      }
      
      // youtube.com or m.youtube.com
      if (host.endsWith('youtube.com')) {
        // Shorts: /shorts/<id>
        if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/shorts/')[1]?.split('/')[0] || null
        // Embed: /embed/<id>
        if (u.pathname.startsWith('/embed/')) return u.pathname.split('/embed/')[1]?.split('/')[0] || null
        // Watch: ?v=<id>
        if (u.searchParams.get('v')) return u.searchParams.get('v')
      }
      
      // Fallback regex from common patterns
      const m = val.match(/(?:v=|vi=|v\/|vi\/|embed\/|shorts\/|youtu\.be\/)([a-zA-Z0-9_-]{10,})/)
      return m ? m[1] : null
    } catch {
      // Final fallback: strip spaces and try regex directly
      const m = val.match(/([a-zA-Z0-9_-]{10,})/)
      return m ? m[1] : null
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!title.trim() || !description.trim() || !youtubeUrl.trim()) {
      toast({ title: 'Missing information', description: 'Please fill in all fields.', variant: 'destructive' })
      return
    }

    const youtubeId = parseYouTubeId(youtubeUrl)
    if (!youtubeId) {
      toast({ title: 'Invalid YouTube URL', description: 'Please enter a valid YouTube video URL.', variant: 'destructive' })
      return
    }

    if (!thumbnailUrl) {
      toast({ title: 'Missing thumbnail', description: 'Please upload a thumbnail image.', variant: 'destructive' })
      return
    }

    setSaving(true)
    try {
      const newItem: FeaturedItem = {
        id: `featured-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        youtubeUrl: `https://www.youtube.com/watch?v=${youtubeId}`,
        thumbnailUrl,
        createdAt: Date.now()
      }

      // Save to Supabase database for cross-device access
      try {
        console.log('Saving to Supabase database...')
        const { data: dbVideo, error: dbError } = await supabase
          .from('videos')
          .insert({
            title: newItem.title,
            slug: `featured-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            description: newItem.description,
            youtube_video_id: youtubeId,
            thumbnail_url: newItem.thumbnailUrl,
            status: 'ready',
            visibility: 'public',
            language: 'en',
            created_at: new Date(newItem.createdAt).toISOString()
          } as any)
          .select()
          .single()

        if (dbError) {
          console.error('Database save error:', dbError)
          toast({ 
            title: 'Failed to save', 
            description: 'Could not save content to database. Please try again.', 
            variant: 'destructive' 
          })
          return
        }

        console.log('Saved to database successfully:', dbVideo)
        
        // Reset form
        setTitle('')
        setDescription('')
        setYoutubeUrl('')
        setThumbnailUrl(null)
        
        // Reload items from database to show the new content
        await loadFeaturedItems()
        
        toast({ 
          title: 'Success!', 
          description: 'Content saved and will be available on all devices.' 
        })
        
        console.log('Featured content added:', newItem)
      } catch (dbError) {
        console.error('Error saving to database:', dbError)
        toast({ 
          title: 'Failed to save', 
          description: 'An error occurred while saving content.', 
          variant: 'destructive' 
        })
      }
    } catch (error) {
      console.error('Error adding featured content:', error)
      toast({ title: 'Failed to add featured content', description: 'Please try again.', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleThumbnailUpload = async (file: File) => {
    console.log('Starting thumbnail upload for file:', file.name, 'Size:', file.size)
    
    if (!file) {
      console.error('No file provided for upload')
      toast({ title: 'No file selected', description: 'Please select an image file.', variant: 'destructive' })
      return
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('Invalid file type:', file.type)
      toast({ title: 'Invalid file type', description: 'Please select an image file (JPG, PNG, etc.).', variant: 'destructive' })
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      console.error('File too large:', file.size)
      toast({ title: 'File too large', description: 'Please select an image smaller than 5MB.', variant: 'destructive' })
      return
    }

    try {
      console.log('Uploading thumbnail to Supabase...')
      const url = await uploadThumbnail(file)
      console.log('Thumbnail upload successful:', url)
      setThumbnailUrl(url)
      toast({ title: 'Thumbnail uploaded successfully!' })
    } catch (error: any) {
      console.error('Thumbnail upload failed:', error)
      toast({ 
        title: 'Thumbnail upload failed', 
        description: error.message || 'Please try again with a different image.', 
        variant: 'destructive' 
      })
    }
  }

  const removeItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this featured content?')) {
      return
    }

    try {
      console.log('Removing item:', id)
      
      // Try to delete from database if it's a database item
      if (id.startsWith('db-') || !id.startsWith('featured-')) {
        try {
          console.log('Attempting to delete from database...')
          const { error: dbError } = await supabase
            .from('videos')
            .delete()
            .eq('id', id)

          if (dbError) {
            console.error('Database delete error:', dbError)
            // Continue with local removal even if database delete fails
          } else {
            console.log('Successfully deleted from database')
          }
        } catch (dbError) {
          console.error('Error deleting from database:', dbError)
          // Continue with local removal even if database delete fails
        }
      }

      // Remove from local state
      const updatedItems = items.filter(item => item.id !== id)
      setItems(updatedItems)
      
      // Try to delete thumbnail from storage if it exists
      const itemToRemove = items.find(item => item.id === id)
      if (itemToRemove?.thumbnailUrl) {
        try {
          console.log('Attempting to delete thumbnail from storage...')
          // Extract the file path from the public URL
          const urlParts = itemToRemove.thumbnailUrl.split('/')
          const fileName = urlParts[urlParts.length - 1]
          const filePath = `featured/${fileName}`
          
          console.log('Deleting file from storage:', filePath)
          const { error: storageError } = await supabase.storage
            .from('media')
            .remove([filePath])

          if (storageError) {
            console.error('Storage delete error:', storageError)
          } else {
            console.log('Successfully deleted thumbnail from storage')
          }
        } catch (storageError) {
          console.error('Error deleting from storage:', storageError)
        }
      }

      toast({ title: 'Featured content removed successfully!' })
      console.log('Item removed successfully:', id)
      
    } catch (error) {
      console.error('Error removing item:', error)
      toast({ 
        title: 'Failed to remove content', 
        description: 'Please try again.', 
        variant: 'destructive' 
      })
    }
  }

  const importExistingContent = async () => {
    try {
      console.log('Importing existing content from database...')
      
      // Simply reload all items from database
      await loadFeaturedItems()
      
      toast({ 
        title: 'Import completed', 
        description: 'All existing content loaded from database.' 
      })
      
    } catch (error) {
      console.error('Error importing existing content:', error)
      toast({ 
        title: 'Import failed', 
        description: 'An error occurred while importing content.', 
        variant: 'destructive' 
      })
    }
  }

  const removeAllContent = async () => {
    if (!confirm('Are you sure you want to remove ALL featured content? This action cannot be undone and will delete all content from the database.')) {
      return
    }

    try {
      console.log('Removing all featured content...')
      
      // Delete all featured videos from database
      const { error: dbError } = await supabase
        .from('videos')
        .delete()
        .eq('visibility', 'public')
        .eq('status', 'ready')
        .not('youtube_video_id', 'is', null)

      if (dbError) {
        console.error('Database delete error:', dbError)
        toast({ 
          title: 'Error removing content', 
          description: 'Could not remove all content from database.', 
          variant: 'destructive' 
        })
        return
      }

      // Clear local state
      setItems([])
      
      toast({ 
        title: 'All content removed!', 
        description: 'All featured content has been deleted from the database.' 
      })
      
      console.log('All featured content removed successfully')
      
    } catch (error) {
      console.error('Error removing all content:', error)
      toast({ 
        title: 'Error removing content', 
        description: 'An error occurred while removing content.', 
        variant: 'destructive' 
      })
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
            <div className="text-center">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
              <p>Loading featured content...</p>
              <p className="text-sm text-muted-foreground mt-2">This will timeout in 3 seconds</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Always render content - authentication is handled by redirects
  console.log('Rendering featured content page, user:', user)

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="outline" onClick={() => router.push('/admin')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div className="flex-1">
              <h1 className="text-3xl font-bold">Featured Content Management</h1>
              <p className="text-muted-foreground">Add YouTube videos to showcase on your homepage</p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={importExistingContent}
                className="whitespace-nowrap"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Existing
              </Button>
              {items.length > 0 && (
                <Button 
                  variant="destructive" 
                  onClick={removeAllContent}
                  className="whitespace-nowrap"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove All
                </Button>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Add New Featured Content */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New Featured Content
                </CardTitle>
                <CardDescription>
                  Add a YouTube video with custom thumbnail and description
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Title</label>
                    <Input
                      placeholder="Enter video title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Description</label>
                    <Input
                      placeholder="Enter video description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">YouTube URL</label>
                    <Input
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Thumbnail Image</label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleThumbnailUpload(file)
                        }
                      }}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {thumbnailUrl ? 'Change Thumbnail' : 'Upload Thumbnail'}
                    </Button>
                    {thumbnailUrl && (
                      <div className="mt-2">
                        <img 
                          src={thumbnailUrl} 
                          alt="Thumbnail preview" 
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                  </div>

                  <Button type="submit" className="w-full" disabled={saving || !title || !description || !youtubeUrl || !thumbnailUrl}>
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Featured Content
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Current Featured Items */}
            <Card>
              <CardHeader>
                <CardTitle>Current Featured Content</CardTitle>
                <CardDescription>
                  {items.length === 0 ? 'No featured content yet' : `${items.length} featured items`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No featured content added yet</p>
                    <p className="text-sm">Add your first featured video above</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {items.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <div className="w-20 h-16 flex-shrink-0 bg-muted rounded-lg overflow-hidden">
                            <img 
                              src={item.thumbnailUrl} 
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                console.error('Failed to load thumbnail:', item.thumbnailUrl)
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA4MCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjY0IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0yMCAyMEg2MFY0NEgyMFYyMFoiIGZpbGw9IiNFNUU3RUIiLz4KPHBhdGggZD0iTTI4IDI4SDUyVjM2SDI4VjI4WiIgZmlsbD0iI0M3Q0QwQyIvPgo8L3N2Zz4K'
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-sm truncate">{item.title}</h3>
                            <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  console.log('Opening YouTube URL:', item.youtubeUrl)
                                  window.open(item.youtubeUrl, '_blank')
                                }}
                              >
                                <Play className="h-3 w-3 mr-1" />
                                Watch
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeItem(item.id)}
                              >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                <p>• Add YouTube videos with custom titles, descriptions, and thumbnails</p>
                <p>• Featured content will appear on your homepage</p>
                <p>• Thumbnails are stored in Supabase storage</p>
                <p>• Featured items are stored locally for fast loading</p>
                <p>• You can remove items at any time</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
