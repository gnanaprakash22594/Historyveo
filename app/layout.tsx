import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'HistoryVeo - Historical Video Library',
  description: 'Explore history through curated video content. Discover ancient civilizations, world events, and cultural milestones with our comprehensive historical video library.',
  keywords: ['history', 'video', 'education', 'documentary', 'historical content'],
  authors: [{ name: 'HistoryVeo Team' }],
  creator: 'HistoryVeo',
  publisher: 'HistoryVeo',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'HistoryVeo - Historical Video Library',
    description: 'Explore history through curated video content. Discover ancient civilizations, world events, and cultural milestones.',
    url: '/',
    siteName: 'HistoryVeo',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'HistoryVeo - Historical Video Library',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HistoryVeo - Historical Video Library',
    description: 'Explore history through curated video content.',
    images: ['/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
