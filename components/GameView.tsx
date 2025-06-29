import React, { useState, useCallback } from 'react';
import { Character, StoryLogEntry, MusicMood, VoiceProfile, GameUpdateChunk, NarrationStoryLogEntry } from '../types';
import CharacterSheet from '../CharacterSheet';
import StoryPanel from './StoryPanel';
import CommandInput from './CommandInput';
import AudioOrchestrator from './AudioOrchestrator';
import { geminiService } from '../services/geminiService';
import LoadingSpinner from './ui/LoadingSpinner';

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
  const [currentMusicMood, setCurrentMusicMood] = useState<MusicMood>(MusicMood.Exploration);
  const [ttsQueue, setTtsQueue] = useState<Array<{ text: string; voice: VoiceProfile; id: string }>>([]);

  const handleSendCommand = useCallback(async (command: string) => {
    if (!character) return;
    setIsLoading(true);
    
    const commandEntry: StoryLogEntry = { type: 'system_message', content: `> ${command}`, id: Date.now().toString() + '_cmd' };
    setStoryLog(prevLog => [...prevLog, commandEntry]);
    
    const streamId = Date.now().toString() + "_stream";

    try {
      await geminiService.streamGameResponse(
        command,
        character,
        (chunk: GameUpdateChunk) => {
          // Process narrative parts
          if (chunk.narrativePart) {
             setStoryLog(prevLog => {
              const lastEntry = prevLog[prevLog.length -1];
              if (lastEntry && lastEntry.type === 'text' && chunk.streamId && lastEntry.streamId === chunk.streamId) {
                // Append to existing text entry from the same stream
                return [...prevLog.slice(0, -1), {...lastEntry, content: lastEntry.content + chunk.narrativePart}];
              }
              // Create new text entry
              return [...prevLog, { type: 'text', content: chunk.narrativePart as string, id: Date.now().toString() + Math.random(), streamId: chunk.streamId }];
            });
          }

          // Process images
          if (chunk.imageUrl) {
            setStoryLog(prevLog => [
              ...prevLog,
              { type: 'image', url: chunk.imageUrl!, alt: chunk.imageAlt || 'Scene illustration', id: Date.now().toString() + '_img' }
            ]);
          }

          // Process music changes
          if (chunk.playMusicMood) {
            setCurrentMusicMood(chunk.playMusicMood);
             setStoryLog(prevLog => [
              ...prevLog,
              { type: 'music_change', mood: chunk.playMusicMood!, description: `The mood shifts to ${chunk.playMusicMood}.`, id: Date.now().toString() + '_music' }
            ]);
          }

          // Process TTS
          if (chunk.playTTS) {
            const ttsId = Date.now().toString() + '_tts';
            setTtsQueue(prevQueue => [...prevQueue, { ...chunk.playTTS!, id: ttsId }]);
             setStoryLog(prevLog => [
              ...prevLog,
              { type: 'narration', text: chunk.playTTS!.text, voiceProfile: chunk.playTTS!.voice, id: ttsId } as NarrationStoryLogEntry
            ]);
          }
          
          // Process character updates
          if (chunk.updatedCharacter) {
            setCharacter(chunk.updatedCharacter);
          }
          
          if(chunk.error) {
            setStoryLog(prevLog => [...prevLog, {type: 'error', content: chunk.error!, id: Date.now().toString() + '_err'}]);
          }

          if (!chunk.isProcessing) {
            setIsLoading(false);
          }
        },
        streamId
      );
    } catch (error) {
      console.error("Error processing command:", error);
      const errorMsg = error instanceof Error ? error.message : "An unknown error occurred.";
      setStoryLog(prevLog => [...prevLog, { type: 'error', content: `Failed to process command: ${errorMsg}`, id: Date.now().toString() + '_fatalerr' }]);
      setIsLoading(false);
    }
  }, [character, setIsLoading, setStoryLog, setCharacter]);

  const handleTtsPlayed = useCallback((id: string) => {
    setTtsQueue(prevQueue => prevQueue.filter(tts => tts.id !== id));
  }, []);

  if (!character) {
    return <div className="flex items-center justify-center h-screen"><LoadingSpinner text="Loading character..." /></div>;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen max-h-screen overflow-hidden bg-slate-900">
      <aside className="w-full md:w-1/3 lg:w-1/4 max-h-screen md:overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-800 border-r border-slate-700">
        <CharacterSheet character={character} />
      </aside>
      <main className="flex-grow flex flex-col h-full max-h-screen overflow-hidden">
        <div className="flex-grow overflow-y-auto"> {/* This makes StoryPanel scrollable within its container */}
          <StoryPanel storyLog={storyLog} />
        </div>
        <CommandInput onSendCommand={handleSendCommand} isLoading={isLoading} />
      </main>
      <AudioOrchestrator currentMusicMood={currentMusicMood} ttsQueue={ttsQueue} onTtsPlayed={handleTtsPlayed} />
    </div>
  );
};

export default GameView;