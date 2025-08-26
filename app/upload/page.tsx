"use client"

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Upload as UploadIcon, X, CheckCircle, AlertCircle, Play } from 'lucide-react'
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
}

const ERA_OPTIONS = ['Ancient', 'Medieval', 'Renaissance', 'Early Modern', 'Modern', 'Contemporary']
const TOPIC_OPTIONS = ['Civilization', 'War', 'Art & Science', 'Technology', 'Politics', 'Culture', 'Religion', 'Economics']
const REGION_OPTIONS = ['Global', 'Europe', 'Asia', 'Africa', 'Americas', 'Middle East', 'Oceania']
const LANGUAGE_OPTIONS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko']

export default function UploadPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [series, setSeries] = useState<any[]>([])

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
  })

  useEffect(() => {
    checkUser()
    fetchSeries()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/auth/signin')
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || (profile as any).role !== 'admin' && (profile as any).role !== 'moderator') {
      toast({
        title: "Access denied",
        description: "You don't have permission to upload videos.",
        variant: "destructive",
      })
      router.push('/')
      return
    }

    setUser(profile)
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

  const handleSubmit = async () => {
    if (!user || !form.title || !form.description) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      // For now, just create a placeholder video record
      // You can integrate YouTube API later
      const { error: videoError } = await supabase
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
          status: 'draft', // Will be updated when YouTube integration is added
          series_id: form.series_id || null,
          episode_number: form.episode_number || null,
          created_by: user.id,
          youtube_url: form.youtube_url || null,
        } as any)

      if (videoError) {
        throw videoError
      }

      toast({
        title: "Video created successfully!",
        description: "YouTube integration will be added soon.",
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
      })

      router.push('/explore')

    } catch (error) {
      console.error('Error creating video:', error)
      toast({
        title: "Error",
        description: "Failed to create video. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Upload Historical Video
          </h1>
          <p className="text-xl text-muted-foreground">
            Share historical content with the world
          </p>
        </div>

        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle>Video Information</CardTitle>
            <CardDescription>
              Fill in the details for your historical video
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Title *</label>
                <Input
                  placeholder="Enter video title"
                  value={form.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description *</label>
                <textarea
                  className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe your video content..."
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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">YouTube URL (Coming Soon)</label>
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={form.youtube_url}
                  onChange={(e) => handleFormChange('youtube_url', e.target.value)}
                  disabled
                />
                <p className="text-sm text-muted-foreground mt-1">
                  YouTube integration will be added after deployment
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push('/explore')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={loading || !form.title || !form.description}
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  'Create Video'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
