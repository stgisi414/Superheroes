
import { GoogleGenerativeAI } from '@google/generative-ai';
import { MusicMood } from '../types';
import { logger, LogCategory, logError, logPerformance } from './logger';

interface LyriaSession {
  play(): void;
  pause(): void;
  stop(): void;
  setWeightedPrompts(prompts: { weightedPrompts: Array<{ text: string; weight: number }> }): Promise<void>;
}

interface LiveMusicServerMessage {
  serverContent?: {
    audioChunks?: Array<{ data: string }>;
  };
}

class LyriaService {
  private genAI: GoogleGenerativeAI | null = null;
  private session: LyriaSession | null = null;
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

      this.genAI = new GoogleGenerativeAI({
        apiKey: apiKey,
        apiVersion: 'v1alpha' // Required for Lyria access
      });

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
      // Connect to Lyria live music service
      this.session = await (this.genAI as any).live.music.connect({
        model: 'lyria-realtime-exp',
        callbacks: {
          onmessage: this.handleServerMessage.bind(this),
          onerror: (e: ErrorEvent) => {
            logError(LogCategory.AUDIO, 'Lyria connection error', e);
          },
          onclose: (e: CloseEvent) => {
            logger.info(LogCategory.AUDIO, 'Lyria connection closed', { code: e.code, reason: e.reason });
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

  private async handleServerMessage(e: LiveMusicServerMessage): Promise<void> {
    if (!this.audioContext || !this.outputNode) return;

    try {
      // Check if the message contains audio chunks
      if (e.serverContent?.audioChunks !== undefined) {
        const audioData = e.serverContent.audioChunks[0].data;
        
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
      this.session.play();
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
      this.session.pause();
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
      this.session.stop();
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
      
      await this.session.setWeightedPrompts({ weightedPrompts });
      this.currentMood = mood;
      
      logger.info(LogCategory.AUDIO, `Lyria mood set to ${mood}`, { prompts });
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
        'dramatic strings and brass',
        'ominous atmosphere'
      ],
      [MusicMood.Battle]: [
        'epic battle music',
        'intense orchestral combat',
        'heroic brass and percussion',
        'fast-paced action theme'
      ],
      [MusicMood.Exploration]: [
        'ambient exploration music',
        'mysterious discovery theme',
        'ethereal atmospheric sounds',
        'wandering melody'
      ],
      [MusicMood.Somber]: [
        'melancholic piano and strings',
        'sad emotional music',
        'reflective minor key',
        'mourning atmosphere'
      ],
      [MusicMood.Heroic]: [
        'triumphant heroic theme',
        'inspiring orchestral music',
        'noble brass fanfare',
        'uplifting melody'
      ],
      [MusicMood.Mysterious]: [
        'mysterious ambient music',
        'enigmatic soundscape',
        'ethereal mysterious tones',
        'otherworldly atmosphere'
      ],
      [MusicMood.Intense]: [
        'intense dramatic music',
        'high energy orchestral',
        'powerful driving rhythm',
        'climactic tension'
      ],
      [MusicMood.Ambient]: [
        'calm ambient background',
        'peaceful atmospheric music',
        'subtle environmental sounds',
        'meditative soundscape'
      ]
    };

    return moodPrompts[mood] || ['ambient background music'];
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
