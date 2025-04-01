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
      profiles: {
        Row: {
          age: number | null
          allergies: string[] | null
          created_at: string
          email: string | null
          first_name: string | null
          gender: Database["public"]["Enums"]["gender"] | null
          goal: Database["public"]["Enums"]["goal_type"] | null
          height: number | null
          id: string
          last_name: string | null
          medical_conditions: string[] | null
          onboarding_completed: boolean | null
          updated_at: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          allergies?: string[] | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          goal?: Database["public"]["Enums"]["goal_type"] | null
          height?: number | null
          id: string
          last_name?: string | null
          medical_conditions?: string[] | null
          onboarding_completed?: boolean | null
          updated_at?: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          allergies?: string[] | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          gender?: Database["public"]["Enums"]["gender"] | null
          goal?: Database["public"]["Enums"]["goal_type"] | null
          height?: number | null
          id?: string
          last_name?: string | null
          medical_conditions?: string[] | null
          onboarding_completed?: boolean | null
          updated_at?: string
          weight?: number | null
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
      gender: "male" | "female" | "other"
      goal_type: "weight_loss" | "muscle_gain" | "maintenance" | "health_improvement"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
} 