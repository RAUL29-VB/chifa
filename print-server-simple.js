import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Servidor HTTPS activo', status: 'running' });
});

app.post('/print-kitchen', (req, res) => {
  console.log('=== TICKET RECIBIDO ===');
  console.log('Datos:', req.body);
  
  try {
    const { orderNumber, items, table, waiter, time } = req.body;
    
    const ticket = `        CHIFA CHEFCITO
       TICKET DE COCINA
================================
Mesa: ${table}        Orden: ${orderNumber}
Mozo: ${waiter}
Hora: ${time}
================================
PLATOS A PREPARAR:
${items.map(item => `${item.quantity}x ${item.name}${item.notes ? `\n   Nota: ${item.notes}` : ''}`).join('\n')}
================================
`;

    const fileName = `ticket_${Date.now()}.txt`;
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, ticket);
    
    exec(`notepad /p "${filePath}"`, (error) => {
      setTimeout(() => {
        try { fs.unlinkSync(filePath); } catch(e) {}
      }, 5000);
    });
    
    res.json({ success: true, message: 'Ticket enviado' });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/print-receipt', (req, res) => {
  console.log('=== RECIBO RECIBIDO ===');
  
  try {
    const { orderNumber, items, total, date } = req.body;
    
    const receipt = `        CHIFA CHEFCITO
       RECIBO DE VENTA
================================
Orden: ${orderNumber}
Fecha: ${date}
--------------------------------
${items.map(item => {
  const line = `${item.name} x${item.quantity}`;
  const price = `S/${item.price.toFixed(2)}`;
  const spaces = 32 - line.length - price.length;
  return line + ' '.repeat(Math.max(0, spaces)) + price;
}).join('\n')}
--------------------------------
TOTAL: S/${total.toFixed(2)}
================================
     Gracias por su compra!
`;

    const fileName = `recibo_${Date.now()}.txt`;
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, receipt);
    
    exec(`notepad /p "${filePath}"`, (error) => {
      setTimeout(() => {
        try { fs.unlinkSync(filePath); } catch(e) {}
      }, 5000);
    });
    
    res.json({ success: true, message: 'Recibo impreso' });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Crear certificado auto-firmado simple
exec('openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"', (error) => {
  if (error) {
    console.log('No se pudo crear certificado, usando HTTP...');
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor HTTP corriendo en puerto ${PORT}`);
      console.log('Desde móvil: http://192.168.1.104:3001');
    });
  } else {
    try {
      const options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
      };
      
      https.createServer(options, app).listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor HTTPS corriendo en puerto ${PORT}`);
        console.log('Desde móvil: https://192.168.1.104:3001');
        console.log('ACEPTA EL CERTIFICADO EN EL NAVEGADOR');
      });
    } catch (e) {
      app.listen(PORT, '0.0.0.0', () => {
        console.log(`Servidor HTTP corriendo en puerto ${PORT}`);
      });
    }
  }
});

export default app;