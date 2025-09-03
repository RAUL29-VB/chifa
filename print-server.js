import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// Endpoint de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Servidor de impresión activo', status: 'running' });
});

// Endpoint para imprimir tickets de cocina
app.post('/print-kitchen', (req, res) => {
  console.log('=== PETICION RECIBIDA ===');
  console.log('Desde:', req.ip);
  console.log('Datos:', req.body);
  
  try {
    const { orderNumber, items, table, waiter, time } = req.body;
    
    // Generar ticket de cocina
    const ticketNumber = String(ticketCounter++).padStart(3, '0');
    const ticket = `Mesa: ${table}          Ticket: ${ticketNumber}
${table !== 'Para Llevar' ? waiter : ''}

platos a preparar:
${items.map(item => `${item.quantity} x ${item.name}${item.notes ? `\n   nota: ${item.notes}` : ''}`).join('\n')}

`;

    // Guardar archivo temporal
    const fileName = `ticket_${orderNumber}.txt`;
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, ticket);
    
    // Imprimir automáticamente
    exec(`notepad /p "${filePath}"`, (error) => {
      if (error) {
        console.error('Error al imprimir:', error);
        res.status(500).json({ success: false, error: error.message });
      } else {
        console.log(`Ticket ${orderNumber} enviado a impresora`);
        // Limpiar archivo temporal después de 5 segundos
        setTimeout(() => {
          try { fs.unlinkSync(filePath); } catch(e) {}
        }, 5000);
        res.json({ success: true, message: 'Ticket enviado a cocina' });
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Endpoint para imprimir recibos de caja
app.post('/print-receipt', (req, res) => {
  console.log('=== RECIBO RECIBIDO ===');
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
    
    const receipt = `        CHIFA CHEFCITO
Estamos ubicados : Jr. Pedro Villon N°223
        Barrio San Juan

      Huacri - Ancash
📞 956 663 491 - Daniel Gloriaza
📞 994 233 034 - Ruth Zamora

Mozo : ${waiter || 'Carlos'}           Hora : ${horaFormateada} PM
Mesa : ${table || orderNumber}                      Fecha : ${fechaFormateada}

CANT.    DESCRIPCION        PRECIO    IMPORTE
========================================
${items.map(item => {
  const cant = item.quantity.toString().padEnd(4);
  const desc = item.name.substring(0, 15).padEnd(16);
  const precio = `S/${item.price.toFixed(2)}`.padStart(8);
  const importe = `S/${(item.quantity * item.price).toFixed(2)}`.padStart(8);
  return `${cant}  ${desc}  ${precio}  ${importe}`;
}).join('\n')}

           TOTAL A PAGAR : S/${total.toFixed(2)}
========================================
        Gracias por su compra!
`;

    const fileName = `recibo_${orderNumber}.txt`;
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, receipt);
    
    exec(`notepad /p "${filePath}"`, (error) => {
      if (error) {
        res.status(500).json({ success: false, error: error.message });
      } else {
        setTimeout(() => {
          try { fs.unlinkSync(filePath); } catch(e) {}
        }, 5000);
        res.json({ success: true, message: 'Recibo impreso' });
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor de impresión corriendo en puerto ${PORT}`);
  console.log('Listo para recibir órdenes de tablets/móviles');
  console.log('Presiona Ctrl+C para detener el servidor');
  console.log('Prueba local: http://localhost:3001');
  console.log('Desde móvil: http://192.168.1.104:3001');
});

// Mantener el proceso vivo
process.on('SIGINT', () => {
  console.log('\nCerrando servidor de impresión...');
  server.close(() => {
    process.exit(0);
  });
});

// Evitar que el proceso termine
process.stdin.resume();

export default app;