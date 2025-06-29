
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MusicMood } from '../types';
import { logger, LogCategory, logError, logPerformance } from './logger';

interface MusicSession {
  play(): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  setWeightedPrompts(config: { weightedPrompts: Array<{ text: string; weight: number }> }): Promise<void>;
  setMusicGenerationConfig(config: { musicGenerationConfig: { bpm?: number; temperature?: number } }): Promise<void>;
}

interface LiveMusicServerMessage {
  serverContent?: {
    audioChunks?: Array<{ data: string }>;
  };
}

class LyriaService {
  private genAI: GoogleGenerativeAI | null = null;
  private session: MusicSession | null = null;
  private audioContext: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private isConnected: boolean = false;
  private isPlaying: boolean = false;
  private currentMood: MusicMood | null = null;

  constructor() {
    logger.info(LogCategory.AUDIO, 'Initializing Lyria service');
  }

  async initialize(): Promise<void> {
    const endTimer = logPerformance(LogCategory.AUDIO, 'Initialize Lyria service');
    
    try {
      // Initialize GenAI client with v1alpha for Lyria access
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment variables');
      }

      // Try to initialize with v1alpha API version for Lyria
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        logger.info(LogCategory.AUDIO, 'GoogleGenerativeAI client initialized');
      } catch (sdkError) {
        logError(LogCategory.AUDIO, 'Failed to initialize GoogleGenerativeAI client', sdkError);
        throw new Error('Unable to initialize Gemini AI client - Lyria not available');
      }

      // Initialize Web Audio API
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.outputNode = this.audioContext.createGain();
      this.outputNode.connect(this.audioContext.destination);
      this.outputNode.gain.value = 0.7; // Default volume

