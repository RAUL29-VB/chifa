interface KitchenTicket {
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    notes?: string;
  }>;
  table: string;
  waiter: string;
  time: string;
}

export class KitchenPrintService {
  private serverUrl = 'http://192.168.1.104:3001';

  async printKitchenTicket(ticket: KitchenTicket): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/print-kitchen`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket)
      });

      if (response.ok) {
        console.log('Ticket enviado a cocina');
        return true;
      } else {
        throw new Error('Error del servidor');
      }
    } catch (error) {
      console.error('Error al enviar a cocina:', error);
      alert('No se pudo enviar a cocina. Verifica que el servidor esté corriendo.');
      return false;
    }
  }

  async printReceipt(data: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.serverUrl}/print-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      return response.ok;
    } catch (error) {
      console.error('Error al imprimir recibo:', error);
      return false;
    }
  }
}

export const kitchenPrintService = new KitchenPrintService();
export type { KitchenTicket };