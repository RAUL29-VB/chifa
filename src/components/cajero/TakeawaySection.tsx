import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePos } from '../../context/PosContext';
import { kitchenPrintService } from '../../services/kitchenPrintService';
import { 
  Search,
  ShoppingBag,
  Plus,
  Minus,
  X,
  Send
} from 'lucide-react';

function TakeawaySection() {
  const [showTakeawayModal, setShowTakeawayModal] = useState(false);
  const [takeawayOrder, setTakeawayOrder] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Entradas');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { user } = useAuth();
  const { state, dispatch } = usePos();

  const availableItems = state.menuItems.filter(item => 
    item.available && 
    (searchTerm === '' ? item.category === selectedCategory : item.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const addItemToTakeaway = (item: typeof state.menuItems[0]) => {
    const existingItem = takeawayOrder.find(orderItem => orderItem.id === item.id);
    if (existingItem) {
      setTakeawayOrder(prev => prev.map(orderItem => 
        orderItem.id === item.id 
          ? { ...orderItem, quantity: orderItem.quantity + 1 }
          : orderItem
      ));
    } else {
      setTakeawayOrder(prev => [...prev, { ...item, quantity: 1 }]);
    }
  };

  const updateTakeawayQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      setTakeawayOrder(prev => prev.filter(item => item.id !== itemId));
    } else {
      setTakeawayOrder(prev => prev.map(item => 
        item.id === itemId ? { ...item, quantity: newQuantity } : item
      ));
    }
  };

  const getTakeawayTotal = () => {
    return takeawayOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const sendTakeawayToKitchen = async () => {
    if (takeawayOrder.length === 0) return;
    
    try {
      const total = getTakeawayTotal();
      
      // Guardar en Appwrite primero
      const { menuService } = await import('../../services/menuService');
      const appwriteOrder = await menuService.createOrder({
        tableNumber: 0,
        items: JSON.stringify(takeawayOrder.map(item => ({
          ...item,
          status: 'nuevo',
          orderId: 'temp'
        }))),
        total,
        status: 'abierta',
        timestamp: new Date().toISOString(),
        waiterId: user?.id || 'cajero',
        waiterName: 'Para Llevar',
        customerCount: 1
      });
      
      // Enviar a cocina
      const kitchenTicket = {
        orderNumber: `LLEVAR-${appwriteOrder.$id.slice(-6)}`,
        items: takeawayOrder.map(item => ({
          name: item.name,
          quantity: item.quantity,
          notes: item.notes
        })),
        table: 'Para Llevar',
        waiter: 'Para Llevar',
        time: new Date().toLocaleTimeString()
      };

      await kitchenPrintService.printKitchenTicket(kitchenTicket);
      
      // Recargar órdenes desde Appwrite en lugar de agregar localmente
      setTimeout(async () => {
        const orders = await menuService.getOrders();
        const formattedOrders = orders.map(order => ({
          ...order,
          id: order.$id,
          timestamp: new Date(order.timestamp),
          items: JSON.parse(order.items)
        }));
        dispatch({ type: 'SYNC_ORDERS', orders: formattedOrders });
      }, 1000);
      
      setTakeawayOrder([]);
      setShowTakeawayModal(false);
      
      alert('Pedido enviado a cocina - Para Llevar');
    } catch (error) {
      console.error('Error enviando pedido:', error);
      alert('Error al enviar pedido a cocina');
    }
  };

  const takeawayOrders = state.orders.filter(order => 
    order.tableNumber === 0 && 
    order.status === 'abierta' && 
    order.waiterName === 'Para Llevar'
  );

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Pedidos Para Llevar</h2>
        <button
          onClick={() => setShowTakeawayModal(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 sm:px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 font-medium text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Nuevo Pedido</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-gray-800">Pedidos Pendientes</h3>
        </div>
        <div className="p-4 sm:p-6">
          {takeawayOrders.length > 0 ? (
            <div className="grid gap-4">
              {takeawayOrders.map((order) => {
                const allItemsReady = order.items.every(item => item.status === 'listo');
                return (
                  <div key={order.id} className="border border-gray-200 rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-all duration-200">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <h4 className="font-bold text-base sm:text-lg text-gray-800 flex items-center space-x-2">
                          <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Pedido #{order.id.slice(-6)}</span>
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600">{order.items.length} productos • {order.timestamp.toLocaleTimeString()}</p>
                      </div>
                      <div className="text-left sm:text-right">
                        <div className="font-bold text-xl sm:text-2xl text-gray-800">S/ {order.total.toFixed(2)}</div>
                        <div className={`text-xs px-3 py-1 rounded-full font-medium mt-2 inline-block ${
                          allItemsReady 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          {allItemsReady ? 'Listo para cobrar' : 'En cocina'}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center text-xs sm:text-sm">
                          <span className="flex-1 min-w-0 truncate">{item.name} x{item.quantity}</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ml-2 ${
                            item.status === 'listo' ? 'bg-green-100 text-green-800' :
                            item.status === 'preparando' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {item.status === 'listo' ? 'Listo' :
                             item.status === 'preparando' ? 'Preparando' : 'Nuevo'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12 text-gray-500">
              <ShoppingBag className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-base sm:text-lg font-medium">No hay pedidos para llevar pendientes</p>
            </div>
          )}
        </div>
      </div>

      {showTakeawayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-6xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-red-600 to-red-700 text-white p-4 sm:p-6 flex justify-between items-center">
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold">Pedido Para Llevar</h3>
              <button
                onClick={() => setShowTakeawayModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-xl transition-colors"
                aria-label="Cerrar modal"
                title="Cerrar modal"
              >
                <X className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(95vh-100px)] sm:max-h-[calc(90vh-120px)]">
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6">Menú</h3>
                    
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
                          className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                            selectedCategory === category
                              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg'
                              : 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 hover:from-gray-200 hover:to-gray-300'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 space-y-3 sm:space-y-4 max-h-80 sm:max-h-96 overflow-y-auto">
                    {availableItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-2xl p-3 sm:p-4 hover:shadow-lg transition-all duration-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-800 text-base sm:text-lg">{item.name}</h4>
                            <p className="text-red-600 font-bold text-lg sm:text-xl">S/ {item.price.toFixed(2)}</p>
                            {item.description && (
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{item.description}</p>
                            )}
                          </div>
                          <button
                            onClick={() => addItemToTakeaway(item)}
                            className="bg-gradient-to-r from-red-600 to-red-700 text-white p-2 sm:p-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 ml-2"
                            aria-label={`Agregar ${item.name} al pedido`}
                            title={`Agregar ${item.name} al pedido`}
                          >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
                  <div className="p-4 sm:p-6 border-b border-gray-200">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800">Orden Para Llevar</h3>
                  </div>

                  <div className="p-4 sm:p-6">
                    {takeawayOrder.length > 0 ? (
                      <>
                        <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-56 sm:max-h-64 overflow-y-auto">
                          {takeawayOrder.map((item) => (
                            <div key={item.id} className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 sm:p-4 bg-gray-50 rounded-xl space-y-3 sm:space-y-0">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-gray-800 text-sm sm:text-base">{item.name}</h4>
                                <p className="text-xs sm:text-sm text-gray-600">S/ {item.price.toFixed(2)} c/u</p>
                              </div>
                              <div className="flex items-center justify-between sm:justify-end space-x-3">
                                <div className="flex items-center space-x-2 sm:space-x-3">
                                  <button
                                    onClick={() => updateTakeawayQuantity(item.id, item.quantity - 1)}
                                    className="bg-red-500 text-white p-1 rounded-lg hover:bg-red-600"
                                    aria-label={`Reducir cantidad de ${item.name}`}
                                    title={`Reducir cantidad de ${item.name}`}
                                  >
                                    <Minus className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                  <span className="font-bold text-base sm:text-lg px-2 sm:px-3">{item.quantity}</span>
                                  <button
                                    onClick={() => updateTakeawayQuantity(item.id, item.quantity + 1)}
                                    className="bg-green-500 text-white p-1 rounded-lg hover:bg-green-600"
                                    aria-label={`Aumentar cantidad de ${item.name}`}
                                    title={`Aumentar cantidad de ${item.name}`}
                                  >
                                    <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </button>
                                </div>
                                <span className="font-bold text-base sm:text-lg">S/ {(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="border-t pt-4 mb-4 sm:mb-6">
                          <div className="flex justify-between items-center text-xl sm:text-2xl font-bold">
                            <span>Total:</span>
                            <span className="text-red-700">S/ {getTakeawayTotal().toFixed(2)}</span>
                          </div>
                        </div>

                        <button
                          onClick={sendTakeawayToKitchen}
                          className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 font-bold shadow-lg text-sm sm:text-base"
                        >
                          <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                          <span>Enviar a Cocina</span>
                        </button>
                      </>
                    ) : (
                      <div className="text-center py-12 sm:py-16 text-gray-500">
                        <ShoppingBag className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300" />
                        <h4 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4 text-gray-700">Orden Vacía</h4>
                        <p className="text-base sm:text-lg">Agrega productos del menú</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TakeawaySection;