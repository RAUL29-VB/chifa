// Servicio que detecta si hay servidor local de impresión
export class PrintServerService {
  private serverUrl = 'http://localhost:3001';

  async printReceipt(data: any): Promise<boolean> {
    try {
      // Intentar servidor local primero
      const response = await fetch(`${this.serverUrl}/print`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        console.log('Impreso via servidor local');
        return true;
      }
    } catch (error) {
      console.log('Servidor local no disponible, usando método manual');
    }
    
    // Fallback al método manual actual
    return this.printManual(data);
  }

  private printManual(data: any): boolean {
    // Tu método actual que funciona
    const content = this.generateText(data);
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'recibo.txt';
    a.click();
    URL.revokeObjectURL(url);
    
    const script = `@echo off
if exist "%USERPROFILE%\\Downloads\\recibo.txt" (
    notepad /p "%USERPROFILE%\\Downloads\\recibo.txt"
) else if exist "%USERPROFILE%\\Descargas\\recibo.txt" (
    notepad /p "%USERPROFILE%\\Descargas\\recibo.txt"
)`;
    
    const scriptBlob = new Blob([script], { type: 'text/plain' });
    const scriptUrl = URL.createObjectURL(scriptBlob);
    const scriptLink = document.createElement('a');
    scriptLink.href = scriptUrl;
    scriptLink.download = 'imprimir.bat';
    scriptLink.click();
    URL.revokeObjectURL(scriptUrl);
    
    return true;
  }

  private generateText(data: any): string {
    return `        CHIFA CHEFCITO
       RECIBO DE VENTA
================================
Orden: ${data.orderNumber}
Fecha: ${data.date}
--------------------------------
${data.items.map((item: any) => {
  const line = `${item.name} x${item.quantity}`;
  const price = `S/${item.price.toFixed(2)}`;
  const spaces = 32 - line.length - price.length;
  return line + ' '.repeat(Math.max(0, spaces)) + price;
}).join('\n')}
--------------------------------
TOTAL: S/${data.total.toFixed(2)}
================================
     Gracias por su compra!
`;
  }
}