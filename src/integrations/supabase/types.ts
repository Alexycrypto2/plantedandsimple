export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      affiliate_clicks: {
        Row: {
          code: string
          created_at: string
          id: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_amount: number
          id: string
          paid_at: string | null
          product: string | null
          purchased_at: string
          sale_amount: number
          status: string
          transaction_id: string
        }
        Insert: {
          affiliate_id: string
          commission_amount: number
          id?: string
          paid_at?: string | null
          product?: string | null
          purchased_at?: string
          sale_amount: number
          status?: string
          transaction_id: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          id?: string
          paid_at?: string | null
          product?: string | null
          purchased_at?: string
          sale_amount?: number
          status?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          code: string
          commission_pct: number
          created_at: string
          disabled: boolean
          email: string
          id: string
          name: string
          user_id: string | null
        }
        Insert: {
          code: string
          commission_pct?: number
          created_at?: string
          disabled?: boolean
          email: string
          id?: string
          name: string
          user_id?: string | null
        }
        Update: {
          code?: string
          commission_pct?: number
          created_at?: string
          disabled?: boolean
          email?: string
          id?: string
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ai_experiments: {
        Row: {
          decided_at: string | null
          dimension: string
          hypothesis: string
          id: string
          metric: string
          name: string
          results: Json
          started_at: string
          status: string
          variants: Json
          winner: string | null
        }
        Insert: {
          decided_at?: string | null
          dimension: string
          hypothesis?: string
          id?: string
          metric?: string
          name: string
          results?: Json
          started_at?: string
          status?: string
          variants?: Json
          winner?: string | null
        }
        Update: {
          decided_at?: string | null
          dimension?: string
          hypothesis?: string
          id?: string
          metric?: string
          name?: string
          results?: Json
          started_at?: string
          status?: string
          variants?: Json
          winner?: string | null
        }
        Relationships: []
      }
      ai_generations: {
        Row: {
          created_at: string
          created_by: string | null
          decided_at: string | null
          id: string
          kind: string
          model: string | null
          notes: string | null
          payload: Json
          preview_url: string | null
          published_ref_id: string | null
          quality_score: number | null
          scheduled_for: string | null
          seo_score: number | null
          status: string
          title: string
          topic: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          id?: string
          kind: string
          model?: string | null
          notes?: string | null
          payload?: Json
          preview_url?: string | null
          published_ref_id?: string | null
          quality_score?: number | null
          scheduled_for?: string | null
          seo_score?: number | null
          status?: string
          title: string
          topic?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          decided_at?: string | null
          id?: string
          kind?: string
          model?: string | null
          notes?: string | null
          payload?: Json
          preview_url?: string | null
          published_ref_id?: string | null
          quality_score?: number | null
          scheduled_for?: string | null
          seo_score?: number | null
          status?: string
          title?: string
          topic?: string | null
        }
        Relationships: []
      }
      ai_recommendations: {
        Row: {
          action: Json
          created_at: string
          evidence: Json
          for_date: string
          id: string
          kind: string
          priority: number
          reasoning: string
          status: string
          title: string
        }
        Insert: {
          action?: Json
          created_at?: string
          evidence?: Json
          for_date?: string
          id?: string
          kind?: string
          priority?: number
          reasoning: string
          status?: string
          title: string
        }
        Update: {
          action?: Json
          created_at?: string
          evidence?: Json
          for_date?: string
          id?: string
          kind?: string
          priority?: number
          reasoning?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      ai_topics: {
        Row: {
          ai_score: number | null
          category: string | null
          competition: string | null
          discovered_at: string
          id: string
          notes: string | null
          pinterest_score: number | null
          recommendation: string | null
          search_volume: number | null
          seasonal_score: number | null
          topic: string
          trend_score: number | null
        }
        Insert: {
          ai_score?: number | null
          category?: string | null
          competition?: string | null
          discovered_at?: string
          id?: string
          notes?: string | null
          pinterest_score?: number | null
          recommendation?: string | null
          search_volume?: number | null
          seasonal_score?: number | null
          topic: string
          trend_score?: number | null
        }
        Update: {
          ai_score?: number | null
          category?: string | null
          competition?: string | null
          discovered_at?: string
          id?: string
          notes?: string | null
          pinterest_score?: number | null
          recommendation?: string | null
          search_volume?: number | null
          seasonal_score?: number | null
          topic?: string
          trend_score?: number | null
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          id: string
          kind: string
          metadata: Json
          occurred_at: string
          ref_id: string | null
          ref_slug: string | null
          session_id: string | null
        }
        Insert: {
          id?: string
          kind: string
          metadata?: Json
          occurred_at?: string
          ref_id?: string | null
          ref_slug?: string | null
          session_id?: string | null
        }
        Update: {
          id?: string
          kind?: string
          metadata?: Json
          occurred_at?: string
          ref_id?: string | null
          ref_slug?: string | null
          session_id?: string | null
        }
        Relationships: []
      }
      app_settings: {
        Row: {
          is_secret: boolean
          key: string
          updated_at: string
          value_ciphertext: string
        }
        Insert: {
          is_secret?: boolean
          key: string
          updated_at?: string
          value_ciphertext: string
        }
        Update: {
          is_secret?: boolean
          key?: string
          updated_at?: string
          value_ciphertext?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image_url: string | null
          hero_image_id: string | null
          id: string
          published_at: string | null
          read_minutes: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          hero_image_id?: string | null
          id?: string
          published_at?: string | null
          read_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image_url?: string | null
          hero_image_id?: string | null
          id?: string
          published_at?: string | null
          read_minutes?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_hero_image_id_fkey"
            columns: ["hero_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_checks: {
        Row: {
          checked_at: string
          generation_id: string | null
          id: string
          issues: Json
          notes: string | null
          score: number
        }
        Insert: {
          checked_at?: string
          generation_id?: string | null
          id?: string
          issues?: Json
          notes?: string | null
          score?: number
        }
        Update: {
          checked_at?: string
          generation_id?: string | null
          id?: string
          issues?: Json
          notes?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "brand_checks_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_rules: {
        Row: {
          active: boolean
          category: string
          created_at: string
          id: string
          rule: string
          updated_at: string
          weight: number
        }
        Insert: {
          active?: boolean
          category: string
          created_at?: string
          id?: string
          rule: string
          updated_at?: string
          weight?: number
        }
        Update: {
          active?: boolean
          category?: string
          created_at?: string
          id?: string
          rule?: string
          updated_at?: string
          weight?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_id: string | null
          name: string
          parent_id: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_id?: string | null
          name: string
          parent_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_id?: string | null
          name?: string
          parent_id?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_id: string | null
          is_featured: boolean
          name: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_id?: string | null
          is_featured?: boolean
          name: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_id?: string | null
          is_featured?: boolean
          name?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      content_categories: {
        Row: {
          category_id: string
          content_id: string
          content_type: string
          created_at: string
          id: string
        }
        Insert: {
          category_id: string
          content_id: string
          content_type: string
          created_at?: string
          id?: string
        }
        Update: {
          category_id?: string
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_collections: {
        Row: {
          collection_id: string
          content_id: string
          content_type: string
          created_at: string
          id: string
          sort_order: number
        }
        Insert: {
          collection_id: string
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          sort_order?: number
        }
        Update: {
          collection_id?: string
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_collections_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      content_relations: {
        Row: {
          created_at: string
          from_id: string
          from_type: string
          id: string
          relation: string
          sort_order: number
          to_id: string
          to_type: string
        }
        Insert: {
          created_at?: string
          from_id: string
          from_type: string
          id?: string
          relation?: string
          sort_order?: number
          to_id: string
          to_type: string
        }
        Update: {
          created_at?: string
          from_id?: string
          from_type?: string
          id?: string
          relation?: string
          sort_order?: number
          to_id?: string
          to_type?: string
        }
        Relationships: []
      }
      content_schedule: {
        Row: {
          created_at: string
          id: string
          kind: string
          notes: string | null
          ref_id: string | null
          scheduled_for: string
          status: string
          title: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          notes?: string | null
          ref_id?: string | null
          scheduled_for: string
          status?: string
          title?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          notes?: string | null
          ref_id?: string | null
          scheduled_for?: string
          status?: string
          title?: string | null
        }
        Relationships: []
      }
      cookbook_downloads: {
        Row: {
          confirmation_email_sent_at: string | null
          created_at: string
          download_count: number
          email: string | null
          id: string
          last_downloaded_at: string | null
          stripe_session_id: string
        }
        Insert: {
          confirmation_email_sent_at?: string | null
          created_at?: string
          download_count?: number
          email?: string | null
          id?: string
          last_downloaded_at?: string | null
          stripe_session_id: string
        }
        Update: {
          confirmation_email_sent_at?: string | null
          created_at?: string
          download_count?: number
          email?: string | null
          id?: string
          last_downloaded_at?: string | null
          stripe_session_id?: string
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          created_at: string
          id: string
          kind: string
          name: string
          scheduled_for: string | null
          segment: string | null
          sent_at: string | null
          sequence: string | null
          stats: Json
          status: string
          subject: string
          template: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          name: string
          scheduled_for?: string | null
          segment?: string | null
          sent_at?: string | null
          sequence?: string | null
          stats?: Json
          status?: string
          subject: string
          template?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          name?: string
          scheduled_for?: string | null
          segment?: string | null
          sent_at?: string | null
          sequence?: string | null
          stats?: Json
          status?: string
          subject?: string
          template?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      free_guide_downloads: {
        Row: {
          created_at: string
          email: string
          id: string
          ip_address: string | null
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      homepage_sections: {
        Row: {
          config: Json
          created_at: string
          enabled: boolean
          id: string
          kind: string
          sort_order: number
          subtitle: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          kind: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          enabled?: boolean
          id?: string
          kind?: string
          sort_order?: number
          subtitle?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      learning_insights: {
        Row: {
          computed_at: string
          confidence: number
          dimension: string
          dimension_value: string
          evidence: Json
          id: string
          lift_pct: number
          metric: string
          sample_size: number
          score: number
          status: string
          summary: string
          window_days: number
        }
        Insert: {
          computed_at?: string
          confidence?: number
          dimension: string
          dimension_value: string
          evidence?: Json
          id?: string
          lift_pct?: number
          metric: string
          sample_size?: number
          score?: number
          status?: string
          summary: string
          window_days?: number
        }
        Update: {
          computed_at?: string
          confidence?: number
          dimension?: string
          dimension_value?: string
          evidence?: Json
          id?: string
          lift_pct?: number
          metric?: string
          sample_size?: number
          score?: number
          status?: string
          summary?: string
          window_days?: number
        }
        Relationships: []
      }
      learning_signals: {
        Row: {
          created_at: string
          dimensions: Json
          entity_id: string | null
          entity_ref: string | null
          entity_type: string
          id: string
          metric: string
          occurred_at: string
          source: string
          value: number
        }
        Insert: {
          created_at?: string
          dimensions?: Json
          entity_id?: string | null
          entity_ref?: string | null
          entity_type?: string
          id?: string
          metric: string
          occurred_at?: string
          source: string
          value?: number
        }
        Update: {
          created_at?: string
          dimensions?: Json
          entity_id?: string | null
          entity_ref?: string | null
          entity_type?: string
          id?: string
          metric?: string
          occurred_at?: string
          source?: string
          value?: number
        }
        Relationships: []
      }
      media: {
        Row: {
          alt: string
          created_at: string
          created_by: string | null
          height: number | null
          id: string
          mime_type: string | null
          public_url: string
          storage_path: string | null
          tags: string[]
          title: string | null
          updated_at: string
          width: number | null
        }
        Insert: {
          alt?: string
          created_at?: string
          created_by?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          public_url: string
          storage_path?: string | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          width?: number | null
        }
        Update: {
          alt?: string
          created_at?: string
          created_by?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          public_url?: string
          storage_path?: string | null
          tags?: string[]
          title?: string | null
          updated_at?: string
          width?: number | null
        }
        Relationships: []
      }
      pinterest_accounts: {
        Row: {
          access_token_ciphertext: string
          connected_at: string
          expires_at: string | null
          id: string
          pinterest_user_id: string | null
          refresh_token_ciphertext: string | null
          scopes: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          access_token_ciphertext: string
          connected_at?: string
          expires_at?: string | null
          id?: string
          pinterest_user_id?: string | null
          refresh_token_ciphertext?: string | null
          scopes?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          access_token_ciphertext?: string
          connected_at?: string
          expires_at?: string | null
          id?: string
          pinterest_user_id?: string | null
          refresh_token_ciphertext?: string | null
          scopes?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      pinterest_pins: {
        Row: {
          alt_text: string | null
          board_id: string | null
          created_at: string
          description: string | null
          error: string | null
          generation_id: string | null
          id: string
          image_url: string
          link_url: string | null
          pin_id: string | null
          published_at: string | null
          scheduled_for: string | null
          status: string
          title: string
        }
        Insert: {
          alt_text?: string | null
          board_id?: string | null
          created_at?: string
          description?: string | null
          error?: string | null
          generation_id?: string | null
          id?: string
          image_url: string
          link_url?: string | null
          pin_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          title: string
        }
        Update: {
          alt_text?: string | null
          board_id?: string | null
          created_at?: string
          description?: string | null
          error?: string | null
          generation_id?: string | null
          id?: string
          image_url?: string
          link_url?: string | null
          pin_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          status?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinterest_pins_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      pinterest_posts: {
        Row: {
          board_id: string | null
          board_name: string | null
          clicks: number
          created_at: string
          description: string | null
          destination_url: string
          error: string | null
          generation_id: string | null
          id: string
          image_url: string | null
          pin_id: string | null
          published_at: string | null
          scheduled_for: string | null
          slug: string
          status: string
          target_path: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_id?: string | null
          board_name?: string | null
          clicks?: number
          created_at?: string
          description?: string | null
          destination_url: string
          error?: string | null
          generation_id?: string | null
          id?: string
          image_url?: string | null
          pin_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          slug: string
          status?: string
          target_path?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_id?: string | null
          board_name?: string | null
          clicks?: number
          created_at?: string
          description?: string | null
          destination_url?: string
          error?: string | null
          generation_id?: string | null
          id?: string
          image_url?: string | null
          pin_id?: string | null
          published_at?: string | null
          scheduled_for?: string | null
          slug?: string
          status?: string
          target_path?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pinterest_posts_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "ai_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_settings: {
        Row: {
          compare_at_cents: number
          currency: string
          id: boolean
          price_cents: number
          updated_at: string
        }
        Insert: {
          compare_at_cents?: number
          currency?: string
          id?: boolean
          price_cents?: number
          updated_at?: string
        }
        Update: {
          compare_at_cents?: number
          currency?: string
          id?: boolean
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          benefits: Json
          bonus_files: Json
          category_id: string | null
          compare_at_cents: number
          cover_image_id: string | null
          cover_image_url: string | null
          created_at: string
          currency: string
          description: string
          features: Json
          gallery_urls: string[]
          id: string
          is_bestseller: boolean
          is_featured: boolean
          paddle_price_external_id: string | null
          pdf_asset_url: string | null
          pdf_storage_path: string | null
          pinterest_description: string | null
          price_cents: number
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          status: string
          subtitle: string | null
          tags: string[]
          title: string
          updated_at: string
        }
        Insert: {
          benefits?: Json
          bonus_files?: Json
          category_id?: string | null
          compare_at_cents?: number
          cover_image_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string
          features?: Json
          gallery_urls?: string[]
          id?: string
          is_bestseller?: boolean
          is_featured?: boolean
          paddle_price_external_id?: string | null
          pdf_asset_url?: string | null
          pdf_storage_path?: string | null
          pinterest_description?: string | null
          price_cents?: number
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          status?: string
          subtitle?: string | null
          tags?: string[]
          title: string
          updated_at?: string
        }
        Update: {
          benefits?: Json
          bonus_files?: Json
          category_id?: string | null
          compare_at_cents?: number
          cover_image_id?: string | null
          cover_image_url?: string | null
          created_at?: string
          currency?: string
          description?: string
          features?: Json
          gallery_urls?: string[]
          id?: string
          is_bestseller?: boolean
          is_featured?: boolean
          paddle_price_external_id?: string | null
          pdf_asset_url?: string | null
          pdf_storage_path?: string | null
          pinterest_description?: string | null
          price_cents?: number
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          status?: string
          subtitle?: string | null
          tags?: string[]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_cover_image_id_fkey"
            columns: ["cover_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          author_id: string | null
          cook_minutes: number | null
          created_at: string
          description: string
          difficulty: string
          gallery_ids: string[]
          hero_image_id: string | null
          id: string
          ingredients: Json
          instructions: Json
          is_featured: boolean
          nutrition: Json
          pinterest_description: string | null
          prep_minutes: number | null
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          servings: string | null
          slug: string
          status: string
          subtitle: string | null
          tags: string[]
          tips: Json
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          cook_minutes?: number | null
          created_at?: string
          description?: string
          difficulty?: string
          gallery_ids?: string[]
          hero_image_id?: string | null
          id?: string
          ingredients?: Json
          instructions?: Json
          is_featured?: boolean
          nutrition?: Json
          pinterest_description?: string | null
          prep_minutes?: number | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          servings?: string | null
          slug: string
          status?: string
          subtitle?: string | null
          tags?: string[]
          tips?: Json
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          cook_minutes?: number | null
          created_at?: string
          description?: string
          difficulty?: string
          gallery_ids?: string[]
          hero_image_id?: string | null
          id?: string
          ingredients?: Json
          instructions?: Json
          is_featured?: boolean
          nutrition?: Json
          pinterest_description?: string | null
          prep_minutes?: number | null
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          servings?: string | null
          slug?: string
          status?: string
          subtitle?: string | null
          tags?: string[]
          tips?: Json
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_hero_image_id_fkey"
            columns: ["hero_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          approved: boolean
          consent: boolean
          country: string | null
          created_at: string
          id: string
          location: string | null
          name: string
          photo_url: string | null
          product_id: string | null
          quote: string
          rating: number
          stripe_session_id: string | null
        }
        Insert: {
          approved?: boolean
          consent?: boolean
          country?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name: string
          photo_url?: string | null
          product_id?: string | null
          quote: string
          rating: number
          stripe_session_id?: string | null
        }
        Update: {
          approved?: boolean
          consent?: boolean
          country?: string | null
          created_at?: string
          id?: string
          location?: string | null
          name?: string
          photo_url?: string | null
          product_id?: string | null
          quote?: string
          rating?: number
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          email: string
          id: string
          source: string
          stripe_session_id: string | null
          subscribed_at: string
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          source?: string
          stripe_session_id?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          source?: string
          stripe_session_id?: string | null
          subscribed_at?: string
          unsubscribed_at?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_pin_click: { Args: { _slug: string }; Returns: undefined }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
    }
    Enums: {
      app_role: "boss" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["boss", "admin"],
    },
  },
} as const
