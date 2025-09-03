import { createContext, useContext, useState, ReactNode } from 'react';
import { supabaseService } from '../services/supabaseService';

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'cajero' | 'mozo' | 'cocina';
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Demo users for testing
const demoUsers: (User & { password: string })[] = [
  { id: '1', name: 'Admin Raul', role: 'admin', email: 'admin@chefcito.com', password: 'admin123' },
  { id: '2', name: 'Cajero Ana', role: 'cajero', email: 'cajero@chefcito.com', password: 'cajero123' },
  { id: '3', name: 'Mozo Carlos', role: 'mozo', email: 'mozo@chefcito.com', password: 'mozo123' },
  { id: '4', name: 'Chef Miguel', role: 'cocina', email: 'cocina@chefcito.com', password: 'cocina123' }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Intentar con usuarios de Supabase
      const users = await supabaseService.getUsers();
      const foundUser = users.find(u => u.email === email && u.password === password);
      
      if (foundUser) {
        // Obtener empleado para determinar el rol
        const employees = await supabaseService.getEmployees();
        const employee = employees.find(emp => emp.id === foundUser.employee_id);
        const role = employee?.position?.toLowerCase() as 'admin' | 'cajero' | 'mozo' | 'cocina' || 'cajero';
        
        setUser({
          id: foundUser.id!,
          name: foundUser.name,
          email: foundUser.email,
          role: role === 'administrador' ? 'admin' : role
        });
        return true;
      }
      
      // Si no se encuentra en Supabase, usar usuarios demo
      const demoUser = demoUsers.find(u => u.email === email && u.password === password);
      if (demoUser) {
        const { password: _, ...userWithoutPassword } = demoUser;
        setUser(userWithoutPassword);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error during login:', error);
      // En caso de error, usar solo usuarios demo
      const foundUser = demoUsers.find(u => u.email === email && u.password === password);
      if (foundUser) {
        const { password: _, ...userWithoutPassword } = foundUser;
        setUser(userWithoutPassword);
        return true;
      }
      return false;
    }
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}