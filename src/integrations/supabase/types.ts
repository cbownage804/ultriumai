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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      agentless_check_results: {
        Row: {
          actual_value: string | null
          category: string | null
          check_description: string | null
          check_id: string
          check_name: string
          cis_benchmark_id: string | null
          created_at: string
          evidence: Json | null
          expected_value: string | null
          framework_type: string | null
          id: string
          job_id: string | null
          remediation_steps: string | null
          severity: string | null
          status: string
          target_host: string
          user_id: string
        }
        Insert: {
          actual_value?: string | null
          category?: string | null
          check_description?: string | null
          check_id: string
          check_name: string
          cis_benchmark_id?: string | null
          created_at?: string
          evidence?: Json | null
          expected_value?: string | null
          framework_type?: string | null
          id?: string
          job_id?: string | null
          remediation_steps?: string | null
          severity?: string | null
          status: string
          target_host: string
          user_id: string
        }
        Update: {
          actual_value?: string | null
          category?: string | null
          check_description?: string | null
          check_id?: string
          check_name?: string
          cis_benchmark_id?: string | null
          created_at?: string
          evidence?: Json | null
          expected_value?: string | null
          framework_type?: string | null
          id?: string
          job_id?: string | null
          remediation_steps?: string | null
          severity?: string | null
          status?: string
          target_host?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agentless_check_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "agentless_scan_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      agentless_scan_jobs: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          compliance_results: Json | null
          created_at: string
          credential_ids: Json | null
          error_message: string | null
          framework_type: string | null
          id: string
          scan_status: string
          scan_type: string
          scanned_hosts: number | null
          started_at: string | null
          target_hosts: Json
          total_hosts: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          compliance_results?: Json | null
          created_at?: string
          credential_ids?: Json | null
          error_message?: string | null
          framework_type?: string | null
          id?: string
          scan_status?: string
          scan_type: string
          scanned_hosts?: number | null
          started_at?: string | null
          target_hosts?: Json
          total_hosts?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          compliance_results?: Json | null
          created_at?: string
          credential_ids?: Json | null
          error_message?: string | null
          framework_type?: string | null
          id?: string
          scan_status?: string
          scan_type?: string
          scanned_hosts?: number | null
          started_at?: string | null
          target_hosts?: Json
          total_hosts?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agentless_scan_jobs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_analysis_results: {
        Row: {
          ai_analysis: string | null
          analysis_type: string
          created_at: string
          findings_count: number | null
          id: string
          job_id: string | null
          recommendations: Json | null
          risk_score: number | null
          user_id: string
        }
        Insert: {
          ai_analysis?: string | null
          analysis_type: string
          created_at?: string
          findings_count?: number | null
          id?: string
          job_id?: string | null
          recommendations?: Json | null
          risk_score?: number | null
          user_id: string
        }
        Update: {
          ai_analysis?: string | null
          analysis_type?: string
          created_at?: string
          findings_count?: number | null
          id?: string
          job_id?: string | null
          recommendations?: Json | null
          risk_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_analysis_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "network_scan_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_credit_ledger: {
        Row: {
          conversation_id: string | null
          created_at: string
          credits_used: number
          description: string | null
          gpt_id: string | null
          id: string
          tokens_used: number | null
          usage_type: string
          user_id: string
        }
        Insert: {
          conversation_id?: string | null
          created_at?: string
          credits_used: number
          description?: string | null
          gpt_id?: string | null
          id?: string
          tokens_used?: number | null
          usage_type: string
          user_id: string
        }
        Update: {
          conversation_id?: string | null
          created_at?: string
          credits_used?: number
          description?: string | null
          gpt_id?: string | null
          id?: string
          tokens_used?: number | null
          usage_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_credit_ledger_gpt_id_fkey"
            columns: ["gpt_id"]
            isOneToOne: false
            referencedRelation: "custom_gpts"
            referencedColumns: ["id"]
          },
        ]
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
      alert_patterns: {
        Row: {
          alert_types: string[]
          auto_resolve: boolean | null
          confidence_threshold: number
          created_at: string
          id: string
          pattern_name: string
          resolution_action: string | null
          success_rate: number | null
          total_matches: number | null
        }
        Insert: {
          alert_types: string[]
          auto_resolve?: boolean | null
          confidence_threshold?: number
          created_at?: string
          id?: string
          pattern_name: string
          resolution_action?: string | null
          success_rate?: number | null
          total_matches?: number | null
        }
        Update: {
          alert_types?: string[]
          auto_resolve?: boolean | null
          confidence_threshold?: number
          created_at?: string
          id?: string
          pattern_name?: string
          resolution_action?: string | null
          success_rate?: number | null
          total_matches?: number | null
        }
        Relationships: []
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
      analytics_aggregates: {
        Row: {
          created_at: string
          dimensions: Json | null
          id: string
          metric_name: string
          metric_type: string
          metric_value: number | null
          period_end: string
          period_start: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dimensions?: Json | null
          id?: string
          metric_name: string
          metric_type: string
          metric_value?: number | null
          period_end: string
          period_start: string
          user_id: string
        }
        Update: {
          created_at?: string
          dimensions?: Json | null
          id?: string
          metric_name?: string
          metric_type?: string
          metric_value?: number | null
          period_end?: string
          period_start?: string
          user_id?: string
        }
        Relationships: []
      }
      analytics_dashboards: {
        Row: {
          created_at: string
          dashboard_name: string
          dashboard_type: string
          id: string
          is_default: boolean | null
          is_shared: boolean | null
          layout_config: Json
          shared_with: Json | null
          updated_at: string
          user_id: string
          widget_config: Json
        }
        Insert: {
          created_at?: string
          dashboard_name: string
          dashboard_type: string
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          layout_config?: Json
          shared_with?: Json | null
          updated_at?: string
          user_id: string
          widget_config?: Json
        }
        Update: {
          created_at?: string
          dashboard_name?: string
          dashboard_type?: string
          id?: string
          is_default?: boolean | null
          is_shared?: boolean | null
          layout_config?: Json
          shared_with?: Json | null
          updated_at?: string
          user_id?: string
          widget_config?: Json
        }
        Relationships: []
      }
      analytics_snapshots: {
        Row: {
          created_at: string
          data_snapshot: Json
          id: string
          snapshot_date: string
          snapshot_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_snapshot?: Json
          id?: string
          snapshot_date: string
          snapshot_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_snapshot?: Json
          id?: string
          snapshot_date?: string
          snapshot_type?: string
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      asset_assignments: {
        Row: {
          asset_id: string | null
          assigned_to_device: string | null
          assigned_to_user: string | null
          assignment_date: string | null
          created_at: string
          id: string
          notes: string | null
          return_date: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          assigned_to_device?: string | null
          assigned_to_user?: string | null
          assignment_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          return_date?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          asset_id?: string | null
          assigned_to_device?: string | null
          assigned_to_user?: string | null
          assignment_date?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          return_date?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_assignments_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      asset_history: {
        Row: {
          action: string
          asset_id: string | null
          changed_at: string
          changed_by: string | null
          id: string
          new_values: Json | null
          notes: string | null
          old_values: Json | null
        }
        Insert: {
          action: string
          asset_id?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Update: {
          action?: string
          asset_id?: string | null
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_values?: Json | null
          notes?: string | null
          old_values?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_history_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_maintenance: {
        Row: {
          asset_id: string | null
          completed_date: string | null
          cost: number | null
          created_at: string
          description: string
          id: string
          maintenance_type: string | null
          next_maintenance_date: string | null
          performed_by: string | null
          scheduled_date: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description: string
          id?: string
          maintenance_type?: string | null
          next_maintenance_date?: string | null
          performed_by?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string | null
          completed_date?: string | null
          cost?: number | null
          created_at?: string
          description?: string
          id?: string
          maintenance_type?: string | null
          next_maintenance_date?: string | null
          performed_by?: string | null
          scheduled_date?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_maintenance_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_risk_scores: {
        Row: {
          agent_id: string | null
          asset_identifier: string
          asset_type: string
          behavioral_score: number | null
          configuration_score: number | null
          created_at: string | null
          exposure_score: number | null
          id: string
          last_assessed_at: string | null
          overall_risk_score: number
          patch_score: number | null
          recommendations: Json | null
          risk_factors: Json | null
          updated_at: string | null
          user_id: string
          vulnerability_score: number | null
        }
        Insert: {
          agent_id?: string | null
          asset_identifier: string
          asset_type: string
          behavioral_score?: number | null
          configuration_score?: number | null
          created_at?: string | null
          exposure_score?: number | null
          id?: string
          last_assessed_at?: string | null
          overall_risk_score?: number
          patch_score?: number | null
          recommendations?: Json | null
          risk_factors?: Json | null
          updated_at?: string | null
          user_id: string
          vulnerability_score?: number | null
        }
        Update: {
          agent_id?: string | null
          asset_identifier?: string
          asset_type?: string
          behavioral_score?: number | null
          configuration_score?: number | null
          created_at?: string | null
          exposure_score?: number | null
          id?: string
          last_assessed_at?: string | null
          overall_risk_score?: number
          patch_score?: number | null
          recommendations?: Json | null
          risk_factors?: Json | null
          updated_at?: string | null
          user_id?: string
          vulnerability_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "asset_risk_scores_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          asset_tag: string | null
          assigned_to: string | null
          category_id: string | null
          client_id: string | null
          condition: string | null
          created_at: string
          current_value: number | null
          depreciation_rate: number | null
          description: string | null
          id: string
          last_warranty_check: string | null
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          notes: string | null
          office_location_id: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          specifications: Json | null
          status: string | null
          updated_at: string
          user_id: string
          warranty_expiry: string | null
          warranty_id: string | null
        }
        Insert: {
          asset_tag?: string | null
          assigned_to?: string | null
          category_id?: string | null
          client_id?: string | null
          condition?: string | null
          created_at?: string
          current_value?: number | null
          depreciation_rate?: number | null
          description?: string | null
          id?: string
          last_warranty_check?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          notes?: string | null
          office_location_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string | null
          updated_at?: string
          user_id: string
          warranty_expiry?: string | null
          warranty_id?: string | null
        }
        Update: {
          asset_tag?: string | null
          assigned_to?: string | null
          category_id?: string | null
          client_id?: string | null
          condition?: string | null
          created_at?: string
          current_value?: number | null
          depreciation_rate?: number | null
          description?: string | null
          id?: string
          last_warranty_check?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          office_location_id?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string
          warranty_expiry?: string | null
          warranty_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_office_location_id_fkey"
            columns: ["office_location_id"]
            isOneToOne: false
            referencedRelation: "office_locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assets_warranty_id_fkey"
            columns: ["warranty_id"]
            isOneToOne: false
            referencedRelation: "safetrack_warranties"
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automated_alerts: {
        Row: {
          alert_type: string
          created_at: string
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          message: string
          recipient_emails: string[] | null
          recipient_phones: string[] | null
          severity: string
          title: string
          trigger_conditions: Json
        }
        Insert: {
          alert_type: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          message: string
          recipient_emails?: string[] | null
          recipient_phones?: string[] | null
          severity?: string
          title: string
          trigger_conditions: Json
        }
        Update: {
          alert_type?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          message?: string
          recipient_emails?: string[] | null
          recipient_phones?: string[] | null
          severity?: string
          title?: string
          trigger_conditions?: Json
        }
        Relationships: []
      }
      automation_execution_logs: {
        Row: {
          actions_executed: Json | null
          created_at: string
          error_message: string | null
          execution_status: string
          execution_time_ms: number | null
          id: string
          rule_id: string
          ticket_id: string
        }
        Insert: {
          actions_executed?: Json | null
          created_at?: string
          error_message?: string | null
          execution_status: string
          execution_time_ms?: number | null
          id?: string
          rule_id: string
          ticket_id: string
        }
        Update: {
          actions_executed?: Json | null
          created_at?: string
          error_message?: string | null
          execution_status?: string
          execution_time_ms?: number | null
          id?: string
          rule_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automation_execution_logs_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "workflow_automation_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      backup_jobs: {
        Row: {
          agent_id: string | null
          backup_name: string
          backup_type: string
          completed_at: string | null
          created_at: string
          destination: string | null
          error_message: string | null
          id: string
          last_success: string | null
          next_scheduled: string | null
          size_bytes: number | null
          source_path: string | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          backup_name: string
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          destination?: string | null
          error_message?: string | null
          id?: string
          last_success?: string | null
          next_scheduled?: string | null
          size_bytes?: number | null
          source_path?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          backup_name?: string
          backup_type?: string
          completed_at?: string | null
          created_at?: string
          destination?: string | null
          error_message?: string | null
          id?: string
          last_success?: string | null
          next_scheduled?: string | null
          size_bytes?: number | null
          source_path?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "backup_jobs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      bi_reports: {
        Row: {
          created_at: string
          data_sources: Json
          id: string
          is_active: boolean | null
          is_automated: boolean | null
          last_generated_at: string | null
          report_config: Json
          report_name: string
          report_type: string
          schedule_config: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data_sources?: Json
          id?: string
          is_active?: boolean | null
          is_automated?: boolean | null
          last_generated_at?: string | null
          report_config?: Json
          report_name: string
          report_type: string
          schedule_config?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data_sources?: Json
          id?: string
          is_active?: boolean | null
          is_automated?: boolean | null
          last_generated_at?: string | null
          report_config?: Json
          report_name?: string
          report_type?: string
          schedule_config?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_schedules: {
        Row: {
          auto_invoice: boolean | null
          client_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_billed_date: string | null
          next_billing_date: string
          schedule_name: string
          schedule_type: string
          service_items: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_invoice?: boolean | null
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_billed_date?: string | null
          next_billing_date: string
          schedule_name: string
          schedule_type: string
          service_items?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_invoice?: boolean | null
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_billed_date?: string | null
          next_billing_date?: string
          schedule_name?: string
          schedule_type?: string
          service_items?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      billing_usage_tracking: {
        Row: {
          billing_rate: number | null
          client_id: string | null
          cost_center_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          tracking_date: string
          usage_amount: number
          usage_type: string
          usage_unit: string
          user_id: string
        }
        Insert: {
          billing_rate?: number | null
          client_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          tracking_date?: string
          usage_amount: number
          usage_type: string
          usage_unit: string
          user_id: string
        }
        Update: {
          billing_rate?: number | null
          client_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          tracking_date?: string
          usage_amount?: number
          usage_type?: string
          usage_unit?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_usage_tracking_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
        ]
      }
      blog_posts: {
        Row: {
          author_id: string | null
          category: string | null
          content: string
          created_at: string
          excerpt: string | null
          featured_image: string | null
          id: string
          published: boolean | null
          published_at: string | null
          slug: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          category?: string | null
          content: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          category?: string | null
          content?: string
          created_at?: string
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          published?: boolean | null
          published_at?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_customers: {
        Row: {
          account_manager_id: string | null
          billing_address: Json | null
          business_email: string
          company_name: string
          company_size: string | null
          created_at: string
          id: string
          industry: string | null
          tax_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          account_manager_id?: string | null
          billing_address?: Json | null
          business_email: string
          company_name: string
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          account_manager_id?: string | null
          billing_address?: Json | null
          business_email?: string
          company_name?: string
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      business_invoices: {
        Row: {
          amount_due: number
          amount_paid: number | null
          business_customer_id: string | null
          created_at: string
          currency: string | null
          due_date: string | null
          id: string
          invoice_number: string | null
          issued_at: string
          line_items: Json | null
          notes: string | null
          paid_at: string | null
          status: string
          stripe_invoice_id: string | null
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          amount_due: number
          amount_paid?: number | null
          business_customer_id?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string
          line_items?: Json | null
          notes?: string | null
          paid_at?: string | null
          status: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          amount_due?: number
          amount_paid?: number | null
          business_customer_id?: string | null
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          issued_at?: string
          line_items?: Json | null
          notes?: string | null
          paid_at?: string | null
          status?: string
          stripe_invoice_id?: string | null
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_invoices_business_customer_id_fkey"
            columns: ["business_customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "business_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      business_subscriptions: {
        Row: {
          addons: Json | null
          billing_cycle: string
          business_customer_id: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          monthly_amount: number
          package_type: string
          seat_count: number
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          addons?: Json | null
          billing_cycle: string
          business_customer_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_amount: number
          package_type: string
          seat_count?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          addons?: Json | null
          billing_cycle?: string
          business_customer_id?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          monthly_amount?: number
          package_type?: string
          seat_count?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "business_subscriptions_business_customer_id_fkey"
            columns: ["business_customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      business_usage_tracking: {
        Row: {
          addon_usage: Json | null
          business_customer_id: string | null
          created_at: string
          feature_usage: Json | null
          id: string
          overage_charges: number | null
          seat_usage: Json | null
          subscription_id: string | null
          tracking_period: string
          updated_at: string
        }
        Insert: {
          addon_usage?: Json | null
          business_customer_id?: string | null
          created_at?: string
          feature_usage?: Json | null
          id?: string
          overage_charges?: number | null
          seat_usage?: Json | null
          subscription_id?: string | null
          tracking_period: string
          updated_at?: string
        }
        Update: {
          addon_usage?: Json | null
          business_customer_id?: string | null
          created_at?: string
          feature_usage?: Json | null
          id?: string
          overage_charges?: number | null
          seat_usage?: Json | null
          subscription_id?: string | null
          tracking_period?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_usage_tracking_business_customer_id_fkey"
            columns: ["business_customer_id"]
            isOneToOne: false
            referencedRelation: "business_customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "business_usage_tracking_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "business_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      client_announcements: {
        Row: {
          announcement_type: string
          auto_generated: boolean
          client_id: string | null
          content: string
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          metadata: Json | null
          priority: string
          scheduled_at: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          announcement_type?: string
          auto_generated?: boolean
          client_id?: string | null
          content: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          priority?: string
          scheduled_at?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          announcement_type?: string
          auto_generated?: boolean
          client_id?: string | null
          content?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          metadata?: Json | null
          priority?: string
          scheduled_at?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_contacts: {
        Row: {
          client_id: string
          communication_preferences: Json | null
          contact_name: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          phone: string | null
          role: string | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          client_id: string
          communication_preferences?: Json | null
          contact_name: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          phone?: string | null
          role?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string
          communication_preferences?: Json | null
          contact_name?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          phone?: string | null
          role?: string | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_client_contacts_client"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_email_configs: {
        Row: {
          auto_response_enabled: boolean | null
          auto_response_template: string | null
          client_id: string
          created_at: string | null
          email_signature: string | null
          id: string
          incoming_email: string
          is_active: boolean | null
          outgoing_from_email: string
          outgoing_from_name: string
          updated_at: string | null
        }
        Insert: {
          auto_response_enabled?: boolean | null
          auto_response_template?: string | null
          client_id: string
          created_at?: string | null
          email_signature?: string | null
          id?: string
          incoming_email: string
          is_active?: boolean | null
          outgoing_from_email: string
          outgoing_from_name?: string
          updated_at?: string | null
        }
        Update: {
          auto_response_enabled?: boolean | null
          auto_response_template?: string | null
          client_id?: string
          created_at?: string | null
          email_signature?: string | null
          id?: string
          incoming_email?: string
          is_active?: boolean | null
          outgoing_from_email?: string
          outgoing_from_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      client_feedback: {
        Row: {
          category: string | null
          client_id: string
          created_at: string
          feedback_text: string | null
          id: string
          is_resolved: boolean | null
          rating: number | null
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          client_id: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          is_resolved?: boolean | null
          rating?: number | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          client_id?: string
          created_at?: string
          feedback_text?: string | null
          id?: string
          is_resolved?: boolean | null
          rating?: number | null
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "client_portal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "client_portal_users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_announcements: {
        Row: {
          client_id: string
          content: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean
          priority: string
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          content: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          content?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          priority?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_portal_kb: {
        Row: {
          category: string
          client_id: string | null
          content: string
          created_at: string
          created_by: string
          helpful_count: number | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          last_updated_by: string | null
          tags: string[] | null
          title: string
          updated_at: string
          view_count: number | null
        }
        Insert: {
          category: string
          client_id?: string | null
          content: string
          created_at?: string
          created_by: string
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          last_updated_by?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          category?: string
          client_id?: string | null
          content?: string
          created_at?: string
          created_by?: string
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          last_updated_by?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          view_count?: number | null
        }
        Relationships: []
      }
      client_portal_notifications: {
        Row: {
          acknowledged_by: Json | null
          acknowledgment_required: boolean | null
          action_url: string | null
          affected_services: string[] | null
          client_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          notification_type: string
          severity: string
          starts_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          acknowledged_by?: Json | null
          acknowledgment_required?: boolean | null
          action_url?: string | null
          affected_services?: string[] | null
          client_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          notification_type: string
          severity?: string
          starts_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          acknowledged_by?: Json | null
          acknowledgment_required?: boolean | null
          action_url?: string | null
          affected_services?: string[] | null
          client_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          notification_type?: string
          severity?: string
          starts_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_portal_requests: {
        Row: {
          actual_completion_date: string | null
          approval_notes: string | null
          assigned_to: string | null
          attachments: Json | null
          business_justification: string | null
          client_id: string
          created_at: string
          description: string
          estimated_cost: number | null
          id: string
          metadata: Json | null
          priority: string
          rejection_reason: string | null
          request_type: string
          requested_by: string
          requested_completion_date: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          actual_completion_date?: string | null
          approval_notes?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          business_justification?: string | null
          client_id: string
          created_at?: string
          description: string
          estimated_cost?: number | null
          id?: string
          metadata?: Json | null
          priority?: string
          rejection_reason?: string | null
          request_type: string
          requested_by: string
          requested_completion_date?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          actual_completion_date?: string | null
          approval_notes?: string | null
          assigned_to?: string | null
          attachments?: Json | null
          business_justification?: string | null
          client_id?: string
          created_at?: string
          description?: string
          estimated_cost?: number | null
          id?: string
          metadata?: Json | null
          priority?: string
          rejection_reason?: string | null
          request_type?: string
          requested_by?: string
          requested_completion_date?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_portal_services: {
        Row: {
          client_id: string
          contract_end_date: string | null
          created_at: string
          documentation_url: string | null
          id: string
          is_billable: boolean | null
          last_check_at: string | null
          monthly_cost: number | null
          service_contacts: Json | null
          service_description: string | null
          service_health: number | null
          service_metrics: Json | null
          service_name: string
          service_status: string
          service_type: string
          updated_at: string
        }
        Insert: {
          client_id: string
          contract_end_date?: string | null
          created_at?: string
          documentation_url?: string | null
          id?: string
          is_billable?: boolean | null
          last_check_at?: string | null
          monthly_cost?: number | null
          service_contacts?: Json | null
          service_description?: string | null
          service_health?: number | null
          service_metrics?: Json | null
          service_name: string
          service_status?: string
          service_type: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          contract_end_date?: string | null
          created_at?: string
          documentation_url?: string | null
          id?: string
          is_billable?: boolean | null
          last_check_at?: string | null
          monthly_cost?: number | null
          service_contacts?: Json | null
          service_description?: string | null
          service_health?: number | null
          service_metrics?: Json | null
          service_name?: string
          service_status?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_portal_sessions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          ip_address: unknown
          session_token: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          ip_address?: unknown
          session_token: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          session_token?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_portal_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "client_portal_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_portal_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "client_portal_users_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      client_portal_settings: {
        Row: {
          allowed_features: Json | null
          client_id: string
          created_at: string
          custom_branding: Json | null
          custom_domain: string | null
          id: string
          portal_enabled: boolean
          portal_url_slug: string | null
          updated_at: string
        }
        Insert: {
          allowed_features?: Json | null
          client_id: string
          created_at?: string
          custom_branding?: Json | null
          custom_domain?: string | null
          id?: string
          portal_enabled?: boolean
          portal_url_slug?: string | null
          updated_at?: string
        }
        Update: {
          allowed_features?: Json | null
          client_id?: string
          created_at?: string
          custom_branding?: Json | null
          custom_domain?: string | null
          id?: string
          portal_enabled?: boolean
          portal_url_slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      client_portal_users: {
        Row: {
          client_id: string
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          password_hash: string | null
          reset_token: string | null
          reset_token_expires_at: string | null
          role: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          password_hash?: string | null
          reset_token?: string | null
          reset_token_expires_at?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          password_hash?: string | null
          reset_token?: string | null
          reset_token_expires_at?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      client_users: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["helpdesk_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["helpdesk_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["helpdesk_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clipboard_syncs: {
        Row: {
          content: string
          content_type: string
          device_id: string
          direction: string
          id: string
          remote_session_id: string
          synced_at: string
          user_id: string
        }
        Insert: {
          content: string
          content_type?: string
          device_id: string
          direction: string
          id?: string
          remote_session_id: string
          synced_at?: string
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string
          device_id?: string
          direction?: string
          id?: string
          remote_session_id?: string
          synced_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_clipboard_syncs_device"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "rmm_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_clipboard_syncs_session"
            columns: ["remote_session_id"]
            isOneToOne: false
            referencedRelation: "remote_sessions"
            referencedColumns: ["id"]
          },
        ]
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
      compliance_benchmarks: {
        Row: {
          category: string
          check_command: string | null
          check_description: string | null
          check_id: string
          check_name: string
          created_at: string
          expected_result: string | null
          framework_type: string
          id: string
          is_active: boolean | null
          is_automated: boolean | null
          metadata: Json | null
          os_type: string | null
          remediation_command: string | null
          remediation_steps: string | null
          severity: string | null
          updated_at: string
        }
        Insert: {
          category: string
          check_command?: string | null
          check_description?: string | null
          check_id: string
          check_name: string
          created_at?: string
          expected_result?: string | null
          framework_type: string
          id?: string
          is_active?: boolean | null
          is_automated?: boolean | null
          metadata?: Json | null
          os_type?: string | null
          remediation_command?: string | null
          remediation_steps?: string | null
          severity?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          check_command?: string | null
          check_description?: string | null
          check_id?: string
          check_name?: string
          created_at?: string
          expected_result?: string | null
          framework_type?: string
          id?: string
          is_active?: boolean | null
          is_automated?: boolean | null
          metadata?: Json | null
          os_type?: string | null
          remediation_command?: string | null
          remediation_steps?: string | null
          severity?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      compliance_check_results: {
        Row: {
          actual_value: string | null
          agent_id: string | null
          category: string | null
          check_description: string | null
          check_id: string
          check_name: string
          created_at: string
          evidence: Json | null
          expected_value: string | null
          framework_type: string
          id: string
          is_remediated: boolean | null
          job_id: string | null
          notes: string | null
          remediated_at: string | null
          remediated_by: string | null
          remediation_steps: string | null
          severity: string | null
          status: string
          user_id: string
        }
        Insert: {
          actual_value?: string | null
          agent_id?: string | null
          category?: string | null
          check_description?: string | null
          check_id: string
          check_name: string
          created_at?: string
          evidence?: Json | null
          expected_value?: string | null
          framework_type: string
          id?: string
          is_remediated?: boolean | null
          job_id?: string | null
          notes?: string | null
          remediated_at?: string | null
          remediated_by?: string | null
          remediation_steps?: string | null
          severity?: string | null
          status: string
          user_id: string
        }
        Update: {
          actual_value?: string | null
          agent_id?: string | null
          category?: string | null
          check_description?: string | null
          check_id?: string
          check_name?: string
          created_at?: string
          evidence?: Json | null
          expected_value?: string | null
          framework_type?: string
          id?: string
          is_remediated?: boolean | null
          job_id?: string | null
          notes?: string | null
          remediated_at?: string | null
          remediated_by?: string | null
          remediation_steps?: string | null
          severity?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_check_results_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_check_results_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "compliance_scan_jobs"
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
      compliance_frameworks: {
        Row: {
          automated_checks: Json | null
          created_at: string
          description: string | null
          evidence_requirements: Json | null
          framework_name: string
          id: string
          reporting_schedule: string | null
          requirements: Json
          updated_at: string
          version: string | null
        }
        Insert: {
          automated_checks?: Json | null
          created_at?: string
          description?: string | null
          evidence_requirements?: Json | null
          framework_name: string
          id?: string
          reporting_schedule?: string | null
          requirements: Json
          updated_at?: string
          version?: string | null
        }
        Update: {
          automated_checks?: Json | null
          created_at?: string
          description?: string | null
          evidence_requirements?: Json | null
          framework_name?: string
          id?: string
          reporting_schedule?: string | null
          requirements?: Json
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      compliance_scan_jobs: {
        Row: {
          agent_id: string | null
          completed_at: string | null
          compliance_score: number | null
          created_at: string
          error_message: string | null
          failed_checks: number | null
          framework_type: string
          id: string
          passed_checks: number | null
          scan_config: Json | null
          scan_status: string
          started_at: string | null
          total_checks: number | null
          updated_at: string
          user_id: string
          warning_checks: number | null
        }
        Insert: {
          agent_id?: string | null
          completed_at?: string | null
          compliance_score?: number | null
          created_at?: string
          error_message?: string | null
          failed_checks?: number | null
          framework_type: string
          id?: string
          passed_checks?: number | null
          scan_config?: Json | null
          scan_status?: string
          started_at?: string | null
          total_checks?: number | null
          updated_at?: string
          user_id: string
          warning_checks?: number | null
        }
        Update: {
          agent_id?: string | null
          completed_at?: string | null
          compliance_score?: number | null
          created_at?: string
          error_message?: string | null
          failed_checks?: number | null
          framework_type?: string
          id?: string
          passed_checks?: number | null
          scan_config?: Json | null
          scan_status?: string
          started_at?: string | null
          total_checks?: number | null
          updated_at?: string
          user_id?: string
          warning_checks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_scan_jobs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_scan_schedules: {
        Row: {
          agent_ids: string[] | null
          created_at: string
          framework_types: string[]
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          notification_emails: string[] | null
          scan_all_agents: boolean | null
          schedule_cron: string | null
          schedule_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_ids?: string[] | null
          created_at?: string
          framework_types: string[]
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          notification_emails?: string[] | null
          scan_all_agents?: boolean | null
          schedule_cron?: string | null
          schedule_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_ids?: string[] | null
          created_at?: string
          framework_types?: string[]
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          notification_emails?: string[] | null
          scan_all_agents?: boolean | null
          schedule_cron?: string | null
          schedule_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_status: {
        Row: {
          assigned_auditor: string | null
          created_at: string
          evidence_collected: Json | null
          framework_id: string
          id: string
          last_audit_date: string | null
          metadata: Json | null
          msp_org_id: string | null
          next_audit_date: string | null
          notes: string | null
          requirements_met: number | null
          score: number | null
          status: string | null
          total_requirements: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_auditor?: string | null
          created_at?: string
          evidence_collected?: Json | null
          framework_id: string
          id?: string
          last_audit_date?: string | null
          metadata?: Json | null
          msp_org_id?: string | null
          next_audit_date?: string | null
          notes?: string | null
          requirements_met?: number | null
          score?: number | null
          status?: string | null
          total_requirements?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_auditor?: string | null
          created_at?: string
          evidence_collected?: Json | null
          framework_id?: string
          id?: string
          last_audit_date?: string | null
          metadata?: Json | null
          msp_org_id?: string | null
          next_audit_date?: string | null
          notes?: string | null
          requirements_met?: number | null
          score?: number | null
          status?: string | null
          total_requirements?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compliance_status_framework_id_fkey"
            columns: ["framework_id"]
            isOneToOne: false
            referencedRelation: "compliance_frameworks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_status_msp_org_id_fkey"
            columns: ["msp_org_id"]
            isOneToOne: false
            referencedRelation: "msp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_form_rate_limits: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          submitted_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          submitted_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          submitted_at?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          status: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          status?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          status?: string | null
          subject?: string
        }
        Relationships: []
      }
      containment_actions: {
        Row: {
          action_type: string
          agent_id: string | null
          approved_by: string | null
          case_id: string | null
          created_at: string | null
          error_message: string | null
          executed_at: string | null
          executed_by: string | null
          id: string
          requires_approval: boolean | null
          result: Json | null
          rollback_available: boolean | null
          rolled_back_at: string | null
          status: string
          target_details: Json
          user_id: string
        }
        Insert: {
          action_type: string
          agent_id?: string | null
          approved_by?: string | null
          case_id?: string | null
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          requires_approval?: boolean | null
          result?: Json | null
          rollback_available?: boolean | null
          rolled_back_at?: string | null
          status?: string
          target_details: Json
          user_id: string
        }
        Update: {
          action_type?: string
          agent_id?: string | null
          approved_by?: string | null
          case_id?: string | null
          created_at?: string | null
          error_message?: string | null
          executed_at?: string | null
          executed_by?: string | null
          id?: string
          requires_approval?: boolean | null
          result?: Json | null
          rollback_available?: boolean | null
          rolled_back_at?: string | null
          status?: string
          target_details?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "containment_actions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "containment_actions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "mdr_cases"
            referencedColumns: ["id"]
          },
        ]
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
      conversion_goals: {
        Row: {
          created_at: string
          goal_name: string
          goal_value: number | null
          id: string
          metadata: Json | null
          product: string | null
          session_id: string
          source: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          goal_name: string
          goal_value?: number | null
          id?: string
          metadata?: Json | null
          product?: string | null
          session_id: string
          source?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          goal_name?: string
          goal_value?: number | null
          id?: string
          metadata?: Json | null
          product?: string | null
          session_id?: string
          source?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      copilot_conversations: {
        Row: {
          created_at: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      copilot_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          metadata: Json | null
          role: string
          tools_used: string[] | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role: string
          tools_used?: string[] | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          role?: string
          tools_used?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "copilot_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "copilot_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          budget_amount: number | null
          budget_period: string | null
          cost_center_code: string
          cost_center_name: string
          created_at: string
          department: string | null
          id: string
          is_active: boolean | null
          manager_email: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_amount?: number | null
          budget_period?: string | null
          cost_center_code: string
          cost_center_name: string
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean | null
          manager_email?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_amount?: number | null
          budget_period?: string | null
          cost_center_code?: string
          cost_center_name?: string
          created_at?: string
          department?: string | null
          id?: string
          is_active?: boolean | null
          manager_email?: string | null
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
      credit_history: {
        Row: {
          action_type: string
          created_at: string
          credits_amount: number
          description: string
          id: string
          user_id: string
        }
        Insert: {
          action_type: string
          created_at?: string
          credits_amount: number
          description: string
          id?: string
          user_id: string
        }
        Update: {
          action_type?: string
          created_at?: string
          credits_amount?: number
          description?: string
          id?: string
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
          category: string | null
          chat_count: number
          conversation_duration: string | null
          conversation_exporting: boolean | null
          conversation_retention: string | null
          conversation_sharing: boolean | null
          created_at: string
          credit_multiplier: number
          custom_loading_message: string | null
          custom_message_ending: string | null
          description: string | null
          embed_enabled: boolean
          enable_web_search: boolean | null
          error_message: string | null
          features: Json | null
          generate_responses_from: string | null
          id: string
          integration_settings: Json | null
          is_active: boolean
          language: string | null
          loading_indicator: string | null
          logo_url: string | null
          max_integrations: number | null
          monthly_credit_cap: number | null
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
          template_id: string | null
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
          category?: string | null
          chat_count?: number
          conversation_duration?: string | null
          conversation_exporting?: boolean | null
          conversation_retention?: string | null
          conversation_sharing?: boolean | null
          created_at?: string
          credit_multiplier?: number
          custom_loading_message?: string | null
          custom_message_ending?: string | null
          description?: string | null
          embed_enabled?: boolean
          enable_web_search?: boolean | null
          error_message?: string | null
          features?: Json | null
          generate_responses_from?: string | null
          id?: string
          integration_settings?: Json | null
          is_active?: boolean
          language?: string | null
          loading_indicator?: string | null
          logo_url?: string | null
          max_integrations?: number | null
          monthly_credit_cap?: number | null
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
          template_id?: string | null
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
          category?: string | null
          chat_count?: number
          conversation_duration?: string | null
          conversation_exporting?: boolean | null
          conversation_retention?: string | null
          conversation_sharing?: boolean | null
          created_at?: string
          credit_multiplier?: number
          custom_loading_message?: string | null
          custom_message_ending?: string | null
          description?: string | null
          embed_enabled?: boolean
          enable_web_search?: boolean | null
          error_message?: string | null
          features?: Json | null
          generate_responses_from?: string | null
          id?: string
          integration_settings?: Json | null
          is_active?: boolean
          language?: string | null
          loading_indicator?: string | null
          logo_url?: string | null
          max_integrations?: number | null
          monthly_credit_cap?: number | null
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
          template_id?: string | null
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
      custom_ticket_fields: {
        Row: {
          created_at: string
          default_value: string | null
          description: string | null
          field_type: string
          id: string
          is_active: boolean | null
          label: string
          name: string
          options: Json | null
          position: number | null
          required: boolean | null
          updated_at: string
          user_id: string
          validation_rules: Json | null
        }
        Insert: {
          created_at?: string
          default_value?: string | null
          description?: string | null
          field_type: string
          id?: string
          is_active?: boolean | null
          label: string
          name: string
          options?: Json | null
          position?: number | null
          required?: boolean | null
          updated_at?: string
          user_id: string
          validation_rules?: Json | null
        }
        Update: {
          created_at?: string
          default_value?: string | null
          description?: string | null
          field_type?: string
          id?: string
          is_active?: boolean | null
          label?: string
          name?: string
          options?: Json | null
          position?: number | null
          required?: boolean | null
          updated_at?: string
          user_id?: string
          validation_rules?: Json | null
        }
        Relationships: []
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
      dark_web_monitors: {
        Row: {
          breach_count: number | null
          breach_data: Json | null
          created_at: string
          domain: string | null
          email: string
          id: string
          is_active: boolean | null
          last_checked: string | null
          latest_breach: string | null
          monitor_type: string | null
          paste_count: number | null
          paste_data: Json | null
          phone_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          breach_count?: number | null
          breach_data?: Json | null
          created_at?: string
          domain?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          last_checked?: string | null
          latest_breach?: string | null
          monitor_type?: string | null
          paste_count?: number | null
          paste_data?: Json | null
          phone_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          breach_count?: number | null
          breach_data?: Json | null
          created_at?: string
          domain?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          last_checked?: string | null
          latest_breach?: string | null
          monitor_type?: string | null
          paste_count?: number | null
          paste_data?: Json | null
          phone_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      darkweb_monitors: {
        Row: {
          created_at: string | null
          findings: Json | null
          id: string
          item_type: string
          last_scan: string | null
          monitored_item: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          findings?: Json | null
          id?: string
          item_type: string
          last_scan?: string | null
          monitored_item: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          findings?: Json | null
          id?: string
          item_type?: string
          last_scan?: string | null
          monitored_item?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      data_export_requests: {
        Row: {
          created_at: string
          export_file_path: string | null
          id: string
          processed_at: string | null
          processed_by: string | null
          request_type: string
          requested_data_types: string[] | null
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          export_file_path?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          request_type: string
          requested_data_types?: string[] | null
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          export_file_path?: string | null
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          request_type?: string
          requested_data_types?: string[] | null
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      device_checkins: {
        Row: {
          created_at: string
          device_id: string
          id: string
          payload: Json
        }
        Insert: {
          created_at?: string
          device_id: string
          id?: string
          payload: Json
        }
        Update: {
          created_at?: string
          device_id?: string
          id?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "device_checkins_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_commands: {
        Row: {
          command_type: string
          created_at: string | null
          device_id: string
          id: string
          payload: Json
          result: Json | null
          status: string
          updated_at: string | null
        }
        Insert: {
          command_type: string
          created_at?: string | null
          device_id: string
          id?: string
          payload?: Json
          result?: Json | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          command_type?: string
          created_at?: string | null
          device_id?: string
          id?: string
          payload?: Json
          result?: Json | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_device_commands_device_id"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "safenet_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      device_scans: {
        Row: {
          created_at: string
          device_id: string
          devices_found: number | null
          id: string
          network_ranges: string[] | null
          results: Json | null
          scan_duration: number | null
          scan_type: string
        }
        Insert: {
          created_at?: string
          device_id: string
          devices_found?: number | null
          id?: string
          network_ranges?: string[] | null
          results?: Json | null
          scan_duration?: number | null
          scan_type: string
        }
        Update: {
          created_at?: string
          device_id?: string
          devices_found?: number | null
          id?: string
          network_ranges?: string[] | null
          results?: Json | null
          scan_duration?: number | null
          scan_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "device_scans_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      devices: {
        Row: {
          agent_version: string | null
          created_at: string
          domain: string | null
          hostname: string | null
          id: string
          ip_address: string | null
          last_checkin: string | null
          last_scan_at: string | null
          org_id: string
          status: Database["public"]["Enums"]["device_status"]
          updated_at: string
        }
        Insert: {
          agent_version?: string | null
          created_at?: string
          domain?: string | null
          hostname?: string | null
          id?: string
          ip_address?: string | null
          last_checkin?: string | null
          last_scan_at?: string | null
          org_id: string
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
        }
        Update: {
          agent_version?: string | null
          created_at?: string
          domain?: string | null
          hostname?: string | null
          id?: string
          ip_address?: string | null
          last_checkin?: string | null
          last_scan_at?: string | null
          org_id?: string
          status?: Database["public"]["Enums"]["device_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "devices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      document_scans: {
        Row: {
          completed_at: string | null
          created_at: string | null
          file_hash: string
          file_name: string
          file_size: number
          id: string
          scan_result: Json | null
          scan_status: string
          threat_level: string | null
          threats_detected: number | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          file_hash: string
          file_name: string
          file_size: number
          id?: string
          scan_result?: Json | null
          scan_status?: string
          threat_level?: string | null
          threats_detected?: number | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          file_hash?: string
          file_name?: string
          file_size?: number
          id?: string
          scan_result?: Json | null
          scan_status?: string
          threat_level?: string | null
          threats_detected?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      edr_behavioral_analysis: {
        Row: {
          ai_confidence_score: number | null
          analysis_timestamp: string
          anomaly_indicators: Json | null
          behavior_score: number | null
          command_line: string | null
          created_at: string
          detection_rules_triggered: Json | null
          endpoint_id: string | null
          file_operations: Json | null
          file_path: string | null
          hash_sha256: string | null
          id: string
          memory_analysis: Json | null
          mitre_tactics: string[] | null
          mitre_techniques: string[] | null
          network_connections: Json | null
          parent_process_id: number | null
          parent_process_name: string | null
          process_id: number
          process_name: string
          registry_operations: Json | null
          status: string
          threat_classification: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
          analysis_timestamp?: string
          anomaly_indicators?: Json | null
          behavior_score?: number | null
          command_line?: string | null
          created_at?: string
          detection_rules_triggered?: Json | null
          endpoint_id?: string | null
          file_operations?: Json | null
          file_path?: string | null
          hash_sha256?: string | null
          id?: string
          memory_analysis?: Json | null
          mitre_tactics?: string[] | null
          mitre_techniques?: string[] | null
          network_connections?: Json | null
          parent_process_id?: number | null
          parent_process_name?: string | null
          process_id: number
          process_name: string
          registry_operations?: Json | null
          status?: string
          threat_classification?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
          analysis_timestamp?: string
          anomaly_indicators?: Json | null
          behavior_score?: number | null
          command_line?: string | null
          created_at?: string
          detection_rules_triggered?: Json | null
          endpoint_id?: string | null
          file_operations?: Json | null
          file_path?: string | null
          hash_sha256?: string | null
          id?: string
          memory_analysis?: Json | null
          mitre_tactics?: string[] | null
          mitre_techniques?: string[] | null
          network_connections?: Json | null
          parent_process_id?: number | null
          parent_process_name?: string | null
          process_id?: number
          process_name?: string
          registry_operations?: Json | null
          status?: string
          threat_classification?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edr_behavioral_analysis_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "safe_shield_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      edr_ml_models: {
        Row: {
          accuracy_score: number | null
          created_at: string
          false_positive_rate: number | null
          id: string
          is_active: boolean | null
          last_trained: string | null
          model_name: string
          model_parameters: Json | null
          model_type: string
          model_version: string
          performance_metrics: Json | null
          training_data_size: number | null
          updated_at: string
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string
          false_positive_rate?: number | null
          id?: string
          is_active?: boolean | null
          last_trained?: string | null
          model_name: string
          model_parameters?: Json | null
          model_type: string
          model_version: string
          performance_metrics?: Json | null
          training_data_size?: number | null
          updated_at?: string
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string
          false_positive_rate?: number | null
          id?: string
          is_active?: boolean | null
          last_trained?: string | null
          model_name?: string
          model_parameters?: Json | null
          model_type?: string
          model_version?: string
          performance_metrics?: Json | null
          training_data_size?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      edr_realtime_alerts: {
        Row: {
          alert_type: string
          analyst_assigned: string | null
          attack_stage: string | null
          auto_response_enabled: boolean | null
          behavioral_analysis_id: string | null
          containment_status: string | null
          created_at: string
          description: string | null
          endpoint_id: string | null
          id: string
          indicators_of_compromise: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          response_actions_taken: Json | null
          severity: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_type: string
          analyst_assigned?: string | null
          attack_stage?: string | null
          auto_response_enabled?: boolean | null
          behavioral_analysis_id?: string | null
          containment_status?: string | null
          created_at?: string
          description?: string | null
          endpoint_id?: string | null
          id?: string
          indicators_of_compromise?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          response_actions_taken?: Json | null
          severity: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_type?: string
          analyst_assigned?: string | null
          attack_stage?: string | null
          auto_response_enabled?: boolean | null
          behavioral_analysis_id?: string | null
          containment_status?: string | null
          created_at?: string
          description?: string | null
          endpoint_id?: string | null
          id?: string
          indicators_of_compromise?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          response_actions_taken?: Json | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edr_realtime_alerts_behavioral_analysis_id_fkey"
            columns: ["behavioral_analysis_id"]
            isOneToOne: false
            referencedRelation: "edr_behavioral_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edr_realtime_alerts_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "safe_shield_endpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      email_automation_log: {
        Row: {
          created_at: string
          email_type: string
          id: string
          metadata: Json | null
          product: string | null
          sent_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_type: string
          id?: string
          metadata?: Json | null
          product?: string | null
          sent_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_type?: string
          id?: string
          metadata?: Json | null
          product?: string | null
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      email_scans: {
        Row: {
          completed_at: string | null
          created_at: string | null
          email_subject: string | null
          id: string
          recipient_email: string | null
          scan_result: Json | null
          scan_status: string
          sender_email: string
          threat_level: string | null
          threats_detected: number | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          email_subject?: string | null
          id?: string
          recipient_email?: string | null
          scan_result?: Json | null
          scan_status?: string
          sender_email: string
          threat_level?: string | null
          threats_detected?: number | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          email_subject?: string | null
          id?: string
          recipient_email?: string | null
          scan_result?: Json | null
          scan_status?: string
          sender_email?: string
          threat_level?: string | null
          threats_detected?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          body_html: string
          body_text: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at: string
          user_id: string
          variables: string[] | null
        }
        Insert: {
          body_html: string
          body_text: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_type: string
          updated_at?: string
          user_id: string
          variables?: string[] | null
        }
        Update: {
          body_html?: string
          body_text?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_type?: string
          updated_at?: string
          user_id?: string
          variables?: string[] | null
        }
        Relationships: []
      }
      escalation_rules: {
        Row: {
          created_at: string
          description: string | null
          escalation_levels: Json
          id: string
          is_active: boolean | null
          name: string
          trigger_conditions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          escalation_levels?: Json
          id?: string
          is_active?: boolean | null
          name: string
          trigger_conditions?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          escalation_levels?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          trigger_conditions?: Json
          updated_at?: string
          user_id?: string
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
      file_transfers: {
        Row: {
          bytes_transferred: number | null
          completed_at: string | null
          created_at: string
          device_id: string
          error_message: string | null
          file_name: string
          file_size: number | null
          id: string
          local_path: string
          remote_path: string
          remote_session_id: string | null
          started_at: string | null
          transfer_speed: number | null
          transfer_status: string
          transfer_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          bytes_transferred?: number | null
          completed_at?: string | null
          created_at?: string
          device_id: string
          error_message?: string | null
          file_name: string
          file_size?: number | null
          id?: string
          local_path: string
          remote_path: string
          remote_session_id?: string | null
          started_at?: string | null
          transfer_speed?: number | null
          transfer_status?: string
          transfer_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          bytes_transferred?: number | null
          completed_at?: string | null
          created_at?: string
          device_id?: string
          error_message?: string | null
          file_name?: string
          file_size?: number | null
          id?: string
          local_path?: string
          remote_path?: string
          remote_session_id?: string | null
          started_at?: string | null
          transfer_speed?: number | null
          transfer_status?: string
          transfer_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_file_transfers_device"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "rmm_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_file_transfers_session"
            columns: ["remote_session_id"]
            isOneToOne: false
            referencedRelation: "remote_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      fim_baselines: {
        Row: {
          agent_id: string
          created_at: string | null
          file_hash: string
          file_path: string
          file_size: number | null
          id: string
          is_directory: boolean | null
          is_monitored: boolean | null
          last_modified: string | null
          owner: string | null
          permissions: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          file_hash: string
          file_path: string
          file_size?: number | null
          id?: string
          is_directory?: boolean | null
          is_monitored?: boolean | null
          last_modified?: string | null
          owner?: string | null
          permissions?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          file_hash?: string
          file_path?: string
          file_size?: number | null
          id?: string
          is_directory?: boolean | null
          is_monitored?: boolean | null
          last_modified?: string | null
          owner?: string | null
          permissions?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fim_baselines_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      fim_events: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          agent_id: string
          baseline_id: string | null
          change_type: string
          created_at: string | null
          file_path: string
          id: string
          is_acknowledged: boolean | null
          new_hash: string | null
          new_value: Json | null
          old_hash: string | null
          old_value: Json | null
          severity: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          agent_id: string
          baseline_id?: string | null
          change_type: string
          created_at?: string | null
          file_path: string
          id?: string
          is_acknowledged?: boolean | null
          new_hash?: string | null
          new_value?: Json | null
          old_hash?: string | null
          old_value?: Json | null
          severity?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          agent_id?: string
          baseline_id?: string | null
          change_type?: string
          created_at?: string | null
          file_path?: string
          id?: string
          is_acknowledged?: boolean | null
          new_hash?: string | null
          new_value?: Json | null
          old_hash?: string | null
          old_value?: Json | null
          severity?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fim_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fim_events_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "fim_baselines"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          created_at: string
          funnel_name: string
          id: string
          ip_address: string | null
          metadata: Json | null
          product: string | null
          session_id: string
          step_name: string
          step_order: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          funnel_name: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          product?: string | null
          session_id: string
          step_name: string
          step_order: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          funnel_name?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          product?: string | null
          session_id?: string
          step_name?: string
          step_order?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      gpt_conversations: {
        Row: {
          created_at: string
          gpt_id: string
          id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gpt_id: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gpt_id?: string
          id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gpt_conversations_gpt_id_fkey"
            columns: ["gpt_id"]
            isOneToOne: false
            referencedRelation: "custom_gpts"
            referencedColumns: ["id"]
          },
        ]
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
      gpt_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          response_time_ms: number | null
          role: string
          tokens_used: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          response_time_ms?: number | null
          role: string
          tokens_used?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          response_time_ms?: number | null
          role?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gpt_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "gpt_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      helpdesk_canned_responses: {
        Row: {
          category: string | null
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          keywords: string[] | null
          shortcut: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          shortcut?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          keywords?: string[] | null
          shortcut?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      helpdesk_chat_conversations: {
        Row: {
          ai_resolved: boolean | null
          client_id: string | null
          created_at: string | null
          created_ticket_id: string | null
          ended_at: string | null
          id: string
          language_detected: string | null
          messages_count: number | null
          resolution_type: string | null
          satisfaction_rating: number | null
          session_id: string
          started_at: string | null
          status: string | null
          user_email: string | null
          user_name: string | null
        }
        Insert: {
          ai_resolved?: boolean | null
          client_id?: string | null
          created_at?: string | null
          created_ticket_id?: string | null
          ended_at?: string | null
          id?: string
          language_detected?: string | null
          messages_count?: number | null
          resolution_type?: string | null
          satisfaction_rating?: number | null
          session_id: string
          started_at?: string | null
          status?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Update: {
          ai_resolved?: boolean | null
          client_id?: string | null
          created_at?: string | null
          created_ticket_id?: string | null
          ended_at?: string | null
          id?: string
          language_detected?: string | null
          messages_count?: number | null
          resolution_type?: string | null
          satisfaction_rating?: number | null
          session_id?: string
          started_at?: string | null
          status?: string | null
          user_email?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      helpdesk_chat_messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          role: string
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "helpdesk_chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      helpdesk_issue_patterns: {
        Row: {
          affected_category: string | null
          alert_threshold: number | null
          auto_alert: boolean | null
          created_at: string | null
          detection_criteria: Json
          id: string
          is_active: boolean | null
          last_occurrence: string | null
          occurrence_count: number | null
          pattern_description: string | null
          pattern_name: string
          severity: string | null
        }
        Insert: {
          affected_category?: string | null
          alert_threshold?: number | null
          auto_alert?: boolean | null
          created_at?: string | null
          detection_criteria: Json
          id?: string
          is_active?: boolean | null
          last_occurrence?: string | null
          occurrence_count?: number | null
          pattern_description?: string | null
          pattern_name: string
          severity?: string | null
        }
        Update: {
          affected_category?: string | null
          alert_threshold?: number | null
          auto_alert?: boolean | null
          created_at?: string | null
          detection_criteria?: Json
          id?: string
          is_active?: boolean | null
          last_occurrence?: string | null
          occurrence_count?: number | null
          pattern_description?: string | null
          pattern_name?: string
          severity?: string | null
        }
        Relationships: []
      }
      helpdesk_kb_articles: {
        Row: {
          author_id: string | null
          category: string
          content: string
          created_at: string | null
          excerpt: string | null
          helpful_count: number | null
          id: string
          is_internal: boolean | null
          is_published: boolean | null
          keywords: string[] | null
          last_reviewed_at: string | null
          not_helpful_count: number | null
          subcategory: string | null
          tags: string[] | null
          times_linked_to_tickets: number | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          author_id?: string | null
          category: string
          content: string
          created_at?: string | null
          excerpt?: string | null
          helpful_count?: number | null
          id?: string
          is_internal?: boolean | null
          is_published?: boolean | null
          keywords?: string[] | null
          last_reviewed_at?: string | null
          not_helpful_count?: number | null
          subcategory?: string | null
          tags?: string[] | null
          times_linked_to_tickets?: number | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          author_id?: string | null
          category?: string
          content?: string
          created_at?: string | null
          excerpt?: string | null
          helpful_count?: number | null
          id?: string
          is_internal?: boolean | null
          is_published?: boolean | null
          keywords?: string[] | null
          last_reviewed_at?: string | null
          not_helpful_count?: number | null
          subcategory?: string | null
          tags?: string[] | null
          times_linked_to_tickets?: number | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      helpdesk_sentiment_logs: {
        Row: {
          client_id: string | null
          conversation_id: string | null
          frustration_level: number | null
          id: string
          recorded_at: string | null
          sentiment: string
          source: string | null
          ticket_id: string | null
        }
        Insert: {
          client_id?: string | null
          conversation_id?: string | null
          frustration_level?: number | null
          id?: string
          recorded_at?: string | null
          sentiment: string
          source?: string | null
          ticket_id?: string | null
        }
        Update: {
          client_id?: string | null
          conversation_id?: string | null
          frustration_level?: number | null
          id?: string
          recorded_at?: string | null
          sentiment?: string
          source?: string | null
          ticket_id?: string | null
        }
        Relationships: []
      }
      helpdesk_technicians: {
        Row: {
          availability_status: string | null
          avg_resolution_time_minutes: number | null
          avg_satisfaction_rating: number | null
          certifications: string[] | null
          created_at: string | null
          current_ticket_count: number | null
          display_name: string
          email: string | null
          first_response_avg_minutes: number | null
          id: string
          is_active: boolean | null
          max_concurrent_tickets: number | null
          shift_end: string | null
          shift_start: string | null
          skill_levels: Json | null
          specializations: string[] | null
          tickets_resolved_this_month: number | null
          tickets_resolved_total: number | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          availability_status?: string | null
          avg_resolution_time_minutes?: number | null
          avg_satisfaction_rating?: number | null
          certifications?: string[] | null
          created_at?: string | null
          current_ticket_count?: number | null
          display_name: string
          email?: string | null
          first_response_avg_minutes?: number | null
          id?: string
          is_active?: boolean | null
          max_concurrent_tickets?: number | null
          shift_end?: string | null
          shift_start?: string | null
          skill_levels?: Json | null
          specializations?: string[] | null
          tickets_resolved_this_month?: number | null
          tickets_resolved_total?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          availability_status?: string | null
          avg_resolution_time_minutes?: number | null
          avg_satisfaction_rating?: number | null
          certifications?: string[] | null
          created_at?: string | null
          current_ticket_count?: number | null
          display_name?: string
          email?: string | null
          first_response_avg_minutes?: number | null
          id?: string
          is_active?: boolean | null
          max_concurrent_tickets?: number | null
          shift_end?: string | null
          shift_start?: string | null
          skill_levels?: Json | null
          specializations?: string[] | null
          tickets_resolved_this_month?: number | null
          tickets_resolved_total?: number | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      helpdesk_ticket_handoffs: {
        Row: {
          ai_generated_summary: string | null
          context_notes: string | null
          from_technician_id: string | null
          handoff_at: string | null
          handoff_reason: string | null
          id: string
          ticket_id: string
          to_technician_id: string | null
        }
        Insert: {
          ai_generated_summary?: string | null
          context_notes?: string | null
          from_technician_id?: string | null
          handoff_at?: string | null
          handoff_reason?: string | null
          id?: string
          ticket_id: string
          to_technician_id?: string | null
        }
        Update: {
          ai_generated_summary?: string | null
          context_notes?: string | null
          from_technician_id?: string | null
          handoff_at?: string | null
          handoff_reason?: string | null
          id?: string
          ticket_id?: string
          to_technician_id?: string | null
        }
        Relationships: []
      }
      helpdesk_tickets: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          category: string | null
          contact_id: string | null
          created_at: string | null
          customer_id: string | null
          customer_satisfaction: number | null
          description: string | null
          device_context: Json | null
          escalation_level: number | null
          estimated_hours: number | null
          first_response_at: string | null
          id: string
          last_activity_at: string | null
          priority: string | null
          resolution_notes: string | null
          resolved_at: string | null
          sla_due_at: string | null
          sla_policy_id: string | null
          source: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          category?: string | null
          contact_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_satisfaction?: number | null
          description?: string | null
          device_context?: Json | null
          escalation_level?: number | null
          estimated_hours?: number | null
          first_response_at?: string | null
          id?: string
          last_activity_at?: string | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_due_at?: string | null
          sla_policy_id?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          category?: string | null
          contact_id?: string | null
          created_at?: string | null
          customer_id?: string | null
          customer_satisfaction?: number | null
          description?: string | null
          device_context?: Json | null
          escalation_level?: number | null
          estimated_hours?: number | null
          first_response_at?: string | null
          id?: string
          last_activity_at?: string | null
          priority?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          sla_due_at?: string | null
          sla_policy_id?: string | null
          source?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_helpdesk_tickets_contact"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "client_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_helpdesk_tickets_sla"
            columns: ["sla_policy_id"]
            isOneToOne: false
            referencedRelation: "sla_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "helpdesk_tickets_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rmm_customers"
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
      incident_playbooks: {
        Row: {
          auto_trigger: boolean | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          name: string
          severity: string
          steps: Json
          threat_type: string
          times_executed: number | null
          trigger_conditions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_trigger?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name: string
          severity?: string
          steps?: Json
          threat_type: string
          times_executed?: number | null
          trigger_conditions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_trigger?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name?: string
          severity?: string
          steps?: Json
          threat_type?: string
          times_executed?: number | null
          trigger_conditions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      industry_benchmarks: {
        Row: {
          benchmark_date: string
          benchmark_period: string
          benchmark_value: number
          company_size: string
          created_at: string
          id: string
          industry_type: string
          metric_name: string
        }
        Insert: {
          benchmark_date: string
          benchmark_period: string
          benchmark_value: number
          company_size: string
          created_at?: string
          id?: string
          industry_type: string
          metric_name: string
        }
        Update: {
          benchmark_date?: string
          benchmark_period?: string
          benchmark_value?: number
          company_size?: string
          created_at?: string
          id?: string
          industry_type?: string
          metric_name?: string
        }
        Relationships: []
      }
      integration_api_keys: {
        Row: {
          api_key_hash: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_name: string
          key_prefix: string
          last_used_at: string | null
          permissions: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key_hash: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name: string
          key_prefix: string
          last_used_at?: string | null
          permissions?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key_hash?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          permissions?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoice_line_items: {
        Row: {
          billing_period_end: string | null
          billing_period_start: string | null
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          item_name: string
          item_type: string
          line_total: number
          metadata: Json | null
          quantity: number
          unit_price: number
        }
        Insert: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          item_name: string
          item_type: string
          line_total?: number
          metadata?: Json | null
          quantity?: number
          unit_price?: number
        }
        Update: {
          billing_period_end?: string | null
          billing_period_start?: string | null
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          item_name?: string
          item_type?: string
          line_total?: number
          metadata?: Json | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_templates: {
        Row: {
          auto_send: boolean | null
          created_at: string
          footer_html: string | null
          header_html: string | null
          id: string
          is_active: boolean | null
          payment_terms_days: number | null
          template_name: string
          template_type: string
          terms_conditions: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_send?: boolean | null
          created_at?: string
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_active?: boolean | null
          payment_terms_days?: number | null
          template_name: string
          template_type: string
          terms_conditions?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_send?: boolean | null
          created_at?: string
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_active?: boolean | null
          payment_terms_days?: number | null
          template_name?: string
          template_type?: string
          terms_conditions?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          auto_generated: boolean | null
          billing_period_end: string | null
          billing_period_start: string | null
          client_id: string | null
          created_at: string
          currency: string | null
          discount_amount: number | null
          due_date: string
          id: string
          internal_notes: string | null
          invoice_number: string
          invoice_type: string
          issue_date: string
          notes: string | null
          payment_date: string | null
          payment_method: string | null
          status: string
          subtotal: number
          tax_amount: number
          tax_rate: number | null
          template_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_generated?: boolean | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          due_date: string
          id?: string
          internal_notes?: string | null
          invoice_number: string
          invoice_type: string
          issue_date?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          template_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_generated?: boolean | null
          billing_period_end?: string | null
          billing_period_start?: string | null
          client_id?: string | null
          created_at?: string
          currency?: string | null
          discount_amount?: number | null
          due_date?: string
          id?: string
          internal_notes?: string | null
          invoice_number?: string
          invoice_type?: string
          issue_date?: string
          notes?: string | null
          payment_date?: string | null
          payment_method?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          tax_rate?: number | null
          template_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "invoice_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          category: string | null
          content: string
          created_at: string
          helpful_count: number | null
          id: string
          is_published: boolean | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      knowledge_base_articles: {
        Row: {
          category: string | null
          content: string
          created_at: string
          helpful_count: number | null
          id: string
          is_internal: boolean | null
          is_published: boolean | null
          not_helpful_count: number | null
          related_articles: string[] | null
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_internal?: boolean | null
          is_published?: boolean | null
          not_helpful_count?: number | null
          related_articles?: string[] | null
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_internal?: boolean | null
          is_published?: boolean | null
          not_helpful_count?: number | null
          related_articles?: string[] | null
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
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
      kpi_definitions: {
        Row: {
          calculation_method: string
          created_at: string
          data_source: string | null
          description: string | null
          id: string
          is_active: boolean | null
          kpi_category: string
          kpi_name: string
          target_period: string | null
          target_value: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          calculation_method: string
          created_at?: string
          data_source?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          kpi_category: string
          kpi_name: string
          target_period?: string | null
          target_value?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          calculation_method?: string
          created_at?: string
          data_source?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          kpi_category?: string
          kpi_name?: string
          target_period?: string | null
          target_value?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_captures: {
        Row: {
          company_name: string | null
          company_size: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          lead_source: string
          message: string | null
          metadata: Json | null
          phone: string | null
          product_interest: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          lead_source?: string
          message?: string | null
          metadata?: Json | null
          phone?: string | null
          product_interest?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          lead_source?: string
          message?: string | null
          metadata?: Json | null
          phone?: string | null
          product_interest?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      live_response_commands: {
        Row: {
          command: string
          duration_ms: number | null
          executed_at: string | null
          exit_code: number | null
          id: string
          is_dangerous: boolean | null
          output: string | null
          session_id: string
        }
        Insert: {
          command: string
          duration_ms?: number | null
          executed_at?: string | null
          exit_code?: number | null
          id?: string
          is_dangerous?: boolean | null
          output?: string | null
          session_id: string
        }
        Update: {
          command?: string
          duration_ms?: number | null
          executed_at?: string | null
          exit_code?: number | null
          id?: string
          is_dangerous?: boolean | null
          output?: string | null
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_response_commands_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_response_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      live_response_sessions: {
        Row: {
          agent_id: string
          case_id: string | null
          commands_executed: number | null
          ended_at: string | null
          id: string
          last_activity_at: string | null
          recording_enabled: boolean | null
          session_notes: string | null
          session_type: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          agent_id: string
          case_id?: string | null
          commands_executed?: number | null
          ended_at?: string | null
          id?: string
          last_activity_at?: string | null
          recording_enabled?: boolean | null
          session_notes?: string | null
          session_type?: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          case_id?: string | null
          commands_executed?: number | null
          ended_at?: string | null
          id?: string
          last_activity_at?: string | null
          recording_enabled?: boolean | null
          session_notes?: string | null
          session_type?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_response_sessions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_response_sessions_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "mdr_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      mdr_case_activities: {
        Row: {
          activity_type: string
          attachments: Json | null
          case_id: string
          created_at: string | null
          description: string
          id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string
        }
        Insert: {
          activity_type: string
          attachments?: Json | null
          case_id: string
          created_at?: string | null
          description: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id: string
        }
        Update: {
          activity_type?: string
          attachments?: Json | null
          case_id?: string
          created_at?: string | null
          description?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mdr_case_activities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "mdr_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      mdr_cases: {
        Row: {
          affected_assets: Json | null
          assigned_analyst: string | null
          case_number: string
          closed_at: string | null
          contained_at: string | null
          created_at: string | null
          description: string | null
          escalation_level: number | null
          first_response_at: string | null
          id: string
          incident_ids: string[] | null
          lessons_learned: string | null
          notes: string | null
          priority: number | null
          remediation_steps: string[] | null
          root_cause: string | null
          severity: string
          status: string
          time_to_contain_minutes: number | null
          time_to_detect_minutes: number | null
          time_to_remediate_minutes: number | null
          time_to_respond_minutes: number | null
          timeline: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          affected_assets?: Json | null
          assigned_analyst?: string | null
          case_number: string
          closed_at?: string | null
          contained_at?: string | null
          created_at?: string | null
          description?: string | null
          escalation_level?: number | null
          first_response_at?: string | null
          id?: string
          incident_ids?: string[] | null
          lessons_learned?: string | null
          notes?: string | null
          priority?: number | null
          remediation_steps?: string[] | null
          root_cause?: string | null
          severity: string
          status?: string
          time_to_contain_minutes?: number | null
          time_to_detect_minutes?: number | null
          time_to_remediate_minutes?: number | null
          time_to_respond_minutes?: number | null
          timeline?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          affected_assets?: Json | null
          assigned_analyst?: string | null
          case_number?: string
          closed_at?: string | null
          contained_at?: string | null
          created_at?: string | null
          description?: string | null
          escalation_level?: number | null
          first_response_at?: string | null
          id?: string
          incident_ids?: string[] | null
          lessons_learned?: string | null
          notes?: string | null
          priority?: number | null
          remediation_steps?: string[] | null
          root_cause?: string | null
          severity?: string
          status?: string
          time_to_contain_minutes?: number | null
          time_to_detect_minutes?: number | null
          time_to_remediate_minutes?: number | null
          time_to_respond_minutes?: number | null
          timeline?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      mfa_trusted_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          expires_at: string
          id: string
          ip_address: unknown
          trusted_at: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          expires_at: string
          id?: string
          ip_address?: unknown
          trusted_at?: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          expires_at?: string
          id?: string
          ip_address?: unknown
          trusted_at?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mitre_attack_mappings: {
        Row: {
          confidence: number | null
          created_at: string | null
          evidence: Json | null
          finding_id: string | null
          id: string
          incident_id: string | null
          sub_technique_id: string | null
          sub_technique_name: string | null
          tactic_id: string
          tactic_name: string
          technique_id: string
          technique_name: string
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          evidence?: Json | null
          finding_id?: string | null
          id?: string
          incident_id?: string | null
          sub_technique_id?: string | null
          sub_technique_name?: string | null
          tactic_id: string
          tactic_name: string
          technique_id: string
          technique_name: string
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          evidence?: Json | null
          finding_id?: string | null
          id?: string
          incident_id?: string | null
          sub_technique_id?: string | null
          sub_technique_name?: string | null
          tactic_id?: string
          tactic_name?: string
          technique_id?: string
          technique_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "mitre_attack_mappings_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "security_incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_devices: {
        Row: {
          app_version: string | null
          created_at: string
          device_name: string | null
          device_token: string
          id: string
          is_active: boolean | null
          last_seen_at: string | null
          notification_preferences: Json | null
          os_version: string | null
          platform: string
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          app_version?: string | null
          created_at?: string
          device_name?: string | null
          device_token: string
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          notification_preferences?: Json | null
          os_version?: string | null
          platform: string
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          app_version?: string | null
          created_at?: string
          device_name?: string | null
          device_token?: string
          id?: string
          is_active?: boolean | null
          last_seen_at?: string | null
          notification_preferences?: Json | null
          os_version?: string | null
          platform?: string
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      msp_api_keys: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at: string | null
          msp_id: string
          permissions: Json
          rate_limit_per_day: number | null
          rate_limit_per_hour: number | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at?: string | null
          msp_id: string
          permissions?: Json
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          msp_id?: string
          permissions?: Json
          rate_limit_per_day?: number | null
          rate_limit_per_hour?: number | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      msp_api_usage: {
        Row: {
          api_key_id: string
          created_at: string | null
          endpoint: string
          id: string
          ip_address: unknown
          method: string
          request_size_bytes: number | null
          response_size_bytes: number | null
          response_status: number | null
          response_time_ms: number | null
          user_agent: string | null
        }
        Insert: {
          api_key_id: string
          created_at?: string | null
          endpoint: string
          id?: string
          ip_address?: unknown
          method: string
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_status?: number | null
          response_time_ms?: number | null
          user_agent?: string | null
        }
        Update: {
          api_key_id?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          ip_address?: unknown
          method?: string
          request_size_bytes?: number | null
          response_size_bytes?: number | null
          response_status?: number | null
          response_time_ms?: number | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "msp_api_usage_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "msp_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_billing_periods: {
        Row: {
          created_at: string
          id: string
          msp_user_id: string
          period_end: string
          period_start: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          msp_user_id: string
          period_end: string
          period_start: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          msp_user_id?: string
          period_end?: string
          period_start?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      msp_billing_records: {
        Row: {
          additional_charges: number | null
          base_amount: number | null
          billing_period_end: string
          billing_period_start: string
          client_id: string
          created_at: string
          due_date: string | null
          id: string
          invoice_number: string | null
          paid_date: string | null
          payment_method: string | null
          service_type: string
          status: string
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_charges?: number | null
          base_amount?: number | null
          billing_period_end: string
          billing_period_start: string
          client_id: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          paid_date?: string | null
          payment_method?: string | null
          service_type: string
          status?: string
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_charges?: number | null
          base_amount?: number | null
          billing_period_end?: string
          billing_period_start?: string
          client_id?: string
          created_at?: string
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          paid_date?: string | null
          payment_method?: string | null
          service_type?: string
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      msp_billing_templates: {
        Row: {
          billing_frequency: string
          client_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          msp_user_id: string
          service_name: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          billing_frequency?: string
          client_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          msp_user_id: string
          service_name: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          billing_frequency?: string
          client_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          msp_user_id?: string
          service_name?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      msp_billing_usage: {
        Row: {
          billing_period: string | null
          client_id: string
          created_at: string
          id: string
          metadata: Json | null
          msp_id: string
          processed: boolean | null
          quantity: number
          service_type: string
          total_cost: number
          unit_cost: number
          usage_type: string
        }
        Insert: {
          billing_period?: string | null
          client_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          msp_id: string
          processed?: boolean | null
          quantity?: number
          service_type: string
          total_cost?: number
          unit_cost?: number
          usage_type: string
        }
        Update: {
          billing_period?: string | null
          client_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          msp_id?: string
          processed?: boolean | null
          quantity?: number
          service_type?: string
          total_cost?: number
          unit_cost?: number
          usage_type?: string
        }
        Relationships: []
      }
      msp_churn_predictions: {
        Row: {
          churn_risk_score: number
          client_id: string
          contract_renewal_date: string | null
          contributing_factors: Json | null
          created_at: string
          id: string
          last_engagement_date: string | null
          msp_id: string
          payment_history_score: number | null
          recommended_actions: Json | null
          risk_level: string
          satisfaction_trend: string | null
          support_ticket_trend: string | null
          updated_at: string
        }
        Insert: {
          churn_risk_score?: number
          client_id: string
          contract_renewal_date?: string | null
          contributing_factors?: Json | null
          created_at?: string
          id?: string
          last_engagement_date?: string | null
          msp_id: string
          payment_history_score?: number | null
          recommended_actions?: Json | null
          risk_level?: string
          satisfaction_trend?: string | null
          support_ticket_trend?: string | null
          updated_at?: string
        }
        Update: {
          churn_risk_score?: number
          client_id?: string
          contract_renewal_date?: string | null
          contributing_factors?: Json | null
          created_at?: string
          id?: string
          last_engagement_date?: string | null
          msp_id?: string
          payment_history_score?: number | null
          recommended_actions?: Json | null
          risk_level?: string
          satisfaction_trend?: string | null
          support_ticket_trend?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      msp_client_endpoints: {
        Row: {
          assigned_technician: string | null
          billing_rate: number | null
          client_name: string
          compliance_requirements: string[] | null
          created_at: string
          department: string | null
          endpoint_id: string
          id: string
          location: string | null
          metadata: Json | null
          monitoring_level: string | null
          msp_org_id: string
          sla_tier: string | null
          updated_at: string
        }
        Insert: {
          assigned_technician?: string | null
          billing_rate?: number | null
          client_name: string
          compliance_requirements?: string[] | null
          created_at?: string
          department?: string | null
          endpoint_id: string
          id?: string
          location?: string | null
          metadata?: Json | null
          monitoring_level?: string | null
          msp_org_id: string
          sla_tier?: string | null
          updated_at?: string
        }
        Update: {
          assigned_technician?: string | null
          billing_rate?: number | null
          client_name?: string
          compliance_requirements?: string[] | null
          created_at?: string
          department?: string | null
          endpoint_id?: string
          id?: string
          location?: string | null
          metadata?: Json | null
          monitoring_level?: string | null
          msp_org_id?: string
          sla_tier?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "msp_client_endpoints_endpoint_id_fkey"
            columns: ["endpoint_id"]
            isOneToOne: false
            referencedRelation: "safe_shield_endpoints"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "msp_client_endpoints_msp_org_id_fkey"
            columns: ["msp_org_id"]
            isOneToOne: false
            referencedRelation: "msp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_client_license_assignments: {
        Row: {
          assigned_users: number
          client_id: string
          created_at: string
          id: string
          price_per_user: number
          tier: string
          updated_at: string
        }
        Insert: {
          assigned_users?: number
          client_id: string
          created_at?: string
          id?: string
          price_per_user: number
          tier: string
          updated_at?: string
        }
        Update: {
          assigned_users?: number
          client_id?: string
          created_at?: string
          id?: string
          price_per_user?: number
          tier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "msp_client_license_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_client_portal_access: {
        Row: {
          access_token_hash: string
          client_id: string
          created_at: string | null
          id: string
          invited_at: string | null
          is_active: boolean | null
          last_login_at: string | null
          login_count: number | null
          permissions: Json
          updated_at: string | null
          user_email: string
        }
        Insert: {
          access_token_hash: string
          client_id: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          permissions?: Json
          updated_at?: string | null
          user_email: string
        }
        Update: {
          access_token_hash?: string
          client_id?: string
          created_at?: string | null
          id?: string
          invited_at?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          login_count?: number | null
          permissions?: Json
          updated_at?: string | null
          user_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "msp_client_portal_access_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_client_whitelabel_configs: {
        Row: {
          background_color: string
          client_can_edit: boolean
          client_id: string
          client_name: string
          co_management_enabled: boolean
          company_logo: string
          company_name: string
          created_at: string
          custom_css: string
          custom_domain: string
          custom_login_page: boolean
          email_templates: Json
          favicon_url: string
          footer_text: string
          hide_powered_by: boolean
          id: string
          is_active: boolean
          msp_approval_required: boolean
          msp_user_id: string
          primary_color: string
          secondary_color: string
          text_color: string
          updated_at: string
        }
        Insert: {
          background_color?: string
          client_can_edit?: boolean
          client_id: string
          client_name: string
          co_management_enabled?: boolean
          company_logo?: string
          company_name?: string
          created_at?: string
          custom_css?: string
          custom_domain?: string
          custom_login_page?: boolean
          email_templates?: Json
          favicon_url?: string
          footer_text?: string
          hide_powered_by?: boolean
          id?: string
          is_active?: boolean
          msp_approval_required?: boolean
          msp_user_id: string
          primary_color?: string
          secondary_color?: string
          text_color?: string
          updated_at?: string
        }
        Update: {
          background_color?: string
          client_can_edit?: boolean
          client_id?: string
          client_name?: string
          co_management_enabled?: boolean
          company_logo?: string
          company_name?: string
          created_at?: string
          custom_css?: string
          custom_domain?: string
          custom_login_page?: boolean
          email_templates?: Json
          favicon_url?: string
          footer_text?: string
          hide_powered_by?: boolean
          id?: string
          is_active?: boolean
          msp_approval_required?: boolean
          msp_user_id?: string
          primary_color?: string
          secondary_color?: string
          text_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      msp_clients: {
        Row: {
          alerts: number | null
          api_enabled: boolean | null
          billing_status: string | null
          business_hours: Json | null
          business_size: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contract_end_date: string | null
          created_at: string
          current_users: number | null
          custom_branding: Json | null
          domain: string | null
          endpoints: number | null
          health_status: string | null
          id: string
          integration_settings: Json | null
          is_active: boolean | null
          last_billed_at: string | null
          max_users: number | null
          monthly_fee: number | null
          monthly_rate: number
          msp_id: string
          onboarding_fee_amount: number | null
          onboarding_fee_paid: boolean | null
          phone: string | null
          timezone: string | null
          tool_access: Json | null
          trial_ends_at: string | null
          updated_at: string
          webapp_enabled: boolean | null
          widget_enabled: boolean | null
        }
        Insert: {
          alerts?: number | null
          api_enabled?: boolean | null
          billing_status?: string | null
          business_hours?: Json | null
          business_size?: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contract_end_date?: string | null
          created_at?: string
          current_users?: number | null
          custom_branding?: Json | null
          domain?: string | null
          endpoints?: number | null
          health_status?: string | null
          id?: string
          integration_settings?: Json | null
          is_active?: boolean | null
          last_billed_at?: string | null
          max_users?: number | null
          monthly_fee?: number | null
          monthly_rate: number
          msp_id: string
          onboarding_fee_amount?: number | null
          onboarding_fee_paid?: boolean | null
          phone?: string | null
          timezone?: string | null
          tool_access?: Json | null
          trial_ends_at?: string | null
          updated_at?: string
          webapp_enabled?: boolean | null
          widget_enabled?: boolean | null
        }
        Update: {
          alerts?: number | null
          api_enabled?: boolean | null
          billing_status?: string | null
          business_hours?: Json | null
          business_size?: string | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          contract_end_date?: string | null
          created_at?: string
          current_users?: number | null
          custom_branding?: Json | null
          domain?: string | null
          endpoints?: number | null
          health_status?: string | null
          id?: string
          integration_settings?: Json | null
          is_active?: boolean | null
          last_billed_at?: string | null
          max_users?: number | null
          monthly_fee?: number | null
          monthly_rate?: number
          msp_id?: string
          onboarding_fee_amount?: number | null
          onboarding_fee_paid?: boolean | null
          phone?: string | null
          timezone?: string | null
          tool_access?: Json | null
          trial_ends_at?: string | null
          updated_at?: string
          webapp_enabled?: boolean | null
          widget_enabled?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_msp_clients_msp"
            columns: ["msp_id"]
            isOneToOne: false
            referencedRelation: "msps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "msp_clients_msp_id_fkey"
            columns: ["msp_id"]
            isOneToOne: false
            referencedRelation: "msps"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_competitive_benchmarks: {
        Row: {
          benchmark_date: string
          created_at: string
          data_source: string | null
          id: string
          industry_average: number | null
          metric_name: string
          metric_value: number
          msp_id: string
          percentile_rank: number | null
          recommendations: Json | null
          top_quartile: number | null
          trend_direction: string | null
          updated_at: string
        }
        Insert: {
          benchmark_date: string
          created_at?: string
          data_source?: string | null
          id?: string
          industry_average?: number | null
          metric_name: string
          metric_value: number
          msp_id: string
          percentile_rank?: number | null
          recommendations?: Json | null
          top_quartile?: number | null
          trend_direction?: string | null
          updated_at?: string
        }
        Update: {
          benchmark_date?: string
          created_at?: string
          data_source?: string | null
          id?: string
          industry_average?: number | null
          metric_name?: string
          metric_value?: number
          msp_id?: string
          percentile_rank?: number | null
          recommendations?: Json | null
          top_quartile?: number | null
          trend_direction?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      msp_email_settings: {
        Row: {
          auto_assign_to: string | null
          business_name: string
          created_at: string | null
          default_category: string | null
          default_priority: string | null
          email_signature: string | null
          id: string
          ingestion_email: string
          is_active: boolean | null
          msp_id: string
          updated_at: string | null
        }
        Insert: {
          auto_assign_to?: string | null
          business_name: string
          created_at?: string | null
          default_category?: string | null
          default_priority?: string | null
          email_signature?: string | null
          id?: string
          ingestion_email: string
          is_active?: boolean | null
          msp_id: string
          updated_at?: string | null
        }
        Update: {
          auto_assign_to?: string | null
          business_name?: string
          created_at?: string | null
          default_category?: string | null
          default_priority?: string | null
          email_signature?: string | null
          id?: string
          ingestion_email?: string
          is_active?: boolean | null
          msp_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      msp_invoice_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          invoice_id: string
          quantity: number
          service_name: string
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id: string
          quantity?: number
          service_name: string
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          invoice_id?: string
          quantity?: number
          service_name?: string
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "msp_invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "msp_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_invoices: {
        Row: {
          billing_period_id: string
          client_id: string
          created_at: string
          currency: string
          due_date: string
          id: string
          invoice_number: string
          msp_user_id: string
          notes: string | null
          paid_at: string | null
          sent_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          subtotal: number
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          billing_period_id: string
          client_id: string
          created_at?: string
          currency?: string
          due_date: string
          id?: string
          invoice_number: string
          msp_user_id: string
          notes?: string | null
          paid_at?: string | null
          sent_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          billing_period_id?: string
          client_id?: string
          created_at?: string
          currency?: string
          due_date?: string
          id?: string
          invoice_number?: string
          msp_user_id?: string
          notes?: string | null
          paid_at?: string | null
          sent_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "msp_invoices_billing_period_id_fkey"
            columns: ["billing_period_id"]
            isOneToOne: false
            referencedRelation: "msp_billing_periods"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_lead_scoring: {
        Row: {
          assigned_to: string | null
          budget_range: string | null
          company_name: string
          company_size: string | null
          created_at: string
          email: string | null
          engagement_level: string
          id: string
          industry: string | null
          last_activity_date: string | null
          lead_name: string
          lead_score: number
          lead_source: string | null
          msp_id: string
          next_action: string | null
          pain_points: Json | null
          phone: string | null
          score_breakdown: Json | null
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          budget_range?: string | null
          company_name: string
          company_size?: string | null
          created_at?: string
          email?: string | null
          engagement_level?: string
          id?: string
          industry?: string | null
          last_activity_date?: string | null
          lead_name: string
          lead_score?: number
          lead_source?: string | null
          msp_id: string
          next_action?: string | null
          pain_points?: Json | null
          phone?: string | null
          score_breakdown?: Json | null
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          budget_range?: string | null
          company_name?: string
          company_size?: string | null
          created_at?: string
          email?: string | null
          engagement_level?: string
          id?: string
          industry?: string | null
          last_activity_date?: string | null
          lead_name?: string
          lead_score?: number
          lead_source?: string | null
          msp_id?: string
          next_action?: string | null
          pain_points?: Json | null
          phone?: string | null
          score_breakdown?: Json | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      msp_license_pools: {
        Row: {
          assigned_licenses: number
          available_licenses: number | null
          created_at: string
          id: string
          msp_id: string
          price_per_license: number
          tier: string
          total_licenses: number
          updated_at: string
        }
        Insert: {
          assigned_licenses?: number
          available_licenses?: number | null
          created_at?: string
          id?: string
          msp_id: string
          price_per_license: number
          tier: string
          total_licenses?: number
          updated_at?: string
        }
        Update: {
          assigned_licenses?: number
          available_licenses?: number | null
          created_at?: string
          id?: string
          msp_id?: string
          price_per_license?: number
          tier?: string
          total_licenses?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "msp_license_pools_msp_id_fkey"
            columns: ["msp_id"]
            isOneToOne: false
            referencedRelation: "msps"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_notifications: {
        Row: {
          action_url: string | null
          client_id: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string
          metadata: Json | null
          msp_id: string
          notification_type: string
          priority: string
          title: string
          triggered_by: string | null
        }
        Insert: {
          action_url?: string | null
          client_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          msp_id: string
          notification_type: string
          priority?: string
          title: string
          triggered_by?: string | null
        }
        Update: {
          action_url?: string | null
          client_id?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          msp_id?: string
          notification_type?: string
          priority?: string
          title?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "msp_notifications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_organizations: {
        Row: {
          address: string | null
          billing_contact: string | null
          contact_email: string | null
          created_at: string
          domain: string | null
          id: string
          max_endpoints: number | null
          name: string
          phone: string | null
          settings: Json | null
          status: string | null
          subscription_tier: string | null
          technical_contact: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          white_label_config: Json | null
        }
        Insert: {
          address?: string | null
          billing_contact?: string | null
          contact_email?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          max_endpoints?: number | null
          name: string
          phone?: string | null
          settings?: Json | null
          status?: string | null
          subscription_tier?: string | null
          technical_contact?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          white_label_config?: Json | null
        }
        Update: {
          address?: string | null
          billing_contact?: string | null
          contact_email?: string | null
          created_at?: string
          domain?: string | null
          id?: string
          max_endpoints?: number | null
          name?: string
          phone?: string | null
          settings?: Json | null
          status?: string | null
          subscription_tier?: string | null
          technical_contact?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          white_label_config?: Json | null
        }
        Relationships: []
      }
      msp_profit_analytics: {
        Row: {
          client_id: string
          cost_breakdown: Json | null
          costs: number
          created_at: string
          id: string
          industry_benchmark: number | null
          msp_id: string
          optimization_suggestions: Json | null
          period_end: string
          period_start: string
          profit_margin: number
          revenue: number
          updated_at: string
        }
        Insert: {
          client_id: string
          cost_breakdown?: Json | null
          costs?: number
          created_at?: string
          id?: string
          industry_benchmark?: number | null
          msp_id: string
          optimization_suggestions?: Json | null
          period_end: string
          period_start: string
          profit_margin?: number
          revenue?: number
          updated_at?: string
        }
        Update: {
          client_id?: string
          cost_breakdown?: Json | null
          costs?: number
          created_at?: string
          id?: string
          industry_benchmark?: number | null
          msp_id?: string
          optimization_suggestions?: Json | null
          period_end?: string
          period_start?: string
          profit_margin?: number
          revenue?: number
          updated_at?: string
        }
        Relationships: []
      }
      msp_quickbooks_config: {
        Row: {
          access_token_encrypted: string | null
          company_id: string
          created_at: string | null
          id: string
          last_sync_at: string | null
          msp_id: string
          refresh_token_encrypted: string | null
          sync_enabled: boolean | null
          sync_frequency: string | null
          sync_settings: Json | null
          token_expires_at: string | null
          updated_at: string | null
          webhook_endpoint: string | null
        }
        Insert: {
          access_token_encrypted?: string | null
          company_id: string
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          msp_id: string
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          sync_settings?: Json | null
          token_expires_at?: string | null
          updated_at?: string | null
          webhook_endpoint?: string | null
        }
        Update: {
          access_token_encrypted?: string | null
          company_id?: string
          created_at?: string | null
          id?: string
          last_sync_at?: string | null
          msp_id?: string
          refresh_token_encrypted?: string | null
          sync_enabled?: boolean | null
          sync_frequency?: string | null
          sync_settings?: Json | null
          token_expires_at?: string | null
          updated_at?: string | null
          webhook_endpoint?: string | null
        }
        Relationships: []
      }
      msp_quickbooks_sync_log: {
        Row: {
          completed_at: string | null
          entity_type: string
          error_details: Json | null
          id: string
          metadata: Json | null
          msp_id: string
          records_failed: number | null
          records_processed: number | null
          records_succeeded: number | null
          started_at: string | null
          sync_status: string
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          entity_type: string
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          msp_id: string
          records_failed?: number | null
          records_processed?: number | null
          records_succeeded?: number | null
          started_at?: string | null
          sync_status?: string
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          entity_type?: string
          error_details?: Json | null
          id?: string
          metadata?: Json | null
          msp_id?: string
          records_failed?: number | null
          records_processed?: number | null
          records_succeeded?: number | null
          started_at?: string | null
          sync_status?: string
          sync_type?: string
        }
        Relationships: []
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
      msp_service_agreements: {
        Row: {
          availability_percentage: number | null
          client_id: string
          created_at: string
          effective_date: string
          expiry_date: string | null
          id: string
          is_active: boolean | null
          monthly_fee: number | null
          resolution_time_hours: number | null
          response_time_minutes: number | null
          service_type: string
          terms: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          availability_percentage?: number | null
          client_id: string
          created_at?: string
          effective_date: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee?: number | null
          resolution_time_hours?: number | null
          response_time_minutes?: number | null
          service_type: string
          terms?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          availability_percentage?: number | null
          client_id?: string
          created_at?: string
          effective_date?: string
          expiry_date?: string | null
          id?: string
          is_active?: boolean | null
          monthly_fee?: number | null
          resolution_time_hours?: number | null
          response_time_minutes?: number | null
          service_type?: string
          terms?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      msp_staff: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          msp_id: string
          role: Database["public"]["Enums"]["helpdesk_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          msp_id: string
          role?: Database["public"]["Enums"]["helpdesk_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          msp_id?: string
          role?: Database["public"]["Enums"]["helpdesk_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      msp_upselling_opportunities: {
        Row: {
          action_items: Json | null
          client_id: string
          confidence_score: number
          created_at: string
          current_spend: number
          estimated_close_date: string | null
          id: string
          msp_id: string
          opportunity_type: string
          potential_revenue: number
          priority: string
          reasons: Json | null
          service_name: string
          status: string
          updated_at: string
        }
        Insert: {
          action_items?: Json | null
          client_id: string
          confidence_score?: number
          created_at?: string
          current_spend?: number
          estimated_close_date?: string | null
          id?: string
          msp_id: string
          opportunity_type: string
          potential_revenue?: number
          priority?: string
          reasons?: Json | null
          service_name: string
          status?: string
          updated_at?: string
        }
        Update: {
          action_items?: Json | null
          client_id?: string
          confidence_score?: number
          created_at?: string
          current_spend?: number
          estimated_close_date?: string | null
          id?: string
          msp_id?: string
          opportunity_type?: string
          potential_revenue?: number
          priority?: string
          reasons?: Json | null
          service_name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      msp_user_license_assignments: {
        Row: {
          client_id: string
          created_at: string
          id: string
          is_active: boolean | null
          tier: string
          updated_at: string
          user_email: string
          user_name: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          tier: string
          updated_at?: string
          user_email: string
          user_name?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          tier?: string
          updated_at?: string
          user_email?: string
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "msp_user_license_assignments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_workflow_executions: {
        Row: {
          actions_executed: Json | null
          client_id: string | null
          completed_at: string | null
          error_message: string | null
          execution_status: string
          id: string
          metadata: Json | null
          started_at: string | null
          trigger_data: Json | null
          workflow_id: string
        }
        Insert: {
          actions_executed?: Json | null
          client_id?: string | null
          completed_at?: string | null
          error_message?: string | null
          execution_status?: string
          id?: string
          metadata?: Json | null
          started_at?: string | null
          trigger_data?: Json | null
          workflow_id: string
        }
        Update: {
          actions_executed?: Json | null
          client_id?: string | null
          completed_at?: string | null
          error_message?: string | null
          execution_status?: string
          id?: string
          metadata?: Json | null
          started_at?: string | null
          trigger_data?: Json | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "msp_workflow_executions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "msp_workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "msp_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      msp_workflows: {
        Row: {
          actions: Json
          created_at: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          msp_id: string
          name: string
          trigger_conditions: Json
          trigger_type: string
          updated_at: string | null
        }
        Insert: {
          actions?: Json
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          msp_id: string
          name: string
          trigger_conditions?: Json
          trigger_type: string
          updated_at?: string | null
        }
        Update: {
          actions?: Json
          created_at?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          msp_id?: string
          name?: string
          trigger_conditions?: Json
          trigger_type?: string
          updated_at?: string | null
        }
        Relationships: []
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
      network_connectors: {
        Row: {
          active_scans: number | null
          capabilities: string[] | null
          created_at: string
          id: string
          last_heartbeat: string | null
          location: string | null
          name: string
          network_ranges: string[] | null
          os_info: Json | null
          status: string
          system_metrics: Json | null
          tools_available: string[] | null
          updated_at: string
          user_id: string
          version: string | null
        }
        Insert: {
          active_scans?: number | null
          capabilities?: string[] | null
          created_at?: string
          id?: string
          last_heartbeat?: string | null
          location?: string | null
          name: string
          network_ranges?: string[] | null
          os_info?: Json | null
          status?: string
          system_metrics?: Json | null
          tools_available?: string[] | null
          updated_at?: string
          user_id: string
          version?: string | null
        }
        Update: {
          active_scans?: number | null
          capabilities?: string[] | null
          created_at?: string
          id?: string
          last_heartbeat?: string | null
          location?: string | null
          name?: string
          network_ranges?: string[] | null
          os_info?: Json | null
          status?: string
          system_metrics?: Json | null
          tools_available?: string[] | null
          updated_at?: string
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      network_devices: {
        Row: {
          created_at: string
          device_name: string
          device_type: string
          discovered_at: string | null
          firmware_version: string | null
          id: string
          ip_address: unknown
          last_seen: string | null
          location: string | null
          mac_address: string | null
          manufacturer: string | null
          metadata: Json | null
          model: string | null
          parent_device_id: string | null
          port_count: number | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_name: string
          device_type?: string
          discovered_at?: string | null
          firmware_version?: string | null
          id?: string
          ip_address?: unknown
          last_seen?: string | null
          location?: string | null
          mac_address?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          model?: string | null
          parent_device_id?: string | null
          port_count?: number | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_name?: string
          device_type?: string
          discovered_at?: string | null
          firmware_version?: string | null
          id?: string
          ip_address?: unknown
          last_seen?: string | null
          location?: string | null
          mac_address?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          model?: string | null
          parent_device_id?: string | null
          port_count?: number | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_devices_parent_device_id_fkey"
            columns: ["parent_device_id"]
            isOneToOne: false
            referencedRelation: "network_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      network_findings: {
        Row: {
          connector_id: string
          created_at: string
          cve: string | null
          cvss: number | null
          description: string | null
          discovered_at: string
          evidence: Json | null
          id: string
          impact: string | null
          job_id: string
          port: number | null
          recommendation: string | null
          service: string | null
          severity: string
          target: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          connector_id: string
          created_at?: string
          cve?: string | null
          cvss?: number | null
          description?: string | null
          discovered_at?: string
          evidence?: Json | null
          id?: string
          impact?: string | null
          job_id: string
          port?: number | null
          recommendation?: string | null
          service?: string | null
          severity: string
          target: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          connector_id?: string
          created_at?: string
          cve?: string | null
          cvss?: number | null
          description?: string | null
          discovered_at?: string
          evidence?: Json | null
          id?: string
          impact?: string | null
          job_id?: string
          port?: number | null
          recommendation?: string | null
          service?: string | null
          severity?: string
          target?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_findings_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "network_connectors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "network_findings_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "network_scan_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      network_scan_jobs: {
        Row: {
          completed_at: string | null
          connector_id: string
          created_at: string
          id: string
          options: Json | null
          results_summary: Json | null
          scan_type: string
          started_at: string
          status: string
          targets: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          connector_id: string
          created_at?: string
          id?: string
          options?: Json | null
          results_summary?: Json | null
          scan_type: string
          started_at?: string
          status?: string
          targets: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          connector_id?: string
          created_at?: string
          id?: string
          options?: Json | null
          results_summary?: Json | null
          scan_type?: string
          started_at?: string
          status?: string
          targets?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "network_scan_jobs_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "network_connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      network_scans: {
        Row: {
          completed_at: string | null
          connector_id: string
          created_at: string | null
          devices_found: number
          hostname: string
          id: string
          network_ranges: string[]
          results: Json
          risk_score: number | null
          scan_duration: number
          scan_result: Json | null
          scan_status: string
          scan_type: string
          scanned_at: string
          target_ip: string
          updated_at: string
          user_id: string
          vulnerabilities_found: number | null
        }
        Insert: {
          completed_at?: string | null
          connector_id: string
          created_at?: string | null
          devices_found?: number
          hostname?: string
          id?: string
          network_ranges?: string[]
          results?: Json
          risk_score?: number | null
          scan_duration?: number
          scan_result?: Json | null
          scan_status?: string
          scan_type: string
          scanned_at?: string
          target_ip: string
          updated_at?: string
          user_id: string
          vulnerabilities_found?: number | null
        }
        Update: {
          completed_at?: string | null
          connector_id?: string
          created_at?: string | null
          devices_found?: number
          hostname?: string
          id?: string
          network_ranges?: string[]
          results?: Json
          risk_score?: number | null
          scan_duration?: number
          scan_result?: Json | null
          scan_status?: string
          scan_type?: string
          scanned_at?: string
          target_ip?: string
          updated_at?: string
          user_id?: string
          vulnerabilities_found?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "network_scans_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "safenet_connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          notification_frequency: string | null
          push_notifications: boolean | null
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          security_alerts: boolean | null
          system_notifications: boolean | null
          ticket_updates: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          notification_frequency?: string | null
          push_notifications?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          security_alerts?: boolean | null
          system_notifications?: boolean | null
          ticket_updates?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          notification_frequency?: string | null
          push_notifications?: boolean | null
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          security_alerts?: boolean | null
          system_notifications?: boolean | null
          ticket_updates?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          action_url: string | null
          channel: string
          created_at: string
          error_message: string | null
          id: string
          message: string
          metadata: Json | null
          priority: string | null
          read_at: string | null
          retry_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string | null
          read_at?: string | null
          retry_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string
          email_enabled: boolean | null
          escalation: boolean | null
          id: string
          push_enabled: boolean | null
          sla_breach: boolean | null
          sms_enabled: boolean | null
          ticket_assigned: boolean | null
          ticket_created: boolean | null
          ticket_updated: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean | null
          escalation?: boolean | null
          id?: string
          push_enabled?: boolean | null
          sla_breach?: boolean | null
          sms_enabled?: boolean | null
          ticket_assigned?: boolean | null
          ticket_created?: boolean | null
          ticket_updated?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_enabled?: boolean | null
          escalation?: boolean | null
          id?: string
          push_enabled?: boolean | null
          sla_breach?: boolean | null
          sms_enabled?: boolean | null
          ticket_assigned?: boolean | null
          ticket_created?: boolean | null
          ticket_updated?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string
          created_at: string
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          category?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          category?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      office_locations: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_primary: boolean | null
          name: string
          notes: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name: string
          notes?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_primary?: boolean | null
          name?: string
          notes?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      onboarding_analytics: {
        Row: {
          action_taken: string | null
          created_at: string
          engagement_ms: number | null
          event_type: string
          id: string
          item_id: string
          metadata: Json | null
          step_number: number | null
          user_id: string
          variant: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          engagement_ms?: number | null
          event_type: string
          id?: string
          item_id: string
          metadata?: Json | null
          step_number?: number | null
          user_id: string
          variant?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          engagement_ms?: number | null
          event_type?: string
          id?: string
          item_id?: string
          metadata?: Json | null
          step_number?: number | null
          user_id?: string
          variant?: string | null
        }
        Relationships: []
      }
      onboarding_progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          dismissed: boolean | null
          id: string
          item_id: string
          metadata: Json | null
          progress_type: string
          step_reached: number | null
          updated_at: string
          user_id: string
          variant: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          dismissed?: boolean | null
          id?: string
          item_id: string
          metadata?: Json | null
          progress_type: string
          step_reached?: number | null
          updated_at?: string
          user_id: string
          variant?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          dismissed?: boolean | null
          id?: string
          item_id?: string
          metadata?: Json | null
          progress_type?: string
          step_reached?: number | null
          updated_at?: string
          user_id?: string
          variant?: string | null
        }
        Relationships: []
      }
      onboarding_triggers: {
        Row: {
          action_count: number | null
          created_at: string
          feature_id: string
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          metadata: Json | null
          tip_shown: boolean | null
          trigger_type: string
          updated_at: string
          user_id: string
          visit_count: number | null
        }
        Insert: {
          action_count?: number | null
          created_at?: string
          feature_id: string
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          metadata?: Json | null
          tip_shown?: boolean | null
          trigger_type: string
          updated_at?: string
          user_id: string
          visit_count?: number | null
        }
        Update: {
          action_count?: number | null
          created_at?: string
          feature_id?: string
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          metadata?: Json | null
          tip_shown?: boolean | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
          visit_count?: number | null
        }
        Relationships: []
      }
      one_time_payments: {
        Row: {
          amount: number
          created_at: string
          currency: string | null
          id: string
          metadata: Json | null
          payment_type: string
          product_name: string
          status: string | null
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_type: string
          product_name: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string | null
          id?: string
          metadata?: Json | null
          payment_type?: string
          product_name?: string
          status?: string | null
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      org_credits: {
        Row: {
          created_at: string
          credit_reset_date: string
          credits_remaining: number
          credits_used_this_period: number
          id: string
          monthly_credit_limit: number
          overage_credits_used: number
          overage_enabled: boolean
          plan_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credit_reset_date?: string
          credits_remaining?: number
          credits_used_this_period?: number
          id?: string
          monthly_credit_limit?: number
          overage_credits_used?: number
          overage_enabled?: boolean
          plan_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credit_reset_date?: string
          credits_remaining?: number
          credits_used_this_period?: number
          id?: string
          monthly_credit_limit?: number
          overage_credits_used?: number
          overage_enabled?: boolean
          plan_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          client_code: string
          client_name: string | null
          connector_key: string
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          client_code: string
          client_name?: string | null
          connector_key: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          client_code?: string
          client_name?: string | null
          connector_key?: string
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      password_audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          password_entry_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          password_entry_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
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
      password_scans: {
        Row: {
          analysis_result: Json | null
          created_at: string | null
          id: string
          password_hash: string
          recommendations: string[] | null
          strength_level: string
          strength_score: number
          user_id: string | null
        }
        Insert: {
          analysis_result?: Json | null
          created_at?: string | null
          id?: string
          password_hash: string
          recommendations?: string[] | null
          strength_level: string
          strength_score: number
          user_id?: string | null
        }
        Update: {
          analysis_result?: Json | null
          created_at?: string | null
          id?: string
          password_hash?: string
          recommendations?: string[] | null
          strength_level?: string
          strength_score?: number
          user_id?: string | null
        }
        Relationships: []
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
      patch_management: {
        Row: {
          affected_devices: number | null
          agent_id: string | null
          created_at: string
          description: string | null
          id: string
          installed_at: string | null
          kb_article: string | null
          patch_name: string
          release_date: string | null
          severity: string
          status: string
          updated_at: string
          user_id: string
          vendor: string
        }
        Insert: {
          affected_devices?: number | null
          agent_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          installed_at?: string | null
          kb_article?: string | null
          patch_name: string
          release_date?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id: string
          vendor: string
        }
        Update: {
          affected_devices?: number | null
          agent_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          installed_at?: string | null
          kb_article?: string | null
          patch_name?: string
          release_date?: string | null
          severity?: string
          status?: string
          updated_at?: string
          user_id?: string
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "patch_management_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      patching_policies: {
        Row: {
          ai_risk_assessment: boolean | null
          auto_patch_third_party: boolean | null
          auto_patch_windows: boolean | null
          client_id: string
          created_at: string
          critical_patch_immediate: boolean | null
          id: string
          maintenance_window_end: string | null
          maintenance_window_start: string | null
        }
        Insert: {
          ai_risk_assessment?: boolean | null
          auto_patch_third_party?: boolean | null
          auto_patch_windows?: boolean | null
          client_id: string
          created_at?: string
          critical_patch_immediate?: boolean | null
          id?: string
          maintenance_window_end?: string | null
          maintenance_window_start?: string | null
        }
        Update: {
          ai_risk_assessment?: boolean | null
          auto_patch_third_party?: boolean | null
          auto_patch_windows?: boolean | null
          client_id?: string
          created_at?: string
          critical_patch_immediate?: boolean | null
          id?: string
          maintenance_window_end?: string | null
          maintenance_window_start?: string | null
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          id: string
          metadata: Json | null
          payment_method_id: string | null
          processed_by: string | null
          status: string
          stripe_charge_id: string | null
          stripe_payment_intent_id: string | null
          stripe_refund_id: string | null
          subscription_id: string | null
          transaction_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          processed_by?: string | null
          status: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          subscription_id?: string | null
          transaction_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          payment_method_id?: string | null
          processed_by?: string | null
          status?: string
          stripe_charge_id?: string | null
          stripe_payment_intent_id?: string | null
          stripe_refund_id?: string | null
          subscription_id?: string | null
          transaction_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          created_by: string
          id: string
          invoice_id: string
          notes: string | null
          payment_amount: number
          payment_date: string
          payment_method: string
          payment_reference: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          invoice_id: string
          notes?: string | null
          payment_amount: number
          payment_date?: string
          payment_method: string
          payment_reference?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_amount?: number
          payment_date?: string
          payment_method?: string
          payment_reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      pentest_assessments: {
        Row: {
          agent_id: string | null
          assessment_type: string
          completed_at: string | null
          created_at: string | null
          id: string
          ips_scanned: number | null
          organization_id: string | null
          runtime_seconds: number | null
          scan_options: Json | null
          scheduled_by: string | null
          scheduled_date: string | null
          started_at: string | null
          status: string
          target_hosts: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          assessment_type: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          ips_scanned?: number | null
          organization_id?: string | null
          runtime_seconds?: number | null
          scan_options?: Json | null
          scheduled_by?: string | null
          scheduled_date?: string | null
          started_at?: string | null
          status?: string
          target_hosts?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          assessment_type?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          ips_scanned?: number | null
          organization_id?: string | null
          runtime_seconds?: number | null
          scan_options?: Json | null
          scheduled_by?: string | null
          scheduled_date?: string | null
          started_at?: string | null
          status?: string
          target_hosts?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pentest_assessments_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pentest_assessments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pentest_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pentest_findings: {
        Row: {
          affected_hosts: Json | null
          affected_ports: string[] | null
          assessment_id: string | null
          business_impact: string | null
          created_at: string | null
          cve_ids: string[] | null
          cvss_score: number | null
          cvss_vector: string | null
          cwe_id: string | null
          description: string | null
          evidence: string | null
          first_found_at: string | null
          id: string
          is_false_positive: boolean | null
          is_verified: boolean | null
          last_seen_at: string | null
          organization_id: string | null
          proof_of_concept: string | null
          remediated_at: string | null
          remediation: string | null
          remediation_difficulty: string | null
          severity: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          affected_hosts?: Json | null
          affected_ports?: string[] | null
          assessment_id?: string | null
          business_impact?: string | null
          created_at?: string | null
          cve_ids?: string[] | null
          cvss_score?: number | null
          cvss_vector?: string | null
          cwe_id?: string | null
          description?: string | null
          evidence?: string | null
          first_found_at?: string | null
          id?: string
          is_false_positive?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          organization_id?: string | null
          proof_of_concept?: string | null
          remediated_at?: string | null
          remediation?: string | null
          remediation_difficulty?: string | null
          severity: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          affected_hosts?: Json | null
          affected_ports?: string[] | null
          assessment_id?: string | null
          business_impact?: string | null
          created_at?: string | null
          cve_ids?: string[] | null
          cvss_score?: number | null
          cvss_vector?: string | null
          cwe_id?: string | null
          description?: string | null
          evidence?: string | null
          first_found_at?: string | null
          id?: string
          is_false_positive?: boolean | null
          is_verified?: boolean | null
          last_seen_at?: string | null
          organization_id?: string | null
          proof_of_concept?: string | null
          remediated_at?: string | null
          remediation?: string | null
          remediation_difficulty?: string | null
          severity?: string
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pentest_findings_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "pentest_assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pentest_findings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pentest_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pentest_ip_ranges: {
        Row: {
          cidr_range: string
          created_at: string | null
          description: string | null
          id: string
          ip_type: string
          is_active: boolean | null
          location: string | null
          organization_id: string | null
          user_id: string
        }
        Insert: {
          cidr_range: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_type: string
          is_active?: boolean | null
          location?: string | null
          organization_id?: string | null
          user_id: string
        }
        Update: {
          cidr_range?: string
          created_at?: string | null
          description?: string | null
          id?: string
          ip_type?: string
          is_active?: boolean | null
          location?: string | null
          organization_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pentest_ip_ranges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "pentest_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      pentest_organizations: {
        Row: {
          assigned_agent_id: string | null
          created_at: string | null
          domain: string | null
          external_ips_allocated: number | null
          external_ips_used: number | null
          id: string
          industry: string | null
          internal_ips_allocated: number | null
          internal_ips_used: number | null
          is_active: boolean | null
          name: string
          short_name: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assigned_agent_id?: string | null
          created_at?: string | null
          domain?: string | null
          external_ips_allocated?: number | null
          external_ips_used?: number | null
          id?: string
          industry?: string | null
          internal_ips_allocated?: number | null
          internal_ips_used?: number | null
          is_active?: boolean | null
          name: string
          short_name?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assigned_agent_id?: string | null
          created_at?: string | null
          domain?: string | null
          external_ips_allocated?: number | null
          external_ips_used?: number | null
          id?: string
          industry?: string | null
          internal_ips_allocated?: number | null
          internal_ips_used?: number | null
          is_active?: boolean | null
          name?: string
          short_name?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pentest_organizations_assigned_agent_id_fkey"
            columns: ["assigned_agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      pentest_remediation_playbooks: {
        Row: {
          compliance_frameworks: Json | null
          created_at: string
          description: string
          estimated_fix_time: string | null
          id: string
          impact: string
          reference_links: Json | null
          remediation_steps: Json
          severity: string
          title: string
          updated_at: string
          verification_steps: Json | null
          vulnerability_type: string
        }
        Insert: {
          compliance_frameworks?: Json | null
          created_at?: string
          description: string
          estimated_fix_time?: string | null
          id?: string
          impact: string
          reference_links?: Json | null
          remediation_steps?: Json
          severity: string
          title: string
          updated_at?: string
          verification_steps?: Json | null
          vulnerability_type: string
        }
        Update: {
          compliance_frameworks?: Json | null
          created_at?: string
          description?: string
          estimated_fix_time?: string | null
          id?: string
          impact?: string
          reference_links?: Json | null
          remediation_steps?: Json
          severity?: string
          title?: string
          updated_at?: string
          verification_steps?: Json | null
          vulnerability_type?: string
        }
        Relationships: []
      }
      pentest_reports: {
        Row: {
          agent_id: string | null
          attack_paths: Json | null
          command_id: string | null
          compliance_mapping: Json | null
          detailed_findings: Json | null
          executive_summary: string | null
          findings_summary: Json | null
          generated_at: string
          id: string
          remediation_priority: Json | null
          report_name: string
          report_status: string | null
          risk_score: number | null
          scan_type: string
          target: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          attack_paths?: Json | null
          command_id?: string | null
          compliance_mapping?: Json | null
          detailed_findings?: Json | null
          executive_summary?: string | null
          findings_summary?: Json | null
          generated_at?: string
          id?: string
          remediation_priority?: Json | null
          report_name: string
          report_status?: string | null
          risk_score?: number | null
          scan_type: string
          target: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          attack_paths?: Json | null
          command_id?: string | null
          compliance_mapping?: Json | null
          detailed_findings?: Json | null
          executive_summary?: string | null
          findings_summary?: Json | null
          generated_at?: string
          id?: string
          remediation_priority?: Json | null
          report_name?: string
          report_status?: string | null
          risk_score?: number | null
          scan_type?: string
          target?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pentest_reports_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      pentest_schedules: {
        Row: {
          agent_id: string | null
          created_at: string
          frequency: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          notification_emails: string[] | null
          scan_options: Json | null
          scan_type: string
          schedule_name: string
          target: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          notification_emails?: string[] | null
          scan_options?: Json | null
          scan_type: string
          schedule_name: string
          target: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          notification_emails?: string[] | null
          scan_options?: Json | null
          scan_type?: string
          schedule_name?: string
          target?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pentest_schedules_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_metrics: {
        Row: {
          comparison_period: string | null
          created_at: string
          id: string
          metadata: Json | null
          metric_category: string
          metric_name: string
          metric_unit: string | null
          metric_value: number
          previous_value: number | null
          recorded_at: string
          target_value: number | null
          user_id: string
        }
        Insert: {
          comparison_period?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_category: string
          metric_name: string
          metric_unit?: string | null
          metric_value: number
          previous_value?: number | null
          recorded_at?: string
          target_value?: number | null
          user_id: string
        }
        Update: {
          comparison_period?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          metric_category?: string
          metric_name?: string
          metric_unit?: string | null
          metric_value?: number
          previous_value?: number | null
          recorded_at?: string
          target_value?: number | null
          user_id?: string
        }
        Relationships: []
      }
      predictive_models: {
        Row: {
          accuracy_score: number | null
          created_at: string
          id: string
          is_active: boolean | null
          last_trained_at: string | null
          model_config: Json
          model_name: string
          model_type: string
          predictions: Json | null
          training_data: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_trained_at?: string | null
          model_config?: Json
          model_name: string
          model_type: string
          predictions?: Json | null
          training_data?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_trained_at?: string | null
          model_config?: Json
          model_name?: string
          model_type?: string
          predictions?: Json | null
          training_data?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          category: string
          created_at: string
          features: Json | null
          id: string
          limits: Json | null
          monthly_price: number
          name: string
          onboarding_fee: number | null
          trial_days: number | null
          updated_at: string
          yearly_price: number | null
        }
        Insert: {
          category: string
          created_at?: string
          features?: Json | null
          id?: string
          limits?: Json | null
          monthly_price: number
          name: string
          onboarding_fee?: number | null
          trial_days?: number | null
          updated_at?: string
          yearly_price?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          features?: Json | null
          id?: string
          limits?: Json | null
          monthly_price?: number
          name?: string
          onboarding_fee?: number | null
          trial_days?: number | null
          updated_at?: string
          yearly_price?: number | null
        }
        Relationships: []
      }
      process_events: {
        Row: {
          agent_id: string
          command_line: string | null
          created_at: string | null
          event_type: string
          executable_path: string | null
          file_hash: string | null
          id: string
          is_suspicious: boolean | null
          loaded_modules: Json | null
          mitre_techniques: string[] | null
          network_connections: Json | null
          parent_process_id: number | null
          process_id: number
          process_name: string
          threat_indicators: string[] | null
          user_name: string | null
          user_sid: string | null
        }
        Insert: {
          agent_id: string
          command_line?: string | null
          created_at?: string | null
          event_type: string
          executable_path?: string | null
          file_hash?: string | null
          id?: string
          is_suspicious?: boolean | null
          loaded_modules?: Json | null
          mitre_techniques?: string[] | null
          network_connections?: Json | null
          parent_process_id?: number | null
          process_id: number
          process_name: string
          threat_indicators?: string[] | null
          user_name?: string | null
          user_sid?: string | null
        }
        Update: {
          agent_id?: string
          command_line?: string | null
          created_at?: string | null
          event_type?: string
          executable_path?: string | null
          file_hash?: string | null
          id?: string
          is_suspicious?: boolean | null
          loaded_modules?: Json | null
          mitre_techniques?: string[] | null
          network_connections?: Json | null
          parent_process_id?: number | null
          process_id?: number
          process_name?: string
          threat_indicators?: string[] | null
          user_name?: string | null
          user_sid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "process_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
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
          company_size: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          industry: string | null
          job_title: string | null
          onboarding_completed: boolean | null
          phone: string | null
          stripe_customer_id: string | null
          subscription_end_date: string | null
          subscription_status: string | null
          subscription_tier: string | null
          timezone: string | null
          trial_ends_at: string | null
          updated_at: string
          user_id: string
          website: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          bio?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          industry?: string | null
          job_title?: string | null
          onboarding_completed?: boolean | null
          phone?: string | null
          stripe_customer_id?: string | null
          subscription_end_date?: string | null
          subscription_status?: string | null
          subscription_tier?: string | null
          timezone?: string | null
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
        }
        Relationships: []
      }
      realtime_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          created_at: string
          description: string | null
          id: string
          metadata: Json | null
          resolution_notes: string | null
          resolved_at: string | null
          severity: string
          source_id: string | null
          source_table: string | null
          title: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity: string
          source_id?: string | null
          source_table?: string | null
          title: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          created_at?: string
          description?: string | null
          id?: string
          metadata?: Json | null
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string
          source_id?: string | null
          source_table?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      recon_activation_logs: {
        Row: {
          activation_key: string
          created_at: string | null
          error_message: string | null
          id: string
          inventory_id: string
          ip_address: unknown
          metadata: Json | null
          status: string
          user_agent: string | null
        }
        Insert: {
          activation_key: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          inventory_id: string
          ip_address?: unknown
          metadata?: Json | null
          status: string
          user_agent?: string | null
        }
        Update: {
          activation_key?: string
          created_at?: string | null
          error_message?: string | null
          id?: string
          inventory_id?: string
          ip_address?: unknown
          metadata?: Json | null
          status?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recon_activation_logs_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "recon_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      recon_inventory: {
        Row: {
          activated_at: string | null
          activation_key: string | null
          agent_id: string | null
          assigned_order_id: string | null
          created_at: string | null
          firmware_version: string | null
          hardware_tier: string
          id: string
          mac_address: string | null
          notes: string | null
          provisioned_at: string | null
          provisioned_by: string | null
          serial_number: string
          shipped_at: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          activated_at?: string | null
          activation_key?: string | null
          agent_id?: string | null
          assigned_order_id?: string | null
          created_at?: string | null
          firmware_version?: string | null
          hardware_tier: string
          id?: string
          mac_address?: string | null
          notes?: string | null
          provisioned_at?: string | null
          provisioned_by?: string | null
          serial_number: string
          shipped_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          activated_at?: string | null
          activation_key?: string | null
          agent_id?: string | null
          assigned_order_id?: string | null
          created_at?: string | null
          firmware_version?: string | null
          hardware_tier?: string
          id?: string
          mac_address?: string | null
          notes?: string | null
          provisioned_at?: string | null
          provisioned_by?: string | null
          serial_number?: string
          shipped_at?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recon_inventory_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recon_inventory_assigned_order_id_fkey"
            columns: ["assigned_order_id"]
            isOneToOne: false
            referencedRelation: "recon_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      recon_orders: {
        Row: {
          billing_address: Json | null
          created_at: string | null
          customer_email: string
          customer_name: string
          customer_phone: string | null
          delivered_at: string | null
          hardware_tier: string
          id: string
          msp_client_id: string | null
          notes: string | null
          order_status: string | null
          paid_at: string | null
          quantity: number | null
          shipped_at: string | null
          shipping_address: Json
          shipping_carrier: string | null
          stripe_checkout_session: string | null
          stripe_payment_intent: string | null
          stripe_subscription_id: string | null
          subscription_price_cents: number
          subscription_tier: string
          tracking_number: string | null
          unit_price_cents: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string | null
          customer_email: string
          customer_name: string
          customer_phone?: string | null
          delivered_at?: string | null
          hardware_tier: string
          id?: string
          msp_client_id?: string | null
          notes?: string | null
          order_status?: string | null
          paid_at?: string | null
          quantity?: number | null
          shipped_at?: string | null
          shipping_address: Json
          shipping_carrier?: string | null
          stripe_checkout_session?: string | null
          stripe_payment_intent?: string | null
          stripe_subscription_id?: string | null
          subscription_price_cents: number
          subscription_tier: string
          tracking_number?: string | null
          unit_price_cents: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string | null
          customer_email?: string
          customer_name?: string
          customer_phone?: string | null
          delivered_at?: string | null
          hardware_tier?: string
          id?: string
          msp_client_id?: string | null
          notes?: string | null
          order_status?: string | null
          paid_at?: string | null
          quantity?: number | null
          shipped_at?: string | null
          shipping_address?: Json
          shipping_carrier?: string | null
          stripe_checkout_session?: string | null
          stripe_payment_intent?: string | null
          stripe_subscription_id?: string | null
          subscription_price_cents?: number
          subscription_tier?: string
          tracking_number?: string | null
          unit_price_cents?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recon_orders_msp_client_id_fkey"
            columns: ["msp_client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      recon_subscriptions: {
        Row: {
          billing_cycle: string | null
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          order_id: string | null
          price_cents: number
          recon_unit_id: string
          started_at: string | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          order_id?: string | null
          price_cents: number
          recon_unit_id: string
          started_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string | null
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          order_id?: string | null
          price_cents?: number
          recon_unit_id?: string
          started_at?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recon_subscriptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "recon_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recon_subscriptions_recon_unit_id_fkey"
            columns: ["recon_unit_id"]
            isOneToOne: false
            referencedRelation: "recon_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      remote_commands: {
        Row: {
          command: string
          command_type: string
          created_at: string
          device_id: string
          error_output: string | null
          executed_at: string | null
          exit_code: number | null
          id: string
          output: string | null
          remote_session_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          command: string
          command_type?: string
          created_at?: string
          device_id: string
          error_output?: string | null
          executed_at?: string | null
          exit_code?: number | null
          id?: string
          output?: string | null
          remote_session_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          command?: string
          command_type?: string
          created_at?: string
          device_id?: string
          error_output?: string | null
          executed_at?: string | null
          exit_code?: number | null
          id?: string
          output?: string | null
          remote_session_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_remote_commands_device"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "rmm_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_remote_commands_session"
            columns: ["remote_session_id"]
            isOneToOne: false
            referencedRelation: "remote_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      remote_sessions: {
        Row: {
          client_ip: string | null
          connection_details: Json | null
          created_at: string
          device_id: string
          ended_at: string | null
          id: string
          session_token: string
          session_type: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_ip?: string | null
          connection_details?: Json | null
          created_at?: string
          device_id: string
          ended_at?: string | null
          id?: string
          session_token: string
          session_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_ip?: string | null
          connection_details?: Json | null
          created_at?: string
          device_id?: string
          ended_at?: string | null
          id?: string
          session_token?: string
          session_type?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_remote_sessions_device"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "rmm_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      response_workflows: {
        Row: {
          actions: Json
          approved_at: string | null
          approved_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          max_executions_per_hour: number | null
          metadata: Json | null
          msp_org_id: string | null
          name: string
          priority: number | null
          success_rate: number | null
          trigger_conditions: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          actions: Json
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          max_executions_per_hour?: number | null
          metadata?: Json | null
          msp_org_id?: string | null
          name: string
          priority?: number | null
          success_rate?: number | null
          trigger_conditions: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          max_executions_per_hour?: number | null
          metadata?: Json | null
          msp_org_id?: string | null
          name?: string
          priority?: number | null
          success_rate?: number | null
          trigger_conditions?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "response_workflows_msp_org_id_fkey"
            columns: ["msp_org_id"]
            isOneToOne: false
            referencedRelation: "msp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      revenue_analytics: {
        Row: {
          arr: number | null
          churn_rate: number | null
          churned_customers: number | null
          conversion_rate: number | null
          created_at: string
          id: string
          ltv: number | null
          mrr: number | null
          new_customers: number | null
          period_end: string
          period_start: string
          total_revenue: number | null
        }
        Insert: {
          arr?: number | null
          churn_rate?: number | null
          churned_customers?: number | null
          conversion_rate?: number | null
          created_at?: string
          id?: string
          ltv?: number | null
          mrr?: number | null
          new_customers?: number | null
          period_end: string
          period_start: string
          total_revenue?: number | null
        }
        Update: {
          arr?: number | null
          churn_rate?: number | null
          churned_customers?: number | null
          conversion_rate?: number | null
          created_at?: string
          id?: string
          ltv?: number | null
          mrr?: number | null
          new_customers?: number | null
          period_end?: string
          period_start?: string
          total_revenue?: number | null
        }
        Relationships: []
      }
      rmm_agent_checkins: {
        Row: {
          agent_token: string
          agent_version: string | null
          created_at: string
          device_id: string
          hostname: string
          id: string
          installed_software: Json | null
          ip_address: unknown
          last_checkin: string
          performance_metrics: Json | null
          security_status: Json | null
          system_info: Json | null
          user_id: string
        }
        Insert: {
          agent_token: string
          agent_version?: string | null
          created_at?: string
          device_id: string
          hostname: string
          id?: string
          installed_software?: Json | null
          ip_address: unknown
          last_checkin?: string
          performance_metrics?: Json | null
          security_status?: Json | null
          system_info?: Json | null
          user_id: string
        }
        Update: {
          agent_token?: string
          agent_version?: string | null
          created_at?: string
          device_id?: string
          hostname?: string
          id?: string
          installed_software?: Json | null
          ip_address?: unknown
          last_checkin?: string
          performance_metrics?: Json | null
          security_status?: Json | null
          system_info?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rmm_agent_checkins_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "safenet_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      rmm_agent_commands: {
        Row: {
          agent_id: string
          command_data: Json
          command_type: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          exit_code: number | null
          id: string
          output: string | null
          priority: number | null
          started_at: string | null
          status: string
          timeout_seconds: number | null
          user_id: string
        }
        Insert: {
          agent_id: string
          command_data: Json
          command_type: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          exit_code?: number | null
          id?: string
          output?: string | null
          priority?: number | null
          started_at?: string | null
          status?: string
          timeout_seconds?: number | null
          user_id: string
        }
        Update: {
          agent_id?: string
          command_data?: Json
          command_type?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          exit_code?: number | null
          id?: string
          output?: string | null
          priority?: number | null
          started_at?: string | null
          status?: string
          timeout_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rmm_agent_commands_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "rmm_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      rmm_agent_system_info: {
        Row: {
          agent_id: string
          collected_at: string
          cpu_usage_percent: number | null
          disk_usage_percent: number | null
          id: string
          installed_software: Json | null
          last_boot_time: string | null
          logged_in_users: Json | null
          memory_usage_percent: number | null
          network_interfaces: Json | null
          running_processes: number | null
          security_patches: Json | null
          system_services: Json | null
          uptime_seconds: number | null
        }
        Insert: {
          agent_id: string
          collected_at?: string
          cpu_usage_percent?: number | null
          disk_usage_percent?: number | null
          id?: string
          installed_software?: Json | null
          last_boot_time?: string | null
          logged_in_users?: Json | null
          memory_usage_percent?: number | null
          network_interfaces?: Json | null
          running_processes?: number | null
          security_patches?: Json | null
          system_services?: Json | null
          uptime_seconds?: number | null
        }
        Update: {
          agent_id?: string
          collected_at?: string
          cpu_usage_percent?: number | null
          disk_usage_percent?: number | null
          id?: string
          installed_software?: Json | null
          last_boot_time?: string | null
          logged_in_users?: Json | null
          memory_usage_percent?: number | null
          network_interfaces?: Json | null
          running_processes?: number | null
          security_patches?: Json | null
          system_services?: Json | null
          uptime_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rmm_agent_system_info_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "rmm_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      rmm_agents: {
        Row: {
          agent_capabilities: Json | null
          agent_version: string
          client_id: string
          configuration: Json | null
          cpu_cores: number | null
          created_at: string
          domain_joined: boolean | null
          hostname: string
          id: string
          installed_at: string
          ip_address: unknown
          last_heartbeat: string | null
          last_seen_at: string | null
          mac_address: string | null
          operating_system: string
          os_version: string | null
          status: string
          total_disk_gb: number | null
          total_memory_gb: number | null
          updated_at: string
        }
        Insert: {
          agent_capabilities?: Json | null
          agent_version?: string
          client_id: string
          configuration?: Json | null
          cpu_cores?: number | null
          created_at?: string
          domain_joined?: boolean | null
          hostname: string
          id?: string
          installed_at?: string
          ip_address?: unknown
          last_heartbeat?: string | null
          last_seen_at?: string | null
          mac_address?: string | null
          operating_system: string
          os_version?: string | null
          status?: string
          total_disk_gb?: number | null
          total_memory_gb?: number | null
          updated_at?: string
        }
        Update: {
          agent_capabilities?: Json | null
          agent_version?: string
          client_id?: string
          configuration?: Json | null
          cpu_cores?: number | null
          created_at?: string
          domain_joined?: boolean | null
          hostname?: string
          id?: string
          installed_at?: string
          ip_address?: unknown
          last_heartbeat?: string | null
          last_seen_at?: string | null
          mac_address?: string | null
          operating_system?: string
          os_version?: string | null
          status?: string
          total_disk_gb?: number | null
          total_memory_gb?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rmm_agents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
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
      rmm_clipboard_sync: {
        Row: {
          content: string
          content_type: string | null
          created_at: string | null
          device_id: string
          direction: string | null
          expires_at: string
          id: string
          synced: boolean | null
        }
        Insert: {
          content: string
          content_type?: string | null
          created_at?: string | null
          device_id: string
          direction?: string | null
          expires_at: string
          id?: string
          synced?: boolean | null
        }
        Update: {
          content?: string
          content_type?: string | null
          created_at?: string | null
          device_id?: string
          direction?: string | null
          expires_at?: string
          id?: string
          synced?: boolean | null
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
      rmm_customers: {
        Row: {
          address: string
          city: string
          company_name: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_activity: string | null
          notes: string | null
          phone: string
          primary_contact_email: string
          primary_contact_name: string
          state: string
          updated_at: string | null
          zip_code: string
        }
        Insert: {
          address: string
          city: string
          company_name: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          notes?: string | null
          phone: string
          primary_contact_email: string
          primary_contact_name: string
          state: string
          updated_at?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          city?: string
          company_name?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_activity?: string | null
          notes?: string | null
          phone?: string
          primary_contact_email?: string
          primary_contact_name?: string
          state?: string
          updated_at?: string | null
          zip_code?: string
        }
        Relationships: []
      }
      rmm_devices: {
        Row: {
          agent_version: string | null
          cpu_usage: number | null
          created_at: string | null
          customer_id: string | null
          device_type: string | null
          disk_usage: number | null
          hostname: string
          id: string
          ip_address: string
          last_logged_user: string | null
          last_seen: string | null
          memory_usage: number | null
          os_info: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_version?: string | null
          cpu_usage?: number | null
          created_at?: string | null
          customer_id?: string | null
          device_type?: string | null
          disk_usage?: number | null
          hostname: string
          id?: string
          ip_address: string
          last_logged_user?: string | null
          last_seen?: string | null
          memory_usage?: number | null
          os_info?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_version?: string | null
          cpu_usage?: number | null
          created_at?: string | null
          customer_id?: string | null
          device_type?: string | null
          disk_usage?: number | null
          hostname?: string
          id?: string
          ip_address?: string
          last_logged_user?: string | null
          last_seen?: string | null
          memory_usage?: number | null
          os_info?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rmm_devices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "rmm_customers"
            referencedColumns: ["id"]
          },
        ]
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
      rmm_file_transfers: {
        Row: {
          completed_at: string | null
          created_at: string | null
          device_id: string
          error_message: string | null
          file_name: string
          file_path: string | null
          file_size: number | null
          id: string
          progress_percent: number | null
          session_id: string | null
          status: string | null
          transfer_type: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          device_id: string
          error_message?: string | null
          file_name: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          progress_percent?: number | null
          session_id?: string | null
          status?: string | null
          transfer_type?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          device_id?: string
          error_message?: string | null
          file_name?: string
          file_path?: string | null
          file_size?: number | null
          id?: string
          progress_percent?: number | null
          session_id?: string | null
          status?: string | null
          transfer_type?: string | null
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
      rmm_patches: {
        Row: {
          category: string
          created_at: string
          description: string | null
          device_id: string | null
          id: string
          installed_at: string | null
          kb_article: string | null
          reboot_required: boolean
          release_date: string | null
          scheduled_for: string | null
          severity: string
          size_bytes: number | null
          status: string
          title: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          device_id?: string | null
          id?: string
          installed_at?: string | null
          kb_article?: string | null
          reboot_required?: boolean
          release_date?: string | null
          scheduled_for?: string | null
          severity?: string
          size_bytes?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          device_id?: string | null
          id?: string
          installed_at?: string | null
          kb_article?: string | null
          reboot_required?: boolean
          release_date?: string | null
          scheduled_for?: string | null
          severity?: string
          size_bytes?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rmm_patches_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "rmm_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      rmm_policies: {
        Row: {
          assigned_device_count: number
          category: string | null
          compliance_score: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          last_evaluated_at: string | null
          name: string
          policy_type: string
          settings: Json
          target_device_types: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_device_count?: number
          category?: string | null
          compliance_score?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_evaluated_at?: string | null
          name: string
          policy_type?: string
          settings?: Json
          target_device_types?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_device_count?: number
          category?: string | null
          compliance_score?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_evaluated_at?: string | null
          name?: string
          policy_type?: string
          settings?: Json
          target_device_types?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rmm_script_executions: {
        Row: {
          agent_id: string
          command_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          exit_code: number | null
          id: string
          output: string | null
          parameters: Json | null
          script_id: string
          started_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          agent_id: string
          command_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          exit_code?: number | null
          id?: string
          output?: string | null
          parameters?: Json | null
          script_id: string
          started_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          command_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          exit_code?: number | null
          id?: string
          output?: string | null
          parameters?: Json | null
          script_id?: string
          started_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rmm_script_executions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "rmm_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rmm_script_executions_command_id_fkey"
            columns: ["command_id"]
            isOneToOne: false
            referencedRelation: "rmm_agent_commands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rmm_script_executions_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "rmm_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      rmm_scripts: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          execution_timeout: number | null
          id: string
          is_template: boolean | null
          name: string
          parameters: Json | null
          requires_elevation: boolean | null
          script_content: string
          script_type: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          execution_timeout?: number | null
          id?: string
          is_template?: boolean | null
          name: string
          parameters?: Json | null
          requires_elevation?: boolean | null
          script_content: string
          script_type: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          execution_timeout?: number | null
          id?: string
          is_template?: boolean | null
          name?: string
          parameters?: Json | null
          requires_elevation?: boolean | null
          script_content?: string
          script_type?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rmm_session_events: {
        Row: {
          device_id: string
          event_data: Json | null
          event_type: string
          id: string
          session_id: string | null
          timestamp: string | null
        }
        Insert: {
          device_id: string
          event_data?: Json | null
          event_type: string
          id?: string
          session_id?: string | null
          timestamp?: string | null
        }
        Update: {
          device_id?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          session_id?: string | null
          timestamp?: string | null
        }
        Relationships: []
      }
      roi_tracking: {
        Row: {
          benefits_tracked: Json
          created_at: string
          id: string
          initiative_name: string
          initiative_type: string
          investment_amount: number
          investment_date: string
          notes: string | null
          payback_period_months: number | null
          roi_percentage: number | null
          status: string | null
          total_benefits: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          benefits_tracked?: Json
          created_at?: string
          id?: string
          initiative_name: string
          initiative_type: string
          investment_amount: number
          investment_date: string
          notes?: string | null
          payback_period_months?: number | null
          roi_percentage?: number | null
          status?: string | null
          total_benefits?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          benefits_tracked?: Json
          created_at?: string
          id?: string
          initiative_name?: string
          initiative_type?: string
          investment_amount?: number
          investment_date?: string
          notes?: string | null
          payback_period_months?: number | null
          roi_percentage?: number | null
          status?: string | null
          total_benefits?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safe_av_definitions: {
        Row: {
          created_at: string
          definition_version: string
          engine_version: string | null
          id: string
          next_update_check: string | null
          total_signatures: number | null
          update_date: string
          update_status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          definition_version: string
          engine_version?: string | null
          id?: string
          next_update_check?: string | null
          total_signatures?: number | null
          update_date: string
          update_status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          definition_version?: string
          engine_version?: string | null
          id?: string
          next_update_check?: string | null
          total_signatures?: number | null
          update_date?: string
          update_status?: string
          user_id?: string
        }
        Relationships: []
      }
      safe_av_quarantine: {
        Row: {
          created_at: string
          file_hash: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          quarantined_at: string
          scan_id: string | null
          status: string
          threat_name: string
          threat_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_hash: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          quarantined_at?: string
          scan_id?: string | null
          status?: string
          threat_name: string
          threat_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_hash?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          quarantined_at?: string
          scan_id?: string | null
          status?: string
          threat_name?: string
          threat_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safe_av_quarantine_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "safe_av_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      safe_av_scans: {
        Row: {
          completed_at: string | null
          created_at: string
          endpoint_id: string | null
          files_scanned: number | null
          id: string
          scan_duration_seconds: number | null
          scan_path: string | null
          scan_results: Json | null
          scan_type: string
          started_at: string
          status: string
          threats_found: number | null
          threats_quarantined: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          endpoint_id?: string | null
          files_scanned?: number | null
          id?: string
          scan_duration_seconds?: number | null
          scan_path?: string | null
          scan_results?: Json | null
          scan_type: string
          started_at?: string
          status?: string
          threats_found?: number | null
          threats_quarantined?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          endpoint_id?: string | null
          files_scanned?: number | null
          id?: string
          scan_duration_seconds?: number | null
          scan_path?: string | null
          scan_results?: Json | null
          scan_type?: string
          started_at?: string
          status?: string
          threats_found?: number | null
          threats_quarantined?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safe_mdr_alerts: {
        Row: {
          affected_assets: string[] | null
          alert_type: string
          analyst_notes: string | null
          assigned_to: string | null
          created_at: string
          description: string | null
          escalation_level: number | null
          id: string
          indicators: Json | null
          msp_client_id: string | null
          remediation_steps: string | null
          resolved_at: string | null
          response_actions: Json | null
          severity: string
          source_system: string | null
          status: string
          tactics: Json | null
          techniques: Json | null
          timeline: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affected_assets?: string[] | null
          alert_type: string
          analyst_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          escalation_level?: number | null
          id?: string
          indicators?: Json | null
          msp_client_id?: string | null
          remediation_steps?: string | null
          resolved_at?: string | null
          response_actions?: Json | null
          severity: string
          source_system?: string | null
          status?: string
          tactics?: Json | null
          techniques?: Json | null
          timeline?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affected_assets?: string[] | null
          alert_type?: string
          analyst_notes?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          escalation_level?: number | null
          id?: string
          indicators?: Json | null
          msp_client_id?: string | null
          remediation_steps?: string | null
          resolved_at?: string | null
          response_actions?: Json | null
          severity?: string
          source_system?: string | null
          status?: string
          tactics?: Json | null
          techniques?: Json | null
          timeline?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safe_mdr_incident_response: {
        Row: {
          alert_id: string | null
          containment_status: string | null
          created_at: string
          eradication_status: string | null
          id: string
          incident_type: string
          investigation_id: string | null
          lessons_learned: string | null
          recovery_status: string | null
          response_actions: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_id?: string | null
          containment_status?: string | null
          created_at?: string
          eradication_status?: string | null
          id?: string
          incident_type: string
          investigation_id?: string | null
          lessons_learned?: string | null
          recovery_status?: string | null
          response_actions?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_id?: string | null
          containment_status?: string | null
          created_at?: string
          eradication_status?: string | null
          id?: string
          incident_type?: string
          investigation_id?: string | null
          lessons_learned?: string | null
          recovery_status?: string | null
          response_actions?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safe_mdr_incident_response_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "safe_mdr_alerts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safe_mdr_incident_response_investigation_id_fkey"
            columns: ["investigation_id"]
            isOneToOne: false
            referencedRelation: "safe_mdr_investigations"
            referencedColumns: ["id"]
          },
        ]
      }
      safe_mdr_investigations: {
        Row: {
          alert_id: string
          closed_at: string | null
          created_at: string
          evidence_collected: Json | null
          findings: string | null
          id: string
          investigation_status: string
          investigation_type: string
          investigator_id: string | null
          priority: string
          recommendations: string | null
          time_spent_minutes: number | null
          tools_used: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_id: string
          closed_at?: string | null
          created_at?: string
          evidence_collected?: Json | null
          findings?: string | null
          id?: string
          investigation_status?: string
          investigation_type: string
          investigator_id?: string | null
          priority?: string
          recommendations?: string | null
          time_spent_minutes?: number | null
          tools_used?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_id?: string
          closed_at?: string | null
          created_at?: string
          evidence_collected?: Json | null
          findings?: string | null
          id?: string
          investigation_status?: string
          investigation_type?: string
          investigator_id?: string | null
          priority?: string
          recommendations?: string | null
          time_spent_minutes?: number | null
          tools_used?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safe_shield_actions: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string
          hostname: string
          id: string
          performed_at: string
          result: string | null
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string
          hostname: string
          id?: string
          performed_at?: string
          result?: string | null
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string
          hostname?: string
          id?: string
          performed_at?: string
          result?: string | null
          user_id?: string
        }
        Relationships: []
      }
      safe_shield_endpoints: {
        Row: {
          agent_version: string
          created_at: string
          hostname: string
          id: string
          ip_address: string
          last_seen: string
          metadata: Json | null
          os_version: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_version: string
          created_at?: string
          hostname: string
          id?: string
          ip_address: string
          last_seen?: string
          metadata?: Json | null
          os_version: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_version?: string
          created_at?: string
          hostname?: string
          id?: string
          ip_address?: string
          last_seen?: string
          metadata?: Json | null
          os_version?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safe_shield_monitoring: {
        Row: {
          alert_threshold_exceeded: boolean | null
          endpoint_id: string | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: Json
          timestamp: string
          user_id: string
        }
        Insert: {
          alert_threshold_exceeded?: boolean | null
          endpoint_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: Json
          timestamp?: string
          user_id: string
        }
        Update: {
          alert_threshold_exceeded?: boolean | null
          endpoint_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: Json
          timestamp?: string
          user_id?: string
        }
        Relationships: []
      }
      safe_shield_threats: {
        Row: {
          ai_analysis: Json | null
          ai_confidence_score: number
          behavioral_indicators: string[] | null
          command_line: string | null
          created_at: string
          detected_at: string
          event_id: string
          file_path: string | null
          hostname: string
          id: string
          network_connection: string | null
          process_name: string | null
          resolved_at: string | null
          severity: string
          status: string
          threat_signature: string | null
          threat_type: string
          user_id: string
        }
        Insert: {
          ai_analysis?: Json | null
          ai_confidence_score?: number
          behavioral_indicators?: string[] | null
          command_line?: string | null
          created_at?: string
          detected_at?: string
          event_id: string
          file_path?: string | null
          hostname: string
          id?: string
          network_connection?: string | null
          process_name?: string | null
          resolved_at?: string | null
          severity: string
          status?: string
          threat_signature?: string | null
          threat_type: string
          user_id: string
        }
        Update: {
          ai_analysis?: Json | null
          ai_confidence_score?: number
          behavioral_indicators?: string[] | null
          command_line?: string | null
          created_at?: string
          detected_at?: string
          event_id?: string
          file_path?: string | null
          hostname?: string
          id?: string
          network_connection?: string | null
          process_name?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          threat_signature?: string | null
          threat_type?: string
          user_id?: string
        }
        Relationships: []
      }
      safeassist_conversations: {
        Row: {
          created_at: string
          id: string
          is_archived: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_archived?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_archived?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safeassist_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safeassist_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "safeassist_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_access_group_members: {
        Row: {
          access_group_id: string
          added_by: string | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["safedoc_role"] | null
          user_id: string
        }
        Insert: {
          access_group_id: string
          added_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["safedoc_role"] | null
          user_id: string
        }
        Update: {
          access_group_id?: string
          added_by?: string | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["safedoc_role"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_access_group_members_access_group_id_fkey"
            columns: ["access_group_id"]
            isOneToOne: false
            referencedRelation: "safedoc_access_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_access_groups: {
        Row: {
          created_at: string
          default_role: Database["public"]["Enums"]["safedoc_role"] | null
          description: string | null
          id: string
          is_system: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_role?: Database["public"]["Enums"]["safedoc_role"] | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_role?: Database["public"]["Enums"]["safedoc_role"] | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safedoc_activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: unknown
          new_values: Json | null
          old_values: Json | null
          organization_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_activity_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "safedoc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_configurations: {
        Row: {
          asset_id: string | null
          configuration_data: Json | null
          configuration_type: string
          created_at: string
          hostname: string | null
          id: string
          is_active: boolean | null
          last_audit_date: string | null
          location: string | null
          mac_address: string | null
          manufacturer: string | null
          model: string | null
          name: string
          notes: string | null
          operating_system: string | null
          organization_id: string | null
          os_version: string | null
          primary_ip: string | null
          secondary_ips: string[] | null
          serial_number: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_id?: string | null
          configuration_data?: Json | null
          configuration_type: string
          created_at?: string
          hostname?: string | null
          id?: string
          is_active?: boolean | null
          last_audit_date?: string | null
          location?: string | null
          mac_address?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          notes?: string | null
          operating_system?: string | null
          organization_id?: string | null
          os_version?: string | null
          primary_ip?: string | null
          secondary_ips?: string[] | null
          serial_number?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_id?: string | null
          configuration_data?: Json | null
          configuration_type?: string
          created_at?: string
          hostname?: string | null
          id?: string
          is_active?: boolean | null
          last_audit_date?: string | null
          location?: string | null
          mac_address?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          operating_system?: string | null
          organization_id?: string | null
          os_version?: string | null
          primary_ip?: string | null
          secondary_ips?: string[] | null
          serial_number?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_configurations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safedoc_configurations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "safedoc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_document_access: {
        Row: {
          access_group_id: string | null
          created_at: string
          document_id: string
          id: string
          role: Database["public"]["Enums"]["safedoc_role"]
          user_id: string | null
        }
        Insert: {
          access_group_id?: string | null
          created_at?: string
          document_id: string
          id?: string
          role?: Database["public"]["Enums"]["safedoc_role"]
          user_id?: string | null
        }
        Update: {
          access_group_id?: string | null
          created_at?: string
          document_id?: string
          id?: string
          role?: Database["public"]["Enums"]["safedoc_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_document_access_access_group_id_fkey"
            columns: ["access_group_id"]
            isOneToOne: false
            referencedRelation: "safedoc_access_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safedoc_document_access_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "safedoc_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_document_versions: {
        Row: {
          change_summary: string | null
          content: string | null
          content_format: string | null
          created_at: string
          document_id: string
          id: string
          title: string
          user_id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          content?: string | null
          content_format?: string | null
          created_at?: string
          document_id: string
          id?: string
          title: string
          user_id: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          content?: string | null
          content_format?: string | null
          created_at?: string
          document_id?: string
          id?: string
          title?: string
          user_id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "safedoc_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_documents: {
        Row: {
          content: string | null
          content_format: string | null
          created_at: string
          document_type: string | null
          excerpt: string | null
          folder_id: string | null
          id: string
          is_favorite: boolean | null
          is_pinned: boolean | null
          last_viewed_at: string | null
          last_viewed_by: string | null
          metadata: Json | null
          organization_id: string | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          content?: string | null
          content_format?: string | null
          created_at?: string
          document_type?: string | null
          excerpt?: string | null
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          last_viewed_at?: string | null
          last_viewed_by?: string | null
          metadata?: Json | null
          organization_id?: string | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          content?: string | null
          content_format?: string | null
          created_at?: string
          document_type?: string | null
          excerpt?: string | null
          folder_id?: string | null
          id?: string
          is_favorite?: boolean | null
          is_pinned?: boolean | null
          last_viewed_at?: string | null
          last_viewed_by?: string | null
          metadata?: Json | null
          organization_id?: string | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_documents_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "safedoc_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safedoc_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "safedoc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_expirations: {
        Row: {
          alert_days_before: number | null
          alert_sent: boolean | null
          alert_sent_at: string | null
          assigned_to: string | null
          created_at: string
          description: string | null
          expires_at: string
          id: string
          is_recurring: boolean | null
          item_id: string | null
          item_name: string
          item_type: string
          notes: string | null
          organization_id: string | null
          recurrence_interval: string | null
          renewal_cost: number | null
          renewal_url: string | null
          status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          alert_days_before?: number | null
          alert_sent?: boolean | null
          alert_sent_at?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          expires_at: string
          id?: string
          is_recurring?: boolean | null
          item_id?: string | null
          item_name: string
          item_type: string
          notes?: string | null
          organization_id?: string | null
          recurrence_interval?: string | null
          renewal_cost?: number | null
          renewal_url?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          alert_days_before?: number | null
          alert_sent?: boolean | null
          alert_sent_at?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          is_recurring?: boolean | null
          item_id?: string | null
          item_name?: string
          item_type?: string
          notes?: string | null
          organization_id?: string | null
          recurrence_interval?: string | null
          renewal_cost?: number | null
          renewal_url?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_expirations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "safedoc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_folders: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string | null
          parent_id: string | null
          sort_order: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string | null
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_folders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "safedoc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safedoc_folders_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "safedoc_folders"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_knowledge_base: {
        Row: {
          category: string | null
          content: string
          content_format: string | null
          created_at: string
          helpful_count: number | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          view_count: number | null
        }
        Insert: {
          category?: string | null
          content: string
          content_format?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          view_count?: number | null
        }
        Update: {
          category?: string | null
          content?: string
          content_format?: string | null
          created_at?: string
          helpful_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      safedoc_organization_access: {
        Row: {
          access_group_id: string | null
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["safedoc_role"]
          user_id: string | null
        }
        Insert: {
          access_group_id?: string | null
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["safedoc_role"]
          user_id?: string | null
        }
        Update: {
          access_group_id?: string | null
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["safedoc_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_organization_access_access_group_id_fkey"
            columns: ["access_group_id"]
            isOneToOne: false
            referencedRelation: "safedoc_access_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safedoc_organization_access_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "safedoc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_organizations: {
        Row: {
          address: Json | null
          alert_message: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          msp_client_id: string | null
          name: string
          notes: string | null
          primary_contact_email: string | null
          primary_contact_name: string | null
          primary_contact_phone: string | null
          quick_notes: string | null
          short_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: Json | null
          alert_message?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          msp_client_id?: string | null
          name: string
          notes?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          quick_notes?: string | null
          short_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: Json | null
          alert_message?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          msp_client_id?: string | null
          name?: string
          notes?: string | null
          primary_contact_email?: string | null
          primary_contact_name?: string | null
          primary_contact_phone?: string | null
          quick_notes?: string | null
          short_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_organizations_msp_client_id_fkey"
            columns: ["msp_client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_password_access: {
        Row: {
          access_group_id: string | null
          created_at: string
          id: string
          password_id: string
          role: Database["public"]["Enums"]["safedoc_role"]
          user_id: string | null
        }
        Insert: {
          access_group_id?: string | null
          created_at?: string
          id?: string
          password_id: string
          role?: Database["public"]["Enums"]["safedoc_role"]
          user_id?: string | null
        }
        Update: {
          access_group_id?: string | null
          created_at?: string
          id?: string
          password_id?: string
          role?: Database["public"]["Enums"]["safedoc_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_password_access_access_group_id_fkey"
            columns: ["access_group_id"]
            isOneToOne: false
            referencedRelation: "safedoc_access_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safedoc_password_access_password_id_fkey"
            columns: ["password_id"]
            isOneToOne: false
            referencedRelation: "safedoc_passwords"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_password_access_log: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown
          password_id: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown
          password_id: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          password_id?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_password_access_log_password_id_fkey"
            columns: ["password_id"]
            isOneToOne: false
            referencedRelation: "safedoc_passwords"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_passwords: {
        Row: {
          access_instructions: string | null
          access_url: string | null
          auto_rotate: boolean | null
          created_at: string
          encrypted_password: string
          expires_at: string | null
          folder_id: string | null
          id: string
          is_archived: boolean | null
          last_used_at: string | null
          name: string
          notes: string | null
          organization_id: string | null
          otp_secret: string | null
          password_type: string | null
          password_updated_at: string | null
          resource_id: string | null
          resource_type: string | null
          rotation_interval_days: number | null
          tags: string[] | null
          updated_at: string
          url: string | null
          user_id: string
          username: string | null
        }
        Insert: {
          access_instructions?: string | null
          access_url?: string | null
          auto_rotate?: boolean | null
          created_at?: string
          encrypted_password: string
          expires_at?: string | null
          folder_id?: string | null
          id?: string
          is_archived?: boolean | null
          last_used_at?: string | null
          name: string
          notes?: string | null
          organization_id?: string | null
          otp_secret?: string | null
          password_type?: string | null
          password_updated_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          rotation_interval_days?: number | null
          tags?: string[] | null
          updated_at?: string
          url?: string | null
          user_id: string
          username?: string | null
        }
        Update: {
          access_instructions?: string | null
          access_url?: string | null
          auto_rotate?: boolean | null
          created_at?: string
          encrypted_password?: string
          expires_at?: string | null
          folder_id?: string | null
          id?: string
          is_archived?: boolean | null
          last_used_at?: string | null
          name?: string
          notes?: string | null
          organization_id?: string | null
          otp_secret?: string | null
          password_type?: string | null
          password_updated_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          rotation_interval_days?: number | null
          tags?: string[] | null
          updated_at?: string
          url?: string | null
          user_id?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_passwords_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "safedoc_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safedoc_passwords_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "safedoc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_quarantine: {
        Row: {
          device_id: string
          file_hash: string | null
          file_path: string
          id: string
          metadata: Json | null
          quarantine_reason: string | null
          quarantined_at: string | null
          restored_at: string | null
          status: string | null
        }
        Insert: {
          device_id: string
          file_hash?: string | null
          file_path: string
          id?: string
          metadata?: Json | null
          quarantine_reason?: string | null
          quarantined_at?: string | null
          restored_at?: string | null
          status?: string | null
        }
        Update: {
          device_id?: string
          file_hash?: string | null
          file_path?: string
          id?: string
          metadata?: Json | null
          quarantine_reason?: string | null
          quarantined_at?: string | null
          restored_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      safedoc_related_items: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          relationship_type: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          relationship_type?: string | null
          source_id: string
          source_type: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          relationship_type?: string | null
          source_id?: string
          source_type?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      safedoc_runbook_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: number | null
          id: string
          notes: string | null
          organization_id: string | null
          runbook_id: string
          started_at: string
          status: string
          step_results: Json | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          runbook_id: string
          started_at?: string
          status: string
          step_results?: Json | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: number | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          runbook_id?: string
          started_at?: string
          status?: string
          step_results?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_runbook_executions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "safedoc_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safedoc_runbook_executions_runbook_id_fkey"
            columns: ["runbook_id"]
            isOneToOne: false
            referencedRelation: "safedoc_runbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_runbooks: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          difficulty_level: string | null
          estimated_time_minutes: number | null
          execution_count: number | null
          folder_id: string | null
          id: string
          is_published: boolean | null
          last_executed_at: string | null
          organization_id: string | null
          prerequisites: string | null
          related_configurations: string[] | null
          related_documents: string[] | null
          steps: Json | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          version: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_time_minutes?: number | null
          execution_count?: number | null
          folder_id?: string | null
          id?: string
          is_published?: boolean | null
          last_executed_at?: string | null
          organization_id?: string | null
          prerequisites?: string | null
          related_configurations?: string[] | null
          related_documents?: string[] | null
          steps?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          version?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          difficulty_level?: string | null
          estimated_time_minutes?: number | null
          execution_count?: number | null
          folder_id?: string | null
          id?: string
          is_published?: boolean | null
          last_executed_at?: string | null
          organization_id?: string | null
          prerequisites?: string | null
          related_configurations?: string[] | null
          related_documents?: string[] | null
          steps?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_runbooks_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "safedoc_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safedoc_runbooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "safedoc_organizations"
            referencedColumns: ["id"]
          },
        ]
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
      safedoc_ssl_certificates: {
        Row: {
          alert_days_before: number | null
          auto_renew: boolean | null
          certificate_pem: string | null
          certificate_type: string | null
          chain_valid: boolean | null
          common_name: string | null
          cost: number | null
          created_at: string
          domain: string
          fingerprint: string | null
          fingerprint_sha256: string | null
          id: string
          issuer: string | null
          issuer_organization: string | null
          key_algorithm: string | null
          key_size: number | null
          last_check_status: string | null
          last_checked_at: string | null
          monitoring_enabled: boolean | null
          notes: string | null
          organization_id: string | null
          private_key_location: string | null
          provider: string | null
          purchase_date: string | null
          renewal_url: string | null
          serial_number: string | null
          signature_algorithm: string | null
          subject_alt_names: string[] | null
          tags: string[] | null
          updated_at: string
          user_id: string
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          alert_days_before?: number | null
          auto_renew?: boolean | null
          certificate_pem?: string | null
          certificate_type?: string | null
          chain_valid?: boolean | null
          common_name?: string | null
          cost?: number | null
          created_at?: string
          domain: string
          fingerprint?: string | null
          fingerprint_sha256?: string | null
          id?: string
          issuer?: string | null
          issuer_organization?: string | null
          key_algorithm?: string | null
          key_size?: number | null
          last_check_status?: string | null
          last_checked_at?: string | null
          monitoring_enabled?: boolean | null
          notes?: string | null
          organization_id?: string | null
          private_key_location?: string | null
          provider?: string | null
          purchase_date?: string | null
          renewal_url?: string | null
          serial_number?: string | null
          signature_algorithm?: string | null
          subject_alt_names?: string[] | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          alert_days_before?: number | null
          auto_renew?: boolean | null
          certificate_pem?: string | null
          certificate_type?: string | null
          chain_valid?: boolean | null
          common_name?: string | null
          cost?: number | null
          created_at?: string
          domain?: string
          fingerprint?: string | null
          fingerprint_sha256?: string | null
          id?: string
          issuer?: string | null
          issuer_organization?: string | null
          key_algorithm?: string | null
          key_size?: number | null
          last_check_status?: string | null
          last_checked_at?: string | null
          monitoring_enabled?: boolean | null
          notes?: string | null
          organization_id?: string | null
          private_key_location?: string | null
          provider?: string | null
          purchase_date?: string | null
          renewal_url?: string | null
          serial_number?: string | null
          signature_algorithm?: string | null
          subject_alt_names?: string[] | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_ssl_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "safedoc_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_ssl_check_history: {
        Row: {
          certificate_id: string
          chain_status: string | null
          check_status: string
          checked_at: string
          days_until_expiry: number | null
          error_message: string | null
          id: string
          response_time_ms: number | null
        }
        Insert: {
          certificate_id: string
          chain_status?: string | null
          check_status: string
          checked_at?: string
          days_until_expiry?: number | null
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
        }
        Update: {
          certificate_id?: string
          chain_status?: string | null
          check_status?: string
          checked_at?: string
          days_until_expiry?: number | null
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "safedoc_ssl_check_history_certificate_id_fkey"
            columns: ["certificate_id"]
            isOneToOne: false
            referencedRelation: "safedoc_ssl_certificates"
            referencedColumns: ["id"]
          },
        ]
      }
      safedoc_tags: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          usage_count: number | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          usage_count?: number | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      safemail_domains: {
        Row: {
          created_at: string
          dkim_records: Json | null
          dmarc_record: string | null
          domain_name: string
          id: string
          is_monitored: boolean | null
          last_scan_at: string | null
          msp_org_id: string | null
          mx_records: Json | null
          security_score: number | null
          spf_record: string | null
          threat_level: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dkim_records?: Json | null
          dmarc_record?: string | null
          domain_name: string
          id?: string
          is_monitored?: boolean | null
          last_scan_at?: string | null
          msp_org_id?: string | null
          mx_records?: Json | null
          security_score?: number | null
          spf_record?: string | null
          threat_level?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dkim_records?: Json | null
          dmarc_record?: string | null
          domain_name?: string
          id?: string
          is_monitored?: boolean | null
          last_scan_at?: string | null
          msp_org_id?: string | null
          mx_records?: Json | null
          security_score?: number | null
          spf_record?: string | null
          threat_level?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safemail_domains_msp_org_id_fkey"
            columns: ["msp_org_id"]
            isOneToOne: false
            referencedRelation: "msp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safemail_threats: {
        Row: {
          action_taken: string | null
          created_at: string
          detected_at: string
          domain_id: string | null
          false_positive: boolean | null
          id: string
          recipient_email: string | null
          resolved_at: string | null
          risk_level: string
          sender_email: string
          subject: string | null
          threat_details: Json
          threat_score: number
          threat_type: string
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          created_at?: string
          detected_at?: string
          domain_id?: string | null
          false_positive?: boolean | null
          id?: string
          recipient_email?: string | null
          resolved_at?: string | null
          risk_level: string
          sender_email: string
          subject?: string | null
          threat_details: Json
          threat_score: number
          threat_type: string
          user_id: string
        }
        Update: {
          action_taken?: string | null
          created_at?: string
          detected_at?: string
          domain_id?: string | null
          false_positive?: boolean | null
          id?: string
          recipient_email?: string | null
          resolved_at?: string | null
          risk_level?: string
          sender_email?: string
          subject?: string | null
          threat_details?: Json
          threat_score?: number
          threat_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safemail_threats_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "safemail_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      safenet_connectors: {
        Row: {
          client_name: string | null
          connector_key: string
          connector_name: string
          created_at: string | null
          id: string
          last_heartbeat: string | null
          network_info: Json | null
          status: string
          system_info: Json | null
          updated_at: string | null
          user_id: string
          version: string | null
        }
        Insert: {
          client_name?: string | null
          connector_key: string
          connector_name: string
          created_at?: string | null
          id?: string
          last_heartbeat?: string | null
          network_info?: Json | null
          status?: string
          system_info?: Json | null
          updated_at?: string | null
          user_id: string
          version?: string | null
        }
        Update: {
          client_name?: string | null
          connector_key?: string
          connector_name?: string
          created_at?: string | null
          id?: string
          last_heartbeat?: string | null
          network_info?: Json | null
          status?: string
          system_info?: Json | null
          updated_at?: string | null
          user_id?: string
          version?: string | null
        }
        Relationships: []
      }
      safenet_devices: {
        Row: {
          connector_key: string | null
          cpu_usage: number | null
          created_at: string
          device_metadata: Json | null
          device_name: string | null
          device_role: string | null
          device_type: string
          discovery_method: string[] | null
          hostname: string | null
          id: string
          ip_address: unknown
          is_critical: boolean | null
          is_managed: boolean | null
          last_seen_at: string | null
          mac_address: string | null
          manufacturer: string | null
          memory_usage: number | null
          model: string | null
          network_id: string | null
          network_segment: string | null
          os_family: string | null
          os_version: string | null
          security_patches_needed: number | null
          status: string | null
          updated_at: string
          uptime_hours: number | null
          user_id: string
          vulnerability_count: number | null
        }
        Insert: {
          connector_key?: string | null
          cpu_usage?: number | null
          created_at?: string
          device_metadata?: Json | null
          device_name?: string | null
          device_role?: string | null
          device_type: string
          discovery_method?: string[] | null
          hostname?: string | null
          id?: string
          ip_address: unknown
          is_critical?: boolean | null
          is_managed?: boolean | null
          last_seen_at?: string | null
          mac_address?: string | null
          manufacturer?: string | null
          memory_usage?: number | null
          model?: string | null
          network_id?: string | null
          network_segment?: string | null
          os_family?: string | null
          os_version?: string | null
          security_patches_needed?: number | null
          status?: string | null
          updated_at?: string
          uptime_hours?: number | null
          user_id: string
          vulnerability_count?: number | null
        }
        Update: {
          connector_key?: string | null
          cpu_usage?: number | null
          created_at?: string
          device_metadata?: Json | null
          device_name?: string | null
          device_role?: string | null
          device_type?: string
          discovery_method?: string[] | null
          hostname?: string | null
          id?: string
          ip_address?: unknown
          is_critical?: boolean | null
          is_managed?: boolean | null
          last_seen_at?: string | null
          mac_address?: string | null
          manufacturer?: string | null
          memory_usage?: number | null
          model?: string | null
          network_id?: string | null
          network_segment?: string | null
          os_family?: string | null
          os_version?: string | null
          security_patches_needed?: number | null
          status?: string | null
          updated_at?: string
          uptime_hours?: number | null
          user_id?: string
          vulnerability_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "safenet_devices_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "safenet_networks"
            referencedColumns: ["id"]
          },
        ]
      }
      safenet_networks: {
        Row: {
          created_at: string
          device_count: number | null
          id: string
          last_scan_at: string | null
          location: string | null
          monitoring_enabled: boolean | null
          msp_org_id: string | null
          network_name: string
          network_range: string
          network_type: string | null
          security_score: number | null
          threat_count: number | null
          updated_at: string
          user_id: string
          vulnerability_count: number | null
        }
        Insert: {
          created_at?: string
          device_count?: number | null
          id?: string
          last_scan_at?: string | null
          location?: string | null
          monitoring_enabled?: boolean | null
          msp_org_id?: string | null
          network_name: string
          network_range: string
          network_type?: string | null
          security_score?: number | null
          threat_count?: number | null
          updated_at?: string
          user_id: string
          vulnerability_count?: number | null
        }
        Update: {
          created_at?: string
          device_count?: number | null
          id?: string
          last_scan_at?: string | null
          location?: string | null
          monitoring_enabled?: boolean | null
          msp_org_id?: string | null
          network_name?: string
          network_range?: string
          network_type?: string | null
          security_score?: number | null
          threat_count?: number | null
          updated_at?: string
          user_id?: string
          vulnerability_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "safenet_networks_msp_org_id_fkey"
            columns: ["msp_org_id"]
            isOneToOne: false
            referencedRelation: "msp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safenet_scans: {
        Row: {
          connector_id: string
          created_at: string | null
          devices_found: number | null
          id: string
          networks_scanned: number | null
          risk_score: number | null
          scan_data: Json
          scan_duration: number | null
          system_info: Json | null
          total_ports: number | null
          updated_at: string | null
          user_id: string
          vulnerabilities: Json | null
        }
        Insert: {
          connector_id: string
          created_at?: string | null
          devices_found?: number | null
          id?: string
          networks_scanned?: number | null
          risk_score?: number | null
          scan_data?: Json
          scan_duration?: number | null
          system_info?: Json | null
          total_ports?: number | null
          updated_at?: string | null
          user_id: string
          vulnerabilities?: Json | null
        }
        Update: {
          connector_id?: string
          created_at?: string | null
          devices_found?: number | null
          id?: string
          networks_scanned?: number | null
          risk_score?: number | null
          scan_data?: Json
          scan_duration?: number | null
          system_info?: Json | null
          total_ports?: number | null
          updated_at?: string | null
          user_id?: string
          vulnerabilities?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "safenet_scans_connector_id_fkey"
            columns: ["connector_id"]
            isOneToOne: false
            referencedRelation: "safenet_connectors"
            referencedColumns: ["id"]
          },
        ]
      }
      safenet_vulnerabilities: {
        Row: {
          affected_service: string | null
          created_at: string
          cve_id: string | null
          cvss_score: number | null
          description: string | null
          device_id: string | null
          discovered_at: string
          id: string
          network_id: string | null
          patched_at: string | null
          port: number | null
          severity: string
          solution: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
          vulnerability_id: string
        }
        Insert: {
          affected_service?: string | null
          created_at?: string
          cve_id?: string | null
          cvss_score?: number | null
          description?: string | null
          device_id?: string | null
          discovered_at?: string
          id?: string
          network_id?: string | null
          patched_at?: string | null
          port?: number | null
          severity: string
          solution?: string | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
          vulnerability_id: string
        }
        Update: {
          affected_service?: string | null
          created_at?: string
          cve_id?: string | null
          cvss_score?: number | null
          description?: string | null
          device_id?: string | null
          discovered_at?: string
          id?: string
          network_id?: string | null
          patched_at?: string | null
          port?: number | null
          severity?: string
          solution?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          vulnerability_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safenet_vulnerabilities_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "safenet_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safenet_vulnerabilities_network_id_fkey"
            columns: ["network_id"]
            isOneToOne: false
            referencedRelation: "safenet_networks"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_accounts: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          linked_at: string | null
          linked_by: string | null
          linked_vanguard_client_id: string | null
          msp_client_id: string | null
          provisioned_at: string | null
          provisioned_by_msp: string | null
          subscription_expires_at: string | null
          subscription_started_at: string | null
          subscription_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          linked_at?: string | null
          linked_by?: string | null
          linked_vanguard_client_id?: string | null
          msp_client_id?: string | null
          provisioned_at?: string | null
          provisioned_by_msp?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          linked_at?: string | null
          linked_by?: string | null
          linked_vanguard_client_id?: string | null
          msp_client_id?: string | null
          provisioned_at?: string | null
          provisioned_by_msp?: string | null
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          subscription_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safepass_attachments: {
        Row: {
          created_at: string
          encrypted_content: string | null
          entry_id: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          id: string
          storage_path: string | null
          user_id: string
          vault_id: string | null
        }
        Insert: {
          created_at?: string
          encrypted_content?: string | null
          entry_id?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path?: string | null
          user_id: string
          vault_id?: string | null
        }
        Update: {
          created_at?: string
          encrypted_content?: string | null
          entry_id?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          storage_path?: string | null
          user_id?: string
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safepass_attachments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "safepass_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safepass_attachments_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "safepass_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_breach_database: {
        Row: {
          breach_count: number | null
          breach_sources: string[] | null
          created_at: string
          first_seen: string
          id: string
          last_seen: string
          password_hash: string
          updated_at: string
        }
        Insert: {
          breach_count?: number | null
          breach_sources?: string[] | null
          created_at?: string
          first_seen?: string
          id?: string
          last_seen?: string
          password_hash: string
          updated_at?: string
        }
        Update: {
          breach_count?: number | null
          breach_sources?: string[] | null
          created_at?: string
          first_seen?: string
          id?: string
          last_seen?: string
          password_hash?: string
          updated_at?: string
        }
        Relationships: []
      }
      safepass_breach_scans: {
        Row: {
          completed_at: string | null
          compromised_count: number | null
          created_at: string
          id: string
          overall_score: number | null
          reused_count: number | null
          scan_results: Json | null
          scan_type: string
          total_entries_scanned: number | null
          user_id: string
          weak_count: number | null
        }
        Insert: {
          completed_at?: string | null
          compromised_count?: number | null
          created_at?: string
          id?: string
          overall_score?: number | null
          reused_count?: number | null
          scan_results?: Json | null
          scan_type?: string
          total_entries_scanned?: number | null
          user_id: string
          weak_count?: number | null
        }
        Update: {
          completed_at?: string | null
          compromised_count?: number | null
          created_at?: string
          id?: string
          overall_score?: number | null
          reused_count?: number | null
          scan_results?: Json | null
          scan_type?: string
          total_entries_scanned?: number | null
          user_id?: string
          weak_count?: number | null
        }
        Relationships: []
      }
      safepass_cards: {
        Row: {
          card_type: string | null
          created_at: string
          encrypted_data: string
          holder_name: string
          id: string
          is_favorite: boolean | null
          last_four: string
          updated_at: string
          user_id: string
        }
        Insert: {
          card_type?: string | null
          created_at?: string
          encrypted_data: string
          holder_name: string
          id?: string
          is_favorite?: boolean | null
          last_four: string
          updated_at?: string
          user_id: string
        }
        Update: {
          card_type?: string | null
          created_at?: string
          encrypted_data?: string
          holder_name?: string
          id?: string
          is_favorite?: boolean | null
          last_four?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safepass_emergency_access: {
        Row: {
          access_type: string
          approved_at: string | null
          created_at: string
          emergency_contact_id: string
          expires_at: string | null
          id: string
          reason: string | null
          requested_at: string | null
          status: string
          updated_at: string
          vault_id: string | null
          vault_owner_id: string
          wait_period_hours: number | null
        }
        Insert: {
          access_type?: string
          approved_at?: string | null
          created_at?: string
          emergency_contact_id: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string
          vault_id?: string | null
          vault_owner_id: string
          wait_period_hours?: number | null
        }
        Update: {
          access_type?: string
          approved_at?: string | null
          created_at?: string
          emergency_contact_id?: string
          expires_at?: string | null
          id?: string
          reason?: string | null
          requested_at?: string | null
          status?: string
          updated_at?: string
          vault_id?: string | null
          vault_owner_id?: string
          wait_period_hours?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "safepass_emergency_access_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "safepass_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_entries: {
        Row: {
          category: string | null
          client_id: string | null
          compromise_details: Json | null
          created_at: string
          encrypted_data: Json
          entry_type: string
          expiration_reminder_sent: boolean | null
          folder_id: string | null
          id: string
          is_compromised: boolean | null
          is_favorite: boolean | null
          key_version: number
          last_password_change: string | null
          last_used_at: string | null
          msp_id: string | null
          notes: string | null
          password_expires_at: string | null
          password_strength_score: number | null
          tags: string[] | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
          vault_id: string
        }
        Insert: {
          category?: string | null
          client_id?: string | null
          compromise_details?: Json | null
          created_at?: string
          encrypted_data: Json
          entry_type?: string
          expiration_reminder_sent?: boolean | null
          folder_id?: string | null
          id?: string
          is_compromised?: boolean | null
          is_favorite?: boolean | null
          key_version?: number
          last_password_change?: string | null
          last_used_at?: string | null
          msp_id?: string | null
          notes?: string | null
          password_expires_at?: string | null
          password_strength_score?: number | null
          tags?: string[] | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          vault_id: string
        }
        Update: {
          category?: string | null
          client_id?: string | null
          compromise_details?: Json | null
          created_at?: string
          encrypted_data?: Json
          entry_type?: string
          expiration_reminder_sent?: boolean | null
          folder_id?: string | null
          id?: string
          is_compromised?: boolean | null
          is_favorite?: boolean | null
          key_version?: number
          last_password_change?: string | null
          last_used_at?: string | null
          msp_id?: string | null
          notes?: string | null
          password_expires_at?: string | null
          password_strength_score?: number | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safepass_entries_folder_id_fkey"
            columns: ["folder_id"]
            isOneToOne: false
            referencedRelation: "safepass_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safepass_entries_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "safepass_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_expiration_reminders: {
        Row: {
          created_at: string
          dismissed_at: string | null
          due_date: string
          entry_id: string
          id: string
          is_dismissed: boolean | null
          notification_sent: boolean | null
          reminder_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dismissed_at?: string | null
          due_date: string
          entry_id: string
          id?: string
          is_dismissed?: boolean | null
          notification_sent?: boolean | null
          reminder_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dismissed_at?: string | null
          due_date?: string
          entry_id?: string
          id?: string
          is_dismissed?: boolean | null
          notification_sent?: boolean | null
          reminder_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safepass_expiration_reminders_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "safepass_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_folders: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
          parent_folder_id: string | null
          sort_order: number | null
          updated_at: string
          user_id: string
          vault_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          parent_folder_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id: string
          vault_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          parent_folder_id?: string | null
          sort_order?: number | null
          updated_at?: string
          user_id?: string
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safepass_folders_parent_folder_id_fkey"
            columns: ["parent_folder_id"]
            isOneToOne: false
            referencedRelation: "safepass_folders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safepass_folders_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "safepass_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_identities: {
        Row: {
          created_at: string
          encrypted_data: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_data: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_data?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safepass_master_passwords: {
        Row: {
          created_at: string | null
          id: string
          iterations: number | null
          password_hash: string
          reset_token: string | null
          reset_token_expires_at: string | null
          salt: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          iterations?: number | null
          password_hash: string
          reset_token?: string | null
          reset_token_expires_at?: string | null
          salt: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          iterations?: number | null
          password_hash?: string
          reset_token?: string | null
          reset_token_expires_at?: string | null
          salt?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      safepass_msp_invites: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          client_id: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invite_expires_at: string
          invite_token: string
          msp_user_id: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          client_id?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invite_expires_at?: string
          invite_token?: string
          msp_user_id: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          client_id?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invite_expires_at?: string
          invite_token?: string
          msp_user_id?: string
          status?: string
        }
        Relationships: []
      }
      safepass_msp_policies: {
        Row: {
          client_id: string | null
          created_at: string
          created_by: string
          id: string
          is_active: boolean | null
          is_enforced: boolean | null
          msp_id: string
          policy_config: Json
          policy_type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          created_by: string
          id?: string
          is_active?: boolean | null
          is_enforced?: boolean | null
          msp_id: string
          policy_config?: Json
          policy_type: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          created_by?: string
          id?: string
          is_active?: boolean | null
          is_enforced?: boolean | null
          msp_id?: string
          policy_config?: Json
          policy_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safepass_msp_policies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_notes: {
        Row: {
          created_at: string
          encrypted_content: string
          id: string
          is_favorite: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_content: string
          id?: string
          is_favorite?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_content?: string
          id?: string
          is_favorite?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safepass_password_history: {
        Row: {
          changed_at: string
          created_at: string
          encrypted_password: Json
          entry_id: string
          id: string
          password_strength_score: number | null
          user_id: string
        }
        Insert: {
          changed_at?: string
          created_at?: string
          encrypted_password: Json
          entry_id: string
          id?: string
          password_strength_score?: number | null
          user_id: string
        }
        Update: {
          changed_at?: string
          created_at?: string
          encrypted_password?: Json
          entry_id?: string
          id?: string
          password_strength_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safepass_password_history_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "safepass_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_security_monitoring: {
        Row: {
          created_at: string
          details: Json | null
          detected_at: string
          entry_id: string | null
          id: string
          monitoring_type: string
          resolved_at: string | null
          status: string
          threat_level: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          detected_at?: string
          entry_id?: string | null
          id?: string
          monitoring_type: string
          resolved_at?: string | null
          status?: string
          threat_level?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          detected_at?: string
          entry_id?: string | null
          id?: string
          monitoring_type?: string
          resolved_at?: string | null
          status?: string
          threat_level?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safepass_security_monitoring_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "safepass_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_shared_access: {
        Row: {
          access_count: number | null
          created_at: string
          entry_id: string | null
          expires_at: string | null
          id: string
          last_accessed_at: string | null
          owner_user_id: string
          permission_level: string
          shared_at: string
          shared_with_email: string | null
          shared_with_user_id: string | null
          vault_id: string
        }
        Insert: {
          access_count?: number | null
          created_at?: string
          entry_id?: string | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          owner_user_id: string
          permission_level?: string
          shared_at?: string
          shared_with_email?: string | null
          shared_with_user_id?: string | null
          vault_id: string
        }
        Update: {
          access_count?: number | null
          created_at?: string
          entry_id?: string | null
          expires_at?: string | null
          id?: string
          last_accessed_at?: string | null
          owner_user_id?: string
          permission_level?: string
          shared_at?: string
          shared_with_email?: string | null
          shared_with_user_id?: string | null
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safepass_shared_access_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "safepass_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safepass_shared_access_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "safepass_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_shared_vaults: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          permissions: Json | null
          shared_by: string
          team_id: string
          updated_at: string
          vault_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          shared_by: string
          team_id: string
          updated_at?: string
          vault_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          permissions?: Json | null
          shared_by?: string
          team_id?: string
          updated_at?: string
          vault_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safepass_shared_vaults_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "safepass_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safepass_shared_vaults_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "safepass_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_team_memberships: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_by: string | null
          is_active: boolean | null
          joined_at: string | null
          permissions: Json | null
          role: string
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string | null
          permissions?: Json | null
          role?: string
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "safepass_team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "safepass_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_teams: {
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
      safepass_totp_codes: {
        Row: {
          account_label: string | null
          algorithm: string | null
          created_at: string
          digits: number | null
          encrypted_secret: Json
          entry_id: string | null
          icon_url: string | null
          id: string
          issuer: string | null
          name: string
          period: number | null
          updated_at: string
          user_id: string
          vault_id: string | null
        }
        Insert: {
          account_label?: string | null
          algorithm?: string | null
          created_at?: string
          digits?: number | null
          encrypted_secret: Json
          entry_id?: string | null
          icon_url?: string | null
          id?: string
          issuer?: string | null
          name: string
          period?: number | null
          updated_at?: string
          user_id: string
          vault_id?: string | null
        }
        Update: {
          account_label?: string | null
          algorithm?: string | null
          created_at?: string
          digits?: number | null
          encrypted_secret?: Json
          entry_id?: string | null
          icon_url?: string | null
          id?: string
          issuer?: string | null
          name?: string
          period?: number | null
          updated_at?: string
          user_id?: string
          vault_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safepass_totp_codes_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "safepass_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safepass_totp_codes_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "safepass_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_unlock_attempts: {
        Row: {
          attempt_count: number | null
          created_at: string | null
          id: string
          last_attempt_at: string | null
          locked_until: string | null
          user_id: string
        }
        Insert: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          locked_until?: string | null
          user_id: string
        }
        Update: {
          attempt_count?: number | null
          created_at?: string | null
          id?: string
          last_attempt_at?: string | null
          locked_until?: string | null
          user_id?: string
        }
        Relationships: []
      }
      safepass_usage_logs: {
        Row: {
          action: string
          created_at: string | null
          device_id: string
          domain: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          password_id: string | null
          success: boolean | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          device_id: string
          domain?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          password_id?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          device_id?: string
          domain?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          password_id?: string | null
          success?: boolean | null
          user_id?: string | null
        }
        Relationships: []
      }
      safepass_vanguard_link_requests: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          request_type: string
          requested_vanguard_client_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          safepass_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          request_type?: string
          requested_vanguard_client_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safepass_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          request_type?: string
          requested_vanguard_client_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safepass_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      safepass_vaults: {
        Row: {
          access_policies: Json | null
          client_id: string | null
          created_at: string
          description: string | null
          encryption_key_hash: string
          id: string
          is_active: boolean | null
          is_shared: boolean | null
          key_version: number
          last_accessed_at: string | null
          msp_org_id: string | null
          shared_with: Json | null
          updated_at: string
          user_id: string
          vault_name: string
        }
        Insert: {
          access_policies?: Json | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          encryption_key_hash: string
          id?: string
          is_active?: boolean | null
          is_shared?: boolean | null
          key_version?: number
          last_accessed_at?: string | null
          msp_org_id?: string | null
          shared_with?: Json | null
          updated_at?: string
          user_id: string
          vault_name: string
        }
        Update: {
          access_policies?: Json | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          encryption_key_hash?: string
          id?: string
          is_active?: boolean | null
          is_shared?: boolean | null
          key_version?: number
          last_accessed_at?: string | null
          msp_org_id?: string | null
          shared_with?: Json | null
          updated_at?: string
          user_id?: string
          vault_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "safepass_vaults_msp_org_id_fkey"
            columns: ["msp_org_id"]
            isOneToOne: false
            referencedRelation: "msp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      safepass_webauthn_credentials: {
        Row: {
          attestation_object: string | null
          authenticator_type: string
          counter: number
          created_at: string
          credential_id: string
          id: string
          last_used_at: string | null
          name: string
          public_key: string
          use_count: number | null
          user_id: string
        }
        Insert: {
          attestation_object?: string | null
          authenticator_type?: string
          counter?: number
          created_at?: string
          credential_id: string
          id?: string
          last_used_at?: string | null
          name?: string
          public_key: string
          use_count?: number | null
          user_id: string
        }
        Update: {
          attestation_object?: string | null
          authenticator_type?: string
          counter?: number
          created_at?: string
          credential_id?: string
          id?: string
          last_used_at?: string | null
          name?: string
          public_key?: string
          use_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      safesuite_entry_permissions: {
        Row: {
          entry_id: string
          granted_at: string
          granted_by: string | null
          id: string
          member_id: string
          permission: string
        }
        Insert: {
          entry_id: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          member_id: string
          permission?: string
        }
        Update: {
          entry_id?: string
          granted_at?: string
          granted_by?: string | null
          id?: string
          member_id?: string
          permission?: string
        }
        Relationships: [
          {
            foreignKeyName: "safesuite_entry_permissions_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "safesuite_shared_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safesuite_entry_permissions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "safesuite_team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      safesuite_shared_entries: {
        Row: {
          created_at: string
          created_by: string
          encrypted_data: string
          entry_type: string
          folder: string | null
          id: string
          is_favorite: boolean | null
          last_modified_by: string | null
          password_strength_score: number | null
          tags: string[] | null
          team_id: string
          title: string
          updated_at: string
          vault_id: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          encrypted_data: string
          entry_type?: string
          folder?: string | null
          id?: string
          is_favorite?: boolean | null
          last_modified_by?: string | null
          password_strength_score?: number | null
          tags?: string[] | null
          team_id: string
          title: string
          updated_at?: string
          vault_id: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          encrypted_data?: string
          entry_type?: string
          folder?: string | null
          id?: string
          is_favorite?: boolean | null
          last_modified_by?: string | null
          password_strength_score?: number | null
          tags?: string[] | null
          team_id?: string
          title?: string
          updated_at?: string
          vault_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safesuite_shared_entries_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "safesuite_teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "safesuite_shared_entries_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "safesuite_shared_vaults"
            referencedColumns: ["id"]
          },
        ]
      }
      safesuite_shared_vaults: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "safesuite_shared_vaults_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "safesuite_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      safesuite_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          status: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      safesuite_team_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          ip_address: unknown
          resource_id: string | null
          resource_type: string | null
          team_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          team_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          ip_address?: unknown
          resource_id?: string | null
          resource_type?: string | null
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safesuite_team_audit_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "safesuite_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      safesuite_team_members: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_at: string
          invited_by: string | null
          joined_at: string | null
          role: string
          status: string
          team_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          team_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_at?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          team_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "safesuite_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "safesuite_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      safesuite_teams: {
        Row: {
          created_at: string
          id: string
          max_seats: number
          name: string
          owner_id: string
          seat_count: number
          subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          max_seats?: number
          name: string
          owner_id: string
          seat_count?: number
          subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          max_seats?: number
          name?: string
          owner_id?: string
          seat_count?: number
          subscription_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      safesuite_usage: {
        Row: {
          created_at: string
          id: string
          period_end: string
          period_start: string
          product: string
          updated_at: string
          usage_count: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          product: string
          updated_at?: string
          usage_count?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string
          period_start?: string
          product?: string
          updated_at?: string
          usage_count?: number
          user_id?: string
        }
        Relationships: []
      }
      safetrack_warranties: {
        Row: {
          ai_analysis: string | null
          coverage_type: string | null
          created_at: string
          device_name: string | null
          id: string
          last_checked_at: string | null
          manufacturer: string | null
          model: string | null
          purchase_date: string | null
          raw_warranty_data: Json | null
          repair_options: Json | null
          serial_number: string
          source_url: string | null
          support_contacts: Json | null
          updated_at: string
          user_id: string
          warranty_end_date: string | null
          warranty_start_date: string | null
          warranty_status: string | null
        }
        Insert: {
          ai_analysis?: string | null
          coverage_type?: string | null
          created_at?: string
          device_name?: string | null
          id?: string
          last_checked_at?: string | null
          manufacturer?: string | null
          model?: string | null
          purchase_date?: string | null
          raw_warranty_data?: Json | null
          repair_options?: Json | null
          serial_number: string
          source_url?: string | null
          support_contacts?: Json | null
          updated_at?: string
          user_id: string
          warranty_end_date?: string | null
          warranty_start_date?: string | null
          warranty_status?: string | null
        }
        Update: {
          ai_analysis?: string | null
          coverage_type?: string | null
          created_at?: string
          device_name?: string | null
          id?: string
          last_checked_at?: string | null
          manufacturer?: string | null
          model?: string | null
          purchase_date?: string | null
          raw_warranty_data?: Json | null
          repair_options?: Json | null
          serial_number?: string
          source_url?: string | null
          support_contacts?: Json | null
          updated_at?: string
          user_id?: string
          warranty_end_date?: string | null
          warranty_start_date?: string | null
          warranty_status?: string | null
        }
        Relationships: []
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
      scheduled_scan_results: {
        Row: {
          created_at: string
          id: string
          results: Json
          scheduled_scan_id: string
          threats_found: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          results?: Json
          scheduled_scan_id: string
          threats_found?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          results?: Json
          scheduled_scan_id?: string
          threats_found?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_scan_results_scheduled_scan_id_fkey"
            columns: ["scheduled_scan_id"]
            isOneToOne: false
            referencedRelation: "scheduled_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_scans: {
        Row: {
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string | null
          next_run_at: string
          notify_email: string | null
          notify_on_threat: boolean | null
          scan_target: string
          scan_type: string
          schedule_time: string
          targets: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string | null
          next_run_at: string
          notify_email?: string | null
          notify_on_threat?: boolean | null
          scan_target: string
          scan_type: string
          schedule_time?: string
          targets?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string | null
          next_run_at?: string
          notify_email?: string | null
          notify_on_threat?: boolean | null
          scan_target?: string
          scan_type?: string
          schedule_time?: string
          targets?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scheduled_social_posts: {
        Row: {
          bundle_post_id: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          platforms: string[]
          post_content: string
          posted_at: string | null
          scheduled_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          bundle_post_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          platforms?: string[]
          post_content: string
          posted_at?: string | null
          scheduled_at?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          bundle_post_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          platforms?: string[]
          post_content?: string
          posted_at?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      script_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          device_id: string
          error_output: string | null
          execution_status: string
          exit_code: number | null
          id: string
          output: string | null
          remote_session_id: string | null
          script_content: string
          script_name: string
          script_type: string
          started_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          device_id: string
          error_output?: string | null
          execution_status?: string
          exit_code?: number | null
          id?: string
          output?: string | null
          remote_session_id?: string | null
          script_content: string
          script_name: string
          script_type?: string
          started_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          device_id?: string
          error_output?: string | null
          execution_status?: string
          exit_code?: number | null
          id?: string
          output?: string | null
          remote_session_id?: string | null
          script_content?: string
          script_name?: string
          script_type?: string
          started_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_script_executions_device"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "rmm_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_script_executions_session"
            columns: ["remote_session_id"]
            isOneToOne: false
            referencedRelation: "remote_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      security_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          affected_systems: Json | null
          alert_type: string
          created_at: string | null
          description: string
          id: string
          indicators: Json | null
          remediation_steps: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          source_system: string
          status: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_systems?: Json | null
          alert_type: string
          created_at?: string | null
          description: string
          id?: string
          indicators?: Json | null
          remediation_steps?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          source_system?: string
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          affected_systems?: Json | null
          alert_type?: string
          created_at?: string | null
          description?: string
          id?: string
          indicators?: Json | null
          remediation_steps?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          source_system?: string
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_analytics: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          service_name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          service_name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          service_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      security_api_keys: {
        Row: {
          allowed_ips: string[] | null
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at: string | null
          metadata: Json | null
          msp_org_id: string | null
          permissions: Json
          rate_limit_per_hour: number | null
          scopes: string[] | null
          updated_at: string
          usage_count: number | null
          user_id: string
          webhook_url: string | null
        }
        Insert: {
          allowed_ips?: string[] | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          key_name: string
          key_prefix: string
          last_used_at?: string | null
          metadata?: Json | null
          msp_org_id?: string | null
          permissions?: Json
          rate_limit_per_hour?: number | null
          scopes?: string[] | null
          updated_at?: string
          usage_count?: number | null
          user_id: string
          webhook_url?: string | null
        }
        Update: {
          allowed_ips?: string[] | null
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          key_name?: string
          key_prefix?: string
          last_used_at?: string | null
          metadata?: Json | null
          msp_org_id?: string | null
          permissions?: Json
          rate_limit_per_hour?: number | null
          scopes?: string[] | null
          updated_at?: string
          usage_count?: number | null
          user_id?: string
          webhook_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_api_keys_msp_org_id_fkey"
            columns: ["msp_org_id"]
            isOneToOne: false
            referencedRelation: "msp_organizations"
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
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
      security_findings: {
        Row: {
          created_at: string
          cve: string | null
          cvss: number | null
          description: string | null
          evidence: string[] | null
          id: string
          impact: string | null
          location: string | null
          recommendation: string | null
          scan_id: string
          severity: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cve?: string | null
          cvss?: number | null
          description?: string | null
          evidence?: string[] | null
          id?: string
          impact?: string | null
          location?: string | null
          recommendation?: string | null
          scan_id: string
          severity: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          cve?: string | null
          cvss?: number | null
          description?: string | null
          evidence?: string[] | null
          id?: string
          impact?: string | null
          location?: string | null
          recommendation?: string | null
          scan_id?: string
          severity?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_findings_scan_id_fkey"
            columns: ["scan_id"]
            isOneToOne: false
            referencedRelation: "security_scans"
            referencedColumns: ["id"]
          },
        ]
      }
      security_incidents: {
        Row: {
          acknowledged_at: string | null
          affected_assets: Json | null
          agent_id: string | null
          assigned_to: string | null
          created_at: string
          description: string | null
          escalation_level: number | null
          first_detected_at: string
          id: string
          incident_type: string
          msp_org_id: string | null
          resolved_at: string | null
          response_actions: Json | null
          severity: string
          sla_deadline: string | null
          source_data: Json | null
          source_system: string
          status: string | null
          timeline: Json | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          affected_assets?: Json | null
          agent_id?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          escalation_level?: number | null
          first_detected_at?: string
          id?: string
          incident_type: string
          msp_org_id?: string | null
          resolved_at?: string | null
          response_actions?: Json | null
          severity: string
          sla_deadline?: string | null
          source_data?: Json | null
          source_system: string
          status?: string | null
          timeline?: Json | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          affected_assets?: Json | null
          agent_id?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string | null
          escalation_level?: number | null
          first_detected_at?: string
          id?: string
          incident_type?: string
          msp_org_id?: string | null
          resolved_at?: string | null
          response_actions?: Json | null
          severity?: string
          sla_deadline?: string | null
          source_data?: Json | null
          source_system?: string
          status?: string | null
          timeline?: Json | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "security_incidents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "security_incidents_msp_org_id_fkey"
            columns: ["msp_org_id"]
            isOneToOne: false
            referencedRelation: "msp_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      security_integrations: {
        Row: {
          configuration: Json
          created_at: string | null
          id: string
          integration_type: string
          is_enabled: boolean | null
          last_triggered_at: string | null
          name: string
          trigger_conditions: Json | null
          trigger_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          configuration: Json
          created_at?: string | null
          id?: string
          integration_type: string
          is_enabled?: boolean | null
          last_triggered_at?: string | null
          name: string
          trigger_conditions?: Json | null
          trigger_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          configuration?: Json
          created_at?: string | null
          id?: string
          integration_type?: string
          is_enabled?: boolean | null
          last_triggered_at?: string | null
          name?: string
          trigger_conditions?: Json | null
          trigger_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      security_scans: {
        Row: {
          completed_at: string | null
          created_at: string
          critical_count: number | null
          findings_count: number | null
          high_count: number | null
          id: string
          low_count: number | null
          medium_count: number | null
          options: Json | null
          scan_type: string
          started_at: string
          status: string
          target: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          critical_count?: number | null
          findings_count?: number | null
          high_count?: number | null
          id?: string
          low_count?: number | null
          medium_count?: number | null
          options?: Json | null
          scan_type: string
          started_at?: string
          status?: string
          target: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          critical_count?: number | null
          findings_count?: number | null
          high_count?: number | null
          id?: string
          low_count?: number | null
          medium_count?: number | null
          options?: Json | null
          scan_type?: string
          started_at?: string
          status?: string
          target?: string
          updated_at?: string
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
      sla_policies: {
        Row: {
          business_hours_only: boolean | null
          created_at: string | null
          description: string | null
          escalation_hours: number | null
          first_response_hours: number
          id: string
          is_active: boolean | null
          name: string
          priority_level: string
          resolution_hours: number
          updated_at: string | null
        }
        Insert: {
          business_hours_only?: boolean | null
          created_at?: string | null
          description?: string | null
          escalation_hours?: number | null
          first_response_hours: number
          id?: string
          is_active?: boolean | null
          name: string
          priority_level: string
          resolution_hours: number
          updated_at?: string | null
        }
        Update: {
          business_hours_only?: boolean | null
          created_at?: string | null
          description?: string | null
          escalation_hours?: number | null
          first_response_hours?: number
          id?: string
          is_active?: boolean | null
          name?: string
          priority_level?: string
          resolution_hours?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      software_assets: {
        Row: {
          client_id: string | null
          compliance_status: string | null
          cost_per_license: number | null
          created_at: string
          expiry_date: string | null
          id: string
          installation_count: number | null
          license_key: string | null
          license_type: string | null
          name: string
          purchase_date: string | null
          seats_total: number | null
          seats_used: number | null
          support_expiry: string | null
          updated_at: string
          user_id: string
          vendor: string | null
          version: string | null
        }
        Insert: {
          client_id?: string | null
          compliance_status?: string | null
          cost_per_license?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          installation_count?: number | null
          license_key?: string | null
          license_type?: string | null
          name: string
          purchase_date?: string | null
          seats_total?: number | null
          seats_used?: number | null
          support_expiry?: string | null
          updated_at?: string
          user_id: string
          vendor?: string | null
          version?: string | null
        }
        Update: {
          client_id?: string | null
          compliance_status?: string | null
          cost_per_license?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          installation_count?: number | null
          license_key?: string | null
          license_type?: string | null
          name?: string
          purchase_date?: string | null
          seats_total?: number | null
          seats_used?: number | null
          support_expiry?: string | null
          updated_at?: string
          user_id?: string
          vendor?: string | null
          version?: string | null
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
      software_installations: {
        Row: {
          asset_id: string | null
          created_at: string
          id: string
          installation_date: string | null
          installed_version: string | null
          last_used: string | null
          software_asset_id: string | null
          status: string | null
          usage_hours: number | null
          user_id: string
        }
        Insert: {
          asset_id?: string | null
          created_at?: string
          id?: string
          installation_date?: string | null
          installed_version?: string | null
          last_used?: string | null
          software_asset_id?: string | null
          status?: string | null
          usage_hours?: number | null
          user_id: string
        }
        Update: {
          asset_id?: string | null
          created_at?: string
          id?: string
          installation_date?: string | null
          installed_version?: string | null
          last_used?: string | null
          software_asset_id?: string | null
          status?: string | null
          usage_hours?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "software_installations_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "software_installations_software_asset_id_fkey"
            columns: ["software_asset_id"]
            isOneToOne: false
            referencedRelation: "software_assets"
            referencedColumns: ["id"]
          },
        ]
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
      software_licenses: {
        Row: {
          auto_renew: boolean | null
          billing_cycle: string | null
          category: string | null
          cost_per_seat: number | null
          created_at: string
          expiry_date: string | null
          id: string
          license_key: string | null
          license_type: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          renewal_date: string | null
          seats_total: number | null
          seats_used: number | null
          status: string | null
          updated_at: string
          user_id: string
          vendor: string | null
          version: string | null
        }
        Insert: {
          auto_renew?: boolean | null
          billing_cycle?: string | null
          category?: string | null
          cost_per_seat?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          license_key?: string | null
          license_type?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          renewal_date?: string | null
          seats_total?: number | null
          seats_used?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
          vendor?: string | null
          version?: string | null
        }
        Update: {
          auto_renew?: boolean | null
          billing_cycle?: string | null
          category?: string | null
          cost_per_seat?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          license_key?: string | null
          license_type?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          renewal_date?: string | null
          seats_total?: number | null
          seats_used?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
          vendor?: string | null
          version?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          email: string
          id: string
          price_id: string | null
          status: string | null
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_id: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          email: string
          id?: string
          price_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          email?: string
          id?: string
          price_id?: string | null
          status?: string | null
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_id?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_grace_periods: {
        Row: {
          created_at: string
          grace_period_end: string
          grace_period_start: string
          id: string
          reason: string
          resolved: boolean | null
          resolved_at: string | null
          subscription_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grace_period_end: string
          grace_period_start?: string
          id?: string
          reason?: string
          resolved?: boolean | null
          resolved_at?: string | null
          subscription_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          grace_period_end?: string
          grace_period_start?: string
          id?: string
          reason?: string
          resolved?: boolean | null
          resolved_at?: string | null
          subscription_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscription_modifications: {
        Row: {
          created_at: string
          effective_date: string
          from_amount: number | null
          from_tier: string | null
          id: string
          metadata: Json | null
          modification_type: string
          processed_by: string | null
          proration_amount: number | null
          reason: string | null
          stripe_proration_id: string | null
          subscription_id: string | null
          to_amount: number | null
          to_tier: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          effective_date: string
          from_amount?: number | null
          from_tier?: string | null
          id?: string
          metadata?: Json | null
          modification_type: string
          processed_by?: string | null
          proration_amount?: number | null
          reason?: string | null
          stripe_proration_id?: string | null
          subscription_id?: string | null
          to_amount?: number | null
          to_tier?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          effective_date?: string
          from_amount?: number | null
          from_tier?: string | null
          id?: string
          metadata?: Json | null
          modification_type?: string
          processed_by?: string | null
          proration_amount?: number | null
          reason?: string | null
          stripe_proration_id?: string | null
          subscription_id?: string | null
          to_amount?: number | null
          to_tier?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_modifications_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscribers"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_notifications: {
        Row: {
          created_at: string
          email_notifications: boolean | null
          id: string
          in_app_notifications: boolean | null
          payment_failure_alerts: boolean | null
          renewal_reminder_enabled: boolean | null
          trial_expiration_warnings: boolean | null
          updated_at: string
          usage_limit_notifications: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          payment_failure_alerts?: boolean | null
          renewal_reminder_enabled?: boolean | null
          trial_expiration_warnings?: boolean | null
          updated_at?: string
          usage_limit_notifications?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          in_app_notifications?: boolean | null
          payment_failure_alerts?: boolean | null
          renewal_reminder_enabled?: boolean | null
          trial_expiration_warnings?: boolean | null
          updated_at?: string
          usage_limit_notifications?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      support_agents: {
        Row: {
          agent_name: string
          created_at: string | null
          department: string | null
          email: string
          id: string
          is_active: boolean | null
          max_concurrent_tickets: number | null
          role: string
          skills: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_name: string
          created_at?: string | null
          department?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          max_concurrent_tickets?: number | null
          role?: string
          skills?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_name?: string
          created_at?: string | null
          department?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          max_concurrent_tickets?: number | null
          role?: string
          skills?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_metrics: {
        Row: {
          agent_id: string | null
          avg_first_response_hours: number | null
          avg_resolution_hours: number | null
          client_id: string | null
          created_at: string | null
          customer_satisfaction_score: number | null
          date: string
          id: string
          resolved_tickets: number | null
          sla_breaches: number | null
          total_tickets: number | null
          updated_at: string | null
        }
        Insert: {
          agent_id?: string | null
          avg_first_response_hours?: number | null
          avg_resolution_hours?: number | null
          client_id?: string | null
          created_at?: string | null
          customer_satisfaction_score?: number | null
          date: string
          id?: string
          resolved_tickets?: number | null
          sla_breaches?: number | null
          total_tickets?: number | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string | null
          avg_first_response_hours?: number | null
          avg_resolution_hours?: number | null
          client_id?: string | null
          created_at?: string | null
          customer_satisfaction_score?: number | null
          date?: string
          id?: string
          resolved_tickets?: number | null
          sla_breaches?: number | null
          total_tickets?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          ai_auto_responded: boolean | null
          ai_confidence_score: number | null
          ai_processing_status: string | null
          ai_response_sent_at: string | null
          ai_suggested_solution: string | null
          ai_summary: string | null
          asset_name: string | null
          assigned_by: string | null
          assigned_to: string | null
          auto_resolved: boolean | null
          category: string
          client_id: string | null
          connector_id: string | null
          created_at: string
          description: string | null
          email_thread_id: string | null
          id: string
          internal_notes: string | null
          is_internal_visible: boolean | null
          last_activity_at: string | null
          msp_id: string | null
          priority: string
          requester_email: string | null
          requester_name: string | null
          requester_phone: string | null
          resolution_notes: string | null
          resolution_time_minutes: number | null
          resolved_at: string | null
          security_category: string | null
          sla_due_at: string | null
          sla_policy_id: string | null
          source_type: string | null
          status: string
          tech_action: string | null
          title: string
          updated_at: string
          user_feedback: string | null
          user_id: string
          vanguard_source: string | null
        }
        Insert: {
          ai_auto_responded?: boolean | null
          ai_confidence_score?: number | null
          ai_processing_status?: string | null
          ai_response_sent_at?: string | null
          ai_suggested_solution?: string | null
          ai_summary?: string | null
          asset_name?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          auto_resolved?: boolean | null
          category?: string
          client_id?: string | null
          connector_id?: string | null
          created_at?: string
          description?: string | null
          email_thread_id?: string | null
          id?: string
          internal_notes?: string | null
          is_internal_visible?: boolean | null
          last_activity_at?: string | null
          msp_id?: string | null
          priority?: string
          requester_email?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          resolution_notes?: string | null
          resolution_time_minutes?: number | null
          resolved_at?: string | null
          security_category?: string | null
          sla_due_at?: string | null
          sla_policy_id?: string | null
          source_type?: string | null
          status?: string
          tech_action?: string | null
          title: string
          updated_at?: string
          user_feedback?: string | null
          user_id: string
          vanguard_source?: string | null
        }
        Update: {
          ai_auto_responded?: boolean | null
          ai_confidence_score?: number | null
          ai_processing_status?: string | null
          ai_response_sent_at?: string | null
          ai_suggested_solution?: string | null
          ai_summary?: string | null
          asset_name?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          auto_resolved?: boolean | null
          category?: string
          client_id?: string | null
          connector_id?: string | null
          created_at?: string
          description?: string | null
          email_thread_id?: string | null
          id?: string
          internal_notes?: string | null
          is_internal_visible?: boolean | null
          last_activity_at?: string | null
          msp_id?: string | null
          priority?: string
          requester_email?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          resolution_notes?: string | null
          resolution_time_minutes?: number | null
          resolved_at?: string | null
          security_category?: string | null
          sla_due_at?: string | null
          sla_policy_id?: string | null
          source_type?: string | null
          status?: string
          tech_action?: string | null
          title?: string
          updated_at?: string
          user_feedback?: string | null
          user_id?: string
          vanguard_source?: string | null
        }
        Relationships: []
      }
      system_health_metrics: {
        Row: {
          id: string
          metadata: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at: string
          status: string
          threshold_critical: number | null
          threshold_warning: number | null
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_type: string
          metric_value: number
          recorded_at?: string
          status?: string
          threshold_critical?: number | null
          threshold_warning?: number | null
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_type?: string
          metric_value?: number
          recorded_at?: string
          status?: string
          threshold_critical?: number | null
          threshold_warning?: number | null
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
      threat_intel_cache: {
        Row: {
          categories: string[] | null
          created_at: string | null
          expires_at: string | null
          id: string
          indicator_type: string
          indicator_value: string
          is_malicious: boolean | null
          last_checked_at: string | null
          raw_response: Json | null
          reputation_score: number | null
          source: string
          user_id: string
        }
        Insert: {
          categories?: string[] | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          indicator_type: string
          indicator_value: string
          is_malicious?: boolean | null
          last_checked_at?: string | null
          raw_response?: Json | null
          reputation_score?: number | null
          source: string
          user_id: string
        }
        Update: {
          categories?: string[] | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          indicator_type?: string
          indicator_value?: string
          is_malicious?: boolean | null
          last_checked_at?: string | null
          raw_response?: Json | null
          reputation_score?: number | null
          source?: string
          user_id?: string
        }
        Relationships: []
      }
      threat_intel_indicators: {
        Row: {
          confidence_score: number | null
          created_at: string
          first_seen: string | null
          id: string
          indicator_type: string
          indicator_value: string
          is_active: boolean | null
          last_seen: string | null
          metadata: Json | null
          source: string
          threat_type: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string
          first_seen?: string | null
          id?: string
          indicator_type: string
          indicator_value: string
          is_active?: boolean | null
          last_seen?: string | null
          metadata?: Json | null
          source: string
          threat_type?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          created_at?: string
          first_seen?: string | null
          id?: string
          indicator_type?: string
          indicator_value?: string
          is_active?: boolean | null
          last_seen?: string | null
          metadata?: Json | null
          source?: string
          threat_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      threat_intelligence: {
        Row: {
          created_at: string
          id: string
          indicator_type: string
          indicator_value: string
          last_analyzed: string
          reputation: string
          score: number
          sources: Json | null
          threats: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          indicator_type: string
          indicator_value: string
          last_analyzed?: string
          reputation: string
          score?: number
          sources?: Json | null
          threats?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          indicator_type?: string
          indicator_value?: string
          last_analyzed?: string
          reputation?: string
          score?: number
          sources?: Json | null
          threats?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      threat_intelligence_feeds: {
        Row: {
          campaigns: Json | null
          confidence_score: number | null
          feed_name: string
          feed_type: string
          id: string
          indicators: Json | null
          is_active: boolean | null
          last_updated: string
          threat_actors: Json | null
        }
        Insert: {
          campaigns?: Json | null
          confidence_score?: number | null
          feed_name: string
          feed_type: string
          id?: string
          indicators?: Json | null
          is_active?: boolean | null
          last_updated?: string
          threat_actors?: Json | null
        }
        Update: {
          campaigns?: Json | null
          confidence_score?: number | null
          feed_name?: string
          feed_type?: string
          id?: string
          indicators?: Json | null
          is_active?: boolean | null
          last_updated?: string
          threat_actors?: Json | null
        }
        Relationships: []
      }
      ticket_activities: {
        Row: {
          activity_type: string
          created_at: string | null
          description: string
          id: string
          new_values: Json | null
          old_values: Json | null
          ticket_id: string
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          description: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          ticket_id: string
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          description?: string
          id?: string
          new_values?: Json | null
          old_values?: Json | null
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ticket_activities_ticket"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_assignments: {
        Row: {
          agent_id: string
          assigned_at: string | null
          assigned_by: string
          assignment_reason: string | null
          id: string
          is_active: boolean | null
          ticket_id: string
          unassigned_at: string | null
        }
        Insert: {
          agent_id: string
          assigned_at?: string | null
          assigned_by: string
          assignment_reason?: string | null
          id?: string
          is_active?: boolean | null
          ticket_id: string
          unassigned_at?: string | null
        }
        Update: {
          agent_id?: string
          assigned_at?: string | null
          assigned_by?: string
          assignment_reason?: string | null
          id?: string
          is_active?: boolean | null
          ticket_id?: string
          unassigned_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ticket_assignments_agent"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "support_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ticket_assignments_ticket"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_attachments: {
        Row: {
          file_name: string
          file_path: string
          file_size: number
          id: string
          mime_type: string
          ticket_id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          file_name: string
          file_path: string
          file_size: number
          id?: string
          mime_type: string
          ticket_id: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          file_name?: string
          file_path?: string
          file_size?: number
          id?: string
          mime_type?: string
          ticket_id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ticket_attachments_ticket_id"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          ticket_id: string
          updated_at: string
          user_id: string
          visibility_level: string | null
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id: string
          updated_at?: string
          user_id: string
          visibility_level?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id?: string
          updated_at?: string
          user_id?: string
          visibility_level?: string | null
        }
        Relationships: []
      }
      ticket_escalations: {
        Row: {
          escalated_at: string | null
          escalated_by: string
          escalated_from: string | null
          escalated_to: string
          escalation_reason: string
          escalation_type: string
          id: string
          resolved_at: string | null
          ticket_id: string
        }
        Insert: {
          escalated_at?: string | null
          escalated_by: string
          escalated_from?: string | null
          escalated_to: string
          escalation_reason: string
          escalation_type: string
          id?: string
          resolved_at?: string | null
          ticket_id: string
        }
        Update: {
          escalated_at?: string | null
          escalated_by?: string
          escalated_from?: string | null
          escalated_to?: string
          escalation_reason?: string
          escalation_type?: string
          id?: string
          resolved_at?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_ticket_escalations_ticket"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ticket_escalations_to"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "support_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_field_values: {
        Row: {
          created_at: string
          field_id: string
          id: string
          ticket_id: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          field_id: string
          id?: string
          ticket_id: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          field_id?: string
          id?: string
          ticket_id?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ticket_field_values_field_id_fkey"
            columns: ["field_id"]
            isOneToOne: false
            referencedRelation: "custom_ticket_fields"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_internal_notes: {
        Row: {
          agent_id: string
          created_at: string | null
          id: string
          is_private: boolean | null
          note_content: string
          note_type: string | null
          ticket_id: string
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note_content: string
          note_type?: string | null
          ticket_id: string
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          id?: string
          is_private?: boolean | null
          note_content?: string
          note_type?: string | null
          ticket_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_ticket_notes_agent"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "support_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_ticket_notes_ticket"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_templates: {
        Row: {
          category: string
          created_at: string | null
          created_by: string
          description_template: string
          estimated_hours: number | null
          id: string
          is_active: boolean | null
          name: string
          priority: string | null
          tags: string[] | null
          title_template: string
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          created_by: string
          description_template: string
          estimated_hours?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: string | null
          tags?: string[] | null
          title_template: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string
          description_template?: string
          estimated_hours?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: string | null
          tags?: string[] | null
          title_template?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      tickets: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          billable_hours: number | null
          category: string
          client_id: string | null
          closed_at: string | null
          created_at: string
          customer_satisfaction: number | null
          description: string
          due_date: string | null
          estimated_hours: number | null
          first_response_at: string | null
          id: string
          internal_notes: string | null
          last_activity_at: string
          metadata: Json | null
          parent_ticket_id: string | null
          priority: string
          resolved_at: string | null
          sla_due_at: string | null
          sla_policy_id: string | null
          source: string
          status: string
          tags: string[] | null
          ticket_number: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          billable_hours?: number | null
          category?: string
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          customer_satisfaction?: number | null
          description: string
          due_date?: string | null
          estimated_hours?: number | null
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          last_activity_at?: string
          metadata?: Json | null
          parent_ticket_id?: string | null
          priority?: string
          resolved_at?: string | null
          sla_due_at?: string | null
          sla_policy_id?: string | null
          source?: string
          status?: string
          tags?: string[] | null
          ticket_number: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          billable_hours?: number | null
          category?: string
          client_id?: string | null
          closed_at?: string | null
          created_at?: string
          customer_satisfaction?: number | null
          description?: string
          due_date?: string | null
          estimated_hours?: number | null
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          last_activity_at?: string
          metadata?: Json | null
          parent_ticket_id?: string | null
          priority?: string
          resolved_at?: string | null
          sla_due_at?: string | null
          sla_policy_id?: string | null
          source?: string
          status?: string
          tags?: string[] | null
          ticket_number?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          billable: boolean | null
          created_at: string
          description: string
          hourly_rate: number | null
          hours_worked: number
          id: string
          ticket_id: string | null
          total_cost: number | null
          updated_at: string
          user_id: string
          work_date: string
        }
        Insert: {
          billable?: boolean | null
          created_at?: string
          description: string
          hourly_rate?: number | null
          hours_worked: number
          id?: string
          ticket_id?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id: string
          work_date: string
        }
        Update: {
          billable?: boolean | null
          created_at?: string
          description?: string
          hourly_rate?: number | null
          hours_worked?: number
          id?: string
          ticket_id?: string | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string
          work_date?: string
        }
        Relationships: []
      }
      tray_tokens: {
        Row: {
          created_at: string
          device_id: string
          expires_at: string
          id: string
          jwt: string
          tool: string
        }
        Insert: {
          created_at?: string
          device_id: string
          expires_at: string
          id?: string
          jwt: string
          tool: string
        }
        Update: {
          created_at?: string
          device_id?: string
          expires_at?: string
          id?: string
          jwt?: string
          tool?: string
        }
        Relationships: [
          {
            foreignKeyName: "tray_tokens_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "devices"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          activity_details: Json | null
          activity_type: string
          created_at: string
          id: string
          ip_address: unknown
          location_city: string | null
          location_country: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_details?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          ip_address?: unknown
          location_city?: string | null
          location_country?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_details?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown
          location_city?: string | null
          location_country?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_ai_provider_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          is_valid: boolean | null
          key_hash: string
          key_prefix: string
          key_suffix: string
          last_validated_at: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_valid?: boolean | null
          key_hash: string
          key_prefix: string
          key_suffix: string
          last_validated_at?: string | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_valid?: boolean | null
          key_hash?: string
          key_prefix?: string
          key_suffix?: string
          last_validated_at?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          billing_period_start: string | null
          bonus_credits: number | null
          created_at: string
          credits_limit: number
          credits_used: number
          daily_credits_limit: number | null
          daily_credits_used: number | null
          daily_reset_at: string | null
          id: string
          last_reset: string | null
          monthly_credits_limit: number | null
          monthly_credits_used: number | null
          monthly_reset_at: string | null
          reset_date: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          billing_period_start?: string | null
          bonus_credits?: number | null
          created_at?: string
          credits_limit?: number
          credits_used?: number
          daily_credits_limit?: number | null
          daily_credits_used?: number | null
          daily_reset_at?: string | null
          id?: string
          last_reset?: string | null
          monthly_credits_limit?: number | null
          monthly_credits_used?: number | null
          monthly_reset_at?: string | null
          reset_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          billing_period_start?: string | null
          bonus_credits?: number | null
          created_at?: string
          credits_limit?: number
          credits_used?: number
          daily_credits_limit?: number | null
          daily_credits_used?: number | null
          daily_reset_at?: string | null
          id?: string
          last_reset?: string | null
          monthly_credits_limit?: number | null
          monthly_credits_used?: number | null
          monthly_reset_at?: string | null
          reset_date?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          expires_at: string | null
          granted_at: string
          granted_by: string | null
          id: string
          metadata: Json | null
          permission_key: string
          permission_value: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          permission_key: string
          permission_value?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          granted_by?: string | null
          id?: string
          metadata?: Json | null
          permission_key?: string
          permission_value?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_presence: {
        Row: {
          current_page: string | null
          last_seen: string
          metadata: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          current_page?: string | null
          last_seen?: string
          metadata?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          current_page?: string | null
          last_seen?: string
          metadata?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_product_access: {
        Row: {
          access_level: string
          created_at: string
          expires_at: string | null
          granted_at: string
          id: string
          product: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          product: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          product?: string
          updated_at?: string
          user_id?: string
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
          ip_address: unknown
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
          ip_address?: unknown
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
          ip_address?: unknown
          session_end?: string | null
          session_start?: string
          total_messages?: number | null
          total_tokens?: number | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      vanguard_agent_analytics: {
        Row: {
          agent_id: string | null
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value: number
          recorded_at?: string | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_agent_analytics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_agent_commands: {
        Row: {
          agent_id: string
          command_type: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          payload: Json | null
          response: Json | null
          sent_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          agent_id: string
          command_type: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          response?: Json | null
          sent_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          command_type?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          payload?: Json | null
          response?: Json | null
          sent_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_agent_commands_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_agent_credentials: {
        Row: {
          created_at: string
          credential_name: string
          credential_type: string
          domain: string | null
          encrypted_password: string | null
          encrypted_private_key: string | null
          id: string
          is_active: boolean | null
          last_test_result: string | null
          last_used_at: string | null
          notes: string | null
          port: number | null
          snmp_auth_protocol: string | null
          snmp_community: string | null
          snmp_priv_protocol: string | null
          target_scope: Json | null
          updated_at: string
          use_ssl: boolean | null
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          credential_name: string
          credential_type: string
          domain?: string | null
          encrypted_password?: string | null
          encrypted_private_key?: string | null
          id?: string
          is_active?: boolean | null
          last_test_result?: string | null
          last_used_at?: string | null
          notes?: string | null
          port?: number | null
          snmp_auth_protocol?: string | null
          snmp_community?: string | null
          snmp_priv_protocol?: string | null
          target_scope?: Json | null
          updated_at?: string
          use_ssl?: boolean | null
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          credential_name?: string
          credential_type?: string
          domain?: string | null
          encrypted_password?: string | null
          encrypted_private_key?: string | null
          id?: string
          is_active?: boolean | null
          last_test_result?: string | null
          last_used_at?: string | null
          notes?: string | null
          port?: number | null
          snmp_auth_protocol?: string | null
          snmp_community?: string | null
          snmp_priv_protocol?: string | null
          target_scope?: Json | null
          updated_at?: string
          use_ssl?: boolean | null
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      vanguard_agent_metrics: {
        Row: {
          agent_id: string
          cpu_percent: number | null
          custom_metrics: Json | null
          disk_percent: number | null
          hailo_status: Json | null
          id: string
          memory_percent: number | null
          network_rx_bytes: number | null
          network_tx_bytes: number | null
          recorded_at: string
          temperature: number | null
        }
        Insert: {
          agent_id: string
          cpu_percent?: number | null
          custom_metrics?: Json | null
          disk_percent?: number | null
          hailo_status?: Json | null
          id?: string
          memory_percent?: number | null
          network_rx_bytes?: number | null
          network_tx_bytes?: number | null
          recorded_at?: string
          temperature?: number | null
        }
        Update: {
          agent_id?: string
          cpu_percent?: number | null
          custom_metrics?: Json | null
          disk_percent?: number | null
          hailo_status?: Json | null
          id?: string
          memory_percent?: number | null
          network_rx_bytes?: number | null
          network_tx_bytes?: number | null
          recorded_at?: string
          temperature?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_agent_metrics_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_agents: {
        Row: {
          agent_type: string | null
          agent_version: string | null
          api_endpoint: string | null
          client_id: string | null
          config: Json | null
          created_at: string
          device_id: string
          firewall_rules: Json | null
          firmware_version: string | null
          hailo_board_name: string | null
          hailo_status: Json | null
          id: string
          inference_stats: Json | null
          ip_address: unknown
          is_network_scanner: boolean | null
          last_heartbeat: string | null
          last_scan_at: string | null
          location: string | null
          ml_model_version: string | null
          name: string
          scan_interval_seconds: number | null
          scanner_subnets: string[] | null
          security_status: Json | null
          status: string
          threat_detections: Json | null
          traffic_stats: Json | null
          updated_at: string
          user_id: string
          vpn_ip: string | null
        }
        Insert: {
          agent_type?: string | null
          agent_version?: string | null
          api_endpoint?: string | null
          client_id?: string | null
          config?: Json | null
          created_at?: string
          device_id: string
          firewall_rules?: Json | null
          firmware_version?: string | null
          hailo_board_name?: string | null
          hailo_status?: Json | null
          id?: string
          inference_stats?: Json | null
          ip_address?: unknown
          is_network_scanner?: boolean | null
          last_heartbeat?: string | null
          last_scan_at?: string | null
          location?: string | null
          ml_model_version?: string | null
          name: string
          scan_interval_seconds?: number | null
          scanner_subnets?: string[] | null
          security_status?: Json | null
          status?: string
          threat_detections?: Json | null
          traffic_stats?: Json | null
          updated_at?: string
          user_id: string
          vpn_ip?: string | null
        }
        Update: {
          agent_type?: string | null
          agent_version?: string | null
          api_endpoint?: string | null
          client_id?: string | null
          config?: Json | null
          created_at?: string
          device_id?: string
          firewall_rules?: Json | null
          firmware_version?: string | null
          hailo_board_name?: string | null
          hailo_status?: Json | null
          id?: string
          inference_stats?: Json | null
          ip_address?: unknown
          is_network_scanner?: boolean | null
          last_heartbeat?: string | null
          last_scan_at?: string | null
          location?: string | null
          ml_model_version?: string | null
          name?: string
          scan_interval_seconds?: number | null
          scanner_subnets?: string[] | null
          security_status?: Json | null
          status?: string
          threat_detections?: Json | null
          traffic_stats?: Json | null
          updated_at?: string
          user_id?: string
          vpn_ip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_agents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_ai_feedback: {
        Row: {
          ai_solution_used: boolean | null
          confidence_score: number | null
          created_at: string | null
          feedback_notes: string | null
          feedback_rating: number | null
          id: string
          resolution_time_minutes: number | null
          tech_modified_solution: boolean | null
          ticket_id: string | null
          updated_at: string | null
          user_confirmed_resolved: boolean | null
        }
        Insert: {
          ai_solution_used?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          feedback_notes?: string | null
          feedback_rating?: number | null
          id?: string
          resolution_time_minutes?: number | null
          tech_modified_solution?: boolean | null
          ticket_id?: string | null
          updated_at?: string | null
          user_confirmed_resolved?: boolean | null
        }
        Update: {
          ai_solution_used?: boolean | null
          confidence_score?: number | null
          created_at?: string | null
          feedback_notes?: string | null
          feedback_rating?: number | null
          id?: string
          resolution_time_minutes?: number | null
          tech_modified_solution?: boolean | null
          ticket_id?: string | null
          updated_at?: string | null
          user_confirmed_resolved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_ai_feedback_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_alert_escalations: {
        Row: {
          channel_id: string | null
          created_at: string | null
          delay_minutes: number
          id: string
          level: number
          notify_users: string[] | null
          rule_id: string | null
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          delay_minutes?: number
          id?: string
          level?: number
          notify_users?: string[] | null
          rule_id?: string | null
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          delay_minutes?: number
          id?: string
          level?: number
          notify_users?: string[] | null
          rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_alert_escalations_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "vanguard_notification_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vanguard_alert_escalations_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "vanguard_alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_alert_history: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          channel_id: string | null
          error_message: string | null
          id: string
          message: string | null
          metadata: Json | null
          rule_id: string | null
          sent_at: string | null
          severity: string | null
          status: string | null
          title: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          channel_id?: string | null
          error_message?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          rule_id?: string | null
          sent_at?: string | null
          severity?: string | null
          status?: string | null
          title: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          channel_id?: string | null
          error_message?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          rule_id?: string | null
          sent_at?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_alert_history_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "vanguard_notification_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vanguard_alert_history_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "vanguard_alert_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_alert_rules: {
        Row: {
          channel_ids: string[] | null
          conditions: Json
          cooldown_minutes: number | null
          correlation_window_minutes: number | null
          created_at: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          name: string
          severity_filter: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_ids?: string[] | null
          conditions?: Json
          cooldown_minutes?: number | null
          correlation_window_minutes?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name: string
          severity_filter?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_ids?: string[] | null
          conditions?: Json
          cooldown_minutes?: number | null
          correlation_window_minutes?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          name?: string
          severity_filter?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_asset_lifecycle: {
        Row: {
          asset_type: string
          assigned_to: string | null
          created_at: string
          depreciation_method: string | null
          eol_date: string | null
          id: string
          last_maintenance_date: string | null
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          salvage_value: number | null
          serial_number: string | null
          status: string | null
          updated_at: string
          useful_life_years: number | null
          user_id: string
          vendor: string | null
          warranty_expiry: string | null
        }
        Insert: {
          asset_type: string
          assigned_to?: string | null
          created_at?: string
          depreciation_method?: string | null
          eol_date?: string | null
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          salvage_value?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          useful_life_years?: number | null
          user_id: string
          vendor?: string | null
          warranty_expiry?: string | null
        }
        Update: {
          asset_type?: string
          assigned_to?: string | null
          created_at?: string
          depreciation_method?: string | null
          eol_date?: string | null
          id?: string
          last_maintenance_date?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          salvage_value?: number | null
          serial_number?: string | null
          status?: string | null
          updated_at?: string
          useful_life_years?: number | null
          user_id?: string
          vendor?: string | null
          warranty_expiry?: string | null
        }
        Relationships: []
      }
      vanguard_automation_profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          notify_on_complete: boolean | null
          notify_on_failure: boolean | null
          run_on_connect: boolean | null
          schedule: Json
          tasks: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          notify_on_complete?: boolean | null
          notify_on_failure?: boolean | null
          run_on_connect?: boolean | null
          schedule?: Json
          tasks?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          notify_on_complete?: boolean | null
          notify_on_failure?: boolean | null
          run_on_connect?: boolean | null
          schedule?: Json
          tasks?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_backup_jobs: {
        Row: {
          client_id: string | null
          created_at: string
          device_name: string
          duration_minutes: number | null
          error_message: string | null
          id: string
          job_type: string | null
          last_run: string | null
          next_run: string | null
          retention_days: number | null
          size_gb: number | null
          status: string | null
          updated_at: string
          user_id: string
          vendor_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          device_name: string
          duration_minutes?: number | null
          error_message?: string | null
          id?: string
          job_type?: string | null
          last_run?: string | null
          next_run?: string | null
          retention_days?: number | null
          size_gb?: number | null
          status?: string | null
          updated_at?: string
          user_id: string
          vendor_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          device_name?: string
          duration_minutes?: number | null
          error_message?: string | null
          id?: string
          job_type?: string | null
          last_run?: string | null
          next_run?: string | null
          retention_days?: number | null
          size_gb?: number | null
          status?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_backup_jobs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vanguard_backup_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_backup_vendors: {
        Row: {
          api_endpoint: string | null
          api_key_configured: boolean | null
          config_data: Json | null
          created_at: string
          id: string
          is_connected: boolean | null
          jobs_monitored: number | null
          last_sync: string | null
          updated_at: string
          user_id: string
          vendor_name: string
          vendor_type: string
        }
        Insert: {
          api_endpoint?: string | null
          api_key_configured?: boolean | null
          config_data?: Json | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          jobs_monitored?: number | null
          last_sync?: string | null
          updated_at?: string
          user_id: string
          vendor_name: string
          vendor_type: string
        }
        Update: {
          api_endpoint?: string | null
          api_key_configured?: boolean | null
          config_data?: Json | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          jobs_monitored?: number | null
          last_sync?: string | null
          updated_at?: string
          user_id?: string
          vendor_name?: string
          vendor_type?: string
        }
        Relationships: []
      }
      vanguard_baseline_drifts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          agent_id: string
          baseline_id: string | null
          detected_at: string | null
          drift_category: string | null
          drift_details: Json
          drift_type: string
          id: string
          is_acknowledged: boolean | null
          severity: string | null
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          agent_id: string
          baseline_id?: string | null
          detected_at?: string | null
          drift_category?: string | null
          drift_details?: Json
          drift_type: string
          id?: string
          is_acknowledged?: boolean | null
          severity?: string | null
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          agent_id?: string
          baseline_id?: string | null
          detected_at?: string | null
          drift_category?: string | null
          drift_details?: Json
          drift_type?: string
          id?: string
          is_acknowledged?: boolean | null
          severity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_baseline_drifts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vanguard_baseline_drifts_baseline_id_fkey"
            columns: ["baseline_id"]
            isOneToOne: false
            referencedRelation: "vanguard_baselines"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_baselines: {
        Row: {
          agent_id: string
          baseline_data: Json
          baseline_name: string
          baseline_type: string
          checksum: string | null
          created_at: string | null
          id: string
          is_current: boolean | null
          user_id: string
        }
        Insert: {
          agent_id: string
          baseline_data?: Json
          baseline_name: string
          baseline_type: string
          checksum?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          user_id: string
        }
        Update: {
          agent_id?: string
          baseline_data?: Json
          baseline_name?: string
          baseline_type?: string
          checksum?: string | null
          created_at?: string | null
          id?: string
          is_current?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_baselines_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_client_costs: {
        Row: {
          client_id: string | null
          created_at: string
          device_cost: number | null
          id: string
          infrastructure_cost: number | null
          licensing_cost: number | null
          margin_percent: number | null
          period_end: string
          period_start: string
          revenue: number | null
          support_cost: number | null
          support_hours: number | null
          total_cost: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          device_cost?: number | null
          id?: string
          infrastructure_cost?: number | null
          licensing_cost?: number | null
          margin_percent?: number | null
          period_end: string
          period_start: string
          revenue?: number | null
          support_cost?: number | null
          support_hours?: number | null
          total_cost?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          device_cost?: number | null
          id?: string
          infrastructure_cost?: number | null
          licensing_cost?: number | null
          margin_percent?: number | null
          period_end?: string
          period_start?: string
          revenue?: number | null
          support_cost?: number | null
          support_hours?: number | null
          total_cost?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_client_portal_billing: {
        Row: {
          api_calls_this_month: number | null
          client_id: string | null
          client_name: string
          created_at: string
          current_balance: number | null
          devices_managed: number | null
          id: string
          storage_used_gb: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          api_calls_this_month?: number | null
          client_id?: string | null
          client_name: string
          created_at?: string
          current_balance?: number | null
          devices_managed?: number | null
          id?: string
          storage_used_gb?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          api_calls_this_month?: number | null
          client_id?: string | null
          client_name?: string
          created_at?: string
          current_balance?: number | null
          devices_managed?: number | null
          id?: string
          storage_used_gb?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_client_usage_history: {
        Row: {
          api_calls: number | null
          client_id: string | null
          created_at: string
          devices: number | null
          id: string
          month: string
          storage_gb: number | null
          user_id: string
        }
        Insert: {
          api_calls?: number | null
          client_id?: string | null
          created_at?: string
          devices?: number | null
          id?: string
          month: string
          storage_gb?: number | null
          user_id: string
        }
        Update: {
          api_calls?: number | null
          client_id?: string | null
          created_at?: string
          devices?: number | null
          id?: string
          month?: string
          storage_gb?: number | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_client_usage_snapshots: {
        Row: {
          api_calls: number | null
          billable_hours: number | null
          client_id: string | null
          created_at: string
          device_count: number | null
          features_used: Json | null
          id: string
          resolved_tickets: number | null
          server_count: number | null
          snapshot_date: string
          storage_used_gb: number | null
          ticket_count: number | null
          user_count: number | null
          user_id: string
          workstation_count: number | null
        }
        Insert: {
          api_calls?: number | null
          billable_hours?: number | null
          client_id?: string | null
          created_at?: string
          device_count?: number | null
          features_used?: Json | null
          id?: string
          resolved_tickets?: number | null
          server_count?: number | null
          snapshot_date?: string
          storage_used_gb?: number | null
          ticket_count?: number | null
          user_count?: number | null
          user_id: string
          workstation_count?: number | null
        }
        Update: {
          api_calls?: number | null
          billable_hours?: number | null
          client_id?: string | null
          created_at?: string
          device_count?: number | null
          features_used?: Json | null
          id?: string
          resolved_tickets?: number | null
          server_count?: number | null
          snapshot_date?: string
          storage_used_gb?: number | null
          ticket_count?: number | null
          user_count?: number | null
          user_id?: string
          workstation_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_client_usage_snapshots_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_compliance_history: {
        Row: {
          agent_id: string | null
          antivirus_enabled: boolean | null
          antivirus_updated: boolean | null
          bitlocker_enabled: boolean | null
          cis_score: number | null
          compliance_details: Json | null
          created_at: string
          critical_updates_pending: number | null
          firewall_enabled: boolean | null
          gpo_compliant: boolean | null
          id: string
          overall_score: number | null
          pending_updates: number | null
          snapshot_date: string
          user_id: string
          windows_update_score: number | null
        }
        Insert: {
          agent_id?: string | null
          antivirus_enabled?: boolean | null
          antivirus_updated?: boolean | null
          bitlocker_enabled?: boolean | null
          cis_score?: number | null
          compliance_details?: Json | null
          created_at?: string
          critical_updates_pending?: number | null
          firewall_enabled?: boolean | null
          gpo_compliant?: boolean | null
          id?: string
          overall_score?: number | null
          pending_updates?: number | null
          snapshot_date?: string
          user_id: string
          windows_update_score?: number | null
        }
        Update: {
          agent_id?: string | null
          antivirus_enabled?: boolean | null
          antivirus_updated?: boolean | null
          bitlocker_enabled?: boolean | null
          cis_score?: number | null
          compliance_details?: Json | null
          created_at?: string
          critical_updates_pending?: number | null
          firewall_enabled?: boolean | null
          gpo_compliant?: boolean | null
          id?: string
          overall_score?: number | null
          pending_updates?: number | null
          snapshot_date?: string
          user_id?: string
          windows_update_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_compliance_history_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_config_policies: {
        Row: {
          assigned_devices: number | null
          assigned_groups: string[] | null
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_devices?: number | null
          assigned_groups?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_devices?: number | null
          assigned_groups?: string[] | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_csat_responses: {
        Row: {
          client_id: string | null
          contact_email: string | null
          contact_name: string | null
          created_at: string
          feedback_text: string | null
          follow_up_notes: string | null
          follow_up_required: boolean | null
          id: string
          nps_score: number | null
          overall_rating: number | null
          resolution_rating: number | null
          responded_at: string | null
          response_time_rating: number | null
          survey_sent_at: string | null
          technician_id: string | null
          technician_rating: number | null
          ticket_id: string | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          client_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          feedback_text?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          nps_score?: number | null
          overall_rating?: number | null
          resolution_rating?: number | null
          responded_at?: string | null
          response_time_rating?: number | null
          survey_sent_at?: string | null
          technician_id?: string | null
          technician_rating?: number | null
          ticket_id?: string | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          client_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          created_at?: string
          feedback_text?: string | null
          follow_up_notes?: string | null
          follow_up_required?: boolean | null
          id?: string
          nps_score?: number | null
          overall_rating?: number | null
          resolution_rating?: number | null
          responded_at?: string | null
          response_time_rating?: number | null
          survey_sent_at?: string | null
          technician_id?: string | null
          technician_rating?: number | null
          ticket_id?: string | null
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_csat_responses_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_detected_patterns: {
        Row: {
          affected_clients: number | null
          avg_resolution_time_minutes: number | null
          category: string | null
          created_at: string | null
          first_seen_at: string | null
          id: string
          last_seen_at: string | null
          occurrences: number | null
          pattern_name: string
          root_cause: string | null
          severity: string | null
          suggested_kb: boolean | null
          trend: string | null
          trend_percent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          affected_clients?: number | null
          avg_resolution_time_minutes?: number | null
          category?: string | null
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          occurrences?: number | null
          pattern_name: string
          root_cause?: string | null
          severity?: string | null
          suggested_kb?: boolean | null
          trend?: string | null
          trend_percent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          affected_clients?: number | null
          avg_resolution_time_minutes?: number | null
          category?: string | null
          created_at?: string | null
          first_seen_at?: string | null
          id?: string
          last_seen_at?: string | null
          occurrences?: number | null
          pattern_name?: string
          root_cause?: string | null
          severity?: string | null
          suggested_kb?: boolean | null
          trend?: string | null
          trend_percent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_device_patches: {
        Row: {
          category: string | null
          created_at: string
          cve_ids: string[] | null
          description: string | null
          device_id: string | null
          id: string
          installed_at: string | null
          kb_number: string
          release_date: string | null
          severity: string | null
          size_mb: number | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          cve_ids?: string[] | null
          description?: string | null
          device_id?: string | null
          id?: string
          installed_at?: string | null
          kb_number: string
          release_date?: string | null
          severity?: string | null
          size_mb?: number | null
          status?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          cve_ids?: string[] | null
          description?: string | null
          device_id?: string | null
          id?: string
          installed_at?: string | null
          kb_number?: string
          release_date?: string | null
          severity?: string | null
          size_mb?: number | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_device_patches_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "rmm_devices"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_discovered_devices: {
        Row: {
          created_at: string | null
          device_type: string | null
          first_seen_at: string | null
          hostname: string | null
          id: string
          ip_address: unknown
          is_managed: boolean | null
          last_seen_at: string | null
          linked_agent_id: string | null
          mac_address: string | null
          manufacturer: string | null
          metadata: Json | null
          open_ports: number[] | null
          os_info: string | null
          risk_level: string | null
          scanner_agent_id: string | null
          services: Json | null
          updated_at: string | null
          user_id: string
          vulnerabilities: Json | null
        }
        Insert: {
          created_at?: string | null
          device_type?: string | null
          first_seen_at?: string | null
          hostname?: string | null
          id?: string
          ip_address: unknown
          is_managed?: boolean | null
          last_seen_at?: string | null
          linked_agent_id?: string | null
          mac_address?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          open_ports?: number[] | null
          os_info?: string | null
          risk_level?: string | null
          scanner_agent_id?: string | null
          services?: Json | null
          updated_at?: string | null
          user_id: string
          vulnerabilities?: Json | null
        }
        Update: {
          created_at?: string | null
          device_type?: string | null
          first_seen_at?: string | null
          hostname?: string | null
          id?: string
          ip_address?: unknown
          is_managed?: boolean | null
          last_seen_at?: string | null
          linked_agent_id?: string | null
          mac_address?: string | null
          manufacturer?: string | null
          metadata?: Json | null
          open_ports?: number[] | null
          os_info?: string | null
          risk_level?: string | null
          scanner_agent_id?: string | null
          services?: Json | null
          updated_at?: string | null
          user_id?: string
          vulnerabilities?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_discovered_devices_linked_agent_id_fkey"
            columns: ["linked_agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vanguard_discovered_devices_scanner_agent_id_fkey"
            columns: ["scanner_agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_email_automation_rules: {
        Row: {
          action: string
          condition: string
          created_at: string
          enabled: boolean
          id: string
          name: string
          triggered_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          action: string
          condition: string
          created_at?: string
          enabled?: boolean
          id?: string
          name: string
          triggered_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          action?: string
          condition?: string
          created_at?: string
          enabled?: boolean
          id?: string
          name?: string
          triggered_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_email_configs: {
        Row: {
          auto_create_tickets: boolean | null
          auto_reply_enabled: boolean | null
          auto_reply_template: string | null
          client_id: string | null
          created_at: string
          default_category: string | null
          default_priority: string | null
          display_name: string | null
          email_signature: string | null
          forward_to_technician: boolean | null
          id: string
          incoming_email: string
          is_active: boolean | null
          last_sync_at: string | null
          sync_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_create_tickets?: boolean | null
          auto_reply_enabled?: boolean | null
          auto_reply_template?: string | null
          client_id?: string | null
          created_at?: string
          default_category?: string | null
          default_priority?: string | null
          display_name?: string | null
          email_signature?: string | null
          forward_to_technician?: boolean | null
          id?: string
          incoming_email: string
          is_active?: boolean | null
          last_sync_at?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_create_tickets?: boolean | null
          auto_reply_enabled?: boolean | null
          auto_reply_template?: string | null
          client_id?: string | null
          created_at?: string
          default_category?: string | null
          default_priority?: string | null
          display_name?: string | null
          email_signature?: string | null
          forward_to_technician?: boolean | null
          id?: string
          incoming_email?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          sync_status?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_email_configs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_email_templates: {
        Row: {
          body: string
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          subject: string
          template_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          subject: string
          template_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string
          template_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_email_threads: {
        Row: {
          ai_category: string | null
          ai_confidence: number | null
          ai_sentiment: string | null
          ai_suggested_response: string | null
          company: string | null
          created_at: string
          from_email: string
          from_name: string
          id: string
          preview: string
          received_at: string
          status: string
          subject: string
          thread_count: number | null
          ticket_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_category?: string | null
          ai_confidence?: number | null
          ai_sentiment?: string | null
          ai_suggested_response?: string | null
          company?: string | null
          created_at?: string
          from_email: string
          from_name: string
          id?: string
          preview: string
          received_at?: string
          status?: string
          subject: string
          thread_count?: number | null
          ticket_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_category?: string | null
          ai_confidence?: number | null
          ai_sentiment?: string | null
          ai_suggested_response?: string | null
          company?: string | null
          created_at?: string
          from_email?: string
          from_name?: string
          id?: string
          preview?: string
          received_at?: string
          status?: string
          subject?: string
          thread_count?: number | null
          ticket_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_endpoint_compliance: {
        Row: {
          agent_id: string | null
          av_status: string | null
          cis_score: number | null
          compliance_checks: Json | null
          created_at: string
          encryption_status: string | null
          firewall_status: string | null
          hostname: string
          id: string
          last_scan_at: string | null
          os: string | null
          overall_score: number | null
          patch_score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          av_status?: string | null
          cis_score?: number | null
          compliance_checks?: Json | null
          created_at?: string
          encryption_status?: string | null
          firewall_status?: string | null
          hostname: string
          id?: string
          last_scan_at?: string | null
          os?: string | null
          overall_score?: number | null
          patch_score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_id?: string | null
          av_status?: string | null
          cis_score?: number | null
          compliance_checks?: Json | null
          created_at?: string
          encryption_status?: string | null
          firewall_status?: string | null
          hostname?: string
          id?: string
          last_scan_at?: string | null
          os?: string | null
          overall_score?: number | null
          patch_score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_endpoint_compliance_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_escalation_agents: {
        Row: {
          active_escalations: number | null
          avatar: string | null
          created_at: string
          id: string
          name: string
          skills: string[] | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_escalations?: number | null
          avatar?: string | null
          created_at?: string
          id?: string
          name: string
          skills?: string[] | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_escalations?: number | null
          avatar?: string | null
          created_at?: string
          id?: string
          name?: string
          skills?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_escalation_rules: {
        Row: {
          created_at: string
          escalation_path: string[] | null
          id: string
          is_active: boolean | null
          name: string
          priority: string
          resolution_timeout_minutes: number
          response_timeout_minutes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          escalation_path?: string[] | null
          id?: string
          is_active?: boolean | null
          name: string
          priority: string
          resolution_timeout_minutes: number
          response_timeout_minutes: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          escalation_path?: string[] | null
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: string
          resolution_timeout_minutes?: number
          response_timeout_minutes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_escalation_tickets: {
        Row: {
          ai_confidence: number | null
          assigned_agent: string | null
          company: string | null
          conversation_summary: string
          created_at: string
          customer_email: string
          customer_name: string
          id: string
          priority: string
          scheduled_time: string | null
          sentiment: string | null
          status: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence?: number | null
          assigned_agent?: string | null
          company?: string | null
          conversation_summary: string
          created_at?: string
          customer_email: string
          customer_name: string
          id?: string
          priority?: string
          scheduled_time?: string | null
          sentiment?: string | null
          status?: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence?: number | null
          assigned_agent?: string | null
          company?: string | null
          conversation_summary?: string
          created_at?: string
          customer_email?: string
          customer_name?: string
          id?: string
          priority?: string
          scheduled_time?: string | null
          sentiment?: string | null
          status?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_fleet_scripts: {
        Row: {
          author: string | null
          category: string | null
          content: string
          created_at: string
          description: string | null
          execution_count: number | null
          id: string
          is_builtin: boolean | null
          is_favorite: boolean | null
          last_executed: string | null
          last_result: string | null
          name: string
          script_type: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          content: string
          created_at?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_builtin?: boolean | null
          is_favorite?: boolean | null
          last_executed?: string | null
          last_result?: string | null
          name: string
          script_type?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          author?: string | null
          category?: string | null
          content?: string
          created_at?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_builtin?: boolean | null
          is_favorite?: boolean | null
          last_executed?: string | null
          last_result?: string | null
          name?: string
          script_type?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_honeypot_events: {
        Row: {
          agent_id: string
          attacker_ip: string | null
          attacker_port: number | null
          commands_executed: Json | null
          created_at: string | null
          geo_location: Json | null
          honeypot_port: number | null
          honeypot_type: string
          id: string
          interaction_data: Json | null
          interaction_type: string | null
          password_attempted: string | null
          severity: string | null
          threat_intel_match: boolean | null
          user_id: string
          username_attempted: string | null
        }
        Insert: {
          agent_id: string
          attacker_ip?: string | null
          attacker_port?: number | null
          commands_executed?: Json | null
          created_at?: string | null
          geo_location?: Json | null
          honeypot_port?: number | null
          honeypot_type: string
          id?: string
          interaction_data?: Json | null
          interaction_type?: string | null
          password_attempted?: string | null
          severity?: string | null
          threat_intel_match?: boolean | null
          user_id: string
          username_attempted?: string | null
        }
        Update: {
          agent_id?: string
          attacker_ip?: string | null
          attacker_port?: number | null
          commands_executed?: Json | null
          created_at?: string | null
          geo_location?: Json | null
          honeypot_port?: number | null
          honeypot_type?: string
          id?: string
          interaction_data?: Json | null
          interaction_type?: string | null
          password_attempted?: string | null
          severity?: string | null
          threat_intel_match?: boolean | null
          user_id?: string
          username_attempted?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_honeypot_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_inbound_emails: {
        Row: {
          body: string | null
          config_id: string | null
          created_at: string
          from_address: string
          has_attachments: boolean | null
          id: string
          raw_headers: Json | null
          received_at: string | null
          status: string | null
          subject: string
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          config_id?: string | null
          created_at?: string
          from_address: string
          has_attachments?: boolean | null
          id?: string
          raw_headers?: Json | null
          received_at?: string | null
          status?: string | null
          subject: string
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          config_id?: string | null
          created_at?: string
          from_address?: string
          has_attachments?: boolean | null
          id?: string
          raw_headers?: Json | null
          received_at?: string | null
          status?: string | null
          subject?: string
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_inbound_emails_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "vanguard_email_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_integration_logs: {
        Row: {
          agent_id: string | null
          error_message: string | null
          event_data: Json | null
          event_type: string | null
          id: string
          integration_target: string | null
          integration_type: string
          response_data: Json | null
          response_status: number | null
          sent_at: string | null
          success: boolean | null
          user_id: string
        }
        Insert: {
          agent_id?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type?: string | null
          id?: string
          integration_target?: string | null
          integration_type: string
          response_data?: Json | null
          response_status?: number | null
          sent_at?: string | null
          success?: boolean | null
          user_id: string
        }
        Update: {
          agent_id?: string | null
          error_message?: string | null
          event_data?: Json | null
          event_type?: string | null
          id?: string
          integration_target?: string | null
          integration_type?: string
          response_data?: Json | null
          response_status?: number | null
          sent_at?: string | null
          success?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_integration_logs_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_kb_drafts: {
        Row: {
          category: string
          content: string
          created_at: string
          generated_from: string | null
          id: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          generated_from?: string | null
          id?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          generated_from?: string | null
          id?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_kb_patterns: {
        Row: {
          affected_category: string
          auto_kb_generated: boolean | null
          created_at: string
          description: string
          id: string
          name: string
          recommended_action: string | null
          severity: string
          suggested_kb_title: string | null
          ticket_count: number | null
          trend: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affected_category: string
          auto_kb_generated?: boolean | null
          created_at?: string
          description: string
          id?: string
          name: string
          recommended_action?: string | null
          severity?: string
          suggested_kb_title?: string | null
          ticket_count?: number | null
          trend?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affected_category?: string
          auto_kb_generated?: boolean | null
          created_at?: string
          description?: string
          id?: string
          name?: string
          recommended_action?: string | null
          severity?: string
          suggested_kb_title?: string | null
          ticket_count?: number | null
          trend?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_licenses: {
        Row: {
          assigned_to: string[] | null
          auto_renew: boolean | null
          category: string | null
          cost: number | null
          created_at: string
          expiration_date: string | null
          id: string
          license_key: string | null
          license_type: string
          notes: string | null
          purchase_date: string | null
          renewal_cost: number | null
          software_name: string
          total_seats: number | null
          updated_at: string
          used_seats: number | null
          user_id: string
          vendor: string | null
        }
        Insert: {
          assigned_to?: string[] | null
          auto_renew?: boolean | null
          category?: string | null
          cost?: number | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          license_key?: string | null
          license_type?: string
          notes?: string | null
          purchase_date?: string | null
          renewal_cost?: number | null
          software_name: string
          total_seats?: number | null
          updated_at?: string
          used_seats?: number | null
          user_id: string
          vendor?: string | null
        }
        Update: {
          assigned_to?: string[] | null
          auto_renew?: boolean | null
          category?: string | null
          cost?: number | null
          created_at?: string
          expiration_date?: string | null
          id?: string
          license_key?: string | null
          license_type?: string
          notes?: string | null
          purchase_date?: string | null
          renewal_cost?: number | null
          software_name?: string
          total_seats?: number | null
          updated_at?: string
          used_seats?: number | null
          user_id?: string
          vendor?: string | null
        }
        Relationships: []
      }
      vanguard_m365_mfa_status: {
        Row: {
          admin_roles: string[] | null
          created_at: string
          days_since_last_signin: number | null
          default_mfa_method: string | null
          display_name: string | null
          id: string
          is_admin: boolean | null
          last_sign_in_at: string | null
          m365_user_id: string
          mfa_enabled: boolean | null
          mfa_methods: string[] | null
          snapshot_date: string | null
          tenant_id: string | null
          user_id: string
          user_principal_name: string
        }
        Insert: {
          admin_roles?: string[] | null
          created_at?: string
          days_since_last_signin?: number | null
          default_mfa_method?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_sign_in_at?: string | null
          m365_user_id: string
          mfa_enabled?: boolean | null
          mfa_methods?: string[] | null
          snapshot_date?: string | null
          tenant_id?: string | null
          user_id: string
          user_principal_name: string
        }
        Update: {
          admin_roles?: string[] | null
          created_at?: string
          days_since_last_signin?: number | null
          default_mfa_method?: string | null
          display_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_sign_in_at?: string | null
          m365_user_id?: string
          mfa_enabled?: boolean | null
          mfa_methods?: string[] | null
          snapshot_date?: string | null
          tenant_id?: string | null
          user_id?: string
          user_principal_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_m365_mfa_status_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "vanguard_m365_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_m365_security_events: {
        Row: {
          affected_user_email: string | null
          affected_user_id: string | null
          affected_user_name: string | null
          ai_analysis_id: string | null
          client_id: string | null
          created_at: string
          description: string | null
          detected_at: string | null
          device_info: Json | null
          event_details: Json | null
          event_id: string | null
          event_timestamp: string
          event_type: string
          id: string
          ip_address: string | null
          is_processed: boolean | null
          location_city: string | null
          location_country: string | null
          processed_at: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          risk_level: string | null
          risk_state: string | null
          severity: string | null
          status: string | null
          tenant_id: string | null
          ticket_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          affected_user_email?: string | null
          affected_user_id?: string | null
          affected_user_name?: string | null
          ai_analysis_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          detected_at?: string | null
          device_info?: Json | null
          event_details?: Json | null
          event_id?: string | null
          event_timestamp: string
          event_type: string
          id?: string
          ip_address?: string | null
          is_processed?: boolean | null
          location_city?: string | null
          location_country?: string | null
          processed_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_level?: string | null
          risk_state?: string | null
          severity?: string | null
          status?: string | null
          tenant_id?: string | null
          ticket_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          affected_user_email?: string | null
          affected_user_id?: string | null
          affected_user_name?: string | null
          ai_analysis_id?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          detected_at?: string | null
          device_info?: Json | null
          event_details?: Json | null
          event_id?: string | null
          event_timestamp?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          is_processed?: boolean | null
          location_city?: string | null
          location_country?: string | null
          processed_at?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          risk_level?: string | null
          risk_state?: string | null
          severity?: string | null
          status?: string | null
          tenant_id?: string | null
          ticket_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_m365_security_events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vanguard_m365_security_events_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "vanguard_m365_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_m365_tenants: {
        Row: {
          access_token: string | null
          client_id: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_sync_at: string | null
          monitor_conditional_access: boolean | null
          monitor_mailbox_rules: boolean | null
          monitor_mfa_status: boolean | null
          monitor_risky_signins: boolean | null
          permissions_granted: string[] | null
          refresh_token: string | null
          sync_error: string | null
          sync_status: string | null
          tenant_domain: string | null
          tenant_id: string
          tenant_name: string
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          monitor_conditional_access?: boolean | null
          monitor_mailbox_rules?: boolean | null
          monitor_mfa_status?: boolean | null
          monitor_risky_signins?: boolean | null
          permissions_granted?: string[] | null
          refresh_token?: string | null
          sync_error?: string | null
          sync_status?: string | null
          tenant_domain?: string | null
          tenant_id: string
          tenant_name: string
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_sync_at?: string | null
          monitor_conditional_access?: boolean | null
          monitor_mailbox_rules?: boolean | null
          monitor_mfa_status?: boolean | null
          monitor_risky_signins?: boolean | null
          permissions_granted?: string[] | null
          refresh_token?: string | null
          sync_error?: string | null
          sync_status?: string | null
          tenant_domain?: string | null
          tenant_id?: string
          tenant_name?: string
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_m365_tenants_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_marketplace_connections: {
        Row: {
          category: string
          configuration: Json | null
          connected_at: string | null
          created_at: string | null
          id: string
          integration_id: string
          integration_name: string
          last_sync_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: string
          configuration?: Json | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          integration_id: string
          integration_name: string
          last_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: string
          configuration?: Json | null
          connected_at?: string | null
          created_at?: string | null
          id?: string
          integration_id?: string
          integration_name?: string
          last_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_mesh_agents: {
        Row: {
          agent_id: string
          created_at: string | null
          discovered_agents: Json | null
          failover_priority: number | null
          id: string
          last_mesh_sync: string | null
          mesh_role: string | null
          mesh_status: string | null
          updated_at: string | null
        }
        Insert: {
          agent_id: string
          created_at?: string | null
          discovered_agents?: Json | null
          failover_priority?: number | null
          id?: string
          last_mesh_sync?: string | null
          mesh_role?: string | null
          mesh_status?: string | null
          updated_at?: string | null
        }
        Update: {
          agent_id?: string
          created_at?: string | null
          discovered_agents?: Json | null
          failover_priority?: number | null
          id?: string
          last_mesh_sync?: string | null
          mesh_role?: string | null
          mesh_status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_mesh_agents_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_mesh_intel: {
        Row: {
          confidence_score: number | null
          context: Json | null
          created_at: string | null
          first_seen: string | null
          id: string
          indicator_type: string | null
          indicator_value: string
          intel_type: string
          is_active: boolean | null
          last_seen: string | null
          severity: string | null
          shared_with_agents: Json | null
          source_agent_id: string | null
          user_id: string
        }
        Insert: {
          confidence_score?: number | null
          context?: Json | null
          created_at?: string | null
          first_seen?: string | null
          id?: string
          indicator_type?: string | null
          indicator_value: string
          intel_type: string
          is_active?: boolean | null
          last_seen?: string | null
          severity?: string | null
          shared_with_agents?: Json | null
          source_agent_id?: string | null
          user_id: string
        }
        Update: {
          confidence_score?: number | null
          context?: Json | null
          created_at?: string | null
          first_seen?: string | null
          id?: string
          indicator_type?: string | null
          indicator_value?: string
          intel_type?: string
          is_active?: boolean | null
          last_seen?: string | null
          severity?: string | null
          shared_with_agents?: Json | null
          source_agent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_mesh_intel_source_agent_id_fkey"
            columns: ["source_agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_notification_channels: {
        Row: {
          channel_type: string
          config: Json
          created_at: string | null
          id: string
          is_enabled: boolean | null
          is_verified: boolean | null
          last_used_at: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_type: string
          config?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_type?: string
          config?: Json
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_notification_triggers: {
        Row: {
          created_at: string | null
          event_label: string
          event_type: string
          id: string
          is_enabled: boolean | null
          notification_channels: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          event_label: string
          event_type: string
          id?: string
          is_enabled?: boolean | null
          notification_channels?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          event_label?: string
          event_type?: string
          id?: string
          is_enabled?: boolean | null
          notification_channels?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_on_call_schedules: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          rotations: Json
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          rotations?: Json
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          rotations?: Json
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_patch_policies: {
        Row: {
          auto_approve_critical: boolean | null
          auto_approve_important: boolean | null
          auto_approve_low: boolean | null
          auto_approve_moderate: boolean | null
          created_at: string
          deployment_window_end: string | null
          deployment_window_start: string | null
          exclude_drivers: boolean | null
          id: string
          max_concurrent_installs: number | null
          name: string
          reboot_policy: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_approve_critical?: boolean | null
          auto_approve_important?: boolean | null
          auto_approve_low?: boolean | null
          auto_approve_moderate?: boolean | null
          created_at?: string
          deployment_window_end?: string | null
          deployment_window_start?: string | null
          exclude_drivers?: boolean | null
          id?: string
          max_concurrent_installs?: number | null
          name: string
          reboot_policy?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_approve_critical?: boolean | null
          auto_approve_important?: boolean | null
          auto_approve_low?: boolean | null
          auto_approve_moderate?: boolean | null
          created_at?: string
          deployment_window_end?: string | null
          deployment_window_start?: string | null
          exclude_drivers?: boolean | null
          id?: string
          max_concurrent_installs?: number | null
          name?: string
          reboot_policy?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_patches: {
        Row: {
          affected_devices: number | null
          category: string
          created_at: string
          cve_ids: string[] | null
          description: string | null
          id: string
          installed_devices: number | null
          kb_number: string
          release_date: string | null
          severity: string
          size_mb: number | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affected_devices?: number | null
          category: string
          created_at?: string
          cve_ids?: string[] | null
          description?: string | null
          id?: string
          installed_devices?: number | null
          kb_number: string
          release_date?: string | null
          severity: string
          size_mb?: number | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affected_devices?: number | null
          category?: string
          created_at?: string
          cve_ids?: string[] | null
          description?: string | null
          id?: string
          installed_devices?: number | null
          kb_number?: string
          release_date?: string | null
          severity?: string
          size_mb?: number | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_pattern_trends: {
        Row: {
          created_at: string | null
          id: string
          occurrence_count: number | null
          pattern_id: string | null
          trend_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          occurrence_count?: number | null
          pattern_id?: string | null
          trend_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          occurrence_count?: number | null
          pattern_id?: string | null
          trend_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_pattern_trends_pattern_id_fkey"
            columns: ["pattern_id"]
            isOneToOne: false
            referencedRelation: "vanguard_detected_patterns"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_portal_downloads: {
        Row: {
          client_id: string | null
          download_type: string
          downloaded_at: string
          id: string
          ip_address: unknown
          platform: string
          portal_settings_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          client_id?: string | null
          download_type?: string
          downloaded_at?: string
          id?: string
          ip_address?: unknown
          platform?: string
          portal_settings_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          client_id?: string | null
          download_type?: string
          downloaded_at?: string
          id?: string
          ip_address?: unknown
          platform?: string
          portal_settings_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_portal_downloads_portal_settings_id_fkey"
            columns: ["portal_settings_id"]
            isOneToOne: false
            referencedRelation: "vanguard_portal_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_portal_settings: {
        Row: {
          client_id: string | null
          created_at: string
          custom_css: string | null
          custom_icon_url: string | null
          enable_health_status: boolean | null
          enable_knowledge_base: boolean | null
          enable_safepass: boolean | null
          enable_safescan: boolean | null
          enable_safetrack: boolean | null
          enable_safeweb: boolean | null
          enable_tickets: boolean | null
          id: string
          portal_app_enabled: boolean | null
          portal_key: string | null
          portal_key_created_at: string | null
          portal_logo_url: string | null
          portal_name: string
          primary_color: string | null
          safepass_subscription_required: boolean | null
          safescan_subscription_required: boolean | null
          safetrack_subscription_required: boolean | null
          safeweb_subscription_required: boolean | null
          support_email: string | null
          support_phone: string | null
          updated_at: string
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          custom_css?: string | null
          custom_icon_url?: string | null
          enable_health_status?: boolean | null
          enable_knowledge_base?: boolean | null
          enable_safepass?: boolean | null
          enable_safescan?: boolean | null
          enable_safetrack?: boolean | null
          enable_safeweb?: boolean | null
          enable_tickets?: boolean | null
          id?: string
          portal_app_enabled?: boolean | null
          portal_key?: string | null
          portal_key_created_at?: string | null
          portal_logo_url?: string | null
          portal_name?: string
          primary_color?: string | null
          safepass_subscription_required?: boolean | null
          safescan_subscription_required?: boolean | null
          safetrack_subscription_required?: boolean | null
          safeweb_subscription_required?: boolean | null
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          custom_css?: string | null
          custom_icon_url?: string | null
          enable_health_status?: boolean | null
          enable_knowledge_base?: boolean | null
          enable_safepass?: boolean | null
          enable_safescan?: boolean | null
          enable_safetrack?: boolean | null
          enable_safeweb?: boolean | null
          enable_tickets?: boolean | null
          id?: string
          portal_app_enabled?: boolean | null
          portal_key?: string | null
          portal_key_created_at?: string | null
          portal_logo_url?: string | null
          portal_name?: string
          primary_color?: string | null
          safepass_subscription_required?: boolean | null
          safescan_subscription_required?: boolean | null
          safetrack_subscription_required?: boolean | null
          safeweb_subscription_required?: boolean | null
          support_email?: string | null
          support_phone?: string | null
          updated_at?: string
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_portal_settings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_portal_ticket_comments: {
        Row: {
          author_name: string | null
          author_type: string
          content: string
          created_at: string
          id: string
          is_internal: boolean | null
          ticket_id: string
        }
        Insert: {
          author_name?: string | null
          author_type?: string
          content: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id: string
        }
        Update: {
          author_name?: string | null
          author_type?: string
          content?: string
          created_at?: string
          id?: string
          is_internal?: boolean | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_portal_ticket_comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "vanguard_portal_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_portal_tickets: {
        Row: {
          assigned_to: string | null
          attachments: Json | null
          category: string | null
          created_at: string
          description: string | null
          device_id: string | null
          id: string
          internal_notes: string | null
          portal_key: string | null
          portal_settings_id: string
          portal_token_id: string | null
          priority: string | null
          resolved_at: string | null
          status: string | null
          subject: string
          submitted_via: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string | null
          created_at?: string
          description?: string | null
          device_id?: string | null
          id?: string
          internal_notes?: string | null
          portal_key?: string | null
          portal_settings_id: string
          portal_token_id?: string | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject: string
          submitted_via?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          attachments?: Json | null
          category?: string | null
          created_at?: string
          description?: string | null
          device_id?: string | null
          id?: string
          internal_notes?: string | null
          portal_key?: string | null
          portal_settings_id?: string
          portal_token_id?: string | null
          priority?: string | null
          resolved_at?: string | null
          status?: string | null
          subject?: string
          submitted_via?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_portal_tickets_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vanguard_portal_tickets_portal_settings_id_fkey"
            columns: ["portal_settings_id"]
            isOneToOne: false
            referencedRelation: "vanguard_portal_settings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vanguard_portal_tickets_portal_token_id_fkey"
            columns: ["portal_token_id"]
            isOneToOne: false
            referencedRelation: "vanguard_portal_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_portal_tokens: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string | null
          device_id: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          portal_settings_id: string
          token_hash: string
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name?: string | null
          device_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          portal_settings_id: string
          token_hash: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string | null
          device_id?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          portal_settings_id?: string
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_portal_tokens_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vanguard_portal_tokens_portal_settings_id_fkey"
            columns: ["portal_settings_id"]
            isOneToOne: false
            referencedRelation: "vanguard_portal_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_rate_cards: {
        Row: {
          after_hours_multiplier: number | null
          card_name: string
          client_id: string | null
          created_at: string
          effective_from: string | null
          effective_to: string | null
          emergency_multiplier: number | null
          hourly_rate: number
          id: string
          is_active: boolean | null
          is_default: boolean | null
          minimum_hours: number | null
          updated_at: string
          user_id: string
          weekend_multiplier: number | null
          work_type: string
        }
        Insert: {
          after_hours_multiplier?: number | null
          card_name: string
          client_id?: string | null
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          emergency_multiplier?: number | null
          hourly_rate: number
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          minimum_hours?: number | null
          updated_at?: string
          user_id: string
          weekend_multiplier?: number | null
          work_type: string
        }
        Update: {
          after_hours_multiplier?: number | null
          card_name?: string
          client_id?: string | null
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          emergency_multiplier?: number | null
          hourly_rate?: number
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          minimum_hours?: number | null
          updated_at?: string
          user_id?: string
          weekend_multiplier?: number | null
          work_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_rate_cards_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_report_history: {
        Row: {
          error_message: string | null
          file_size_bytes: number | null
          file_url: string | null
          generated_at: string | null
          generation_time_ms: number | null
          id: string
          report_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          error_message?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          generated_at?: string | null
          generation_time_ms?: number | null
          id?: string
          report_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          error_message?: string | null
          file_size_bytes?: number | null
          file_url?: string | null
          generated_at?: string | null
          generation_time_ms?: number | null
          id?: string
          report_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_report_history_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "vanguard_scheduled_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_routing_rules: {
        Row: {
          action_target: string | null
          action_type: string
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at: string | null
          id: string
          is_enabled: boolean | null
          match_count: number | null
          name: string
          priority: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          action_target?: string | null
          action_type: string
          condition_field: string
          condition_operator: string
          condition_value: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          match_count?: number | null
          name: string
          priority?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          action_target?: string | null
          action_type?: string
          condition_field?: string
          condition_operator?: string
          condition_value?: string
          created_at?: string | null
          id?: string
          is_enabled?: boolean | null
          match_count?: number | null
          name?: string
          priority?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_runbook_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          current_step: string | null
          id: string
          runbook_id: string | null
          started_at: string | null
          status: string
          step_results: Json | null
          target_devices: string[] | null
          triggered_by: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          id?: string
          runbook_id?: string | null
          started_at?: string | null
          status?: string
          step_results?: Json | null
          target_devices?: string[] | null
          triggered_by?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          current_step?: string | null
          id?: string
          runbook_id?: string | null
          started_at?: string | null
          status?: string
          step_results?: Json | null
          target_devices?: string[] | null
          triggered_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_runbook_executions_runbook_id_fkey"
            columns: ["runbook_id"]
            isOneToOne: false
            referencedRelation: "vanguard_runbooks"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_runbooks: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          last_run: string | null
          name: string
          steps: Json | null
          success_rate: number | null
          total_runs: number | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          name: string
          steps?: Json | null
          success_rate?: number | null
          total_runs?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          last_run?: string | null
          name?: string
          steps?: Json | null
          success_rate?: number | null
          total_runs?: number | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_scheduled_reports: {
        Row: {
          config: Json | null
          created_at: string | null
          format: string | null
          id: string
          is_enabled: boolean | null
          last_run_at: string | null
          name: string
          next_run_at: string | null
          recipients: string[] | null
          report_type: string
          schedule_cron: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          format?: string | null
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          recipients?: string[] | null
          report_type: string
          schedule_cron?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          format?: string | null
          id?: string
          is_enabled?: boolean | null
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          recipients?: string[] | null
          report_type?: string
          schedule_cron?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_script_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          device_count: number | null
          failed_count: number | null
          id: string
          output_summary: string | null
          script_id: string | null
          script_name: string
          started_at: string | null
          status: string | null
          success_count: number | null
          target_devices: string[] | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          device_count?: number | null
          failed_count?: number | null
          id?: string
          output_summary?: string | null
          script_id?: string | null
          script_name: string
          started_at?: string | null
          status?: string | null
          success_count?: number | null
          target_devices?: string[] | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          device_count?: number | null
          failed_count?: number | null
          id?: string
          output_summary?: string | null
          script_id?: string | null
          script_name?: string
          started_at?: string | null
          status?: string | null
          success_count?: number | null
          target_devices?: string[] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_script_executions_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "vanguard_fleet_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_security_events: {
        Row: {
          action_success: boolean | null
          agent_id: string | null
          created_at: string
          detected_at: string | null
          event_type: string
          id: string
          process_name: string | null
          raw_data: Json | null
          remediated_at: string | null
          resources: string[] | null
          severity: string
          threat_id: string | null
          threat_name: string
          threat_status: string | null
          user_id: string
        }
        Insert: {
          action_success?: boolean | null
          agent_id?: string | null
          created_at?: string
          detected_at?: string | null
          event_type?: string
          id?: string
          process_name?: string | null
          raw_data?: Json | null
          remediated_at?: string | null
          resources?: string[] | null
          severity?: string
          threat_id?: string | null
          threat_name: string
          threat_status?: string | null
          user_id: string
        }
        Update: {
          action_success?: boolean | null
          agent_id?: string | null
          created_at?: string
          detected_at?: string | null
          event_type?: string
          id?: string
          process_name?: string | null
          raw_data?: Json | null
          remediated_at?: string | null
          resources?: string[] | null
          severity?: string
          threat_id?: string | null
          threat_name?: string
          threat_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_security_events_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_security_trends: {
        Row: {
          created_at: string | null
          id: string
          incidents_opened: number | null
          incidents_resolved: number | null
          threats_blocked: number | null
          threats_detected: number | null
          trend_date: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          incidents_opened?: number | null
          incidents_resolved?: number | null
          threats_blocked?: number | null
          threats_detected?: number | null
          trend_date: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          incidents_opened?: number | null
          incidents_resolved?: number | null
          threats_blocked?: number | null
          threats_detected?: number | null
          trend_date?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_sentinel_ai_analysis: {
        Row: {
          ai_decision: string | null
          ai_reasoning: string | null
          analyzed_at: string | null
          attack_vector: string | null
          auto_ticket_created: boolean | null
          confidence_score: number | null
          event_id: string | null
          human_decision: string | null
          human_notes: string | null
          human_override: boolean | null
          id: string
          is_pattern_match: boolean | null
          pattern_id: string | null
          pattern_name: string | null
          processing_time_ms: number | null
          recommended_action: string | null
          related_events: string[] | null
          remediation_steps: string[] | null
          risk_score: number | null
          threat_category: string | null
          ticket_id: string | null
          tokens_used: number | null
          user_id: string
        }
        Insert: {
          ai_decision?: string | null
          ai_reasoning?: string | null
          analyzed_at?: string | null
          attack_vector?: string | null
          auto_ticket_created?: boolean | null
          confidence_score?: number | null
          event_id?: string | null
          human_decision?: string | null
          human_notes?: string | null
          human_override?: boolean | null
          id?: string
          is_pattern_match?: boolean | null
          pattern_id?: string | null
          pattern_name?: string | null
          processing_time_ms?: number | null
          recommended_action?: string | null
          related_events?: string[] | null
          remediation_steps?: string[] | null
          risk_score?: number | null
          threat_category?: string | null
          ticket_id?: string | null
          tokens_used?: number | null
          user_id: string
        }
        Update: {
          ai_decision?: string | null
          ai_reasoning?: string | null
          analyzed_at?: string | null
          attack_vector?: string | null
          auto_ticket_created?: boolean | null
          confidence_score?: number | null
          event_id?: string | null
          human_decision?: string | null
          human_notes?: string | null
          human_override?: boolean | null
          id?: string
          is_pattern_match?: boolean | null
          pattern_id?: string | null
          pattern_name?: string | null
          processing_time_ms?: number | null
          recommended_action?: string | null
          related_events?: string[] | null
          remediation_steps?: string[] | null
          risk_score?: number | null
          threat_category?: string | null
          ticket_id?: string | null
          tokens_used?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_sentinel_ai_analysis_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "vanguard_m365_security_events"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_sentinel_alert_trends: {
        Row: {
          created_at: string
          day_name: string | null
          id: string
          resolved_alerts: number | null
          total_alerts: number | null
          trend_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_name?: string | null
          id?: string
          resolved_alerts?: number | null
          total_alerts?: number | null
          trend_date: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_name?: string | null
          id?: string
          resolved_alerts?: number | null
          total_alerts?: number | null
          trend_date?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_sentinel_rules: {
        Row: {
          ai_auto_dismiss_below: number | null
          auto_create_ticket: boolean | null
          block_user: boolean | null
          created_at: string
          description: string | null
          event_types: string[] | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          notify_email: boolean | null
          notify_slack: boolean | null
          require_mfa_reset: boolean | null
          risk_score_threshold: number | null
          rule_name: string
          severity_threshold: string | null
          times_triggered: number | null
          updated_at: string
          use_ai_triage: boolean | null
          user_id: string
        }
        Insert: {
          ai_auto_dismiss_below?: number | null
          auto_create_ticket?: boolean | null
          block_user?: boolean | null
          created_at?: string
          description?: string | null
          event_types?: string[] | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          notify_email?: boolean | null
          notify_slack?: boolean | null
          require_mfa_reset?: boolean | null
          risk_score_threshold?: number | null
          rule_name: string
          severity_threshold?: string | null
          times_triggered?: number | null
          updated_at?: string
          use_ai_triage?: boolean | null
          user_id: string
        }
        Update: {
          ai_auto_dismiss_below?: number | null
          auto_create_ticket?: boolean | null
          block_user?: boolean | null
          created_at?: string
          description?: string | null
          event_types?: string[] | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          notify_email?: boolean | null
          notify_slack?: boolean | null
          require_mfa_reset?: boolean | null
          risk_score_threshold?: number | null
          rule_name?: string
          severity_threshold?: string | null
          times_triggered?: number | null
          updated_at?: string
          use_ai_triage?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_sentinel_threat_distribution: {
        Row: {
          color: string | null
          count: number | null
          id: string
          threat_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          color?: string | null
          count?: number | null
          id?: string
          threat_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          color?: string | null
          count?: number | null
          id?: string
          threat_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_service_tickets: {
        Row: {
          actual_resolution_hours: number | null
          ai_auto_responded: boolean | null
          ai_business_impact: string | null
          ai_category_confidence: number | null
          ai_complexity_score: number | null
          ai_confidence_score: number | null
          ai_detected_category: string | null
          ai_detected_priority: string | null
          ai_duplicate_confidence: number | null
          ai_duplicate_of: string | null
          ai_escalation_factors: string[] | null
          ai_escalation_probability: number | null
          ai_escalation_reason: string | null
          ai_estimated_resolution_time: string | null
          ai_frustration_level: number | null
          ai_handoff_summary: string | null
          ai_kb_article_relevance: Json | null
          ai_keywords: string[] | null
          ai_predicted_sla_hours: number | null
          ai_priority_factors: string[] | null
          ai_processing_status: string | null
          ai_recommended_technician_id: string | null
          ai_requires_escalation: boolean | null
          ai_response_sent_at: string | null
          ai_routing_confidence: number | null
          ai_routing_reason: string | null
          ai_sentiment_indicators: string[] | null
          ai_similar_issues_hint: string | null
          ai_sla_confidence: number | null
          ai_sla_factors: string[] | null
          ai_sub_category: string | null
          ai_suggested_kb_articles: string[] | null
          ai_suggested_solution: string | null
          ai_summary: string | null
          ai_tech_notes: string | null
          ai_user_sentiment: string | null
          ai_users_affected: string | null
          assigned_to: string | null
          auto_resolved: boolean | null
          category: string
          created_at: string | null
          description: string
          id: string
          original_language: string | null
          priority: string
          related_scan_id: string | null
          related_security_event_id: string | null
          requester_email: string | null
          requester_name: string | null
          resolution_notes: string | null
          resolved_at: string | null
          security_category: string | null
          status: string
          tech_action: string | null
          title: string
          translated_description: string | null
          translated_title: string | null
          updated_at: string | null
          user_feedback: string | null
          user_id: string
        }
        Insert: {
          actual_resolution_hours?: number | null
          ai_auto_responded?: boolean | null
          ai_business_impact?: string | null
          ai_category_confidence?: number | null
          ai_complexity_score?: number | null
          ai_confidence_score?: number | null
          ai_detected_category?: string | null
          ai_detected_priority?: string | null
          ai_duplicate_confidence?: number | null
          ai_duplicate_of?: string | null
          ai_escalation_factors?: string[] | null
          ai_escalation_probability?: number | null
          ai_escalation_reason?: string | null
          ai_estimated_resolution_time?: string | null
          ai_frustration_level?: number | null
          ai_handoff_summary?: string | null
          ai_kb_article_relevance?: Json | null
          ai_keywords?: string[] | null
          ai_predicted_sla_hours?: number | null
          ai_priority_factors?: string[] | null
          ai_processing_status?: string | null
          ai_recommended_technician_id?: string | null
          ai_requires_escalation?: boolean | null
          ai_response_sent_at?: string | null
          ai_routing_confidence?: number | null
          ai_routing_reason?: string | null
          ai_sentiment_indicators?: string[] | null
          ai_similar_issues_hint?: string | null
          ai_sla_confidence?: number | null
          ai_sla_factors?: string[] | null
          ai_sub_category?: string | null
          ai_suggested_kb_articles?: string[] | null
          ai_suggested_solution?: string | null
          ai_summary?: string | null
          ai_tech_notes?: string | null
          ai_user_sentiment?: string | null
          ai_users_affected?: string | null
          assigned_to?: string | null
          auto_resolved?: boolean | null
          category?: string
          created_at?: string | null
          description: string
          id?: string
          original_language?: string | null
          priority?: string
          related_scan_id?: string | null
          related_security_event_id?: string | null
          requester_email?: string | null
          requester_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          security_category?: string | null
          status?: string
          tech_action?: string | null
          title: string
          translated_description?: string | null
          translated_title?: string | null
          updated_at?: string | null
          user_feedback?: string | null
          user_id: string
        }
        Update: {
          actual_resolution_hours?: number | null
          ai_auto_responded?: boolean | null
          ai_business_impact?: string | null
          ai_category_confidence?: number | null
          ai_complexity_score?: number | null
          ai_confidence_score?: number | null
          ai_detected_category?: string | null
          ai_detected_priority?: string | null
          ai_duplicate_confidence?: number | null
          ai_duplicate_of?: string | null
          ai_escalation_factors?: string[] | null
          ai_escalation_probability?: number | null
          ai_escalation_reason?: string | null
          ai_estimated_resolution_time?: string | null
          ai_frustration_level?: number | null
          ai_handoff_summary?: string | null
          ai_kb_article_relevance?: Json | null
          ai_keywords?: string[] | null
          ai_predicted_sla_hours?: number | null
          ai_priority_factors?: string[] | null
          ai_processing_status?: string | null
          ai_recommended_technician_id?: string | null
          ai_requires_escalation?: boolean | null
          ai_response_sent_at?: string | null
          ai_routing_confidence?: number | null
          ai_routing_reason?: string | null
          ai_sentiment_indicators?: string[] | null
          ai_similar_issues_hint?: string | null
          ai_sla_confidence?: number | null
          ai_sla_factors?: string[] | null
          ai_sub_category?: string | null
          ai_suggested_kb_articles?: string[] | null
          ai_suggested_solution?: string | null
          ai_summary?: string | null
          ai_tech_notes?: string | null
          ai_user_sentiment?: string | null
          ai_users_affected?: string | null
          assigned_to?: string | null
          auto_resolved?: boolean | null
          category?: string
          created_at?: string | null
          description?: string
          id?: string
          original_language?: string | null
          priority?: string
          related_scan_id?: string | null
          related_security_event_id?: string | null
          requester_email?: string | null
          requester_name?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          security_category?: string | null
          status?: string
          tech_action?: string | null
          title?: string
          translated_description?: string | null
          translated_title?: string | null
          updated_at?: string | null
          user_feedback?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_service_tickets_ai_recommended_technician_id_fkey"
            columns: ["ai_recommended_technician_id"]
            isOneToOne: false
            referencedRelation: "helpdesk_technicians"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_sla_breaches: {
        Row: {
          actual_value: number | null
          breach_type: string
          client_id: string | null
          client_name: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          occurred_at: string
          status: string | null
          target_value: number | null
          ticket_id: string | null
          user_id: string
        }
        Insert: {
          actual_value?: number | null
          breach_type: string
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          occurred_at?: string
          status?: string | null
          target_value?: number | null
          ticket_id?: string | null
          user_id: string
        }
        Update: {
          actual_value?: number | null
          breach_type?: string
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          occurred_at?: string
          status?: string | null
          target_value?: number | null
          ticket_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_sla_policies: {
        Row: {
          business_days: string[] | null
          business_hours_end: string | null
          business_hours_only: boolean | null
          business_hours_start: string | null
          client_id: string | null
          created_at: string
          escalation_after_hours: number | null
          escalation_enabled: boolean | null
          id: string
          is_active: boolean | null
          policy_name: string
          priority_level: string
          resolution_hours: number
          response_hours: number
          updated_at: string
          user_id: string
        }
        Insert: {
          business_days?: string[] | null
          business_hours_end?: string | null
          business_hours_only?: boolean | null
          business_hours_start?: string | null
          client_id?: string | null
          created_at?: string
          escalation_after_hours?: number | null
          escalation_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          policy_name: string
          priority_level?: string
          resolution_hours?: number
          response_hours?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          business_days?: string[] | null
          business_hours_end?: string | null
          business_hours_only?: boolean | null
          business_hours_start?: string | null
          client_id?: string | null
          created_at?: string
          escalation_after_hours?: number | null
          escalation_enabled?: boolean | null
          id?: string
          is_active?: boolean | null
          policy_name?: string
          priority_level?: string
          resolution_hours?: number
          response_hours?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_sla_policies_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_software_audit: {
        Row: {
          category: string | null
          created_at: string
          device_count: number | null
          has_vulnerabilities: boolean | null
          id: string
          is_approved: boolean | null
          name: string
          publisher: string | null
          updated_at: string
          user_id: string
          version: string | null
          vulnerability_count: number | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          device_count?: number | null
          has_vulnerabilities?: boolean | null
          id?: string
          is_approved?: boolean | null
          name: string
          publisher?: string | null
          updated_at?: string
          user_id: string
          version?: string | null
          vulnerability_count?: number | null
        }
        Update: {
          category?: string | null
          created_at?: string
          device_count?: number | null
          has_vulnerabilities?: boolean | null
          id?: string
          is_approved?: boolean | null
          name?: string
          publisher?: string | null
          updated_at?: string
          user_id?: string
          version?: string | null
          vulnerability_count?: number | null
        }
        Relationships: []
      }
      vanguard_subscriptions: {
        Row: {
          admin_override: boolean | null
          admin_override_by: string | null
          admin_override_reason: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          seat_count: number
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_override?: boolean | null
          admin_override_by?: string | null
          admin_override_reason?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          seat_count?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_override?: boolean | null
          admin_override_by?: string | null
          admin_override_reason?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          seat_count?: number
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_survey_responses: {
        Row: {
          client_name: string | null
          created_at: string
          feedback: string | null
          id: string
          nps_score: number | null
          rating: number | null
          technician_name: string | null
          template_id: string | null
          ticket_id: string | null
          ticket_title: string | null
          user_id: string
        }
        Insert: {
          client_name?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          nps_score?: number | null
          rating?: number | null
          technician_name?: string | null
          template_id?: string | null
          ticket_id?: string | null
          ticket_title?: string | null
          user_id: string
        }
        Update: {
          client_name?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          nps_score?: number | null
          rating?: number | null
          technician_name?: string | null
          template_id?: string | null
          ticket_id?: string | null
          ticket_title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_survey_responses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "vanguard_survey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_survey_templates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          questions: Json | null
          response_rate: number | null
          trigger_event: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          questions?: Json | null
          response_rate?: number | null
          trigger_event: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          questions?: Json | null
          response_rate?: number | null
          trigger_event?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_technician_utilization: {
        Row: {
          billable_hours: number | null
          created_at: string
          id: string
          non_billable_hours: number | null
          period_date: string
          technician_id: string | null
          technician_name: string
          tickets_completed: number | null
          total_hours: number | null
          user_id: string
          utilization_percent: number | null
        }
        Insert: {
          billable_hours?: number | null
          created_at?: string
          id?: string
          non_billable_hours?: number | null
          period_date: string
          technician_id?: string | null
          technician_name: string
          tickets_completed?: number | null
          total_hours?: number | null
          user_id: string
          utilization_percent?: number | null
        }
        Update: {
          billable_hours?: number | null
          created_at?: string
          id?: string
          non_billable_hours?: number | null
          period_date?: string
          technician_id?: string | null
          technician_name?: string
          tickets_completed?: number | null
          total_hours?: number | null
          user_id?: string
          utilization_percent?: number | null
        }
        Relationships: []
      }
      vanguard_technicians: {
        Row: {
          active_tickets: number | null
          avatar: string | null
          avg_resolution_time_minutes: number | null
          created_at: string | null
          email: string | null
          id: string
          is_senior: boolean | null
          max_capacity: number | null
          name: string
          rating: number | null
          skills: string[] | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_tickets?: number | null
          avatar?: string | null
          avg_resolution_time_minutes?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_senior?: boolean | null
          max_capacity?: number | null
          name: string
          rating?: number | null
          skills?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_tickets?: number | null
          avatar?: string | null
          avg_resolution_time_minutes?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_senior?: boolean | null
          max_capacity?: number | null
          name?: string
          rating?: number | null
          skills?: string[] | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_threshold_profiles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          rules: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          rules?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          rules?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_ticket_categories: {
        Row: {
          category_name: string
          color: string | null
          created_at: string | null
          id: string
          percentage: number | null
          period_end: string | null
          period_start: string | null
          ticket_count: number | null
          user_id: string
        }
        Insert: {
          category_name: string
          color?: string | null
          created_at?: string | null
          id?: string
          percentage?: number | null
          period_end?: string | null
          period_start?: string | null
          ticket_count?: number | null
          user_id: string
        }
        Update: {
          category_name?: string
          color?: string | null
          created_at?: string | null
          id?: string
          percentage?: number | null
          period_end?: string | null
          period_start?: string | null
          ticket_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      vanguard_ticket_sla_tracking: {
        Row: {
          created_at: string
          escalated: boolean | null
          escalated_at: string | null
          first_response_at: string | null
          id: string
          pause_reason: string | null
          paused_at: string | null
          resolution_breached: boolean | null
          resolution_due_at: string | null
          resolved_at: string | null
          response_breached: boolean | null
          response_due_at: string | null
          sla_policy_id: string | null
          ticket_id: string
          total_pause_minutes: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          escalated?: boolean | null
          escalated_at?: string | null
          first_response_at?: string | null
          id?: string
          pause_reason?: string | null
          paused_at?: string | null
          resolution_breached?: boolean | null
          resolution_due_at?: string | null
          resolved_at?: string | null
          response_breached?: boolean | null
          response_due_at?: string | null
          sla_policy_id?: string | null
          ticket_id: string
          total_pause_minutes?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          escalated?: boolean | null
          escalated_at?: string | null
          first_response_at?: string | null
          id?: string
          pause_reason?: string | null
          paused_at?: string | null
          resolution_breached?: boolean | null
          resolution_due_at?: string | null
          resolved_at?: string | null
          response_breached?: boolean | null
          response_due_at?: string | null
          sla_policy_id?: string | null
          ticket_id?: string
          total_pause_minutes?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_ticket_sla_tracking_sla_policy_id_fkey"
            columns: ["sla_policy_id"]
            isOneToOne: false
            referencedRelation: "vanguard_sla_policies"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_time_entries: {
        Row: {
          billing_status: string | null
          client_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number | null
          end_time: string | null
          hourly_rate: number | null
          id: string
          invoice_id: string | null
          is_billable: boolean | null
          notes: string | null
          start_time: string
          technician_id: string | null
          ticket_id: string | null
          total_amount: number | null
          updated_at: string
          user_id: string
          work_type: string | null
        }
        Insert: {
          billing_status?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          notes?: string | null
          start_time: string
          technician_id?: string | null
          ticket_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id: string
          work_type?: string | null
        }
        Update: {
          billing_status?: string | null
          client_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          notes?: string | null
          start_time?: string
          technician_id?: string | null
          ticket_id?: string | null
          total_amount?: number | null
          updated_at?: string
          user_id?: string
          work_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_time_entries_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "msp_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_traffic_captures: {
        Row: {
          agent_id: string
          bpf_filter: string | null
          bytes_captured: number | null
          c2_indicators: Json | null
          capture_name: string
          completed_at: string | null
          dns_tunneling_detected: boolean | null
          duration_seconds: number | null
          exfiltration_detected: boolean | null
          id: string
          interface: string | null
          packet_count: number | null
          started_at: string | null
          status: string | null
          suspicious_flows: Json | null
          user_id: string
        }
        Insert: {
          agent_id: string
          bpf_filter?: string | null
          bytes_captured?: number | null
          c2_indicators?: Json | null
          capture_name: string
          completed_at?: string | null
          dns_tunneling_detected?: boolean | null
          duration_seconds?: number | null
          exfiltration_detected?: boolean | null
          id?: string
          interface?: string | null
          packet_count?: number | null
          started_at?: string | null
          status?: string | null
          suspicious_flows?: Json | null
          user_id: string
        }
        Update: {
          agent_id?: string
          bpf_filter?: string | null
          bytes_captured?: number | null
          c2_indicators?: Json | null
          capture_name?: string
          completed_at?: string | null
          dns_tunneling_detected?: boolean | null
          duration_seconds?: number | null
          exfiltration_detected?: boolean | null
          id?: string
          interface?: string | null
          packet_count?: number | null
          started_at?: string | null
          status?: string | null
          suspicious_flows?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vanguard_traffic_captures_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      vanguard_uptime_policies: {
        Row: {
          breach_notifications: string[] | null
          client_id: string | null
          client_name: string | null
          created_at: string
          id: string
          is_active: boolean | null
          maintenance_window: Json | null
          name: string
          resolution_time_target: number | null
          response_time_target: number | null
          updated_at: string
          uptime_target: number
          user_id: string
        }
        Insert: {
          breach_notifications?: string[] | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          maintenance_window?: Json | null
          name: string
          resolution_time_target?: number | null
          response_time_target?: number | null
          updated_at?: string
          uptime_target?: number
          user_id: string
        }
        Update: {
          breach_notifications?: string[] | null
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          maintenance_window?: Json | null
          name?: string
          resolution_time_target?: number | null
          response_time_target?: number | null
          updated_at?: string
          uptime_target?: number
          user_id?: string
        }
        Relationships: []
      }
      vanguard_uptime_records: {
        Row: {
          client_id: string | null
          client_name: string | null
          created_at: string
          current_uptime: number | null
          downtime_minutes_30d: number | null
          id: string
          incidents_30d: number | null
          last_30_days_uptime: number | null
          last_downtime_at: string | null
          sla_target: number | null
          trend: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          current_uptime?: number | null
          downtime_minutes_30d?: number | null
          id?: string
          incidents_30d?: number | null
          last_30_days_uptime?: number | null
          last_downtime_at?: string | null
          sla_target?: number | null
          trend?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_id?: string | null
          client_name?: string | null
          created_at?: string
          current_uptime?: number | null
          downtime_minutes_30d?: number | null
          id?: string
          incidents_30d?: number | null
          last_30_days_uptime?: number | null
          last_downtime_at?: string | null
          sla_target?: number | null
          trend?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_vuln_suppression_rules: {
        Row: {
          created_at: string
          criteria: Json | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          name: string
          reason: string | null
          suppression_type: string
          user_id: string
          vuln_count: number | null
        }
        Insert: {
          created_at?: string
          criteria?: Json | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          reason?: string | null
          suppression_type: string
          user_id: string
          vuln_count?: number | null
        }
        Update: {
          created_at?: string
          criteria?: Json | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          reason?: string | null
          suppression_type?: string
          user_id?: string
          vuln_count?: number | null
        }
        Relationships: []
      }
      vanguard_workflow_rules: {
        Row: {
          actions: Json | null
          conditions: Json | null
          created_at: string
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          name: string
          trigger_event: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name: string
          trigger_event: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json | null
          conditions?: Json | null
          created_at?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name?: string
          trigger_event?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vanguard_workflow_states: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          states: Json
          transitions: Json
          triggers: Json | null
          updated_at: string
          user_id: string
          workflow_name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          states?: Json
          transitions?: Json
          triggers?: Json | null
          updated_at?: string
          user_id: string
          workflow_name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          states?: Json
          transitions?: Json
          triggers?: Json | null
          updated_at?: string
          user_id?: string
          workflow_name?: string
        }
        Relationships: []
      }
      voice_assistant_interactions: {
        Row: {
          content: string
          created_at: string | null
          id: string
          message_type: string
          session_id: string | null
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          message_type: string
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          message_type?: string
          session_id?: string | null
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      voice_credit_purchases: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          minutes_purchased: number
          minutes_remaining: number
          price_paid_cents: number
          stripe_payment_intent: string | null
          stripe_session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          minutes_purchased: number
          minutes_remaining: number
          price_paid_cents: number
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          minutes_purchased?: number
          minutes_remaining?: number
          price_paid_cents?: number
          stripe_payment_intent?: string | null
          stripe_session_id?: string | null
          user_id?: string
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
      whitelabel_change_requests: {
        Row: {
          changes: Json
          config_id: string
          created_at: string
          id: string
          request_type: string
          requested_by: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          changes: Json
          config_id: string
          created_at?: string
          id?: string
          request_type: string
          requested_by: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          changes?: Json
          config_id?: string
          created_at?: string
          id?: string
          request_type?: string
          requested_by?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "whitelabel_change_requests_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "msp_client_whitelabel_configs"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_automation_rules: {
        Row: {
          actions: Json
          conditions: Json
          created_at: string
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          name: string
          trigger_event: string
          updated_at: string
          user_id: string
        }
        Insert: {
          actions?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name: string
          trigger_event: string
          updated_at?: string
          user_id: string
        }
        Update: {
          actions?: Json
          conditions?: Json
          created_at?: string
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name?: string
          trigger_event?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workflow_automations: {
        Row: {
          actions: Json
          created_at: string
          created_by: string | null
          description: string | null
          execution_count: number | null
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          name: string
          trigger_conditions: Json
          trigger_type: string
          updated_at: string
        }
        Insert: {
          actions: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name: string
          trigger_conditions: Json
          trigger_type: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          created_at?: string
          created_by?: string | null
          description?: string | null
          execution_count?: number | null
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          name?: string
          trigger_conditions?: Json
          trigger_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      yara_matches: {
        Row: {
          agent_id: string | null
          created_at: string | null
          file_hash: string | null
          file_path: string | null
          id: string
          matched_strings: string[] | null
          rule_id: string
          scan_type: string | null
        }
        Insert: {
          agent_id?: string | null
          created_at?: string | null
          file_hash?: string | null
          file_path?: string | null
          id?: string
          matched_strings?: string[] | null
          rule_id: string
          scan_type?: string | null
        }
        Update: {
          agent_id?: string | null
          created_at?: string | null
          file_hash?: string | null
          file_path?: string | null
          id?: string
          matched_strings?: string[] | null
          rule_id?: string
          scan_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "yara_matches_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "vanguard_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "yara_matches_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "yara_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      yara_rules: {
        Row: {
          author: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_enabled: boolean | null
          last_match_at: string | null
          match_count: number | null
          rule_content: string
          rule_name: string
          severity: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          last_match_at?: string | null
          match_count?: number | null
          rule_content: string
          rule_name: string
          severity?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          author?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_enabled?: boolean | null
          last_match_at?: string | null
          match_count?: number | null
          rule_content?: string
          rule_name?: string
          severity?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      client_portal_users_safe: {
        Row: {
          client_id: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          last_login_at: string | null
          role: string | null
          updated_at: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          last_login_at?: string | null
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      msp_billing_summary: {
        Row: {
          billing_period: string | null
          msp_id: string | null
          period_end: string | null
          period_start: string | null
          service_type: string | null
          total_cost: number | null
          total_quantity: number | null
          transaction_count: number | null
        }
        Relationships: []
      }
      profiles_safe: {
        Row: {
          account_type: Database["public"]["Enums"]["account_type"] | null
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_type?: Database["public"]["Enums"]["account_type"] | null
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_invoice_totals: {
        Args: { p_invoice_id: string }
        Returns: undefined
      }
      calculate_next_run: {
        Args: { frequency: string; schedule_time: string }
        Returns: string
      }
      calculate_roi_percentage: {
        Args: { p_roi_id: string }
        Returns: undefined
      }
      can_access_password_entry: {
        Args: { p_entry_id: string; p_user_id: string }
        Returns: boolean
      }
      can_access_safepass_entry: {
        Args: { checking_user_id: string; entry_id: string }
        Returns: boolean
      }
      current_device_id: { Args: never; Returns: string }
      current_org_id: { Args: never; Returns: string }
      deduct_ai_credits: {
        Args: {
          p_conversation_id?: string
          p_description?: string
          p_gpt_id: string
          p_tokens: number
          p_usage_type: string
          p_user_id: string
        }
        Returns: Json
      }
      ensure_my_vault: { Args: never; Returns: string }
      generate_analytics_snapshot: {
        Args: { p_snapshot_type: string; p_user_id: string }
        Returns: string
      }
      generate_invoice_number: { Args: never; Returns: string }
      generate_next_invoice_number: { Args: never; Returns: string }
      generate_ticket_number: { Args: never; Returns: string }
      get_ai_studio_plan_credits: { Args: { plan: string }; Returns: number }
      get_device_alert_counts: {
        Args: { p_device_id: string }
        Returns: {
          critical: number
          high: number
          info: number
          low: number
          medium: number
        }[]
      }
      get_device_latest_scan: {
        Args: { p_device_id: string }
        Returns: {
          devices_found: number
          scan_duration: number
          scan_id: string
          scan_type: string
          scanned_at: string
        }[]
      }
      get_helpdesk_role: {
        Args: { _context_id?: string; _user_id: string }
        Returns: Database["public"]["Enums"]["helpdesk_role"]
      }
      get_monthly_credits_for_tier: {
        Args: { is_subscribed: boolean; tier: string }
        Returns: number
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
      get_user_safesuite_team: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_user: { Args: never; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_msp_or_mssp: { Args: { _user_id: string }; Returns: boolean }
      is_msp_user: { Args: { check_user_id: string }; Returns: boolean }
      is_safesuite_team_admin: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_safesuite_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
      is_ultrium_employee: { Args: { _user_id: string }; Returns: boolean }
      owns_safepass_entry: {
        Args: { checking_user_id: string; entry_user_id: string }
        Returns: boolean
      }
      send_notification: {
        Args: {
          p_action_url?: string
          p_category?: string
          p_message: string
          p_metadata?: Json
          p_title: string
          p_type?: string
          p_user_id: string
        }
        Returns: string
      }
      upsert_device_from_checkin: {
        Args: {
          p_agent_version: string
          p_client_code: string
          p_connector_key: string
          p_system_info: Json
        }
        Returns: string
      }
      user_owns_msp: { Args: { _msp_id: string }; Returns: boolean }
      validate_api_key: {
        Args: { key_hash: string }
        Returns: {
          is_valid: boolean
          rate_limit_rpd: number
          user_id: string
        }[]
      }
      validate_connector_key: {
        Args: { p_connector_key: string }
        Returns: {
          connector_id: string
          is_valid: boolean
          user_id: string
        }[]
      }
      validate_connector_key_secure: {
        Args: { p_connector_key: string }
        Returns: {
          connector_id: string
          is_valid: boolean
          user_id: string
        }[]
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
      command_status: "queued" | "running" | "done" | "error" | "expired"
      device_status: "online" | "offline" | "stale" | "unknown"
      helpdesk_role: "msp_admin" | "msp_staff" | "client_admin" | "client_staff"
      safedoc_role: "admin" | "editor" | "viewer" | "none"
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
      account_type: ["business", "msp", "mssp"],
      app_role: [
        "admin",
        "moderator",
        "user",
        "msp_admin",
        "mssp_admin",
        "ultrium_admin",
      ],
      command_status: ["queued", "running", "done", "error", "expired"],
      device_status: ["online", "offline", "stale", "unknown"],
      helpdesk_role: ["msp_admin", "msp_staff", "client_admin", "client_staff"],
      safedoc_role: ["admin", "editor", "viewer", "none"],
    },
  },
} as const
