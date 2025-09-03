import { supabaseService } from './supabaseService';

export interface Settings {
  id?: string;
  cash_initial_amount: number;
  restaurant_name?: string;
  restaurant_address?: string;
  restaurant_phone?: string;
}

class SettingsService {
  async getSettings(): Promise<Settings | null> {
    try {
      const settings = await supabaseService.getSettings();
      if (settings) {
        return {
          id: settings.id,
          cash_initial_amount: settings.cash_initial_amount,
          restaurant_name: settings.restaurant_name,
          restaurant_address: settings.restaurant_address,
          restaurant_phone: settings.restaurant_phone
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
      await supabaseService.updateSettings({
        cash_initial_amount: amount
      });
      return true;
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      return false;
    }
  }

  async updateRestaurantInfo(info: {
    restaurant_name?: string;
    restaurant_address?: string;
    restaurant_phone?: string;
  }): Promise<boolean> {
    try {
      await supabaseService.updateSettings(info);
      return true;
    } catch (error) {
      console.error('Error actualizando información del restaurante:', error);
      return false;
    }
  }
}

export const settingsService = new SettingsService();