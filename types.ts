export enum GameState {
  Landing = 'Landing',
  CharacterCreation = 'CharacterCreation',
  Playing = 'Playing',
  Loading = 'Loading', // Generic loading state if needed beyond specific actions
}

export enum StatName {
  Strength = 'Strength',
  Intellect = 'Intellect',
  Power = 'Power',
}

export interface CharacterStats {
  [StatName.Strength]: number;
  [StatName.Intellect]: number;
  [StatName.Power]: number;
}

export interface Character {
  id: string;
  name: string;
  concept: string;
  originStory: string;
  portraitUrl: string;
  stats: CharacterStats;
  abilities: string[];
  inventory: string[];
}

export type StoryEntryType = 'text' | 'image' | 'narration' | 'music_change' | 'error' | 'system_message';

export interface BaseStoryLogEntry {
  id: string;
  type: StoryEntryType;
  timestamp?: number;
  streamId?: string; // To group related stream chunks
}

export interface TextStoryLogEntry extends BaseStoryLogEntry {
  type: 'text' | 'error' | 'system_message';
  content: string;
}

export interface ImageStoryLogEntry extends BaseStoryLogEntry {
  type: 'image';
  url: string;
  alt: string;
}

export interface NarrationStoryLogEntry extends BaseStoryLogEntry {
  type: 'narration';
  text: string;
  voiceProfile: VoiceProfile;
  audioUrl?: string; // URL to the TTS audio file
}

export interface MusicChangeStoryLogEntry extends BaseStoryLogEntry {
  type: 'music_change';
  mood: MusicMood;
  description: string;
}

export type StoryLogEntry = TextStoryLogEntry | ImageStoryLogEntry | NarrationStoryLogEntry | MusicChangeStoryLogEntry;

export enum MusicMood {
  Tension = 'tension',
  Battle = 'battle',
  Exploration = 'exploration',
  Somber = 'somber',
  Heroic = 'heroic',
  Mysterious = 'mysterious',
  Intense = 'intense',
  Ambient = 'ambient',
}

export enum GameSection {
  MainMenu = 'main_menu',
  CharacterCreation = 'character_creation',
  NormalGameplay = 'normal_gameplay',
  ActionGameplay = 'action_gameplay'
}

export enum VoiceProfile {
  GruffMale = 'gruff male',
  CalmFemale = 'calm female',
  Robotic = 'robotic',
  Narrator = 'narrator', // A general narrator voice
}

// For Gemini service responses, especially streaming
export interface GameUpdateChunk {
  narrativePart?: string;
  imageUrl?: string;
  imageAlt?: string;
  playMusicMood?: MusicMood;
  playTTS?: { text: string; voice: VoiceProfile };
  updatedCharacter?: Character; // Full character object if updated
  isProcessing: boolean; // True if Gemini is still "thinking" or more chunks are expected for this turn
  streamId?: string; // Identifier for the current stream of responses
  error?: string; // If an error occurred during this chunk processing
}

export interface SimulatedToolCall {
  toolName: string;
  args: any;
}

export interface SimulatedGeminiResponse {
  narrative: string;
  toolCalls?: SimulatedToolCall[];
  generatedImageUrl?: string;
  generatedImageAlt?: string;
  characterUpdate?: Partial<CharacterStats>; // Only send diffs or relevant parts
}

// Character Creator specific types
export enum CharacterCreationStep {
    CoreConcept = 1,
    OriginStory = 2,
    Portrait = 3,
    StatAllocation = 4,
}

export enum CreativityLevel {
    Conservative = 0.3,
    Balanced = 0.5,
    Creative = 0.7,
    Imaginative = 0.9,
    Wildly_Creative = 1.0,
}