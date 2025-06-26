
import React, { useState, useCallback } from 'react';
import { Character, CharacterStats, StatName, CharacterCreationStep } from '../../types';
import { DEFAULT_STATS, INITIAL_STAT_POINTS, GEMINI_TEXT_MODEL, PLACEHOLDER_IMAGE_DIMENSIONS } from '../../constants';
import { geminiService } from '../geminiService';
import Step1CoreConcept from './Step1CoreConcept';
import Step2OriginStory from './Step2OriginStory';
import Step3Portrait from './Step3Portrait';
import Step4StatAllocation from './Step4StatAllocation';
import LoadingSpinner from '../../components/ui/LoadingSpinner'; // Corrected path
import Button from '../../components/ui/Button'; // Corrected path

interface CharacterCreatorProps {
  onCharacterCreated: (character: Character) => void;
}

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ onCharacterCreated }) => {
  const [currentStep, setCurrentStep] = useState<CharacterCreationStep>(CharacterCreationStep.CoreConcept);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState<string>('');
  const [concept, setConcept] = useState<string>('');
  const [originStory, setOriginStory] = useState<string>('');
  const [portraitUrl, setPortraitUrl] = useState<string>('');
  const [portraitPrompt, setPortraitPrompt] = useState<string>('');
  const [stats, setStats] = useState<CharacterStats>(DEFAULT_STATS);

  const handleNextStep = () => {
    setError(null);
    setCurrentStep(prev => prev + 1);
  };
  
  const handlePreviousStep = () => {
    setError(null);
    setCurrentStep(prev => prev - 1);
  };

  const handleCoreConceptSubmit = (charName: string, charConcept: string) => {
    setName(charName);
    setConcept(charConcept);
    handleNextStep();
    generateOriginStory(charName, charConcept);
  };

  const generateOriginStory = useCallback(async (charName: string, charConcept: string, regenerate: boolean = false) => {
    setIsLoading(true);
    setError(null);
    if (regenerate) setOriginStory(''); // Clear previous story if regenerating

    try {
      const story = await geminiService.generateOriginStory(charName, charConcept);
      setOriginStory(story);
    } catch (err) {
      console.error("Error generating origin story:", err);
      setError("Failed to generate origin story. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  const handleOriginStoryAccept = () => {
    handleNextStep();
    generatePortrait(name, concept, originStory);
  };

  const generatePortrait = useCallback(async (charName: string, charConcept: string, charOrigin: string, regenerate: boolean = false) => {
    setIsLoading(true);
    setError(null);
    if (regenerate) setPortraitUrl(''); // Clear previous portrait if regenerating
    
    try {
      const prompt = await geminiService.generatePortraitPrompt(charName, charConcept, charOrigin);
      setPortraitPrompt(prompt);
      const url = await geminiService.generatePortrait(prompt);
      setPortraitUrl(url);
    } catch (err) {
      console.error("Error generating portrait:", err);
      setError("Failed to generate portrait. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handlePortraitAccept = () => {
    handleNextStep();
  };
  
  const handleStatAllocationSubmit = (finalStats: CharacterStats) => {
    setStats(finalStats);
    const finalCharacter: Character = {
      id: Date.now().toString(),
      name,
      concept,
      originStory,
      portraitUrl,
      stats: finalStats,
      abilities: [], // Initialize empty, Gemini can populate later
      inventory: [], // Initialize empty
    };
    onCharacterCreated(finalCharacter);
  };

  const renderStep = () => {
    switch (currentStep) {
      case CharacterCreationStep.CoreConcept:
        return <Step1CoreConcept onSubmit={handleCoreConceptSubmit} initialName={name} initialConcept={concept} />;
      case CharacterCreationStep.OriginStory:
        return (
          <Step2OriginStory
            originStory={originStory}
            isLoading={isLoading}
            onAccept={handleOriginStoryAccept}
            onRegenerate={() => generateOriginStory(name, concept, true)}
          />
        );
      case CharacterCreationStep.Portrait:
        return (
          <Step3Portrait
            portraitUrl={portraitUrl}
            portraitPrompt={portraitPrompt}
            isLoading={isLoading}
            onAccept={handlePortraitAccept}
            onRegenerate={() => generatePortrait(name, concept, originStory, true)}
          />
        );
      case CharacterCreationStep.StatAllocation:
        return <Step4StatAllocation currentStats={stats} onConfirm={handleStatAllocationSubmit} />;
      default:
        return <p>Unknown step.</p>;
    }
  };

  const stepTitles: Record<CharacterCreationStep, string> = {
    [CharacterCreationStep.CoreConcept]: "Step 1: Define Your Character",
    [CharacterCreationStep.OriginStory]: "Step 2: Discover Your Origin",
    [CharacterCreationStep.Portrait]: "Step 3: Visualize Your Persona",
    [CharacterCreationStep.StatAllocation]: "Step 4: Assign Your Strengths",
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center justify-center p-4 selection:bg-cyan-500 selection:text-white">
      <div className="bg-slate-800 p-6 md:p-10 rounded-xl shadow-2xl w-full max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-2 text-cyan-400 font-orbitron">Create Your Legend</h1>
        <p className="text-center text-slate-400 mb-8">{stepTitles[currentStep]}</p>
        
        {error && <p className="text-red-400 bg-red-900 p-3 rounded-md text-center mb-4">{error}</p>}
        {isLoading && currentStep !== CharacterCreationStep.OriginStory && currentStep !== CharacterCreationStep.Portrait && (
          <div className="my-8"> {/* Ensure loading spinner is visible when not part of step content */}
            <LoadingSpinner text="Processing..." />
          </div>
        )}
        
        <div className="min-h-[300px]"> {/* Ensure consistent height for step content */}
          {renderStep()}
        </div>

        <div className="mt-8 flex justify-between items-center">
          <Button 
            onClick={handlePreviousStep} 
            disabled={currentStep === CharacterCreationStep.CoreConcept || isLoading}
            variant="secondary"
          >
            Back
          </Button>
          {/* "Next" button is typically handled within each step component for validation */}
        </div>
      </div>
      <footer className="mt-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Gemini RPG Orchestrator. All rights reserved (simulated).</p>
      </footer>
    </div>
  );
};

export default CharacterCreator;
