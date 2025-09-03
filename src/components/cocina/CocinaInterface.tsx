import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePos } from '../../context/PosContext';
import { menuService } from '../../services/menuService';
import { 
  ChefHat, 
  Clock, 
  CheckCircle, 
  PlayCircle, 
  LogOut,
  Bell,
  AlertCircle
} from 'lucide-react';

function CocinaInterface() {
  const { user, logout } = useAuth();
  const { state, dispatch } = usePos();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Cargar órdenes al iniciar y sincronizar cada 5 segundos
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const orders = await menuService.getOrders();
        const formattedOrders = orders
          .filter(order => order.status === 'abierta')
          .map(order => ({
            ...order,
            id: order.$id,
            timestamp: new Date(order.timestamp),
            items: JSON.parse(order.items)
          }));
        dispatch({ type: 'SYNC_ORDERS', orders: formattedOrders });
      } catch (error) {
        console.error('Error cargando órdenes:', error);
      }
    };
    
    // Cargar inmediatamente
    loadOrders();
    
    // Sincronizar cada 5 segundos
    const interval = setInterval(loadOrders, 5000);
    
    return () => clearInterval(interval);
  }, [dispatch]);

  // Filtrar órdenes abiertas
  const activeOrders = state.orders.filter(order => order.status === 'abierta');

  // Audio notification for new orders (mock implementation)
  useEffect(() => {
    const newOrdersCount = activeOrders.length;
    if (newOrdersCount > 0) {
      // In a real implementation, you would play an actual sound here
      console.log('🔔 Nueva orden en cocina');
    }
  }, [activeOrders.length]);

  const updateItemStatus = async (orderId: string, itemId: string, status: 'nuevo' | 'preparando' | 'listo') => {
    try {
      console.log('Actualizando item:', { orderId, itemId, status });
      
      // Encontrar la orden y actualizar en Appwrite primero
      const order = state.orders.find(o => o.id === orderId);
      if (!order) {
        console.error('Orden no encontrada:', orderId);
        return;
      }
      
      const updatedItems = order.items.map(item => 
        item.id === itemId 
          ? { ...item, status, startTime: status === 'preparando' ? new Date() : item.startTime }
          : item
      );

      console.log('Items actualizados:', updatedItems);
      
      // Actualizar en Appwrite
      await menuService.updateOrder(orderId, {
        items: JSON.stringify(updatedItems)
      });
      
      // Actualizar estado local después de confirmar Appwrite
      dispatch({ 
        type: 'UPDATE_ORDER_ITEM_STATUS', 
        orderId, 
        itemId, 
        status 
      });
      
      console.log('Item actualizado exitosamente');
    } catch (error) {
      console.error('Error updating item status:', error);
      alert('Error al actualizar el estado del plato');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'nuevo': return 'bg-gradient-to-r from-red-50 to-red-100 text-red-800 border-red-200';
      case 'preparando': return 'bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 border-yellow-200';
      case 'listo': return 'bg-gradient-to-r from-green-50 to-green-100 text-green-800 border-green-200';
      default: return 'bg-gradient-to-r from-gray-50 to-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'nuevo': return <AlertCircle className="w-5 h-5" />;
      case 'preparando': return <PlayCircle className="w-5 h-5" />;
      case 'listo': return <CheckCircle className="w-5 h-5" />;
      default: return null;
    }
  };

  const getOrderElapsedTime = (timestamp: Date) => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - timestamp.getTime()) / 1000 / 60);
    return diff;
  };

  const getTimeColor = (minutes: number) => {
    if (minutes < 15) return 'text-green-600';
    if (minutes < 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-200">
        <div className="px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-2 sm:p-3 rounded-xl shadow-lg">
              <ChefHat className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Estación de Cocina
              </h1>
              <p className="text-sm sm:text-base text-gray-600 font-medium">Chef: {user?.name} • {new Date().toLocaleDateString('es-PE')}</p>
            </div>
            <div className="sm:hidden">
              <h1 className="text-lg font-bold text-gray-800">Cocina</h1>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center space-x-1 sm:space-x-2 bg-gradient-to-r from-yellow-50 to-yellow-100 px-2 sm:px-4 py-2 rounded-xl border border-yellow-200 shadow-sm">
              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
              <span className="text-yellow-800 font-bold text-sm sm:text-base">
                <span className="hidden sm:inline">{activeOrders.length} órdenes activas</span>
                <span className="sm:hidden">{activeOrders.length}</span>
              </span>
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

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        {activeOrders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
            {activeOrders.map((order) => {
              const elapsedTime = getOrderElapsedTime(order.timestamp);
              const allItemsReady = order.items.every(item => item.status === 'listo');
              
              return (
                <div 
                  key={order.id}
                  className={`bg-white rounded-2xl shadow-lg border-2 p-4 sm:p-6 transition-all duration-200 hover:shadow-xl ${
                    allItemsReady ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100' : 'border-gray-200'
                  } ${selectedOrder === order.id ? 'ring-2 ring-red-500 transform scale-105' : 'hover:scale-105'}`}
                  onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                >
                  {/* Header de la Orden */}
                  <div className="flex justify-between items-start mb-4 sm:mb-6">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-800">
                        {order.tableNumber === 0 ? 'Para Llevar' : `Mesa ${order.tableNumber}`}
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
                        Mozo: {order.waiterName}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Orden #{order.id.split('-')[1]}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={`flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm font-bold ${getTimeColor(elapsedTime)}`}>
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
                        <span className="text-base sm:text-lg">{elapsedTime} min</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {order.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Items de la Orden */}
                  <div className="space-y-3 sm:space-y-4">
                    {order.items.map((item) => (
                      <div 
                        key={`${item.id}-${item.orderId}`}
                        className={`p-3 sm:p-4 rounded-2xl border-2 ${getStatusColor(item.status)} transition-all duration-200`}
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-800 text-base sm:text-lg">
                              {item.quantity}x {item.name}
                            </h4>
                            {item.notes && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-2 italic bg-white p-2 rounded-lg">
                                📝 {item.notes}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(item.status)}
                          </div>
                        </div>

                        {/* Botón Único */}
                        <div className="mt-3 sm:mt-4">
                          {item.status === 'nuevo' && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await updateItemStatus(order.id, item.id, 'preparando');
                              }}
                              className="w-full py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-yellow-500 to-yellow-600 text-white hover:from-yellow-600 hover:to-yellow-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              🔥 Iniciar Preparación
                            </button>
                          )}
                          
                          {item.status === 'preparando' && (
                            <button
                              onClick={async (e) => {
                                e.stopPropagation();
                                await updateItemStatus(order.id, item.id, 'listo');
                              }}
                              className="w-full py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                            >
                              ✓ Marcar como Listo
                            </button>
                          )}
                          
                          {item.status === 'listo' && (
                            <div className="w-full py-2 sm:py-3 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-green-600 to-green-700 text-white text-center">
                              ✓ Completado
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Estado General de la Orden */}
                  {allItemsReady && (
                    <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gradient-to-r from-green-100 to-green-200 border border-green-300 rounded-2xl">
                      <div className="flex items-center justify-center space-x-2 sm:space-x-3 text-green-800">
                        <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                        <span className="font-bold text-base sm:text-lg">¡Orden Lista para Servir!</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-8 sm:p-12 lg:p-16 text-center">
            <ChefHat className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto mb-4 sm:mb-6 text-gray-300" />
            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-700 mb-3 sm:mb-4">
              No hay órdenes en cocina
            </h3>
            <p className="text-base sm:text-lg lg:text-xl text-gray-500">
              Las nuevas órdenes aparecerán aquí automáticamente
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

export default CocinaInterface;