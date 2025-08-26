import { MetadataRoute } from 'next'
import { createServerSupabaseClient } from '@/lib/supabase'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://historyveo.com'

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/explore`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/series`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/auth/signup`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
  ]

  // Only try to fetch dynamic data if Supabase is configured
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('Skipping dynamic sitemap generation - Supabase not configured')
    return staticPages
  }

  try {
    const supabase = createServerSupabaseClient()
    
    // Get public videos
    const { data: videos } = await supabase
      .from('videos')
      .select('slug, updated_at')
      .eq('status', 'ready')
      .eq('visibility', 'public')
      .order('updated_at', { ascending: false })

    const videoPages = (videos || []).map((video: any) => ({
      url: `${baseUrl}/video/${video.slug}`,
      lastModified: new Date(video.updated_at),
      changeFrequency: 'weekly' as 'weekly',
      priority: 0.7,
    }))

    // Get public series
    const { data: series } = await supabase
      .from('series')
      .select('slug, updated_at')
      .order('updated_at', { ascending: false })

    const seriesPages = (series || []).map((seriesItem: any) => ({
      url: `${baseUrl}/series/${seriesItem.slug}`,
      lastModified: new Date(seriesItem.updated_at),
      changeFrequency: 'weekly' as 'weekly',
      priority: 0.6,
    }))

    return [...staticPages, ...videoPages, ...seriesPages]
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error)
    // Return static pages if dynamic generation fails
    return staticPages
  }
}
