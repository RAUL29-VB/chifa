import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePos } from '../../context/PosContext';
import { usePrinter } from '../../hooks/usePrinter';
import { useAppwriteSync } from '../../hooks/useAppwriteSync';
import { 
  Users, 
  Plus, 
  Minus, 
  Send, 
  FileText, 
  LogOut,
  ShoppingCart,
  Check,
  X,
  StickyNote,
  Clock,
  Flame,
  Leaf,
  Search
} from 'lucide-react';

function MozoInterface() {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Entradas');
  const [orderNotes, setOrderNotes] = useState<Record<string, string>>({});
  const [customerCount, setCustomerCount] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState<{
    type: 'success' | 'error' | 'confirm';
    title: string;
    message: string;
    onConfirm?: () => void;
  } | null>(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const isProcessing = useRef(false);
  
  const { user, logout } = useAuth();
  const { state, dispatch } = usePos();
  const { printKitchenTicket, isPrinting } = usePrinter();
  useAppwriteSync(); // Sincronización con Appwrite

  const selectedTableData = selectedTable ? state.tables.find(t => t.id === selectedTable) : null;
  const availableItems = state.menuItems.filter(item => 
    item.available && 
    (searchTerm === '' ? item.category === selectedCategory : item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addItemToTable = (item: typeof state.menuItems[0]) => {
    if (!selectedTable || !user) return;

    const orderItem = {
      ...item,
      quantity: 1,
      status: 'nuevo' as const,
      orderId: `temp-${Date.now()}`,
      notes: orderNotes[item.id] || undefined
    };

    dispatch({ 
      type: 'ADD_ITEM_TO_TABLE', 
      tableId: selectedTable, 
      item: orderItem 
    });

    if (orderNotes[item.id]) {
      setOrderNotes(prev => ({ ...prev, [item.id]: '' }));
    }
  };

  const sendOrderToKitchen = () => {
    if (!selectedTable || !selectedTableData || !user) return;
    
    if (selectedTableData.currentOrder.length === 0) {
      setShowModal({
        type: 'error',
        title: 'Error',
        message: 'No hay productos en la orden'
      });
      return;
    }

    setShowModal({
      type: 'confirm',
      title: 'Confirmar Envío',
      message: `¿Enviar orden de Mesa ${selectedTableData.number} a cocina?`,
      onConfirm: async () => {
        if (isProcessing.current) return;
        isProcessing.current = true;

        try {
          // 1. Guardar en Appwrite primero
          const { menuService } = await import('../../services/menuService');
          const appwriteOrder = await menuService.createOrder({
            tableNumber: selectedTableData.number,
            items: JSON.stringify(selectedTableData.currentOrder),
            total: selectedTableData.total,
            status: 'abierta',
            timestamp: new Date().toISOString(),
            waiterId: user.id,
            waiterName: user.name,
            customerCount: customerCount
          });

          // 2. Actualizar estado local con el ID de Appwrite
          const newOrder = {
            id: appwriteOrder.$id,
            tableNumber: selectedTableData.number,
            items: selectedTableData.currentOrder.map(item => ({ 
              ...item, 
              orderId: appwriteOrder.$id,
              startTime: new Date()
            })),
            total: selectedTableData.total,
            status: 'abierta' as const,
            timestamp: new Date(),
            waiterId: user.id,
            waiterName: user.name,
            customerCount: customerCount,
          };

          dispatch({ type: 'ADD_TAKEAWAY_ORDER', order: newOrder });
          
          // Actualizar mesa en Appwrite
          await menuService.updateTable(selectedTable, {
            status: 'ocupada'
          });
          
          // Actualizar la mesa: limpiar orden local pero mantener ocupada
          const updatedTable = {
            ...selectedTableData,
            currentOrder: [],
            total: 0,
            waiterName: user.name,
            customerCount: customerCount,
            status: 'ocupada' as const
          };
          
          dispatch({
            type: 'SYNC_TABLES',
            tables: state.tables.map(t => 
              t.id === selectedTable ? updatedTable : t
            )
          });

          // 3. Imprimir ticket
          const success = await printKitchenTicket({
            orderNumber: `MESA-${selectedTableData.number}-${appwriteOrder.$id.slice(-6)}`,
            items: selectedTableData.currentOrder.map(item => ({
              name: item.name,
              quantity: item.quantity,
              notes: item.notes
            })),
            table: `Mesa ${selectedTableData.number}`,
            waiter: user.name,
            time: new Date().toLocaleString()
          });

          setShowModal({
            type: 'success',
            title: '¡Éxito!',
            message: 'Orden enviada a cocina exitosamente'
          });
        } catch (error) {
          console.error('Error:', error);
          setShowModal({
            type: 'error',
            title: 'Error',
            message: 'Error al enviar la orden'
          });
        } finally {
          isProcessing.current = false;
        }
      }
    });
  };

  const markAsServed = async () => {
    if (!selectedTable || !selectedTableData) return;
    
    const tableOrder = state.orders.find(order => 
      order.tableNumber === selectedTableData.number && order.status === 'abierta'
    );
    
    if (!tableOrder) {
      setShowModal({
        type: 'error',
        title: 'No se puede marcar',
        message: 'No hay orden activa para esta mesa.'
      });
      return;
    }
    
    const allItemsReady = tableOrder.items.every(item => item.status === 'listo');
    if (!allItemsReady) {
      setShowModal({
        type: 'error',
        title: 'No se puede marcar',
        message: 'No todos los platos están listos. Verifica con cocina.'
      });
      return;
    }
    
    setShowModal({
      type: 'confirm',
      title: 'Marcar como Servido',
      message: `¿Confirmar que Mesa ${selectedTableData.number} ha sido servida?`,
      onConfirm: async () => {
        try {
          // Actualizar mesa en Appwrite
          const { menuService } = await import('../../services/menuService');
          await menuService.updateTable(selectedTable, {
            status: 'servido'
          });
          
          dispatch({ type: 'MARK_ORDER_AS_SERVED', orderId: tableOrder.id });
          setShowModal({
            type: 'success',
            title: '¡Excelente!',
            message: 'Mesa marcada como servida'
          });
        } catch (error) {
          console.error('Error updating table:', error);
          setShowModal({
            type: 'error',
            title: 'Error',
            message: 'Error al actualizar el estado de la mesa'
          });
        }
      }
    });
  };

  const requestBill = async () => {
    if (!selectedTable || !selectedTableData) return;
    
    if (selectedTableData.status !== 'servido') {
      setShowModal({
        type: 'error',
        title: 'Acción no permitida',
        message: 'Primero debes marcar la mesa como servida'
      });
      return;
    }
    
    setShowModal({
      type: 'confirm',
      title: 'Solicitar Cuenta',
      message: `¿Solicitar cuenta para Mesa ${selectedTableData.number}?`,
      onConfirm: async () => {
        try {
          // Actualizar mesa en Appwrite
          const { menuService } = await import('../../services/menuService');
          await menuService.updateTable(selectedTable, {
            status: 'cuenta'
          });
          
          dispatch({ 
            type: 'UPDATE_TABLE_STATUS', 
            tableId: selectedTable, 
            status: 'cuenta' 
          });
          
          setShowModal({
            type: 'success',
            title: '¡Listo!',
            message: 'Cuenta solicitada. El cajero será notificado.'
          });
        } catch (error) {
          console.error('Error updating table:', error);
          setShowModal({
            type: 'error',
            title: 'Error',
            message: 'Error al solicitar la cuenta'
          });
        }
      }
    });
  };

  const updateItemQuantity = (itemId: string, orderId: string, newQuantity: number) => {
    if (!selectedTable) return;
    
    if (newQuantity <= 0) {
      removeItemFromTable(itemId, orderId);
    } else {
      dispatch({
        type: 'UPDATE_ITEM_QUANTITY',
        tableId: selectedTable,
        itemId,
        orderId,
        quantity: newQuantity
      });
    }
  };

  const removeItemFromTable = (itemId: string, orderId: string) => {
    if (!selectedTable) return;
    
    dispatch({
      type: 'REMOVE_ITEM_FROM_TABLE',
      tableId: selectedTable,
      itemId,
      orderId
    });
  };

  const getTableStatusColor = (status: string) => {
    switch (status) {
      case 'libre': return 'border-green-400 bg-gradient-to-r from-green-50 to-green-100 text-green-800 hover:from-green-100 hover:to-green-200';
      case 'ocupada': return 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 hover:from-yellow-100 hover:to-yellow-200';
      case 'servido': return 'border-blue-400 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 hover:from-blue-100 hover:to-blue-200';
      case 'cuenta': return 'border-red-400 bg-gradient-to-r from-red-50 to-red-100 text-red-800 hover:from-red-100 hover:to-red-200';
      case 'limpieza': return 'border-gray-400 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 hover:from-gray-100 hover:to-gray-200';
      default: return 'border-gray-400 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 hover:from-gray-100 hover:to-gray-200';
    }
  };

  const getTableStatusText = (status: string) => {
    switch (status) {
      case 'libre': return 'Libre';
      case 'ocupada': return 'Ocupada';
      case 'servido': return 'Servido';
      case 'cuenta': return 'Cuenta';
      case 'limpieza': return 'Limpieza';
      default: return status;
    }
  };

  const getElapsedTime = (startTime?: Date) => {
    if (!startTime) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - startTime.getTime()) / 1000 / 60);
    return `${diff} min`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-2 sm:p-3 rounded-xl shadow-lg">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Mesa de Servicio
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Mozo: {user?.name} • {new Date().toLocaleDateString('es-PE')}</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-gray-800">Servicio</h1>
            </div>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 px-2 sm:px-4 py-2 rounded-xl border border-yellow-200 shadow-sm">
              <div className="text-xs sm:text-sm text-yellow-700 font-medium">Mesas Activas</div>
              <div className="font-bold text-lg sm:text-xl text-yellow-800">{state.tables.filter(t => t.status === 'ocupada').length}</div>
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

      {/* Mapa de Mesas Pantalla Completa */}
      <main className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 space-y-4 sm:space-y-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800 flex items-center space-x-2 sm:space-x-3">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
              <span>Mapa del Salón</span>
            </h2>
            <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full"></div>
                <span className="font-medium">Libre</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-yellow-500 rounded-full"></div>
                <span className="font-medium">Ocupada</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-blue-500 rounded-full"></div>
                <span className="font-medium">Servido</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-500 rounded-full"></div>
                <span className="font-medium">Cuenta</span>
              </div>
            </div>
          </div>
          
          {/* Grid de Mesas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
            {state.tables.map((table) => (
              <button
                key={table.id}
                onClick={() => {
                  setSelectedTable(table.id);
                  setShowTableModal(true);
                }}
                className={`aspect-square p-3 sm:p-4 lg:p-6 rounded-2xl sm:rounded-3xl border-2 sm:border-3 text-center transition-all duration-300 transform hover:scale-110 hover:shadow-2xl hover:-translate-y-2 ${
                  getTableStatusColor(table.status)
                } relative overflow-hidden`}
              >
                <div className="font-bold text-sm sm:text-lg lg:text-2xl mb-1 sm:mb-2">Mesa</div>
                <div className="font-bold text-2xl sm:text-3xl lg:text-4xl mb-1 sm:mb-2">{table.number}</div>
                
                <div className="text-xs sm:text-sm font-medium mb-1 sm:mb-2">
                  {getTableStatusText(table.status)}
                </div>
                
                <div className="text-xs opacity-75 mb-1 sm:mb-2">
                  {table.capacity} personas
                </div>
                
                {table.total > 0 && (
                  <div className="text-sm sm:text-base lg:text-lg font-bold">
                    S/ {table.total.toFixed(2)}
                  </div>
                )}
                
                {table.orderStartTime && (
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-white bg-opacity-90 rounded-full p-1 sm:p-2">
                    <div className="flex items-center space-x-1 text-xs font-bold">
                      <Clock className="w-2 h-2 sm:w-3 sm:h-3" />
                      <span className="hidden sm:inline">{getElapsedTime(table.orderStartTime)}</span>
                    </div>
                  </div>
                )}
                
                {table.waiterName && (
                  <div className="absolute bottom-1 sm:bottom-2 left-1 sm:left-2 right-1 sm:right-2 bg-white bg-opacity-90 rounded-lg p-1">
                    <div className="text-xs font-medium truncate">
                      {table.waiterName}
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Modal de Mesa */}
        {showTableModal && selectedTableData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
              <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 sm:p-6 flex justify-between items-center">
                <div>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">Mesa {selectedTableData.number}</h3>
                  <p className="text-red-100 text-sm sm:text-base">Estado: {getTableStatusText(selectedTableData.status)}</p>
                </div>
                <button
                  onClick={() => setShowTableModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-xl transition-colors"
                  aria-label="Cerrar modal de mesa"
                  title="Cerrar modal"
                >
                  <X className="w-6 h-6 sm:w-8 sm:h-8" />
                </button>
              </div>
              
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                  {/* Menú de Productos */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-4 sm:space-y-0">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-800">
                          Menú - Mesa {selectedTableData.number}
                        </h3>
                        <div className="flex items-center space-x-3">
                          <label className="text-sm font-bold text-gray-700">Comensales:</label>
                          <select 
                            value={customerCount} 
                            onChange={(e) => setCustomerCount(Number(e.target.value))}
                            className="px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent font-medium"
                            aria-label="Número de comensales"
                            title="Seleccionar número de comensales"
                          >
                            {Array.from({length: selectedTableData.capacity}, (_, i) => (
                              <option key={i+1} value={i+1}>{i+1}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                          type="text"
                          placeholder="Buscar platos..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>
                      
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {state.categories.map((category) => (
                          <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 transform hover:scale-105 ${
                              selectedCategory === category
                                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                                : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300 hover:shadow-md'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-h-80 sm:max-h-96 overflow-y-auto">
                      {availableItems.map((item) => (
                        <div key={item.id} className="border border-gray-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-white to-gray-50">
                          <div className="flex justify-between items-start mb-3 sm:mb-4">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h4 className="font-bold text-gray-800 text-base sm:text-lg">{item.name}</h4>
                                {item.isSpicy && <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />}
                                {item.isVegetarian && <Leaf className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />}
                              </div>
                              <p className="text-red-600 font-bold text-lg sm:text-2xl mb-2">S/ {item.price.toFixed(2)}</p>
                              {item.description && (
                                <p className="text-xs sm:text-sm text-gray-600 mb-3">{item.description}</p>
                              )}
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span className="font-medium">{item.preparationTime} min</span>
                              </div>
                            </div>
                            <button
                              onClick={() => addItemToTable(item)}
                              className="bg-gradient-to-r from-red-600 to-red-700 text-white p-3 sm:p-4 rounded-2xl hover:from-red-700 hover:to-red-800 transition-all duration-200 transform hover:scale-110 shadow-lg hover:shadow-xl"
                              aria-label={`Agregar ${item.name} a la orden`}
                              title={`Agregar ${item.name}`}
                            >
                              <Plus className="w-5 h-5 sm:w-6 sm:h-6" />
                            </button>
                          </div>
                          
                          <div className="flex items-center space-x-3 mt-4">
                            <StickyNote className="w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              placeholder="Notas especiales..."
                              value={orderNotes[item.id] || ''}
                              onChange={(e) => setOrderNotes(prev => ({ ...prev, [item.id]: e.target.value }))}
                              className="flex-1 text-sm px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200"
                            />
                          </div>
                        </div>
                      ))}
                      
                      {availableItems.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                          <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No hay productos disponibles en esta categoría</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Orden Actual */}
                  <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center space-x-2">
                        <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span>Orden Mesa {selectedTableData.number}</span>
                      </h3>
                      {selectedTableData.waiterName && (
                        <p className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">Atendido por: {selectedTableData.waiterName}</p>
                      )}
                    </div>

                    <div className="p-4 sm:p-6">
                      {selectedTableData.currentOrder.length > 0 ? (
                        <>
                          <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8 max-h-60 sm:max-h-72 overflow-y-auto">
                            {selectedTableData.currentOrder.map((item, index) => (
                              <div key={`${item.id}-${item.orderId}-${index}`} className="p-4 sm:p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border border-gray-200 hover:shadow-md transition-all duration-200">
                                <div className="flex justify-between items-start mb-3 sm:mb-4">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <h4 className="font-bold text-gray-800 text-base sm:text-lg">{item.name}</h4>
                                      {item.isSpicy && <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />}
                                      {item.isVegetarian && <Leaf className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />}
                                    </div>
                                    <p className="text-xs sm:text-sm text-gray-600 font-medium">S/ {item.price.toFixed(2)} c/u</p>
                                    {item.notes && (
                                      <p className="text-xs text-blue-600 mt-2 font-bold bg-blue-50 p-2 rounded-lg">📝 {item.notes}</p>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => removeItemFromTable(item.id, item.orderId)}
                                    className="text-red-600 hover:bg-red-100 p-2 rounded-lg transition-colors"
                                    aria-label={`Eliminar ${item.name} de la orden`}
                                    title="Eliminar producto"
                                  >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                  </button>
                                </div>
                                
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center space-x-2 sm:space-x-3">
                                    <button
                                      onClick={() => updateItemQuantity(item.id, item.orderId, item.quantity - 1)}
                                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                                      aria-label={`Reducir cantidad de ${item.name}`}
                                      title="Reducir cantidad"
                                    >
                                      <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                    <span className="bg-gradient-to-r from-red-100 to-red-200 text-red-800 px-3 sm:px-4 py-2 rounded-xl text-base sm:text-lg font-bold border border-red-300 min-w-[50px] sm:min-w-[60px] text-center">
                                      {item.quantity}
                                    </span>
                                    <button
                                      onClick={() => updateItemQuantity(item.id, item.orderId, item.quantity + 1)}
                                      className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                                      aria-label={`Aumentar cantidad de ${item.name}`}
                                      title="Aumentar cantidad"
                                    >
                                      <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                    </button>
                                  </div>
                                  <span className="font-bold text-lg sm:text-xl text-gray-800">
                                    S/ {(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          <div className="border-t border-gray-200 pt-4 sm:pt-6 mb-6 sm:mb-8 bg-gradient-to-r from-red-50 to-red-100 -mx-4 sm:-mx-6 px-4 sm:px-6 py-4 sm:py-6 rounded-2xl">
                            <div className="flex justify-between items-center text-2xl sm:text-3xl font-bold">
                              <span className="text-gray-700">Total:</span>
                              <span className="text-red-700">S/ {selectedTableData.total.toFixed(2)}</span>
                            </div>
                            <div className="text-xs sm:text-sm text-gray-600 mt-2 font-medium">
                              {selectedTableData.currentOrder.length} productos • {customerCount} comensales
                            </div>
                          </div>

                          <div className="space-y-3 sm:space-y-4">
                            {selectedTableData.currentOrder.length > 0 && (
                              <button
                                onClick={sendOrderToKitchen}
                                disabled={isPrinting}
                                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                                <span>{isPrinting ? 'Imprimiendo...' : 'Enviar a Cocina'}</span>
                              </button>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-12 sm:py-16 text-gray-500">
                          <ShoppingCart className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300" />
                          <h4 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-700">Orden Vacía</h4>
                          <p className="text-base sm:text-lg">Agrega productos del menú para comenzar la orden</p>
                        </div>
                      )}
                      
                      {/* Botones siempre visibles */}
                      <div className="space-y-3 sm:space-y-4 mt-6">
                        {(() => {
                          const tableOrder = state.orders.find(order => 
                            order.tableNumber === selectedTableData.number && order.status === 'abierta'
                          );
                          const allItemsReady = tableOrder ? tableOrder.items.every(item => item.status === 'listo') : false;
                          const hasOrder = tableOrder && tableOrder.items.length > 0;
                          
                          return (
                            <button
                              onClick={markAsServed}
                              disabled={!hasOrder || !allItemsReady}
                              className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-2xl transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg font-bold text-sm sm:text-base ${
                                hasOrder && allItemsReady
                                  ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 hover:shadow-xl transform hover:scale-105'
                                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              }`}
                            >
                              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                              <span>
                                {!hasOrder ? 'Sin orden activa' : 
                                 !allItemsReady ? 'Esperando cocina...' : 
                                 'Marcar como Servido'}
                              </span>
                            </button>
                          );
                        })()}
                        
                        {selectedTableData.status === 'servido' && (
                          <button
                            onClick={requestBill}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-bold text-sm sm:text-base"
                          >
                            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
                            <span>Pedir Cuenta</span>
                          </button>
                        )}
                        
                        {selectedTableData.status === 'cuenta' && (
                          <div className="bg-gradient-to-r from-yellow-50 to-yellow-100 border border-yellow-200 p-4 rounded-2xl text-center">
                            <p className="text-yellow-800 font-bold">⏳ Esperando pago en caja</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
            <div className="text-center">
              <div className={`mx-auto mb-6 w-16 h-16 rounded-full flex items-center justify-center ${
                showModal.type === 'success' ? 'bg-green-100' :
                showModal.type === 'error' ? 'bg-red-100' :
                'bg-blue-100'
              }`}>
                {showModal.type === 'success' && (
                  <Check className="w-8 h-8 text-green-600" />
                )}
                {showModal.type === 'error' && (
                  <X className="w-8 h-8 text-red-600" />
                )}
                {showModal.type === 'confirm' && (
                  <FileText className="w-8 h-8 text-blue-600" />
                )}
              </div>
              
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                {showModal.title}
              </h3>
              
              <p className="text-gray-600 mb-8 text-lg">
                {showModal.message}
              </p>
              
              <div className="flex space-x-4">
                {showModal.type === 'confirm' ? (
                  <>
                    <button
                      onClick={() => setShowModal(null)}
                      className="flex-1 px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => {
                        showModal.onConfirm?.();
                      }}
                      className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg"
                    >
                      Confirmar
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setShowModal(null)}
                    className={`w-full px-6 py-3 rounded-xl text-white font-medium shadow-lg transition-all duration-200 ${
                      showModal.type === 'success' 
                        ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                        : 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                    }`}
                  >
                    Entendido
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MozoInterface;