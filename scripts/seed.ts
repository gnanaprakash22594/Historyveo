import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function seed() {
  console.log('🌱 Starting database seed...')

  try {
    // Create admin user
    const { data: adminUser, error: adminError } = await supabase.auth.admin.createUser({
      email: 'admin@historyveo.com',
      password: 'admin123456',
      email_confirm: true,
    })

    if (adminError) {
      console.log('Admin user already exists or error:', adminError.message)
    } else {
      console.log('✅ Created admin user:', adminUser.user?.email)
    }

    // Get admin user ID
    const { data: { user: admin } } = await supabase.auth.admin.listUsers()
    const adminId = admin?.find(u => u.email === 'admin@historyveo.com')?.id

    if (!adminId) {
      throw new Error('Admin user not found')
    }

    // Update admin user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: adminId,
        email: 'admin@historyveo.com',
        full_name: 'HistoryVeo Admin',
        role: 'admin',
        bio: 'Administrator of HistoryVeo platform',
      })

    if (profileError) {
      console.log('Profile update error:', profileError.message)
    }

    // Create sample series
    const seriesData = [
      {
        title: 'Ancient Civilizations',
        slug: 'ancient-civilizations',
        description: 'Explore the rise and fall of ancient civilizations across the globe.',
        era: 'Ancient',
        topic: 'Civilization',
        region: 'Global',
        tags: ['ancient', 'civilization', 'archaeology', 'history'],
        is_featured: true,
        created_by: adminId,
        thumbnail_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop'
      },
      {
        title: 'World War II',
        slug: 'world-war-ii',
        description: 'Comprehensive coverage of the Second World War and its global impact.',
        era: 'Modern',
        topic: 'War',
        region: 'Global',
        tags: ['ww2', 'war', 'military', '20th-century'],
        is_featured: true,
        created_by: adminId,
        thumbnail_url: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800&h=450&fit=crop'
      },
      {
        title: 'Renaissance Art & Science',
        slug: 'renaissance-art-science',
        description: 'The rebirth of art, science, and culture in Europe.',
        era: 'Renaissance',
        topic: 'Art & Science',
        region: 'Europe',
        tags: ['renaissance', 'art', 'science', 'culture'],
        is_featured: false,
        created_by: adminId,
        thumbnail_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop'
      }
    ]

    const { data: series, error: seriesError } = await supabase
      .from('series')
      .upsert(seriesData, { onConflict: 'slug' })
      .select()

    if (seriesError) {
      throw new Error(`Series creation error: ${seriesError.message}`)
    }

    console.log('✅ Created series:', series.length)

    // Create sample videos
    const videosData = [
      {
        title: 'The Rise of Ancient Egypt',
        slug: 'rise-of-ancient-egypt',
        description: 'Discover how the Nile River shaped one of history\'s greatest civilizations.',
        duration: 1800, // 30 minutes
        status: 'ready',
        visibility: 'public',
        era: 'Ancient',
        topic: 'Civilization',
        region: 'Africa',
        tags: ['egypt', 'nile', 'pharaohs', 'pyramids'],
        language: 'en',
        series_id: series.find(s => s.slug === 'ancient-civilizations')?.id,
        episode_number: 1,
        created_by: adminId,
        thumbnail_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
        youtube_video_id: 'sample_youtube_1',
        youtube_thumbnail_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop'
      },
      {
        title: 'The Roman Empire: From Republic to Empire',
        slug: 'roman-empire-republic-to-empire',
        description: 'The transformation of Rome from a republic to a vast empire.',
        duration: 2400, // 40 minutes
        status: 'ready',
        visibility: 'public',
        era: 'Ancient',
        topic: 'Civilization',
        region: 'Europe',
        tags: ['rome', 'empire', 'republic', 'caesar'],
        language: 'en',
        series_id: series.find(s => s.slug === 'ancient-civilizations')?.id,
        episode_number: 2,
        created_by: adminId,
        thumbnail_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop',
        youtube_video_id: 'sample_youtube_2',
        youtube_thumbnail_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&h=450&fit=crop'
      },
      {
        title: 'The Battle of Normandy',
        slug: 'battle-of-normandy',
        description: 'D-Day and the Allied invasion of Nazi-occupied France.',
        duration: 2700, // 45 minutes
        status: 'ready',
        visibility: 'public',
        era: 'Modern',
        topic: 'War',
        region: 'Europe',
        tags: ['d-day', 'normandy', 'allies', 'ww2'],
        language: 'en',
        series_id: series.find(s => s.slug === 'world-war-ii')?.id,
        episode_number: 1,
        created_by: adminId,
        thumbnail_url: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800&h=450&fit=crop',
        youtube_video_id: 'sample_youtube_3',
        youtube_thumbnail_url: 'https://images.unsplash.com/photo-1543349689-9a4d426bee8e?w=800&h=450&fit=crop'
      },
      {
        title: 'Leonardo da Vinci: Renaissance Genius',
        slug: 'leonardo-da-vinci-renaissance-genius',
        description: 'The life and works of the ultimate Renaissance man.',
        duration: 2100, // 35 minutes
        status: 'ready',
        visibility: 'public',
        era: 'Renaissance',
        topic: 'Art & Science',
        region: 'Europe',
        tags: ['leonardo', 'art', 'science', 'invention'],
        language: 'en',
        series_id: series.find(s => s.slug === 'renaissance-art-science')?.id,
        episode_number: 1,
        created_by: adminId,
        thumbnail_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop',
        youtube_video_id: 'sample_youtube_4',
        youtube_thumbnail_url: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=450&fit=crop'
      },
      {
        title: 'The Industrial Revolution',
        slug: 'industrial-revolution',
        description: 'How steam power and machinery changed the world forever.',
        duration: 3000, // 50 minutes
        status: 'ready',
        visibility: 'public',
        era: 'Modern',
        topic: 'Technology',
        region: 'Europe',
        tags: ['industrial', 'revolution', 'steam', 'machinery'],
        language: 'en',
        created_by: adminId,
        thumbnail_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=450&fit=crop',
        youtube_video_id: 'sample_youtube_5',
        youtube_thumbnail_url: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&h=450&fit=crop'
      }
    ]

    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .upsert(videosData, { onConflict: 'slug' })
      .select()

    if (videosError) {
      throw new Error(`Videos creation error: ${videosError.message}`)
    }

    console.log('✅ Created videos:', videos.length)

    // Create episodes for series
    const episodesData = videos
      .filter(v => v.series_id)
      .map(video => ({
        series_id: video.series_id!,
        video_id: video.id,
        episode_number: video.episode_number!,
        title: video.title,
        description: video.description
      }))

    if (episodesData.length > 0) {
      const { error: episodesError } = await supabase
        .from('episodes')
        .upsert(episodesData, { onConflict: 'series_id,episode_number' })

      if (episodesError) {
        console.log('Episodes creation error:', episodesError.message)
      } else {
        console.log('✅ Created episodes:', episodesData.length)
      }
    }

    // Create sample user
    const { data: sampleUser, error: userError } = await supabase.auth.admin.createUser({
      email: 'user@historyveo.com',
      password: 'user123456',
      email_confirm: true,
    })

    if (userError) {
      console.log('Sample user already exists or error:', userError.message)
    } else {
      console.log('✅ Created sample user:', sampleUser.user?.email)
    }

    // Get sample user ID and create profile
    const { data: { user: sampleUserData } } = await supabase.auth.admin.listUsers()
    const sampleUserId = sampleUserData?.find(u => u.email === 'user@historyveo.com')?.id

    if (sampleUserId) {
      const { error: profileError } = await supabase
        .from('users')
        .upsert({
          id: sampleUserId,
          email: 'user@historyveo.com',
          full_name: 'History Enthusiast',
          role: 'user',
          bio: 'Passionate about learning from the past',
        })

      if (profileError) {
        console.log('Sample user profile error:', profileError.message)
      }
    }

    // Add some sample video views and likes
    const sampleVideo = videos[0]
    if (sampleVideo) {
      // Add views
      for (let i = 0; i < 25; i++) {
        await supabase
          .from('video_views')
          .insert({
            video_id: sampleVideo.id,
            user_id: i % 2 === 0 ? adminId : sampleUserId,
            ip_address: `192.168.1.${i + 1}`,
            user_agent: 'Mozilla/5.0 (Sample Browser)'
          })
      }

      // Add likes
      await supabase
        .from('video_likes')
        .insert([
          { video_id: sampleVideo.id, user_id: adminId },
          { video_id: sampleVideo.id, user_id: sampleUserId }
        ])

      console.log('✅ Added sample analytics data')
    }

    console.log('🎉 Database seeding completed successfully!')
    console.log('\n📋 Sample Data Created:')
    console.log(`- ${series.length} series`)
    console.log(`- ${videos.length} videos`)
    console.log(`- ${episodesData.length} episodes`)
    console.log('\n🔑 Login Credentials:')
    console.log('Admin: admin@historyveo.com / admin123456')
    console.log('User: user@historyveo.com / user123456')

  } catch (error) {
    console.error('❌ Seeding failed:', error)
    process.exit(1)
  }
}

seed()
