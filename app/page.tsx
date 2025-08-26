import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import HeroBackground from '@/components/hero-background'

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
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Sample Video Cards */}
            <Card className="video-card bg-slate-700 border-slate-600 hover:border-red-500 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-0">
                <div className="video-thumbnail bg-gradient-to-br from-red-900 to-red-700 h-48 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">🏛️</div>
                    <div className="text-sm opacity-80">Ancient Rome</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">The Rise of the Roman Empire</h3>
                  <p className="text-gray-400 mb-4">Explore how Rome became the ancient world's greatest superpower</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>45 min</span>
                    <span>Classical Era</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="video-card bg-slate-700 border-slate-600 hover:border-red-500 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-0">
                <div className="video-thumbnail bg-gradient-to-br from-blue-900 to-blue-700 h-48 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">⚔️</div>
                    <div className="text-sm opacity-80">Medieval Europe</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Knights and Castles</h3>
                  <p className="text-gray-400 mb-4">The age of chivalry and feudal society in medieval Europe</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>38 min</span>
                    <span>Medieval Era</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="video-card bg-slate-700 border-slate-600 hover:border-red-500 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-0">
                <div className="video-thumbnail bg-gradient-to-br from-green-900 to-green-700 h-48 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">🚂</div>
                    <div className="text-sm opacity-80">Industrial Revolution</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Steam and Steel</h3>
                  <p className="text-gray-400 mb-4">How the Industrial Revolution transformed the modern world</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>52 min</span>
                    <span>Industrial Era</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="video-card bg-slate-700 border-slate-600 hover:border-red-500 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-0">
                <div className="video-thumbnail bg-gradient-to-br from-purple-900 to-purple-700 h-48 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">🌍</div>
                    <div className="text-sm opacity-80">World Wars</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">The Great Wars</h3>
                  <p className="text-gray-400 mb-4">Understanding the conflicts that reshaped the 20th century</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>65 min</span>
                    <span>Modern Era</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="video-card bg-slate-700 border-slate-600 hover:border-red-500 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-0">
                <div className="video-thumbnail bg-gradient-to-br from-yellow-900 to-yellow-700 h-48 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">🚀</div>
                    <div className="text-sm opacity-80">Space Race</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">To the Moon and Beyond</h3>
                  <p className="text-gray-400 mb-4">The incredible story of human space exploration</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>41 min</span>
                    <span>Space Age</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="video-card bg-slate-700 border-slate-600 hover:border-red-500 transition-all duration-300 transform hover:scale-105">
              <CardContent className="p-0">
                <div className="video-thumbnail bg-gradient-to-br from-indigo-900 to-indigo-700 h-48 flex items-center justify-center">
                  <div className="text-center text-white">
                    <div className="text-4xl mb-2">💻</div>
                    <div className="text-sm opacity-80">Digital Age</div>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-white mb-2">The Information Revolution</h3>
                  <p className="text-gray-400 mb-4">How computers and the internet changed everything</p>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>48 min</span>
                    <span>Digital Era</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
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
