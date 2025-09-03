import { useState, useEffect } from 'react';
import { Users, Plus, X, Edit, Trash2 } from 'lucide-react';
import { supabaseService } from '../../services/supabaseService';

interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  status: string;
  employeeId?: string;
}

interface Employee {
  id: string;
  name: string;
  dni: string;
  position: string;
  status: string;
}

function UserManagement() {
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [newUser, setNewUser] = useState({
    employeeId: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ email: '', password: '' });

  useEffect(() => {
    loadEmployees();
    loadUsers();
  }, []);

  const loadEmployees = async () => {
    try {
      const employeesData = await supabaseService.getEmployees();
      setEmployees(employeesData);
    } catch (error) {
      console.error('Error loading employees:', error);
    }
  };

  const [users, setUsers] = useState<User[]>([]);

  const loadUsers = async () => {
    try {
      const usersData = await supabaseService.getUsers();
      setUsers(usersData.map(user => ({ id: user.id!, ...user })));
    } catch (error) {
      console.error('Error loading users:', error);
      // Si la colección no existe, usar array vacío
      setUsers([]);
    }
  };

  const handleAddUser = async () => {
    if (!selectedEmployee || !newUser.email || !newUser.password) return;
    
    try {
      const userData = {
        employee_id: selectedEmployee.id,
        name: selectedEmployee.name,
        email: newUser.email,
        password: newUser.password,
        status: 'activo'
      };
      
      await supabaseService.createUser(userData);
      await loadUsers();
      
      resetForm();
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error: Primero crea la colección users-collection en Appwrite');
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    setSelectedEmployee(employee || null);
    setNewUser({employeeId, email: '', password: ''});
  };

  const resetForm = () => {
    setNewUser({employeeId: '', email: '', password: ''});
    setSelectedEmployee(null);
    setShowPassword(false);
    setShowNewUserForm(false);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({ email: user.email, password: user.password || '' });
    setShowEditModal(true);
  };

  const handleDeleteUser = (user: User) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingUser) return;
    try {
      await supabaseService.deleteUser(deletingUser.id);
      await loadUsers();
      setShowDeleteModal(false);
      setDeletingUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Error al eliminar usuario');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await supabaseService.updateUser(editingUser.id, editForm);
      await loadUsers();
      setShowEditModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      alert('Error al actualizar usuario');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Gestión de Usuarios</h2>
            <p className="text-gray-600 mt-1">Administra usuarios y permisos del sistema</p>
          </div>
          <button
            onClick={() => setShowNewUserForm(true)}
            className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-3 rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 flex items-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Nuevo Usuario</span>
          </button>
        </div>
      </div>

      {/* Lista de usuarios */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
            <Users className="w-6 h-6 text-red-600" />
            <span>Usuarios del Sistema</span>
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.map((user) => {
              const employee = employees.find(emp => emp.id === user.employee_id);
              const role = employee?.position || 'Usuario';
              return (
              <div key={user.id} className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    role === 'Administrador' ? 'bg-red-100 text-red-800' :
                    role === 'Cajero' ? 'bg-blue-100 text-blue-800' :
                    role === 'Mozo' ? 'bg-green-100 text-green-800' :
                    role === 'Cocina' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {role}
                  </div>
                  <span className="text-xs text-green-600 font-medium">{user.status === 'activo' ? 'Activo' : 'Inactivo'}</span>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-lg font-bold text-gray-800 mb-1">{user.name}</h4>
                  <p className="text-sm text-gray-600">{user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">Contraseña: {user.password || 'No disponible'}</p>
                </div>
                
                <div className="flex space-x-2">
                  <button 
                    onClick={() => handleEditUser(user)}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-800 py-2 px-3 rounded-lg transition-colors text-sm font-medium"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => handleDeleteUser(user)}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-800 py-2 px-3 rounded-lg transition-colors text-sm font-medium"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
            })}
          </div>
        </div>
      </div>

      {/* Modal de nuevo usuario */}
      {showNewUserForm && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="bg-white bg-opacity-20 p-3 rounded-xl">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">Nuevo Usuario</h3>
                    <p className="text-red-100 text-sm">Crea una nueva cuenta de usuario</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowNewUserForm(false)}
                  aria-label="Cerrar modal"
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-8">
              <div className="space-y-6">
                <div>
                  <label htmlFor="employee-select" className="block text-sm font-semibold text-gray-700 mb-2">Seleccionar Empleado</label>
                  <select
                    id="employee-select"
                    value={newUser.employeeId}
                    onChange={(e) => handleEmployeeSelect(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  >
                    <option value="">Selecciona un empleado...</option>
                    {employees.filter(emp => emp.status === 'activo').map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} - {employee.position}
                      </option>
                    ))}
                  </select>
                </div>
                
                {selectedEmployee && (
                  <div className="bg-blue-50 p-4 rounded-xl">
                    <h4 className="font-semibold text-blue-800 mb-2">Empleado Seleccionado:</h4>
                    <div className="text-sm text-blue-700">
                      <p><strong>Nombre:</strong> {selectedEmployee.name}</p>
                      <p><strong>DNI:</strong> {selectedEmployee.dni}</p>
                      <p><strong>Posición:</strong> {selectedEmployee.position}</p>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="user-email" className="block text-sm font-semibold text-gray-700 mb-2">Email</label>
                    <input
                      id="user-email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="user-password" className="block text-sm font-semibold text-gray-700 mb-2">Contraseña</label>
                    <div className="relative">
                      <input
                        id="user-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={newUser.password}
                        onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                        className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </div>
                

              </div>

              {/* Footer */}
              <div className="flex justify-end space-x-4 mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={resetForm}
                  className="px-8 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-all font-medium flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancelar</span>
                </button>
                <button
                  onClick={handleAddUser}
                  disabled={!selectedEmployee || !newUser.email || !newUser.password}
                  className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Usuario</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Edit className="w-6 h-6 text-white" />
                  <h3 className="text-xl font-bold text-white">Editar Usuario</h3>
                </div>
                <button
                  onClick={() => setShowEditModal(false)}
                  aria-label="Cerrar modal de edición"
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <p className="text-gray-700 font-medium">{editingUser.name}</p>
              </div>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="edit-password" className="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                  <input
                    id="edit-password"
                    type="text"
                    value={editForm.password}
                    onChange={(e) => setEditForm({...editForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateUser}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Guardar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {showDeleteModal && deletingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-red-600 to-red-700 p-6 rounded-t-3xl">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-6 h-6 text-white" />
                <h3 className="text-xl font-bold text-white">Eliminar Usuario</h3>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                ¿Estás seguro de que deseas eliminar al usuario <strong>{deletingUser.name}</strong>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Esta acción no se puede deshacer.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;