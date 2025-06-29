
import React from 'react';
import Button from '../../components/ui/Button'; // Corrected path
import LoadingSpinner from '../../components/ui/LoadingSpinner'; // Corrected path
import ScrollableArea from '../../components/ui/ScrollableArea'; // Corrected path
import { logger } from '../../services/logger';

interface Step2OriginStoryProps {
  originStory: string;
  isLoading: boolean;
  onAccept: () => void;
  onRegenerate: () => void;
}

const Step2OriginStory: React.FC<Step2OriginStoryProps> = ({
  originStory,
  isLoading,
  onAccept,
  onRegenerate,
}) => {
  return (
    <div className="text-center space-y-6 flex flex-col items-center justify-center min-h-[300px]">
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
