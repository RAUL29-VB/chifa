import { useState, useEffect } from 'react';
import { usePos } from '../../context/PosContext';
import { supabaseService } from '../../services/supabaseService';
import { Plus, Trash2 } from 'lucide-react';

function TableManagement() {
  const [newTable, setNewTable] = useState({ number: 0, capacity: 0 });
  const [showNewTableForm, setShowNewTableForm] = useState(false);
  const { state, dispatch } = usePos();

  useEffect(() => {
    const loadTables = async () => {
      try {
        const tables = await supabaseService.getTables();
        dispatch({ type: 'SET_TABLES_DATA', tables: tables.map(t => ({ $id: t.id, ...t })) });
      } catch (error) {
        console.error('Error loading tables:', error);
      }
    };
    
    loadTables();
  }, []);

  const handleAddTable = async () => {
    if (newTable.number <= 0 || state.tables.some(t => t.number === newTable.number)) return;
    
    try {
      const createdTable = await supabaseService.createTable({
        number: newTable.number,
        capacity: newTable.capacity,
        status: 'libre'
      });
      
      const table = {
        id: createdTable.id!,
        number: createdTable.number,
        capacity: createdTable.capacity,
        status: createdTable.status,
        currentOrder: [],
        total: 0,
        waiterName: undefined,
        customerCount: undefined,
        orderStartTime: undefined
      };
      
      dispatch({ type: 'ADD_TABLE', table });
      setNewTable({ number: 0, capacity: 0 });
      setShowNewTableForm(false);
    } catch (error) {
      console.error('Error creating table:', error);
      alert('Error al crear la mesa');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">Gestión de Mesas</h2>
        <button
          onClick={() => setShowNewTableForm(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Nueva Mesa</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-6">Estado de Mesas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {state.tables.map((table) => (
            <div
              key={table.id}
              className={`p-4 rounded-xl border-2 text-center transition-all duration-200 hover:shadow-lg ${
                table.status === 'libre' ? 'border-green-400 bg-green-50' :
                table.status === 'ocupada' ? 'border-yellow-400 bg-yellow-50' :
                table.status === 'cuenta' ? 'border-red-400 bg-red-50' :
                'border-gray-400 bg-gray-50'
              }`}
            >
              <div className="font-bold text-lg">Mesa {table.number}</div>
              <div className="text-sm text-gray-600 capitalize">{table.status}</div>
              <div className="text-xs text-gray-500">{table.capacity} personas</div>
              {table.total > 0 && (
                <div className="text-sm font-bold mt-2">S/ {table.total.toFixed(2)}</div>
              )}
              <button
                onClick={async () => {
                  try {
                    await supabaseService.deleteTable(table.id);
                    dispatch({ type: 'DELETE_TABLE', tableId: table.id });
                  } catch (error) {
                    console.error('Error deleting table:', error);
                    alert('Error al eliminar la mesa');
                  }
                }}
                aria-label={`Eliminar mesa ${table.number}`}
                className="mt-2 p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* New Table Form */}
      {showNewTableForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Agregar Nueva Mesa</h3>
            <div className="space-y-4">
              <div>
                <label htmlFor="table-number" className="block text-sm font-medium text-gray-700 mb-2">Número de Mesa</label>
                <input
                  id="table-number"
                  type="number"
                  value={newTable.number}
                  onChange={(e) => setNewTable({...newTable, number: parseInt(e.target.value)})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="table-capacity" className="block text-sm font-medium text-gray-700 mb-2">Capacidad</label>
                <input
                  id="table-capacity"
                  type="text"
                  value={newTable.capacity === 0 ? '' : newTable.capacity}
                  onChange={(e) => setNewTable({...newTable, capacity: parseInt(e.target.value) || 0})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Número de personas"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-4 mt-8">
              <button
                onClick={() => setShowNewTableForm(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddTable}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg"
              >
                Agregar Mesa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TableManagement;