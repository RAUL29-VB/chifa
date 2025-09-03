import { useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';

export function useRealtimeSync() {
  const { state, dispatch } = usePos();
  const isUpdating = useRef(false);

  useEffect(() => {
    // Escuchar cambios en localStorage desde otras pestañas/ventanas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'chifa-pos-state' && e.newValue && !isUpdating.current) {
        try {
          const newState = JSON.parse(e.newValue);
          
          // Convertir fechas de string a Date objects
          if (newState.orders) {
            newState.orders = newState.orders.map((order: any) => ({
              ...order,
              timestamp: new Date(order.timestamp),
              items: order.items.map((item: any) => ({
                ...item,
                startTime: item.startTime ? new Date(item.startTime) : undefined
              }))
            }));
          }
          
          if (newState.tables) {
            newState.tables = newState.tables.map((table: any) => ({
              ...table,
              orderStartTime: table.orderStartTime ? new Date(table.orderStartTime) : undefined
            }));
          }

          // Actualizar cada parte del estado por separado
          if (JSON.stringify(state.orders) !== JSON.stringify(newState.orders)) {
            dispatch({ type: 'SYNC_ORDERS', orders: newState.orders });
          }
          
          if (JSON.stringify(state.tables) !== JSON.stringify(newState.tables)) {
            dispatch({ type: 'SYNC_TABLES', tables: newState.tables });
          }
          
          if (state.dailySales !== newState.dailySales) {
            dispatch({ type: 'SYNC_SALES', dailySales: newState.dailySales });
          }
          
          if (JSON.stringify(state.cashRegister) !== JSON.stringify(newState.cashRegister)) {
            dispatch({ type: 'SYNC_CASH_REGISTER', cashRegister: newState.cashRegister });
          }
        } catch (error) {
          console.error('Error syncing state:', error);
        }
      }
    };

    // Polling cada 2 segundos como respaldo
    const pollInterval = setInterval(() => {
      try {
        const savedState = localStorage.getItem('chifa-pos-state');
        if (savedState && !isUpdating.current) {
          const newState = JSON.parse(savedState);
          
          // Solo actualizar si hay diferencias significativas
          if (newState.orders?.length !== state.orders.length ||
              newState.tables?.some((t: any, i: number) => 
                state.tables[i] && t.status !== state.tables[i].status
              )) {
            handleStorageChange({ key: 'chifa-pos-state', newValue: savedState } as StorageEvent);
          }
        }
      } catch (error) {
        console.error('Error in polling sync:', error);
      }
    }, 2000);

    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(pollInterval);
    };
  }, [state.orders.length, state.tables, state.dailySales, state.cashRegister, dispatch]);

  // Marcar cuando estamos actualizando para evitar loops
  useEffect(() => {
    isUpdating.current = true;
    const timeout = setTimeout(() => {
      isUpdating.current = false;
    }, 100);
    return () => clearTimeout(timeout);
  }, [state]);

  return {};
}