      logger.info(LogCategory.AUDIO, 'Lyria service initialized successfully');
    } catch (error) {
      logError(LogCategory.AUDIO, 'Failed to initialize Lyria service', error);
      throw error;
    } finally {
      endTimer();
    }
  }

  async connect(): Promise<void> {
    if (!this.genAI || !this.audioContext) {
      throw new Error('Lyria service not initialized');
    }

    const endTimer = logPerformance(LogCategory.AUDIO, 'Connect to Lyria');

    try {
      // Check if Lyria API is available
      const genAIAny = this.genAI as any;
      if (!genAIAny.live || !genAIAny.live.music) {
        throw new Error('Lyria API not available - live.music interface not found in current SDK version');
      }

      // Connect to Lyria live music service using correct API structure
      this.session = await genAIAny.live.music.connect({
        model: 'models/lyria-realtime-exp',
        callbacks: {
          onMessage: this.handleServerMessage.bind(this),
          onError: (error: any) => {
            logError(LogCategory.AUDIO, 'Lyria connection error', error);
          },
          onClose: () => {
            logger.info(LogCategory.AUDIO, 'Lyria connection closed');
            this.isConnected = false;
          },
        },
      });

      this.isConnected = true;
      this.nextStartTime = this.audioContext.currentTime;
      
      logger.info(LogCategory.AUDIO, 'Successfully connected to Lyria');
    } catch (error) {
      logError(LogCategory.AUDIO, 'Failed to connect to Lyria', error);
      throw error;
    } finally {
      endTimer();
    }
  }

  private async handleServerMessage(message: LiveMusicServerMessage): Promise<void> {
    if (!this.audioContext || !this.outputNode) return;

    try {
      // Check if the message contains audio chunks
      if (message.serverContent?.audioChunks !== undefined) {
        const audioData = message.serverContent.audioChunks[0].data;
        
        // Decode the base64 audio data
        const audioBuffer = await this.decodeAudioData(
          atob(audioData), // Decode base64
          this.audioContext,
          48000, // Sample rate for Lyria
          2      // Stereo channels
        );

        // Schedule the audio buffer for seamless playback
        const source = this.audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(this.outputNode);
        
        // Ensure seamless playback by scheduling at the right time
        const startTime = Math.max(this.nextStartTime, this.audioContext.currentTime);
        source.start(startTime);
        
        // Update the start time for the next chunk
        this.nextStartTime = startTime + audioBuffer.duration;

        logger.debug(LogCategory.AUDIO, 'Audio chunk scheduled for playback', {
          duration: audioBuffer.duration,
          startTime: startTime,
          nextStartTime: this.nextStartTime
        });
      }
    } catch (error) {
      logError(LogCategory.AUDIO, 'Error handling audio message from Lyria', error);
    }
  }

  private async decodeAudioData(
    audioData: string,
    audioContext: AudioContext,
    sampleRate: number,
    numChannels: number
  ): Promise<AudioBuffer> {
    // Convert binary string to 16-bit integer array
    const bytes = new Uint8Array(audioData.length);
    for (let i = 0; i < audioData.length; i++) {
      bytes[i] = audioData.charCodeAt(i);
    }
    
    const pcm16Samples = new Int16Array(bytes.buffer);
    const numFrames = pcm16Samples.length / numChannels;

    // Create an empty AudioBuffer
    const audioBuffer = audioContext.createBuffer(numChannels, numFrames, sampleRate);

    // De-interleave and normalize the data for each channel
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < numFrames; i++) {
        // Get the sample for this frame and channel
        const sample = pcm16Samples[i * numChannels + channel];
        // Normalize to a float between -1.0 and 1.0
        channelData[i] = sample / 32768.0;
      }
    }

    return audioBuffer;
  }

  async play(): Promise<void> {
    if (!this.session) {
      throw new Error('Not connected to Lyria');
    }

    try {
      await this.session.play();
      this.isPlaying = true;
      logger.info(LogCategory.AUDIO, 'Lyria playback started');
    } catch (error) {
      logError(LogCategory.AUDIO, 'Failed to start Lyria playback', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    if (!this.session) {
      throw new Error('Not connected to Lyria');
    }

    try {
      await this.session.pause();
      this.isPlaying = false;
      logger.info(LogCategory.AUDIO, 'Lyria playback paused');
    } catch (error) {
      logError(LogCategory.AUDIO, 'Failed to pause Lyria playback', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.session) {
      throw new Error('Not connected to Lyria');
    }

    try {
      await this.session.stop();
      this.isPlaying = false;
      this.currentMood = null;
      logger.info(LogCategory.AUDIO, 'Lyria playback stopped');
    } catch (error) {
      logError(LogCategory.AUDIO, 'Failed to stop Lyria playback', error);
      throw error;
    }
  }

  async setMood(mood: MusicMood): Promise<void> {
    if (!this.session) {
      logger.warn(LogCategory.AUDIO, 'Cannot set mood - not connected to Lyria');
      return;
    }

    try {
      const prompts = this.getMoodPrompts(mood);
      const weightedPrompts = prompts.map(text => ({ text, weight: 1.0 }));
      
      // Use correct API method names
      await this.session.setWeightedPrompts({ weightedPrompts });
      
      // Set music generation config with appropriate BPM and temperature for mood
      const config = this.getMoodConfig(mood);
      await this.session.setMusicGenerationConfig({ musicGenerationConfig: config });
      
      this.currentMood = mood;
      
      logger.info(LogCategory.AUDIO, `Lyria mood set to ${mood}`, { prompts, config });
    } catch (error) {
      logError(LogCategory.AUDIO, 'Failed to set Lyria mood', error);
      throw error;
    }
  }

  private getMoodPrompts(mood: MusicMood): string[] {
    const moodPrompts: Record<MusicMood, string[]> = {
      [MusicMood.Tension]: [
        'suspenseful orchestral music',
        'building tension',
        'dramatic strings and brass'
      ],
      [MusicMood.Battle]: [
        'epic battle music',
        'intense orchestral combat',
        'heroic brass and percussion'
      ],
      [MusicMood.Exploration]: [
        'ambient exploration music',
        'mysterious discovery theme',
        'ethereal atmospheric sounds'
      ],
      [MusicMood.Somber]: [
        'melancholic piano and strings',
        'sad emotional music',
        'reflective minor key'
      ],
      [MusicMood.Heroic]: [
        'triumphant heroic theme',
        'inspiring orchestral music',
        'noble brass fanfare'
      ],
      [MusicMood.Mysterious]: [
        'mysterious ambient music',
        'enigmatic soundscape',
        'ethereal mysterious tones'
      ],
      [MusicMood.Intense]: [
        'intense dramatic music',
        'high energy orchestral',
        'powerful driving rhythm'
      ],
      [MusicMood.Ambient]: [
        'calm ambient background',
        'peaceful atmospheric music',
        'meditative soundscape'
      ]
    };

    return moodPrompts[mood] || ['ambient background music'];
  }

  private getMoodConfig(mood: MusicMood): { bpm?: number; temperature?: number } {
    const configs: Record<MusicMood, { bpm?: number; temperature?: number }> = {
      [MusicMood.Tension]: { bpm: 80, temperature: 0.7 },
      [MusicMood.Battle]: { bpm: 140, temperature: 0.9 },
      [MusicMood.Exploration]: { bpm: 90, temperature: 0.8 },
      [MusicMood.Somber]: { bpm: 60, temperature: 0.5 },
      [MusicMood.Heroic]: { bpm: 120, temperature: 0.7 },
      [MusicMood.Mysterious]: { bpm: 70, temperature: 0.9 },
      [MusicMood.Intense]: { bpm: 160, temperature: 1.0 },
      [MusicMood.Ambient]: { bpm: 80, temperature: 0.6 }
    };

    return configs[mood] || { bpm: 90, temperature: 0.7 };
  }

  setVolume(volume: number): void {
    if (this.outputNode) {
      const clampedVolume = Math.max(0, Math.min(1, volume));
      this.outputNode.gain.linearRampToValueAtTime(
        clampedVolume,
        this.audioContext!.currentTime + 0.1
      );
      logger.debug(LogCategory.AUDIO, `Lyria volume set to ${clampedVolume}`);
    }
  }

  isConnectedToLyria(): boolean {
    return this.isConnected;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentMood(): MusicMood | null {
    return this.currentMood;
  }

  async disconnect(): Promise<void> {
    if (this.isPlaying) {
      await this.stop();
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    this.session = null;
    this.outputNode = null;
    this.isConnected = false;
    
    logger.info(LogCategory.AUDIO, 'Lyria service disconnected');
  }
}

export const lyriaService = new LyriaService();
