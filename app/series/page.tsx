"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { BookOpen, Play, Clock, Users, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Navigation from '@/components/navigation'
import { supabase } from '@/lib/supabase'
import { formatRelativeTime } from '@/lib/utils'

interface Series {
  id: string
  title: string
  slug: string
  description: string | null
  thumbnail_url: string | null
  era: string | null
  topic: string | null
  region: string | null
  tags: string[] | null
  is_featured: boolean
  created_at: string
  episode_count?: number
}

export default function SeriesPage() {
  const [series, setSeries] = useState<Series[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchSeries()
  }, [])

  const fetchSeries = async () => {
    try {
      const { data, error } = await supabase
        .from('series')
        .select(`
          *,
          episodes:episodes(count)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching series:', error)
        return
      }

      // Transform data to include episode count
      const seriesWithCounts = (data || []).map((series: any) => ({
        ...series,
        episode_count: series.episodes?.[0]?.count || 0
      }))

      setSeries(seriesWithCounts)
    } catch (error) {
      console.error('Error fetching series:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSeries = filter === 'all' 
    ? series 
    : series.filter(s => s.is_featured)

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50, rotateX: -15 },
    visible: {
      opacity: 1,
      y: 0,
      rotateX: 0,
      transition: {
        duration: 0.6
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-12 bg-muted rounded w-1/3" />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <div className="aspect-video bg-muted rounded-lg" />
                  <div className="h-6 bg-muted rounded w-3/4" />
                  <div className="h-4 bg-muted rounded w-1/2" />
                </div>
              ))}
            </div>
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
        <motion.div 
          className="mb-12 text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Historical <span className="gradient-text">Series</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Dive deep into specific historical periods and topics with our curated series collections
          </p>
        </motion.div>

        {/* Filter Tabs */}
        <motion.div 
          className="flex justify-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex space-x-2 bg-muted/30 rounded-lg p-1">
            <Button
              variant={filter === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('all')}
              className="rounded-md"
            >
              All Series
            </Button>
            <Button
              variant={filter === 'featured' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setFilter('featured')}
              className="rounded-md"
            >
              Featured
            </Button>
          </div>
        </motion.div>

        {/* Series Grid */}
        <motion.div 
          className="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {filteredSeries.map((seriesItem, index) => (
            <motion.div
              key={seriesItem.id}
              variants={itemVariants}
              whileHover={{ 
                scale: 1.05, 
                rotateY: 5, 
                z: 50,
                transition: { duration: 0.3 }
              }}
              className="group"
            >
              <Card className="video-card overflow-hidden transform-gpu shadow-2xl h-full">
                <div className="relative">
                  <motion.img
                    src={seriesItem.thumbnail_url || '/placeholder-thumbnail.jpg'}
                    alt={seriesItem.title}
                    className="video-thumbnail"
                    whileHover={{ scale: 1.1 }}
                    transition={{ duration: 0.6 }}
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Button size="lg" className="bg-white text-black hover:bg-gray-100 shadow-2xl">
                        <BookOpen className="mr-2 h-5 w-5" />
                        View Series
                      </Button>
                    </motion.div>
                  </div>
                  
                  {seriesItem.is_featured && (
                    <div className="absolute top-4 right-4 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-semibold shadow-lg">
                      Featured
                    </div>
                  )}
                </div>
                
                <CardHeader>
                  <CardTitle className="text-xl group-hover:text-primary transition-colors">
                    <Link href={`/series/${seriesItem.slug}`}>
                      {seriesItem.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {seriesItem.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {seriesItem.era && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                        {seriesItem.era}
                      </span>
                    )}
                    {seriesItem.topic && (
                      <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs">
                        {seriesItem.topic}
                      </span>
                    )}
                    {seriesItem.region && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                        {seriesItem.region}
                      </span>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Play className="h-4 w-4" />
                        {seriesItem.episode_count} episodes
                      </span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {formatRelativeTime(seriesItem.created_at)}
                    </span>
                  </div>

                  {/* Action Button */}
                  <Link href={`/series/${seriesItem.slug}`}>
                    <Button className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                      Explore Series
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Empty State */}
        {filteredSeries.length === 0 && (
          <motion.div 
            className="text-center py-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl font-semibold mb-2">No series found</h3>
            <p className="text-muted-foreground mb-6">
              {filter === 'featured' 
                ? 'No featured series available at the moment.'
                : 'No series available yet. Check back soon!'
              }
            </p>
            <Link href="/explore">
              <Button>Browse Videos</Button>
            </Link>
          </motion.div>
        )}
      </div>
    </div>
  )
}
