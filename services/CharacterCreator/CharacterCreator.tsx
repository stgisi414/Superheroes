import React, { useState, useCallback } from 'react';
import { Character, CharacterStats } from '../../types';
import { DEFAULT_STATS } from '../../constants';
import { geminiService } from '../geminiService';
import { logger } from '../logger';
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
  const [portraitPrompt, setPortraitPrompt] = useState<string>('');
  const [stats] = useState<CharacterStats>(DEFAULT_STATS);
  const [isGeneratingOrigin, setIsGeneratingOrigin] = useState<boolean>(false);
  const [isGeneratingPortrait, setIsGeneratingPortrait] = useState<boolean>(false);
  const [creativityLevel, setCreativityLevel] = useState<number>(0.7);

  const totalSteps = 4;

  const handleNext = useCallback(async (nameOverride?: string, conceptOverride?: string) => {
    const currentName = nameOverride || characterName;
    const currentConcept = conceptOverride || characterConcept;
    
    logger.info('CHARACTER_CREATION', `Advancing from step ${currentStep} to ${currentStep + 1}`);

    if (currentStep === 1) {
      logger.info('CHARACTER_CREATION', 'Moving to origin story step', {
        characterName: currentName,
        characterConcept: currentConcept,
        hasExistingOrigin: !!originStory
      });
      setCurrentStep(2);
      // Auto-generate origin story when moving to step 2
      if (currentName && currentConcept && !originStory) {
        logger.info('CHARACTER_CREATION', 'Starting automatic origin story generation', {
          characterName: currentName,
          characterConcept: currentConcept,
          currentOriginStory: originStory
        });
        setIsGeneratingOrigin(true);
        try {
          const generatedStory = await geminiService.generateOriginStory(currentName, currentConcept, creativityLevel);
          setOriginStory(generatedStory);
          logger.info('CHARACTER_CREATION', 'Origin story auto-generation completed successfully', {
            storyLength: generatedStory.length,
            storyPreview: generatedStory.substring(0, 100)
          });
        } catch (error) {
          logger.error('CHARACTER_CREATION', 'Error during automatic origin story generation', error);
          setOriginStory('Unable to generate origin story. Please try again.');
        } finally {
          setIsGeneratingOrigin(false);
        }
      } else {
        logger.warn('CHARACTER_CREATION', 'Skipping origin story generation', {
          hasName: !!currentName,
          hasConcept: !!currentConcept,
          hasExistingOrigin: !!originStory,
          characterName: currentName,
          characterConcept: currentConcept
        });
      }
    } else if (currentStep === 2) {
      logger.info('CHARACTER_CREATION', 'Moving to portrait step', {
        hasOriginStory: !!originStory,
        hasExistingPortrait: !!portraitUrl
      });
      setCurrentStep(3);
      // Auto-generate portrait when moving to step 3
      if (characterName && characterConcept && originStory && !portraitUrl) {
        logger.info('CHARACTER_CREATION', 'Starting automatic portrait generation');
        setIsGeneratingPortrait(true);
        try {
          const generatedPrompt = await geminiService.generatePortraitPrompt(characterName, characterConcept, originStory);
          setPortraitPrompt(generatedPrompt);
          
          const generatedPortraitUrl = await geminiService.generatePortrait(generatedPrompt);
          setPortraitUrl(generatedPortraitUrl);
          
          logger.info('CHARACTER_CREATION', 'Portrait auto-generation completed successfully', {
            promptLength: generatedPrompt.length,
            portraitUrl: generatedPortraitUrl
          });
        } catch (error) {
          logger.error('CHARACTER_CREATION', 'Error during automatic portrait generation', error);
          // Set a fallback placeholder if generation fails
          setPortraitUrl(`https://picsum.photos/300/400?random=${Date.now()}`);
          setPortraitPrompt('Portrait generation failed - using placeholder');
        } finally {
          setIsGeneratingPortrait(false);
        }
      } else if (portraitUrl) {
        logger.info('CHARACTER_CREATION', 'Using existing portrait');
      }
    } else if (currentStep < totalSteps) {
      logger.info('CHARACTER_CREATION', `Moving to step ${currentStep + 1}`);
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, characterName, characterConcept, originStory, portraitUrl]);

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = (finalStats: CharacterStats) => {
    const character: Character = {
      id: Date.now().toString(),
      name: characterName,
      concept: characterConcept,
      originStory: originStory,
      portraitUrl: portraitUrl,
      stats: finalStats,
      abilities: [],
      inventory: [],
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

  const handleAcceptOrigin = () => {
    handleNext();
  };

  const handleRegenerateOrigin = async () => {
    if (!characterName || !characterConcept) {
      logger.warn('CHARACTER_CREATION', 'Cannot regenerate origin: missing name or concept', {
        hasName: !!characterName,
        hasConcept: !!characterConcept
      });
      return;
    }

    logger.info('CHARACTER_CREATION', 'Starting origin story regeneration', {
      characterName,
      characterConcept,
      creativityLevel
    });

    setIsGeneratingOrigin(true);
    
    // Clear the current origin story to force a UI update
    setOriginStory('');
    
    try {
      const generatedStory = await geminiService.generateOriginStory(characterName, characterConcept, creativityLevel);
      logger.info('CHARACTER_CREATION', 'Origin story regeneration completed', {
        storyLength: generatedStory.length,
        storyPreview: generatedStory.substring(0, 100)
      });
      setOriginStory(generatedStory);
    } catch (error) {
      logger.error('CHARACTER_CREATION', 'Error during origin story regeneration', error);
      setOriginStory('Unable to generate origin story. Please try again.');
    } finally {
      setIsGeneratingOrigin(false);
    }
  };

  const handleRegeneratePortrait = async () => {
    if (!characterName || !characterConcept || !originStory) {
      logger.warn('CHARACTER_CREATION', 'Cannot regenerate portrait: missing required data');
      return;
    }

    logger.info('CHARACTER_CREATION', 'Starting portrait regeneration');
    setIsGeneratingPortrait(true);
    
    // Clear current portrait
    setPortraitUrl('');
    setPortraitPrompt('');
    
    try {
      const generatedPrompt = await geminiService.generatePortraitPrompt(characterName, characterConcept, originStory);
      setPortraitPrompt(generatedPrompt);
      
      const generatedPortraitUrl = await geminiService.generatePortrait(generatedPrompt);
      setPortraitUrl(generatedPortraitUrl);
      
      logger.info('CHARACTER_CREATION', 'Portrait regeneration completed successfully');
    } catch (error) {
      logger.error('CHARACTER_CREATION', 'Error during portrait regeneration', error);
      setPortraitUrl(`https://picsum.photos/300/400?random=${Date.now()}`);
      setPortraitPrompt('Portrait generation failed - using placeholder');
    } finally {
      setIsGeneratingPortrait(false);
    }
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
              onSubmit={(name, concept) => {
                logger.info('CHARACTER_CREATION', 'Received data from Step 1', {
                  receivedName: name,
                  receivedConcept: concept,
                  currentName: characterName,
                  currentConcept: characterConcept
                });
                setCharacterName(name);
                setCharacterConcept(concept);
                logger.info('CHARACTER_CREATION', 'Updated character state', {
                  newName: name,
                  newConcept: concept
                });
                handleNext(name, concept);
              }}
            />
          )}

          {currentStep === 2 && (
            <Step2OriginStory
              originStory={originStory}
              isLoading={isGeneratingOrigin}
              creativityLevel={creativityLevel}
              onAccept={handleAcceptOrigin}
              onRegenerate={handleRegenerateOrigin}
              onCreativityChange={setCreativityLevel}
            />
          )}

          {currentStep === 3 && (
            <Step3Portrait
              portraitUrl={portraitUrl}
              portraitPrompt={portraitPrompt}
              isLoading={isGeneratingPortrait}
              onAccept={handleNext}
              onRegenerate={handleRegeneratePortrait}
            />
          )}

          {currentStep === 4 && (
            <Step4StatAllocation
              currentStats={stats}
              onConfirm={handleComplete}
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