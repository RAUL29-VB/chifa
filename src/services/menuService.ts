import { databases, DATABASE_ID, MENU_ITEMS_COLLECTION_ID, CATEGORIES_COLLECTION_ID, TABLES_COLLECTION_ID, EMPLOYEES_COLLECTION_ID, ATTENDANCE_COLLECTION_ID, POSITIONS_COLLECTION_ID, USERS_COLLECTION_ID, ORDERS_COLLECTION_ID, ID, Query } from './appwrite';

// Agregar el ID de la colección de caja
export const CASH_REGISTER_COLLECTION_ID = 'cash-register-collection';

export interface MenuItem {
  $id?: string;
  name: string;
  price: number;
  category: string;
  description: string;
  preparationTime: number;
  isSpicy: boolean;
  isVegetarian: boolean;
  available: boolean;
}

export interface Category {
  $id?: string;
  name: string;
  order?: number;
}



export const menuService = {
  // Menu Items
  async getMenuItems(): Promise<MenuItem[]> {
    const response = await databases.listDocuments(
      DATABASE_ID, 
      MENU_ITEMS_COLLECTION_ID,
      [Query.limit(200)]
    );
    return response.documents as MenuItem[];
  },

  async createMenuItem(item: Omit<MenuItem, '$id'>): Promise<MenuItem> {
    // Verificar si ya existe un producto con el mismo nombre
    const existing = await databases.listDocuments(
      DATABASE_ID,
      MENU_ITEMS_COLLECTION_ID,
      [Query.equal('name', item.name)]
    );
    
    if (existing.documents.length > 0) {
      throw new Error(`Producto '${item.name}' ya existe`);
    }
    
    const response = await databases.createDocument(
      DATABASE_ID,
      MENU_ITEMS_COLLECTION_ID,
      ID.unique(),
      item
    );
    return response as MenuItem;
  },

  async updateMenuItem(id: string, item: Partial<MenuItem>): Promise<MenuItem> {
    const response = await databases.updateDocument(
      DATABASE_ID,
      MENU_ITEMS_COLLECTION_ID,
      id,
      item
    );
    return response as MenuItem;
  },

  async deleteMenuItem(id: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, MENU_ITEMS_COLLECTION_ID, id);
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const response = await databases.listDocuments(DATABASE_ID, CATEGORIES_COLLECTION_ID);
    return response.documents as Category[];
  },

  async createCategory(category: Omit<Category, '$id'>): Promise<Category> {
    const response = await databases.createDocument(
      DATABASE_ID,
      CATEGORIES_COLLECTION_ID,
      ID.unique(),
      category
    );
    return response as Category;
  },

  // Tables
  async getTables(): Promise<any[]> {
    const response = await databases.listDocuments(
      DATABASE_ID,
      TABLES_COLLECTION_ID,
      [Query.limit(50)]
    );
    return response.documents;
  },

  async createTable(table: any): Promise<any> {
    const response = await databases.createDocument(
      DATABASE_ID,
      TABLES_COLLECTION_ID,
      ID.unique(),
      table
    );
    return response;
  },

  async updateTable(id: string, table: any): Promise<any> {
    const response = await databases.updateDocument(
      DATABASE_ID,
      TABLES_COLLECTION_ID,
      id,
      table
    );
    return response;
  },

  async deleteTable(id: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, TABLES_COLLECTION_ID, id);
  },

  // Employees
  async getEmployees(): Promise<any[]> {
    const response = await databases.listDocuments(
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      [Query.limit(100)]
    );
    return response.documents;
  },

  async createEmployee(employee: any): Promise<any> {
    const response = await databases.createDocument(
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      ID.unique(),
      employee
    );
    return response;
  },

  async updateEmployee(id: string, employee: any): Promise<any> {
    const response = await databases.updateDocument(
      DATABASE_ID,
      EMPLOYEES_COLLECTION_ID,
      id,
      employee
    );
    return response;
  },

  async deleteEmployee(id: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, EMPLOYEES_COLLECTION_ID, id);
  },

  // Attendance
  async getAttendance(): Promise<any[]> {
    const response = await databases.listDocuments(
      DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      [Query.limit(200)]
    );
    return response.documents;
  },

  async createAttendance(attendance: any): Promise<any> {
    const response = await databases.createDocument(
      DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      ID.unique(),
      attendance
    );
    return response;
  },

  async updateAttendance(id: string, attendance: any): Promise<any> {
    const response = await databases.updateDocument(
      DATABASE_ID,
      ATTENDANCE_COLLECTION_ID,
      id,
      attendance
    );
    return response;
  },

  // Positions
  async getPositions(): Promise<any[]> {
    const response = await databases.listDocuments(
      DATABASE_ID,
      POSITIONS_COLLECTION_ID,
      [Query.limit(50)]
    );
    return response.documents;
  },

  async createPosition(position: any): Promise<any> {
    const response = await databases.createDocument(
      DATABASE_ID,
      POSITIONS_COLLECTION_ID,
      ID.unique(),
      position
    );
    return response;
  },

  async updatePosition(id: string, position: any): Promise<any> {
    const response = await databases.updateDocument(
      DATABASE_ID,
      POSITIONS_COLLECTION_ID,
      id,
      position
    );
    return response;
  },

  async deletePosition(id: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, POSITIONS_COLLECTION_ID, id);
  },

  // Users
  async getUsers(): Promise<any[]> {
    const response = await databases.listDocuments(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      [Query.limit(100)]
    );
    return response.documents;
  },

  async createUser(user: any): Promise<any> {
    const response = await databases.createDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      ID.unique(),
      user
    );
    return response;
  },

  async updateUser(id: string, user: any): Promise<any> {
    const response = await databases.updateDocument(
      DATABASE_ID,
      USERS_COLLECTION_ID,
      id,
      user
    );
    return response;
  },

  async deleteUser(id: string): Promise<void> {
    await databases.deleteDocument(DATABASE_ID, USERS_COLLECTION_ID, id);
  },

  // Orders
  async getOrders(): Promise<any[]> {
    const response = await databases.listDocuments(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      [Query.limit(100)]
    );
    return response.documents;
  },

  async createOrder(order: any): Promise<any> {
    const response = await databases.createDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      ID.unique(),
      order
    );
    return response;
  },

  async updateOrder(id: string, order: any): Promise<any> {
    const response = await databases.updateDocument(
      DATABASE_ID,
      ORDERS_COLLECTION_ID,
      id,
      order
    );
    return response;
  },

  // Cash Register
  async getCashRegister(): Promise<any> {
    const response = await databases.listDocuments(
      DATABASE_ID,
      CASH_REGISTER_COLLECTION_ID,
      [Query.limit(1)]
    );
    return response.documents[0] || null;
  },

  async createCashRegister(cashRegister: any): Promise<any> {
    const response = await databases.createDocument(
      DATABASE_ID,
      CASH_REGISTER_COLLECTION_ID,
      ID.unique(),
      cashRegister
    );
    return response;
  },

  async updateCashRegister(id: string, cashRegister: any): Promise<any> {
    const response = await databases.updateDocument(
      DATABASE_ID,
      CASH_REGISTER_COLLECTION_ID,
      id,
      cashRegister
    );
    return response;
  }
};