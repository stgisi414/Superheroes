// Simulates interactions with the Gemini API and other backend services.
// In a real application, this would make actual API calls.
import { Character, GameUpdateChunk, MusicMood, VoiceProfile, StatName } from '../types';
import { PLACEHOLDER_IMAGE_DIMENSIONS } from '../constants';
import { logger, LogCategory, logError, logPerformance } from './logger';

// Import the actual Google Generative AI SDK
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';

// IMPORTANT: This service SIMULATES Gemini calls. It does not use the actual @google/genai SDK for these simulations.
// The API key is assumed to be available via process.env.GEMINI_API_KEY as per requirements.

// --- Simulation Helpers ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const simulatePicsumImage = (width: number, height: number): string => {
  return `https://picsum.photos/${width}/${height}?random=${Math.random()}`;
};

// --- Simulated Gemini Service ---
class GeminiService {
  private apiKey: string;
  private useRealAPI: boolean;
  private genAI: GoogleGenerativeAI | null = null;

  constructor() {
    logger.info(LogCategory.GEMINI, 'Initializing Gemini service');

    // This adheres to the requirement: "The API key must be obtained exclusively from the environment variable process.env.GEMINI_API_KEY"
    // And "Assume this variable is pre-configured, valid, and accessible"
    this.apiKey = process.env.GEMINI_API_KEY || "SIMULATED_GEMINI_API_KEY_DEV_ONLY";
    this.useRealAPI = this.apiKey !== "SIMULATED_GEMINI_API_KEY_DEV_ONLY" && this.apiKey !== "YOUR_GEMINI_API_KEY_PLACEHOLDER";

    if (!this.useRealAPI) {
        const warningMsg = "GEMINI_API_KEY not found in process.env. Using a placeholder. Real Gemini features will not work.";
        console.warn(warningMsg);
        logger.warn(LogCategory.GEMINI, warningMsg, { 
          foundApiKey: !!process.env.GEMINI_API_KEY,
          apiKeyLength: this.apiKey?.length,
          processEnvKeys: Object.keys(process.env).filter(key => key.includes('GEMINI'))
        });
    } else {
        logger.info(LogCategory.GEMINI, 'Real Gemini API key found and configured');
    }

    // Initialize the real Gemini API client
    if (this.useRealAPI) {
      this.genAI = new GoogleGenerativeAI(this.apiKey);
    }
  }

  private getSafetySettings() {
    return [
      {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
      },
    ];
  }

