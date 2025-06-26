
import React, { useEffect, useRef } from 'react';
import { StoryLogEntry, TextStoryLogEntry, ImageStoryLogEntry, NarrationStoryLogEntry, MusicChangeStoryLogEntry } from '../types';
import ImageViewer from './ImageViewer';
import ScrollableArea from './ui/ScrollableArea';

interface StoryPanelProps {
  storyLog: StoryLogEntry[];
}

const StoryPanel: React.FC<StoryPanelProps> = ({ storyLog }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [storyLog]);

  const renderStoryEntry = (entry: StoryLogEntry) => {
    switch (entry.type) {
      case 'text':
      case 'system_message':
        return (
          <p className={`whitespace-pre-wrap story-text-font ${entry.type === 'system_message' ? 'text-cyan-400 italic' : 'text-slate-200'} my-2`}>
            { (entry as TextStoryLogEntry).content }
          </p>
        );
      case 'image':
        const imgEntry = entry as ImageStoryLogEntry;
        return (
          <ImageViewer 
            src={imgEntry.url} 
            alt={imgEntry.alt} 
            className="my-4 rounded-lg shadow-xl"
            caption={imgEntry.alt}
          />
        );
      case 'narration':
        const narrEntry = entry as NarrationStoryLogEntry;
        // In a real app, this might trigger audio playback via AudioOrchestrator
        return (
          <p className="my-2 p-3 bg-slate-700 rounded-md border-l-4 border-cyan-500 text-slate-300 italic">
            <span className="font-semibold text-cyan-400">{narrEntry.voiceProfile}: </span> "{narrEntry.text}"
          </p>
        );
      case 'music_change':
        const musicEntry = entry as MusicChangeStoryLogEntry;
        return (
          <p className="my-2 text-sm text-purple-400 italic text-center py-1">
            ♪ {musicEntry.description} (Mood: {musicEntry.mood}) ♪
          </p>
        );
      case 'error':
        return <p className="my-2 text-red-400 italic">Error: {(entry as TextStoryLogEntry).content}</p>;
      default:
        return null;
    }
  };

  return (
    <ScrollableArea className="p-4 md:p-6 bg-slate-800 rounded-lg shadow-inner h-full" maxHeight="calc(100vh - 200px)"> {/* Adjust maxHeight as needed */}
      <div ref={scrollRef}>
        {storyLog.map((entry) => (
          <div key={entry.id} className="mb-3 animate-fadeIn"> {/* Basic fade-in animation */}
            {renderStoryEntry(entry)}
          </div>
        ))}
      </div>
    </ScrollableArea>
  );
};

export default StoryPanel;
