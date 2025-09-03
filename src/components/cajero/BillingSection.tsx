import { useState } from 'react';
import { usePos } from '../../context/PosContext';
import { usePrinter } from '../../hooks/usePrinter';
import { 
  Calculator, 
  CreditCard, 
  DollarSign, 
  FileText, 
  Receipt,
  Smartphone,
  ShoppingBag,
  CheckCircle,
  X
} from 'lucide-react';

interface BillingSectionProps {
  selectedTable: string | null;
  onPaymentComplete: () => void;
}

function BillingSection({ selectedTable, onPaymentComplete }: BillingSectionProps) {
  const [paymentMethod, setPaymentMethod] = useState<'efectivo' | 'tarjeta' | 'yape' | 'plin'>('efectivo');
  const [receivedAmount, setReceivedAmount] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{total: number, change: number, method: string} | null>(null);
  
  const { state, dispatch } = usePos();
  const { printReceipt, isPrinting } = usePrinter();

  const selectedTableData = selectedTable ? state.tables.find(t => t.id === selectedTable) : null;
  const tableOrder = selectedTableData ? state.orders.find(o => 
    o.tableNumber === selectedTableData.number && o.status === 'abierta'
  ) : null;
  const takeawayOrder = selectedTable ? state.orders.find(o => o.id === selectedTable) : null;
  
  const orderData = tableOrder || takeawayOrder;
  const isTable = !!selectedTableData;

  const handlePayment = async () => {
    if (!selectedTable || !selectedTableData || !orderData) return;

    if (orderData) {
      try {
        // Actualizar mesa en Supabase a libre
        const { supabaseService } = await import('../../services/supabaseService');
        await supabaseService.updateTable(selectedTable, {
          status: 'libre'
        });
        
        // Actualizar orden en Supabase
        await supabaseService.updateOrder(orderData.id, {
          status: 'cerrada'
        });
        
        // Registrar venta en cash register de Supabase
        const { cashRegisterService } = await import('../../services/cashRegisterService');
        await cashRegisterService.addSale(orderData.total);
        
        // Imprimir recibo automáticamente
        await printReceipt({
          orderNumber: orderData.id,
          items: orderData.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total: orderData.total,
          date: new Date().toLocaleString(),
          table: selectedTableData?.number.toString() || 'Sin mesa',
          waiter: orderData.waiterId || 'No asignado'
        });
        
        dispatch({ type: 'CLOSE_ORDER', orderId: orderData.id, paymentMethod });
        dispatch({ type: 'UPDATE_CASH_REGISTER_SALES', amount: orderData.total });
        
        // Forzar recarga de órdenes desde Supabase
        setTimeout(async () => {
          const orders = await supabaseService.getOrders();
          const formattedOrders = orders.map(order => ({
            ...order,
            id: order.id,
            timestamp: new Date(order.timestamp),
            items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
          }));
          dispatch({ type: 'SYNC_ORDERS', orders: formattedOrders });
        }, 1000);
        
        const change = paymentMethod === 'efectivo' ? Math.max(0, parseFloat(receivedAmount) - orderData.total) : 0;
        setPaymentResult({
          total: orderData.total,
          change: change,
          method: paymentMethod
        });
        setShowPaymentModal(true);
        
        setReceivedAmount('');
        setPaymentMethod('efectivo');
        onPaymentComplete();
      } catch (error) {
        console.error('Error updating table:', error);
        alert('Error al procesar el pago');
      }
    } else {
      alert('No se encontró una orden abierta para esta mesa');
    }
  };

  const processTakeawayPayment = async () => {
    if (!selectedTable) return;

    const order = state.orders.find(o => o.id === selectedTable);

    if (order) {
      try {
        // Actualizar orden en Supabase a cerrada
        const { supabaseService } = await import('../../services/supabaseService');
        await supabaseService.updateOrder(order.id, {
          status: 'cerrada'
        });
        
        // Registrar venta en cash register de Supabase
        const { cashRegisterService } = await import('../../services/cashRegisterService');
        await cashRegisterService.addSale(order.total);
        
        // Imprimir recibo automáticamente
        await printReceipt({
          orderNumber: order.id,
          items: order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          })),
          total: order.total,
          date: new Date().toLocaleString(),
          table: 'Para Llevar',
          waiter: order.waiterId || 'Cajero'
        });
        
        dispatch({ type: 'CLOSE_ORDER', orderId: order.id, paymentMethod });
        dispatch({ type: 'UPDATE_CASH_REGISTER_SALES', amount: order.total });
        
        // Forzar recarga de órdenes desde Supabase
        setTimeout(async () => {
          const orders = await supabaseService.getOrders();
          const formattedOrders = orders.map(order => ({
            ...order,
            id: order.id,
            timestamp: new Date(order.timestamp),
            items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
          }));
          dispatch({ type: 'SYNC_ORDERS', orders: formattedOrders });
        }, 1000);
        
        const change = paymentMethod === 'efectivo' ? Math.max(0, parseFloat(receivedAmount) - order.total) : 0;
        setPaymentResult({
          total: order.total,
          change: change,
          method: paymentMethod
        });
        setShowPaymentModal(true);
        
        setReceivedAmount('');
        setPaymentMethod('efectivo');
        onPaymentComplete();
      } catch (error) {
        console.error('Error procesando pago para llevar:', error);
        alert('Error al procesar el pago');
      }
    }
  };

  const printTicket = async () => {
    if (!orderData) return;
    
    const isTable = !!selectedTableData;
    const items = isTable ? (orderData as any).currentOrder || [] : (orderData as any).items || [];
    
    const success = await printReceipt({
      orderNumber: isTable ? `Mesa-${(orderData as any).number}` : 'Para-Llevar',
      items: items.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      total: orderData.total,
      date: new Date().toLocaleString(),
      table: isTable ? selectedTableData?.number.toString() || 'Sin mesa' : 'Para Llevar',
      waiter: orderData.waiterId || 'No asignado'
    });
    
    if (success) {
      alert('Ticket impreso automáticamente');
    } else {
      alert('Error al imprimir - verifica que el servidor esté corriendo');
    }
  };

  if (!orderData) {
    return (
      <div className="text-center py-12 sm:py-16 text-gray-500">
        <Calculator className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 sm:mb-6 text-gray-300" />
        <h3 className="text-xl sm:text-2xl font-bold mb-2 text-gray-700">Selecciona una Mesa</h3>
        <p className="text-base sm:text-lg">Elige una mesa para procesar el pago</p>
      </div>
    );
  }

  return (
    <>
      <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 sm:mb-6 flex items-center space-x-2">
        {!isTable && <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />}
        <span>{isTable ? `Facturar Mesa ${(orderData as any).number}` : 'Facturar Para Llevar'}</span>
      </h3>
      
      <div className="border border-gray-200 rounded-2xl p-4 sm:p-6 mb-4 sm:mb-6 bg-gradient-to-r from-gray-50 to-gray-100">
        <h4 className="font-bold text-gray-800 mb-3 sm:mb-4 text-base sm:text-lg">Detalle del Pedido</h4>
        {!orderData && (
          <div className="text-center py-4 text-gray-500">
            <p>No hay orden activa para esta mesa</p>
          </div>
        )}
        <div className="space-y-2 sm:space-y-3 max-h-40 sm:max-h-48 overflow-y-auto">
          {(orderData?.items || []).map((item: any) => (
            <div key={`${item.id}-${item.orderId}`} className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm">
              <div className="flex-1 min-w-0">
                <span className="font-semibold text-gray-800 text-sm sm:text-base">{item.name}</span>
                <span className="text-red-600 ml-2 font-medium text-sm sm:text-base">x{item.quantity}</span>
                {item.notes && (
                  <div className="text-xs text-gray-500 mt-1 italic truncate">Nota: {item.notes}</div>
                )}
              </div>
              <span className="font-bold text-base sm:text-lg text-gray-800 ml-2">S/ {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 mt-4 sm:mt-6 pt-4 sm:pt-6">
          <div className="flex justify-between items-center text-xl sm:text-2xl font-bold">
            <span className="text-gray-700">Total:</span>
            <span className="text-red-700">S/ {orderData.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="mb-4 sm:mb-6">
        <h4 className="font-bold text-gray-800 mb-3 sm:mb-4 text-base sm:text-lg">Método de Pago</h4>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => setPaymentMethod('efectivo')}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 font-medium text-sm sm:text-base ${
              paymentMethod === 'efectivo'
                ? 'border-green-500 bg-gradient-to-r from-green-50 to-green-100 text-green-700 shadow-lg transform scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Efectivo</span>
          </button>
          <button
            onClick={() => setPaymentMethod('tarjeta')}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 font-medium text-sm sm:text-base ${
              paymentMethod === 'tarjeta'
                ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-lg transform scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Tarjeta</span>
          </button>
          <button
            onClick={() => setPaymentMethod('yape')}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 font-medium text-sm sm:text-base ${
              paymentMethod === 'yape'
                ? 'border-purple-500 bg-gradient-to-r from-purple-50 to-purple-100 text-purple-700 shadow-lg transform scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Yape</span>
          </button>
          <button
            onClick={() => setPaymentMethod('plin')}
            className={`flex items-center justify-center space-x-1 sm:space-x-2 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-200 font-medium text-sm sm:text-base ${
              paymentMethod === 'plin'
                ? 'border-indigo-500 bg-gradient-to-r from-indigo-50 to-indigo-100 text-indigo-700 shadow-lg transform scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <Smartphone className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>Plin</span>
          </button>
        </div>
      </div>

      {paymentMethod === 'efectivo' && (
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">
            Monto Recibido
          </label>
          <input
            type="number"
            step="0.01"
            value={receivedAmount}
            onChange={(e) => setReceivedAmount(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 text-base sm:text-lg font-semibold"
            placeholder="0.00"
          />
          {receivedAmount && (
            <div className="mt-4 p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium text-sm sm:text-base">Vuelto:</span>
                <span className="font-bold text-xl sm:text-2xl text-gray-800">
                  S/ {Math.max(0, parseFloat(receivedAmount) - orderData.total).toFixed(2)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
        <button
          onClick={() => {
            if (isTable) {
              handlePayment();
            } else {
              processTakeawayPayment();
            }
          }}
          disabled={
            !state.cashRegister.isOpen || 
            (paymentMethod === 'efectivo' && (!receivedAmount || parseFloat(receivedAmount) < orderData.total)) ||
            isPrinting
          }
          title={
            !state.cashRegister.isOpen ? 'Abrir caja primero' :
            (paymentMethod === 'efectivo' && (!receivedAmount || parseFloat(receivedAmount) < orderData.total)) ? 'Ingrese monto suficiente' :
            'Procesar pago'
          }
          className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-6 py-3 sm:py-4 rounded-2xl hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 text-sm sm:text-base"
        >
          <Receipt className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Procesar Pago</span>
        </button>
        <button 
          onClick={printTicket}
          className="px-4 sm:px-6 py-3 sm:py-4 border border-gray-300 rounded-2xl hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-2 font-medium hover:shadow-md text-sm sm:text-base"
        >
          <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Imprimir Ticket</span>
          <span className="sm:hidden">Ticket</span>
        </button>
      </div>
      
      {/* Modal de Pago Procesado */}
      {showPaymentModal && paymentResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-6 flex justify-between items-center rounded-t-3xl">
              <h3 className="text-2xl font-bold">¡Pago Procesado!</h3>
              <button
                type="button"
                onClick={() => setShowPaymentModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-xl transition-colors"
                aria-label="Cerrar modal de pago"
                title="Cerrar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 text-center">
              <div className="bg-green-50 rounded-2xl p-6 mb-4">
                <CheckCircle className="w-16 h-16 mx-auto text-green-600 mb-4" />
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600">Total cobrado</p>
                    <p className="text-3xl font-bold text-green-600">S/ {paymentResult.total.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex justify-between items-center bg-white p-3 rounded-xl">
                    <span className="text-gray-600">Método:</span>
                    <span className="font-bold capitalize">{paymentResult.method}</span>
                  </div>
                  
                  {paymentResult.change > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl">
                      <p className="text-sm text-yellow-700">Vuelto</p>
                      <p className="text-2xl font-bold text-yellow-800">S/ {paymentResult.change.toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default BillingSection;