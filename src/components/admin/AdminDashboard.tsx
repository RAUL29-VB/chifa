import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePos } from '../../context/PosContext';
import { useAppwriteSync } from '../../hooks/useAppwriteSync';

import { 
  BarChart3, 
  Users, 
  UserCheck,
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Settings,
  LogOut,
  Table,
  Menu,
  X,
  AlertTriangle,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import UserManagement from './UserManagement';
import StaffManagement from './StaffManagement';
import PayrollManagement from './PayrollManagement';
import MenuManagement from './MenuManagement';
import TableManagement from './TableManagement';
import ReportsManagement from './ReportsManagement';
import SettingsManagement from './SettingsManagement';
import { PrinterTest } from '../PrinterTest';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Estados compartidos para empleados y asistencia
  const [employees, setEmployees] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  const { user, logout } = useAuth();
  const { state } = usePos();
  useAppwriteSync(); // Sincronización con Appwrite


  // Sample data for charts
  const salesData = [
    { name: 'Lun', ventas: 1200 },
    { name: 'Mar', ventas: 1900 },
    { name: 'Mié', ventas: 1500 },
    { name: 'Jue', ventas: 2100 },
    { name: 'Vie', ventas: 2800 },
    { name: 'Sáb', ventas: 3200 },
    { name: 'Dom', ventas: 2400 }
  ];

  const categoryData = [
    { name: 'Platos de Fondo', value: 35, color: '#ef4444' },
    { name: 'Arroces y Tallarines', value: 25, color: '#f97316' },
    { name: 'Sopas', value: 20, color: '#eab308' },
    { name: 'Entradas', value: 15, color: '#22c55e' },
    { name: 'Bebidas', value: 5, color: '#3b82f6' }
  ];











  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
    { id: 'menu', name: 'Menú', icon: ShoppingBag },
    { id: 'tables', name: 'Mesas', icon: Table },
    { id: 'users', name: 'Usuarios', icon: Users },
    { id: 'staff', name: 'Personal', icon: UserCheck },
    { id: 'payroll', name: 'Pagos', icon: DollarSign },
    { id: 'reports', name: 'Reportes', icon: TrendingUp },
    { id: 'settings', name: 'Configuración', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-2 sm:p-3 rounded-xl shadow-lg">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Panel de Administración
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Chifa Chefcito • {user?.name}</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-gray-800">Admin</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 px-2 sm:px-4 py-2 rounded-xl border border-green-200">
              <div className="text-xs sm:text-sm text-green-700 font-medium">Ventas Hoy</div>
              <div className="text-lg sm:text-2xl font-bold text-green-800">S/ {state.dailySales.toFixed(2)}</div>
            </div>
            

            
            <button
              onClick={logout}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-red-600 transition-all duration-200 hover:bg-red-50 rounded-lg"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline font-medium">Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Sidebar */}
        <nav className={`
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 fixed lg:static inset-y-0 left-0 z-50
          w-64 lg:w-72 bg-white shadow-xl min-h-screen border-r border-gray-200
          transition-transform duration-300 ease-in-out
        `}>
          <div className="p-4 lg:p-6">
            <div className="space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSidebarOpen(false); // Close mobile sidebar on selection
                    }}
                    className={`w-full flex items-center space-x-3 px-3 lg:px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg transform scale-105'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-red-600 hover:shadow-md'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm lg:text-base">{tab.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 lg:ml-0">
          {activeTab === 'dashboard' && (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium">Órdenes Hoy</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-800">{state.stats.todayOrders}</p>
                    </div>
                    <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 sm:p-3 rounded-xl">
                      <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium">Promedio por Orden</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-800">S/ {state.stats.avgOrderValue.toFixed(2)}</p>
                    </div>
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-2 sm:p-3 rounded-xl">
                      <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium">Mesas Ocupadas</p>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-800">
                        {state.tables.filter(t => t.status === 'ocupada').length}
                      </p>
                    </div>
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-2 sm:p-3 rounded-xl">
                      <Users className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-xs sm:text-sm font-medium">Hora Pico</p>
                      <p className="text-lg sm:text-xl font-bold text-gray-800">{state.stats.peakHour}</p>
                    </div>
                    <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-2 sm:p-3 rounded-xl">
                      <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Ventas por Día</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                        }} 
                      />
                      <Bar dataKey="ventas" fill="url(#colorGradient)" radius={[4, 4, 0, 0]} />
                      <defs>
                        <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#dc2626" stopOpacity={0.7}/>
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Ventas por Categoría</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'menu' && <MenuManagement />}

          {activeTab === 'tables' && <TableManagement />}

          {activeTab === 'users' && <UserManagement />}

          {activeTab === 'staff' && (
            <StaffManagement 
              onEmployeesChange={setEmployees}
              onAttendanceChange={setAttendance}
            />
          )}

          {activeTab === 'payroll' && <PayrollManagement employees={employees} attendance={attendance} />}

          {activeTab === 'reports' && <ReportsManagement />}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              <PrinterTest />
              <SettingsManagement />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;