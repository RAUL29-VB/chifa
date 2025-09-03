import { supabaseService } from './supabaseService';

export interface CashRegister {
  id?: string;
  is_open: boolean;
  initial_amount: number;
  current_amount: number;
  total_sales: number;
  opened_at: string;
  closed_at?: string;
  opened_by: string;
}

class CashRegisterService {
  async openCashRegister(initialAmount: number, openedBy: string): Promise<boolean> {
    try {
      await supabaseService.createCashRegister({
        is_open: true,
        initial_amount: initialAmount,
        current_amount: initialAmount,
        total_sales: 0,
        opened_at: new Date().toISOString(),
        opened_by: openedBy
      });
      return true;
    } catch (error) {
      console.error('Error abriendo caja:', error);
      return false;
    }
  }

  async closeCashRegister(cashRegisterId: string): Promise<boolean> {
    try {
      await supabaseService.updateCashRegister(cashRegisterId, {
        is_open: false,
        closed_at: new Date().toISOString()
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
        await supabaseService.updateCashRegister(cashRegister.id, {
          current_amount: cashRegister.current_amount + saleAmount,
          total_sales: cashRegister.total_sales + saleAmount
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
      const cashRegister = await supabaseService.getCashRegister();
      
      if (cashRegister && cashRegister.is_open) {
        return {
          id: cashRegister.id,
          is_open: cashRegister.is_open,
          initial_amount: cashRegister.initial_amount,
          current_amount: cashRegister.current_amount,
          total_sales: cashRegister.total_sales || 0,
          opened_at: cashRegister.opened_at,
          closed_at: cashRegister.closed_at,
          opened_by: cashRegister.opened_by
        };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo caja actual:', error);
      return null;
    }
  }
}

export const cashRegisterService = new CashRegisterService();