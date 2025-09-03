import { databases, DATABASE_ID, REALTIME_COLLECTION_ID } from './appwrite';
import { ID } from 'appwrite';

export interface RealtimeState {
  orders: any[];
  tables: any[];
  dailySales: number;
  cashRegister: any;
  lastUpdated: string;
}

export const realtimeService = {
  // Guardar estado actual en Appwrite
  async saveState(state: RealtimeState) {
    try {
      // Usar ID fijo para sobrescribir siempre el mismo documento
      const docId = 'current-state';
      
      try {
        // Intentar actualizar documento existente
        await databases.updateDocument(
          DATABASE_ID,
          REALTIME_COLLECTION_ID,
          docId,
          {
            ...state,
            lastUpdated: new Date().toISOString()
          }
        );
      } catch (error) {
        // Si no existe, crear nuevo documento
        await databases.createDocument(
          DATABASE_ID,
          REALTIME_COLLECTION_ID,
          docId,
          {
            ...state,
            lastUpdated: new Date().toISOString()
          }
        );
      }
    } catch (error) {
      console.error('Error saving realtime state:', error);
    }
  },

  // Obtener estado desde Appwrite
  async getState(): Promise<RealtimeState | null> {
    try {
      const response = await databases.getDocument(
        DATABASE_ID,
        REALTIME_COLLECTION_ID,
        'current-state'
      );
      
      return {
        orders: response.orders || [],
        tables: response.tables || [],
        dailySales: response.dailySales || 0,
        cashRegister: response.cashRegister || {
          isOpen: false,
          initialAmount: 0,
          currentAmount: 0,
          totalSales: 0
        },
        lastUpdated: response.lastUpdated
      };
    } catch (error) {
      console.error('Error getting realtime state:', error);
      return null;
    }
  }
};