import React from 'react';
import Button from '../../components/ui/Button';
import ImageViewer from '../../components/ImageViewer';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

interface Step3PortraitProps {
  portraitUrl: string;
  portraitPrompt: string;
  isLoading: boolean;
  onAccept: () => void;
  onRegenerate: () => void;
}

const Step3Portrait: React.FC<Step3PortraitProps> = ({
  portraitUrl,
  portraitPrompt,
  isLoading,
  onAccept,
  onRegenerate,
}) => {
  return (
    <div className="text-center space-y-6">
      {isLoading && !portraitUrl && <LoadingSpinner text="Generating your portrait..." />}
      <div className="max-w-xs mx-auto aspect-square">
        <ImageViewer src={portraitUrl} alt="Character Portrait" isLoading={isLoading && !portraitUrl} />
      </div>
      {portraitPrompt && !isLoading && (
         <p className="text-xs text-slate-500 italic">Prompt: "{portraitPrompt}"</p>
      )}
      {!isLoading && !portraitUrl && (
         <p className="text-slate-400">
          Portrait will appear here. If generation fails, you can try regenerating.
        </p>
      )}

      <div className="flex flex-col sm:flex-row justify-center gap-4 mt-4">
        <Button onClick={onAccept} disabled={isLoading || !portraitUrl} fullWidth>
          Accept Portrait
        </Button>
        <Button onClick={onRegenerate} variant="secondary" disabled={isLoading} fullWidth>
          {isLoading ? 'Regenerating...' : 'Regenerate Portrait'}
        </Button>
      </div>
    </div>
  );
};

export default Step3Portrait;