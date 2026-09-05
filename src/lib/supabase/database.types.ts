export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string;
          currency: Database["public"]["Enums"]["currency_code"];
          id: string;
          initial_balance: number;
          is_default: boolean;
          is_demo: boolean;
          name: string;
          type: Database["public"]["Enums"]["account_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          id?: string;
          initial_balance?: number;
          is_default?: boolean;
          is_demo?: boolean;
          name: string;
          type?: Database["public"]["Enums"]["account_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          id?: string;
          initial_balance?: number;
          is_default?: boolean;
          is_demo?: boolean;
          name?: string;
          type?: Database["public"]["Enums"]["account_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      budgets: {
        Row: {
          alert_threshold: number;
          amount: number;
          category_id: string;
          created_at: string;
          currency: Database["public"]["Enums"]["currency_code"];
          id: string;
          is_demo: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          alert_threshold?: number;
          amount: number;
          category_id: string;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          id?: string;
          is_demo?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          alert_threshold?: number;
          amount?: number;
          category_id?: string;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          id?: string;
          is_demo?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          color: string;
          created_at: string;
          icon: string;
          id: string;
          is_default: boolean;
          kind: Database["public"]["Enums"]["category_kind"];
          name: string;
          slug: string | null;
          sort_order: number;
          user_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          is_default?: boolean;
          kind?: Database["public"]["Enums"]["category_kind"];
          name: string;
          slug?: string | null;
          sort_order?: number;
          user_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          icon?: string;
          id?: string;
          is_default?: boolean;
          kind?: Database["public"]["Enums"]["category_kind"];
          name?: string;
          slug?: string | null;
          sort_order?: number;
          user_id?: string;
        };
        Relationships: [];
      };
      debts: {
        Row: {
          counterparty: string | null;
          created_at: string;
          currency: Database["public"]["Enums"]["currency_code"];
          direction: Database["public"]["Enums"]["debt_direction"];
          due_date: string | null;
          id: string;
          is_demo: boolean;
          is_settled: boolean;
          monthly_payment: number | null;
          name: string;
          notes: string | null;
          principal: number;
          settled_at: string | null;
          start_date: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          counterparty?: string | null;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          direction?: Database["public"]["Enums"]["debt_direction"];
          due_date?: string | null;
          id?: string;
          is_demo?: boolean;
          is_settled?: boolean;
          monthly_payment?: number | null;
          name: string;
          notes?: string | null;
          principal: number;
          settled_at?: string | null;
          start_date?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          counterparty?: string | null;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          direction?: Database["public"]["Enums"]["debt_direction"];
          due_date?: string | null;
          id?: string;
          is_demo?: boolean;
          is_settled?: boolean;
          monthly_payment?: number | null;
          name?: string;
          notes?: string | null;
          principal?: number;
          settled_at?: string | null;
          start_date?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      income: {
        Row: {
          amount: number;
          created_at: string;
          currency: Database["public"]["Enums"]["currency_code"];
          frequency: Database["public"]["Enums"]["recurrence_frequency"] | null;
          id: string;
          is_active: boolean;
          is_demo: boolean;
          is_recurring: boolean;
          is_variable: boolean;
          label: string;
          pay_day: number | null;
          type: Database["public"]["Enums"]["income_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          amount: number;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          frequency?: Database["public"]["Enums"]["recurrence_frequency"] | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          is_recurring?: boolean;
          is_variable?: boolean;
          label: string;
          pay_day?: number | null;
          type?: Database["public"]["Enums"]["income_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          amount?: number;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          frequency?: Database["public"]["Enums"]["recurrence_frequency"] | null;
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          is_recurring?: boolean;
          is_variable?: boolean;
          label?: string;
          pay_day?: number | null;
          type?: Database["public"]["Enums"]["income_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string;
          created_at: string;
          dedupe_key: string;
          id: string;
          is_read: boolean;
          kind: string;
          severity: Database["public"]["Enums"]["notification_severity"];
          title: string;
          user_id: string;
        };
        Insert: {
          body?: string;
          created_at?: string;
          dedupe_key: string;
          id?: string;
          is_read?: boolean;
          kind: string;
          severity?: Database["public"]["Enums"]["notification_severity"];
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          dedupe_key?: string;
          id?: string;
          is_read?: boolean;
          kind?: string;
          severity?: Database["public"]["Enums"]["notification_severity"];
          title?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          created_at: string;
          display_name: string | null;
          id: string;
          onboarding_completed: boolean;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name?: string | null;
          id: string;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string | null;
          id?: string;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          created_at: string;
          endpoint: string;
          id: string;
          last_used_at: string | null;
          p256dh: string;
          user_agent: string | null;
          user_id: string;
        };
        Insert: {
          auth: string;
          created_at?: string;
          endpoint: string;
          id?: string;
          last_used_at?: string | null;
          p256dh: string;
          user_agent?: string | null;
          user_id: string;
        };
        Update: {
          auth?: string;
          created_at?: string;
          endpoint?: string;
          id?: string;
          last_used_at?: string | null;
          p256dh?: string;
          user_agent?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      recurring_expenses: {
        Row: {
          amount: number;
          category_id: string | null;
          created_at: string;
          currency: Database["public"]["Enums"]["currency_code"];
          day_of_month: number | null;
          frequency: Database["public"]["Enums"]["recurrence_frequency"];
          id: string;
          is_active: boolean;
          is_demo: boolean;
          name: string;
          next_date: string;
          payment_method: Database["public"]["Enums"]["payment_method"];
          updated_at: string;
          user_id: string;
          weekdays: number[] | null;
        };
        Insert: {
          amount: number;
          category_id?: string | null;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          day_of_month?: number | null;
          frequency?: Database["public"]["Enums"]["recurrence_frequency"];
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          name: string;
          next_date?: string;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          updated_at?: string;
          user_id: string;
          weekdays?: number[] | null;
        };
        Update: {
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          day_of_month?: number | null;
          frequency?: Database["public"]["Enums"]["recurrence_frequency"];
          id?: string;
          is_active?: boolean;
          is_demo?: boolean;
          name?: string;
          next_date?: string;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          updated_at?: string;
          user_id?: string;
          weekdays?: number[] | null;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      savings_goals: {
        Row: {
          created_at: string;
          currency: Database["public"]["Enums"]["currency_code"];
          icon: string;
          id: string;
          initial_amount: number;
          is_archived: boolean;
          is_completed: boolean;
          is_demo: boolean;
          kind: Database["public"]["Enums"]["goal_kind"];
          monthly_contribution: number | null;
          name: string;
          target_amount: number;
          target_date: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          icon?: string;
          id?: string;
          initial_amount?: number;
          is_archived?: boolean;
          is_completed?: boolean;
          is_demo?: boolean;
          kind?: Database["public"]["Enums"]["goal_kind"];
          monthly_contribution?: number | null;
          name: string;
          target_amount: number;
          target_date?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          icon?: string;
          id?: string;
          initial_amount?: number;
          is_archived?: boolean;
          is_completed?: boolean;
          is_demo?: boolean;
          kind?: Database["public"]["Enums"]["goal_kind"];
          monthly_contribution?: number | null;
          name?: string;
          target_amount?: number;
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      settings: {
        Row: {
          created_at: string;
          currency: Database["public"]["Enums"]["currency_code"];
          exchange_rates: Json;
          locale: string;
          notifications_enabled: boolean;
          theme: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          exchange_rates?: Json;
          locale?: string;
          notifications_enabled?: boolean;
          theme?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          exchange_rates?: Json;
          locale?: string;
          notifications_enabled?: boolean;
          theme?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      transactions: {
        Row: {
          account_id: string | null;
          amount: number;
          category_id: string | null;
          created_at: string;
          currency: Database["public"]["Enums"]["currency_code"];
          date: string;
          debt_id: string | null;
          description: string;
          id: string;
          income_id: string | null;
          is_demo: boolean;
          notes: string | null;
          payment_method: Database["public"]["Enums"]["payment_method"];
          recurring_expense_id: string | null;
          savings_goal_id: string | null;
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          account_id?: string | null;
          amount: number;
          category_id?: string | null;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          date?: string;
          debt_id?: string | null;
          description?: string;
          id?: string;
          income_id?: string | null;
          is_demo?: boolean;
          notes?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          recurring_expense_id?: string | null;
          savings_goal_id?: string | null;
          type: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          account_id?: string | null;
          amount?: number;
          category_id?: string | null;
          created_at?: string;
          currency?: Database["public"]["Enums"]["currency_code"];
          date?: string;
          debt_id?: string | null;
          description?: string;
          id?: string;
          income_id?: string | null;
          is_demo?: boolean;
          notes?: string | null;
          payment_method?: Database["public"]["Enums"]["payment_method"];
          recurring_expense_id?: string | null;
          savings_goal_id?: string | null;
          type?: Database["public"]["Enums"]["transaction_type"];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_debt_id_fkey";
            columns: ["debt_id"];
            isOneToOne: false;
            referencedRelation: "debts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_income_id_fkey";
            columns: ["income_id"];
            isOneToOne: false;
            referencedRelation: "income";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_recurring_expense_id_fkey";
            columns: ["recurring_expense_id"];
            isOneToOne: false;
            referencedRelation: "recurring_expenses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_savings_goal_id_fkey";
            columns: ["savings_goal_id"];
            isOneToOne: false;
            referencedRelation: "savings_goals";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      ensure_user_bootstrap: { Args: never; Returns: undefined };
      seed_default_categories: { Args: { p_user: string }; Returns: undefined };
    };
    Enums: {
      account_type: "cash" | "bank" | "mobile_money" | "other";
      category_kind: "expense" | "income" | "saving";
      currency_code: "USD" | "CDF" | "EUR" | "GBP";
      debt_direction: "owed" | "lent";
      goal_kind: "phone" | "car" | "travel" | "house" | "emergency" | "custom";
      income_type: "salary" | "bonus" | "freelance" | "business" | "gift" | "other";
      notification_severity: "info" | "success" | "warning" | "danger";
      payment_method: "cash" | "card" | "mobile_money" | "transfer" | "other";
      recurrence_frequency: "daily" | "weekly" | "monthly" | "yearly";
      transaction_type: "expense" | "income" | "saving";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;
type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof DefaultSchema["Tables"]> = DefaultSchema["Tables"][T]["Update"];
export type Enums<T extends keyof DefaultSchema["Enums"]> = DefaultSchema["Enums"][T];

export const Constants = {
  public: {
    Enums: {
      account_type: ["cash", "bank", "mobile_money", "other"],
      category_kind: ["expense", "income", "saving"],
      currency_code: ["USD", "CDF", "EUR", "GBP"],
      debt_direction: ["owed", "lent"],
      goal_kind: ["phone", "car", "travel", "house", "emergency", "custom"],
      income_type: ["salary", "bonus", "freelance", "business", "gift", "other"],
      notification_severity: ["info", "success", "warning", "danger"],
      payment_method: ["cash", "card", "mobile_money", "transfer", "other"],
      recurrence_frequency: ["daily", "weekly", "monthly", "yearly"],
      transaction_type: ["expense", "income", "saving"],
    },
  },
} as const;
