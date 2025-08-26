"use client"

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Play, Clock, Eye, Heart, MessageCircle, Share2, BookOpen, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navigation from '@/components/navigation'
import { supabase } from '@/lib/supabase'
import { formatDuration, formatDate, formatRelativeTime } from '@/lib/utils'
// YouTube player will be integrated after deployment

interface Video {
  id: string
  title: string
  slug: string
  description: string | null
  duration: number | null
  thumbnail_url: string | null
  era: string | null
  topic: string | null
  region: string | null
  tags: string[] | null
  language: string
  transcript: string | null
  subtitles_url: string | null
  series_id: string | null
  episode_number: number | null
  created_at: string
  youtube_url: string | null
  visibility: 'public' | 'unlisted' | 'private'
  status: 'processing' | 'ready' | 'failed'
}

interface Series {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
}

interface RelatedVideo {
  id: string
  title: string
  slug: string
  description: string | null
  duration: number | null
  thumbnail_url: string | null
  era: string | null
  topic: string | null
  created_at: string
}

export default function VideoPage() {
  const params = useParams()
  const [video, setVideo] = useState<Video | null>(null)
  const [series, setSeries] = useState<Series | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<RelatedVideo[]>([])
  const [loading, setLoading] = useState(true)
  const [isLiked, setIsLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [viewCount, setViewCount] = useState(0)

  useEffect(() => {
    if (params.slug) {
      fetchVideo()
    }
  }, [params.slug])

  const fetchVideo = async () => {
    try {
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('slug', params.slug)
        .eq('status', 'ready')
        .single()

      if (videoError) {
        console.error('Error fetching video:', videoError)
        return
      }

      setVideo(videoData)

      // Fetch series info if video is part of a series
      if (videoData.series_id) {
        const { data: seriesData } = await supabase
          .from('series')
          .select('*')
          .eq('id', videoData.series_id)
          .single()
        
        if (seriesData) {
          setSeries(seriesData)
        }
      }

      // Fetch related videos
      const { data: relatedData } = await supabase
        .from('videos')
        .select('id, title, slug, description, duration, thumbnail_url, era, topic, created_at')
        .eq('status', 'ready')
        .eq('visibility', 'public')
        .neq('id', videoData.id)
        .or(`era.eq.${videoData.era},topic.eq.${videoData.topic}`)
        .order('created_at', { ascending: false })
        .limit(6)

      if (relatedData) {
        setRelatedVideos(relatedData)
      }

      // Fetch video stats
      fetchVideoStats(videoData.id)
      
      // Check if user has liked the video
      checkUserLike(videoData.id)

    } catch (error) {
      console.error('Error fetching video:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVideoStats = async (videoId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('get_video_stats', { video_uuid: videoId })

      if (!error && data && data.length > 0) {
        const stats = data[0]
        setViewCount(stats.view_count || 0)
        setLikeCount(stats.like_count || 0)
      }
    } catch (error) {
      console.error('Error fetching video stats:', error)
    }
  }

  const checkUserLike = async (videoId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('video_likes')
          .select('id')
          .eq('video_id', videoId)
          .eq('user_id', user.id)
          .single()

        setIsLiked(!!data)
      }
    } catch (error) {
      // User not logged in or error checking like
    }
  }

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        // Redirect to sign in
        return
      }

      if (isLiked) {
        // Unlike
        await supabase
          .from('video_likes')
          .delete()
          .eq('video_id', video!.id)
          .eq('user_id', user.id)
        
        setIsLiked(false)
        setLikeCount(prev => prev - 1)
      } else {
        // Like
        await supabase
          .from('video_likes')
          .insert({
            video_id: video!.id,
            user_id: user.id,
          })
        
        setIsLiked(true)
        setLikeCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: video?.title,
          text: video?.description || '',
          url: window.location.href,
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="aspect-video bg-muted rounded-lg" />
            <div className="h-8 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
        </div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Video not found</h1>
          <p className="text-muted-foreground mb-6">
            The video you're looking for doesn't exist or has been removed.
          </p>
          <Link href="/explore">
            <Button>Browse Videos</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/explore">
            <Button variant="ghost" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Explore
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Player */}
            <div className="bg-black rounded-lg overflow-hidden">
              <div className="aspect-video bg-muted flex items-center justify-center">
                <div className="text-muted-foreground text-center">
                  <Play className="h-16 w-16 mx-auto mb-4" />
                  <p>YouTube integration coming soon!</p>
                  <p className="text-sm mt-2">Video playback will be enabled after deployment</p>
                </div>
              </div>
            </div>

            {/* Video Info */}
            <div className="space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold mb-2">{video.title}</h1>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {video.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {formatDuration(video.duration)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {viewCount} views
                    </span>
                    <span>{formatDate(video.created_at)}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant={isLiked ? "default" : "outline"}
                    size="sm"
                    onClick={handleLike}
                  >
                    <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                    <span className="ml-2">{likeCount}</span>
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-2">
                {video.era && (
                  <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
                    {video.era}
                  </span>
                )}
                {video.topic && (
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full text-sm">
                    {video.topic}
                  </span>
                )}
                {video.region && (
                  <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-sm">
                    {video.region}
                  </span>
                )}
                {video.tags?.map((tag) => (
                  <span key={tag} className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-full text-sm">
                    {tag}
                  </span>
                ))}
              </div>

              {/* Description */}
              {video.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {video.description}
                  </p>
                </div>
              )}

              {/* Series Info */}
              {series && (
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div>
                      <h3 className="font-semibold">Part of Series: {series.title}</h3>
                      {video.episode_number && (
                        <p className="text-sm text-muted-foreground">
                          Episode {video.episode_number}
                        </p>
                      )}
                    </div>
                    <Link href={`/series/${series.slug}`} className="ml-auto">
                      <Button variant="outline" size="sm">
                        View Series
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Related Videos */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Related Videos</h3>
              <div className="space-y-3">
                {relatedVideos.map((relatedVideo) => (
                  <Link key={relatedVideo.id} href={`/video/${relatedVideo.slug}`}>
                    <Card className="hover:shadow-md transition-shadow cursor-pointer">
                      <div className="flex gap-3">
                        <img
                          src={relatedVideo.thumbnail_url || '/placeholder-thumbnail.jpg'}
                          alt={relatedVideo.title}
                          className="w-24 h-16 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2 mb-1">
                            {relatedVideo.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {relatedVideo.duration && (
                              <span>{formatDuration(relatedVideo.duration)}</span>
                            )}
                            <span>{formatRelativeTime(relatedVideo.created_at)}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
