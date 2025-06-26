
import React, { useState, useCallback } from 'react';
import { Character, GameState, StoryLogEntry } from './types';
import CharacterCreator from './services/CharacterCreator/CharacterCreator'; // Corrected path
import GameView from './components/GameView';
import { geminiService } from './services/geminiService'; // Ensure this path is correct

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.CharacterCreation);
  const [character, setCharacter] = useState<Character | null>(null);
  const [storyLog, setStoryLog] = useState<StoryLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const handleCharacterCreated = useCallback(async (newCharacter: Character) => {
    setCharacter(newCharacter);
    setGameState(GameState.Playing);
    setIsLoading(true);
    // Add initial story entry after character creation
    setStoryLog([{ type: 'text', content: `Welcome, ${newCharacter.name}. Your adventure begins...`, id: Date.now().toString() }]);
    
    // Simulate Gemini's initial narration after character creation
    try {
      await geminiService.streamGameResponse(
        "Generate a brief, intriguing introductory scenario for the newly created character. Describe their immediate surroundings and hint at a looming challenge or mystery. The character's concept is: " + newCharacter.concept,
        newCharacter,
        (chunk) => {
          if (chunk.narrativePart) {
            setStoryLog(prevLog => {
              // If the last entry was text and also from this stream, append. Otherwise, new entry.
              const lastEntry = prevLog[prevLog.length -1];
              if (lastEntry && lastEntry.type === 'text' && chunk.streamId && lastEntry.streamId === chunk.streamId) {
                return [...prevLog.slice(0, -1), {...lastEntry, content: lastEntry.content + chunk.narrativePart}];
              }
              return [...prevLog, { type: 'text', content: chunk.narrativePart, id: Date.now().toString() + Math.random(), streamId: chunk.streamId }];
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

  if (gameState === GameState.CharacterCreation || !character) {
    return <CharacterCreator onCharacterCreated={handleCharacterCreated} />;
  }

  return (
    <GameView
      character={character}
      setCharacter={setCharacter}
      storyLog={storyLog}
      setStoryLog={setStoryLog}
      isLoading={isLoading}
      setIsLoading={setIsLoading}
    />
  );
};

export default App;