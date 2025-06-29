
import React from 'react';
import Button from '../../components/ui/Button'; // Corrected path
import LoadingSpinner from '../../components/ui/LoadingSpinner'; // Corrected path
import ScrollableArea from '../../components/ui/ScrollableArea'; // Corrected path
import { logger } from '../../services/logger';

interface Step2OriginStoryProps {
  originStory: string;
  isLoading: boolean;
  creativityLevel: number;
  onAccept: () => void;
  onRegenerate: () => void;
  onCreativityChange: (level: number) => void;
}

const Step2OriginStory: React.FC<Step2OriginStoryProps> = ({
  originStory,
  isLoading,
  creativityLevel,
  onAccept,
  onRegenerate,
  onCreativityChange,
}) => {
  const getCreativityLabel = (level: number) => {
    if (level <= 0.3) return 'Conservative';
    if (level <= 0.5) return 'Balanced';
    if (level <= 0.7) return 'Creative';
    if (level <= 0.9) return 'Imaginative';
    return 'Wildly Creative';
  };

  return (
    <div className="text-center space-y-6 flex flex-col items-center justify-center min-h-[300px]">
      {/* Creativity Level Control */}
      <div className="w-full max-w-md space-y-2">
        <label className="block text-sm font-medium text-slate-300">
          Creativity Level: {getCreativityLabel(creativityLevel)}
        </label>
        <input
          type="range"
          min="0.3"
          max="1.0"
          step="0.1"
          value={creativityLevel}
          onChange={(e) => onCreativityChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer slider"
          disabled={isLoading}
        />
        <div className="flex justify-between text-xs text-slate-400">
          <span>Conservative</span>
          <span>Wildly Creative</span>
        </div>
      </div>

      <ScrollableArea className="w-full bg-slate-800 p-4 rounded-md story-text-font max-h-60" maxHeight="240px">
        {isLoading && !originStory ? (
          <div className="flex justify-center items-center h-full">
            <LoadingSpinner text="Forging your epic origin..." />
          </div>
        ) : originStory ? (
          <p className="whitespace-pre-wrap text-slate-200">{originStory}</p>
        ) : (
          <p className="text-slate-400">Your origin story will appear here.</p>
        )}
      </ScrollableArea>
      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
        <Button 
          onClick={() => {
            logger.info('CHARACTER_CREATION', 'User accepted origin story', {
              storyLength: originStory.length,
              storyPreview: originStory.substring(0, 100)
            });
            onAccept();
          }} 
          disabled={isLoading || !originStory} 
          fullWidth
        >
          Accept Origin
        </Button>
        <Button 
          onClick={() => {
            logger.info('CHARACTER_CREATION', 'User requested origin story regeneration from Step 2');
            onRegenerate();
          }} 
          variant="secondary" 
          disabled={isLoading} 
          fullWidth
        >
          {isLoading ? 'Regenerating...' : 'Regenerate Origin'}
        </Button>
      </div>
    </div>
  );
};

export default Step2OriginStory;