  async generateOriginStory(name: string, concept: string, creativityLevel: number = 0.7): Promise<string> {
    const endTimer = logPerformance(LogCategory.GEMINI, 'Generate origin story');
    logger.info(LogCategory.GEMINI, 'Starting origin story generation', { name, concept });

    const prompt = `Generate a brief, compelling origin story (2-3 paragraphs) for a character named "${name}". 
    Their core concept is: "${concept}". 
    The story should be engaging and set a clear tone (heroic, tragic, mysterious, etc.) based on the concept.
    It should hint at their powers or defining moment without being overly explicit unless the concept demands it.
    Make it feel like the beginning of an epic saga.`;

    logger.debug(LogCategory.GEMINI, 'Generated prompt for origin story', { prompt });

    try {
      // Use real API if available, otherwise simulate
      if (this.useRealAPI && this.genAI) {
        logger.info(LogCategory.GEMINI, 'Using real API for origin story generation', { name, concept });
        try {
          const model = this.genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            safetySettings: this.getSafetySettings(),
            generationConfig: {
              temperature: creativityLevel,
              topP: 0.8,
              topK: 40,
              maxOutputTokens: 1000,
            }
          });
          const result = await model.generateContent(prompt);
          const response = await result.response;
          const text = response.text();
          logger.info(LogCategory.GEMINI, 'Origin story generated successfully', { 
            storyLength: text.length,
            storyPreview: text.substring(0, 100)
          });
          return text;
        } catch (error) {
          logError(LogCategory.GEMINI, "Error generating origin story with real API", error);
          // Fallback to simulation if API fails
          return this.simulateOriginStory(name, concept, prompt);
        }
      } else {
        logger.info(LogCategory.GEMINI, 'Using simulation for origin story generation', { name, concept });
        return this.simulateOriginStory(name, concept, prompt);
      }
    } catch (error) {
      logError(LogCategory.GEMINI, 'Failed to generate origin story', error);
      throw error;
    } finally {
      endTimer();
    }
  }

  private async simulateOriginStory(name: string, concept: string, prompt: string): Promise<string> {
    const endTimer = logPerformance(LogCategory.GEMINI, 'Simulate origin story');
    logger.debug(LogCategory.GEMINI, 'Starting origin story simulation', { name, concept });

    const delayTime = 1500 + Math.random() * 1000;
    logger.debug(LogCategory.GEMINI, `Simulating API delay: ${delayTime.toFixed(0)}ms`);
    await delay(delayTime);

    // Simulated Gemini response
    const generatedStory = `In the neon-drenched alleys of Neo-Veridia, ${name} was once just another face in the crowd. ${concept.toLowerCase().includes('tech') ? 'A brilliant but overlooked engineer,' : 'An ordinary individual with an extraordinary destiny,'} their life took a sharp turn when ${concept.toLowerCase().includes('shadowmancer') ? 'they stumbled upon an ancient tome of forbidden shadow magic in a forgotten library.' : concept.toLowerCase().includes('electricity') ? 'a freak accident involving an experimental energy core bathed them in raw, untamed electrical power.' : 'a mysterious event granted them abilities beyond human comprehension.'}

    This transformation was not without its cost. ${concept.toLowerCase().includes('villain') ? `Twisted by the power or a perceived betrayal, ${name} vowed to reshape the world in their own image, believing the old ways were corrupt and weak.` : `Haunted by the incident but determined to use their newfound gifts for good, ${name} embraced their new identity, a beacon of hope against the encroaching darkness.`} 

    Now, ${name} walks a path shrouded in ${concept.toLowerCase().includes('mysterious') ? 'mystery and whispers' : 'danger and uncertainty'}, their actions echoing through the city, a legend in the making. Their true journey has only just begun.`;

    logger.info(LogCategory.GEMINI, 'Origin story simulation completed', { 
      name, 
      concept, 
      storyLength: generatedStory.length,
      prompt 
    });

    endTimer();
    return generatedStory;
  }

  async generatePortraitPrompt(name: string, concept: string, originStory: string): Promise<string> {
    const endTimer = logPerformance(LogCategory.GEMINI, 'Generate portrait prompt');
    logger.info(LogCategory.GEMINI, 'Generating portrait prompt', { name, concept });

    const geminiPrompt = `Based on this character's name "${name}", concept "${concept}", and origin story excerpt: "${originStory.substring(0, 200)}...", generate a detailed art prompt for creating their portrait. The prompt should describe their appearance, style, mood, and any visual elements that represent their powers or personality. Keep it under 200 words and focus on visual details that would help an artist create their portrait.`;

    try {
      if (this.useRealAPI && this.genAI) {
        logger.info(LogCategory.GEMINI, 'Using real API for portrait prompt generation');
        const model = this.genAI.getGenerativeModel({ 
          model: "gemini-1.5-flash",
          safetySettings: this.getSafetySettings(),
          generationConfig: {
            temperature: 0.8,
            topP: 0.9,
            maxOutputTokens: 300,
          }
        });
        const result = await model.generateContent(geminiPrompt);
        const response = await result.response;
        const prompt = response.text();
        
        logger.info(LogCategory.GEMINI, 'Portrait prompt generated via API', { prompt });
        endTimer();
        return prompt;
      } else {
        // Fallback to manual prompt generation
        const delayTime = 500 + Math.random() * 500;
        await delay(delayTime);

        const styleKeywords = concept.toLowerCase().includes('tech') ? "cyberpunk, intricate circuits, glowing neon accents" :
                             concept.toLowerCase().includes('shadow') ? "dark fantasy, mysterious, ethereal shadows, hooded figure" :
                             concept.toLowerCase().includes('hero') ? "dynamic comic book art style, heroic pose, vibrant colors" :
                             concept.toLowerCase().includes('villain') ? "ominous, powerful stance, dramatic lighting, intense expression" :
                             "detailed character art, cinematic lighting";

        const prompt = `Detailed character portrait of ${name}. Concept: "${concept}". Key elements from origin: "${originStory.substring(0, 100)}...". Style: ${styleKeywords}, photorealistic details, high fantasy illustration. Focus on the face and upper body, conveying their personality.`;

        logger.info(LogCategory.GEMINI, 'Portrait prompt generated (fallback)', { prompt });
        endTimer();
        return prompt;
      }
    } catch (error) {
      logError(LogCategory.GEMINI, 'Error generating portrait prompt', error);
      endTimer();
      throw error;
    }
  }

  async generatePortrait(imagePrompt: string): Promise<string> {
    const endTimer = logPerformance(LogCategory.GEMINI, 'Generate portrait image');
    logger.info(LogCategory.GEMINI, 'Starting portrait image generation', { prompt: imagePrompt });

    const delayTime = 2000 + Math.random() * 1500;
    logger.debug(LogCategory.GEMINI, `Simulating image generation delay: ${delayTime.toFixed(0)}ms`);
    await delay(delayTime);

    // This would be a call to fal.ai or similar. We simulate with Picsum.
    const imageUrl = simulatePicsumImage(PLACEHOLDER_IMAGE_DIMENSIONS.portrait.width, PLACEHOLDER_IMAGE_DIMENSIONS.portrait.height);

    logger.info(LogCategory.GEMINI, 'Portrait image generated', { 
      imageUrl, 
      dimensions: PLACEHOLDER_IMAGE_DIMENSIONS.portrait 
    });

    endTimer();
    return imageUrl;
  }

  async generateIllustration(imagePrompt: string, style: string): Promise<string> {
    console.log(`[GeminiService] Simulating generateIllustration with prompt: "${imagePrompt}", style: "${style}"`);
    await delay(2000 + Math.random() * 1500);
    return simulatePicsumImage(PLACEHOLDER_IMAGE_DIMENSIONS.scene.width, PLACEHOLDER_IMAGE_DIMENSIONS.scene.height);
  }

  // This is the main function for game interactions, simulating Gemini's response stream
  async streamGameResponse(
    userCommand: string,
    character: Character,
    onChunk: (chunk: GameUpdateChunk) => void,
    streamId: string = Date.now().toString()
  ): Promise<void> {
    console.log(`[GeminiService] Simulating streamGameResponse for command: "${userCommand}" by ${character.name}`);

    // Simulate Gemini processing and calling tools internally
    // This is a very simplified mock logic. A real Gemini would use complex reasoning.

    onChunk({ narrativePart: "Thinking...", isProcessing: true, streamId });
    await delay(500 + Math.random() * 500);

    let narrativeResponse = `You said: "${userCommand}".\n`;
    let imageUrl: string | undefined = undefined;
    let imageAlt: string | undefined = undefined;
    let musicMood: MusicMood | undefined = undefined;
    let tts: { text: string; voice: VoiceProfile } | undefined = undefined;
    let updatedChar: Character | undefined = undefined;

    // Simulate different responses based on command keywords
    if (userCommand.toLowerCase().includes("look") || userCommand.toLowerCase().includes("scan") || userCommand.toLowerCase().includes("examine")) {
      narrativeResponse += `You scan your surroundings. The air is thick with anticipation. You notice a flickering light in the distance and the faint smell of ozone. `;
      const imagePrompt = `A ${character.concept} looking around a detailed environment, with a flickering light and atmospheric effects. Style: cinematic, detailed.`;
      imageUrl = await this.generateIllustration(imagePrompt, "cinematic");
      imageAlt = imagePrompt;
      musicMood = MusicMood.Exploration;
    } else if (userCommand.toLowerCase().includes("attack") || userCommand.toLowerCase().includes("fight")) {
      narrativeResponse += `You prepare for battle! Adrenaline courses through your veins. Your ${character.stats[StatName.Power] > 5 ? 'powerful aura flares' : 'determination shines'}. `;
      const imagePrompt = `${character.name} (${character.concept}) in a dynamic combat pose, energy crackling. Style: comic book action.`;
      imageUrl = await this.generateIllustration(imagePrompt, "action");
      imageAlt = imagePrompt;
      musicMood = MusicMood.Battle;
      // Simulate stat change or resource use
      // updatedChar = { ...character, stats: { ...character.stats, [StatName.Power]: character.stats[StatName.Power] -1 }}; 
    } else if (userCommand.toLowerCase().includes("talk") || userCommand.toLowerCase().includes("speak") || userCommand.toLowerCase().includes("ask")) {
      narrativeResponse += `You try to communicate. An enigmatic figure steps out from the shadows. `;
      tts = { text: "Who dares disturb my solitude?", voice: VoiceProfile.GruffMale };
      narrativeResponse += `\nThey utter, "${tts.text}" with a ${tts.voice} voice.`;
      musicMood = MusicMood.Tension;
    } else if (userCommand.toLowerCase().includes("hello") || userCommand.toLowerCase().includes("intro")) {
      narrativeResponse = `The world of Atheria unfolds before you, ${character.name}. Ancient ruins whisper forgotten secrets, sprawling megacities pulse with technological marvels, and cosmic energies shift the very fabric of reality. Your journey as a ${character.concept} begins now. What path will you choose?`;
      musicMood = MusicMood.Heroic;
    }
    else {
      narrativeResponse += `The world reacts to your action. Events unfold... `;
      if (Math.random() > 0.7) {
        const imagePrompt = `A surprising event unfolds for ${character.name} based on their action: ${userCommand}. Style: dramatic, mysterious.`;
        imageUrl = await this.generateIllustration(imagePrompt, "dramatic");
        imageAlt = imagePrompt;
      }
    }

    // Stream narrative in parts
    const words = narrativeResponse.split(' ');
    for (let i = 0; i < words.length; i++) {
      onChunk({ narrativePart: words[i] + ' ', isProcessing: true, streamId });
      await delay(50 + Math.random() * 30); // Simulate typing speed
    }

    // Send image if generated
    if (imageUrl) {
      onChunk({ imageUrl, imageAlt, isProcessing: true, streamId });
      await delay(100);
    }

    // Send music change
    if (musicMood) {
      onChunk({ playMusicMood: musicMood, isProcessing: true, streamId });
      await delay(100);
    }

    // Send TTS
    if (tts) {
      onChunk({ playTTS: tts, isProcessing: true, streamId });
      await delay(100);
    }

    // Send character update
    if (updatedChar) {
       onChunk({ updatedCharacter: updatedChar, isProcessing: true, streamId });
       await delay(100);
    }

    onChunk({ narrativePart: "\nWhat is your next move?", isProcessing: false, streamId }); // Final chunk for this turn
  }
}

export const geminiService = new GeminiService();