import { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import { menuService } from '../../services/menuService';
import { 
  BarChart3, 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Star,
  Users,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function ReportsManagement() {
  const { state } = usePos();
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReportsData();
  }, []);

  const loadReportsData = async () => {
    try {
      const [employeesData, attendanceData, menuData, positionsData] = await Promise.all([
        menuService.getEmployees(),
        menuService.getAttendance(),
        menuService.getMenuItems(),
        menuService.getPositions()
      ]);
      
      setEmployees(employeesData);
      setAttendance(attendanceData);
      setMenuItems(menuData);
      setPositions(positionsData);
    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calcular datos reales
  const getWeeklySalesData = () => {
    const today = new Date();
    const weekData = [];
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayName = days[date.getDay()];
      
      // Ventas reales (por ahora 0 hasta implementar sistema de órdenes)
      const ventas = 0;
      weekData.push({ name: dayName, ventas });
    }
    
    return weekData;
  };

  const getTopProducts = () => {
    if (menuItems.length === 0) return [];
    return menuItems.slice(0, 5).map((item, index) => ({
      name: item.name,
      sales: 0,
      change: '0%',
      color: ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-blue-500'][index]
    }));
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(att => att.date === today && att.entryTime && att.exitTime);
    
    return {
      todayOrders: 0,
      dailySales: 0,
      avgOrderValue: 0,
      activeTables: todayAttendance.length
    };
  };

  const salesData = getWeeklySalesData();
  const topProducts = getTopProducts();
  const todayStats = getTodayStats();

  return (
    <div className="space-y-6 lg:space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Reportes y Estadísticas</h2>
            <p className="text-sm sm:text-base text-gray-600 mt-1">Análisis detallado del rendimiento del restaurante</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            <label htmlFor="report-timeframe" className="sr-only">Seleccionar período de tiempo</label>
            <select id="report-timeframe" className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-sm sm:text-base">
              <option>Hoy</option>
              <option>Esta Semana</option>
              <option>Este Mes</option>
            </select>
            <button className="bg-gradient-to-r from-red-600 to-red-700 text-white px-3 sm:px-4 py-2 rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base">
              <BarChart3 className="w-4 h-4" />
              <span>Exportar</span>
            </button>
          </div>
        </div>
        
        {/* KPIs principales */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
              <span className="text-xs text-blue-600 font-medium">0%</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-blue-800">{todayStats.todayOrders}</div>
            <div className="text-xs sm:text-sm text-blue-600 font-medium">Órdenes Hoy</div>
          </div>
          <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 sm:p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
              <span className="text-xs text-green-600 font-medium">0%</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-green-800">S/ {todayStats.dailySales.toFixed(2)}</div>
            <div className="text-xs sm:text-sm text-green-600 font-medium">Ventas Totales</div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 sm:p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
              <span className="text-xs text-purple-600 font-medium">0%</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-purple-800">S/ {todayStats.avgOrderValue.toFixed(2)}</div>
            <div className="text-xs sm:text-sm text-purple-600 font-medium">Ticket Promedio</div>
          </div>
          <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-4 sm:p-6 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
              <span className="text-xs text-orange-600 font-medium">0%</span>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-orange-800">{todayStats.activeTables}</div>
            <div className="text-xs sm:text-sm text-orange-600 font-medium">Mesas Activas</div>
          </div>
        </div>
      </div>

      {/* Gráficos y análisis */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:gap-8">
        {/* Ventas por hora */}
        <div className="xl:col-span-2 bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-2 sm:space-y-0">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center space-x-2">
              <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
              <span>Ventas por Día</span>
            </h3>
            <div className="flex items-center space-x-2 text-xs sm:text-sm text-gray-600">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>Esta semana</span>
            </div>
          </div>
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
              <Bar dataKey="ventas" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top productos */}
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center space-x-2">
            <Star className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            <span>Top Productos</span>
          </h3>
          <div className="space-y-4">
            {topProducts.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <div className={`w-3 h-3 rounded-full ${item.color} flex-shrink-0`}></div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-800 text-xs sm:text-sm truncate">{item.name}</div>
                    <div className="text-xs text-gray-600">{item.sales} vendidos</div>
                  </div>
                </div>
                <span className="text-xs font-medium text-green-600 flex-shrink-0">{item.change}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Estado de caja y resumen */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center space-x-2">
            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            <span>Estado de Caja</span>
          </h3>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 rounded-xl border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-green-700 font-medium">Estado Actual</span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  state.cashRegister.isOpen 
                    ? 'bg-green-500 text-white' 
                    : 'bg-red-500 text-white'
                }`}>
                  {state.cashRegister.isOpen ? 'ABIERTA' : 'CERRADA'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-gray-800">S/ {state.cashRegister.initialAmount.toFixed(2)}</div>
                <div className="text-xs sm:text-sm text-gray-600">Monto Inicial</div>
              </div>
              <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                <div className="text-xl sm:text-2xl font-bold text-green-600">S/ {state.cashRegister.totalSales.toFixed(2)}</div>
                <div className="text-xs sm:text-sm text-gray-600">Ventas del Día</div>
              </div>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-3 sm:p-4 rounded-xl border border-blue-200">
              <div className="text-2xl sm:text-3xl font-bold text-blue-800">S/ {state.cashRegister.currentAmount.toFixed(2)}</div>
              <div className="text-xs sm:text-sm text-blue-600 font-medium">Total Esperado en Caja</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center space-x-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" />
            <span>Análisis de Horarios</span>
          </h3>
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 p-3 sm:p-4 rounded-xl border border-yellow-200">
              <div className="text-xl sm:text-2xl font-bold text-yellow-800">--:--</div>
              <div className="text-xs sm:text-sm text-yellow-600 font-medium">Hora Pico</div>
            </div>
            <div className="space-y-3">
              {[
                { time: '12:00 - 14:00', orders: 0, bar: 'w-0' },
                { time: '19:00 - 21:00', orders: 0, bar: 'w-0' },
                { time: '14:00 - 16:00', orders: 0, bar: 'w-0' },
                { time: '21:00 - 23:00', orders: 0, bar: 'w-0' }
              ].map((slot, index) => (
                <div key={index} className="">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{slot.time}</span>
                    <span className="text-xs sm:text-sm text-gray-600">{slot.orders} órdenes</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className={`bg-red-500 h-2 rounded-full ${slot.bar}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportsManagement;