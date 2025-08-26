export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'user' | 'admin' | 'moderator'
          bio: string | null
          website: string | null
          twitter: string | null
          youtube: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'moderator'
          bio?: string | null
          website?: string | null
          twitter?: string | null
          youtube?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'user' | 'admin' | 'moderator'
          bio?: string | null
          website?: string | null
          twitter?: string | null
          youtube?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      series: {
        Row: {
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
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          thumbnail_url?: string | null
          era?: string | null
          topic?: string | null
          region?: string | null
          tags?: string[] | null
          is_featured?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          thumbnail_url?: string | null
          era?: string | null
          topic?: string | null
          region?: string | null
          tags?: string[] | null
          is_featured?: boolean
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          title: string
          slug: string
          description: string | null
          duration: number | null
          thumbnail_url: string | null
          status: 'processing' | 'ready' | 'failed'
          visibility: 'public' | 'unlisted' | 'private'
          youtube_video_id: string | null
          youtube_thumbnail_url: string | null
          era: string | null
          topic: string | null
          region: string | null
          tags: string[] | null
          language: string
          transcript: string | null
          subtitles_url: string | null
          series_id: string | null
          episode_number: number | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          description?: string | null
          duration?: number | null
          thumbnail_url?: string | null
          status?: 'processing' | 'ready' | 'failed'
          visibility?: 'public' | 'unlisted' | 'private'
          youtube_video_id?: string | null
          youtube_thumbnail_url?: string | null
          era?: string | null
          topic?: string | null
          region?: string | null
          tags?: string[] | null
          language?: string
          transcript?: string | null
          subtitles_url?: string | null
          series_id?: string | null
          episode_number?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          description?: string | null
          duration?: number | null
          thumbnail_url?: string | null
          status?: 'processing' | 'ready' | 'failed'
          visibility?: 'public' | 'unlisted' | 'private'
          youtube_video_id?: string | null
          youtube_thumbnail_url?: string | null
          era?: string | null
          topic?: string | null
          region?: string | null
          tags?: string[] | null
          language?: string
          transcript?: string | null
          subtitles_url?: string | null
          series_id?: string | null
          episode_number?: number | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      episodes: {
        Row: {
          id: string
          series_id: string
          video_id: string
          episode_number: number
          title: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          series_id: string
          video_id: string
          episode_number: number
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          series_id?: string
          video_id?: string
          episode_number?: number
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      video_views: {
        Row: {
          id: string
          video_id: string
          user_id: string | null
          ip_address: string | null
          user_agent: string | null
          viewed_at: string
        }
        Insert: {
          id?: string
          video_id: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          user_id?: string | null
          ip_address?: string | null
          user_agent?: string | null
          viewed_at?: string
        }
      }
      video_likes: {
        Row: {
          id: string
          video_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          video_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          user_id?: string
          created_at?: string
        }
      }
      video_comments: {
        Row: {
          id: string
          video_id: string
          user_id: string
          parent_id: string | null
          content: string
          is_approved: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          video_id: string
          user_id: string
          parent_id?: string | null
          content: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          video_id?: string
          user_id?: string
          parent_id?: string | null
          content?: string
          is_approved?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      uploads: {
        Row: {
          id: string
          user_id: string
          filename: string
          file_size: number
          youtube_url: string | null
          status: 'processing' | 'ready' | 'failed'
          progress: number
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          file_size: number
          youtube_url?: string | null
          status?: 'processing' | 'ready' | 'failed'
          progress?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          file_size?: number
          youtube_url?: string | null
          status?: 'processing' | 'ready' | 'failed'
          progress?: number
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_video_stats: {
        Args: {
          video_uuid: string
        }
        Returns: {
          view_count: number
          like_count: number
          comment_count: number
        }[]
      }
      increment_video_view: {
        Args: {
          video_uuid: string
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: 'user' | 'admin' | 'moderator'
      video_status: 'processing' | 'ready' | 'failed'
      video_visibility: 'public' | 'unlisted' | 'private'
    }
  }
}
