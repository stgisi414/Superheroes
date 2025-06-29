
import React, { useState } from 'react';
import { Character, CharacterStats, StatName } from '../../types';
import { DEFAULT_STATS, INITIAL_STAT_POINTS } from '../../constants';
import Step1CoreConcept from './Step1CoreConcept';
import Step2OriginStory from './Step2OriginStory';
import Step3Portrait from './Step3Portrait';
import Step4StatAllocation from './Step4StatAllocation';

interface CharacterCreatorProps {
  onCharacterCreated: (character: Character) => void;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onCharacterCreated }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [characterName, setCharacterName] = useState<string>('');
  const [characterConcept, setCharacterConcept] = useState<string>('');
  const [originStory, setOriginStory] = useState<string>('');
  const [portraitUrl, setPortraitUrl] = useState<string>('');
  const [stats, setStats] = useState<CharacterStats>(DEFAULT_STATS);

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = (finalStats: CharacterStats) => {
    const character: Character = {
      name: characterName,
      concept: characterConcept,
      originStory: originStory,
      portraitUrl: portraitUrl,
      stats: finalStats,
      health: 100,
    };
    onCharacterCreated(character);
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return characterName.trim() !== '' && characterConcept.trim() !== '';
      case 2:
        return originStory.trim() !== '';
      case 3:
        return true; // Portrait is optional
      case 4:
        return true; // Stats have default values
      default:
        return false;
    }
  };

  const getStepIcon = (step: number) => {
    const icons = ['🎭', '📖', '🎨', '⚡'];
    return icons[step - 1];
  };

  const getStepTitle = (step: number) => {
    const titles = ['HERO IDENTITY', 'ORIGIN TALE', 'PORTRAIT', 'POWER LEVELS'];
    return titles[step - 1];
  };

  return (
    <div className="min-h-screen p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 halftone-bg">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-bangers text-6xl pow-text mb-4">
            CREATE YOUR HERO!
          </h1>
          <div className="bg-yellow-300 border-4 border-black inline-block p-3 transform -rotate-1">
            <span className="font-comic text-black font-bold text-xl">
              STEP {currentStep} OF {totalSteps}
            </span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-4">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`comic-panel p-4 flex flex-col items-center space-y-2 transition-all ${
                  step === currentStep 
                    ? 'transform scale-110 bg-yellow-200' 
                    : step < currentStep 
                      ? 'bg-green-200' 
                      : 'bg-gray-200'
                }`}
              >
                <span className="text-3xl">{getStepIcon(step)}</span>
                <span className="font-bangers text-sm text-black">
                  {getStepTitle(step)}
                </span>
                {step < currentStep && (
                  <div className="bg-green-500 border-2 border-black rounded-full w-6 h-6 flex items-center justify-center">
                    <span className="text-white font-bold">✓</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="comic-panel-dark p-8 mb-8 animate-comic-pop">
          {currentStep === 1 && (
            <Step1CoreConcept
              name={characterName}
              setName={setCharacterName}
              concept={characterConcept}
              setConcept={setCharacterConcept}
              onNext={handleNext}
            />
          )}
          
          {currentStep === 2 && (
            <Step2OriginStory
              originStory={originStory}
              setOriginStory={setOriginStory}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 3 && (
            <Step3Portrait
              portraitUrl={portraitUrl}
              setPortraitUrl={setPortraitUrl}
              characterName={characterName}
              characterConcept={characterConcept}
              onNext={handleNext}
              onBack={handleBack}
            />
          )}
          
          {currentStep === 4 && (
            <Step4StatAllocation
              stats={stats}
              setStats={setStats}
              onConfirm={handleComplete}
              onBack={handleBack}
            />
          )}
        </div>

        {/* Navigation for non-final steps */}
        {currentStep < totalSteps && (
          <div className="flex justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="comic-button-secondary px-6 py-3 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← BACK
            </button>
            
            <button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="comic-button px-6 py-3 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              NEXT →
            </button>
          </div>
        )}
      </div>

      {/* Decorative comic elements */}
      <div className="fixed bottom-10 left-10 pointer-events-none">
        <div className="bg-blue-500 border-4 border-black p-3 transform rotate-12 animate-pulse">
          <span className="font-bangers text-white text-xl">BOOM!</span>
        </div>
      </div>
      
      <div className="fixed bottom-20 right-10 pointer-events-none">
        <div className="bg-red-500 border-4 border-black p-3 transform -rotate-12 animate-bounce">
          <span className="font-bangers text-white text-xl">POW!</span>
        </div>
      </div>
    </div>
  );
};

export default CharacterCreator;
