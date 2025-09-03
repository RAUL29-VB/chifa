import { supabase } from '../lib/supabase';

export interface MenuItem {
  id?: string;
  name: string;
  price: number;
  category: string;
  description: string;
  preparation_time: number;
  is_spicy: boolean;
  is_vegetarian: boolean;
  available: boolean;
}

export interface Category {
  id?: string;
  name: string;
  order_index?: number;
}

export interface Employee {
  id?: string;
  name: string;
  phone: string;
  position: string;
  dni: string;
  status: 'activo' | 'inactivo' | 'vacaciones';
}

export interface Position {
  id?: string;
  name: string;
  dayly_salary: number;
}

export interface User {
  id?: string;
  employee_id: string;
  name: string;
  email: string;
  password: string;
  status: 'activo' | 'inactivo';
}

export interface Attendance {
  id?: string;
  employee_id: string;
  date: string;
  entry_time?: string | null;
  exit_time?: string | null;
}

export interface Order {
  id?: string;
  table_number: number;
  items: any;
  total: number;
  status: 'abierta' | 'cerrada';
  timestamp: string;
  waiter_id?: string | null;
  waiter_name?: string | null;
  customer_count: number;
  payment_method?: string | null;
  discount?: number;
  tip?: number;
}

export interface Table {
  id?: string;
  number: number;
  capacity: number;
  status: 'libre' | 'ocupada' | 'servido' | 'cuenta' | 'limpieza';
}

export interface CashRegister {
  id?: string;
  is_open: boolean;
  initial_amount: number;
  current_amount: number;
  total_sales: number;
  opened_at: string;
  closed_at?: string | null;
  opened_by: string;
}

export interface Settings {
  id?: string;
  cash_initial_amount: number;
  restaurant_name: string;
  restaurant_address: string;
  restaurant_phone: string;
}

export const supabaseService = {
  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async createMenuItem(item: Omit<MenuItem, 'id'>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .insert([{
        ...item,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateMenuItem(id: string, item: Partial<MenuItem>): Promise<MenuItem> {
    const { data, error } = await supabase
      .from('menu_items')
      .update({
        ...item,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteMenuItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_index');
    
    if (error) throw error;
    return data || [];
  },

  async createCategory(category: Omit<Category, 'id'>): Promise<Category> {
    const { data, error } = await supabase
      .from('categories')
      .insert([category])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Tables
  async getTables(): Promise<Table[]> {
    const { data, error } = await supabase
      .from('tables')
      .select('*')
      .order('number');
    
    if (error) throw error;
    return data || [];
  },

  async createTable(table: Omit<Table, 'id'>): Promise<Table> {
    const { data, error } = await supabase
      .from('tables')
      .insert([{
        ...table,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTable(id: string, table: Partial<Table>): Promise<Table> {
    const { data, error } = await supabase
      .from('tables')
      .update({
        ...table,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTable(id: string): Promise<void> {
    const { error } = await supabase
      .from('tables')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Employees
  async getEmployees(): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async createEmployee(employee: Omit<Employee, 'id'>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert([{
        ...employee,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateEmployee(id: string, employee: Partial<Employee>): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update({
        ...employee,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteEmployee(id: string): Promise<void> {
    const { error } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Positions
  async getPositions(): Promise<Position[]> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async createPosition(position: Omit<Position, 'id'>): Promise<Position> {
    const { data, error } = await supabase
      .from('positions')
      .insert([position])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updatePosition(id: string, position: Partial<Position>): Promise<Position> {
    const { data, error } = await supabase
      .from('positions')
      .update(position)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deletePosition(id: string): Promise<void> {
    const { error } = await supabase
      .from('positions')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Users
  async getUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data || [];
  },

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...user,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...user,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteUser(id: string): Promise<void> {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Attendance
  async getAttendance(): Promise<Attendance[]> {
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createAttendance(attendance: Omit<Attendance, 'id'>): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendance')
      .insert([attendance])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateAttendance(id: string, attendance: Partial<Attendance>): Promise<Attendance> {
    const { data, error } = await supabase
      .from('attendance')
      .update(attendance)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createOrder(order: Omit<Order, 'id'>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .insert([{
        ...order,
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateOrder(id: string, order: Partial<Order>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update({
        ...order,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Cash Register
  async getCashRegister(): Promise<CashRegister | null> {
    const { data, error } = await supabase
      .from('cash_register')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async createCashRegister(cashRegister: Omit<CashRegister, 'id'>): Promise<CashRegister> {
    const { data, error } = await supabase
      .from('cash_register')
      .insert([cashRegister])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateCashRegister(id: string, cashRegister: Partial<CashRegister>): Promise<CashRegister> {
    const { data, error } = await supabase
      .from('cash_register')
      .update(cashRegister)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Settings
  async getSettings(): Promise<Settings | null> {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    // Primero intentar obtener configuración existente
    const existing = await this.getSettings();
    
    if (existing?.id) {
      const { data, error } = await supabase
        .from('settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } else {
      const { data, error } = await supabase
        .from('settings')
        .insert([{
          cash_initial_amount: 200.00,
          restaurant_name: 'Chifa Chefcito',
          restaurant_address: 'Jr. Pedro Villon N°223, Barrio San Juan',
          restaurant_phone: '956 663 491',
          ...settings,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    }
  }
};