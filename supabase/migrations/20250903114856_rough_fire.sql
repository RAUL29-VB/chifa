/*
  # Sistema POS - Esquema completo de base de datos

  1. Nuevas Tablas
    - `categories` - Categorías del menú (Entradas, Platos principales, etc.)
    - `menu_items` - Productos del menú con precios y características
    - `tables` - Mesas del restaurante con capacidad y estado
    - `employees` - Personal del restaurante
    - `positions` - Cargos y salarios del personal
    - `users` - Usuarios del sistema con credenciales
    - `attendance` - Registro de asistencia del personal
    - `orders` - Órdenes de los clientes
    - `cash_register` - Control de caja diaria
    - `settings` - Configuración general del sistema

  2. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas para usuarios autenticados
    - Acceso completo para operaciones CRUD

  3. Características
    - UUIDs como claves primarias
    - Timestamps automáticos
    - Valores por defecto apropiados
    - Restricciones de integridad referencial
*/

-- Categorías del menú
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Productos del menú
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL,
  description text DEFAULT '',
  preparation_time integer DEFAULT 10,
  is_spicy boolean DEFAULT false,
  is_vegetarian boolean DEFAULT false,
  available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Mesas del restaurante
CREATE TABLE IF NOT EXISTS tables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number integer UNIQUE NOT NULL,
  capacity integer NOT NULL DEFAULT 4,
  status text DEFAULT 'libre' CHECK (status IN ('libre', 'ocupada', 'servido', 'cuenta', 'limpieza')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Cargos del personal
CREATE TABLE IF NOT EXISTS positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  dayly_salary decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Personal del restaurante
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  position text NOT NULL,
  dni text UNIQUE NOT NULL,
  status text DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo', 'vacaciones')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Usuarios del sistema
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid REFERENCES employees(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password text NOT NULL,
  status text DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Registro de asistencia
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  entry_time time,
  exit_time time,
  created_at timestamptz DEFAULT now(),
  UNIQUE(employee_id, date)
);

-- Órdenes de clientes
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_number integer NOT NULL DEFAULT 0,
  items jsonb NOT NULL DEFAULT '[]',
  total decimal(10,2) NOT NULL DEFAULT 0,
  status text DEFAULT 'abierta' CHECK (status IN ('abierta', 'cerrada')),
  timestamp timestamptz DEFAULT now(),
  waiter_id text,
  waiter_name text,
  customer_count integer DEFAULT 1,
  payment_method text CHECK (payment_method IN ('efectivo', 'tarjeta', 'yape', 'plin')),
  discount decimal(10,2) DEFAULT 0,
  tip decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Control de caja
CREATE TABLE IF NOT EXISTS cash_register (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  is_open boolean DEFAULT false,
  initial_amount decimal(10,2) NOT NULL DEFAULT 0,
  current_amount decimal(10,2) NOT NULL DEFAULT 0,
  total_sales decimal(10,2) DEFAULT 0,
  opened_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  opened_by text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Configuración del sistema
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cash_initial_amount decimal(10,2) DEFAULT 200.00,
  restaurant_name text DEFAULT 'Chifa Chefcito',
  restaurant_address text DEFAULT 'Jr. Pedro Villon N°223, Barrio San Juan',
  restaurant_phone text DEFAULT '956 663 491',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Habilitar RLS en todas las tablas
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_register ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad (acceso completo para desarrollo)
CREATE POLICY "Allow all operations on categories" ON categories FOR ALL USING (true);
CREATE POLICY "Allow all operations on menu_items" ON menu_items FOR ALL USING (true);
CREATE POLICY "Allow all operations on tables" ON tables FOR ALL USING (true);
CREATE POLICY "Allow all operations on positions" ON positions FOR ALL USING (true);
CREATE POLICY "Allow all operations on employees" ON employees FOR ALL USING (true);
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on attendance" ON attendance FOR ALL USING (true);
CREATE POLICY "Allow all operations on orders" ON orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on cash_register" ON cash_register FOR ALL USING (true);
CREATE POLICY "Allow all operations on settings" ON settings FOR ALL USING (true);

-- Insertar datos iniciales
INSERT INTO categories (name, order_index) VALUES
  ('Entradas', 1),
  ('Aeropuertos', 2),
  ('Chaufas', 3),
  ('Combinados', 4),
  ('Platos Especiales', 5),
  ('Platos Dulces', 6),
  ('Sopas', 7),
  ('Gaseosas', 8),
  ('Bebidas Calientes', 9),
  ('Tallarines', 10)
ON CONFLICT (name) DO NOTHING;

-- Insertar cargos iniciales
INSERT INTO positions (name, dayly_salary) VALUES
  ('Administrador', 60.00),
  ('Cajero', 50.00),
  ('Mozo', 45.00),
  ('Cocina', 50.00)
ON CONFLICT (name) DO NOTHING;

-- Insertar mesas iniciales
INSERT INTO tables (number, capacity) VALUES
  (1, 4), (2, 4), (3, 6), (4, 2), (5, 4), (6, 6), (7, 4), (8, 2),
  (9, 4), (10, 6), (11, 4), (12, 2), (13, 4), (14, 6), (15, 4), (16, 2)
ON CONFLICT (number) DO NOTHING;

-- Insertar configuración inicial
INSERT INTO settings (cash_initial_amount, restaurant_name, restaurant_address, restaurant_phone) VALUES
  (200.00, 'Chifa Chefcito', 'Jr. Pedro Villon N°223, Barrio San Juan', '956 663 491')
ON CONFLICT DO NOTHING;

-- Insertar algunos productos de ejemplo
INSERT INTO menu_items (name, price, category, description, preparation_time, is_spicy, is_vegetarian, available) VALUES
  ('Wantán Frito', 8.00, 'Entradas', 'Deliciosos wantanes fritos rellenos', 10, false, false, true),
  ('Aeropuerto de Pollo', 18.00, 'Aeropuertos', 'Tallarines saltados con pollo y verduras', 15, false, false, true),
  ('Arroz Chaufa Especial', 15.00, 'Chaufas', 'Arroz frito con pollo, cerdo y camarones', 12, false, false, true),
  ('Combinado Familiar', 25.00, 'Combinados', 'Arroz chaufa + tallarín saltado', 20, false, false, true),
  ('Sopa Wantán', 12.00, 'Sopas', 'Sopa tradicional con wantanes', 15, false, false, true),
  ('Inca Kola 500ml', 3.50, 'Gaseosas', 'Bebida gaseosa nacional', 1, false, true, true),
  ('Té Chino', 2.00, 'Bebidas Calientes', 'Té tradicional chino', 5, false, true, true)
ON CONFLICT (name) DO NOTHING;