import { 
  Settings,
  DollarSign,
  BarChart3,
  Save,
  Trash2,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { settingsService } from '../../services/settingsService';
import { cashRegisterService } from '../../services/cashRegisterService';

function SettingsManagement() {
  const [cashInitialAmount, setCashInitialAmount] = useState('200.00');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');



  useEffect(() => {
    loadSettings();

  }, []);

  const loadSettings = async () => {
    const settings = await settingsService.getSettings();
    if (settings) {
      setCashInitialAmount(settings.cashInitialAmount.toString());
    }
  };



  const handleSaveCashAmount = async () => {
    setLoading(true);
    const amount = parseFloat(cashInitialAmount);
    if (isNaN(amount) || amount < 0) {
      setMessage('Monto inválido');
      setLoading(false);
      return;
    }

    const success = await settingsService.updateCashInitialAmount(amount);
    if (success) {
      setMessage('Configuración guardada');
    } else {
      setMessage('Error al guardar');
    }
    setLoading(false);
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Configuración del Sistema</h2>
        <p className="text-gray-600 mt-1">Administra la configuración general del restaurante</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Información del Restaurante */}
        <div className="xl:col-span-2 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-red-100 p-3 rounded-xl">
              <Settings className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-800">Información del Restaurante</h3>
              <p className="text-sm text-gray-600">Datos básicos de tu establecimiento</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="restaurant-name" className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Restaurante</label>
              <input
                id="restaurant-name"
                type="text"
                defaultValue="Chifa Chefcito"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="restaurant-ruc" className="block text-sm font-semibold text-gray-700 mb-2">RUC</label>
              <input
                id="restaurant-ruc"
                type="text"
                defaultValue="20123456789"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="restaurant-address" className="block text-sm font-semibold text-gray-700 mb-2">Dirección</label>
              <input
                id="restaurant-address"
                type="text"
                defaultValue="Av. Principal 123, Lima"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="restaurant-phone" className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
              <input
                id="restaurant-phone"
                type="text"
                defaultValue="(01) 234-5678"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="restaurant-email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
              <input
                id="restaurant-email"
                type="email"
                defaultValue="contacto@chefcito.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
            <div>
              <label htmlFor="restaurant-hours" className="block text-sm font-semibold text-gray-700 mb-2">Horario de Atención</label>
              <input
                id="restaurant-hours"
                type="text"
                defaultValue="11:00 AM - 11:00 PM"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
              />
            </div>
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <button className="bg-gradient-to-r from-red-600 to-red-700 text-white px-8 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center space-x-2">
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </div>

        {/* Panel de configuraciones rápidas */}
        <div className="space-y-6">
          {/* Configuración del Sistema */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-100 p-2 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-800">Sistema</h4>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-800">Modo Oscuro</div>
                  <div className="text-sm text-gray-600">Cambiar tema visual</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" aria-label="Activar modo oscuro" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <div className="font-medium text-gray-800">Notificaciones</div>
                  <div className="text-sm text-gray-600">Alertas del sistema</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" defaultChecked aria-label="Activar notificaciones" className="sr-only peer" />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Configuración de Caja */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-800">Caja</h4>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="initial-amount" className="block text-sm font-medium text-gray-700 mb-2">Monto Inicial</label>
                <input
                  id="initial-amount"
                  type="number"
                  step="0.01"
                  value={cashInitialAmount}
                  onChange={(e) => setCashInitialAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <button 
                onClick={handleSaveCashAmount}
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-medium disabled:opacity-50 mb-2"
              >
                {loading ? 'Guardando...' : 'Guardar Configuración'}
              </button>
              
              <div className="text-xs text-gray-500 text-center">
                Monto configurado para apertura de caja
              </div>
              
              {message && (
                <div className={`text-sm text-center ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </div>
              )}
            </div>
          </div>

          {/* Acciones Rápidas */}
          <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-purple-100 p-2 rounded-lg">
                <BarChart3 className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="text-lg font-bold text-gray-800">Acciones</h4>
            </div>
            <div className="space-y-3">
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Exportar Datos</span>
              </button>
              <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 py-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2">
                <Settings className="w-4 h-4" />
                <span>Respaldar Sistema</span>
              </button>
              <button className="w-full bg-red-100 hover:bg-red-200 text-red-800 py-3 rounded-lg transition-colors text-sm font-medium flex items-center justify-center space-x-2">
                <Trash2 className="w-4 h-4" />
                <span>Limpiar Datos</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsManagement;