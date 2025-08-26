"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

interface HeroMedia {
  imageUrl?: string
  videoUrl?: string
}

export default function HeroBackground() {
  const [media, setMedia] = useState<HeroMedia>({})

  useEffect(() => {
    const load = async () => {
      try {
        // Check for specific keys first (preferred)
        const imageKey = 'branding/hero.jpg'
        const imagePngKey = 'branding/hero.png'
        const videoKey = 'branding/hero.mp4'
        const videoWebmKey = 'branding/hero.webm'

        const exists = async (path: string) => {
          const { data, error } = await supabase.storage.from('media').list(path.substring(0, path.lastIndexOf('/')) || '', {
            limit: 100,
          })
          if (error) return false
          const file = path.split('/').pop()
          return !!data?.find((o) => o.name === file)
        }

        const foundImage = (await exists(imageKey)) || (await exists(imagePngKey))
        const foundVideo = (await exists(videoKey)) || (await exists(videoWebmKey))

        const getPublic = (path: string) => supabase.storage.from('media').getPublicUrl(path).data.publicUrl

        const imageUrl = foundImage
          ? getPublic((await exists(imageKey)) ? imageKey : imagePngKey)
          : undefined
        const videoUrl = foundVideo
          ? getPublic((await exists(videoKey)) ? videoKey : videoWebmKey)
          : undefined

        setMedia({ imageUrl, videoUrl })
      } catch (e) {
        // ignore
      }
    }

    load()
  }, [])

  if (!media.imageUrl && !media.videoUrl) {
    return (
      <div className="absolute inset-0 w-full h-full opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 via-transparent to-blue-500/20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      {media.videoUrl ? (
        <video
          className="absolute inset-0 w-full h-full object-cover"
          src={media.videoUrl}
          autoPlay
          playsInline
          muted
          loop
        />
      ) : null}
      {!media.videoUrl && media.imageUrl ? (
        <img
          className="absolute inset-0 w-full h-full object-cover"
          src={media.imageUrl}
          alt="Hero background"
        />
      ) : null}
      <div className="absolute inset-0 bg-black/30" />
    </div>
  )
}
