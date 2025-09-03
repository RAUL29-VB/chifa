import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos de base de datos
export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          name: string;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          order_index?: number;
          created_at?: string;
        };
      };
      menu_items: {
        Row: {
          id: string;
          name: string;
          price: number;
          category: string;
          description: string;
          preparation_time: number;
          is_spicy: boolean;
          is_vegetarian: boolean;
          available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          price: number;
          category: string;
          description?: string;
          preparation_time?: number;
          is_spicy?: boolean;
          is_vegetarian?: boolean;
          available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          price?: number;
          category?: string;
          description?: string;
          preparation_time?: number;
          is_spicy?: boolean;
          is_vegetarian?: boolean;
          available?: boolean;
          updated_at?: string;
        };
      };
      tables: {
        Row: {
          id: string;
          number: number;
          capacity: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          number: number;
          capacity: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          number?: number;
          capacity?: number;
          status?: string;
          updated_at?: string;
        };
      };
      employees: {
        Row: {
          id: string;
          name: string;
          phone: string;
          position: string;
          dni: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          position: string;
          dni: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          position?: string;
          dni?: string;
          status?: string;
          updated_at?: string;
        };
      };
      positions: {
        Row: {
          id: string;
          name: string;
          dayly_salary: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          dayly_salary: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          dayly_salary?: number;
        };
      };
      users: {
        Row: {
          id: string;
          employee_id: string;
          name: string;
          email: string;
          password: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          name: string;
          email: string;
          password: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          name?: string;
          email?: string;
          password?: string;
          status?: string;
          updated_at?: string;
        };
      };
      attendance: {
        Row: {
          id: string;
          employee_id: string;
          date: string;
          entry_time: string | null;
          exit_time: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          employee_id: string;
          date: string;
          entry_time?: string | null;
          exit_time?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          employee_id?: string;
          date?: string;
          entry_time?: string | null;
          exit_time?: string | null;
        };
      };
      orders: {
        Row: {
          id: string;
          table_number: number;
          items: any;
          total: number;
          status: string;
          timestamp: string;
          waiter_id: string | null;
          waiter_name: string | null;
          customer_count: number;
          payment_method: string | null;
          discount: number;
          tip: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          table_number: number;
          items: any;
          total: number;
          status?: string;
          timestamp?: string;
          waiter_id?: string | null;
          waiter_name?: string | null;
          customer_count?: number;
          payment_method?: string | null;
          discount?: number;
          tip?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          table_number?: number;
          items?: any;
          total?: number;
          status?: string;
          timestamp?: string;
          waiter_id?: string | null;
          waiter_name?: string | null;
          customer_count?: number;
          payment_method?: string | null;
          discount?: number;
          tip?: number;
          updated_at?: string;
        };
      };
      cash_register: {
        Row: {
          id: string;
          is_open: boolean;
          initial_amount: number;
          current_amount: number;
          total_sales: number;
          opened_at: string;
          closed_at: string | null;
          opened_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          is_open: boolean;
          initial_amount: number;
          current_amount: number;
          total_sales?: number;
          opened_at?: string;
          closed_at?: string | null;
          opened_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          is_open?: boolean;
          initial_amount?: number;
          current_amount?: number;
          total_sales?: number;
          opened_at?: string;
          closed_at?: string | null;
          opened_by?: string;
        };
      };
      settings: {
        Row: {
          id: string;
          cash_initial_amount: number;
          restaurant_name: string;
          restaurant_address: string;
          restaurant_phone: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          cash_initial_amount?: number;
          restaurant_name?: string;
          restaurant_address?: string;
          restaurant_phone?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          cash_initial_amount?: number;
          restaurant_name?: string;
          restaurant_address?: string;
          restaurant_phone?: string;
          updated_at?: string;
        };
      };
    };
  };
}