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
      attendance_records: {
        Row: {
          device_fingerprint: string
          distance_from_classroom: number | null
          id: string
          ip_address: string | null
          is_valid_location: boolean | null
          professor_code: string | null
          registered_at: string | null
          session_id: string | null
          session_name: string | null
          student_latitude: number
          student_longitude: number
          student_major: string
          student_name: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          device_fingerprint: string
          distance_from_classroom?: number | null
          id?: string
          ip_address?: string | null
          is_valid_location?: boolean | null
          professor_code?: string | null
          registered_at?: string | null
          session_id?: string | null
          session_name?: string | null
          student_latitude: number
          student_longitude: number
          student_major: string
          student_name: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          device_fingerprint?: string
          distance_from_classroom?: number | null
          id?: string
          ip_address?: string | null
          is_valid_location?: boolean | null
          professor_code?: string | null
          registered_at?: string | null
          session_id?: string | null
          session_name?: string | null
          student_latitude?: number
          student_longitude?: number
          student_major?: string
          student_name?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "attendance_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_sessions: {
        Row: {
          classroom_latitude: number
          classroom_longitude: number
          classroom_radius_meters: number | null
          course_id: string | null
          created_at: string | null
          duration_minutes: number
          ends_at: string | null
          id: string
          is_active: boolean | null
          professor_id: string
          professor_name: string
          session_name: string
          started_at: string | null
        }
        Insert: {
          classroom_latitude: number
          classroom_longitude: number
          classroom_radius_meters?: number | null
          course_id?: string | null
          created_at?: string | null
          duration_minutes: number
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          professor_id: string
          professor_name: string
          session_name: string
          started_at?: string | null
        }
        Update: {
          classroom_latitude?: number
          classroom_longitude?: number
          classroom_radius_meters?: number | null
          course_id?: string | null
          created_at?: string | null
          duration_minutes?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean | null
          professor_id?: string
          professor_name?: string
          session_name?: string
          started_at?: string | null
        }
        Relationships: []
      }
      device_fingerprints: {
        Row: {
          fingerprint_hash: string
          id: string
          registered_at: string | null
          session_id: string
          student_name: string
          user_id: string
        }
        Insert: {
          fingerprint_hash: string
          id?: string
          registered_at?: string | null
          session_id: string
          student_name: string
          user_id: string
        }
        Update: {
          fingerprint_hash?: string
          id?: string
          registered_at?: string | null
          session_id?: string
          student_name?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      professor_codes: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          permissions: Json | null
          professor_email: string
          professor_id: string
          professor_name: string
          unique_code: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          permissions?: Json | null
          professor_email: string
          professor_id: string
          professor_name: string
          unique_code: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          permissions?: Json | null
          professor_email?: string
          professor_id?: string
          professor_name?: string
          unique_code?: string
        }
        Relationships: []
      }
      professor_meetings: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          link: string
          professor_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          link: string
          professor_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          link?: string
          professor_id?: string
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          major: string | null
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          major?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          major?: string | null
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      students_grades: {
        Row: {
          course_id: string | null
          created_at: string
          degree: string | null
          final: number | null
          id: string
          midterm: number | null
          professor_id: string
          quiz1: number | null
          quiz2: number | null
          rating: number | null
          student_major: string | null
          student_name: string
          sum: number | null
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          degree?: string | null
          final?: number | null
          id?: string
          midterm?: number | null
          professor_id: string
          quiz1?: number | null
          quiz2?: number | null
          rating?: number | null
          student_major?: string | null
          student_name: string
          sum?: number | null
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          degree?: string | null
          final?: number | null
          id?: string
          midterm?: number | null
          professor_id?: string
          quiz1?: number | null
          quiz2?: number | null
          rating?: number | null
          student_major?: string | null
          student_name?: string
          sum?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      system_announcements: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          message: string
          target_role: Database["public"]["Enums"]["app_role"] | null
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          target_role?: Database["public"]["Enums"]["app_role"] | null
          title?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      get_professor_by_code: {
        Args: { p_code: string }
        Returns: {
          professor_id: string
          professor_name: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "professor" | "admin"
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
      app_role: ["student", "professor", "admin"],
    },
  },
} as const
