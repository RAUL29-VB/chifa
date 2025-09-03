import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePos } from '../../context/PosContext';
import { useAppwriteSync } from '../../hooks/useAppwriteSync';
import { cashRegisterService } from '../../services/cashRegisterService';
import { settingsService } from '../../services/settingsService';
import BillingSection from './BillingSection';
import TakeawaySection from './TakeawaySection';
import { 
  Calculator, 
  DollarSign, 
  LogOut,
  Search,
  Clock,
  BarChart3,
  ShoppingBag,
  X,
  Menu
} from 'lucide-react';

function CajeroInterface() {
  const [activeTab, setActiveTab] = useState('billing');
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchTable, setSearchTable] = useState('');
  const [showCloseCashModal, setShowCloseCashModal] = useState(false);
  const [countedAmount, setCountedAmount] = useState('');
  const [currentCashRegister, setCurrentCashRegister] = useState<any>(null);
  const [settingsAmount, setSettingsAmount] = useState(0);
  
  const { user, logout } = useAuth();
  const { state, dispatch } = usePos();
  useAppwriteSync(); // Sincronización con Appwrite

  useEffect(() => {
    loadCashRegisterData();
  }, []);

  const loadCashRegisterData = async () => {
    try {
      const [cashData, settings] = await Promise.all([
        cashRegisterService.getCurrentCashRegister(),
        settingsService.getSettings()
      ]);
      
      setCurrentCashRegister(cashData);
      setSettingsAmount(settings?.cashInitialAmount || 0);
      
      if (cashData && cashData.isOpen) {
        // Hay caja abierta
        dispatch({ 
          type: 'SYNC_CASH_REGISTER', 
          cashRegister: {
            isOpen: true,
            initialAmount: cashData.initialAmount,
            currentAmount: cashData.currentAmount,
            totalSales: cashData.totalSales,
            openedAt: cashData.openedAt
          }
        });
      } else {
        // No hay caja abierta, resetear estado
        dispatch({ 
          type: 'SYNC_CASH_REGISTER', 
          cashRegister: {
            isOpen: false,
            initialAmount: 0,
            currentAmount: 0,
            totalSales: 0
          }
        });
      }
    } catch (error) {
      console.error('Error cargando datos de caja:', error);
    }
  };



  const occupiedTables = state.tables.filter(table => table.status === 'ocupada' || table.status === 'cuenta');
  const takeawayOrders = state.orders.filter(order => order.tableNumber === 0 && order.status === 'abierta' && order.waiterName === 'Para Llevar');
  
  const filteredTables = searchTable 
    ? occupiedTables.filter(table => table.number.toString().includes(searchTable))
    : occupiedTables;



  const handlePaymentComplete = async () => {
    setSelectedTable(null);
    // Recargar datos de caja después de cada venta
    await loadCashRegisterData();
  };

  const [showOpenCashModal, setShowOpenCashModal] = useState(false);

  const openCashRegister = async () => {
    try {
      const amount = settingsAmount || 50;
      
      const success = await cashRegisterService.openCashRegister(amount, user?.name || 'Cajero');
      if (success) {
        dispatch({ type: 'OPEN_CASH_REGISTER', amount });
        await loadCashRegisterData();
        setShowOpenCashModal(true);
      } else {
        alert('Error al abrir la caja');
      }
    } catch (error) {
      console.error('Error opening cash register:', error);
      alert('Error al abrir la caja');
    }
  };

  const closeCashRegister = () => {
    setShowCloseCashModal(true);
  };

  const confirmCloseCash = async () => {
    const counted = parseFloat(countedAmount);
    const expected = state.cashRegister.currentAmount;
    const difference = counted - expected;
    
    try {
      const currentCash = await cashRegisterService.getCurrentCashRegister();
      if (currentCash?.id) {
        const success = await cashRegisterService.closeCashRegister(currentCash.id);
        if (success) {
          dispatch({ type: 'CLOSE_CASH_REGISTER' });
          await loadCashRegisterData();
          setShowCloseCashModal(false);
          setCountedAmount('');
          
          const message = difference === 0 
            ? 'Caja cerrada correctamente. Montos coinciden.' 
            : `Caja cerrada. Diferencia: S/ ${difference.toFixed(2)} ${difference > 0 ? '(sobrante)' : '(faltante)'}`;
          
          alert(message);
        } else {
          alert('Error al cerrar la caja');
        }
      }
    } catch (error) {
      console.error('Error closing cash register:', error);
      alert('Error al cerrar la caja');
    }
  };

  const tabs = [
    { id: 'billing', name: 'Facturación', icon: Calculator },
    { id: 'takeaway', name: 'Para Llevar', icon: ShoppingBag },
    { id: 'cash', name: 'Gestión de Caja', icon: DollarSign },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <Menu className="w-6 h-6" />
            </button>
            
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-2 sm:p-3 rounded-xl shadow-lg">
              <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Punto de Venta
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Cajero: {user?.name} • {new Date().toLocaleDateString('es-PE')}</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-gray-800">POS</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className={`px-2 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium shadow-sm ${
              (currentCashRegister && currentCashRegister.isOpen) 
                ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200' 
                : 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200'
            }`}>
              <span className="hidden sm:inline">Caja: </span>{(currentCashRegister && currentCashRegister.isOpen) ? 'Abierta' : 'Cerrada'}
            </div>
            <button
              onClick={logout}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 text-gray-600 hover:text-red-600 transition-all duration-200 hover:bg-red-50 rounded-lg font-medium"
            >
              <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
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
                      setSidebarOpen(false);
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

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'billing' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="p-4 sm:p-6 border-b border-gray-200">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4">Mesas con Cuenta</h3>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Buscar mesa..."
                      value={searchTable}
                      onChange={(e) => setSearchTable(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                </div>
                <div className="p-4 sm:p-6 space-y-4 max-h-96 overflow-y-auto">
                  {filteredTables.map((table) => {
                    const tableOrder = state.orders.find(order => 
                      order.tableNumber === table.number && order.status === 'abierta'
                    );
                    return (
                      <button
                        key={table.id}
                        onClick={() => setSelectedTable(table.id)}
                        className={`w-full p-4 sm:p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${
                          selectedTable === table.id
                            ? 'border-red-500 bg-gradient-to-r from-red-50 to-red-100 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-base sm:text-lg text-gray-800">Mesa {table.number}</div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">{tableOrder?.items.length || 0} productos</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xl sm:text-2xl text-gray-800">S/ {(tableOrder?.total || 0).toFixed(2)}</div>
                            <div className={`text-xs px-3 py-1 rounded-full font-medium mt-2 ${
                              table.status === 'cuenta' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {table.status === 'cuenta' ? 'Pidiendo cuenta' : 'Ocupada'}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  
                  {takeawayOrders.map((order) => {
                    const allItemsReady = order.items.every(item => item.status === 'listo');
                    return (
                      <button
                        key={order.id}
                        onClick={() => setSelectedTable(order.id)}
                        className={`w-full p-4 sm:p-6 rounded-2xl border-2 text-left transition-all duration-200 hover:shadow-lg transform hover:scale-105 ${
                          selectedTable === order.id
                            ? 'border-red-500 bg-gradient-to-r from-red-50 to-red-100 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300 bg-white'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-bold text-base sm:text-lg text-gray-800 flex items-center space-x-2">
                              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span>Para Llevar</span>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-1">{order.items.length} productos</div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-xl sm:text-2xl text-gray-800">S/ {order.total.toFixed(2)}</div>
                            <div className={`text-xs px-3 py-1 rounded-full font-medium mt-2 ${
                              allItemsReady 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-orange-100 text-orange-800'
                            }`}>
                              {allItemsReady ? 'Listo para cobrar' : 'En cocina'}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  
                  {filteredTables.length === 0 && takeawayOrders.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Calculator className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">
                        {searchTable ? 'No se encontraron mesas' : 'No hay órdenes pendientes'}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                <div className="p-4 sm:p-6">
                  <BillingSection 
                    selectedTable={selectedTable} 
                    onPaymentComplete={handlePaymentComplete}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'takeaway' && <TakeawaySection />}

          {activeTab === 'cash' && (
            <div className="max-w-4xl mx-auto space-y-6 lg:space-y-8">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Gestión de Caja</h2>
              
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">Estado de Caja</h3>
                  <div className={`px-4 py-2 rounded-xl text-sm font-medium ${
                    (currentCashRegister && currentCashRegister.isOpen) 
                      ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border border-green-200' 
                      : 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border border-red-200'
                  }`}>
                    {(currentCashRegister && currentCashRegister.isOpen) ? 'Abierta' : 'Cerrada'}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 lg:mb-8">
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-6 rounded-2xl border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-600 font-medium mb-2">Monto Inicial</p>
                    <p className="text-2xl sm:text-3xl font-bold text-gray-800">S/ {(currentCashRegister?.initialAmount || settingsAmount)?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-4 sm:p-6 rounded-2xl border border-green-200">
                    <p className="text-xs sm:text-sm text-green-700 font-medium mb-2">Ventas del Día</p>
                    <p className="text-2xl sm:text-3xl font-bold text-green-800">S/ {(currentCashRegister?.totalSales || state.cashRegister.totalSales || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 sm:p-6 rounded-2xl border border-blue-200 sm:col-span-2 lg:col-span-1">
                    <p className="text-xs sm:text-sm text-blue-700 font-medium mb-2">Total Esperado</p>
                    <p className="text-2xl sm:text-3xl font-bold text-blue-800">S/ {currentCashRegister?.currentAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
                  {(!currentCashRegister || !currentCashRegister.isOpen) ? (
                    <button
                      onClick={openCashRegister}
                      className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <DollarSign className="w-5 h-5" />
                      <span>Abrir Caja</span>
                    </button>
                  ) : (
                    <button
                      onClick={closeCashRegister}
                      className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center space-x-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                    >
                      <Clock className="w-5 h-5" />
                      <span>Cerrar Caja</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Ventas del Día</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 sm:py-4 font-bold text-gray-700 text-sm sm:text-base">Mesa</th>
                        <th className="text-left py-3 sm:py-4 font-bold text-gray-700 text-sm sm:text-base">Total</th>
                        <th className="text-left py-3 sm:py-4 font-bold text-gray-700 text-sm sm:text-base hidden sm:table-cell">Método</th>
                        <th className="text-left py-3 sm:py-4 font-bold text-gray-700 text-sm sm:text-base hidden md:table-cell">Hora</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const todayOrders = state.orders.filter(o => o.status === 'cerrada');
                        return todayOrders.map((order) => (
                          <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                            <td className="py-3 sm:py-4 font-semibold text-gray-800 text-sm sm:text-base">
                              {order.tableNumber === 0 ? 'Para Llevar' : `Mesa ${order.tableNumber}`}
                            </td>
                            <td className="py-3 sm:py-4 font-bold text-green-600 text-base sm:text-lg">S/ {order.total.toFixed(2)}</td>
                            <td className="py-3 sm:py-4 hidden sm:table-cell">
                              <span className="px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                                {order.paymentMethod || 'efectivo'}
                              </span>
                            </td>
                            <td className="py-3 sm:py-4 text-gray-600 text-sm hidden md:table-cell">
                              {new Date(order.timestamp).toLocaleTimeString()}
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                  </table>
                  
                  {state.orders.filter(o => o.status === 'cerrada').length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No hay ventas registradas hoy</p>
                      <p className="text-sm text-gray-400 mt-2">Total órdenes en estado: {state.orders.length}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {showOpenCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex justify-between items-center rounded-t-3xl">
              <h3 className="text-2xl font-bold">¡Caja Abierta!</h3>
              <button
                onClick={() => setShowOpenCashModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 text-center">
              <div className="bg-green-50 rounded-2xl p-6 mb-4">
                <DollarSign className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <p className="text-lg text-gray-700 mb-2">Caja abierta exitosamente</p>
                <p className="text-3xl font-bold text-green-600">S/ {settingsAmount?.toFixed(2)}</p>
              </div>
              
              <button
                onClick={() => setShowOpenCashModal(false)}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {showCloseCashModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-6 flex justify-between items-center rounded-t-3xl">
              <h3 className="text-2xl font-bold">Cerrar Caja</h3>
              <button
                type="button"
                onClick={() => setShowCloseCashModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-xl transition-colors"
                aria-label="Cerrar modal"
                title="Cerrar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">Monto esperado en sistema:</p>
                  <p className="text-3xl font-bold text-gray-800">S/ {(currentCashRegister?.currentAmount || 0).toFixed(2)}</p>
                </div>
                
                <label className="block text-sm font-bold text-gray-700 mb-3">
                  Monto real contado:
                </label>
                <input
                  type="text"
                  inputMode="decimal"
                  value={countedAmount}
                  onChange={(e) => setCountedAmount(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-lg font-semibold"
                  placeholder="0.00"
                  autoFocus
                />
                
                {countedAmount && (
                  <div className="mt-4 p-4 bg-gray-50 rounded-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700 font-medium">Diferencia:</span>
                      <span className={`font-bold text-xl ${
                        parseFloat(countedAmount) - (currentCashRegister?.currentAmount || 0) === 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        S/ {(parseFloat(countedAmount) - (currentCashRegister?.currentAmount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={() => setShowCloseCashModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmCloseCash}
                  disabled={!countedAmount}
                  className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  Cerrar Caja
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CajeroInterface;