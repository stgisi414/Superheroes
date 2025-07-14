
import { auth, db } from './firebaseConfig';
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  limit 
} from 'firebase/firestore';
import { Character } from '../types';
import { logger, LogCategory } from './logger';

export interface CharacterState {
  id: string;
  characterId: string;
  userId: string;
  storyState: string; // JSON string max 50,000 chars
  lastUpdated: Date;
}

class FirebaseService {
  private provider = new GoogleAuthProvider();

  constructor() {
    this.provider.addScope('profile');
    this.provider.addScope('email');
  }

  // Authentication methods
  async signInWithGoogle(): Promise<User | null> {
    try {
      logger.info(LogCategory.API, 'Starting Google sign-in');
      const result = await signInWithPopup(auth, this.provider);
      logger.info(LogCategory.API, 'User signed in successfully', { uid: result.user.uid });
      return result.user;
    } catch (error) {
      logger.error(LogCategory.API, 'Error signing in with Google', error);
      throw error;
    }
  }

  async signOut(): Promise<void> {
    try {
      await firebaseSignOut(auth);
      logger.info(LogCategory.API, 'User signed out successfully');
    } catch (error) {
      logger.error(LogCategory.API, 'Error signing out', error);
      throw error;
    }
  }

  onAuthStateChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  getCurrentUser(): User | null {
    return auth.currentUser;
  }

  // Character management methods
  async getUserCharacters(userId: string): Promise<Character[]> {
    try {
      logger.info(LogCategory.STORAGE, 'Fetching user characters', { userId });
      const charactersRef = collection(db, 'characters');
      const q = query(charactersRef, where('userId', '==', userId), limit(3));
      const querySnapshot = await getDocs(q);
      
      const characters: Character[] = [];
      querySnapshot.forEach((doc) => {
        characters.push({ id: doc.id, ...doc.data() } as Character);
      });
      
      logger.info(LogCategory.STORAGE, 'Characters fetched successfully', { count: characters.length });
      return characters;
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Error fetching user characters', error);
      throw error;
    }
  }

  async saveCharacter(character: Character, userId: string): Promise<string> {
    try {
      logger.info(LogCategory.STORAGE, 'Saving character to database', { characterName: character.name });
      
      // Check if user already has 3 characters
      const existingCharacters = await this.getUserCharacters(userId);
      if (existingCharacters.length >= 3) {
        throw new Error('Maximum of 3 characters per account allowed');
      }

      const characterData = { ...character, userId };
      const docRef = await addDoc(collection(db, 'characters'), characterData);
      
      logger.info(LogCategory.STORAGE, 'Character saved successfully', { characterId: docRef.id });
      return docRef.id;
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Error saving character', error);
      throw error;
    }
  }

  async updateCharacter(characterId: string, updates: Partial<Character>): Promise<void> {
    try {
      const characterRef = doc(db, 'characters', characterId);
      await updateDoc(characterRef, updates);
      logger.info(LogCategory.STORAGE, 'Character updated successfully', { characterId });
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Error updating character', error);
      throw error;
    }
  }

  async deleteCharacter(characterId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'characters', characterId));
      logger.info(LogCategory.STORAGE, 'Character deleted successfully', { characterId });
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Error deleting character', error);
      throw error;
    }
  }

  // Character state management
  async saveCharacterState(characterId: string, userId: string, storyState: string): Promise<void> {
    try {
      // Ensure story state doesn't exceed 50,000 characters
      const truncatedState = storyState.length > 50000 ? storyState.substring(0, 50000) : storyState;
      
      const stateData = {
        characterId,
        userId,
        storyState: truncatedState,
        lastUpdated: new Date()
      };

      const statesRef = collection(db, 'characterStates');
      const q = query(statesRef, where('characterId', '==', characterId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Create new state
        await addDoc(statesRef, stateData);
        logger.info(LogCategory.STORAGE, 'Character state created', { characterId });
      } else {
        // Update existing state
        const docRef = querySnapshot.docs[0].ref;
        await updateDoc(docRef, stateData);
        logger.info(LogCategory.STORAGE, 'Character state updated', { characterId });
      }
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Error saving character state', error);
      throw error;
    }
  }

  async getCharacterState(characterId: string): Promise<CharacterState | null> {
    try {
      const statesRef = collection(db, 'characterStates');
      const q = query(statesRef, where('characterId', '==', characterId));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as CharacterState;
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Error fetching character state', error);
      throw error;
    }
  }
}

export const firebaseService = new FirebaseService();
