import { usePrinter } from '../hooks/usePrinter';

export const PrinterTest = () => {
  const { testPrint, isPrinting, lastPrintStatus } = usePrinter();

  const handleTestPrint = async () => {
    await testPrint();
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">Prueba de Impresora TCP/IP</h3>
      
      <button
        onClick={handleTestPrint}
        disabled={isPrinting}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isPrinting ? 'Imprimiendo...' : 'Imprimir Prueba'}
      </button>

      {lastPrintStatus !== null && (
        <div className={`mt-2 p-2 rounded ${lastPrintStatus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {lastPrintStatus ? 'Impresión exitosa' : 'Error en la impresión'}
        </div>
      )}

      <div className="mt-4 text-sm text-gray-600">
        <p className="font-semibold mb-2">Configuración TCP/IP:</p>
        <div className="bg-blue-50 p-3 rounded mb-3">
          <p className="font-medium text-blue-800">IP de Impresora: 192.168.1.200</p>
          <p className="text-blue-600">Puerto: 9100 (RAW/TCP)</p>
        </div>
        <ol className="list-decimal ml-5 space-y-1">
          <li>Haz clic en "Imprimir Prueba"</li>
          <li>El sistema enviará directamente a la impresora TCP/IP</li>
          <li>No necesitas descargar archivos ni ejecutar scripts</li>
          <li>La impresión es automática via red</li>
        </ol>
        <p className="mt-3 text-xs text-green-600">
          Asegúrate: Impresora encendida, conectada a red, IP 192.168.1.200 accesible
        </p>
      </div>
    </div>
  );
};