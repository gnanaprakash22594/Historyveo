"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Play, 
  Image as ImageIcon, 
  FileText,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Plus
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { supabase } from '@/lib/supabase'
import Navigation from '@/components/navigation'

interface MediaItem {
  id: string
  title: string
  slug: string
  description: string
  content_type: 'video' | 'image' | 'document'
  thumbnail_url?: string
  media_url?: string
  youtube_url?: string
  status: 'processing' | 'ready' | 'failed'
  visibility: 'public' | 'unlisted' | 'private'
  era?: string
  topic?: string
  region?: string
  tags?: string[]
  language: string
  created_at: string
  created_by: string
  creator_name?: string
}

export default function MediaLibraryPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEra, setFilterEra] = useState('')
  const [filterTopic, setFilterTopic] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const ERA_OPTIONS = ['Ancient', 'Medieval', 'Renaissance', 'Early Modern', 'Modern', 'Contemporary']
  const TOPIC_OPTIONS = ['Civilization', 'War', 'Art & Science', 'Technology', 'Politics', 'Culture', 'Religion', 'Economics']
  const TYPE_OPTIONS = ['video', 'image', 'document']
  const STATUS_OPTIONS = ['processing', 'ready', 'failed']

  useEffect(() => {
    setMounted(true)
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
      await fetchMedia()
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/admin/login')
    } finally {
      setLoading(false)
    }
  }

  const fetchMedia = async () => {
    try {
      let query = supabase
        .from('videos')
        .select(`
          *,
          users!videos_created_by_fkey(full_name)
        `)
        .order('created_at', { ascending: false })

      // Apply filters
      if (filterEra) query = query.eq('era', filterEra)
      if (filterTopic) query = query.eq('topic', filterTopic)
      if (filterType) query = query.eq('content_type', filterType)
      if (filterStatus) query = query.eq('status', filterStatus)

      const { data, error } = await query

      if (error) throw error

      const mediaWithCreators = data?.map(item => ({
        ...item,
        creator_name: (item.users as any)?.full_name || 'Unknown'
      })) || []

      setMedia(mediaWithCreators)
    } catch (error) {
      console.error('Error fetching media:', error)
      toast({
        title: "Error",
        description: "Failed to fetch media items.",
        variant: "destructive",
      })
    }
  }

  const filteredMedia = media.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const toggleVisibility = async (itemId: string, currentVisibility: string) => {
    try {
      const newVisibility = currentVisibility === 'public' ? 'private' : 'public'
      
      const { error } = await supabase
        .from('videos')
        .update({ visibility: newVisibility })
        .eq('id', itemId)

      if (error) throw error

      setMedia(prev => prev.map(item => 
        item.id === itemId ? { ...item, visibility: newVisibility as any } : item
      ))

      toast({
        title: "Visibility updated",
        description: `Content is now ${newVisibility}.`,
      })
    } catch (error) {
      console.error('Error updating visibility:', error)
      toast({
        title: "Error",
        description: "Failed to update visibility.",
        variant: "destructive",
      })
    }
  }

  const deleteMedia = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', itemId)

      if (error) throw error

      setMedia(prev => prev.filter(item => item.id !== itemId))

      toast({
        title: "Content deleted",
        description: "The content has been removed from the platform.",
      })
    } catch (error) {
      console.error('Error deleting media:', error)
      toast({
        title: "Error",
        description: "Failed to delete content.",
        variant: "destructive",
      })
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video': return <Play className="h-6 w-6 text-blue-500" />
      case 'image': return <ImageIcon className="h-6 w-6 text-green-500" />
      case 'document': return <FileText className="h-6 w-6 text-orange-500" />
      default: return <FileText className="h-6 w-6 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ready': return 'text-green-600 bg-green-100'
      case 'processing': return 'text-yellow-600 bg-yellow-100'
      case 'failed': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
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
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-2">Media Library</h1>
              <p className="text-xl text-muted-foreground">
                Manage all uploaded content and media assets
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => router.push('/admin')}>
                Back to Dashboard
              </Button>
              <Link href="/admin/media/upload">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Upload Media
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Era Filter */}
              <div>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filterEra}
                  onChange={(e) => setFilterEra(e.target.value)}
                >
                  <option value="">All Eras</option>
                  {ERA_OPTIONS.map(era => (
                    <option key={era} value={era}>{era}</option>
                  ))}
                </select>
              </div>

              {/* Topic Filter */}
              <div>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filterTopic}
                  onChange={(e) => setFilterTopic(e.target.value)}
                >
                  <option value="">All Topics</option>
                  {TOPIC_OPTIONS.map(topic => (
                    <option key={topic} value={topic}>{topic}</option>
                  ))}
                </select>
              </div>

              {/* Type Filter */}
              <div>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <option value="">All Types</option>
                  {TYPE_OPTIONS.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Status</option>
                  {STATUS_OPTIONS.map(status => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* View Mode Toggle */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {filteredMedia.length} items found
          </p>
        </div>

        {/* Media Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredMedia.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Thumbnail */}
                  <div className="relative h-48 bg-muted flex items-center justify-center">
                    {item.thumbnail_url ? (
                      <img
                        src={item.thumbnail_url}
                        alt={item.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        {getContentIcon(item.content_type)}
                        <p className="text-sm mt-2">{item.content_type}</p>
                      </div>
                    )}
                    
                    {/* Status Badge */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                      {item.status}
                    </div>

                    {/* Visibility Badge */}
                    <div className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${
                      item.visibility === 'public' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                    }`}>
                      {item.visibility}
                    </div>
                  </div>

                  {/* Content Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {item.description}
                    </p>
                    
                    {/* Metadata */}
                    <div className="space-y-2 mb-4">
                      {item.era && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">Era:</span> {item.era}
                        </div>
                      )}
                      {item.topic && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">Topic:</span> {item.topic}
                        </div>
                      )}
                      {item.region && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="font-medium">Region:</span> {item.region}
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleVisibility(item.id, item.visibility)}
                        >
                          {item.visibility === 'public' ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                        <Link href={`/admin/media/edit/${item.id}`}>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMedia(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <div className="text-xs text-muted-foreground">
                        {new Date(item.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMedia.map((item) => (
              <Card key={item.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-24 h-24 bg-muted flex items-center justify-center rounded-lg flex-shrink-0">
                      {item.thumbnail_url ? (
                        <img
                          src={item.thumbnail_url}
                          alt={item.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          {getContentIcon(item.content_type)}
                        </div>
                      )}
                    </div>

                    {/* Content Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-lg">{item.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.description}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.visibility === 'public' ? 'text-green-600 bg-green-100' : 'text-yellow-600 bg-yellow-100'
                          }`}>
                            {item.visibility}
                          </span>
                        </div>
                      </div>

                      {/* Metadata */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                        {item.era && <span><strong>Era:</strong> {item.era}</span>}
                        {item.topic && <span><strong>Topic:</strong> {item.topic}</span>}
                        {item.region && <span><strong>Region:</strong> {item.region}</span>}
                        <span><strong>Type:</strong> {item.content_type}</span>
                        <span><strong>Language:</strong> {item.language.toUpperCase()}</span>
                        <span><strong>Created:</strong> {new Date(item.created_at).toLocaleDateString()}</span>
                        <span><strong>Creator:</strong> {item.creator_name}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleVisibility(item.id, item.visibility)}
                        >
                          {item.visibility === 'public' ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
                          {item.visibility === 'public' ? 'Make Private' : 'Make Public'}
                        </Button>
                        <Link href={`/admin/media/edit/${item.id}`}>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteMedia(item.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {filteredMedia.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground mb-4">
              {searchTerm || filterEra || filterTopic || filterType || filterStatus ? (
                <>
                  <p className="text-lg">No content found matching your filters.</p>
                  <p className="text-sm">Try adjusting your search criteria.</p>
                </>
              ) : (
                <>
                  <p className="text-lg">No media content yet.</p>
                  <p className="text-sm">Start by uploading some content.</p>
                </>
              )}
            </div>
            <Link href="/admin/media/upload">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Your First Content
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
