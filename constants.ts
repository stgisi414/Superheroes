
import { StatName, CharacterStats } from './types';

export const INITIAL_STAT_POINTS = 15;
export const MIN_STAT_VALUE = 1;
export const MAX_STAT_VALUE = 10;

export const DEFAULT_STATS: CharacterStats = {
  [StatName.Strength]: MIN_STAT_VALUE,
  [StatName.Intellect]: MIN_STAT_VALUE,
  [StatName.Power]: MIN_STAT_VALUE,
};

export const GEMINI_TEXT_MODEL = "gemini-2.5-flash-preview-04-17";
export const GEMINI_IMAGE_MODEL = "imagen-3.0-generate-002"; // Placeholder, as fal.ai is specified

// Placeholder for fal.ai, not directly used by @google/genai
export const FAL_AI_IMAGE_MODEL = "fal-ai/imagen-4-placeholder"; // Example

export const PLACEHOLDER_IMAGE_DIMENSIONS = {
  scene: { width: 768, height: 512 },
  portrait: { width: 512, height: 512 },
};
    