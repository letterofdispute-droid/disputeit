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
          content_plan_id: string | null
          created_at: string
          excerpt: string | null
          featured: boolean
          featured_image_alt: string | null
          featured_image_url: string | null
          id: string
          meta_description: string | null
          meta_title: string | null
          middle_image_1_alt: string | null
          middle_image_1_url: string | null
          middle_image_2_alt: string | null
          middle_image_2_url: string | null
          published_at: string | null
          read_time: string | null
          related_templates: string[] | null
          scheduled_at: string | null
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
          content_plan_id?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          middle_image_1_alt?: string | null
          middle_image_1_url?: string | null
          middle_image_2_alt?: string | null
          middle_image_2_url?: string | null
          published_at?: string | null
          read_time?: string | null
          related_templates?: string[] | null
          scheduled_at?: string | null
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
          content_plan_id?: string | null
          created_at?: string
          excerpt?: string | null
          featured?: boolean
          featured_image_alt?: string | null
          featured_image_url?: string | null
          id?: string
          meta_description?: string | null
          meta_title?: string | null
          middle_image_1_alt?: string | null
          middle_image_1_url?: string | null
          middle_image_2_alt?: string | null
          middle_image_2_url?: string | null
          published_at?: string | null
          read_time?: string | null
          related_templates?: string[] | null
          scheduled_at?: string | null
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
      letter_purchases: {
        Row: {
          amount_cents: number
          created_at: string
          docx_url: string | null
          edit_expires_at: string | null
          email: string
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
          anchor_text: string
          applied_at: string | null
          context_snippet: string | null
          created_at: string
          id: string
          insert_position: number | null
          relevance_score: number | null
          source_post_id: string
          status: string
          target_slug: string
          target_title: string
          target_type: string
        }
        Insert: {
          anchor_text: string
          applied_at?: string | null
          context_snippet?: string | null
          created_at?: string
          id?: string
          insert_position?: number | null
          relevance_score?: number | null
          source_post_id: string
          status?: string
          target_slug: string
          target_title: string
          target_type: string
        }
        Update: {
          anchor_text?: string
          applied_at?: string | null
          context_snippet?: string | null
          created_at?: string
          id?: string
          insert_position?: number | null
          relevance_score?: number | null
          source_post_id?: string
          status?: string
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
      make_user_admin: { Args: { user_email: string }; Returns: string }
      recover_stale_generating_items: { Args: never; Returns: undefined }
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
