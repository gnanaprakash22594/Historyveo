-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE video_status AS ENUM ('processing', 'ready', 'failed');
CREATE TYPE video_visibility AS ENUM ('public', 'unlisted', 'private');
CREATE TYPE user_role AS ENUM ('user', 'admin', 'moderator');

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role user_role DEFAULT 'user',
    bio TEXT,
    website TEXT,
    twitter TEXT,
    youtube TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create series table
CREATE TABLE public.series (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    era TEXT,
    topic TEXT,
    region TEXT,
    tags TEXT[],
    is_featured BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create videos table
CREATE TABLE public.videos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    duration INTEGER, -- in seconds
    thumbnail_url TEXT,
    status video_status DEFAULT 'processing',
    visibility video_visibility DEFAULT 'public',
    
    -- Video integration (YouTube coming soon)
    youtube_video_id TEXT UNIQUE,
    youtube_thumbnail_url TEXT,
    
    -- Metadata
    era TEXT,
    topic TEXT,
    region TEXT,
    tags TEXT[],
    language TEXT DEFAULT 'en',
    transcript TEXT,
    subtitles_url TEXT,
    
    -- Series relationship
    series_id UUID REFERENCES public.series(id) ON DELETE SET NULL,
    episode_number INTEGER,
    
    -- Creator info
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create episodes table for series
CREATE TABLE public.episodes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    series_id UUID REFERENCES public.series(id) ON DELETE CASCADE NOT NULL,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(series_id, episode_number)
);

-- Create video_views table for analytics
CREATE TABLE public.video_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create video_likes table
CREATE TABLE public.video_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(video_id, user_id)
);

-- Create video_comments table
CREATE TABLE public.video_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    parent_id UUID REFERENCES public.video_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create uploads table for tracking upload status
CREATE TABLE public.uploads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    filename TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    youtube_url TEXT,
    status video_status DEFAULT 'processing',
    progress INTEGER DEFAULT 0, -- 0-100
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create full-text search indexes
CREATE INDEX videos_search_idx ON public.videos USING GIN (
    to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(array_to_string(tags, ' '), ''))
);

CREATE INDEX series_search_idx ON public.series USING GIN (
    to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || COALESCE(array_to_string(tags, ' '), ''))
);

-- Create regular indexes for performance
CREATE INDEX idx_videos_status ON public.videos(status);
CREATE INDEX idx_videos_visibility ON public.videos(visibility);
CREATE INDEX idx_videos_era ON public.videos(era);
CREATE INDEX idx_videos_topic ON public.videos(topic);
CREATE INDEX idx_videos_region ON public.videos(region);
CREATE INDEX idx_videos_created_at ON public.videos(created_at DESC);
CREATE INDEX idx_videos_series_id ON public.videos(series_id);
CREATE INDEX idx_videos_created_by ON public.videos(created_by);

CREATE INDEX idx_series_era ON public.series(era);
CREATE INDEX idx_series_topic ON public.series(topic);
CREATE INDEX idx_series_region ON public.series(region);
CREATE INDEX idx_series_is_featured ON public.series(is_featured);

CREATE INDEX idx_episodes_series_id ON public.episodes(series_id);
CREATE INDEX idx_episodes_episode_number ON public.episodes(episode_number);

CREATE INDEX idx_video_views_video_id ON public.video_views(video_id);
CREATE INDEX idx_video_views_viewed_at ON public.video_views(viewed_at);

CREATE INDEX idx_video_likes_video_id ON public.video_likes(video_id);
CREATE INDEX idx_video_likes_user_id ON public.video_likes(user_id);

CREATE INDEX idx_video_comments_video_id ON public.video_comments(video_id);
CREATE INDEX idx_video_comments_user_id ON public.video_comments(user_id);
CREATE INDEX idx_video_comments_parent_id ON public.video_comments(parent_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_series_updated_at BEFORE UPDATE ON public.series FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_videos_updated_at BEFORE UPDATE ON public.videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_episodes_updated_at BEFORE UPDATE ON public.episodes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_video_comments_updated_at BEFORE UPDATE ON public.video_comments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_uploads_updated_at BEFORE UPDATE ON public.uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.episodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles are viewable by everyone" ON public.users
    FOR SELECT USING (true);

-- RLS Policies for series
CREATE POLICY "Series are viewable by everyone" ON public.series
    FOR SELECT USING (true);

CREATE POLICY "Only admins can create series" ON public.series
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

CREATE POLICY "Only admins can update series" ON public.series
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- RLS Policies for videos
CREATE POLICY "Public videos are viewable by everyone" ON public.videos
    FOR SELECT USING (visibility = 'public');

CREATE POLICY "Unlisted videos are viewable by everyone" ON public.videos
    FOR SELECT USING (visibility = 'unlisted');

CREATE POLICY "Private videos are viewable by creator and admins" ON public.videos
    FOR SELECT USING (
        visibility = 'private' AND (
            created_by = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND role IN ('admin', 'moderator')
            )
        )
    );

CREATE POLICY "Users can create videos" ON public.videos
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own videos" ON public.videos
    FOR UPDATE USING (auth.uid() = created_by);

CREATE POLICY "Admins can update any video" ON public.videos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- RLS Policies for episodes
CREATE POLICY "Episodes are viewable by everyone" ON public.episodes
    FOR SELECT USING (true);

CREATE POLICY "Only admins can manage episodes" ON public.episodes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- RLS Policies for video_views
CREATE POLICY "Video views are viewable by everyone" ON public.video_views
    FOR SELECT USING (true);

CREATE POLICY "Anyone can create video views" ON public.video_views
    FOR INSERT WITH CHECK (true);

-- RLS Policies for video_likes
CREATE POLICY "Video likes are viewable by everyone" ON public.video_likes
    FOR SELECT USING (true);

CREATE POLICY "Users can like videos" ON public.video_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes" ON public.video_likes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for video_comments
CREATE POLICY "Approved comments are viewable by everyone" ON public.video_comments
    FOR SELECT USING (is_approved = true);

CREATE POLICY "Users can view their own comments" ON public.video_comments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create comments" ON public.video_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON public.video_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all comments" ON public.video_comments
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND role IN ('admin', 'moderator')
        )
    );

-- RLS Policies for uploads
CREATE POLICY "Users can view their own uploads" ON public.uploads
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create uploads" ON public.uploads
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own uploads" ON public.uploads
    FOR UPDATE USING (auth.uid() = user_id);

-- Create functions for common operations
CREATE OR REPLACE FUNCTION increment_video_view(video_uuid UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.video_views (video_id, user_id, ip_address)
    VALUES (video_uuid, auth.uid(), inet_client_addr());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get video statistics
CREATE OR REPLACE FUNCTION get_video_stats(video_uuid UUID)
RETURNS TABLE(
    view_count BIGINT,
    like_count BIGINT,
    comment_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT vv.id)::BIGINT as view_count,
        COUNT(DISTINCT vl.id)::BIGINT as like_count,
        COUNT(DISTINCT vc.id)::BIGINT as comment_count
    FROM public.videos v
    LEFT JOIN public.video_views vv ON v.id = vv.video_id
    LEFT JOIN public.video_likes vl ON v.id = vl.video_id
    LEFT JOIN public.video_comments vc ON v.id = vc.video_id AND vc.is_approved = true
    WHERE v.id = video_uuid
    GROUP BY v.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
