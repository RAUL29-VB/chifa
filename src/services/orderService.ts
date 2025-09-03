import { databases, DATABASE_ID } from './appwrite';
import { ID } from 'appwrite';

const ORDERS_COLLECTION_ID = 'orders-collection'; // Crear esta colección en Appwrite

export interface OrderRecord {
  tableNumber: number;
  items: any[];
  total: number;
  status: string;
  timestamp: string;
  paymentMethod?: string;
  waiterId: string;
  waiterName: string;
  customerCount: number;
  discount?: number;
  tip?: number;
}

export const orderService = {
  // Guardar orden en Appwrite
  async saveOrder(order: OrderRecord) {
    try {
      const response = await databases.createDocument(
        DATABASE_ID,
        ORDERS_COLLECTION_ID,
        ID.unique(),
        order
      );
      return response;
    } catch (error) {
      console.error('Error saving order:', error);
      throw error;
    }
  },

  // Obtener órdenes del día
  async getTodayOrders() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await databases.listDocuments(
        DATABASE_ID,
        ORDERS_COLLECTION_ID
      );
      
      return response.documents.filter(order => 
        order.timestamp.startsWith(today)
      );
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  }
};