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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      daily_learning_progress: {
        Row: {
          answered_at: string | null
          flashcard_id: string
          id: string
          rating: string | null
          session_id: string
          was_new_card: boolean | null
        }
        Insert: {
          answered_at?: string | null
          flashcard_id: string
          id?: string
          rating?: string | null
          session_id: string
          was_new_card?: boolean | null
        }
        Update: {
          answered_at?: string | null
          flashcard_id?: string
          id?: string
          rating?: string | null
          session_id?: string
          was_new_card?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_learning_progress_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "due_flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_learning_progress_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "daily_learning_progress_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "daily_learning_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_learning_sessions: {
        Row: {
          cards_learned: number | null
          cards_studied: number | null
          deck_ids: string[]
          ended_at: string | null
          id: string
          lesson_id: string | null
          new_cards_today: number | null
          review_cards_today: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          cards_learned?: number | null
          cards_studied?: number | null
          deck_ids: string[]
          ended_at?: string | null
          id?: string
          lesson_id?: string | null
          new_cards_today?: number | null
          review_cards_today?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          cards_learned?: number | null
          cards_studied?: number | null
          deck_ids?: string[]
          ended_at?: string | null
          id?: string
          lesson_id?: string | null
          new_cards_today?: number | null
          review_cards_today?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_learning_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "learning_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      decks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcards: {
        Row: {
          answer: string
          correct_count: number | null
          created_at: string
          creation_method: Database["public"]["Enums"]["creation_method"]
          deck_id: string
          easiness_factor: number
          edit_percentage: number | null
          id: string
          interval: number
          last_learned_at: string | null
          learning_status: string | null
          next_review_date: string
          original_answer: string | null
          original_question: string | null
          question: string
          repetition_count: number
          updated_at: string
          user_id: string
        }
        Insert: {
          answer: string
          correct_count?: number | null
          created_at?: string
          creation_method: Database["public"]["Enums"]["creation_method"]
          deck_id: string
          easiness_factor?: number
          edit_percentage?: number | null
          id?: string
          interval?: number
          last_learned_at?: string | null
          learning_status?: string | null
          next_review_date?: string
          original_answer?: string | null
          original_question?: string | null
          question: string
          repetition_count?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          answer?: string
          correct_count?: number | null
          created_at?: string
          creation_method?: Database["public"]["Enums"]["creation_method"]
          deck_id?: string
          easiness_factor?: number
          edit_percentage?: number | null
          id?: string
          interval?: number
          last_learned_at?: string | null
          learning_status?: string | null
          next_review_date?: string
          original_answer?: string | null
          original_question?: string | null
          question?: string
          repetition_count?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "deck_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_lessons: {
        Row: {
          created_at: string | null
          daily_new_cards_limit: number | null
          deck_ids: string[]
          description: string | null
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_new_cards_limit?: number | null
          deck_ids?: string[]
          description?: string | null
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_new_cards_limit?: number | null
          deck_ids?: string[]
          description?: string | null
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_history: {
        Row: {
          flashcard_id: string
          id: string
          rating: Database["public"]["Enums"]["review_rating"]
          reviewed_at: string
          session_id: string
        }
        Insert: {
          flashcard_id: string
          id?: string
          rating: Database["public"]["Enums"]["review_rating"]
          reviewed_at?: string
          session_id: string
        }
        Update: {
          flashcard_id?: string
          id?: string
          rating?: Database["public"]["Enums"]["review_rating"]
          reviewed_at?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_history_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "due_flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_history_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_history_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "review_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      review_sessions: {
        Row: {
          cards_reviewed: number
          deck_id: string
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          cards_reviewed?: number
          deck_id: string
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          cards_reviewed?: number
          deck_id?: string
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_sessions_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "deck_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_sessions_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      daily_active_users: {
        Row: {
          active_users: number | null
          activity_date: string | null
          total_cards_reviewed: number | null
          total_sessions: number | null
        }
        Relationships: []
      }
      daily_statistics: {
        Row: {
          cards_due_today: number | null
          cards_in_progress: number | null
          cards_learned_today: number | null
          cards_learned_total: number | null
          cards_to_learn: number | null
          last_study_date: string | null
          study_days_last_month: number | null
          user_id: string | null
        }
        Relationships: []
      }
      deck_statistics: {
        Row: {
          created_at: string | null
          description: string | null
          due_cards: number | null
          id: string | null
          last_reviewed_at: string | null
          name: string | null
          total_cards: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: []
      }
      due_flashcards: {
        Row: {
          answer: string | null
          created_at: string | null
          creation_method: Database["public"]["Enums"]["creation_method"] | null
          deck_id: string | null
          deck_name: string | null
          easiness_factor: number | null
          edit_percentage: number | null
          id: string | null
          interval: number | null
          next_review_date: string | null
          original_answer: string | null
          original_question: string | null
          question: string | null
          repetition_count: number | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "deck_statistics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcards_deck_id_fkey"
            columns: ["deck_id"]
            isOneToOne: false
            referencedRelation: "decks"
            referencedColumns: ["id"]
          },
        ]
      }
      user_statistics: {
        Row: {
          ai_acceptance_rate: number | null
          ai_creation_ratio: number | null
          ai_flashcards: number | null
          manual_flashcards: number | null
          member_since: string | null
          total_decks: number | null
          total_flashcards: number | null
          total_reviews: number | null
          total_sessions: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_study_streak: { Args: { p_user_id: string }; Returns: number }
      get_daily_learning_cards: {
        Args: {
          p_deck_ids: string[]
          p_new_cards_limit?: number
          p_user_id: string
        }
        Returns: {
          answer: string
          correct_count: number
          deck_id: string
          deck_name: string
          id: string
          is_due: boolean
          is_new: boolean
          learning_status: string
          next_review_date: string
          question: string
        }[]
      }
    }
    Enums: {
      creation_method: "ai" | "manual"
      review_rating: "again" | "hard" | "good" | "easy"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      creation_method: ["ai", "manual"],
      review_rating: ["again", "hard", "good", "easy"],
    },
  },
} as const
