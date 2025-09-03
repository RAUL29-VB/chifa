import React, { createContext, useContext, useReducer, ReactNode, useEffect } from 'react';
import { menuService } from '../services/menuService';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  description?: string;
  available: boolean;
  image?: string;
  preparationTime: number; // in minutes
  isSpicy: boolean;
  isVegetarian: boolean;
}

export interface OrderItem extends MenuItem {
  quantity: number;
  notes?: string;
  status: 'nuevo' | 'preparando' | 'listo';
  orderId: string;
  startTime?: Date;
}

export interface Table {
  id: string;
  number: number;
  status: 'libre' | 'ocupada' | 'servido' | 'cuenta' | 'limpieza';
  capacity: number;
  currentOrder: OrderItem[];
  total: number;
  waiterName?: string;
  customerCount?: number;
  orderStartTime?: Date;
}

export interface Order {
  id: string;
  tableNumber: number;
  items: OrderItem[];
  total: number;
  status: 'abierta' | 'cerrada';
  timestamp: Date;
  paymentMethod?: 'efectivo' | 'tarjeta' | 'yape' | 'plin';
  waiterId: string;
  waiterName: string;
  customerCount: number;
  discount?: number;
  tip?: number;
}

interface PosState {
  menuItems: MenuItem[];
  tables: Table[];
  orders: Order[];
  categories: string[];
  dailySales: number;
  cashRegister: {
    isOpen: boolean;
    initialAmount: number;
    currentAmount: number;
    totalSales: number;
    openedAt?: Date;
    closedAt?: Date;
  };
  stats: {
    todayOrders: number;
    avgOrderValue: number;
    peakHour: string;
    topSellingItem: string;
  };
}

type PosAction = 
  | { type: 'ADD_MENU_ITEM'; item: MenuItem }
  | { type: 'UPDATE_MENU_ITEM'; item: MenuItem }
  | { type: 'TOGGLE_ITEM_AVAILABILITY'; itemId: string }
  | { type: 'DELETE_MENU_ITEM'; itemId: string }
  | { type: 'ADD_TABLE'; table: Table }
  | { type: 'DELETE_TABLE'; tableId: string }
  | { type: 'ADD_ITEM_TO_TABLE'; tableId: string; item: OrderItem }
  | { type: 'REMOVE_ITEM_FROM_TABLE'; tableId: string; itemId: string; orderId: string }
  | { type: 'UPDATE_ITEM_QUANTITY'; tableId: string; itemId: string; orderId: string; quantity: number }
  | { type: 'UPDATE_TABLE_STATUS'; tableId: string; status: Table['status'] }
  | { type: 'UPDATE_ORDER_ITEM_STATUS'; orderId: string; itemId: string; status: OrderItem['status'] }
  | { type: 'MARK_ORDER_AS_SERVED'; orderId: string }
  | { type: 'CLOSE_ORDER'; orderId: string; paymentMethod: Order['paymentMethod']; discount?: number; tip?: number }
  | { type: 'OPEN_CASH_REGISTER'; amount: number }
  | { type: 'CLOSE_CASH_REGISTER' }
  | { type: 'UPDATE_TABLE_CUSTOMER_COUNT'; tableId: string; count: number }
  | { type: 'UPDATE_DAILY_SALES'; amount: number }
  | { type: 'UPDATE_CASH_REGISTER_SALES'; amount: number }
  | { type: 'ADD_TAKEAWAY_ORDER'; order: Order }
  | { type: 'ADD_CATEGORY'; category: string }
  | { type: 'SET_MENU_DATA'; items: any[]; categories: any[] }
  | { type: 'SET_TABLES_DATA'; tables: any[] }
  | { type: 'SYNC_ORDERS'; orders: any[] }
  | { type: 'SYNC_TABLES'; tables: any[] }
  | { type: 'SYNC_TABLES_SELECTIVE'; tables: any[] }
  | { type: 'SYNC_SALES'; dailySales: number }
  | { type: 'SYNC_CASH_REGISTER'; cashRegister: any };

const initialState: PosState = {
  menuItems: [],
  tables: [],
  orders: [],
  categories: [],
  dailySales: 0,
  cashRegister: {
    isOpen: false,
    initialAmount: 0,
    currentAmount: 0,
    totalSales: 0,
  },
  stats: {
    todayOrders: 0,
    avgOrderValue: 0,
    peakHour: '--:--',
    topSellingItem: 'Ninguno',
  },
};

