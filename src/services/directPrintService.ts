import { ReceiptData } from './printerService';

export class DirectPrintService {
  async printToTCPIP(data: ReceiptData): Promise<boolean> {
    try {
      // Generar comandos ESC/POS para impresora térmica
      const commands = this.generateESCPOSCommands(data);
      
      // Enviar directamente a impresora TCP/IP
      const response = await fetch('/api/print-tcpip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: '192.168.1.200',
          port: 9100,
          data: commands
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Error impresión TCP/IP:', error);
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
    cmd += '--------------------------------\n';
    cmd += `Orden: ${data.orderNumber}\n`;
    cmd += `Fecha: ${data.date}\n`;
    cmd += '--------------------------------\n';
    
    // Items
    data.items.forEach(item => {
      const line = `${item.name} x${item.quantity}`;
      const price = `S/${item.price.toFixed(2)}`;
      const spaces = 32 - line.length - price.length;
      cmd += line + ' '.repeat(Math.max(0, spaces)) + price + '\n';
    });
    
    cmd += '--------------------------------\n';
    cmd += `TOTAL: S/${data.total.toFixed(2)}\n`;
    cmd += '--------------------------------\n';
    cmd += '\x1B\x61\x01'; // Centrar
    cmd += 'Gracias por su compra!\n\n\n';
    
    // Cortar papel
    cmd += '\x1D\x56\x00'; // GS V 0
    
    return cmd;
  }
}

export const directPrintService = new DirectPrintService();