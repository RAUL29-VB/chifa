import { useState, useEffect } from 'react';
import { supabaseService } from '../../services/supabaseService';
import { UserPlus, Users, Phone, Edit, Trash2, X, Save, Clock, CheckCircle, XCircle, Calendar, Settings, Plus } from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  phone: string;
  position: string;
  dni: string;
  status: 'activo' | 'inactivo' | 'vacaciones';
}

interface Attendance {
  employee_id: string;
  date: string;
  entry_time?: string;
  exit_time?: string;
}

interface Position {
  id: string;
  name: string;
  daylySalary: number;
}

interface StaffManagementProps {
  onEmployeesChange?: (employees: Employee[]) => void;
  onAttendanceChange?: (attendance: Attendance[]) => void;
}

function StaffManagement({ onEmployeesChange, onAttendanceChange }: StaffManagementProps = {}) {
  const [showNewEmployeeForm, setShowNewEmployeeForm] = useState(false);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPositionsModal, setShowPositionsModal] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    phone: '',
    position: '',
    dni: '',
    status: 'activo' as 'activo' | 'inactivo' | 'vacaciones'
  });

  const [positions, setPositions] = useState<Position[]>([]);
  const [newPosition, setNewPosition] = useState({ name: '', daylySalary: 0 });
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesData, attendanceData, positionsData] = await Promise.all([
          supabaseService.getEmployees(),
          supabaseService.getAttendance(),
          supabaseService.getPositions()
        ]);
        
        setEmployees(employeesData.map(emp => ({ id: emp.id!, ...emp })));
        setAttendance(attendanceData.map(att => ({ id: att.id!, ...att })));
        setPositions(positionsData.map(pos => ({ id: pos.id!, ...pos })));
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.phone || !newEmployee.position || !newEmployee.dni) return;
    
    try {
      const createdEmployee = await supabaseService.createEmployee(newEmployee);
      const employee: Employee = { id: createdEmployee.id!, ...createdEmployee };
      
      const newEmployees = [...employees, employee];
      setEmployees(newEmployees);
      onEmployeesChange?.(newEmployees);
      setNewEmployee({
        name: '',
        phone: '',
        position: '',
        dni: '',
        status: 'activo'
      });
      setShowNewEmployeeForm(false);
    } catch (error) {
      console.error('Error creating employee:', error);
      alert('Error al crear empleado');
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setNewEmployee(employee);
    setShowNewEmployeeForm(true);
  };

  const handleUpdateEmployee = async () => {
    if (!editingEmployee) return;
    
    try {
      const updateData = {
        name: newEmployee.name,
        phone: newEmployee.phone,
        position: newEmployee.position,
        dni: newEmployee.dni,
        status: newEmployee.status
      };
      
      await supabaseService.updateEmployee(editingEmployee.id, updateData);
      const updatedEmployees = employees.map(emp => 
        emp.id === editingEmployee.id ? { ...emp, ...updateData } : emp
      );
      setEmployees(updatedEmployees);
      onEmployeesChange?.(updatedEmployees);
      
      setEditingEmployee(null);
      setNewEmployee({
        name: '',
        phone: '',
        position: '',
        dni: '',
        status: 'activo'
      });
      setShowNewEmployeeForm(false);
    } catch (error) {
      console.error('Error updating employee:', error);
      alert('Error al actualizar empleado');
    }
  };

  const handleDeleteEmployee = async () => {
    if (!employeeToDelete) return;
    
    try {
      await supabaseService.deleteEmployee(employeeToDelete.id);
      const filteredEmployees = employees.filter(emp => emp.id !== employeeToDelete.id);
      setEmployees(filteredEmployees);
      onEmployeesChange?.(filteredEmployees);
      setShowDeleteModal(false);
      setEmployeeToDelete(null);
    } catch (error) {
      console.error('Error deleting employee:', error);
      alert('Error al eliminar empleado');
    }
  };

  const markEntry = async (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().slice(0, 5); // HH:MM format
    
    try {
      const existing = attendance.find(a => a.employee_id === employeeId && a.date === today);
      
      if (existing && existing.id) {
        const updateData = {
          employee_id: existing.employee_id,
          date: existing.date,
          entry_time: time,
          exit_time: existing.exit_time
        };
        await supabaseService.updateAttendance(existing.id, updateData);
      } else {
        await supabaseService.createAttendance({ employee_id: employeeId, date: today, entry_time: time });
      }
      
      const attendanceData = await supabaseService.getAttendance();
      setAttendance(attendanceData.map(att => ({ id: att.id!, ...att })));
      onAttendanceChange?.(attendanceData);
    } catch (error) {
      console.error('Error marking entry:', error);
      alert('Error al marcar entrada');
    }
  };

  const markExit = async (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const time = new Date().toTimeString().slice(0, 5); // HH:MM format
    
    try {
      const existing = attendance.find(a => a.employee_id === employeeId && a.date === today);
      
      if (existing && existing.id) {
        const updateData = {
          employee_id: existing.employee_id,
          date: existing.date,
          entry_time: existing.entry_time,
          exit_time: time
        };
        await supabaseService.updateAttendance(existing.id, updateData);
        const attendanceData = await supabaseService.getAttendance();
        setAttendance(attendanceData.map(att => ({ id: att.id!, ...att })));
        onAttendanceChange?.(attendanceData);
      }
    } catch (error) {
      console.error('Error marking exit:', error);
      alert('Error al marcar salida');
    }
  };

  const getTodayAttendance = (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(a => a.employee_id === employeeId && a.date === today);
  };

  const handleAddPosition = async () => {
    if (!newPosition.name || newPosition.daylySalary <= 0) return;
    
    try {
      const createdPosition = await supabaseService.createPosition(newPosition);
      const position: Position = { id: createdPosition.id!, ...createdPosition };
      setPositions([...positions, position]);
      setNewPosition({ name: '', daylySalary: 0 });
    } catch (error) {
      console.error('Error creating position:', error);
      alert('Error al crear cargo');
    }
  };

  const handleUpdatePosition = async () => {
    if (!editingPosition || !newPosition.name || newPosition.daylySalary <= 0) return;
    
    try {
      await supabaseService.updatePosition(editingPosition.id, newPosition);
      setPositions(positions.map(pos => 
        pos.id === editingPosition.id ? { ...pos, ...newPosition } : pos
      ));
      setEditingPosition(null);
      setNewPosition({ name: '', daylySalary: 0 });
    } catch (error) {
      console.error('Error updating position:', error);
      alert('Error al actualizar cargo');
    }
  };

  const handleDeletePosition = async (positionId: string) => {
    try {
      await supabaseService.deletePosition(positionId);
      setPositions(positions.filter(pos => pos.id !== positionId));
    } catch (error) {
      console.error('Error deleting position:', error);
      alert('Error al eliminar cargo');
    }
  };





  const getStatusColor = (status: string) => {
    switch (status) {
      case 'activo': return 'bg-green-100 text-green-800';
      case 'inactivo': return 'bg-red-100 text-red-800';
      case 'vacaciones': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Gestión de Personal</h2>
            <p className="text-gray-600 mt-1">Administra la información de tus empleados</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setShowPositionsModal(true)}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Settings className="w-5 h-5" />
              <span className="font-medium">Gestionar Cargos</span>
            </button>
            <button
              onClick={() => setShowAttendanceModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Clock className="w-5 h-5" />
              <span className="font-medium">Asistencia</span>
            </button>
            <button
              onClick={() => setShowHistoryModal(true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Calendar className="w-5 h-5" />
              <span className="font-medium">Historial</span>
            </button>
            <button
              onClick={() => setShowNewEmployeeForm(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <UserPlus className="w-5 h-5" />
              <span className="font-medium">Nuevo Empleado</span>
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Empleados</p>
              <p className="text-3xl font-bold text-gray-800">{employees.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Empleados Activos</p>
              <p className="text-3xl font-bold text-green-600">{employees.filter(e => e.status === 'activo').length}</p>
            </div>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">En Vacaciones</p>
              <p className="text-3xl font-bold text-yellow-600">{employees.filter(e => e.status === 'vacaciones').length}</p>
            </div>
            <Calendar className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Total Cargos</p>
              <p className="text-3xl font-bold text-purple-600">{new Set(employees.map(e => e.position)).size}</p>
            </div>
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">#</span>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de empleados */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
            <Users className="w-6 h-6 text-red-600" />
            <span>Lista de Empleados</span>
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {employees.map((employee) => (
              <div key={employee.id} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-start justify-between mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(employee.status)}`}>
                    {employee.status.charAt(0).toUpperCase() + employee.status.slice(1)}
                  </span>
                  <div className="flex space-x-1">
                    <button
                      type="button"
                      onClick={async () => {
                        const newStatus = employee.status === 'activo' ? 'vacaciones' : 'activo';
                        try {
                          await supabaseService.updateEmployee(employee.id, { status: newStatus });
                          const updatedEmployees = employees.map(emp => 
                            emp.id === employee.id ? { ...emp, status: newStatus } : emp
                          );
                          setEmployees(updatedEmployees);
                          onEmployeesChange?.(updatedEmployees);
                        } catch (error) {
                          console.error('Error updating status:', error);
                          alert('Error al cambiar estado');
                        }
                      }}
                      title={employee.status === 'activo' ? 'Marcar en vacaciones' : 'Marcar como activo'}
                      className={`p-2 rounded-lg transition-colors ${
                        employee.status === 'vacaciones' 
                          ? 'text-green-600 hover:bg-green-100' 
                          : 'text-yellow-600 hover:bg-yellow-100'
                      }`}
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditEmployee(employee)}
                      title="Editar empleado"
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEmployeeToDelete(employee);
                        setShowDeleteModal(true);
                      }}
                      title="Eliminar empleado"
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-lg font-bold text-gray-800">{employee.name}</h4>
                    <p className="text-sm text-gray-600 font-medium">{employee.position}</p>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      <span>{employee.phone}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">DNI:</span>
                      <span>{employee.dni}</span>
                    </div>
                    {(() => {
                      const todayAtt = getTodayAttendance(employee.id);
                      return todayAtt ? (
                        <div className="space-y-1">
                          {todayAtt.entry_time && (
                            <div className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-green-100 text-green-800">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-medium">Entrada: {todayAtt.entry_time}</span>
                            </div>
                          )}
                          {todayAtt.exit_time && (
                            <div className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-blue-100 text-blue-800">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-medium">Salida: {todayAtt.exit_time}</span>
                            </div>
                          )}
                          {!todayAtt.entry_time && !todayAtt.exit_time && (
                            <div className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                              <Clock className="w-3 h-3" />
                              <span className="text-xs font-medium">Sin marcar</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 px-2 py-1 rounded-lg bg-gray-100 text-gray-600">
                          <Clock className="w-3 h-3" />
                          <span className="text-xs font-medium">Sin marcar</span>
                        </div>
                      );
                    })()
                    }
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal de nuevo/editar empleado */}
      {showNewEmployeeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <UserPlus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {editingEmployee ? 'Editar Empleado' : 'Nuevo Empleado'}
                    </h3>
                    <p className="text-red-100 text-sm">
                      {editingEmployee ? 'Actualiza la información del empleado' : 'Registra un nuevo empleado'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewEmployeeForm(false);
                    setEditingEmployee(null);
                    setNewEmployee({
                      name: '',
                      phone: '',
                      position: '',
                      dni: '',
                      status: 'activo'
                    });
                  }}
                  title="Cerrar modal"
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre Completo</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez García"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono</label>
                  <input
                    type="tel"
                    placeholder="987654321"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({...newEmployee, phone: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Cargo</label>
                  <select
                    value={newEmployee.position}
                    onChange={(e) => setNewEmployee({...newEmployee, position: e.target.value})}
                    title="Seleccionar cargo del empleado"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  >
                    <option value="">Seleccionar cargo</option>
                    {positions.map(position => (
                      <option key={position.id} value={position.name}>{position.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">DNI</label>
                  <input
                    type="text"
                    placeholder="12345678"
                    maxLength={8}
                    value={newEmployee.dni}
                    onChange={(e) => setNewEmployee({...newEmployee, dni: e.target.value})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Estado</label>
                  <select
                    value={newEmployee.status}
                    onChange={(e) => setNewEmployee({...newEmployee, status: e.target.value as any})}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  >
                    <option value="activo">Activo</option>
                    <option value="vacaciones">Vacaciones</option>
                    <option value="inactivo">Inactivo</option>
                  </select>
                </div>
                

              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowNewEmployeeForm(false);
                    setEditingEmployee(null);
                    setNewEmployee({
                      name: '',
                      phone: '',
                      position: '',
                      dni: '',
                      status: 'activo'
                    });
                  }}
                  className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={editingEmployee ? handleUpdateEmployee : handleAddEmployee}
                  disabled={!newEmployee.name || !newEmployee.phone || !newEmployee.position || !newEmployee.dni}
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingEmployee ? 'Actualizar' : 'Crear'} Empleado</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Asistencia */}
      {showAttendanceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Control de Asistencia</h3>
                    <p className="text-blue-100 text-sm">Marca la asistencia de hoy - {new Date().toLocaleDateString()}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAttendanceModal(false)}
                  title="Cerrar modal de asistencia"
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="space-y-4">
                {employees.filter(emp => emp.status === 'activo').map((employee) => {
                  const todayAttendance = getTodayAttendance(employee.id);
                  return (
                    <div key={employee.id} className="bg-gray-50 rounded-xl p-6 flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div>
                          <h4 className="text-lg font-bold text-gray-800">{employee.name}</h4>
                          <p className="text-sm text-gray-600">{employee.position}</p>
                        </div>
                        {todayAttendance && (
                          <div className="flex space-x-2">
                            {todayAttendance.entry_time && (
                              <div className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Entrada: {todayAttendance.entry_time}
                              </div>
                            )}
                            {todayAttendance.exit_time && (
                              <div className="px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                Salida: {todayAttendance.exit_time}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => markEntry(employee.id)}
                          disabled={!!todayAttendance?.entry_time}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                            todayAttendance?.entry_time
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 text-green-800 hover:bg-green-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Entrada</span>
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => markExit(employee.id)}
                          disabled={!todayAttendance?.entry_time || !!todayAttendance?.exit_time}
                          className={`px-4 py-2 rounded-lg transition-colors flex items-center space-x-2 ${
                            todayAttendance?.exit_time
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <XCircle className="w-4 h-4" />
                          <span className="text-sm font-medium">Salida</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => setShowAttendanceModal(false)}
                  className="px-8 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Historial */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Historial de Asistencia</h3>
                    <p className="text-purple-100 text-sm">Registro completo de asistencias</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  title="Cerrar historial"
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-4 font-semibold text-gray-800 border-b">Empleado</th>
                      <th className="text-left p-4 font-semibold text-gray-800 border-b">Cargo</th>
                      <th className="text-left p-4 font-semibold text-gray-800 border-b">Fecha</th>
                      <th className="text-left p-4 font-semibold text-gray-800 border-b">Entrada</th>
                      <th className="text-left p-4 font-semibold text-gray-800 border-b">Salida</th>
                      <th className="text-left p-4 font-semibold text-gray-800 border-b">Horas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((record, index) => {
                        const employee = employees.find(emp => emp.id === record.employee_id);
                        if (!employee) return null;
                        
                        const calculateHours = () => {
                          if (!record.entry_time || !record.exit_time) return '-';
                          const [entryHour, entryMin] = record.entry_time.split(':').map(Number);
                          const [exitHour, exitMin] = record.exit_time.split(':').map(Number);
                          const entryMinutes = entryHour * 60 + entryMin;
                          const exitMinutes = exitHour * 60 + exitMin;
                          const diffMinutes = exitMinutes - entryMinutes;
                          const hours = Math.floor(diffMinutes / 60);
                          const minutes = diffMinutes % 60;
                          return `${hours}h ${minutes}m`;
                        };
                        
                        return (
                          <tr key={`${record.employee_id}-${record.date}-${index}`} className="hover:bg-gray-50">
                            <td className="p-4 border-b">
                              <div>
                                <div className="font-medium text-gray-800">{employee.name}</div>
                                <div className="text-sm text-gray-600">{employee.dni}</div>
                              </div>
                            </td>
                            <td className="p-4 border-b">
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                {employee.position}
                              </span>
                            </td>
                            <td className="p-4 border-b text-gray-700">
                              {new Date(record.date).toLocaleDateString('es-PE')}
                            </td>
                            <td className="p-4 border-b">
                              {record.entry_time ? (
                                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-lg text-sm font-medium">
                                  {record.entry_time}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                            <td className="p-4 border-b">
                              {record.exit_time ? (
                                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium">
                                  {record.exit_time}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-sm">-</span>
                              )}
                            </td>
                            <td className="p-4 border-b">
                              <span className="font-medium text-gray-700">{calculateHours()}</span>
                            </td>
                          </tr>
                        );
                      })}
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-500">
                          No hay registros de asistencia
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowHistoryModal(false)}
                  className="px-8 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && employeeToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-3xl">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                  <Trash2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white">Eliminar Empleado</h3>
                  <p className="text-red-100 text-sm">Esta acción no se puede deshacer</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <div className="text-center mb-6">
                <p className="text-gray-800 text-lg mb-2">
                  ¿Estás seguro de eliminar a <strong>{employeeToDelete.name}</strong>?
                </p>
                <p className="text-gray-600 text-sm">
                  Se eliminará toda la información del empleado y su historial de asistencia.
                </p>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setEmployeeToDelete(null);
                  }}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteEmployee}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de gestión de cargos */}
      {showPositionsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Gestión de Cargos</h3>
                    <p className="text-green-100 text-sm">Administra los cargos y sus salarios diarios</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowPositionsModal(false);
                    setEditingPosition(null);
                    setNewPosition({ name: '', daylySalary: 0 });
                  }}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Formulario para nuevo cargo */}
              <div className="bg-gray-50 rounded-xl p-6 mb-6">
                <h4 className="text-lg font-bold text-gray-800 mb-4">
                  {editingPosition ? 'Editar Cargo' : 'Nuevo Cargo'}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Cargo</label>
                    <input
                      type="text"
                      placeholder="Ej: Administrador"
                      value={newPosition.name}
                      onChange={(e) => setNewPosition({...newPosition, name: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Salario Diario (S/)</label>
                    <input
                      type="number"
                      min="0"
                      step="5"
                      placeholder="50"
                      value={newPosition.daylySalary || ''}
                      onChange={(e) => setNewPosition({...newPosition, daylySalary: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      onClick={editingPosition ? handleUpdatePosition : handleAddPosition}
                      disabled={!newPosition.name || newPosition.daylySalary <= 0}
                      className="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{editingPosition ? 'Actualizar' : 'Agregar'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Lista de cargos */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-gray-800">Cargos Registrados</h4>
                {positions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {positions.map((position) => (
                      <div key={position.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-bold text-gray-800">{position.name}</h5>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => {
                                setEditingPosition(position);
                                setNewPosition({ name: position.name, daylySalary: position.daylySalary });
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeletePosition(position.id)}
                              className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-green-600">S/ {position.daylySalary.toFixed(2)}</div>
                        <div className="text-sm text-gray-600">por día</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Settings className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">No hay cargos registrados</p>
                    <p className="text-sm">Agrega el primer cargo para comenzar</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowPositionsModal(false);
                    setEditingPosition(null);
                    setNewPosition({ name: '', daylySalary: 0 });
                  }}
                  className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StaffManagement;