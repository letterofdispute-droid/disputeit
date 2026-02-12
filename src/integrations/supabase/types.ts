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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analytics_events: {
        Row: {
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
          page_path: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          page_path?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      article_embeddings: {
        Row: {
          anchor_variants: string[] | null
          article_role: string
          article_type: string | null
          category_id: string
          content_hash: string | null
          content_id: string | null
          content_type: string
          created_at: string | null
          embedding: string | null
          embedding_status: string | null
          error_message: string | null
          headings_text: string | null
          id: string
          inbound_count: number | null
          last_embedded_at: string | null
          max_inbound: number | null
          next_scan_due_at: string | null
          outbound_count: number | null
          parent_pillar_id: string | null
          primary_keyword: string | null
          related_categories: string[] | null
          secondary_keywords: string[] | null
          slug: string
          subcategory_slug: string | null
          title: string
          topic_summary: string | null
          updated_at: string | null
        }
        Insert: {
          anchor_variants?: string[] | null
          article_role?: string
          article_type?: string | null
          category_id: string
          content_hash?: string | null
          content_id?: string | null
          content_type: string
          created_at?: string | null
          embedding?: string | null
          embedding_status?: string | null
          error_message?: string | null
          headings_text?: string | null
          id?: string
          inbound_count?: number | null
          last_embedded_at?: string | null
          max_inbound?: number | null
          next_scan_due_at?: string | null
          outbound_count?: number | null
          parent_pillar_id?: string | null
          primary_keyword?: string | null
          related_categories?: string[] | null
          secondary_keywords?: string[] | null
          slug: string
          subcategory_slug?: string | null
          title: string
          topic_summary?: string | null
          updated_at?: string | null
        }
        Update: {
          anchor_variants?: string[] | null
          article_role?: string
          article_type?: string | null
          category_id?: string
          content_hash?: string | null
          content_id?: string | null
          content_type?: string
          created_at?: string | null
          embedding?: string | null
          embedding_status?: string | null
          error_message?: string | null
          headings_text?: string | null
          id?: string
          inbound_count?: number | null
          last_embedded_at?: string | null
          max_inbound?: number | null
          next_scan_due_at?: string | null
          outbound_count?: number | null
          parent_pillar_id?: string | null
          primary_keyword?: string | null
          related_categories?: string[] | null
          secondary_keywords?: string[] | null
          slug?: string
          subcategory_slug?: string | null
          title?: string
          topic_summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_parent_pillar"
            columns: ["parent_pillar_id"]
            isOneToOne: false
            referencedRelation: "article_embeddings"
            referencedColumns: ["id"]
          },
        ]
      }
      backfill_jobs: {
        Row: {
          created_at: string | null
          failed_images: number | null
          id: string
          last_error: string | null
          last_post_slug: string | null
          processed_images: number | null
          status: string
          total_images: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          failed_images?: number | null
          id?: string
          last_error?: string | null
          last_post_slug?: string | null
          processed_images?: number | null
          status?: string
          total_images?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          failed_images?: number | null
          id?: string
          last_error?: string | null
          last_post_slug?: string | null
          processed_images?: number | null
          status?: string
          total_images?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      blog_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          article_type: string | null
          author: string
          author_id: string | null
          category: string
          category_slug: string
          content: string
          content_hash: string | null
          content_plan_id: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          featured_image_alt: string | null
          featured_image_url: string | null
          id: string
          last_link_scan_at: string | null
          meta_description: string | null
          meta_title: string | null
          middle_image_1_alt: string | null
          middle_image_1_url: string | null
          middle_image_2_alt: string | null
          middle_image_2_url: string | null
          primary_keyword: string | null
          published_at: string | null
          read_time: string | null
          related_templates: string[] | null
          scheduled_at: string | null
          secondary_keywords: string[] | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          views: number
        }
        Insert: {
          article_type?: string | null
          author?: string
          author_id?: string | null
          category: string
          category_slug: string
          content: string
          content_hash?: string | null
          content_plan_id?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          last_link_scan_at?: string | null
          meta_description?: string | null
          meta_title?: string | null
          middle_image_1_alt?: string | null
          middle_image_1_url?: string | null
          middle_image_2_alt?: string | null
          middle_image_2_url?: string | null
          primary_keyword?: string | null
          published_at?: string | null
          read_time?: string | null
          related_templates?: string[] | null
          scheduled_at?: string | null
          secondary_keywords?: string[] | null
          slug: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          views?: number
        }
        Update: {
          article_type?: string | null
          author?: string
          author_id?: string | null
          category?: string
          category_slug?: string
          content?: string
          content_hash?: string | null
          content_plan_id?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          last_link_scan_at?: string | null
          meta_description?: string | null
          meta_title?: string | null
          middle_image_1_alt?: string | null
          middle_image_1_url?: string | null
          middle_image_2_alt?: string | null
          middle_image_2_url?: string | null
          primary_keyword?: string | null
          published_at?: string | null
          read_time?: string | null
          related_templates?: string[] | null
          scheduled_at?: string | null
          secondary_keywords?: string[] | null
          slug?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "blog_posts_content_plan_id_fkey"
            columns: ["content_plan_id"]
            isOneToOne: false
            referencedRelation: "content_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_tags: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      bulk_planning_jobs: {
        Row: {
          category_id: string
          category_name: string
          completed_at: string | null
          completed_templates: number
          created_at: string
          error_messages: Json | null
          failed_slugs: string[]
          failed_templates: number
          id: string
          processed_slugs: string[]
          status: string
          template_slugs: string[]
          total_templates: number
          updated_at: string
          value_tier: string
        }
        Insert: {
          category_id: string
          category_name: string
          completed_at?: string | null
          completed_templates?: number
          created_at?: string
          error_messages?: Json | null
          failed_slugs?: string[]
          failed_templates?: number
          id?: string
          processed_slugs?: string[]
          status?: string
          template_slugs?: string[]
          total_templates?: number
          updated_at?: string
          value_tier?: string
        }
        Update: {
          category_id?: string
          category_name?: string
          completed_at?: string | null
          completed_templates?: number
          created_at?: string
          error_messages?: Json | null
          failed_slugs?: string[]
          failed_templates?: number
          id?: string
          processed_slugs?: string[]
          status?: string
          template_slugs?: string[]
          total_templates?: number
          updated_at?: string
          value_tier?: string
        }
        Relationships: []
      }
      canonical_anchors: {
        Row: {
          anchor_normalized: string
          anchor_phrase: string
          canonical_target_id: string
          category_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          anchor_normalized: string
          anchor_phrase: string
          canonical_target_id: string
          category_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          anchor_normalized?: string
          anchor_phrase?: string
          canonical_target_id?: string
          category_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "canonical_anchors_canonical_target_id_fkey"
            columns: ["canonical_target_id"]
            isOneToOne: false
            referencedRelation: "article_embeddings"
            referencedColumns: ["id"]
          },
        ]
      }
      category_images: {
        Row: {
          alt_text: string | null
          category_id: string
          context_key: string
          created_at: string
          expires_at: string
          fetched_at: string
          id: string
          image_url: string
          large_url: string
          pixabay_id: string
          search_query: string
          thumbnail_url: string
        }
        Insert: {
          alt_text?: string | null
          category_id: string
          context_key?: string
          created_at?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          image_url: string
          large_url: string
          pixabay_id: string
          search_query: string
          thumbnail_url: string
        }
        Update: {
          alt_text?: string | null
          category_id?: string
          context_key?: string
          created_at?: string
          expires_at?: string
          fetched_at?: string
          id?: string
          image_url?: string
          large_url?: string
          pixabay_id?: string
          search_query?: string
          thumbnail_url?: string
        }
        Relationships: []
      }
      content_plans: {
        Row: {
          category_id: string
          created_at: string
          id: string
          subcategory_slug: string | null
          target_article_count: number
          template_name: string
          template_slug: string
          updated_at: string
          value_tier: string
        }
        Insert: {
          category_id: string
          created_at?: string
          id?: string
          subcategory_slug?: string | null
          target_article_count?: number
          template_name: string
          template_slug: string
          updated_at?: string
          value_tier?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          id?: string
          subcategory_slug?: string | null
          target_article_count?: number
          template_name?: string
          template_slug?: string
          updated_at?: string
          value_tier?: string
        }
        Relationships: []
      }
      content_queue: {
        Row: {
          article_type: string
          blog_post_id: string | null
          created_at: string
          error_message: string | null
          generated_at: string | null
          id: string
          plan_id: string | null
          priority: number | null
          published_at: string | null
          started_at: string | null
          status: string
          suggested_keywords: string[] | null
          suggested_title: string
        }
        Insert: {
          article_type: string
          blog_post_id?: string | null
          created_at?: string
          error_message?: string | null
          generated_at?: string | null
          id?: string
          plan_id?: string | null
          priority?: number | null
          published_at?: string | null
          started_at?: string | null
          status?: string
          suggested_keywords?: string[] | null
          suggested_title: string
        }
        Update: {
          article_type?: string
          blog_post_id?: string | null
          created_at?: string
          error_message?: string | null
          generated_at?: string | null
          id?: string
          plan_id?: string | null
          priority?: number | null
          published_at?: string | null
          started_at?: string | null
          status?: string
          suggested_keywords?: string[] | null
          suggested_title?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_queue_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_queue_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "content_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      embedding_jobs: {
        Row: {
          category_filter: string | null
          completed_at: string | null
          content_type: string
          created_at: string
          error_messages: Json | null
          failed_ids: string[]
          failed_items: number
          id: string
          processed_ids: string[]
          processed_items: number
          skipped_items: number
          status: string
          total_items: number
          updated_at: string
        }
        Insert: {
          category_filter?: string | null
          completed_at?: string | null
          content_type?: string
          created_at?: string
          error_messages?: Json | null
          failed_ids?: string[]
          failed_items?: number
          id?: string
          processed_ids?: string[]
          processed_items?: number
          skipped_items?: number
          status?: string
          total_items?: number
          updated_at?: string
        }
        Update: {
          category_filter?: string | null
          completed_at?: string | null
          content_type?: string
          created_at?: string
          error_messages?: Json | null
          failed_ids?: string[]
          failed_items?: number
          id?: string
          processed_ids?: string[]
          processed_items?: number
          skipped_items?: number
          status?: string
          total_items?: number
          updated_at?: string
        }
        Relationships: []
      }
      embedding_queue: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          error_message: string | null
          id: string
          priority: number | null
          processed_at: string | null
          trigger_source: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          trigger_source: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          priority?: number | null
          processed_at?: string | null
          trigger_source?: string
        }
        Relationships: []
      }
      evidence_photos: {
        Row: {
          created_at: string
          description: string | null
          file_size_bytes: number | null
          id: string
          original_filename: string | null
          position: number
          purchase_id: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_size_bytes?: number | null
          id?: string
          original_filename?: string | null
          position?: number
          purchase_id?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_size_bytes?: number | null
          id?: string
          original_filename?: string | null
          position?: number
          purchase_id?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_photos_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "letter_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      generation_jobs: {
        Row: {
          bail_reason: string | null
          completed_at: string | null
          created_at: string
          failed_items: number
          id: string
          queue_item_ids: string[]
          status: string
          succeeded_items: number
          total_items: number
          updated_at: string
        }
        Insert: {
          bail_reason?: string | null
          completed_at?: string | null
          created_at?: string
          failed_items?: number
          id?: string
          queue_item_ids?: string[]
          status?: string
          succeeded_items?: number
          total_items?: number
          updated_at?: string
        }
        Update: {
          bail_reason?: string | null
          completed_at?: string | null
          created_at?: string
          failed_items?: number
          id?: string
          queue_item_ids?: string[]
          status?: string
          succeeded_items?: number
          total_items?: number
          updated_at?: string
        }
        Relationships: []
      }
      image_optimization_jobs: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_offset: number | null
          deleted: number | null
          errors: Json | null
          file_list: Json | null
          freed_bytes: number | null
          id: string
          oversized_files: number | null
          oversized_size_bytes: number | null
          processed: number | null
          saved_bytes: number | null
          status: string
          total_files: number | null
          total_size_bytes: number | null
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_offset?: number | null
          deleted?: number | null
          errors?: Json | null
          file_list?: Json | null
          freed_bytes?: number | null
          id?: string
          oversized_files?: number | null
          oversized_size_bytes?: number | null
          processed?: number | null
          saved_bytes?: number | null
          status?: string
          total_files?: number | null
          total_size_bytes?: number | null
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_offset?: number | null
          deleted?: number | null
          errors?: Json | null
          file_list?: Json | null
          freed_bytes?: number | null
          id?: string
          oversized_files?: number | null
          oversized_size_bytes?: number | null
          processed?: number | null
          saved_bytes?: number | null
          status?: string
          total_files?: number | null
          total_size_bytes?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      letter_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          docx_url: string | null
          edit_expires_at: string | null
          email: string
          evidence_photos: Json | null
          id: string
          last_edited_at: string | null
          last_edited_content: string | null
          letter_content: string
          pdf_url: string | null
          purchase_type: string
          refund_reason: string | null
          refunded_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          template_name: string
          template_slug: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          docx_url?: string | null
          edit_expires_at?: string | null
          email: string
          evidence_photos?: Json | null
          id?: string
          last_edited_at?: string | null
          last_edited_content?: string | null
          letter_content: string
          pdf_url?: string | null
          purchase_type: string
          refund_reason?: string | null
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          template_name: string
          template_slug: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          docx_url?: string | null
          edit_expires_at?: string | null
          email?: string
          evidence_photos?: Json | null
          id?: string
          last_edited_at?: string | null
          last_edited_content?: string | null
          letter_content?: string
          pdf_url?: string | null
          purchase_type?: string
          refund_reason?: string | null
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          template_name?: string
          template_slug?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      link_suggestions: {
        Row: {
          anchor_source: string | null
          anchor_text: string
          applied_at: string | null
          context_snippet: string | null
          created_at: string
          hierarchy_valid: boolean | null
          hierarchy_violation: string | null
          id: string
          insert_position: number | null
          keyword_overlap_score: number | null
          relevance_score: number | null
          semantic_score: number | null
          source_post_id: string
          status: string
          target_embedding_id: string | null
          target_slug: string
          target_title: string
          target_type: string
        }
        Insert: {
          anchor_source?: string | null
          anchor_text: string
          applied_at?: string | null
          context_snippet?: string | null
          created_at?: string
          hierarchy_valid?: boolean | null
          hierarchy_violation?: string | null
          id?: string
          insert_position?: number | null
          keyword_overlap_score?: number | null
          relevance_score?: number | null
          semantic_score?: number | null
          source_post_id: string
          status?: string
          target_embedding_id?: string | null
          target_slug: string
          target_title: string
          target_type: string
        }
        Update: {
          anchor_source?: string | null
          anchor_text?: string
          applied_at?: string | null
          context_snippet?: string | null
          created_at?: string
          hierarchy_valid?: boolean | null
          hierarchy_violation?: string | null
          id?: string
          insert_position?: number | null
          keyword_overlap_score?: number | null
          relevance_score?: number | null
          semantic_score?: number | null
          source_post_id?: string
          status?: string
          target_embedding_id?: string | null
          target_slug?: string
          target_title?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "link_suggestions_source_post_id_fkey"
            columns: ["source_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "link_suggestions_target_embedding_id_fkey"
            columns: ["target_embedding_id"]
            isOneToOne: false
            referencedRelation: "article_embeddings"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          author: string | null
          author_id: string | null
          content: string | null
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          parent_id: string | null
          slug: string
          sort_order: number | null
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author?: string | null
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          parent_id?: string | null
          slug: string
          sort_order?: number | null
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author?: string | null
          author_id?: string | null
          content?: string | null
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          parent_id?: string | null
          slug?: string
          sort_order?: number | null
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          first_name: string | null
          id: string
          is_admin: boolean
          last_name: string | null
          letters_count: number
          plan: string
          role: string | null
          status: string
          stripe_subscription_id: string | null
          subscription_end: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean
          last_name?: string | null
          letters_count?: number
          plan?: string
          role?: string | null
          status?: string
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean
          last_name?: string | null
          letters_count?: number
          plan?: string
          role?: string | null
          status?: string
          stripe_subscription_id?: string | null
          subscription_end?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      refund_logs: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          processed_by: string
          purchase_id: string
          reason: string | null
          stripe_refund_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          processed_by: string
          purchase_id: string
          reason?: string | null
          stripe_refund_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          processed_by?: string
          purchase_id?: string
          reason?: string | null
          stripe_refund_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "refund_logs_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "letter_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          created_at: string | null
          id: string
          key: string
          updated_at: string | null
          value: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      template_seo_overrides: {
        Row: {
          created_at: string
          id: string
          meta_description: string | null
          meta_title: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          expires_at: string
          granted_at: string
          granted_by: string
          id: string
          purchase_id: string | null
          reason: string | null
          status: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          expires_at?: string
          granted_at?: string
          granted_by: string
          id?: string
          purchase_id?: string | null
          reason?: string | null
          status?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          expires_at?: string
          granted_at?: string
          granted_by?: string
          id?: string
          purchase_id?: string | null
          reason?: string | null
          status?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_credits_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "letter_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_letters: {
        Row: {
          content: string | null
          created_at: string
          id: string
          status: string
          template_name: string
          template_slug: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          status?: string
          template_name: string
          template_slug: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          status?: string
          template_name?: string
          template_slug?: string
          title?: string
          updated_at?: string
          user_id?: string
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
      assign_role: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: string
      }
      calculate_keyword_overlap: {
        Args: { keywords_a: string[]; keywords_b: string[] }
        Returns: number
      }
      claim_optimization_batch: {
        Args: { p_batch_size: number; p_job_id: string }
        Returns: number
      }
      get_next_backfill_post: {
        Args: never
        Returns: {
          article_type: string | null
          author: string
          author_id: string | null
          category: string
          category_slug: string
          content: string
          content_hash: string | null
          content_plan_id: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          featured_image_alt: string | null
          featured_image_url: string | null
          id: string
          last_link_scan_at: string | null
          meta_description: string | null
          meta_title: string | null
          middle_image_1_alt: string | null
          middle_image_1_url: string | null
          middle_image_2_alt: string | null
          middle_image_2_url: string | null
          primary_keyword: string | null
          published_at: string | null
          read_time: string | null
          related_templates: string[] | null
          scheduled_at: string | null
          secondary_keywords: string[] | null
          slug: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          views: number
        }[]
        SetofOptions: {
          from: "*"
          to: "blog_posts"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_optimization_batch: {
        Args: { p_job_id: string; p_limit: number; p_offset: number }
        Returns: Json
      }
      get_orphan_articles: {
        Args: { category_filter?: string }
        Returns: {
          category_slug: string
          id: string
          inbound_count: number
          published_at: string
          slug: string
          title: string
        }[]
      }
      get_template_progress: {
        Args: never
        Returns: {
          generated: number
          template_slug: string
          total: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_backfill_progress: {
        Args: {
          p_failed: number
          p_job_id: string
          p_last_slug: string
          p_processed: number
        }
        Returns: undefined
      }
      increment_optimization_progress:
        | {
            Args: {
              p_deleted: number
              p_errors?: Json
              p_job_id: string
              p_processed: number
              p_saved_bytes: number
            }
            Returns: undefined
          }
        | {
            Args: {
              p_deleted: number
              p_errors?: Json
              p_job_id: string
              p_new_offset: number
              p_processed: number
              p_saved_bytes: number
            }
            Returns: undefined
          }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
      make_user_admin: { Args: { user_email: string }; Returns: string }
      match_semantic_links: {
        Args: {
          max_results?: number
          query_embedding: string
          similarity_threshold?: number
          source_category: string
          source_role: string
        }
        Returns: {
          article_role: string
          category_id: string
          content_type: string
          hierarchy_note: string
          hierarchy_valid: boolean
          id: string
          inbound_count: number
          max_inbound: number
          primary_keyword: string
          secondary_keywords: string[]
          similarity: number
          slug: string
          subcategory_slug: string
          title: string
        }[]
      }
      recover_stale_backfill_jobs: { Args: never; Returns: undefined }
      recover_stale_generating_items: { Args: never; Returns: undefined }
      recover_stale_generation_jobs: { Args: never; Returns: undefined }
      recover_stale_image_optimization_jobs: { Args: never; Returns: undefined }
      recover_stale_planning_jobs: { Args: never; Returns: undefined }
      revoke_role: {
        Args: {
          target_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
