"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search, Filter, Grid, List, Play, Clock, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navigation from '@/components/navigation'
import { supabase } from '@/lib/supabase'
import { formatDuration, formatRelativeTime } from '@/lib/utils'

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
  created_at: string
  youtube_url: string | null
}

interface FilterOption {
  value: string
  label: string
  count: number
}

function ExplorePageContent() {
  const searchParams = useSearchParams()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState({
    era: '',
    topic: '',
    region: '',
  })
  const [filterOptions, setFilterOptions] = useState({
    eras: [] as FilterOption[],
    topics: [] as FilterOption[],
    regions: [] as FilterOption[],
  })

  useEffect(() => {
    fetchVideos()
    fetchFilterOptions()
  }, [searchQuery, filters])

  const fetchVideos = async () => {
    setLoading(true)
    
    try {
      let query = supabase
        .from('videos')
        .select('*')
        .eq('status', 'ready')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })

      // Apply search
      if (searchQuery.trim()) {
        query = query.textSearch('title,description,tags', searchQuery.trim())
      }

      // Apply filters
      if (filters.era) {
        query = query.eq('era', filters.era)
      }
      if (filters.topic) {
        query = query.eq('topic', filters.topic)
      }
      if (filters.region) {
        query = query.eq('region', filters.region)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching videos:', error)
        return
      }

      setVideos(data || [])
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFilterOptions = async () => {
    try {
      const { data: videos } = await supabase
        .from('videos')
        .select('era, topic, region')
        .eq('status', 'ready')
        .eq('visibility', 'public')

      if (videos) {
        const eras = videos.reduce((acc: any, video: any) => {
          if (video.era) {
            acc[video.era] = (acc[video.era] || 0) + 1
          }
          return acc
        }, {})

        const topics = videos.reduce((acc: any, video: any) => {
          if (video.topic) {
            acc[video.topic] = (acc[video.topic] || 0) + 1
          }
          return acc
        }, {})

        const regions = videos.reduce((acc: any, video: any) => {
          if (video.region) {
            acc[video.region] = (acc[video.region] || 0) + 1
          }
          return acc
        }, {})

        setFilterOptions({
          eras: Object.entries(eras).map(([value, count]) => ({ value, label: value, count: count as number })),
          topics: Object.entries(topics).map(([value, count]) => ({ value, label: value, count: count as number })),
          regions: Object.entries(regions).map(([value, count]) => ({ value, label: value, count: count as number })),
        })
      }
    } catch (error) {
      console.error('Error fetching filter options:', error)
    }
  }

  const handleFilterChange = (filterType: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType] === value ? '' : value
    }))
  }

  const clearFilters = () => {
    setFilters({ era: '', topic: '', region: '' })
  }

  const hasActiveFilters = Object.values(filters).some(filter => filter !== '')

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            Explore Historical Content
          </h1>
          <p className="text-xl text-muted-foreground">
            Discover fascinating stories from throughout history
          </p>
        </div>

        {/* Search and Controls */}
        <div className="mb-8 space-y-4">
          {/* Search Bar */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search videos, series, topics, or historical figures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 px-2 py-1 bg-primary text-primary-foreground text-xs rounded-full">
                    {Object.values(filters).filter(f => f !== '').length}
                  </span>
                )}
              </Button>
              
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Clear all
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="mb-8 p-6 bg-muted/30 rounded-lg">
            <div className="grid md:grid-cols-3 gap-6">
              {/* Era Filter */}
              <div>
                <h3 className="font-semibold mb-3">Era</h3>
                <div className="space-y-2">
                  {filterOptions.eras.map((era) => (
                    <label key={era.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="era"
                        value={era.value}
                        checked={filters.era === era.value}
                        onChange={() => handleFilterChange('era', era.value)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {era.label} ({era.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Topic Filter */}
              <div>
                <h3 className="font-semibold mb-3">Topic</h3>
                <div className="space-y-2">
                  {filterOptions.topics.map((topic) => (
                    <label key={topic.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="topic"
                        value={topic.value}
                        checked={filters.topic === topic.value}
                        onChange={() => handleFilterChange('topic', topic.value)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {topic.label} ({topic.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Region Filter */}
              <div>
                <h3 className="font-semibold mb-3">Region</h3>
                <div className="space-y-2">
                  {filterOptions.regions.map((region) => (
                    <label key={region.value} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="radio"
                        name="region"
                        value={region.value}
                        checked={filters.region === region.value}
                        onChange={() => handleFilterChange('region', region.value)}
                        className="rounded"
                      />
                      <span className="text-sm">
                        {region.label} ({region.count})
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mb-4">
          <p className="text-muted-foreground">
            {loading ? 'Loading...' : `${videos.length} video${videos.length !== 1 ? 's' : ''} found`}
          </p>
        </div>

        {/* Video Grid/List */}
        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="aspect-video bg-muted rounded-t-lg" />
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No videos found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or filters to find more content.
            </p>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
            {videos.map((video) => (
              <Card key={video.id} className={`video-card overflow-hidden ${viewMode === 'list' ? 'flex' : ''}`}>
                <div className={`relative ${viewMode === 'list' ? 'w-48 flex-shrink-0' : ''}`}>
                  <img
                    src={video.thumbnail_url || '/placeholder-thumbnail.jpg'}
                    alt={video.title}
                    className={`${viewMode === 'list' ? 'h-32 w-48' : 'aspect-video'} w-full object-cover rounded-t-lg`}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button size="sm" className="bg-white text-black hover:bg-gray-100">
                      <Play className="mr-2 h-4 w-4" />
                      Watch
                    </Button>
                  </div>
                  {video.duration && (
                    <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                      {formatDuration(video.duration)}
                    </div>
                  )}
                </div>
                
                <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <CardHeader className={viewMode === 'list' ? 'pb-2' : ''}>
                    <CardTitle className="text-lg line-clamp-2">
                      <a href={`/video/${video.slug}`} className="hover:text-primary transition-colors">
                        {video.title}
                      </a>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {video.description}
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent className={viewMode === 'list' ? 'pt-0' : ''}>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        {video.era && (
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                            {video.era}
                          </span>
                        )}
                        {video.topic && (
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                            {video.topic}
                          </span>
                        )}
                      </div>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(video.created_at)}
                      </span>
                    </div>
                  </CardContent>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ExplorePageContent />
    </Suspense>
  )
}
