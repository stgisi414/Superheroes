import React, { useState, useCallback, useEffect } from 'react';
import { Character, GameState as AppState, StoryLogEntry, GameSection } from './types';
import CharacterCreator from './services/CharacterCreator/CharacterCreator';
import GameView from './components/GameView';
import LandingPage from './components/LandingPage';
import { geminiService } from './services/geminiService';
import { loadGame, saveGame, GameState } from './services/localStorageService';
import { logger } from './services/logger';
import { bgmService } from './services/bgmService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.Landing);
  const [character, setCharacter] = useState<Character | null>(null);
  const [storyLog, setStoryLog] = useState<StoryLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasSavedGame, setHasSavedGame] = useState<boolean>(false);

  useEffect(() => {
    const savedGame = loadGame();
    if (savedGame) {
      setHasSavedGame(true);
    }
    
    // Start main menu music
    bgmService.playForSection(GameSection.MainMenu);
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

  const handleStartNewGame = () => {
    logger.info('APP_STATE', 'Transitioning to Character Creation');
    setAppState(AppState.CharacterCreation);
  };

  const handleLoadGame = () => {
    const savedGame = loadGame();
    if (savedGame) {
      setCharacter(savedGame.character);
      // Assuming you also save and load the story log
      // setStoryLog(savedGame.storyLog); 
      setAppState(AppState.Playing);
    }
  };

  const handleCharacterCreated = useCallback(async (newCharacter: Character) => {
    setCharacter(newCharacter);
    setAppState(AppState.Playing);
    setIsLoading(true);
    const initialEntry: StoryLogEntry = { type: 'text', content: `Welcome, ${newCharacter.name}. Your adventure begins...`, id: Date.now().toString() };
    setStoryLog([initialEntry]);

    const gameState: GameState = {
      character: newCharacter,
      // storyLog: [initialEntry]
    };
    saveGame(gameState);
    setHasSavedGame(true);

    try {
      await geminiService.streamGameResponse(
        "Generate a brief, intriguing introductory scenario for the newly created character. Describe their immediate surroundings and hint at a looming challenge or mystery. The character's concept is: " + newCharacter.concept,
        newCharacter,
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
  }, []);

  if (appState === AppState.Landing) {
    return <LandingPage onStartNewGame={handleStartNewGame} onLoadGame={handleLoadGame} hasSavedGame={hasSavedGame} />;
  }

  if (appState === AppState.CharacterCreation || !character) {
    return <CharacterCreator onCharacterCreated={handleCharacterCreated} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 halftone-bg">
      <GameView
        character={character}
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