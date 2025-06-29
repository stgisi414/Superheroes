
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

  // Simulated Lyra tracks - in production these would come from Lyria API
  private tracks: LyraTrack[] = [
    {
      id: 'menu_heroic',
      url: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav', // Placeholder
      mood: MusicMood.Heroic,
      section: GameSection.MainMenu,
      volume: 0.4
    },
    {
      id: 'creation_mysterious',
      url: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav', // Placeholder
      mood: MusicMood.Mysterious,
      section: GameSection.CharacterCreation,
      volume: 0.3
    },
    {
      id: 'gameplay_ambient',
      url: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav', // Placeholder
      mood: MusicMood.Ambient,
      section: GameSection.NormalGameplay,
      volume: 0.25
    },
    {
      id: 'action_intense',
      url: 'https://www.soundjay.com/misc/sounds/fail-buzzer-02.wav', // Placeholder
      mood: MusicMood.Intense,
      section: GameSection.ActionGameplay,
      volume: 0.5
    }
  ];

  async playForSection(section: GameSection): Promise<void> {
    if (this.currentSection === section && this.isPlaying) {
      return; // Already playing the right music
    }

    logger.info('BGM_SERVICE', `Switching to ${section} music`);

    // Stop current music with fade out
    if (this.currentAudio && this.isPlaying) {
      await this.fadeOut();
    }

    this.currentSection = section;
    const track = this.getTrackForSection(section);
    
    if (track) {
      await this.playTrack(track);
    }
  }

  private getTrackForSection(section: GameSection): LyraTrack | null {
    return this.tracks.find(track => track.section === section) || null;
  }

  private async playTrack(track: LyraTrack): Promise<void> {
    try {
      // In production, this would fetch from Lyria API
      logger.info('BGM_SERVICE', `Loading track: ${track.id} for mood: ${track.mood}`);
      
      // For now, we'll simulate Lyria by using a simple audio element
      // In production, replace this with actual Lyria API calls
      this.currentAudio = new Audio();
      this.currentAudio.loop = true;
      this.currentAudio.volume = 0;
      
      // Simulate different tracks with different frequencies for demo
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different sections
      const frequencies = {
        [GameSection.MainMenu]: 440,      // A note - heroic
        [GameSection.CharacterCreation]: 330, // E note - mysterious
        [GameSection.NormalGameplay]: 261,    // C note - ambient
        [GameSection.ActionGameplay]: 523     // High C - intense
      };
      
      oscillator.frequency.setValueAtTime(frequencies[track.section], audioContext.currentTime);
      oscillator.type = 'sine';
      gainNode.gain.setValueAtTime(0, audioContext.currentTime);
      
      oscillator.start();
      
      // Fade in
      await this.fadeIn(gainNode, track.volume);
      
      this.isPlaying = true;
      logger.info('BGM_SERVICE', `Now playing: ${track.id}`);
      
    } catch (error) {
      logger.error('BGM_SERVICE', 'Error playing track', { error, trackId: track.id });
    }
  }

  private async fadeIn(gainNode?: GainNode, targetVolume: number = this.volume): Promise<void> {
    return new Promise((resolve) => {
      if (gainNode) {
        // For Web Audio API
        gainNode.gain.linearRampToValueAtTime(targetVolume * this.volume, gainNode.context.currentTime + 1);
        setTimeout(resolve, 1000);
      } else if (this.currentAudio) {
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

  // Simulate Lyria mood transitions within a section
  async transitionToMood(mood: MusicMood): Promise<void> {
    if (!this.currentSection) return;
    
    logger.info('BGM_SERVICE', `Transitioning to mood: ${mood} within section: ${this.currentSection}`);
    
    // In production, this would call Lyria API to smoothly transition the current track's mood
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
