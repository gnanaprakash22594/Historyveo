"use client"

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navigation from '@/components/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { Image as ImageIcon, Upload, Trash2 } from 'lucide-react'

export default function FeaturedAdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [items, setItems] = useState<any[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const raw = typeof window !== 'undefined' ? localStorage.getItem('featuredItems') : null
    if (raw) {
      try { setItems(JSON.parse(raw)) } catch {}
    }
    const check = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setLoading(false)
          router.push('/admin/login')
          return
        }
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        if (!profile || (profile as any).role !== 'admin') {
          setLoading(false)
          router.push('/admin/login')
          return
        }
        setUser(profile)
      } catch (e) {
        // ignore
      } finally {
        setLoading(false)
      }
    }
    check()
  }, [router])

  const uploadThumb = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const path = `featured/${name}`
    const { error } = await supabase.storage.from('media').upload(path, file)
    if (error) throw error
    return supabase.storage.from('media').getPublicUrl(path).data.publicUrl
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

  const handleSubmit = async () => {
    const id = parseYouTubeId(youtubeUrl)
    if (!id || !title || !description) {
      toast({ title: 'Missing info', description: 'Valid YouTube URL, title and description are required.', variant: 'destructive' })
      return
    }
    const item = {
      id: `${Date.now()}`,
      youtubeId: id,
      title,
      description,
      thumbnailUrl: thumbnailUrl || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    }
    const next = [item, ...items].slice(0, 12)
    setItems(next)
    if (typeof window !== 'undefined') localStorage.setItem('featuredItems', JSON.stringify(next))
    toast({ title: 'Featured item added (local only)' })
    setTitle('')
    setDescription('')
    setYoutubeUrl('')
    setThumbnailUrl(null)
  }

  const removeItem = (id: string) => {
    const next = items.filter((i) => i.id !== id)
    setItems(next)
    if (typeof window !== 'undefined') localStorage.setItem('featuredItems', JSON.stringify(next))
  }

  if (loading) {
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
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Featured Historical Content</h1>
            <p className="text-xl text-muted-foreground">Upload a video entry with thumbnail, title and short description</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/admin')}>Back to Dashboard</Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Add Featured Item</CardTitle>
            <CardDescription>Embed a YouTube video. No database writes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">YouTube URL *</label>
              <Input placeholder="https://www.youtube.com/watch?v=..." value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <Input placeholder="Enter title" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Short Description *</label>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Brief intro about the historical video"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-medium">Thumbnail Image (optional)</label>
              <div className="aspect-video w-full bg-muted rounded-lg overflow-hidden flex items-center justify-center">
                {thumbnailUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={thumbnailUrl} alt="thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-muted-foreground flex flex-col items-center">
                    <ImageIcon className="h-8 w-8 mb-2" />
                    No image selected — will use YouTube thumbnail
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  try {
                    const url = await uploadThumb(f)
                    setThumbnailUrl(url)
                  } catch (err: any) {
                    toast({ title: 'Upload failed', description: err.message, variant: 'destructive' })
                  } finally {
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }
                }} />
                <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" /> Upload Thumbnail
                </Button>
                {thumbnailUrl && (
                  <Button variant="outline" className="text-red-600" onClick={() => setThumbnailUrl(null)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Remove
                  </Button>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <Link href="/">
                <Button variant="ghost">Preview Homepage</Button>
              </Link>
              <Button onClick={handleSubmit} disabled={!title || !description || !youtubeUrl}>
                Add Featured
              </Button>
            </div>
          </CardContent>
        </Card>
        {items.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Current Featured (local)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {items.map((it) => (
                <Card key={it.id}>
                  <CardContent className="p-0">
                    <div className="aspect-video bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={it.thumbnailUrl} alt={it.title} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="font-semibold">{it.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">{it.description}</div>
                        </div>
                        <Button variant="outline" className="text-red-600" onClick={() => removeItem(it.id)}>Remove</Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
