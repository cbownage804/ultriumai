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
      assets: {
        Row: {
          asset_tag: string | null
          assigned_to: string | null
          category_id: string | null
          client_id: string | null
          created_at: string
          current_value: number | null
          depreciation_rate: number | null
          description: string | null
          id: string
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          notes: string | null
          purchase_date: string | null
          purchase_price: number | null
          serial_number: string | null
          specifications: Json | null
          status: string | null
          updated_at: string
          user_id: string
          warranty_expiry: string | null
        }
        Insert: {
          asset_tag?: string | null
          assigned_to?: string | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          current_value?: number | null
          depreciation_rate?: number | null
          description?: string | null
          id?: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string | null
          updated_at?: string
          user_id: string
          warranty_expiry?: string | null
        }
        Update: {
          asset_tag?: string | null
          assigned_to?: string | null
          category_id?: string | null
          client_id?: string | null
          created_at?: string
          current_value?: number | null
          depreciation_rate?: number | null
          description?: string | null
          id?: string
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          purchase_price?: number | null
          serial_number?: string | null
          specifications?: Json | null
          status?: string | null
          updated_at?: string
          user_id?: string
          warranty_expiry?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
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
      safepass_entries: {
        Row: {
          category: string | null
          client_id: string | null
          compromise_details: Json | null
          created_at: string
          encrypted_data: Json
          entry_type: string
          id: string
          is_compromised: boolean | null
          is_favorite: boolean | null
          last_used_at: string | null
          msp_id: string | null
          notes: string | null
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
          id?: string
          is_compromised?: boolean | null
          is_favorite?: boolean | null
          last_used_at?: string | null
          msp_id?: string | null
          notes?: string | null
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
          id?: string
          is_compromised?: boolean | null
          is_favorite?: boolean | null
          last_used_at?: string | null
          msp_id?: string | null
          notes?: string | null
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
            foreignKeyName: "safepass_entries_vault_id_fkey"
            columns: ["vault_id"]
            isOneToOne: false
            referencedRelation: "safepass_vaults"
            referencedColumns: ["id"]
          },
        ]
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
      scheduled_scans: {
        Row: {
          created_at: string
          frequency: string
          id: string
          is_active: boolean
          last_run_at: string | null
          next_run_at: string
          scan_target: string
          scan_type: string
          schedule_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at: string
          scan_target: string
          scan_type: string
          schedule_time?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          next_run_at?: string
          scan_target?: string
          scan_type?: string
          schedule_time?: string
          updated_at?: string
          user_id?: string
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
      security_incidents: {
        Row: {
          acknowledged_at: string | null
          affected_assets: Json | null
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
            foreignKeyName: "security_incidents_msp_org_id_fkey"
            columns: ["msp_org_id"]
            isOneToOne: false
            referencedRelation: "msp_organizations"
            referencedColumns: ["id"]
          },
        ]
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
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
          ai_confidence_score: number | null
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
          sla_due_at: string | null
          sla_policy_id: string | null
          source_type: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_confidence_score?: number | null
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
          sla_due_at?: string | null
          sla_policy_id?: string | null
          source_type?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_confidence_score?: number | null
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
          sla_due_at?: string | null
          sla_policy_id?: string | null
          source_type?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
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
      user_activity_logs: {
        Row: {
          activity_details: Json | null
          activity_type: string
          created_at: string
          id: string
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
          location_city?: string | null
          location_country?: string | null
          session_id?: string | null
          user_agent?: string | null
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
    }
    Views: {
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
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_next_run: {
        Args: { frequency: string; schedule_time: string }
        Returns: string
      }
      get_device_alert_counts: {
        Args: { p_device_id: string }
        Returns: {
          critical: number
          high: number
          medium: number
          low: number
          info: number
        }[]
      }
      get_device_latest_scan: {
        Args: { p_device_id: string }
        Returns: {
          scan_id: string
          scanned_at: string
          devices_found: number
          scan_duration: number
          scan_type: string
        }[]
      }
      get_helpdesk_role: {
        Args: { _user_id: string; _context_id?: string }
        Returns: Database["public"]["Enums"]["helpdesk_role"]
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
      is_current_user_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
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
      send_notification: {
        Args: {
          p_user_id: string
          p_title: string
          p_message: string
          p_type?: string
          p_category?: string
          p_action_url?: string
          p_metadata?: Json
        }
        Returns: string
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
      validate_api_key: {
        Args: { key_hash: string }
        Returns: {
          user_id: string
          is_valid: boolean
          rate_limit_rpd: number
        }[]
      }
      validate_connector_key: {
        Args: { p_connector_key: string }
        Returns: {
          connector_id: string
          user_id: string
          is_valid: boolean
        }[]
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
      helpdesk_role: "msp_admin" | "msp_staff" | "client_admin" | "client_staff"
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
      helpdesk_role: ["msp_admin", "msp_staff", "client_admin", "client_staff"],
    },
  },
} as const
