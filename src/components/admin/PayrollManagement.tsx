import { useState, useEffect } from 'react';
import { menuService } from '../../services/menuService';
import { DollarSign, Calendar, Users, X, Download } from 'lucide-react';
import jsPDF from 'jspdf';

interface Employee {
  id: string;
  name: string;
  phone: string;
  position: string;
  dni: string;
  status: 'activo' | 'inactivo' | 'vacaciones';
  hourlyRate?: number;
}

interface Attendance {
  employeeId: string;
  date: string;
  entryTime?: string;
  exitTime?: string;
}



function PayrollManagement() {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  useEffect(() => {
    const loadData = async () => {
      try {
        const [employeesData, attendanceData] = await Promise.all([
          menuService.getEmployees(),
          menuService.getAttendance()
        ]);
        
        setEmployees(employeesData.map(emp => ({ id: emp.$id!, ...emp })));
        setAttendance(attendanceData.map(att => ({ id: att.$id!, ...att })));
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    
    loadData();
  }, []);
  


  const viewEmployeeDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowPaymentModal(true);
  };

  const downloadPayrollPDF = (employee: Employee) => {
    const payroll = calculatePayroll(employee.id);
    const monthName = new Date(selectedMonth + '-01').toLocaleDateString('es-PE', { year: 'numeric', month: 'long' });
    const employeeAttendance = getEmployeeAttendance(employee.id);
    
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text('RECIBO DE PAGO', 105, 20, { align: 'center' });
    doc.setFontSize(16);
    doc.text('Chifa-chefcito', 105, 30, { align: 'center' });
    
    // Employee info
    doc.setFontSize(12);
    doc.text(`Empleado: ${employee.name}`, 20, 50);
    doc.text(`DNI: ${employee.dni}`, 20, 60);
    doc.text(`Cargo: ${employee.position}`, 20, 70);
    doc.text(`Periodo: ${monthName}`, 20, 80);
    
    // Summary
    doc.text('RESUMEN DE ASISTENCIA:', 20, 100);
    doc.text(`Dias Trabajados: ${payroll.daysWorked}`, 20, 110);
    doc.text(`Total Horas: ${payroll.totalHours.toFixed(1)}h`, 20, 120);
    doc.text(`Pago por Dia: S/ ${payroll.dailyRate.toFixed(2)}`, 20, 130);
    
    // Daily details header
    doc.text('DETALLE DIARIO:', 20, 150);
    doc.text('Fecha', 20, 160);
    doc.text('Entrada', 60, 160);
    doc.text('Salida', 100, 160);
    doc.text('Horas', 140, 160);
    
    // Daily details
    let yPos = 170;
    employeeAttendance.forEach(record => {
      const hours = calculateHours(record.entryTime, record.exitTime);
      const hoursText = hours > 0 ? `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m` : '-';
      
      doc.text(new Date(record.date).toLocaleDateString('es-PE'), 20, yPos);
      doc.text(record.entryTime || '-', 60, yPos);
      doc.text(record.exitTime || '-', 100, yPos);
      doc.text(hoursText, 140, yPos);
      yPos += 10;
    });
    
    // Total
    yPos += 10;
    doc.setFontSize(14);
    doc.text(`TOTAL A PAGAR: S/ ${payroll.totalPay.toFixed(2)}`, 20, yPos);
    
    // Footer
    yPos += 20;
    doc.setFontSize(10);
    doc.text(`Fecha de emision: ${new Date().toLocaleDateString('es-PE')}`, 20, yPos);
    
    doc.save(`Recibo_${employee.name.replace(/\s+/g, '_')}_${selectedMonth}.pdf`);
  };

  const calculateHours = (entryTime?: string, exitTime?: string) => {
    if (!entryTime || !exitTime) return 0;
    const [entryHour, entryMin] = entryTime.split(':').map(Number);
    const [exitHour, exitMin] = exitTime.split(':').map(Number);
    const entryMinutes = entryHour * 60 + entryMin;
    const exitMinutes = exitHour * 60 + exitMin;
    return (exitMinutes - entryMinutes) / 60;
  };

  const getEmployeeAttendance = (employeeId: string) => {
    const monthStart = selectedMonth + '-01';
    const monthEnd = new Date(selectedMonth + '-01');
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    
    return attendance.filter(att => 
      att.employeeId === employeeId && 
      att.date >= monthStart && 
      att.date <= monthEnd.toISOString().split('T')[0]
    );
  };

  const positions = [
    { name: 'Administrador', dailyRate: 60 },
    { name: 'Cajero', dailyRate: 50 },
    { name: 'Mozo', dailyRate: 45 },
    { name: 'Cocina', dailyRate: 50 }
  ];

  const getDailyRateByPosition = (position: string) => {
    const pos = positions.find(p => p.name === position);
    return pos?.dailyRate || 50;
  };

  const calculatePayroll = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return { daysWorked: 0, totalHours: 0, totalPay: 0, dailyRate: 0 };
    
    const employeeAttendance = getEmployeeAttendance(employeeId);
    let totalHours = 0;
    
    // Contar solo días con entrada y salida completas
    const completeDays = employeeAttendance.filter(att => att.entryTime && att.exitTime);
    
    completeDays.forEach(att => {
      totalHours += calculateHours(att.entryTime, att.exitTime);
    });
    
    const dailyRate = employee.hourlyRate || getDailyRateByPosition(employee.position);
    const totalPay = completeDays.length * dailyRate;
    
    return {
      daysWorked: completeDays.length,
      totalHours,
      totalPay,
      dailyRate
    };
  };

  const getMonthlyStats = () => {
    const monthStart = selectedMonth + '-01';
    const monthEnd = new Date(selectedMonth + '-01');
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    
    const monthlyAttendance = attendance.filter(att => 
      att.date >= monthStart && 
      att.date <= monthEnd.toISOString().split('T')[0]
    );
    
    const totalDaysWorked = monthlyAttendance.length;
    let totalPayroll = 0;
    let employeesPaid = 0;
    
    employees.forEach(employee => {
      const payroll = calculatePayroll(employee.id);
      totalPayroll += payroll.totalPay;
      // TODO: Implementar lógica de empleados pagados
    });
    
    return {
      totalDaysWorked,
      totalPayroll,
      employeesPaid
    };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">Gestión de Pagos</h2>
          <p className="text-gray-600 mt-1">Administra los pagos del personal - {new Date(selectedMonth + '-01').toLocaleDateString('es-PE', { year: 'numeric', month: 'long' })}</p>
        </div>
      </div>

      {/* Estadísticas */}
      {(() => {
        const stats = getMonthlyStats();
        return (
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
                  <p className="text-gray-600 text-sm font-medium">Días Trabajados</p>
                  <p className="text-3xl font-bold text-green-600">{stats.totalDaysWorked}</p>
                </div>
                <Calendar className="w-8 h-8 text-green-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Nómina</p>
                  <p className="text-3xl font-bold text-purple-600">S/ {stats.totalPayroll.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-purple-600" />
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pagados</p>
                  <p className="text-3xl font-bold text-orange-600">{stats.employeesPaid}</p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold text-sm">✓</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cuadros de empleados */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-6 flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-green-600" />
            <span>Pagos del Personal</span>
          </h3>
          
          <div className="mb-6">
            <label htmlFor="month-selector" className="block text-sm font-medium text-gray-700 mb-2">Seleccionar Mes</label>
            <select
              id="month-selector"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              title="Seleccionar mes para ver los pagos"
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {Array.from({ length: 12 }, (_, i) => {
                const date = new Date();
                date.setMonth(date.getMonth() - i);
                const value = date.toISOString().slice(0, 7);
                const label = date.toLocaleDateString('es-PE', { year: 'numeric', month: 'long' });
                return (
                  <option key={`${value}-${i}`} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees.map((employee) => {
              const payroll = calculatePayroll(employee.id);
              const isPaid = false; // TODO: Implementar estado de pago
                
              return (
                <div 
                  key={employee.id} 
                  onClick={() => viewEmployeeDetails(employee)}
                  className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 cursor-pointer hover:border-blue-300"
                >
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          {employee.position}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {isPaid ? 'Pagado' : 'Pendiente'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadPayrollPDF(employee);
                          }}
                          className="px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span className="hidden sm:inline">Descargar</span>
                        </button>
                        {!isPaid && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="px-3 py-1 bg-green-100 text-green-800 hover:bg-green-200 rounded-lg text-xs font-medium transition-colors"
                          >
                            <span className="hidden sm:inline">Marcar Pagado</span>
                            <span className="sm:hidden">✓</span>
                          </button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-lg font-bold text-gray-800">{employee.name}</h4>
                        <p className="text-sm text-gray-600">DNI: {employee.dni}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Días Trabajados:</span>
                          <span className="font-medium text-gray-800">{payroll.daysWorked}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Total Horas:</span>
                          <span className="font-medium text-gray-800">{payroll.totalHours.toFixed(1)}h</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Pago por Día:</span>
                          <span className="font-bold text-blue-600">S/ {payroll.dailyRate.toFixed(2)}</span>
                        </div>
                      </div>
                      
                      <div className="pt-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Pago Total:</span>
                          <span className="text-xl font-bold text-green-600">S/ {payroll.totalPay.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Modal de detalles */}
      {showPaymentModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 rounded-t-3xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">{selectedEmployee.name}</h3>
                  <p className="text-blue-100 text-sm">Detalle de asistencias - {new Date(selectedMonth + '-01').toLocaleDateString('es-PE', { year: 'numeric', month: 'long' })}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(false)}
                  title="Cerrar modal"
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Resumen del empleado */}
              {(() => {
                const payroll = calculatePayroll(selectedEmployee.id);
                return (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{payroll.daysWorked}</div>
                        <div className="text-sm text-blue-700">Días Trabajados</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{payroll.totalHours.toFixed(1)}h</div>
                        <div className="text-sm text-green-700">Total Horas</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">S/ {payroll.dailyRate.toFixed(2)}</div>
                        <div className="text-sm text-orange-700">Pago por Día</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">S/ {payroll.totalPay.toFixed(2)}</div>
                        <div className="text-sm text-purple-700">Total a Pagar</div>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {/* Tabla detallada */}
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-3 font-semibold text-gray-800 border-b">Fecha</th>
                      <th className="text-left p-3 font-semibold text-gray-800 border-b">Día</th>
                      <th className="text-left p-3 font-semibold text-gray-800 border-b">Entrada</th>
                      <th className="text-left p-3 font-semibold text-gray-800 border-b">Salida</th>
                      <th className="text-left p-3 font-semibold text-gray-800 border-b">Horas</th>
                      <th className="text-left p-3 font-semibold text-gray-800 border-b">Estado</th>
                      <th className="text-left p-3 font-semibold text-gray-800 border-b">Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getEmployeeAttendance(selectedEmployee.id).map((record, index) => {
                      const hours = calculateHours(record.entryTime, record.exitTime);
                      const dayName = new Date(record.date).toLocaleDateString('es-PE', { weekday: 'short' });
                      const employee = employees.find(emp => emp.id === selectedEmployee.id);
                      const dailyRate = employee?.hourlyRate || getDailyRateByPosition(employee?.position || '');
                      const dailyPay = (record.entryTime && record.exitTime) ? dailyRate : 0;
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="p-3 border-b">{new Date(record.date).toLocaleDateString('es-PE')}</td>
                          <td className="p-3 border-b text-sm text-gray-600 capitalize">{dayName}</td>
                          <td className="p-3 border-b">
                            {record.entryTime ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">{record.entryTime}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-3 border-b">
                            {record.exitTime ? (
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">{record.exitTime}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="p-3 border-b font-medium">
                            {hours > 0 ? `${Math.floor(hours)}h ${Math.round((hours % 1) * 60)}m` : '-'}
                          </td>
                          <td className="p-3 border-b">
                            {record.entryTime && record.exitTime ? (
                              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                Completo
                              </span>
                            ) : (
                              <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                                Incompleto
                              </span>
                            )}
                          </td>
                          <td className="p-3 border-b">
                            <div className="font-medium text-green-600">
                              S/ {dailyPay.toFixed(2)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center mt-8 pt-6 border-t border-gray-200">
                <button
                  onClick={() => downloadPayrollPDF(selectedEmployee)}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>Descargar Recibo</span>
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-8 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 font-medium shadow-lg hover:shadow-xl transform hover:scale-105"
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

export default PayrollManagement;