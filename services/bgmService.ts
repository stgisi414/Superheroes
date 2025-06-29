
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
  private isPlaying: boolean = false;
  private volume: number = 0.3;
  private fadeInterval: NodeJS.Timeout | null = null;
  private isLoading: boolean = false;

  // Using royalty-free music URLs from freesound.org and other sources
  private tracks: LyraTrack[] = [
    {
      id: 'menu_heroic',
      url: 'https://www.soundjay.com/misc/sounds/music/orchestral-theme-01.mp3',
      mood: MusicMood.Heroic,
      section: GameSection.MainMenu,
      volume: 0.4
    },
    {
      id: 'creation_mysterious',
      url: 'https://www.soundjay.com/misc/sounds/music/ambient-space-01.mp3',
      mood: MusicMood.Mysterious,
      section: GameSection.CharacterCreation,
      volume: 0.3
    },
    {
      id: 'gameplay_ambient',
      url: 'https://www.soundjay.com/misc/sounds/music/calm-ambient-01.mp3',
      mood: MusicMood.Ambient,
      section: GameSection.NormalGameplay,
      volume: 0.25
    },
    {
      id: 'action_intense',
      url: 'https://www.soundjay.com/misc/sounds/music/action-theme-01.mp3',
      mood: MusicMood.Intense,
      section: GameSection.ActionGameplay,
      volume: 0.5
    }
  ];

  async playForSection(section: GameSection): Promise<void> {
    if (this.currentSection === section && this.isPlaying) {
      return; // Already playing the right music
    }

    if (this.isLoading) {
      return; // Already loading a track, prevent conflicts
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
      logger.info('BGM_SERVICE', `Loading track: ${track.id} for mood: ${track.mood}`);
      
      // Create HTML audio element and load the actual track
      this.currentAudio = new Audio(track.url);
      this.currentAudio.loop = true;
      this.currentAudio.volume = 0;
      this.currentAudio.crossOrigin = "anonymous";
      
      // Handle loading errors gracefully
      this.currentAudio.onerror = (e) => {
        logger.error('BGM_SERVICE', 'Error loading audio track', { error: e, trackId: track.id });
        this.fallbackToSilence();
      };

      // Wait for the audio to be ready to play
      await new Promise<void>((resolve, reject) => {
        if (!this.currentAudio) {
          reject(new Error('Audio element not available'));
          return;
        }

        const onCanPlay = () => {
          this.currentAudio?.removeEventListener('canplaythrough', onCanPlay);
          this.currentAudio?.removeEventListener('error', onError);
          resolve();
        };

        const onError = (e: Event) => {
          this.currentAudio?.removeEventListener('canplaythrough', onCanPlay);
          this.currentAudio?.removeEventListener('error', onError);
          reject(e);
        };

        this.currentAudio.addEventListener('canplaythrough', onCanPlay);
        this.currentAudio.addEventListener('error', onError);
        
        // Start loading the audio
        this.currentAudio.load();
      });

      // Start playing and fade in
      await this.currentAudio.play();
      await this.fadeIn(undefined, track.volume);
      
      this.isPlaying = true;
      logger.info('BGM_SERVICE', `Now playing: ${track.id}`);
      
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

  private generateSimpleBackgroundTone(): void {
    try {
      // Create a simple ambient tone using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Create a soft, ambient drone
      oscillator.frequency.setValueAtTime(220, audioContext.currentTime); // A3 note
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.1 * this.volume, audioContext.currentTime + 2);
      
      oscillator.start();
      
      // Clean up after 30 seconds and regenerate
      setTimeout(() => {
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);
        setTimeout(() => {
          oscillator.stop();
          if (this.isPlaying && !this.currentAudio) {
            this.generateSimpleBackgroundTone(); // Regenerate
          }
        }, 1000);
      }, 30000);
      
      this.isPlaying = true;
      logger.info('BGM_SERVICE', 'Generated simple background tone');
      
    } catch (error) {
      logger.error('BGM_SERVICE', 'Failed to generate background tone', { error });
      this.stopCurrent();
    }
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
}

export const bgmService = new BGMService();
