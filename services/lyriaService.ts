
import {
  GoogleGenAI,
  type LiveMusicSession,
  type LiveMusicServerMessage,
} from '@google/genai';
import { MusicMood } from '../types';
import { logger, LogCategory, logError, logPerformance } from './logger';

type PlaybackState = 'stopped' | 'playing' | 'loading' | 'paused';

interface MusicState {
  playbackState: PlaybackState;
  isMuted: boolean;
}

type StateListener = (newState: MusicState) => void;

const model = 'lyria-realtime-exp';
const sampleRate = 48000;
const bufferTime = 2; // Audio buffer in seconds

class LyriaService {
  private ai: GoogleGenAI | null = null;
  private session: LiveMusicSession | null = null;
  private audioContext: AudioContext | null = null;
  private outputNode: GainNode | null = null;
  private nextStartTime: number = 0;
  private connectionError: boolean = false;
  private currentMood: MusicMood | null = null;

  private state: MusicState = {
    playbackState: 'stopped',
    isMuted: false,
  };
  private listeners: Set<StateListener> = new Set();

  constructor() {
    logger.info(LogCategory.AUDIO, 'Initializing Lyria service');
  }

  private updateState(newState: Partial<MusicState>): void {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach((listener) => listener(this.state));
  }

  private initAudioContext(): void {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate,
      });
      this.outputNode = this.audioContext.createGain();
      this.outputNode.connect(this.audioContext.destination);
      // Ensure outputNode gain reflects initial mute state when context is created
      this.outputNode.gain.setValueAtTime(this.state.isMuted ? 0 : 1, this.audioContext.currentTime);
    }
  }

  /**
   * Decodes a base64 string.
   */
  private decode(str: string): string {
    return atob(str);
  }

  /**
   * Decodes audio data into an AudioBuffer.
   * The incoming data from the Lyria model is interleaved 16-bit PCM.
   */
  private async decodeAudioData(
    audioData: string,
    audioContext: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    // Convert the binary string from atob() into a byte buffer (ArrayBuffer).
    const pcm16Data = new ArrayBuffer(audioData.length);
    const pcm16DataView = new Uint8Array(pcm16Data);
    for (let i = 0; i < audioData.length; i++) {
      pcm16DataView[i] = audioData.charCodeAt(i);
    }

    // Create a view of the buffer as 16-bit signed integers.
    const pcm16Samples = new Int16Array(pcm16Data);

    // The number of frames is the total number of samples divided by the number of channels.
    const numFrames = pcm16Samples.length / numChannels;

    // Create an empty AudioBuffer with the correct parameters.
    const audioBuffer = audioContext.createBuffer(
      numChannels,
      numFrames,
      sampleRate,
    );

    // De-interleave and normalize the 16-bit PCM data into 32-bit float data for each channel.
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < numFrames; i++) {
        // Get the interleaved sample for this channel.
        const sample = pcm16Samples[i * numChannels + channel];
        // Normalize from the 16-bit integer range [-32768, 32767] to the float range [-1.0, 1.0] and store it.
        channelData[i] = sample / 32768.0;
      }
    }

    return audioBuffer;
  }

  private async handleServerMessage(e: LiveMusicServerMessage): Promise<void> {
    console.log('Received message from the music server:', e);
    if (e.setupComplete) {
      this.connectionError = false;
    }
    if (e.serverContent?.audioChunks !== undefined) {
      if (this.state.playbackState === 'paused' || this.state.playbackState === 'stopped') return;
      
      // Check for filtered prompts to provide feedback
      if ((e as any).filteredPrompt) {
        console.warn(`Prompt "${(e as any).filteredPrompt.text}" was filtered because: ${(e as any).filteredPrompt.filteredReason}`);
      }

      if (!this.audioContext || !this.outputNode) return;

      const audioBuffer = await this.decodeAudioData(
        this.decode(e.serverContent?.audioChunks[0].data),
        this.audioContext,
        sampleRate,
        2
      );
      const source = this.audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputNode);

      // If starting fresh or after a reset (underrun)
      if (this.nextStartTime === 0 || this.nextStartTime < this.audioContext.currentTime) {
        // This inner block is for underruns. It should not trigger on the first chunk (when nextStartTime is 0).
        if (this.nextStartTime > 0 && this.nextStartTime < this.audioContext.currentTime) {
          console.warn('Audio buffer underrun detected. Re-synchronizing audio playback.');
          this.updateState({ playbackState: 'loading' }); // Set to loading to indicate re-buffering
          
          // Stop any current playback by recreating the output node to flush the pipeline.
          this.outputNode.disconnect();
          this.outputNode = this.audioContext.createGain();
          this.outputNode.connect(this.audioContext.destination);
          this.outputNode.gain.setValueAtTime(this.state.isMuted ? 0 : 1, this.audioContext.currentTime);
        }
        
        // Set a new start time, adding buffer time. This happens for the first chunk and after an underrun.
        this.nextStartTime = this.audioContext.currentTime + bufferTime;
        
        // Transition to 'playing' after the buffer time has passed.
        setTimeout(() => {
          if (this.state.playbackState === 'loading') {
            this.updateState({ playbackState: 'playing' });
          }
        }, bufferTime * 1000);
      }
      
      source.start(this.nextStartTime);
      this.nextStartTime += audioBuffer.duration;
    }
  }

  async initialize(): Promise<void> {
    const endTimer = logPerformance(LogCategory.AUDIO, 'Initialize Lyria service');
    
    try {
      // Initialize GenAI client with v1alpha for Lyria access
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY not found in environment variables');
      }

      this.ai = new GoogleGenAI({ apiKey, apiVersion: 'v1alpha' });
      logger.info(LogCategory.AUDIO, 'GoogleGenAI client initialized');

      logger.info(LogCategory.AUDIO, 'Lyria service initialized successfully');
    } catch (error) {
      logError(LogCategory.AUDIO, 'Failed to initialize Lyria service', error);
      throw error;
    } finally {
      endTimer();
    }
  }

  async connect(): Promise<void> {
    if (!this.ai) {
      throw new Error('Lyria service not initialized');
    }

    if (this.session) return; // Already connected

    const endTimer = logPerformance(LogCategory.AUDIO, 'Connect to Lyria');

    try {
      this.initAudioContext();

      this.session = await this.ai.live.music.connect({
        model,
        callbacks: {
          onmessage: this.handleServerMessage.bind(this),
          onerror: (e: ErrorEvent) => {
            console.error('Music service connection error:', e);
            this.connectionError = true;
            this.stop();
          },
          onclose: (e: CloseEvent) => {
            console.log('Music service connection closed.');
            this.connectionError = true;
            this.stop();
          },
        },
      });
      this.connectionError = false;
      logger.info(LogCategory.AUDIO, "Successfully connected to Lyria music service.");
    } catch (error) {
      this.connectionError = true;
      this.updateState({ playbackState: 'stopped' });
      logError(LogCategory.AUDIO, 'Failed to connect to Lyria', error);
      throw error;
    } finally {
      endTimer();
    }
  }

  private getMoodPrompts(mood: MusicMood): string[] {
    const moodPrompts: Record<MusicMood, string[]> = {
      [MusicMood.Tension]: ['suspenseful orchestral music', 'building tension', 'dramatic strings'],
      [MusicMood.Battle]: ['epic battle music', 'intense orchestral combat', 'heroic brass'],
      [MusicMood.Exploration]: ['ambient exploration music', 'mysterious discovery theme'],
      [MusicMood.Somber]: ['melancholic piano and strings', 'sad emotional music'],
      [MusicMood.Heroic]: ['triumphant heroic theme', 'inspiring orchestral music'],
      [MusicMood.Mysterious]: ['mysterious ambient music', 'enigmatic soundscape'],
      [MusicMood.Intense]: ['intense dramatic music', 'high energy orchestral'],
      [MusicMood.Ambient]: ['calm ambient background', 'peaceful atmospheric music']
    };

    return moodPrompts[mood] || ['ambient background music'];
  }

  async setMood(mood: MusicMood): Promise<void> {
    if (!this.session || this.connectionError) {
      console.warn("Attempted to set mood without an active music session or while in connection error state.");
      return;
    }

    const prompts = this.getMoodPrompts(mood);
    const weightedPrompts = prompts.map(p => ({ text: p, weight: 1.0 }));
    
    try {
      await this.session.setWeightedPrompts({ weightedPrompts });
      this.currentMood = mood;
      logger.info(LogCategory.AUDIO, `Set Lyria mood to: ${mood}`, { prompts });
    } catch (e: any) {
      console.error("Failed to set music prompts:", e.message);
      this.pause();
    }
  }

  async play(): Promise<void> {
    if (!this.session || this.state.playbackState === 'playing' || this.state.playbackState === 'loading') return;
    
    if (this.connectionError) {
      console.log("Connection error detected, attempting to reconnect...");
      await this.connect();
      return;
    }

    this.initAudioContext();
    if (this.audioContext) {
      await this.audioContext.resume();
    }
    
    await this.session.play();
    
    if (this.outputNode && this.audioContext) {
      this.outputNode.gain.setValueAtTime(this.state.isMuted ? 0 : 1, this.audioContext.currentTime);
    }

    this.updateState({ playbackState: 'loading' });
    logger.info(LogCategory.AUDIO, 'Started Lyria music playback');
  }

  async pause(): Promise<void> {
    if (!this.session || this.state.playbackState === 'paused' || this.state.playbackState === 'stopped') return;
    
    await this.session.pause();
    this.nextStartTime = 0;
    
    if (this.outputNode && this.audioContext) {
      this.outputNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
    }
    
    setTimeout(() => {
      this.updateState({ playbackState: 'paused' });
      if (this.outputNode && this.audioContext) {
        this.outputNode.gain.setValueAtTime(1, this.audioContext.currentTime);
      }
    }, 100);
    
    logger.info(LogCategory.AUDIO, 'Paused Lyria music playback');
  }

  async stop(): Promise<void> {
    if (!this.session) return;
    
    await this.session.stop();
    this.nextStartTime = 0;
    
    if (this.outputNode && this.audioContext) {
      this.outputNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
    }
    
    setTimeout(() => {
      this.updateState({ playbackState: 'stopped' });
      if (this.outputNode && this.audioContext) {
        this.outputNode.gain.setValueAtTime(1, this.audioContext.currentTime);
      }
    }, 100);
    
    logger.info(LogCategory.AUDIO, 'Stopped Lyria music playback');
  }

  setVolume(volume: number): void {
    if (this.outputNode && this.audioContext) {
      this.outputNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    }
  }

  toggleMute(): void {
    if (!this.audioContext || !this.outputNode) return;
    
    const newMutedState = !this.state.isMuted;
    this.outputNode.gain.linearRampToValueAtTime(newMutedState ? 0 : 1, this.audioContext.currentTime + 0.05);
    this.updateState({ isMuted: newMutedState });
  }

  isConnectedToLyria(): boolean {
    return this.session !== null && !this.connectionError;
  }

  isCurrentlyPlaying(): boolean {
    return this.state.playbackState === 'playing' || this.state.playbackState === 'loading';
  }

  addStateListener(listener: StateListener): void {
    this.listeners.add(listener);
    listener(this.state);
  }

  removeStateListener(listener: StateListener): void {
    this.listeners.delete(listener);
  }

  getIsMuted(): boolean {
    return this.state.isMuted;
  }

  async disconnect(): Promise<void> {
    if (this.session) {
      await this.stop();
      this.session = null;
    }
    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }
    logger.info(LogCategory.AUDIO, 'Disconnected from Lyria service');
  }
}

export const lyriaService = new LyriaService();
