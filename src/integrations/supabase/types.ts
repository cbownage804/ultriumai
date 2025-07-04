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
      api_keys: {
        Row: {
          created_at: string
          expires_at: string | null
          gpt_id: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          permissions: Json
          rate_limit_rpd: number | null
          rate_limit_rpm: number | null
          updated_at: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          gpt_id?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          permissions?: Json
          rate_limit_rpd?: number | null
          rate_limit_rpm?: number | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          gpt_id?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          permissions?: Json
          rate_limit_rpd?: number | null
          rate_limit_rpm?: number | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_keys_gpt_id_fkey"
            columns: ["gpt_id"]
            isOneToOne: false
            referencedRelation: "custom_gpts"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage_logs: {
        Row: {
          api_key_id: string
          created_at: string
          endpoint: string
          error_message: string | null
          gpt_id: string | null
          id: string
          ip_address: unknown | null
          method: string
          response_time_ms: number | null
          status_code: number
          tokens_used: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          created_at?: string
          endpoint: string
          error_message?: string | null
          gpt_id?: string | null
          id?: string
          ip_address?: unknown | null
          method: string
          response_time_ms?: number | null
          status_code: number
          tokens_used?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          created_at?: string
          endpoint?: string
          error_message?: string | null
          gpt_id?: string | null
          id?: string
          ip_address?: unknown | null
          method?: string
          response_time_ms?: number | null
          status_code?: number
          tokens_used?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_usage_logs_gpt_id_fkey"
            columns: ["gpt_id"]
            isOneToOne: false
            referencedRelation: "custom_gpts"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
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
      crawled_pages: {
        Row: {
          content: string | null
          content_length: number | null
          content_type: string | null
          crawl_job_id: string
          crawled_at: string
          created_at: string
          depth: number | null
          document_id: string | null
          id: string
          links_found: string[] | null
          metadata: Json | null
          parent_url: string | null
          raw_html: string | null
          status_code: number | null
          title: string | null
          url: string
          user_id: string
        }
        Insert: {
          content?: string | null
          content_length?: number | null
          content_type?: string | null
          crawl_job_id: string
          crawled_at?: string
          created_at?: string
          depth?: number | null
          document_id?: string | null
          id?: string
          links_found?: string[] | null
          metadata?: Json | null
          parent_url?: string | null
          raw_html?: string | null
          status_code?: number | null
          title?: string | null
          url: string
          user_id: string
        }
        Update: {
          content?: string | null
          content_length?: number | null
          content_type?: string | null
          crawl_job_id?: string
          crawled_at?: string
          created_at?: string
          depth?: number | null
          document_id?: string | null
          id?: string
          links_found?: string[] | null
          metadata?: Json | null
          parent_url?: string | null
          raw_html?: string | null
          status_code?: number | null
          title?: string | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crawled_pages_crawl_job_id_fkey"
            columns: ["crawl_job_id"]
            isOneToOne: false
            referencedRelation: "web_crawl_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crawled_pages_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
        ]
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
          sharing_level: string | null
          should_mention_sources: boolean | null
          show_citations: string | null
          spotlight_avatar: boolean | null
          starter_questions: Json | null
          starter_questions_collapse: string | null
          starter_questions_expand: string | null
          starter_questions_header: string | null
          system_prompt: string
          team_id: string | null
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
          sharing_level?: string | null
          should_mention_sources?: boolean | null
          show_citations?: string | null
          spotlight_avatar?: boolean | null
          starter_questions?: Json | null
          starter_questions_collapse?: string | null
          starter_questions_expand?: string | null
          starter_questions_header?: string | null
          system_prompt: string
          team_id?: string | null
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
          sharing_level?: string | null
          should_mention_sources?: boolean | null
          show_citations?: string | null
          spotlight_avatar?: boolean | null
          starter_questions?: Json | null
          starter_questions_collapse?: string | null
          starter_questions_expand?: string | null
          starter_questions_header?: string | null
          system_prompt?: string
          team_id?: string | null
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
        Relationships: [
          {
            foreignKeyName: "custom_gpts_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_analytics: {
        Row: {
          average_response_time_ms: number | null
          average_satisfaction: number | null
          created_at: string
          date: string
          gpt_id: string
          id: string
          total_conversations: number | null
          total_messages: number | null
          total_tokens: number | null
          unique_users: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          average_response_time_ms?: number | null
          average_satisfaction?: number | null
          created_at?: string
          date: string
          gpt_id: string
          id?: string
          total_conversations?: number | null
          total_messages?: number | null
          total_tokens?: number | null
          unique_users?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          average_response_time_ms?: number | null
          average_satisfaction?: number | null
          created_at?: string
          date?: string
          gpt_id?: string
          id?: string
          total_conversations?: number | null
          total_messages?: number | null
          total_tokens?: number | null
          unique_users?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      gpt_analytics: {
        Row: {
          created_at: string
          gpt_id: string
          id: string
          interaction_type: string
          metadata: Json | null
          response_time_ms: number | null
          satisfaction_rating: number | null
          session_id: string | null
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          gpt_id: string
          id?: string
          interaction_type: string
          metadata?: Json | null
          response_time_ms?: number | null
          satisfaction_rating?: number | null
          session_id?: string | null
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          gpt_id?: string
          id?: string
          interaction_type?: string
          metadata?: Json | null
          response_time_ms?: number | null
          satisfaction_rating?: number | null
          session_id?: string | null
          tokens_used?: number | null
          user_id?: string | null
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
      knowledge_chunks: {
        Row: {
          chunk_index: number
          content: string
          content_type: string | null
          created_at: string
          document_id: string
          embedding: string | null
          id: string
          metadata: Json | null
          source_id: string
          token_count: number | null
          user_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          content_type?: string | null
          created_at?: string
          document_id: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id: string
          token_count?: number | null
          user_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          content_type?: string | null
          created_at?: string
          document_id?: string
          embedding?: string | null
          id?: string
          metadata?: Json | null
          source_id?: string
          token_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "knowledge_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_chunks_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_documents: {
        Row: {
          chunk_count: number | null
          content_hash: string | null
          created_at: string
          error_message: string | null
          file_name: string
          file_path: string | null
          file_size: number
          file_url: string | null
          id: string
          metadata: Json | null
          mime_type: string
          page_count: number | null
          processed_at: string | null
          processed_content: string | null
          processing_settings: Json | null
          raw_content: string | null
          source_id: string
          status: string
          updated_at: string
          uploaded_at: string
          user_id: string
          word_count: number | null
        }
        Insert: {
          chunk_count?: number | null
          content_hash?: string | null
          created_at?: string
          error_message?: string | null
          file_name: string
          file_path?: string | null
          file_size: number
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type: string
          page_count?: number | null
          processed_at?: string | null
          processed_content?: string | null
          processing_settings?: Json | null
          raw_content?: string | null
          source_id: string
          status?: string
          updated_at?: string
          uploaded_at?: string
          user_id: string
          word_count?: number | null
        }
        Update: {
          chunk_count?: number | null
          content_hash?: string | null
          created_at?: string
          error_message?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number
          file_url?: string | null
          id?: string
          metadata?: Json | null
          mime_type?: string
          page_count?: number | null
          processed_at?: string | null
          processed_content?: string | null
          processing_settings?: Json | null
          raw_content?: string | null
          source_id?: string
          status?: string
          updated_at?: string
          uploaded_at?: string
          user_id?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_documents_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_searches: {
        Row: {
          created_at: string
          gpt_id: string | null
          id: string
          metadata: Json | null
          query: string
          response_time_ms: number | null
          results_count: number | null
          search_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          gpt_id?: string | null
          id?: string
          metadata?: Json | null
          query: string
          response_time_ms?: number | null
          results_count?: number | null
          search_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          gpt_id?: string | null
          id?: string
          metadata?: Json | null
          query?: string
          response_time_ms?: number | null
          results_count?: number | null
          search_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_searches_gpt_id_fkey"
            columns: ["gpt_id"]
            isOneToOne: false
            referencedRelation: "custom_gpts"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_sources: {
        Row: {
          auto_sync: boolean | null
          created_at: string
          description: string | null
          error_message: string | null
          file_count: number | null
          gpt_id: string | null
          id: string
          last_synced_at: string | null
          metadata: Json | null
          name: string
          next_sync_at: string | null
          source_type: string
          source_url: string | null
          status: string
          sync_frequency: string | null
          sync_settings: Json | null
          total_size_bytes: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_sync?: boolean | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          file_count?: number | null
          gpt_id?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          name: string
          next_sync_at?: string | null
          source_type: string
          source_url?: string | null
          status?: string
          sync_frequency?: string | null
          sync_settings?: Json | null
          total_size_bytes?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_sync?: boolean | null
          created_at?: string
          description?: string | null
          error_message?: string | null
          file_count?: number | null
          gpt_id?: string | null
          id?: string
          last_synced_at?: string | null
          metadata?: Json | null
          name?: string
          next_sync_at?: string | null
          source_type?: string
          source_url?: string | null
          status?: string
          sync_frequency?: string | null
          sync_settings?: Json | null
          total_size_bytes?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_sources_gpt_id_fkey"
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
      security_app_subscriptions: {
        Row: {
          app_id: string
          app_name: string
          created_at: string
          expires_at: string | null
          id: string
          status: string
          stripe_subscription_id: string | null
          updated_at: string
          usage_current: number | null
          usage_limit: number | null
          user_id: string
        }
        Insert: {
          app_id: string
          app_name: string
          created_at?: string
          expires_at?: string | null
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          usage_current?: number | null
          usage_limit?: number | null
          user_id: string
        }
        Update: {
          app_id?: string
          app_name?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          usage_current?: number | null
          usage_limit?: number | null
          user_id?: string
        }
        Relationships: []
      }
      security_settings: {
        Row: {
          account_locked_until: string | null
          backup_codes: string[] | null
          created_at: string
          failed_login_attempts: number | null
          id: string
          ip_whitelist: string[] | null
          last_failed_login_at: string | null
          login_notifications: boolean | null
          session_timeout_minutes: number | null
          two_factor_enabled: boolean | null
          two_factor_secret: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_locked_until?: string | null
          backup_codes?: string[] | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          ip_whitelist?: string[] | null
          last_failed_login_at?: string | null
          login_notifications?: boolean | null
          session_timeout_minutes?: number | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_locked_until?: string | null
          backup_codes?: string[] | null
          created_at?: string
          failed_login_attempts?: number | null
          id?: string
          ip_whitelist?: string[] | null
          last_failed_login_at?: string | null
          login_notifications?: boolean | null
          session_timeout_minutes?: number | null
          two_factor_enabled?: boolean | null
          two_factor_secret?: string | null
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
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          is_active: boolean | null
          role: string
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          is_active?: boolean | null
          role?: string
          team_id: string
          token: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          is_active?: boolean | null
          role?: string
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          is_active: boolean | null
          joined_at: string | null
          role: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          role?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_members: number | null
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          name?: string
          owner_id?: string
          updated_at?: string
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
      user_sessions: {
        Row: {
          created_at: string
          gpt_id: string | null
          id: string
          ip_address: unknown | null
          session_end: string | null
          session_start: string
          total_messages: number | null
          total_tokens: number | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          gpt_id?: string | null
          id?: string
          ip_address?: unknown | null
          session_end?: string | null
          session_start?: string
          total_messages?: number | null
          total_tokens?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          gpt_id?: string | null
          id?: string
          ip_address?: unknown | null
          session_end?: string | null
          session_start?: string
          total_messages?: number | null
          total_tokens?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      web_crawl_jobs: {
        Row: {
          allowed_domains: string[] | null
          completed_at: string | null
          crawl_settings: Json | null
          created_at: string
          error_message: string | null
          exclude_patterns: string[] | null
          id: string
          max_depth: number | null
          max_pages: number | null
          pages_crawled: number | null
          pages_found: number | null
          pages_processed: number | null
          source_id: string
          start_url: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_domains?: string[] | null
          completed_at?: string | null
          crawl_settings?: Json | null
          created_at?: string
          error_message?: string | null
          exclude_patterns?: string[] | null
          id?: string
          max_depth?: number | null
          max_pages?: number | null
          pages_crawled?: number | null
          pages_found?: number | null
          pages_processed?: number | null
          source_id: string
          start_url: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_domains?: string[] | null
          completed_at?: string | null
          crawl_settings?: Json | null
          created_at?: string
          error_message?: string | null
          exclude_patterns?: string[] | null
          id?: string
          max_depth?: number | null
          max_pages?: number | null
          pages_crawled?: number | null
          pages_found?: number | null
          pages_processed?: number | null
          source_id?: string
          start_url?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_crawl_jobs_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "knowledge_sources"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      get_user_roles: {
        Args: { _user_id: string }
        Returns: {
          role: Database["public"]["Enums"]["app_role"]
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: unknown
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
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
