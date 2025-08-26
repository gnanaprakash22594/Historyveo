# HistoryVeo - Historical Video Library

A modern, production-ready Next.js application for exploring and sharing historical video content. Built with TypeScript, Supabase, and YouTube integration for a seamless video experience.

## 🚀 Features

- **Video Library**: Browse and search historical videos with advanced filtering
- **YouTube Integration**: Embed and manage YouTube videos with metadata
- **Authentication**: Email magic link authentication via Supabase
- **Series & Episodes**: Organize content into thematic series
- **Advanced Search**: Full-text search with filters by era, topic, and region
- **Responsive Design**: Modern UI built with Tailwind CSS and shadcn/ui
- **Admin Dashboard**: Content management for administrators
- **Role-based Access**: Different permission levels for users and admins
- **SEO Optimized**: Sitemap, robots.txt, and Open Graph tags

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI, Framer Motion
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Video Processing**: YouTube API integration for video management
- **Authentication**: Supabase Auth with magic links
- **Forms**: React Hook Form with Zod validation
- **State Management**: React hooks and context
- **Deployment**: Vercel-ready with GitHub Actions CI/CD

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- YouTube API key (optional, for enhanced features)
- Git

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/historyveo.git
cd historyveo
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment example file and fill in your credentials:

```bash
cp env.example .env.local
```

Fill in your environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# YouTube Configuration (Optional)
# YOUTUBE_API_KEY=your_youtube_api_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Database Setup

#### Option A: Local Development with Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Start local Supabase
supabase start

# Push the database schema
npm run db:push

# Generate TypeScript types
npm run db:generate
```

#### Option B: Remote Supabase Project

1. Create a new project in [Supabase Dashboard](https://supabase.com)
2. Run the SQL migrations from `supabase/migrations/20240101000000_initial_schema.sql`
3. Generate types: `npm run db:generate`

### 5. Seed the Database

```bash
npm run db:seed
```

This creates sample content including:
- Admin user: `admin@historyveo.com` / `admin123456`
- Regular user: `user@historyveo.com` / `user123456`
- Sample series and videos

### 6. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🗄️ Database Schema

The application uses the following main tables:

- **users**: User profiles and authentication
- **videos**: Video content with YouTube integration
- **series**: Video series organization
- **episodes**: Series episode management
- **video_views**: Analytics and view tracking
- **video_likes**: User engagement
- **video_comments**: Community interaction
- **uploads**: Upload tracking and status

## 🔐 Authentication

HistoryVeo uses Supabase Auth with email magic links:

1. Users enter their email address
2. A magic link is sent to their email
3. Clicking the link authenticates the user
4. User profiles are automatically created

## 📹 Video Upload Flow

1. **File Selection**: Users select video files (max 10GB)
2. **YouTube Integration**: Embed and manage YouTube videos
3. **Processing**: Automatic encoding and thumbnail generation
4. **Status Updates**: Real-time status updates via YouTube API
5. **Publication**: Videos become available once processing is complete

## 🎨 Customization

### Styling

The application uses Tailwind CSS with a custom design system:

- CSS variables for theming
- Dark mode support
- Responsive design utilities
- Custom component classes

### Components

All UI components are built with shadcn/ui and can be customized in `components/ui/`.

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms

The application is compatible with any Node.js hosting platform:

- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## 📱 API Endpoints

- `POST /api/videos/youtube` - YouTube video integration endpoint
- `GET /auth/callback` - Authentication callback

## 🔧 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript compiler
npm run db:generate  # Generate database types
npm run db:push      # Push database changes
npm run db:seed      # Seed database with sample data
```

## 🧪 Testing

```bash
# Run tests (when implemented)
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 📊 Performance

- **Image Optimization**: Next.js Image component with automatic optimization
- **Code Splitting**: Automatic route-based code splitting
- **Caching**: Built-in caching strategies for static assets
- **SEO**: Server-side rendering for better search engine visibility

## 🔒 Security Features

- **Row Level Security**: Database-level access control
- **Input Validation**: Zod schema validation for all forms
- **Authentication**: Secure magic link authentication
- **CORS Protection**: Configured for production use
- **Environment Variables**: Secure credential management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Supabase](https://supabase.com/) - Backend as a service
- [YouTube Data API](https://developers.google.com/youtube/v3) - Video integration
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components

## 📞 Support

For support and questions:

- Create an issue in this repository
- Check the [documentation](docs/)
- Join our [community discussions](https://github.com/yourusername/historyveo/discussions)

## 🗺️ Roadmap

- [ ] User playlists and favorites
- [ ] Advanced analytics dashboard
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Social features (sharing, commenting)
- [ ] AI-powered content recommendations
- [ ] Live streaming capabilities
- [ ] Educational tools and quizzes

---

Built with ❤️ for history enthusiasts everywhere.
