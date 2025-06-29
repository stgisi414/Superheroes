
import { MusicMood } from '../types';
import { logger } from './logger';

export enum GameSection {
  MainMenu = 'main_menu',
  CharacterCreation = 'character_creation',
  NormalGameplay = 'normal_gameplay',
  ActionGameplay = 'action_gameplay'
}

interface LyraTrack {
  id: string;
  url: string;
  mood: MusicMood;
  section: GameSection;
  volume: number;
}

class BGMService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentSection: GameSection | null = null;

  constructor() {
    // Set up user interaction detection
    this.setupUserInteractionTracking();
  }
  private isPlaying: boolean = false;
  private volume: number = 0.3;
  private fadeInterval: NodeJS.Timeout | null = null;
  private isLoading: boolean = false;
  private userHasInteracted: boolean = false;
  private audioContext: AudioContext | null = null;

  // Using data URIs for simple generated audio to avoid CORS issues
  private tracks: LyraTrack[] = [
    {
      id: 'menu_heroic',
      url: '', // Will use generated audio
      mood: MusicMood.Heroic,
      section: GameSection.MainMenu,
      volume: 0.4
    },
    {
      id: 'creation_mysterious',
      url: '', // Will use generated audio
      mood: MusicMood.Mysterious,
      section: GameSection.CharacterCreation,
      volume: 0.3
    },
    {
      id: 'gameplay_ambient',
      url: '', // Will use generated audio
      mood: MusicMood.Ambient,
      section: GameSection.NormalGameplay,
      volume: 0.25
    },
    {
      id: 'action_intense',
      url: '', // Will use generated audio
      mood: MusicMood.Intense,
      section: GameSection.ActionGameplay,
      volume: 0.5
    }
  ];

  private setupUserInteractionTracking(): void {
    const enableAudio = () => {
      this.userHasInteracted = true;
      logger.info('BGM_SERVICE', 'User interaction detected - audio enabled');
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('keydown', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };

    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    document.addEventListener('touchstart', enableAudio);
  }

  async playForSection(section: GameSection): Promise<void> {
    if (this.currentSection === section && this.isPlaying) {
      return; // Already playing the right music
    }

    if (this.isLoading) {
      return; // Already loading a track, prevent conflicts
    }

    if (!this.userHasInteracted) {
      logger.info('BGM_SERVICE', 'Waiting for user interaction before playing audio');
      this.currentSection = section; // Remember the section for later
      return;
    }

    logger.info('BGM_SERVICE', `Switching to ${section} music`);

    this.isLoading = true;

    // Stop current music with fade out
    if (this.currentAudio && this.isPlaying) {
      await this.fadeOut();
    }

    this.currentSection = section;
    const track = this.getTrackForSection(section);
    
    if (track) {
      await this.playTrack(track);
    }
    
    this.isLoading = false;
  }

  private getTrackForSection(section: GameSection): LyraTrack | null {
    return this.tracks.find(track => track.section === section) || null;
  }

  private async playTrack(track: LyraTrack): Promise<void> {
    try {
      logger.info('BGM_SERVICE', `Generating audio for track: ${track.id} with mood: ${track.mood}`);
      
      // Generate audio based on mood instead of loading external files
      await this.generateMoodBasedAudio(track);
      
      this.isPlaying = true;
      logger.info('BGM_SERVICE', `Now playing generated audio: ${track.id}`);
      
    } catch (error) {
      logger.error('BGM_SERVICE', 'Error playing track', { error, trackId: track.id });
      this.fallbackToSilence();
    }
  }

  private fallbackToSilence(): void {
    // If we can't load audio files, generate simple background tones
    logger.info('BGM_SERVICE', 'Falling back to generated tones due to audio loading issues');
    this.generateSimpleBackgroundTone();
  }

  private async generateMoodBasedAudio(track: LyraTrack): Promise<void> {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Ensure AudioContext is running
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      const gainNode = this.audioContext.createGain();
      gainNode.connect(this.audioContext.destination);
      
      // Generate audio based on mood
      switch (track.mood) {
        case MusicMood.Heroic:
          this.generateHeroicTheme(gainNode);
          break;
        case MusicMood.Mysterious:
          this.generateMysteriousAmbience(gainNode);
          break;
        case MusicMood.Ambient:
          this.generateAmbientSounds(gainNode);
          break;
        case MusicMood.Intense:
          this.generateIntenseMusic(gainNode);
          break;
        default:
          this.generateAmbientSounds(gainNode);
      }
      
      // Fade in
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(track.volume * this.volume, this.audioContext.currentTime + 2);
      
      logger.info('BGM_SERVICE', `Generated ${track.mood} mood audio`);
      
    } catch (error) {
      logger.error('BGM_SERVICE', 'Failed to generate mood-based audio', { error });
      this.fallbackToSilence();
    }
  }

  private generateHeroicTheme(gainNode: GainNode): void {
    if (!this.audioContext) return;
    
    // Major chord progression with bright tones
    const frequencies = [261.63, 329.63, 392.00]; // C-E-G major chord
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const oscGain = this.audioContext!.createGain();
      
      oscillator.connect(oscGain);
      oscGain.connect(gainNode);
      
      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
      oscillator.type = 'triangle';
      oscGain.gain.setValueAtTime(0.3 / frequencies.length, this.audioContext!.currentTime);
      
      oscillator.start();
    });
  }

  private generateMysteriousAmbience(gainNode: GainNode): void {
    if (!this.audioContext) return;
    
    // Low, haunting tones with slight modulation
    const oscillator = this.audioContext.createOscillator();
    const lfo = this.audioContext.createOscillator();
    const lfoGain = this.audioContext.createGain();
    
    oscillator.connect(gainNode);
    lfo.connect(lfoGain);
    lfoGain.connect(oscillator.frequency);
    
    oscillator.frequency.setValueAtTime(110, this.audioContext.currentTime); // Low A
    oscillator.type = 'sine';
    
    lfo.frequency.setValueAtTime(0.5, this.audioContext.currentTime);
    lfoGain.gain.setValueAtTime(20, this.audioContext.currentTime);
    
    oscillator.start();
    lfo.start();
  }

  private generateAmbientSounds(gainNode: GainNode): void {
    if (!this.audioContext) return;
    
    // Soft, peaceful drones
    const frequencies = [220, 330, 440]; // A-E-A
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const oscGain = this.audioContext!.createGain();
      
      oscillator.connect(oscGain);
      oscGain.connect(gainNode);
      
      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
      oscillator.type = 'sine';
      oscGain.gain.setValueAtTime(0.2 / frequencies.length, this.audioContext!.currentTime);
      
      oscillator.start();
    });
  }

  private generateIntenseMusic(gainNode: GainNode): void {
    if (!this.audioContext) return;
    
    // Fast, driving rhythm with minor tonality
    const frequencies = [146.83, 174.61, 220]; // D-F-A minor chord
    frequencies.forEach((freq, index) => {
      const oscillator = this.audioContext!.createOscillator();
      const oscGain = this.audioContext!.createGain();
      
      oscillator.connect(oscGain);
      oscGain.connect(gainNode);
      
      oscillator.frequency.setValueAtTime(freq, this.audioContext!.currentTime);
      oscillator.type = 'sawtooth';
      oscGain.gain.setValueAtTime(0.4 / frequencies.length, this.audioContext!.currentTime);
      
      oscillator.start();
    });
  }

  private generateSimpleBackgroundTone(): void {
    // Fallback to basic ambient tone
    this.generateMoodBasedAudio({
      id: 'fallback',
      url: '',
      mood: MusicMood.Ambient,
      section: GameSection.MainMenu,
      volume: 0.2
    });
  }

  private async fadeIn(gainNode?: GainNode, targetVolume: number = this.volume): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentAudio) {
        // For HTML Audio Element
        let currentVolume = 0;
        const fadeStep = (targetVolume * this.volume) / 20;
        
        this.fadeInterval = setInterval(() => {
          currentVolume += fadeStep;
          if (this.currentAudio) {
            this.currentAudio.volume = Math.min(currentVolume, targetVolume * this.volume);
          }
          
          if (currentVolume >= targetVolume * this.volume) {
            if (this.fadeInterval) clearInterval(this.fadeInterval);
            resolve();
          }
        }, 50);
      } else {
        resolve();
      }
    });
  }

  private async fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.currentAudio) {
        resolve();
        return;
      }

      const startVolume = this.currentAudio.volume;
      const fadeStep = startVolume / 20;
      
      this.fadeInterval = setInterval(() => {
        if (this.currentAudio) {
          this.currentAudio.volume = Math.max(this.currentAudio.volume - fadeStep, 0);
          
          if (this.currentAudio.volume <= 0) {
            if (this.fadeInterval) clearInterval(this.fadeInterval);
            this.stopCurrent();
            resolve();
          }
        }
      }, 50);
    });
  }

  private stopCurrent(): void {
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.isPlaying = false;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
  }

  async stop(): Promise<void> {
    if (this.isPlaying) {
      await this.fadeOut();
    }
    this.currentSection = null;
  }

  // Simulate Lyra mood transitions within a section
  async transitionToMood(mood: MusicMood): Promise<void> {
    if (!this.currentSection) return;
    
    logger.info('BGM_SERVICE', `Transitioning to mood: ${mood} within section: ${this.currentSection}`);
    
    // In production, this would call Lyra API to smoothly transition the current track's mood
    // For simulation, we'll just log the transition
    console.log(`[BGM_SERVICE] Lyria mood transition: ${mood}`);
  }

  getCurrentSection(): GameSection | null {
    return this.currentSection;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  // Call this method when user interaction is detected
  async retryAudioAfterInteraction(): Promise<void> {
    if (this.userHasInteracted && this.currentSection && !this.isPlaying) {
      logger.info('BGM_SERVICE', 'Retrying audio playback after user interaction');
      await this.playForSection(this.currentSection);
    }
  }
}

export const bgmService = new BGMService();
