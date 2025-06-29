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
    if (!character) return;

    setIsLoading(true);
    const userEntry: StoryLogEntry = { type: 'user', content: command, id: Date.now().toString() };
    setStoryLog(prev => [...prev, userEntry]);

    // Detect action commands and switch to action music
    const actionKeywords = ['attack', 'fight', 'battle', 'combat', 'strike', 'punch', 'kick', 'shoot', 'cast', 'defend'];
    const isActionCommand = actionKeywords.some(keyword => command.toLowerCase().includes(keyword));

    if (isActionCommand) {
      bgmService.playForSection(GameSection.ActionGameplay);
    }

    try {
      const stream = await geminiService.submitPlayerAction(character, command, storyLog);

      let hasActionContent = false;

      for await (const chunk of stream) {
        if (chunk.textUpdate) {
          // Check if the response contains action content
          const actionIndicators = ['battle', 'fight', 'combat', 'attack', 'enemy', 'damage', 'health'];
          if (actionIndicators.some(indicator => chunk.textUpdate!.fullText.toLowerCase().includes(indicator))) {
            hasActionContent = true;
          }

          setStoryLog(prev => {
            const newLog = [...prev];
            const lastEntry = newLog[newLog.length - 1];

            if (lastEntry && lastEntry.type === 'text' && lastEntry.id === chunk.textUpdate!.entryId) {
              lastEntry.content = chunk.textUpdate!.fullText;
            } else {
              newLog.push({
                type: 'text',
                content: chunk.textUpdate!.fullText,
                id: chunk.textUpdate!.entryId
              });
            }

            return newLog;
          });
        }

        if (chunk.characterUpdate) {
          setCharacter(prev => prev ? { ...prev, ...chunk.characterUpdate } : null);
        }
      }

      // Return to normal gameplay music if no action content was generated
      if (!hasActionContent && !isActionCommand) {
        setTimeout(() => {
          bgmService.playForSection(GameSection.NormalGameplay);
        }, 2000); // Wait 2 seconds before transitioning back
      }

      const gameState: GameState = {
        character: character,
      };
      saveGame(gameState);

    } catch (error) {
      console.error('Error submitting action:', error);
      const errorEntry: StoryLogEntry = { 
        type: 'text', 
        content: 'Something went wrong. Please try again.', 
        id: (Date.now() + 1).toString() 
      };
      setStoryLog(prev => [...prev, errorEntry]);
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