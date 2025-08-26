import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import HeroBackground from '@/components/hero-background'
import FeaturedContent from '@/components/featured-content'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <HeroBackground />
        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight relative -top-[150px]">
            <span className="gradient-text">HistoryVeo</span>
          </h1>
          
          <div className="mb-8" />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/explore">
              <Button size="lg" className="text-lg px-8 py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-300 transform hover:scale-105">
                Start Exploring
              </Button>
            </Link>
            <Link href="/series">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-all duration-300 transform hover:scale-105">
                Browse Series
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Video Tiles Section */}
      <section className="py-20 px-6 bg-slate-800">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
            Featured Historical Content
          </h2>
          <FeaturedContent />
          
          <div className="text-center mt-12">
            <Link href="/explore">
              <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300">
                View All Content
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
