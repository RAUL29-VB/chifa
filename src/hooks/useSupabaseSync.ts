import { useEffect } from 'react';
import { usePos } from '../context/PosContext';
import { supabaseService } from '../services/supabaseService';

export function useSupabaseSync() {
  const { dispatch } = usePos();

  useEffect(() => {
    // Cargar datos iniciales
    const loadData = async () => {
      try {
        const [menuItems, categories, tables, orders, cashRegister] = await Promise.all([
          supabaseService.getMenuItems(),
          supabaseService.getCategories(),
          supabaseService.getTables(),
          supabaseService.getOrders(),
          supabaseService.getCashRegister()
        ]);

        if (menuItems.length > 0) {
          dispatch({ 
            type: 'SET_MENU_DATA', 
            items: menuItems.map(item => ({ $id: item.id, ...item })), 
            categories: categories.map(cat => ({ name: cat.name }))
          });
        }
        
        if (tables.length >= 0) {
          dispatch({ 
            type: 'SYNC_TABLES_SELECTIVE', 
            tables: tables.map(table => ({ $id: table.id, ...table }))
          });
        }
        
        if (orders.length >= 0) {
          const formattedOrders = orders.map(order => ({
            ...order,
            id: order.id,
            timestamp: new Date(order.timestamp),
            items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
          }));
          dispatch({ type: 'SYNC_ORDERS', orders: formattedOrders });
        }
        
        if (cashRegister) {
          dispatch({ 
            type: 'SYNC_CASH_REGISTER', 
            cashRegister: {
              isOpen: cashRegister.is_open,
              initialAmount: cashRegister.initial_amount,
              currentAmount: cashRegister.current_amount,
              totalSales: cashRegister.total_sales,
              openedAt: cashRegister.opened_at ? new Date(cashRegister.opened_at) : undefined,
              closedAt: cashRegister.closed_at ? new Date(cashRegister.closed_at) : undefined
            }
          });
        }
      } catch (error) {
        console.error('Error loading data from Supabase:', error);
      }
    };

    loadData();

    // Recargar cada 5 segundos
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [dispatch]);

  return {};
}