function posReducer(state: PosState, action: PosAction): PosState {
  switch (action.type) {
    case 'ADD_MENU_ITEM':
      return {
        ...state,
        menuItems: [...state.menuItems, action.item],
      };

    case 'UPDATE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.map(item => 
          item.id === action.item.id ? action.item : item
        ),
      };

    case 'TOGGLE_ITEM_AVAILABILITY':
      return {
        ...state,
        menuItems: state.menuItems.map(item =>
          item.id === action.itemId ? { ...item, available: !item.available } : item
        ),
      };

    case 'ADD_ITEM_TO_TABLE':
      return {
        ...state,
        tables: state.tables.map(table => {
          if (table.id === action.tableId) {
            const newOrder = [...table.currentOrder, action.item];
            const newTotal = newOrder.reduce((total, item) => total + (item.price * item.quantity), 0);

            return {
              ...table,
              currentOrder: newOrder,
              total: newTotal,
              status: 'ocupada' as const,
              orderStartTime: table.orderStartTime || new Date(),
            };
          }
          return table;
        }),
      };

    case 'REMOVE_ITEM_FROM_TABLE':
      return {
        ...state,
        tables: state.tables.map(table => {
          if (table.id === action.tableId) {
            const newOrder = table.currentOrder.filter(item => 
              !(item.id === action.itemId && item.orderId === action.orderId)
            );
            const newTotal = newOrder.reduce((total, item) => total + (item.price * item.quantity), 0);

            return {
              ...table,
              currentOrder: newOrder,
              total: newTotal,
              status: newOrder.length === 0 ? 'libre' : table.status,
            };
          }
          return table;
        }),
      };

    case 'UPDATE_ITEM_QUANTITY':
      return {
        ...state,
        tables: state.tables.map(table => {
          if (table.id === action.tableId) {
            const newOrder = table.currentOrder.map(item =>
              item.id === action.itemId && item.orderId === action.orderId
                ? { ...item, quantity: action.quantity }
                : item
            ).filter(item => item.quantity > 0);
            
            const newTotal = newOrder.reduce((total, item) => total + (item.price * item.quantity), 0);

            return {
              ...table,
              currentOrder: newOrder,
              total: newTotal,
              status: newOrder.length === 0 ? 'libre' : table.status,
            };
          }
          return table;
        }),
      };

    case 'MARK_ORDER_AS_SERVED':
      const servedOrder = state.orders.find(o => o.id === action.orderId);
      if (!servedOrder) return state;

      return {
        ...state,
        tables: state.tables.map(table => 
          table.number === servedOrder.tableNumber
            ? { ...table, status: 'servido' }
            : table
        ),
      };

    case 'UPDATE_TABLE_CUSTOMER_COUNT':
      return {
        ...state,
        tables: state.tables.map(table =>
          table.id === action.tableId 
            ? { ...table, customerCount: action.count }
            : table
        ),
      };

    // Eliminado SEND_ORDER_TO_KITCHEN - ahora se maneja directamente en el componente

    case 'UPDATE_ORDER_ITEM_STATUS':
      return {
        ...state,
        orders: state.orders.map(order => ({
          ...order,
          items: order.items.map(item =>
            item.orderId === action.orderId && item.id === action.itemId
              ? { ...item, status: action.status }
              : item
          ),
        })),
      };

    case 'CLOSE_ORDER':
      const orderToClose = state.orders.find(o => o.id === action.orderId);
      if (!orderToClose) return state;

      const finalTotal = orderToClose.total - (action.discount || 0) + (action.tip || 0);

      return {
        ...state,
        orders: state.orders.map(order =>
          order.id === action.orderId
            ? { 
                ...order, 
                status: 'cerrada', 
                paymentMethod: action.paymentMethod,
                discount: action.discount,
                tip: action.tip,
                total: finalTotal
              }
            : order
        ),
        tables: state.tables.map(table => {
          if (table.number === orderToClose.tableNumber) {
            return {
              ...table,
              status: 'limpieza',
              currentOrder: [],
              total: 0,
              waiterName: undefined,
              customerCount: undefined,
              orderStartTime: undefined,
            };
          }
          return table;
        }),
        dailySales: state.dailySales + finalTotal,
        cashRegister: {
          ...state.cashRegister,
          currentAmount: state.cashRegister.currentAmount + finalTotal,
          totalSales: state.cashRegister.totalSales + finalTotal,
        },
        stats: {
          ...state.stats,
          todayOrders: state.stats.todayOrders + 1,
          avgOrderValue: (state.dailySales + finalTotal) / (state.stats.todayOrders + 1),
        },
      };

    case 'UPDATE_TABLE_STATUS':
      return {
        ...state,
        tables: state.tables.map(table =>
          table.id === action.tableId ? { ...table, status: action.status } : table
        ),
      };

    case 'OPEN_CASH_REGISTER':
      return {
        ...state,
        cashRegister: {
          isOpen: true,
          initialAmount: action.amount,
          currentAmount: action.amount,
          totalSales: 0,
          openedAt: new Date(),
        },
      };

    case 'CLOSE_CASH_REGISTER':
      return {
        ...state,
        cashRegister: {
          isOpen: false,
          initialAmount: 0,
          currentAmount: 0,
          totalSales: 0,
          closedAt: new Date(),
        },
      };

    case 'UPDATE_DAILY_SALES':
      return {
        ...state,
        dailySales: state.dailySales + action.amount,
      };

    case 'UPDATE_CASH_REGISTER_SALES':
      // Actualizar también en Appwrite
      (async () => {
        try {
          const { cashRegisterService } = await import('../services/cashRegisterService');
          await cashRegisterService.updateSales(action.amount);
        } catch (error) {
          console.error('Error updating sales in Appwrite:', error);
        }
      })();
      
      return {
        ...state,
        cashRegister: {
          ...state.cashRegister,
          currentAmount: state.cashRegister.currentAmount + action.amount,
          totalSales: state.cashRegister.totalSales + action.amount,
        },
      };

    case 'ADD_TAKEAWAY_ORDER':
      return {
        ...state,
        orders: [...state.orders, action.order],
      };

    case 'ADD_CATEGORY':
      return {
        ...state,
        categories: [...state.categories, action.category],
      };

    case 'DELETE_MENU_ITEM':
      return {
        ...state,
        menuItems: state.menuItems.filter(item => item.id !== action.itemId),
      };

    case 'ADD_TABLE':
      return {
        ...state,
        tables: [...state.tables, action.table],
      };

    case 'DELETE_TABLE':
      return {
        ...state,
        tables: state.tables.filter(table => table.id !== action.tableId),
      };

    case 'SET_MENU_DATA':
      return {
        ...state,
        menuItems: action.items.map(item => ({ id: item.$id!, ...item })),
        categories: [...new Set(action.categories.map(cat => cat.name))],
      };

    case 'SET_TABLES_DATA':
      return {
        ...state,
        tables: action.tables.map(table => ({ 
          id: table.$id!, 
          number: table.number,
          status: table.status,
          capacity: table.capacity,
          currentOrder: [],
          total: 0,
          waiterName: undefined,
          customerCount: undefined,
          orderStartTime: undefined
        })),
      };

    case 'SYNC_ORDERS':
      return {
        ...state,
        orders: action.orders,
      };

    case 'SYNC_TABLES':
      return {
        ...state,
        tables: action.tables,
      };

    case 'SYNC_TABLES_SELECTIVE':
      const appwriteNumbers = action.tables.map(t => t.number);
      
      // Mantener mesas con órdenes activas, eliminar las que no existen en Appwrite
      const updatedTables = state.tables
        .filter(currentTable => {
          // Mantener si tiene órdenes o si existe en Appwrite
          return currentTable.currentOrder.length > 0 || 
                 appwriteNumbers.includes(currentTable.number);
        })
        .map(currentTable => {
          // Si tiene órdenes activas, no tocar
          if (currentTable.currentOrder.length > 0) {
            return currentTable;
          }
          
          // Actualizar con datos de Appwrite
          const appwriteTable = action.tables.find(t => t.number === currentTable.number);
          if (appwriteTable) {
            return {
              ...currentTable,
              status: appwriteTable.status,
              capacity: appwriteTable.capacity
            };
          }
          
          return currentTable;
        });
      
      // Agregar mesas nuevas de Appwrite
      const existingNumbers = updatedTables.map(t => t.number);
      const newTables = action.tables
        .filter(t => !existingNumbers.includes(t.number))
        .map(table => ({
          id: table.$id!,
          number: table.number,
          status: table.status,
          capacity: table.capacity,
          currentOrder: [],
          total: 0,
          waiterName: undefined,
          customerCount: undefined,
          orderStartTime: undefined
        }));
      
      return {
        ...state,
        tables: [...updatedTables, ...newTables],
      };

    case 'SYNC_SALES':
      return {
        ...state,
        dailySales: action.dailySales,
      };

    case 'SYNC_CASH_REGISTER':
      return {
        ...state,
        cashRegister: action.cashRegister,
      };

    default:
      return state;
  }
}

const PosContext = createContext<{
  state: PosState;
  dispatch: React.Dispatch<PosAction>;
} | undefined>(undefined);

export function PosProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(posReducer, initialState);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [menuItems, categories, tables] = await Promise.all([
          menuService.getMenuItems(),
          menuService.getCategories(),
          menuService.getTables()
        ]);

        if (menuItems.length > 0) {
          dispatch({ type: 'SET_MENU_DATA', items: menuItems, categories });
        }
        if (tables.length > 0) {
          dispatch({ type: 'SET_TABLES_DATA', tables });
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  return (
    <PosContext.Provider value={{ state, dispatch }}>
      {children}
    </PosContext.Provider>
  );
}

export function usePos() {
  const context = useContext(PosContext);
  if (context === undefined) {
    throw new Error('usePos must be used within a PosProvider');
  }
  return context;
}