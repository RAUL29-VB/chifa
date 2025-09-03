import express from 'express';
import cors from 'cors';
import net from 'net';

const app = express();
const PORT = 3001;
let ticketCounter = 1;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

// Log de todas las peticiones
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url} desde ${req.ip}`);
  next();
});

// Función para enviar datos a impresora TCP/IP
async function sendToPrinter(ip, port, data) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    
    client.connect(port, ip, () => {
      console.log(`Conectado a impresora ${ip}:${port}`);
      client.write(data);
    });
    
    client.on('data', (data) => {
      console.log('Respuesta de impresora:', data.toString());
      client.destroy();
      resolve(true);
    });
    
    client.on('close', () => {
      console.log('Conexión cerrada');
      resolve(true);
    });
    
    client.on('error', (err) => {
      console.error('Error de conexión:', err);
      reject(err);
    });
    
    // Timeout de 5 segundos
    setTimeout(() => {
      client.destroy();
      resolve(true);
    }, 5000);
  });
}

// Endpoint de prueba
app.get('/', (req, res) => {
  res.json({ 
    message: 'Servidor de impresión TCP/IP activo', 
    status: 'running',
    printer: '192.168.1.200:9100'
  });
});

// Endpoint para imprimir via TCP/IP
app.post('/api/print-tcpip', async (req, res) => {
  console.log('=== IMPRESIÓN TCP/IP ===');
  console.log('Desde:', req.ip);
  console.log('Datos:', req.body);
  
  try {
    const { ip, port, data } = req.body;
    
    if (!ip || !port || !data) {
      return res.status(400).json({ 
        success: false, 
        error: 'Faltan parámetros: ip, port, data' 
      });
    }
    
    await sendToPrinter(ip, port, data);
    
    console.log(`Impresión enviada a ${ip}:${port}`);
    res.json({ success: true, message: `Impreso en ${ip}:${port}` });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false, 
      error: `Error al imprimir: ${error.message}` 
    });
  }
});

// Endpoint para tickets de cocina (TCP/IP)
app.post('/print-kitchen', async (req, res) => {
  console.log('=== TICKET COCINA TCP/IP ===');
  console.log('Desde:', req.ip);
  console.log('Datos:', req.body);
  
  try {
    const { orderNumber, items, table, waiter, time } = req.body;
    
    // Generar ticket con comandos ESC/POS
    const ticketNumber = String(ticketCounter++).padStart(3, '0');
    let ticket = '';
    
    // Inicializar impresora
    ticket += '\x1B\x40'; // ESC @
    
    // Título en negrita y centrado
    ticket += '\x1B\x61\x01'; // Centrar
    ticket += '\x1B\x45\x01'; // Negrita ON
    ticket += 'CHIFA CHEFCITO\n';
    ticket += '\x1B\x45\x00'; // Negrita OFF
    ticket += `Ticket N°: ${ticketNumber}\n`;
    ticket += '\n';
    
    // Alinear a la izquierda para el resto
    ticket += '\x1B\x61\x00'; // ESC a 0
    
    // Primera línea: Mozo y Hora
    const currentDate = new Date();
    const dateStr = currentDate.toLocaleDateString('es-PE');
    const mozoLine = `Mozo: ${waiter}`;
    const horaLine = `Hora: ${time}`;
    const spaces1 = 32 - mozoLine.length - horaLine.length;
    ticket += mozoLine + ' '.repeat(Math.max(1, spaces1)) + horaLine + '\n';
    
    // Segunda línea: Mesa y Fecha
    const mesaLine = `Mesa: ${table}`;
    const fechaLine = `Fecha: ${dateStr}`;
    const spaces2 = 32 - mesaLine.length - fechaLine.length;
    ticket += mesaLine + ' '.repeat(Math.max(1, spaces2)) + fechaLine + '\n';
    
    ticket += '\n';
    
    // Título de platos en negrita
    ticket += '\x1B\x45\x01'; // Negrita ON
    ticket += 'PLATOS A PREPARAR:\n';
    ticket += '\x1B\x45\x00'; // Negrita OFF
    ticket += '--------------------------------\n';
    
    items.forEach(item => {
      // Formatear nombre del plato para que no se corte
      const itemLine = `${item.quantity}x ${item.name}`;
      if (itemLine.length > 32) {
        // Si es muy largo, dividir en líneas
        const words = item.name.split(' ');
        let currentLine = `${item.quantity}x `;
        words.forEach(word => {
          if ((currentLine + word).length > 32) {
            ticket += currentLine + '\n';
            currentLine = '   ' + word + ' ';
          } else {
            currentLine += word + ' ';
          }
        });
        ticket += currentLine.trim() + '\n';
      } else {
        ticket += itemLine + '\n';
      }
      
      if (item.notes) {
        const noteLine = `   Nota: ${item.notes}`;
        if (noteLine.length > 32) {
          // Dividir notas largas
          const noteWords = item.notes.split(' ');
          let currentNoteLine = '   Nota: ';
          noteWords.forEach(word => {
            if ((currentNoteLine + word).length > 32) {
              ticket += currentNoteLine + '\n';
              currentNoteLine = '   ' + word + ' ';
            } else {
              currentNoteLine += word + ' ';
            }
          });
          ticket += currentNoteLine.trim() + '\n';
        } else {
          ticket += noteLine + '\n';
        }
      }
    });
    
    ticket += '--------------------------------\n\n\n\n\n\n';
    
    // Cortar papel
    ticket += '\x1D\x56\x00'; // GS V 0
    
    // Enviar a impresora DE COCINA (192.168.1.199)
    await sendToPrinter('192.168.1.199', 9100, ticket);
    
    console.log(`Ticket ${orderNumber} enviado a impresora de cocina`);
    res.json({ success: true, message: 'Ticket enviado a cocina' });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para recibos de caja (TCP/IP)
app.post('/print-receipt', async (req, res) => {
  console.log('=== RECIBO CAJA TCP/IP ===');
  console.log('Desde:', req.ip);
  console.log('Datos:', req.body);
  
  try {
    const { orderNumber, items, total, date, table, waiter } = req.body;
    
    // Formatear fecha y hora
    const now = new Date();
    const fechaFormateada = now.toLocaleDateString('es-PE');
    const horaFormateada = now.toLocaleTimeString('es-PE', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
    
    // Generar recibo con comandos ESC/POS
    let receipt = '';
    
    // Inicializar impresora
    receipt += '\x1B\x40'; // ESC @
    
    // Centrar texto para el encabezado
    receipt += '\x1B\x61\x01'; // ESC a 1
    receipt += '\x1B\x45\x01'; // Negrita ON
    receipt += 'CHIFA CHEFCITO\n';
    receipt += '\x1B\x45\x00'; // Negrita OFF
    receipt += 'Estamos ubicados : Jr. Pedro Villon N°223\n';
    receipt += 'Barrio San Juan\n\n';
    receipt += 'Huacri - Ancash\n';
    receipt += '📞 956 663 491 - Daniel Gloriaza\n';
    receipt += '📞 994 233 034 - Ruth Zamora\n\n';
    
    // Alinear a la izquierda para datos del pedido
    receipt += '\x1B\x61\x00'; // ESC a 0
    
    // Primera línea: Mozo y Hora
    const mozoLine = `Mozo : ${waiter || 'Carlos'}`;
    const horaLine = `Hora : ${horaFormateada} PM`;
    const spaces1 = 32 - mozoLine.length - horaLine.length;
    receipt += mozoLine + ' '.repeat(Math.max(1, spaces1)) + horaLine + '\n';
    
    // Segunda línea: Mesa y Fecha
    const mesaLine = `Mesa : ${table || orderNumber}`;
    const fechaLine = `Fecha : ${fechaFormateada}`;
    const spaces2 = 32 - mesaLine.length - fechaLine.length;
    receipt += mesaLine + ' '.repeat(Math.max(1, spaces2)) + fechaLine + '\n\n';
    
    // Encabezado de la tabla
    receipt += 'CANT.    DESCRIPCION        PRECIO    IMPORTE\n';
    receipt += '========================================\n';
    
    // Items del pedido
    items.forEach(item => {
      const cant = item.quantity.toString().padEnd(4);
      const desc = item.name.substring(0, 15).padEnd(16);
      const precio = `S/${item.price.toFixed(2)}`.padStart(8);
      const importe = `S/${(item.quantity * item.price).toFixed(2)}`.padStart(8);
      receipt += `${cant}  ${desc}  ${precio}  ${importe}\n`;
    });
    
    receipt += '\n';
    
    // Total centrado
    receipt += '\x1B\x61\x01'; // Centrar
    receipt += '\x1B\x45\x01'; // Negrita ON
    receipt += `TOTAL A PAGAR : S/${total.toFixed(2)}\n`;
    receipt += '\x1B\x45\x00'; // Negrita OFF
    receipt += '========================================\n';
    receipt += 'Gracias por su compra!\n\n\n\n\n\n';
    
    // Cortar papel
    receipt += '\x1D\x56\x00'; // GS V 0
    
    // Enviar a impresora DE CAJA (192.168.1.200)
    await sendToPrinter('192.168.1.200', 9100, receipt);
    
    console.log(`Recibo ${orderNumber} enviado a impresora de caja`);
    res.json({ success: true, message: 'Recibo impreso' });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de impresión TCP/IP corriendo en puerto ${PORT}`);
  console.log('Impresoras configuradas:');
  console.log('  - Cajero: 192.168.1.200:9100 (recibos)');
  console.log('  - Cocina: 192.168.1.199:9100 (tickets)');
  console.log('Listo para recibir órdenes de tablets/móviles');
  console.log('Presiona Ctrl+C para detener el servidor');
  console.log('Prueba local: http://localhost:3001');
});

// Mantener el proceso vivo
process.on('SIGINT', () => {
  console.log('\nCerrando servidor de impresión...');
  server.close(() => {
    process.exit(0);
  });
});

process.stdin.resume();

export default app;