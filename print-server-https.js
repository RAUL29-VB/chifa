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

app.use(cors());
app.use(express.json());

// Endpoint de prueba
app.get('/', (req, res) => {
  res.json({ message: 'Servidor de impresión HTTPS activo', status: 'running' });
});

// Endpoint para imprimir tickets de cocina
app.post('/print-kitchen', (req, res) => {
  console.log('=== PETICION RECIBIDA ===');
  console.log('Desde:', req.ip);
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

    const fileName = `ticket_${orderNumber}.txt`;
    const filePath = path.join(__dirname, fileName);
    
    fs.writeFileSync(filePath, ticket);
    
    exec(`notepad /p "${filePath}"`, (error) => {
      if (error) {
        console.error('Error al imprimir:', error);
        res.status(500).json({ success: false, error: error.message });
      } else {
        console.log(`Ticket ${orderNumber} enviado a impresora`);
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

// Certificado auto-firmado simple
const options = {
  key: `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB
wQNfFmuPiKycsHiOWXcdwhYKix/WrVVVPMa9hgHNVyssOP6oxuZH9wqrg+sFdWti
ooRaKFh9o19DKSdl1Yt7OjdJ1NU//L5eqHpVbmEqfvBaOjBHrkmFBiXp/WMhO6Nt
WGNB0bUYIDGv40SHs7sEB/jmwkpP4IM9IoPpFVm51Aw=
-----END PRIVATE KEY-----`,
  cert: `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/OvD/XcWMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMTYxMjI4MjE0MjA1WhcNMjYxMjI2MjE0MjA1WjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAu1SU1L7VLPHCgcEDXxZrj4isnLB4jll3HcIWCosfVq1VVTzGvYYBzVcr
LDj+qMbmR/cKq4PrBXVrYqKEWihYfaNfQyknZdWLezo3SdTVP/y+Xqh6VW5hKn7w
WjowR65JhQYl6f1jITujbVhjQdG1GCAxr+NEh7O7BAf45sJKT+CDPSKDaRVZudQM
owIDAQABo1AwTjAdBgNVHQ4EFgQUhKs/VJ3IWyKwrl0CEecqBGxRA7EwHwYDVR0j
BBgwFoAUhKs/VJ3IWyKwrl0CEecqBGxRA7EwDAYDVR0TBAUwAwEB/zANBgkqhkiG
9w0BAQsFAAOCAQEAWGbVYaKw5XwVBjyiuFgdyRyahvKr0Chq6FiVZugn5p6o4W1i
sIizCTrxec8+kRAXOWVi+CuQdHM0INn1MKhzchLJ3f6PiSgFVlDOQCGSgMEXggvR
3oy9yrXKQMeVlTdyxHNFHuLjlxMl4MRsjQpM6FNJg0ixsINkqbPaFcXkEwXBcZT+
djKQxn7v2+cDGqeVHEgpfpO2ycmw6Nqw==
-----END CERTIFICATE-----`
};

const server = https.createServer(options, app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor HTTPS de impresión corriendo en puerto ${PORT}`);
  console.log('Desde móvil: https://192.168.1.104:3001');
  console.log('NOTA: Acepta el certificado de seguridad en el navegador');
});

export default app;