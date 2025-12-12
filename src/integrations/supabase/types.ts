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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          chunks_count: number
          created_at: string
          error_message: string | null
          id: string
          intents_count: number
          pages_crawled: number
          params: Json
          source_url: string
          status: string
          user_id: string | null
        }
        Insert: {
          chunks_count?: number
          created_at?: string
          error_message?: string | null
          id?: string
          intents_count?: number
          pages_crawled?: number
          params?: Json
          source_url: string
          status?: string
          user_id?: string | null
        }
        Update: {
          chunks_count?: number
          created_at?: string
          error_message?: string | null
          id?: string
          intents_count?: number
          pages_crawled?: number
          params?: Json
          source_url?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chunks: {
        Row: {
          analysis_id: string
          chunk_index: number
          chunk_text: string
          embedding: Json | null
          id: string
          page_id: string
        }
        Insert: {
          analysis_id: string
          chunk_index: number
          chunk_text: string
          embedding?: Json | null
          id?: string
          page_id: string
        }
        Update: {
          analysis_id?: string
          chunk_index?: number
          chunk_text?: string
          embedding?: Json | null
          id?: string
          page_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chunks_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chunks_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      edges: {
        Row: {
          analysis_id: string
          id: string
          reason: string
          source_intent_id: string
          target_intent_id: string
          weight: number
        }
        Insert: {
          analysis_id: string
          id?: string
          reason?: string
          source_intent_id: string
          target_intent_id: string
          weight?: number
        }
        Update: {
          analysis_id?: string
          id?: string
          reason?: string
          source_intent_id?: string
          target_intent_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "edges_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_source_intent_id_fkey"
            columns: ["source_intent_id"]
            isOneToOne: false
            referencedRelation: "intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edges_target_intent_id_fkey"
            columns: ["target_intent_id"]
            isOneToOne: false
            referencedRelation: "intents"
            referencedColumns: ["id"]
          },
        ]
      }
      evidence: {
        Row: {
          id: string
          intent_id: string
          page_id: string
          page_title: string
          snippet: string
          url: string
        }
        Insert: {
          id?: string
          intent_id: string
          page_id: string
          page_title?: string
          snippet: string
          url: string
        }
        Update: {
          id?: string
          intent_id?: string
          page_id?: string
          page_title?: string
          snippet?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "evidence_intent_id_fkey"
            columns: ["intent_id"]
            isOneToOne: false
            referencedRelation: "intents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      intents: {
        Row: {
          analysis_id: string
          centroid_embedding: Json | null
          color_group: string | null
          id: string
          keywords: Json
          position: Json
          size: number
          source_urls: Json
          summary: string
          title: string
        }
        Insert: {
          analysis_id: string
          centroid_embedding?: Json | null
          color_group?: string | null
          id?: string
          keywords?: Json
          position?: Json
          size?: number
          source_urls?: Json
          summary?: string
          title: string
        }
        Update: {
          analysis_id?: string
          centroid_embedding?: Json | null
          color_group?: string | null
          id?: string
          keywords?: Json
          position?: Json
          size?: number
          source_urls?: Json
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "intents_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          analysis_id: string
          content_hash: string
          extracted_text: string
          id: string
          title: string
          url: string
        }
        Insert: {
          analysis_id: string
          content_hash?: string
          extracted_text?: string
          id?: string
          title?: string
          url: string
        }
        Update: {
          analysis_id?: string
          content_hash?: string
          extracted_text?: string
          id?: string
          title?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "pages_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
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
    Enums: {},
  },
} as const
