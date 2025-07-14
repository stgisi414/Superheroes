
import React, { useState, useCallback, useEffect } from 'react';
import { Character, GameState as AppState, StoryLogEntry, GameSection } from './types';
import CharacterCreator from './services/CharacterCreator/CharacterCreator';
import GameView from './components/GameView';
import LoginPage from './components/LoginPage';
import CharacterSelection from './components/CharacterSelection';
import { geminiService } from './services/geminiService';
import { firebaseService } from './services/firebaseService';
import { loadGame, saveGame, GameState } from './services/localStorageService';
import { logger, LogCategory } from './services/logger';
import { bgmService } from './services/bgmService';
import { audioService } from './services/audioService';
import BGMControl from './components/BGMControl';
import { User } from 'firebase/auth';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Landing);
  const [user, setUser] = useState<User | null>(null);
  const [character, setCharacter] = useState<Character | null>(null);
  const [storyLog, setStoryLog] = useState<StoryLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [authLoading, setAuthLoading] = useState<boolean>(true);

  // Initialize app and auth state
  useEffect(() => {
    const initializeApp = async () => {
      // Initialize audio service
      try {
        await audioService.initialize();
      } catch (error) {
        console.warn('Audio service initialization failed:', error);
      }

      // Set up auth state listener
      const unsubscribe = firebaseService.onAuthStateChange((user) => {
        setUser(user);
        setAuthLoading(false);
        
        if (user) {
          logger.info(LogCategory.AUTH, 'User authenticated', { uid: user.uid });
          setAppState(AppState.CharacterCreation); // Will show character selection
        } else {
          logger.info(LogCategory.AUTH, 'User not authenticated');
          setAppState(AppState.Landing);
          setCharacter(null);
          setStoryLog([]);
        }
      });

      return unsubscribe;
    };

    const cleanup = initializeApp();

    return () => {
      audioService.shutdown();
      cleanup.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, []);

  // Handle BGM changes based on app state
  useEffect(() => {
    const playBGMForState = async () => {
      switch (appState) {
        case AppState.Landing:
          await bgmService.playForSection(GameSection.MainMenu);
          break;
        case AppState.CharacterCreation:
          await bgmService.playForSection(GameSection.CharacterCreation);
          break;
        case AppState.Playing:
          await bgmService.playForSection(GameSection.NormalGameplay);
          break;
      }
    };

    playBGMForState();
  }, [appState]);

  // Handle user interaction to enable audio
  useEffect(() => {
    const handleUserInteraction = () => {
      bgmService.retryAudioAfterInteraction();
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, []);

  const handleLogin = () => {
    // Auth state change will handle the transition
  };

  const handleSignOut = async () => {
    try {
      await firebaseService.signOut();
      setCharacter(null);
      setStoryLog([]);
      setAppState(AppState.Landing);
    } catch (error) {
      logger.error(LogCategory.AUTH, 'Sign out failed', error);
    }
  };

  const handleCharacterSelected = async (selectedCharacter: Character) => {
    setCharacter(selectedCharacter);
    setAppState(AppState.Playing);
    setIsLoading(true);

    try {
      // Load character state from Firebase
      const characterState = await firebaseService.getCharacterState(selectedCharacter.id);
      
      if (characterState) {
        // Parse stored story state
        const storyState = JSON.parse(characterState.storyState);
        setStoryLog(storyState.storyLog || []);
        logger.info(LogCategory.STORAGE, 'Character state loaded from Firebase');
      } else {
        // Initialize new adventure
        const initialEntry: StoryLogEntry = { 
          type: 'text', 
          content: `Welcome back, ${selectedCharacter.name}. Your adventure continues...`, 
          id: Date.now().toString() 
        };
        setStoryLog([initialEntry]);
      }
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to load character state', error);
      const errorEntry: StoryLogEntry = { 
        type: 'error', 
        content: 'Failed to load character state. Starting fresh adventure.', 
        id: Date.now().toString() 
      };
      setStoryLog([errorEntry]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewCharacter = () => {
    setAppState(AppState.CharacterCreation);
  };

  const handleCharacterCreated = useCallback(async (newCharacter: Character) => {
    if (!user) return;

    try {
      // Save character to Firebase
      const characterId = await firebaseService.saveCharacter(newCharacter, user.uid);
      const characterWithId = { ...newCharacter, id: characterId };
      
      setCharacter(characterWithId);
      setAppState(AppState.Playing);
      setIsLoading(true);

      const initialEntry: StoryLogEntry = { 
        type: 'text', 
        content: `Welcome, ${newCharacter.name}. Your adventure begins...`, 
        id: Date.now().toString() 
      };
      setStoryLog([initialEntry]);

      // Save initial state to Firebase
      const initialState = {
        storyLog: [initialEntry],
        character: characterWithId,
        summary: `${newCharacter.name} begins their journey as a ${newCharacter.concept}.`
      };
      
      await firebaseService.saveCharacterState(
        characterId, 
        user.uid, 
        JSON.stringify(initialState)
      );

      // Generate initial scenario
      try {
        await geminiService.streamGameResponse(
          "Generate a brief, intriguing introductory scenario for the newly created character. Describe their immediate surroundings and hint at a looming challenge or mystery. The character's concept is: " + newCharacter.concept,
          characterWithId,
          (chunk) => {
            if (chunk.narrativePart) {
              setStoryLog(prevLog => {
                const lastEntry = prevLog[prevLog.length - 1];
                if (lastEntry && lastEntry.type === 'text' && chunk.streamId && lastEntry.streamId === chunk.streamId) {
                  return [...prevLog.slice(0, -1), { ...lastEntry, content: lastEntry.content + chunk.narrativePart }];
                }
                return [...prevLog, { type: 'text', content: chunk.narrativePart as string, id: Date.now().toString() + Math.random(), streamId: chunk.streamId }];
              });
            }
            if (chunk.updatedCharacter) {
              setCharacter(chunk.updatedCharacter);
            }
          }
        );
      } catch (error) {
        console.error("Error fetching initial scenario:", error);
        setStoryLog(prev => [...prev, { type: 'error', content: 'Error generating initial scenario.', id: Date.now().toString() }]);
      } finally {
        setIsLoading(false);
      }
    } catch (error) {
      logger.error(LogCategory.STORAGE, 'Failed to save character', error);
      // Handle error appropriately
    }
  }, [user]);

  // Auto-save character state periodically
  useEffect(() => {
    if (character && user && storyLog.length > 0) {
      const saveState = async () => {
        try {
          const storyState = {
            storyLog: storyLog.slice(-20), // Keep last 20 entries
            character,
            summary: `Current adventure of ${character.name}, a ${character.concept}. Recent events: ${storyLog.slice(-3).map(entry => entry.type === 'text' ? entry.content : '').join(' ').substring(0, 500)}`
          };
          
          await firebaseService.saveCharacterState(
            character.id, 
            user.uid, 
            JSON.stringify(storyState)
          );
        } catch (error) {
          logger.error(LogCategory.STORAGE, 'Failed to auto-save character state', error);
        }
      };

      const interval = setInterval(saveState, 30000); // Save every 30 seconds
      return () => clearInterval(interval);
    }
  }, [character, user, storyLog]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 halftone-bg flex items-center justify-center">
        <div className="comic-panel-dark p-8">
          <h1 className="font-bangers text-4xl text-white">Loading...</h1>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative">
        <BGMControl />
        <LoginPage onLogin={handleLogin} />
      </div>
    );
  }

  if (appState === AppState.CharacterCreation && !character) {
    return (
      <div className="relative">
        <BGMControl />
        <CharacterSelection
          user={user}
          onCharacterSelected={handleCharacterSelected}
          onNewCharacter={handleNewCharacter}
          onSignOut={handleSignOut}
        />
      </div>
    );
  }

  if (appState === AppState.CharacterCreation) {
    return (
      <div className="relative">
        <BGMControl />
        <CharacterCreator onCharacterCreated={handleCharacterCreated} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 halftone-bg">
      <BGMControl />
      <GameView
        character={character!}
        setCharacter={setCharacter}
        storyLog={storyLog}
        setStoryLog={setStoryLog}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
      />
    </div>
  );
};

export default App;
