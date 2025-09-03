import { useEffect } from 'react';
import { usePos } from '../context/PosContext';

export function useDataCleanup() {
  const { state, dispatch } = usePos();

  useEffect(() => {
    const cleanupOldData = () => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      // Limpiar órdenes cerradas de más de 1 día
      const oldOrders = state.orders.filter(order => 
        order.status === 'cerrada' && order.timestamp < oneDayAgo
      );

      if (oldOrders.length > 0) {
        console.log(`Limpiando ${oldOrders.length} órdenes antiguas`);
        // Aquí podrías enviar las órdenes a Appwrite antes de eliminarlas
        // y luego limpiar el localStorage
      }
    };

    // Ejecutar limpieza al cargar y cada hora
    cleanupOldData();
    const interval = setInterval(cleanupOldData, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [state.orders]);

  // Función para limpiar manualmente
  const clearOldData = () => {
    localStorage.removeItem('chifa-pos-state');
    window.location.reload();
  };

  return { clearOldData };
}