
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      ai_recommended_places: {
        Row: {
          ai_search_log_id: number | null
          category: string | null
          created_at: string | null
          duration: number | null
          id: number
          matched_place_id: number | null
          matching_confidence: number | null
          place_name: string
          search_info: Json | null
          special_tips: string | null
          time_slot: string | null
        }
        Insert: {
          ai_search_log_id?: number | null
          category?: string | null
          created_at?: string | null
          duration?: number | null
          id?: number
          matched_place_id?: number | null
          matching_confidence?: number | null
          place_name: string
          search_info?: Json | null
          special_tips?: string | null
          time_slot?: string | null
        }
        Update: {
          ai_search_log_id?: number | null
          category?: string | null
          created_at?: string | null
          duration?: number | null
          id?: number
          matched_place_id?: number | null
          matching_confidence?: number | null
          place_name?: string
          search_info?: Json | null
          special_tips?: string | null
          time_slot?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_recommended_places_ai_search_log_id_fkey"
            columns: ["ai_search_log_id"]
            isOneToOne: false
            referencedRelation: "ai_search_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_recommended_places_matched_place_id_fkey"
            columns: ["matched_place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_search_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: number
          is_successful: boolean
          perplexity_citations: string[] | null
          recommended_places_count: number | null
          search_duration_ms: number | null
          search_request: Json
          search_response: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          is_successful?: boolean
          perplexity_citations?: string[] | null
          recommended_places_count?: number | null
          search_duration_ms?: number | null
          search_request: Json
          search_response?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: number
          is_successful?: boolean
          perplexity_citations?: string[] | null
          recommended_places_count?: number | null
          search_duration_ms?: number | null
          search_request?: Json
          search_response?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: number
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      course_places: {
        Row: {
          course_id: string | null
          created_at: string | null
          distance_from_previous: number | null
          id: string
          place_id: number | null
          suggested_duration: number | null
          time_slot_id: number | null
          travel_time_from_previous: number | null
          visit_order: number
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          distance_from_previous?: number | null
          id?: string
          place_id?: number | null
          suggested_duration?: number | null
          time_slot_id?: number | null
          travel_time_from_previous?: number | null
          visit_order: number
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          distance_from_previous?: number | null
          id?: string
          place_id?: number | null
          suggested_duration?: number | null
          time_slot_id?: number | null
          travel_time_from_previous?: number | null
          visit_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_places_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "generated_courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_places_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_courses: {
        Row: {
          ai_generated: boolean | null
          course_data: Json
          created_at: string | null
          description: string | null
          difficulty: string | null
          estimated_cost_max: number | null
          estimated_cost_min: number | null
          id: string
          is_shared: boolean | null
          name: string
          region_id: number | null
          tags: string[] | null
          theme: string
          total_distance: number | null
          total_duration: number | null
          updated_at: string | null
          user_id: string | null
          weather_suitability: string | null
        }
        Insert: {
          ai_generated?: boolean | null
          course_data: Json
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_cost_max?: number | null
          estimated_cost_min?: number | null
          id?: string
          is_shared?: boolean | null
          name: string
          region_id?: number | null
          tags?: string[] | null
          theme?: string
          total_distance?: number | null
          total_duration?: number | null
          updated_at?: string | null
          user_id?: string | null
          weather_suitability?: string | null
        }
        Update: {
          ai_generated?: boolean | null
          course_data?: Json
          created_at?: string | null
          description?: string | null
          difficulty?: string | null
          estimated_cost_max?: number | null
          estimated_cost_min?: number | null
          id?: string
          is_shared?: boolean | null
          name?: string
          region_id?: number | null
          tags?: string[] | null
          theme?: string
          total_distance?: number | null
          total_duration?: number | null
          updated_at?: string | null
          user_id?: string | null
          weather_suitability?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_courses_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      place_images: {
        Row: {
          alt_text: string | null
          created_at: string | null
          display_order: number | null
          id: number
          image_url: string
          is_primary: boolean | null
          place_id: number | null
          updated_at: string | null
        }
        Insert: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: number
          image_url: string
          is_primary?: boolean | null
          place_id?: number | null
          updated_at?: string | null
        }
        Update: {
          alt_text?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: number
          image_url?: string
          is_primary?: boolean | null
          place_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "place_images_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      place_time_slots: {
        Row: {
          created_at: string | null
          id: number
          place_id: number | null
          priority: number | null
          time_slot_id: number | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          place_id?: number | null
          priority?: number | null
          time_slot_id?: number | null
        }
        Update: {
          created_at?: string | null
          id?: number
          place_id?: number | null
          priority?: number | null
          time_slot_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "place_time_slots_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_time_slots_time_slot_id_fkey"
            columns: ["time_slot_id"]
            isOneToOne: false
            referencedRelation: "time_slots"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string
          category_id: number | null
          created_at: string | null
          description: string | null
          id: number
          is_active: boolean | null
          is_partnership: boolean | null
          latitude: number | null
          longitude: number | null
          name: string
          operating_hours: Json | null
          phone: string | null
          price_range: number | null
          rating: number | null
          region_id: number | null
          source: string
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address: string
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_partnership?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name: string
          operating_hours?: Json | null
          phone?: string | null
          price_range?: number | null
          rating?: number | null
          region_id?: number | null
          source?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string
          category_id?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          is_active?: boolean | null
          is_partnership?: boolean | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          operating_hours?: Json | null
          phone?: string | null
          price_range?: number | null
          rating?: number | null
          region_id?: number | null
          source?: string
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      preference_learning_events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          target_id: string
          target_type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          target_id: string
          target_type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          target_id?: string
          target_type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      regions: {
        Row: {
          coordinates: unknown | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: number
          is_popular: boolean | null
          name: string
          parent_region_id: number | null
          region_type: string | null
          search_keywords: string[] | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          coordinates?: unknown | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          is_popular?: boolean | null
          name: string
          parent_region_id?: number | null
          region_type?: string | null
          search_keywords?: string[] | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          coordinates?: unknown | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: number
          is_popular?: boolean | null
          name?: string
          parent_region_id?: number | null
          region_type?: string | null
          search_keywords?: string[] | null
          slug?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "regions_parent_region_id_fkey"
            columns: ["parent_region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
        ]
      }
      time_slots: {
        Row: {
          created_at: string | null
          description: string | null
          end_time: string
          id: number
          name: string
          slug: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_time: string
          id?: number
          name: string
          slug: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_time?: string
          id?: number
          name?: string
          slug?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_agreements: {
        Row: {
          created_at: string | null
          id: number
          marketing_agreed: boolean
          marketing_agreed_at: string | null
          privacy_agreed: boolean
          privacy_agreed_at: string | null
          terms_agreed: boolean
          terms_agreed_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          marketing_agreed?: boolean
          marketing_agreed_at?: string | null
          privacy_agreed?: boolean
          privacy_agreed_at?: string | null
          terms_agreed?: boolean
          terms_agreed_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          marketing_agreed?: boolean
          marketing_agreed_at?: string | null
          privacy_agreed?: boolean
          privacy_agreed_at?: string | null
          terms_agreed?: boolean
          terms_agreed_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: number
          place_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          place_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          place_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          content: string
          created_at: string | null
          feedback_type: string
          id: number
          priority: string
          status: string
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          feedback_type?: string
          id?: number
          priority?: string
          status?: string
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          feedback_type?: string
          id?: number
          priority?: string
          status?: string
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          accessibility_needs: Json | null
          category_preferences: Json | null
          created_at: string | null
          group_size_preference: number | null
          id: string
          preferred_themes: string[] | null
          preferred_time_slots: string[] | null
          price_range_max: number | null
          price_range_min: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          accessibility_needs?: Json | null
          category_preferences?: Json | null
          created_at?: string | null
          group_size_preference?: number | null
          id?: string
          preferred_themes?: string[] | null
          preferred_time_slots?: string[] | null
          price_range_max?: number | null
          price_range_min?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          accessibility_needs?: Json | null
          category_preferences?: Json | null
          created_at?: string | null
          group_size_preference?: number | null
          id?: string
          preferred_themes?: string[] | null
          preferred_time_slots?: string[] | null
          price_range_max?: number | null
          price_range_min?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          id: string
          nickname: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id: string
          nickname?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          id?: string
          nickname?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_recommendation_feedback: {
        Row: {
          created_at: string | null
          feedback_type: string
          id: number
          place_id: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          feedback_type: string
          id?: number
          place_id: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          feedback_type?: string
          id?: number
          place_id?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recommendation_feedback_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: number
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          role?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: number
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      search_regions: {
        Args: { search_term: string }
        Returns: {
          id: number
          name: string
          slug: string
          description: string
          region_type: string
          parent_name: string
          match_score: number
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
