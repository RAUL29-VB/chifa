import { useEffect, useRef } from 'react';
import { usePos } from '../context/PosContext';
import { realtimeService } from '../services/realtimeService';

export function useMultiDeviceSync() {
  const { state, dispatch } = usePos();
  const lastSyncRef = useRef<string>('');
  const isSyncing = useRef(false);

  // Cargar estado inicial desde Appwrite
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        const cloudState = await realtimeService.getState();
        if (cloudState && cloudState.lastUpdated !== lastSyncRef.current) {
          // Convertir fechas
          if (cloudState.orders) {
            cloudState.orders = cloudState.orders.map((order: any) => ({
              ...order,
              timestamp: new Date(order.timestamp),
              items: order.items.map((item: any) => ({
                ...item,
                startTime: item.startTime ? new Date(item.startTime) : undefined
              }))
            }));
          }
          
          if (cloudState.tables) {
            cloudState.tables = cloudState.tables.map((table: any) => ({
              ...table,
              orderStartTime: table.orderStartTime ? new Date(table.orderStartTime) : undefined
            }));
          }

          // Actualizar estado local
          dispatch({ type: 'SYNC_ORDERS', orders: cloudState.orders });
          dispatch({ type: 'SYNC_TABLES', tables: cloudState.tables });
          dispatch({ type: 'SYNC_SALES', dailySales: cloudState.dailySales });
          dispatch({ type: 'SYNC_CASH_REGISTER', cashRegister: cloudState.cashRegister });
          
          lastSyncRef.current = cloudState.lastUpdated;
        }
      } catch (error) {
        console.error('Error loading initial state:', error);
      }
    };

    loadInitialState();
  }, [dispatch]);

  // Guardar cambios en Appwrite
  useEffect(() => {
    if (isSyncing.current) return;

    const saveToCloud = async () => {
      isSyncing.current = true;
      try {
        await realtimeService.saveState({
          orders: state.orders,
          tables: state.tables,
          dailySales: state.dailySales,
          cashRegister: state.cashRegister,
          lastUpdated: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error saving to cloud:', error);
      } finally {
        isSyncing.current = false;
      }
    };

    // Debounce para evitar demasiadas llamadas
    const timeout = setTimeout(saveToCloud, 1000);
    return () => clearTimeout(timeout);
  }, [state.orders, state.tables, state.dailySales, state.cashRegister]);

  // Polling para sincronizar con otros dispositivos
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      if (isSyncing.current) return;

      try {
        const cloudState = await realtimeService.getState();
        if (cloudState && cloudState.lastUpdated !== lastSyncRef.current) {
          // Hay cambios desde otro dispositivo
          if (cloudState.orders) {
            cloudState.orders = cloudState.orders.map((order: any) => ({
              ...order,
              timestamp: new Date(order.timestamp),
              items: order.items.map((item: any) => ({
                ...item,
                startTime: item.startTime ? new Date(item.startTime) : undefined
              }))
            }));
          }
          
          if (cloudState.tables) {
            cloudState.tables = cloudState.tables.map((table: any) => ({
              ...table,
              orderStartTime: table.orderStartTime ? new Date(table.orderStartTime) : undefined
            }));
          }

          dispatch({ type: 'SYNC_ORDERS', orders: cloudState.orders });
          dispatch({ type: 'SYNC_TABLES', tables: cloudState.tables });
          dispatch({ type: 'SYNC_SALES', dailySales: cloudState.dailySales });
          dispatch({ type: 'SYNC_CASH_REGISTER', cashRegister: cloudState.cashRegister });
          
          lastSyncRef.current = cloudState.lastUpdated;
        }
      } catch (error) {
        console.error('Error syncing with cloud:', error);
      }
    }, 3000); // Sincronizar cada 3 segundos

    return () => clearInterval(syncInterval);
  }, [dispatch]);

  return {};
}