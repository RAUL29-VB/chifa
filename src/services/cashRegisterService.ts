import { databases, DATABASE_ID, CASH_REGISTER_COLLECTION_ID, ID } from './appwrite';

export interface CashRegister {
  id?: string;
  isOpen: boolean;
  initialAmount: number;
  currentAmount: number;
  totalSales: number;
  openedAt: string;
  closedAt?: string;
  openedBy: string;
}

class CashRegisterService {
  async openCashRegister(initialAmount: number, openedBy: string): Promise<boolean> {
    try {
      await databases.createDocument(DATABASE_ID, CASH_REGISTER_COLLECTION_ID, ID.unique(), {
        isOpen: true,
        initialAmount: initialAmount,
        currentAmount: initialAmount,
        totalSales: 0,
        openedAt: new Date().toISOString(),
        openedBy: openedBy
      });
      return true;
    } catch (error) {
      console.error('Error abriendo caja:', error);
      return false;
    }
  }

  async closeCashRegister(cashRegisterId: string): Promise<boolean> {
    try {
      await databases.updateDocument(DATABASE_ID, CASH_REGISTER_COLLECTION_ID, cashRegisterId, {
        isOpen: false,
        closedAt: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error cerrando caja:', error);
      return false;
    }
  }

  async updateSales(saleAmount: number): Promise<boolean> {
    try {
      const cashRegister = await this.getCurrentCashRegister();
      if (cashRegister && cashRegister.id) {
        await databases.updateDocument(DATABASE_ID, CASH_REGISTER_COLLECTION_ID, cashRegister.id, {
          currentAmount: cashRegister.currentAmount + saleAmount,
          totalSales: cashRegister.totalSales + saleAmount
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error actualizando ventas:', error);
      return false;
    }
  }

  async addSale(saleAmount: number): Promise<boolean> {
    return await this.updateSales(saleAmount);
  }

  async getCurrentCashRegister(): Promise<CashRegister | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, CASH_REGISTER_COLLECTION_ID);
      
      if (response.documents.length > 0) {
        // Buscar la caja más reciente sin closedAt
        const openCash = response.documents.find(doc => doc.isOpen === true);
        if (openCash) {
          return {
            id: openCash.$id,
            isOpen: openCash.isOpen,
            initialAmount: openCash.initialAmount,
            currentAmount: openCash.currentAmount,
            totalSales: openCash.totalSales || 0,
            openedAt: openCash.openedAt,
            closedAt: openCash.closedAt,
            openedBy: openCash.openedBy
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo caja actual:', error);
      return null;
    }
  }
}

export const cashRegisterService = new CashRegisterService();