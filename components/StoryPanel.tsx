
import React, { useEffect, useRef } from 'react';
import { StoryLogEntry } from '../types';
import LoadingSpinner from './ui/LoadingSpinner';

interface StoryPanelProps {
  storyLog: StoryLogEntry[];
  isLoading: boolean;
}

const StoryPanel: React.FC<StoryPanelProps> = ({ storyLog, isLoading }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [storyLog]);

  const renderEntry = (entry: StoryLogEntry) => {
    switch (entry.type) {
      case 'text':
        return (
          <div key={entry.id} className="thought-bubble animate-comic-pop">
            <p className="font-comic text-black text-lg leading-relaxed">
              {entry.content}
            </p>
          </div>
        );
      
      case 'user':
        return (
          <div key={entry.id} className="speech-bubble ml-auto max-w-xs animate-comic-pop">
            <div className="flex items-center mb-2">
              <div className="bg-blue-500 border-2 border-black rounded-full w-8 h-8 flex items-center justify-center mr-2">
                <span className="font-bangers text-white text-sm">YOU</span>
              </div>
              <span className="font-bangers text-blue-600 text-lg">HERO SAYS:</span>
            </div>
            <p className="font-comic text-black font-bold text-lg">
              "{entry.content}"
            </p>
          </div>
        );
      
      case 'image':
        return (
          <div key={entry.id} className="comic-panel p-4 animate-comic-pop">
            <div className="text-center mb-2">
              <span className="font-bangers text-xl bg-yellow-300 border-2 border-black px-3 py-1">
                SCENE
              </span>
            </div>
            <img 
              src={entry.content} 
              alt="Story scene" 
              className="w-full h-64 object-cover border-4 border-black"
            />
          </div>
        );
      
      case 'error':
        return (
          <div key={entry.id} className="bg-red-500 border-4 border-black p-4 transform -rotate-1 animate-comic-pop">
            <div className="text-center">
              <span className="font-bangers text-white text-2xl">ERROR!</span>
              <p className="font-comic text-white font-bold mt-2">
                {entry.content}
              </p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 bg-gradient-to-b from-sky-100 to-indigo-100 border-4 border-black">
      <div className="space-y-4">
        {storyLog.length === 0 && (
          <div className="text-center">
            <div className="thought-bubble">
              <p className="font-comic text-black text-lg italic">
                Your adventure is about to begin...
              </p>
            </div>
          </div>
        )}
        
        {storyLog.map(renderEntry)}
        
        {isLoading && (
          <div className="flex justify-center">
            <div className="comic-panel p-6">
              <LoadingSpinner />
              <p className="font-bangers text-center mt-2 text-xl">
                LOADING NEXT SCENE...
              </p>
            </div>
          </div>
        )}
        
        <div ref={endRef} />
      </div>
    </div>
  );
};

export default StoryPanel;
