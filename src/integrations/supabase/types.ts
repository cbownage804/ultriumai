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
      conversation_files: {
        Row: {
          conversation_id: string
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_files_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      custom_gpts: {
        Row: {
          affiliate_id: string | null
          agent_capability: string | null
          agent_title: string | null
          agent_visibility: string | null
          ai_model: string | null
          anti_hallucination: boolean | null
          api_enabled: boolean
          api_key: string | null
          avatar_orientations: string | null
          avatar_url: string | null
          background_color: string | null
          background_type: string | null
          chat_count: number
          conversation_duration: string | null
          conversation_exporting: boolean | null
          conversation_retention: string | null
          conversation_sharing: boolean | null
          created_at: string
          custom_loading_message: string | null
          custom_message_ending: string | null
          description: string | null
          embed_enabled: boolean
          enable_web_search: boolean | null
          error_message: string | null
          generate_responses_from: string | null
          id: string
          integration_settings: Json | null
          is_active: boolean
          language: string | null
          loading_indicator: string | null
          logo_url: string | null
          max_integrations: number | null
          name: string
          placeholder_prompt: string | null
          preferred_model: string | null
          primary_color: string | null
          recaptcha: boolean | null
          remove_branding: boolean | null
          search_provider: string | null
          secondary_color: string | null
          should_mention_sources: boolean | null
          show_citations: string | null
          spotlight_avatar: boolean | null
          starter_questions: Json | null
          starter_questions_collapse: string | null
          starter_questions_expand: string | null
          starter_questions_header: string | null
          system_prompt: string
          terms_of_service: string | null
          theme_color: string | null
          title_color: string | null
          unknown_message: string | null
          updated_at: string
          user_avatar: boolean | null
          user_feedback: boolean | null
          user_id: string | null
          whitelisted_domains: string | null
        }
        Insert: {
          affiliate_id?: string | null
          agent_capability?: string | null
          agent_title?: string | null
          agent_visibility?: string | null
          ai_model?: string | null
          anti_hallucination?: boolean | null
          api_enabled?: boolean
          api_key?: string | null
          avatar_orientations?: string | null
          avatar_url?: string | null
          background_color?: string | null
          background_type?: string | null
          chat_count?: number
          conversation_duration?: string | null
          conversation_exporting?: boolean | null
          conversation_retention?: string | null
          conversation_sharing?: boolean | null
          created_at?: string
          custom_loading_message?: string | null
          custom_message_ending?: string | null
          description?: string | null
          embed_enabled?: boolean
          enable_web_search?: boolean | null
          error_message?: string | null
          generate_responses_from?: string | null
          id?: string
          integration_settings?: Json | null
          is_active?: boolean
          language?: string | null
          loading_indicator?: string | null
          logo_url?: string | null
          max_integrations?: number | null
          name: string
          placeholder_prompt?: string | null
          preferred_model?: string | null
          primary_color?: string | null
          recaptcha?: boolean | null
          remove_branding?: boolean | null
          search_provider?: string | null
          secondary_color?: string | null
          should_mention_sources?: boolean | null
          show_citations?: string | null
          spotlight_avatar?: boolean | null
          starter_questions?: Json | null
          starter_questions_collapse?: string | null
          starter_questions_expand?: string | null
          starter_questions_header?: string | null
          system_prompt: string
          terms_of_service?: string | null
          theme_color?: string | null
          title_color?: string | null
          unknown_message?: string | null
          updated_at?: string
          user_avatar?: boolean | null
          user_feedback?: boolean | null
          user_id?: string | null
          whitelisted_domains?: string | null
        }
        Update: {
          affiliate_id?: string | null
          agent_capability?: string | null
          agent_title?: string | null
          agent_visibility?: string | null
          ai_model?: string | null
          anti_hallucination?: boolean | null
          api_enabled?: boolean
          api_key?: string | null
          avatar_orientations?: string | null
          avatar_url?: string | null
          background_color?: string | null
          background_type?: string | null
          chat_count?: number
          conversation_duration?: string | null
          conversation_exporting?: boolean | null
          conversation_retention?: string | null
          conversation_sharing?: boolean | null
          created_at?: string
          custom_loading_message?: string | null
          custom_message_ending?: string | null
          description?: string | null
          embed_enabled?: boolean
          enable_web_search?: boolean | null
          error_message?: string | null
          generate_responses_from?: string | null
          id?: string
          integration_settings?: Json | null
          is_active?: boolean
          language?: string | null
          loading_indicator?: string | null
          logo_url?: string | null
          max_integrations?: number | null
          name?: string
          placeholder_prompt?: string | null
          preferred_model?: string | null
          primary_color?: string | null
          recaptcha?: boolean | null
          remove_branding?: boolean | null
          search_provider?: string | null
          secondary_color?: string | null
          should_mention_sources?: boolean | null
          show_citations?: string | null
          spotlight_avatar?: boolean | null
          starter_questions?: Json | null
          starter_questions_collapse?: string | null
          starter_questions_expand?: string | null
          starter_questions_header?: string | null
          system_prompt?: string
          terms_of_service?: string | null
          theme_color?: string | null
          title_color?: string | null
          unknown_message?: string | null
          updated_at?: string
          user_avatar?: boolean | null
          user_feedback?: boolean | null
          user_id?: string | null
          whitelisted_domains?: string | null
        }
        Relationships: []
      }
      gpt_documents: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          gpt_id: string | null
          id: string
          mime_type: string
          processed_content: string | null
          uploaded_at: string
          user_id: string | null
        }
        Insert: {
          file_name: string
          file_path: string
          file_size: number
          gpt_id?: string | null
          id?: string
          mime_type: string
          processed_content?: string | null
          uploaded_at?: string
          user_id?: string | null
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          gpt_id?: string | null
          id?: string
          mime_type?: string
          processed_content?: string | null
          uploaded_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gpt_documents_gpt_id_fkey"
            columns: ["gpt_id"]
            isOneToOne: false
            referencedRelation: "custom_gpts"
            referencedColumns: ["id"]
          },
        ]
      }
      gpt_integrations: {
        Row: {
          config: Json
          created_at: string
          credentials_encrypted: string | null
          gpt_id: string | null
          id: string
          integration_name: string
          integration_type: string
          is_active: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          config?: Json
          created_at?: string
          credentials_encrypted?: string | null
          gpt_id?: string | null
          id?: string
          integration_name: string
          integration_type: string
          is_active?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          config?: Json
          created_at?: string
          credentials_encrypted?: string | null
          gpt_id?: string | null
          id?: string
          integration_name?: string
          integration_type?: string
          is_active?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gpt_integrations_gpt_id_fkey"
            columns: ["gpt_id"]
            isOneToOne: false
            referencedRelation: "custom_gpts"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits_limit: number
          credits_used: number
          id: string
          reset_date: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          credits_limit?: number
          credits_used?: number
          id?: string
          reset_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          credits_limit?: number
          credits_used?: number
          id?: string
          reset_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
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
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
