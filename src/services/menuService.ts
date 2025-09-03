import { supabaseService } from './supabaseService';

// Re-exportar todo desde supabaseService para mantener compatibilidad
export const menuService = {
  // Menu Items
  async getMenuItems() {
    const items = await supabaseService.getMenuItems();
    return items.map(item => ({ $id: item.id, ...item }));
  },

  async createMenuItem(item: any) {
    const created = await supabaseService.createMenuItem(item);
    return { $id: created.id, ...created };
  },

  async updateMenuItem(id: string, item: any) {
    const updated = await supabaseService.updateMenuItem(id, item);
    return { $id: updated.id, ...updated };
  },

  async deleteMenuItem(id: string) {
    return await supabaseService.deleteMenuItem(id);
  },

  // Categories
  async getCategories() {
    const categories = await supabaseService.getCategories();
    return categories.map(cat => ({ $id: cat.id, name: cat.name }));
  },

  async createCategory(category: any) {
    const created = await supabaseService.createCategory(category);
    return { $id: created.id, ...created };
  },

  // Tables
  async getTables() {
    const tables = await supabaseService.getTables();
    return tables.map(table => ({ $id: table.id, ...table }));
  },

  async createTable(table: any) {
    const created = await supabaseService.createTable(table);
    return { $id: created.id, ...created };
  },

  async updateTable(id: string, table: any) {
    const updated = await supabaseService.updateTable(id, table);
    return { $id: updated.id, ...updated };
  },

  async deleteTable(id: string) {
    return await supabaseService.deleteTable(id);
  },

  // Employees
  async getEmployees() {
    const employees = await supabaseService.getEmployees();
    return employees.map(emp => ({ $id: emp.id, ...emp }));
  },

  async createEmployee(employee: any) {
    const created = await supabaseService.createEmployee(employee);
    return { $id: created.id, ...created };
  },

  async updateEmployee(id: string, employee: any) {
    const updated = await supabaseService.updateEmployee(id, employee);
    return { $id: updated.id, ...updated };
  },

  async deleteEmployee(id: string) {
    return await supabaseService.deleteEmployee(id);
  },

  // Positions
  async getPositions() {
    const positions = await supabaseService.getPositions();
    return positions.map(pos => ({ $id: pos.id, ...pos }));
  },

  async createPosition(position: any) {
    const created = await supabaseService.createPosition(position);
    return { $id: created.id, ...created };
  },

  async updatePosition(id: string, position: any) {
    const updated = await supabaseService.updatePosition(id, position);
    return { $id: updated.id, ...updated };
  },

  async deletePosition(id: string) {
    return await supabaseService.deletePosition(id);
  },

  // Users
  async getUsers() {
    const users = await supabaseService.getUsers();
    return users.map(user => ({ $id: user.id, ...user }));
  },

  async createUser(user: any) {
    const created = await supabaseService.createUser(user);
    return { $id: created.id, ...created };
  },

  async updateUser(id: string, user: any) {
    const updated = await supabaseService.updateUser(id, user);
    return { $id: updated.id, ...updated };
  },

  async deleteUser(id: string) {
    return await supabaseService.deleteUser(id);
  },

  // Attendance
  async getAttendance() {
    const attendance = await supabaseService.getAttendance();
    return attendance.map(att => ({ $id: att.id, ...att }));
  },

  async createAttendance(attendance: any) {
    const created = await supabaseService.createAttendance(attendance);
    return { $id: created.id, ...created };
  },

  async updateAttendance(id: string, attendance: any) {
    const updated = await supabaseService.updateAttendance(id, attendance);
    return { $id: updated.id, ...updated };
  },

  // Orders
  async getOrders() {
    const orders = await supabaseService.getOrders();
    return orders.map(order => ({ $id: order.id, ...order }));
  },

  async createOrder(order: any) {
    const created = await supabaseService.createOrder(order);
    return { $id: created.id, ...created };
  },

  async updateOrder(id: string, order: any) {
    const updated = await supabaseService.updateOrder(id, order);
    return { $id: updated.id, ...updated };
  },

  // Cash Register
  async getCashRegister() {
    const cashRegister = await supabaseService.getCashRegister();
    return cashRegister ? { $id: cashRegister.id, ...cashRegister } : null;
  },

  async createCashRegister(cashRegister: any) {
    const created = await supabaseService.createCashRegister(cashRegister);
    return { $id: created.id, ...created };
  },

  async updateCashRegister(id: string, cashRegister: any) {
    const updated = await supabaseService.updateCashRegister(id, cashRegister);
    return { $id: updated.id, ...updated };
  },

  // Settings
  async getSettings() {
    const settings = await supabaseService.getSettings();
    return settings ? { $id: settings.id, ...settings } : null;
  },

  async updateSettings(settings: any) {
    const updated = await supabaseService.updateSettings(settings);
    return { $id: updated.id, ...updated };
  }
};