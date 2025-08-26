"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Card, CardContent } from '@/components/ui/card'

interface FeaturedItem {
  id: string
  title: string
  description: string | null
  thumbnail_url: string | null
  // href: if it starts with http(s) we open YouTube, otherwise internal link
  href: string
  duration?: number | null
}

export default function FeaturedContent() {
  const [items, setItems] = useState<FeaturedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        // Read local featured items (YouTube embeds)
        let local: FeaturedItem[] = []
        if (typeof window !== 'undefined') {
          const raw = localStorage.getItem('featuredItems')
          if (raw) {
            try {
              const parsed = JSON.parse(raw) as Array<{ id: string; youtubeId: string; title: string; description: string; thumbnailUrl?: string }>
              local = parsed.map((i) => ({
                id: `local-${i.id}`,
                title: i.title,
                description: i.description,
                thumbnail_url: i.thumbnailUrl || `https://i.ytimg.com/vi/${i.youtubeId}/hqdefault.jpg`,
                href: `https://www.youtube.com/watch?v=${i.youtubeId}`,
              }))
            } catch {}
          }
        }

        // Fetch from Supabase as fallback/content mix
        const { data } = await supabase
          .from('videos')
          .select('id, slug, title, description, thumbnail_url, duration')
          .eq('status', 'ready')
          .eq('visibility', 'public')
          .order('created_at', { ascending: false })
          .limit(6)

        const remote: FeaturedItem[] = (data || []).map((v: any) => ({
          id: v.id,
          title: v.title,
          description: v.description,
          thumbnail_url: v.thumbnail_url,
          href: `/video/${v.slug}`,
          duration: v.duration,
        }))

        const combined = [...local, ...remote].slice(0, 6)
        setItems(combined)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return null
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m${s ? ` ${s}s` : ''}`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-64 rounded-lg bg-slate-700/60 animate-pulse" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-gray-400">
        No featured content yet. Upload videos from the admin dashboard.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {items.map((v) => {
        const isExternal = v.href.startsWith('http')
        const inner = (
          <Card className="video-card bg-slate-700 border-slate-600 hover:border-red-500 transition-all duration-300 transform hover:scale-105 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative h-48">
                {v.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-500 flex items-center justify-center text-white/70">
                    No thumbnail
                  </div>
                )}
                {v.duration != null && (
                  <div className="absolute bottom-2 right-2 text-xs px-2 py-1 rounded bg-black/60 text-white">
                    {formatDuration(v.duration)}
                  </div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-semibold text-white mb-2 line-clamp-1">{v.title}</h3>
                <p className="text-gray-400 text-sm line-clamp-2 min-h-[2.5rem]">
                  {v.description || 'No description available.'}
                </p>
              </div>
            </CardContent>
          </Card>
        )

        return isExternal ? (
          <a key={v.id} href={v.href} target="_blank" rel="noopener noreferrer">
            {inner}
          </a>
        ) : (
          <Link key={v.id} href={v.href}>
            {inner}
          </Link>
        )
      })}
    </div>
  )
}
