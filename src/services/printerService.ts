interface PrinterConfig {
  type: 'USB' | 'NETWORK';
  interface: string;
  width: number;
  ip?: string;
  port?: number;
}

interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
}

interface ReceiptData {
  items: ReceiptItem[];
  total: number;
  date: string;
  orderNumber: string;
  table?: string;
  waiter?: string;
}

class PrinterService {
  private config: PrinterConfig = {
    type: 'NETWORK',
    interface: 'TCP/IP',
    width: 48,
    ip: '192.168.1.200',
    port: 9100
  };

  async printReceipt(data: ReceiptData): Promise<boolean> {
    try {
      // Enviar directamente a impresora TCP/IP
      const response = await fetch('/api/print-tcpip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: this.config.ip,
          port: this.config.port,
          data: this.generateESCPOSCommands(data)
        })
      });
      
      if (response.ok) {
        console.log('Impresión enviada a', this.config.ip);
        return true;
      } else {
        throw new Error('Error del servidor de impresión');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(`Error al imprimir en ${this.config.ip}:${this.config.port}`);
      return false;
    }
  }
  
  private generateESCPOSCommands(data: ReceiptData): string {
    let cmd = '';
    
    // Inicializar impresora
    cmd += '\x1B\x40'; // ESC @
    
    // Centrar texto
    cmd += '\x1B\x61\x01'; // ESC a 1
    cmd += 'CHIFA CHEFCITO\n';
    cmd += 'RECIBO DE VENTA\n';
    
    // Alinear a la izquierda
    cmd += '\x1B\x61\x00'; // ESC a 0
    cmd += '================================\n';
    cmd += `Orden: ${data.orderNumber}\n`;
    cmd += `Fecha: ${data.date}\n`;
    cmd += '--------------------------------\n';
    
    data.items.forEach(item => {
      const line = `${item.name} x${item.quantity}`;
      const price = `S/${item.price.toFixed(2)}`;
      const spaces = 32 - line.length - price.length;
      cmd += line + ' '.repeat(Math.max(0, spaces)) + price + '\n';
    });
    
    cmd += '--------------------------------\n';
    cmd += `TOTAL: S/${data.total.toFixed(2)}\n`;
    cmd += '================================\n';
    cmd += '\x1B\x61\x01'; // Centrar
    cmd += 'Gracias por su compra!\n\n\n';
    
    // Cortar papel
    cmd += '\x1D\x56\x00'; // GS V 0
    
    return cmd;
  }

  async testPrint(): Promise<boolean> {
    const testData: ReceiptData = {
      items: [
        { name: 'Arroz Chaufa', quantity: 1, price: 15.00 },
        { name: 'Wantán Frito', quantity: 2, price: 8.00 }
      ],
      total: 31.00,
      date: new Date().toLocaleString(),
      orderNumber: 'TEST001'
    };

    return await this.printReceipt(testData);
  }
}

export const printerService = new PrinterService();
export type { ReceiptData, ReceiptItem };