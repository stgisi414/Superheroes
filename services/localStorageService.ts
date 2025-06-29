// services/localStorageService.ts

import { Character } from '../types';

export interface GameState {
  character: Character;
  // Add other game state properties here
}

export const saveGame = (state: GameState): void => {
  try {
    const serializedState = JSON.stringify(state);
    localStorage.setItem('gameState', serializedState);
  } catch (error) {
    console.error('Error saving game state:', error);
  }
};

export const loadGame = (): GameState | null => {
  try {
    const serializedState = localStorage.getItem('gameState');
    if (serializedState === null) {
      return null;
    }
    return JSON.parse(serializedState);
  } catch (error) {
    console.error('Error loading game state:', error);
    return null;
  }
};
