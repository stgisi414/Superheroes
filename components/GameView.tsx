import React from 'react';
import { Character, StoryLogEntry } from '../types';
import CharacterSheet from '../CharacterSheet';
import StoryPanel from './StoryPanel';
import CommandInput from './CommandInput';
import { geminiService } from '../services/geminiService';
import { saveGame } from '../services/localStorageService';

interface GameViewProps {
  character: Character;
  setCharacter: React.Dispatch<React.SetStateAction<Character | null>>;
  storyLog: StoryLogEntry[];
  setStoryLog: React.Dispatch<React.SetStateAction<StoryLogEntry[]>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const GameView: React.FC<GameViewProps> = ({
  character,
  setCharacter,
  storyLog,
  setStoryLog,
  isLoading,
  setIsLoading,
}) => {
  const handleCommandSubmit = async (command: string) => {
    setIsLoading(true);
    const userEntry: StoryLogEntry = { 
      type: 'system_message', 
      content: command, 
      id: Date.now().toString() 
    };
    setStoryLog(prev => [...prev, userEntry]);

    try {
      await geminiService.streamGameResponse(
        command,
        character,
        (chunk) => {
          if (chunk.narrativePart) {
            setStoryLog(prevLog => {
              const lastEntry = prevLog[prevLog.length - 1];
              if (lastEntry && lastEntry.type === 'text' && chunk.streamId && lastEntry.streamId === chunk.streamId) {
                return [...prevLog.slice(0, -1), { ...lastEntry, content: lastEntry.content + chunk.narrativePart }];
              }
              return [...prevLog, { 
                type: 'text', 
                content: chunk.narrativePart as string, 
                id: Date.now().toString() + Math.random(), 
                streamId: chunk.streamId 
              }];
            });
          }
          if (chunk.updatedCharacter) {
            setCharacter(chunk.updatedCharacter);
          }
        }
      );

      // Save game state
      saveGame({ character });
    } catch (error) {
      console.error("Error processing command:", error);
      setStoryLog(prev => [...prev, { 
        type: 'error', 
        content: 'Error processing your action.', 
        id: Date.now().toString() 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 halftone-bg">
      {/* Comic book title header */}
      <div className="text-center mb-6">
        <h1 className="font-bangers text-5xl pow-text">
          {character.name}'S ADVENTURE
        </h1>
        <div className="bg-yellow-300 border-4 border-black inline-block p-2 transform rotate-1 mt-2">
          <span className="font-comic text-black font-bold">CHAPTER {storyLog.length + 1}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {/* Character Sheet Panel */}
        <div className="lg:col-span-1">
          <div className="comic-panel-dark p-6 animate-comic-pop">
            <div className="text-center mb-4">
              <h2 className="font-bangers text-2xl text-yellow-400 bam-text">
                HERO STATUS
              </h2>
            </div>
            <CharacterSheet character={character} />
          </div>
        </div>

        {/* Story Panel */}
        <div className="lg:col-span-3">
          <div className="comic-panel-dark p-6 animate-comic-pop">
            <div className="text-center mb-4">
              <h2 className="font-bangers text-2xl text-green-400 bam-text">
                ADVENTURE LOG
              </h2>
            </div>
            <div className="h-96 lg:h-[500px] mb-4">
              <StoryPanel storyLog={storyLog} isLoading={isLoading} />
            </div>

            <div className="border-t-4 border-yellow-400 pt-4">
              <CommandInput onSubmit={handleCommandSubmit} disabled={isLoading} />
            </div>
          </div>
        </div>
      </div>

      {/* Comic book sound effects decorations */}
      <div className="fixed top-10 left-10 z-10 pointer-events-none">
        <div className="bg-red-500 border-4 border-black p-3 transform rotate-12 animate-pulse">
          <span className="font-bangers text-white text-2xl">WHOOSH!</span>
        </div>
      </div>

      <div className="fixed top-20 right-10 z-10 pointer-events-none">
        <div className="bg-yellow-400 border-4 border-black p-3 transform -rotate-12 animate-bounce">
          <span className="font-bangers text-black text-2xl">KAPOW!</span>
        </div>
      </div>
    </div>
  );
};

export default GameView;