import { Client, Databases, Account, ID, Query } from 'appwrite';

const client = new Client();

client
  .setEndpoint('https://nyc.cloud.appwrite.io/v1')
  .setProject('chifa-pos-system');

export const account = new Account(client);
export const databases = new Databases(client);

// Crear sesión anónima para desarrollo
const initializeAuth = async () => {
  try {
    await account.get();
  } catch (error) {
    try {
      await account.createAnonymousSession();
      console.log('✅ Sesión anónima creada');
    } catch (authError) {
      console.warn('⚠️ No se pudo crear sesión anónima:', authError);
    }
  }
};

initializeAuth();

export const DATABASE_ID = 'restaurant-database';
export const MENU_ITEMS_COLLECTION_ID = 'menu-items-collection';
export const CATEGORIES_COLLECTION_ID = 'categories-collection';
export const TABLES_COLLECTION_ID = 'tables-collection';
export const EMPLOYEES_COLLECTION_ID = 'employees-collection';
export const ATTENDANCE_COLLECTION_ID = 'attendance-collection';
export const POSITIONS_COLLECTION_ID = 'positions-collection';
export const USERS_COLLECTION_ID = 'users-collection';
export const ORDERS_COLLECTION_ID = 'orders-collection';
export const CASH_REGISTER_COLLECTION_ID = 'cash-register-collection';
export const SETTINGS_COLLECTION_ID = 'settings-collection';

export { ID, Query };