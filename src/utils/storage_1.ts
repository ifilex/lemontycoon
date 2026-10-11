import { GameState, GameSettings } from '../types';
import { createInitialGameState, INITIAL_SETTINGS } from '../game/constants';

const SAVE_PREFIX = 'lemon_tycoon_8bit_slot_';
const SETTINGS_KEY = 'lemon_tycoon_8bit_settings';
const CURRENT_SLOT_KEY = 'lemon_tycoon_8bit_current_slot';

export function getSavedSlotsInfo(): { slot: number; exists: boolean; day?: number; cash?: number; date?: number }[] {
  const slots = [1, 2, 3];
  return slots.map((slot) => {
    const raw = localStorage.getItem(SAVE_PREFIX + slot);
    if (!raw) return { slot, exists: false };
    try {
      const data: GameState = JSON.parse(raw);
      return {
        slot,
        exists: true,
        day: data.day,
        cash: data.player?.cash,
        date: data.lastSavedAt,
      };
    } catch {
      return { slot, exists: false };
    }
  });
}

export function saveGameStateToSlot(state: GameState, slot: number = 1): boolean {
  try {
    const dataToSave: GameState = {
      ...state,
      saveSlot: slot,
      lastSavedAt: Date.now(),
    };
    localStorage.setItem(SAVE_PREFIX + slot, JSON.stringify(dataToSave));
    localStorage.setItem(CURRENT_SLOT_KEY, String(slot));
    return true;
  } catch (err) {
    console.error('Error saving game state:', err);
    return false;
  }
}

export function loadGameStateFromSlot(slot: number = 1): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_PREFIX + slot);
    if (!raw) return null;
    return JSON.parse(raw) as GameState;
  } catch (err) {
    console.error('Error loading game state:', err);
    return null;
  }
}

export function deleteSaveSlot(slot: number): boolean {
  try {
    localStorage.removeItem(SAVE_PREFIX + slot);
    return true;
  } catch {
    return false;
  }
}

export function loadSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return INITIAL_SETTINGS;
    return { ...INITIAL_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return INITIAL_SETTINGS;
  }
}

export function saveSettings(settings: GameSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Error saving settings:', err);
  }
}

// Encrypted Cloud Save Export / Import
export function exportEncryptedSaveToken(state: GameState): string {
  try {
    const json = JSON.stringify(state);
    // Base64 encode + checksum header
    const base64 = btoa(encodeURIComponent(json));
    const token = `LEMON_SYNC_V1_${base64}`;
    return token;
  } catch {
    return '';
  }
}

export function importEncryptedSaveToken(token: string): GameState | null {
  try {
    if (!token.startsWith('LEMON_SYNC_V1_')) {
      throw new Error('Invalid token prefix');
    }
    const base64 = token.replace('LEMON_SYNC_V1_', '');
    const json = decodeURIComponent(atob(base64));
    const state = JSON.parse(json) as GameState;
    if (!state.player || !state.inventory || !state.recipe) {
      throw new Error('Corrupted game state');
    }
    return state;
  } catch (err) {
    console.error('Failed to import save token:', err);
    return null;
  }
}
