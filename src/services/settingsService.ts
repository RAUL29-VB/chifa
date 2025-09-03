import { databases, DATABASE_ID, SETTINGS_COLLECTION_ID, ID } from './appwrite';

export interface Settings {
  id?: string;
  cashInitialAmount: number;
}

class SettingsService {
  async getSettings(): Promise<Settings | null> {
    try {
      const response = await databases.listDocuments(DATABASE_ID, SETTINGS_COLLECTION_ID);
      if (response.documents.length > 0) {
        const doc = response.documents[0];
        return {
          id: doc.$id,
          cashInitialAmount: doc.cashInitialAmount
        };
      }
      return null;
    } catch (error) {
      console.error('Error obteniendo configuración:', error);
      return null;
    }
  }

  async updateCashInitialAmount(amount: number): Promise<boolean> {
    try {
      const settings = await this.getSettings();
      
      if (settings?.id) {
        await databases.updateDocument(DATABASE_ID, SETTINGS_COLLECTION_ID, settings.id, {
          cashInitialAmount: amount
        });
      } else {
        await databases.createDocument(DATABASE_ID, SETTINGS_COLLECTION_ID, ID.unique(), {
          cashInitialAmount: amount
        });
      }
      return true;
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      return false;
    }
  }
}

export const settingsService = new SettingsService();