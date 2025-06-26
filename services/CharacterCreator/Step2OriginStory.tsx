
import React from 'react';
import Button from '../../components/ui/Button'; // Corrected path
import LoadingSpinner from '../../components/ui/LoadingSpinner'; // Corrected path
import ScrollableArea from '../../components/ui/ScrollableArea'; // Corrected path

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
      <ScrollableArea className="w-full bg-slate-700/50 p-4 rounded-md story-text-font max-h-60" maxHeight="240px">
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
        <Button onClick={onAccept} disabled={isLoading || !originStory} fullWidth smFullWidth={false}>
          Accept Origin
        </Button>
        <Button onClick={onRegenerate} variant="secondary" disabled={isLoading} fullWidth smFullWidth={false}>
          {isLoading ? 'Regenerating...' : 'Regenerate Origin'}
        </Button>
      </div>
    </div>
  );
};

export default Step2OriginStory;
