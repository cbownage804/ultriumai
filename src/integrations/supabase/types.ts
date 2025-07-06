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
      action_execution_logs: {
        Row: {
          action_id: string | null
          created_at: string
          error_message: string | null
          execution_status: string
          execution_time_ms: number | null
          gpt_id: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          user_id: string
        }
        Insert: {
          action_id?: string | null
          created_at?: string
          error_message?: string | null
          execution_status: string
          execution_time_ms?: number | null
          gpt_id?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          user_id: string
        }
        Update: {
          action_id?: string | null
          created_at?: string
          error_message?: string | null
          execution_status?: string
          execution_time_ms?: number | null
          gpt_id?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "action_execution_logs_action_id_fkey"
            columns: ["action_id"]
            isOneToOne: false
            referencedRelation: "gpt_actions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "action_execution_logs_gpt_id_fkey"
            columns: ["gpt_id"]
            isOneToOne: false
            referencedRelation: "custom_gpts"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_trails: {
        Row: {
          action: string
          admin_email: string
          admin_user_id: string
          created_at: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          resource_id: string | null
          resource_name: string | null
          resource_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_email: string
          admin_user_id: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_name?: string | null
          resource_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          resource_id?: string | null
          resource_name?: string | null
          resource_type?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      alert_notifications: {
        Row: {
          alert_rule_id: string | null
          created_at: string
          error_message: string | null
          id: string
          notification_type: string
          recipient: string
          security_event_id: string | null
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          alert_rule_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type: string
          recipient: string
          security_event_id?: string | null
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          alert_rule_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          notification_type?: string
          recipient?: string
          security_event_id?: string | null
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_notifications_alert_rule_id_fkey"
            columns: ["alert_rule_id"]
            isOneToOne: false
            referencedRelation: "alert_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "alert_notifications_security_event_id_fkey"
            columns: ["security_event_id"]
            isOneToOne: false
            referencedRelation: "security_events"
            referencedColumns: ["id"]
          },
        ]
      }
      alert_rules: {
        Row: {
          conditions: Json
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          notification_channels: Json
          severity_threshold: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conditions: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          notification_channels?: Json
          severity_threshold: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conditions?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notification_channels?: Json
          severity_threshold?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      antivirus_scans: {
        Row: {
          client_id: string
          completed_at: string | null
          files_scanned: number | null
          hostname: string
          id: string
          scan_duration: number | null
          scan_results: Json | null
          scan_type: string
          started_at: string
          threats_found: number | null
          threats_quarantined: number | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          files_scanned?: number | null
          hostname: string
          id?: string
          scan_duration?: number | null
          scan_results?: Json | null
          scan_type: string
          started_at?: string
          threats_found?: number | null
          threats_quarantined?: number | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          files_scanned?: number | null
          hostname?: string
          id?: string
          scan_duration?: number | null
          scan_results?: Json | null
          scan_type?: string
          started_at?: string
          threats_found?: number | null
          threats_quarantined?: number | null
        }
        Relationships: []
      }
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
      compliance_alerts: {
        Row: {
          alert_type: string
          assigned_to: string | null
          control_id: string | null
          created_at: string
          description: string
          framework: string | null
          id: string
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          source_connector_id: string | null
          source_data_id: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          assigned_to?: string | null
          control_id?: string | null
          created_at?: string
          description: string
          framework?: string | null
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity: string
          source_connector_id?: string | null
          source_data_id?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          assigned_to?: string | null
          control_id?: string | null
          created_at?: string
          description?: string
          framework?: string | null
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          source_connector_id?: string | null
          source_data_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_alerts_source_connector_id_fkey"
            columns: ["source_connector_id"]
            isOneToOne: false
            referencedRelation: "compliance_connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_alerts_source_data_id_fkey"
            columns: ["source_data_id"]
            isOneToOne: false
            referencedRelation: "compliance_data"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_connectors: {
        Row: {
          configuration: Json
          connector_name: string
          connector_type: string
          created_at: string
          error_message: string | null
          id: string
          last_sync_at: string | null
          metadata: Json | null
          next_sync_at: string | null
          status: string
          sync_frequency: string
          updated_at: string
          user_id: string
        }
        Insert: {
          configuration?: Json
          connector_name: string
          connector_type: string
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          next_sync_at?: string | null
          status?: string
          sync_frequency?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          configuration?: Json
          connector_name?: string
          connector_type?: string
          created_at?: string
          error_message?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          next_sync_at?: string | null
          status?: string
          sync_frequency?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_data: {
        Row: {
          compliance_status: string | null
          connector_id: string
          created_at: string
          data_source: string
          data_type: string
          evidence_collected: boolean | null
          evidence_path: string | null
          framework_mappings: Json | null
          id: string
          processed_data: Json | null
          raw_data: Json
          risk_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          compliance_status?: string | null
          connector_id: string
          created_at?: string
          data_source: string
          data_type: string
          evidence_collected?: boolean | null
          evidence_path?: string | null
          framework_mappings?: Json | null
          id?: string
          processed_data?: Json | null
          raw_data: Json
          risk_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          compliance_status?: string | null
          connector_id?: string
          created_at?: string
          data_source?: string
          data_type?: string
          evidence_collected?: boolean | null
          evidence_path?: string | null
          framework_mappings?: Json | null
          id?: string
          processed_data?: Json | null
          raw_data?: Json
          risk_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_data_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "compliance_connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_evidence: {
        Row: {
          collected_at: string
          collected_by: string | null
          control_id: string
          created_at: string
          description: string | null
          evidence_type: string
          file_path: string | null
          file_url: string | null
          framework: string
          id: string
          metadata: Json | null
          title: string
          user_id: string
          verification_status: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          collected_at?: string
          collected_by?: string | null
          control_id: string
          created_at?: string
          description?: string | null
          evidence_type: string
          file_path?: string | null
          file_url?: string | null
          framework: string
          id?: string
          metadata?: Json | null
          title: string
          user_id: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          collected_at?: string
          collected_by?: string | null
          control_id?: string
          created_at?: string
          description?: string | null
          evidence_type?: string
          file_path?: string | null
          file_url?: string | null
          framework?: string
          id?: string
          metadata?: Json | null
          title?: string
          user_id?: string
          verification_status?: string | null
          verified_at?: string | null
          verified_by?: string | null
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
      event_correlations: {
        Row: {
          confidence_score: number | null
          correlation_id: string
          correlation_type: string
          created_at: string
          id: string
          primary_event_id: string
          related_event_id: string
        }
        Insert: {
          confidence_score?: number | null
          correlation_id: string
          correlation_type: string
          created_at?: string
          id?: string
          primary_event_id: string
          related_event_id: string
        }
        Update: {
          confidence_score?: number | null
          correlation_id?: string
          correlation_type?: string
          created_at?: string
          id?: string
          primary_event_id?: string
          related_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_correlations_primary_event_id_fkey"
            columns: ["primary_event_id"]
            isOneToOne: false
            referencedRelation: "security_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_correlations_related_event_id_fkey"
            columns: ["related_event_id"]
            isOneToOne: false
            referencedRelation: "security_events"
            referencedColumns: ["id"]
          },
        ]
      }
      gpt_actions: {
        Row: {
          action_type: string
          config: Json
          created_at: string
          description: string | null
          gpt_id: string | null
          id: string
          is_beta: boolean
          is_enabled: boolean
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: string
          config?: Json
          created_at?: string
          description?: string | null
          gpt_id?: string | null
          id?: string
          is_beta?: boolean
          is_enabled?: boolean
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: string
          config?: Json
          created_at?: string
          description?: string | null
          gpt_id?: string | null
          id?: string
          is_beta?: boolean
          is_enabled?: boolean
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gpt_actions_gpt_id_fkey"
            columns: ["gpt_id"]
            isOneToOne: false
            referencedRelation: "custom_gpts"
            referencedColumns: ["id"]
          },
        ]
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
      incident_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string
          id: string
          incident_id: string
          metadata: Json | null
          new_value: string | null
          old_value: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string
          description: string
          id?: string
          incident_id: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string
          id?: string
          incident_id?: string
          metadata?: Json | null
          new_value?: string | null
          old_value?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_activities_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          incident_id: string
          is_internal: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          incident_id: string
          is_internal?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          incident_id?: string
          is_internal?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          affected_systems: string[] | null
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          category: string | null
          created_at: string
          description: string | null
          escalated_at: string | null
          escalated_to: string | null
          escalation_level: number | null
          escalation_reason: string | null
          first_response_at: string | null
          id: string
          impact_assessment: string | null
          priority: string
          related_events: string[] | null
          resolution_sla_minutes: number | null
          resolved_at: string | null
          response_sla_minutes: number | null
          severity: string
          sla_deadline: string | null
          source_event_id: string | null
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affected_systems?: string[] | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_level?: number | null
          escalation_reason?: string | null
          first_response_at?: string | null
          id?: string
          impact_assessment?: string | null
          priority?: string
          related_events?: string[] | null
          resolution_sla_minutes?: number | null
          resolved_at?: string | null
          response_sla_minutes?: number | null
          severity?: string
          sla_deadline?: string | null
          source_event_id?: string | null
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affected_systems?: string[] | null
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          description?: string | null
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_level?: number | null
          escalation_reason?: string | null
          first_response_at?: string | null
          id?: string
          impact_assessment?: string | null
          priority?: string
          related_events?: string[] | null
          resolution_sla_minutes?: number | null
          resolved_at?: string | null
          response_sla_minutes?: number | null
          severity?: string
          sla_deadline?: string | null
          source_event_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      msp_clients: {
        Row: {
          api_enabled: boolean | null
          billing_status: string | null
          company_name: string
          contact_email: string
          contact_name: string
          created_at: string
          current_users: number | null
          custom_branding: Json | null
          domain: string | null
          id: string
          integration_settings: Json | null
          is_active: boolean | null
          last_billed_at: string | null
          max_users: number | null
          monthly_rate: number
          msp_id: string
          phone: string | null
          trial_ends_at: string | null
          updated_at: string
          webapp_enabled: boolean | null
          widget_enabled: boolean | null
        }
        Insert: {
          api_enabled?: boolean | null
          billing_status?: string | null
          company_name: string
          contact_email: string
          contact_name: string
          created_at?: string
          current_users?: number | null
          custom_branding?: Json | null
          domain?: string | null
          id?: string
          integration_settings?: Json | null
          is_active?: boolean | null
          last_billed_at?: string | null
          max_users?: number | null
          monthly_rate: number
          msp_id: string
          phone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          webapp_enabled?: boolean | null
          widget_enabled?: boolean | null
        }
        Update: {
          api_enabled?: boolean | null
          billing_status?: string | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          created_at?: string
          current_users?: number | null
          custom_branding?: Json | null
          domain?: string | null
          id?: string
          integration_settings?: Json | null
          is_active?: boolean | null
          last_billed_at?: string | null
          max_users?: number | null
          monthly_rate?: number
          msp_id?: string
          phone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          webapp_enabled?: boolean | null
          widget_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "msp_clients_msp_id_fkey"
            columns: ["msp_id"]
            isOneToOne: false
            referencedRelation: "msps"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_revenue: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          client_charge: number
          client_id: string
          created_at: string
          id: string
          msp_id: string
          msp_profit: number
          status: string | null
          ultrium_fee: number
          updated_at: string
          users_count: number
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          client_charge: number
          client_id: string
          created_at?: string
          id?: string
          msp_id: string
          msp_profit: number
          status?: string | null
          ultrium_fee: number
          updated_at?: string
          users_count: number
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          client_charge?: number
          client_id?: string
          created_at?: string
          id?: string
          msp_id?: string
          msp_profit?: number
          status?: string | null
          ultrium_fee?: number
          updated_at?: string
          users_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "msp_revenue_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "msp_revenue_msp_id_fkey"
            columns: ["msp_id"]
            isOneToOne: false
            referencedRelation: "msps"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_usage_logs: {
        Row: {
          action: string
          client_id: string
          created_at: string
          id: string
          metadata: Json | null
          msp_id: string
          user_email: string
          widget_type: string | null
        }
        Insert: {
          action: string
          client_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          msp_id: string
          user_email: string
          widget_type?: string | null
        }
        Update: {
          action?: string
          client_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          msp_id?: string
          user_email?: string
          widget_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "msp_usage_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "msp_usage_logs_msp_id_fkey"
            columns: ["msp_id"]
            isOneToOne: false
            referencedRelation: "msps"
            referencedColumns: ["id"]
          },
        ]
      }
      msps: {
        Row: {
          address: string | null
          brand_color: string | null
          brand_name: string | null
          commission_rate: number | null
          company_name: string
          contact_email: string
          created_at: string
          domain: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          max_clients: number | null
          monthly_rate_per_user: number | null
          phone: string | null
          secondary_color: string | null
          subscription_tier: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          brand_color?: string | null
          brand_name?: string | null
          commission_rate?: number | null
          company_name: string
          contact_email: string
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_clients?: number | null
          monthly_rate_per_user?: number | null
          phone?: string | null
          secondary_color?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          brand_color?: string | null
          brand_name?: string | null
          commission_rate?: number | null
          company_name?: string
          contact_email?: string
          created_at?: string
          domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          max_clients?: number | null
          monthly_rate_per_user?: number | null
          phone?: string | null
          secondary_color?: string | null
          subscription_tier?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      network_assets: {
        Row: {
          connector_id: string | null
          created_at: string
          device_type: string | null
          hostname: string | null
          id: string
          ip_address: string
          last_seen: string
          mac_address: string | null
          manufacturer: string | null
          open_ports: number[] | null
          os_info: string | null
          risk_level: string
          status: string
          updated_at: string
          user_id: string
          vulnerabilities: string[] | null
        }
        Insert: {
          connector_id?: string | null
          created_at?: string
          device_type?: string | null
          hostname?: string | null
          id?: string
          ip_address: string
          last_seen?: string
          mac_address?: string | null
          manufacturer?: string | null
          open_ports?: number[] | null
          os_info?: string | null
          risk_level?: string
          status?: string
          updated_at?: string
          user_id: string
          vulnerabilities?: string[] | null
        }
        Update: {
          connector_id?: string | null
          created_at?: string
          device_type?: string | null
          hostname?: string | null
          id?: string
          ip_address?: string
          last_seen?: string
          mac_address?: string | null
          manufacturer?: string | null
          open_ports?: number[] | null
          os_info?: string | null
          risk_level?: string
          status?: string
          updated_at?: string
          user_id?: string
          vulnerabilities?: string[] | null
        }
        Relationships: []
      }
      password_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown | null
          password_entry_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          password_entry_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown | null
          password_entry_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_audit_logs_password_entry_id_fkey"
            columns: ["password_entry_id"]
            isOneToOne: false
            referencedRelation: "password_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      password_entries: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_shared: boolean | null
          last_used_at: string | null
          msp_client_id: string | null
          name: string
          notes: string | null
          password_encrypted: string
          shared_with: string[] | null
          strength_score: number | null
          tags: string[] | null
          updated_at: string
          user_id: string
          username: string | null
          vault_id: string
          website: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_shared?: boolean | null
          last_used_at?: string | null
          msp_client_id?: string | null
          name: string
          notes?: string | null
          password_encrypted: string
          shared_with?: string[] | null
          strength_score?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          username?: string | null
          vault_id: string
          website?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_shared?: boolean | null
          last_used_at?: string | null
          msp_client_id?: string | null
          name?: string
          notes?: string | null
          password_encrypted?: string
          shared_with?: string[] | null
          strength_score?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          username?: string | null
          vault_id?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "password_entries_msp_client_id_fkey"
            columns: ["msp_client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_entries_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "password_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      password_vaults: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_shared: boolean | null
          msp_client_id: string | null
          name: string
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_shared?: boolean | null
          msp_client_id?: string | null
          name: string
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_shared?: boolean | null
          msp_client_id?: string | null
          name?: string
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "password_vaults_msp_client_id_fkey"
            columns: ["msp_client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "password_vaults_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          avatar_url: string | null
          bio: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      rmm_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          client_id: string
          created_at: string
          id: string
          message: string | null
          metadata: Json | null
          resolved_at: string | null
          severity: string
          source: string
          status: string
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          client_id: string
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          resolved_at?: string | null
          severity: string
          source: string
          status?: string
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          client_id?: string
          created_at?: string
          id?: string
          message?: string | null
          metadata?: Json | null
          resolved_at?: string | null
          severity?: string
          source?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      rmm_command_logs: {
        Row: {
          client_id: string
          command: string
          executed_at: string
          executed_by: string | null
          hostname: string
          id: string
          parameters: Json | null
          result: Json | null
        }
        Insert: {
          client_id: string
          command: string
          executed_at?: string
          executed_by?: string | null
          hostname: string
          id?: string
          parameters?: Json | null
          result?: Json | null
        }
        Update: {
          client_id?: string
          command?: string
          executed_at?: string
          executed_by?: string | null
          hostname?: string
          id?: string
          parameters?: Json | null
          result?: Json | null
        }
        Relationships: []
      }
      rmm_endpoints: {
        Row: {
          agent_version: string | null
          client_id: string
          cpu_info: string | null
          created_at: string
          disk_info: Json | null
          hostname: string
          id: string
          last_seen: string | null
          memory_available: number | null
          memory_total: number | null
          network_interfaces: Json | null
          os_info: string | null
          status: string
          updated_at: string
        }
        Insert: {
          agent_version?: string | null
          client_id: string
          cpu_info?: string | null
          created_at?: string
          disk_info?: Json | null
          hostname: string
          id?: string
          last_seen?: string | null
          memory_available?: number | null
          memory_total?: number | null
          network_interfaces?: Json | null
          os_info?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          agent_version?: string | null
          client_id?: string
          cpu_info?: string | null
          created_at?: string
          disk_info?: Json | null
          hostname?: string
          id?: string
          last_seen?: string | null
          memory_available?: number | null
          memory_total?: number | null
          network_interfaces?: Json | null
          os_info?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      rmm_metrics: {
        Row: {
          antivirus_status: Json | null
          client_id: string
          collected_at: string
          cpu_usage: number | null
          disk_usage: number | null
          hostname: string
          id: string
          memory_usage: number | null
          network_io: number | null
          processes_count: number | null
          services_count: number | null
        }
        Insert: {
          antivirus_status?: Json | null
          client_id: string
          collected_at?: string
          cpu_usage?: number | null
          disk_usage?: number | null
          hostname: string
          id?: string
          memory_usage?: number | null
          network_io?: number | null
          processes_count?: number | null
          services_count?: number | null
        }
        Update: {
          antivirus_status?: Json | null
          client_id?: string
          collected_at?: string
          cpu_usage?: number | null
          disk_usage?: number | null
          hostname?: string
          id?: string
          memory_usage?: number | null
          network_io?: number | null
          processes_count?: number | null
          services_count?: number | null
        }
        Relationships: []
      }
      safedoc_scan_results: {
        Row: {
          created_at: string
          description: string | null
          engine_name: string
          id: string
          recommendation: string | null
          scan_id: string
          severity: string | null
          threat_name: string | null
          threat_type: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          engine_name: string
          id?: string
          recommendation?: string | null
          scan_id: string
          severity?: string | null
          threat_name?: string | null
          threat_type?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          engine_name?: string
          id?: string
          recommendation?: string | null
          scan_id?: string
          severity?: string | null
          threat_name?: string | null
          threat_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_scan_results_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "safedoc_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_scans: {
        Row: {
          client_id: string | null
          completed_at: string | null
          created_at: string
          expires_at: string | null
          file_hash: string
          file_name: string
          file_size: number
          id: string
          metadata: Json | null
          mime_type: string
          msp_id: string | null
          scan_engine: string | null
          scan_results: Json | null
          scan_status: string | null
          threat_level: string | null
          threats_found: number | null
          user_email: string
        }
        Insert: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          file_hash: string
          file_name: string
          file_size: number
          id?: string
          metadata?: Json | null
          mime_type: string
          msp_id?: string | null
          scan_engine?: string | null
          scan_results?: Json | null
          scan_status?: string | null
          threat_level?: string | null
          threats_found?: number | null
          user_email: string
        }
        Update: {
          client_id?: string | null
          completed_at?: string | null
          created_at?: string
          expires_at?: string | null
          file_hash?: string
          file_name?: string
          file_size?: number
          id?: string
          metadata?: Json | null
          mime_type?: string
          msp_id?: string | null
          scan_engine?: string | null
          scan_results?: Json | null
          scan_status?: string | null
          threat_level?: string | null
          threats_found?: number | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_scans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safedoc_scans_msp_id_fkey"
            columns: ["msp_id"]
            isOneToOne: false
            referencedRelation: "msps"
            referencedColumns: ["id"]
          },
        ]
      }
      safeweb_assets: {
        Row: {
          asset_type: string
          asset_value: string
          created_at: string
          id: string
          last_scan_at: string | null
          metadata: Json
          msp_client_id: string | null
          next_scan_at: string
          scan_frequency: string
          status: string
          threats_found: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_type: string
          asset_value: string
          created_at?: string
          id?: string
          last_scan_at?: string | null
          metadata?: Json
          msp_client_id?: string | null
          next_scan_at?: string
          scan_frequency?: string
          status?: string
          threats_found?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_type?: string
          asset_value?: string
          created_at?: string
          id?: string
          last_scan_at?: string | null
          metadata?: Json
          msp_client_id?: string | null
          next_scan_at?: string
          scan_frequency?: string
          status?: string
          threats_found?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safeweb_msp_billing: {
        Row: {
          asset_count: number
          billing_period_end: string
          billing_period_start: string
          client_charge: number
          client_id: string
          created_at: string
          id: string
          invoice_id: string | null
          metadata: Json
          msp_profit: number
          msp_user_id: string
          paid_at: string | null
          status: string
          threat_count: number
          ultrium_fee: number
        }
        Insert: {
          asset_count?: number
          billing_period_end: string
          billing_period_start: string
          client_charge: number
          client_id: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          msp_profit: number
          msp_user_id: string
          paid_at?: string | null
          status?: string
          threat_count?: number
          ultrium_fee: number
        }
        Update: {
          asset_count?: number
          billing_period_end?: string
          billing_period_start?: string
          client_charge?: number
          client_id?: string
          created_at?: string
          id?: string
          invoice_id?: string | null
          metadata?: Json
          msp_profit?: number
          msp_user_id?: string
          paid_at?: string | null
          status?: string
          threat_count?: number
          ultrium_fee?: number
        }
        Relationships: []
      }
      safeweb_msp_clients: {
        Row: {
          billing_cycle_start: string
          billing_email: string | null
          branding: Json
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          domain: string | null
          id: string
          last_billed_at: string | null
          max_assets: number
          monthly_price: number
          msp_user_id: string
          next_billing_date: string
          settings: Json
          subscription_plan: string
          subscription_status: string
          trial_ends_at: string
          updated_at: string
        }
        Insert: {
          billing_cycle_start?: string
          billing_email?: string | null
          branding?: Json
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          last_billed_at?: string | null
          max_assets?: number
          monthly_price?: number
          msp_user_id: string
          next_billing_date?: string
          settings?: Json
          subscription_plan?: string
          subscription_status?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Update: {
          billing_cycle_start?: string
          billing_email?: string | null
          branding?: Json
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          last_billed_at?: string | null
          max_assets?: number
          monthly_price?: number
          msp_user_id?: string
          next_billing_date?: string
          settings?: Json
          subscription_plan?: string
          subscription_status?: string
          trial_ends_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      safeweb_scan_jobs: {
        Row: {
          asset_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          job_type: string
          scan_results: Json
          scan_sources: string[]
          started_at: string | null
          status: string
          threats_found: number
          user_id: string
        }
        Insert: {
          asset_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type: string
          scan_results?: Json
          scan_sources?: string[]
          started_at?: string | null
          status?: string
          threats_found?: number
          user_id: string
        }
        Update: {
          asset_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          job_type?: string
          scan_results?: Json
          scan_sources?: string[]
          started_at?: string | null
          status?: string
          threats_found?: number
          user_id?: string
        }
        Relationships: []
      }
      safeweb_sources: {
        Row: {
          api_config: Json
          base_url: string | null
          created_at: string
          id: string
          is_active: boolean
          last_accessed: string | null
          name: string
          reliability_score: number
          source_type: string
        }
        Insert: {
          api_config?: Json
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_accessed?: string | null
          name: string
          reliability_score?: number
          source_type: string
        }
        Update: {
          api_config?: Json
          base_url?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_accessed?: string | null
          name?: string
          reliability_score?: number
          source_type?: string
        }
        Relationships: []
      }
      safeweb_threats: {
        Row: {
          affected_assets: string[]
          asset_id: string | null
          confidence_score: number
          created_at: string
          description: string
          first_seen: string
          id: string
          last_seen: string
          msp_client_id: string | null
          raw_data: Json
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_name: string
          source_url: string | null
          status: string
          tags: string[]
          threat_indicators: Json
          threat_type: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affected_assets?: string[]
          asset_id?: string | null
          confidence_score?: number
          created_at?: string
          description: string
          first_seen?: string
          id?: string
          last_seen?: string
          msp_client_id?: string | null
          raw_data?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          source_name: string
          source_url?: string | null
          status?: string
          tags?: string[]
          threat_indicators?: Json
          threat_type: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affected_assets?: string[]
          asset_id?: string | null
          confidence_score?: number
          created_at?: string
          description?: string
          first_seen?: string
          id?: string
          last_seen?: string
          msp_client_id?: string | null
          raw_data?: Json
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_name?: string
          source_url?: string | null
          status?: string
          tags?: string[]
          threat_indicators?: Json
          threat_type?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_safeweb_threats_asset_id"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "safeweb_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      security_app_subscriptions: {
        Row: {
          app_id: string
          app_name: string
          created_at: string
          expires_at: string | null
          id: string
          safedoc_enabled: boolean | null
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
          safedoc_enabled?: boolean | null
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
          safedoc_enabled?: boolean | null
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string
          usage_current?: number | null
          usage_limit?: number | null
          user_id?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          affected_assets: string[] | null
          correlation_id: string | null
          created_at: string
          description: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          raw_data: Json | null
          severity: string
          source_app: string
          status: string
          threat_indicators: string[] | null
          title: string
          updated_at: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          affected_assets?: string[] | null
          correlation_id?: string | null
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          raw_data?: Json | null
          severity: string
          source_app: string
          status?: string
          threat_indicators?: string[] | null
          title: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          affected_assets?: string[] | null
          correlation_id?: string | null
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          raw_data?: Json | null
          severity?: string
          source_app?: string
          status?: string
          threat_indicators?: string[] | null
          title?: string
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
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
      software_deployments: {
        Row: {
          client_id: string
          completed_at: string | null
          deployment_log: string | null
          deployment_status: string
          hostname: string
          id: string
          package_id: string
          started_at: string
          started_by: string | null
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          deployment_log?: string | null
          deployment_status?: string
          hostname: string
          id?: string
          package_id: string
          started_at?: string
          started_by?: string | null
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          deployment_log?: string | null
          deployment_status?: string
          hostname?: string
          id?: string
          package_id?: string
          started_at?: string
          started_by?: string | null
        }
        Relationships: []
      }
      software_inventory: {
        Row: {
          client_id: string
          hostname: string
          id: string
          install_date: string | null
          last_seen: string
          publisher: string | null
          software_name: string
          version: string | null
        }
        Insert: {
          client_id: string
          hostname: string
          id?: string
          install_date?: string | null
          last_seen?: string
          publisher?: string | null
          software_name: string
          version?: string | null
        }
        Update: {
          client_id?: string
          hostname?: string
          id?: string
          install_date?: string | null
          last_seen?: string
          publisher?: string | null
          software_name?: string
          version?: string | null
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
      support_tickets: {
        Row: {
          assigned_to: string | null
          category: string
          connector_id: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          resolution_notes: string | null
          resolved_at: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: string
          connector_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: string
          connector_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
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
      threat_intelligence: {
        Row: {
          confidence: number
          created_at: string
          first_seen: string
          id: string
          indicator_type: string
          indicator_value: string
          is_active: boolean
          last_seen: string
          metadata: Json | null
          source: string
          threat_types: string[]
          updated_at: string
        }
        Insert: {
          confidence: number
          created_at?: string
          first_seen?: string
          id?: string
          indicator_type: string
          indicator_value: string
          is_active?: boolean
          last_seen?: string
          metadata?: Json | null
          source: string
          threat_types?: string[]
          updated_at?: string
        }
        Update: {
          confidence?: number
          created_at?: string
          first_seen?: string
          id?: string
          indicator_type?: string
          indicator_value?: string
          is_active?: boolean
          last_seen?: string
          metadata?: Json | null
          source?: string
          threat_types?: string[]
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
      get_user_account_type: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["account_type"]
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
      is_msp_or_mssp: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _user_id: string; _team_id: string }
        Returns: boolean
      }
      is_ultrium_employee: {
        Args: { _user_id: string }
        Returns: boolean
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
      account_type: "business" | "msp" | "mssp"
      app_role:
        | "admin"
        | "moderator"
        | "user"
        | "msp_admin"
        | "mssp_admin"
        | "ultrium_admin"
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
      account_type: ["business", "msp", "mssp"],
      app_role: [
        "admin",
        "moderator",
        "user",
        "msp_admin",
        "mssp_admin",
        "ultrium_admin",
      ],
    },
  },
} as const
