import { ReceiptData } from './printerService';

export class WindowsPrintService {
  async printToTCPIP(data: ReceiptData): Promise<boolean> {
    try {
      // Enviar directamente a impresora TCP/IP
      const response = await fetch('/api/print-tcpip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ip: '192.168.1.200',
          port: 9100,
          data: this.generateESCPOSContent(data)
        })
      });
      
      if (response.ok) {
        console.log('Impresión enviada a 192.168.1.200');
        return true;
      } else {
        throw new Error('Error del servidor');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al imprimir en 192.168.1.200:9100');
      return false;
    }
  }

  private generateESCPOSContent(data: ReceiptData): string {
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


}

export const windowsPrintService = new WindowsPrintService();