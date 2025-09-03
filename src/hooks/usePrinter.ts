import { useState } from 'react';
import { ReceiptData } from '../services/printerService';
import { kitchenPrintService, KitchenTicket } from '../services/kitchenPrintService';

export const usePrinter = () => {
  const [isPrinting, setIsPrinting] = useState(false);
  const [lastPrintStatus, setLastPrintStatus] = useState<boolean | null>(null);

  const printReceipt = async (data: ReceiptData) => {
    setIsPrinting(true);
    try {
      // Usar servidor automático
      const success = await kitchenPrintService.printReceipt(data);
      setLastPrintStatus(success);
      return success;
    } finally {
      setIsPrinting(false);
    }
  };

  const printKitchenTicket = async (ticket: KitchenTicket) => {
    setIsPrinting(true);
    try {
      const success = await kitchenPrintService.printKitchenTicket(ticket);
      setLastPrintStatus(success);
      return success;
    } finally {
      setIsPrinting(false);
    }
  };

  const testPrint = async () => {
    setIsPrinting(true);
    try {
      const testData = {
        orderNumber: 'TEST001',
        items: [
          { name: 'Arroz Chaufa', quantity: 1, price: 15.00 },
          { name: 'Wantán Frito', quantity: 2, price: 8.00 }
        ],
        total: 31.00,
        date: new Date().toLocaleString(),
        table: '04',
        waiter: 'Carlos'
      };
      
      const success = await kitchenPrintService.printReceipt(testData);
      setLastPrintStatus(success);
      return success;
    } finally {
      setIsPrinting(false);
    }
  };

  return {
    printReceipt,
    printKitchenTicket,
    testPrint,
    isPrinting,
    lastPrintStatus
  };
};