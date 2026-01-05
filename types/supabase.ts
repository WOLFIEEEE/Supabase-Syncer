/**
 * Supabase Database Types
 * 
 * These types define the structure of our Supabase database tables.
 * When you modify your Supabase schema, you can regenerate these types using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts
 * 
 * For now, we're defining them manually based on our expected schema.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      connections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          encrypted_url: string;
          environment: 'production' | 'development';
          keep_alive: boolean;
          last_pinged_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          encrypted_url: string;
          environment: 'production' | 'development';
          keep_alive?: boolean;
          last_pinged_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          encrypted_url?: string;
          environment?: 'production' | 'development';
          keep_alive?: boolean;
          last_pinged_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      sync_jobs: {
        Row: {
          id: string;
          user_id: string;
          source_connection_id: string;
          target_connection_id: string;
          direction: 'one_way' | 'two_way';
          status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
          tables_config: Json;
          progress: Json | null;
          checkpoint: Json | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          source_connection_id: string;
          target_connection_id: string;
          direction: 'one_way' | 'two_way';
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
          tables_config: Json;
          progress?: Json | null;
          checkpoint?: Json | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          source_connection_id?: string;
          target_connection_id?: string;
          direction?: 'one_way' | 'two_way';
          status?: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
          tables_config?: Json;
          progress?: Json | null;
          checkpoint?: Json | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
        };
      };
      sync_logs: {
        Row: {
          id: string;
          sync_job_id: string;
          level: 'info' | 'warn' | 'error';
          message: string;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          sync_job_id: string;
          level: 'info' | 'warn' | 'error';
          message: string;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          sync_job_id?: string;
          level?: 'info' | 'warn' | 'error';
          message?: string;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          settings: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          settings?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      usage_limits: {
        Row: {
          id: string;
          user_id: string;
          max_connections: number;
          max_sync_jobs_per_month: number;
          max_data_transfer_mb_per_month: number;
          current_connections: number;
          current_sync_jobs_this_month: number;
          current_data_transfer_mb_this_month: number;
          usage_period_start: string;
          email_notifications_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          max_connections?: number;
          max_sync_jobs_per_month?: number;
          max_data_transfer_mb_per_month?: number;
          current_connections?: number;
          current_sync_jobs_this_month?: number;
          current_data_transfer_mb_this_month?: number;
          usage_period_start?: string;
          email_notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          max_connections?: number;
          max_sync_jobs_per_month?: number;
          max_data_transfer_mb_per_month?: number;
          current_connections?: number;
          current_sync_jobs_this_month?: number;
          current_data_transfer_mb_this_month?: number;
          usage_period_start?: string;
          email_notifications_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      usage_history: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          period_end: string;
          total_connections: number;
          total_sync_jobs: number;
          total_data_transfer_mb: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_start: string;
          period_end: string;
          total_connections?: number;
          total_sync_jobs?: number;
          total_data_transfer_mb?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_start?: string;
          period_end?: string;
          total_connections?: number;
          total_sync_jobs?: number;
          total_data_transfer_mb?: number;
          created_at?: string;
        };
      };
      email_notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          subject: string;
          body: string;
          sent_at: string;
          status: 'sent' | 'failed' | 'pending';
          error_message: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          subject: string;
          body: string;
          sent_at?: string;
          status?: 'sent' | 'failed' | 'pending';
          error_message?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          subject?: string;
          body?: string;
          sent_at?: string;
          status?: 'sent' | 'failed' | 'pending';
          error_message?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      environment_type: 'production' | 'development';
      sync_direction: 'one_way' | 'two_way';
      sync_status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
      log_level: 'info' | 'warn' | 'error';
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

// Convenience types
export type Connection = Tables<'connections'>;
export type SyncJob = Tables<'sync_jobs'>;
export type SyncLog = Tables<'sync_logs'>;
export type UserSettings = Tables<'user_settings'>;

