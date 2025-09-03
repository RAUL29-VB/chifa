import { useEffect } from 'react';
import { usePos } from '../context/PosContext';
import { menuService } from '../services/menuService';

export function useAppwriteSync() {
  const { dispatch } = usePos();

  useEffect(() => {
    // Cargar datos iniciales
    const loadData = async () => {
      try {
        const [menuItems, categories, tables, orders, cashRegister] = await Promise.all([
          menuService.getMenuItems(),
          menuService.getCategories(),
          menuService.getTables(),
          menuService.getOrders(),
          menuService.getCashRegister()
        ]);

        if (menuItems.length > 0) {
          dispatch({ type: 'SET_MENU_DATA', items: menuItems, categories });
        }
        if (tables.length >= 0) {
          // Usar sincronización selectiva para preservar órdenes locales
          dispatch({ type: 'SYNC_TABLES_SELECTIVE', tables });
        }
        if (orders.length >= 0) {
          const formattedOrders = orders.map(order => ({
            ...order,
            id: order.$id, // Usar el ID de Appwrite
            timestamp: new Date(order.timestamp),
            items: JSON.parse(order.items).map((item: any) => ({
              ...item,
              startTime: item.startTime ? new Date(item.startTime) : undefined
            }))
          }));
          dispatch({ type: 'SYNC_ORDERS', orders: formattedOrders });
        }
        if (cashRegister) {
          dispatch({ 
            type: 'SYNC_CASH_REGISTER', 
            cashRegister: {
              isOpen: cashRegister.isOpen,
              initialAmount: cashRegister.initialAmount,
              currentAmount: cashRegister.currentAmount,
              totalSales: cashRegister.totalSales,
              openedAt: cashRegister.openedAt ? new Date(cashRegister.openedAt) : undefined,
              closedAt: cashRegister.closedAt ? new Date(cashRegister.closedAt) : undefined
            }
          });
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();

    // Recargar cada 5 segundos
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return {};
}