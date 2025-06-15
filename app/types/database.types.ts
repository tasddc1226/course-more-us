export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      regions: {
        Row: {
          id: number
          name: string
          slug: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: number
          name: string
          slug: string
          icon: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          icon?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          icon?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          id: number
          name: string
          slug: string
          start_time: string
          end_time: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          slug: string
          start_time: string
          end_time: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          slug?: string
          start_time?: string
          end_time?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      places: {
        Row: {
          id: number
          name: string
          description: string | null
          address: string
          latitude: number
          longitude: number
          phone: string | null
          website: string | null
          rating: number
          price_range: number
          is_partnership: boolean
          operating_hours: Json | null
          tags: string[] | null
          region_id: number | null
          category_id: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          name: string
          description?: string | null
          address: string
          latitude: number
          longitude: number
          phone?: string | null
          website?: string | null
          rating?: number
          price_range?: number
          is_partnership?: boolean
          operating_hours?: Json | null
          tags?: string[] | null
          region_id?: number | null
          category_id?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          name?: string
          description?: string | null
          address?: string
          latitude?: number
          longitude?: number
          phone?: string | null
          website?: string | null
          rating?: number
          price_range?: number
          is_partnership?: boolean
          operating_hours?: Json | null
          tags?: string[] | null
          region_id?: number | null
          category_id?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "places_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          }
        ]
      }
      place_time_slots: {
        Row: {
          id: number
          place_id: number | null
          time_slot_id: number | null
          priority: number
          created_at: string
        }
        Insert: {
          id?: number
          place_id?: number | null
          time_slot_id?: number | null
          priority?: number
          created_at?: string
        }
        Update: {
          id?: number
          place_id?: number | null
          time_slot_id?: number | null
          priority?: number
          created_at?: string
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
          }
        ]
      }
      place_images: {
        Row: {
          id: number
          place_id: number | null
          image_url: string
          alt_text: string | null
          display_order: number
          is_primary: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          place_id?: number | null
          image_url: string
          alt_text?: string | null
          display_order?: number
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          place_id?: number | null
          image_url?: string
          alt_text?: string | null
          display_order?: number
          is_primary?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_images_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          id: number
          user_id: string
          role: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          role?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 