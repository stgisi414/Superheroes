
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

interface MusicPattern {
  notes: { frequency: number; duration: number; velocity: number }[];
  rhythm: number[];
  tempo: number;
}

class BGMService {
  private currentAudio: HTMLAudioElement | null = null;
  private currentSection: GameSection | null = null;
  private masterGain: GainNode | null = null;
  private isPlaying: boolean = false;
  private volume: number = 0.7;
  private fadeInterval: NodeJS.Timeout | null = null;
  private isLoading: boolean = false;
  private userHasInteracted: boolean = false;
  private audioContext: AudioContext | null = null;
  private isMuted: boolean = false;
  private currentMusicNodes: AudioNode[] = [];
  private musicTimeouts: NodeJS.Timeout[] = [];

  constructor() {
    this.setupUserInteractionTracking();
  }

  private tracks: LyraTrack[] = [
    {
      id: 'menu_heroic',
      url: '',
      mood: MusicMood.Heroic,
      section: GameSection.MainMenu,
      volume: 0.6
    },
    {
      id: 'creation_mysterious',
      url: '',
      mood: MusicMood.Mysterious,
      section: GameSection.CharacterCreation,
      volume: 0.5
    },
    {
      id: 'gameplay_ambient',
      url: '',
      mood: MusicMood.Ambient,
      section: GameSection.NormalGameplay,
      volume: 0.4
    },
    {
      id: 'action_intense',
      url: '',
      mood: MusicMood.Intense,
      section: GameSection.ActionGameplay,
      volume: 0.7
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
      return;
    }

    if (this.isLoading) {
      return;
    }

    if (!this.userHasInteracted) {
      logger.info('BGM_SERVICE', 'Waiting for user interaction before playing audio');
      this.currentSection = section;
      return;
    }

    logger.info('BGM_SERVICE', `Switching to ${section} music`);

    this.isLoading = true;

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
      logger.info('BGM_SERVICE', `Generating music for track: ${track.id} with mood: ${track.mood}`);
      
      await this.generateActualMusic(track);
      
      this.isPlaying = true;
      logger.info('BGM_SERVICE', `Now playing music: ${track.id}`);
      
    } catch (error) {
      logger.error('BGM_SERVICE', 'Error playing track', { error, trackId: track.id });
      this.fallbackToSilence();
    }
  }

  private fallbackToSilence(): void {
    logger.info('BGM_SERVICE', 'Falling back to silence due to audio loading issues');
    this.stopAllMusic();
  }

  private async generateActualMusic(track: LyraTrack): Promise<void> {
    try {
      this.stopAllMusic();
      
      if (this.audioContext) {
        this.audioContext.close();
      }
      
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      
      // Generate actual music based on mood
      switch (track.mood) {
        case MusicMood.Heroic:
          this.generateHeroicSymphony(this.masterGain);
          break;
        case MusicMood.Mysterious:
          this.generateMysteriousScore(this.masterGain);
          break;
        case MusicMood.Ambient:
          this.generateAmbientMusic(this.masterGain);
          break;
        case MusicMood.Intense:
          this.generateActionMovieMusic(this.masterGain);
          break;
        default:
          this.generateAmbientMusic(this.masterGain);
      }
      
      const targetVolume = Math.min(track.volume * this.volume, 1.0);
      this.masterGain.gain.linearRampToValueAtTime(targetVolume, this.audioContext.currentTime + 2.0);
      
      logger.info('BGM_SERVICE', `Generated ${track.mood} music at volume ${targetVolume}`);
      
    } catch (error) {
      logger.error('BGM_SERVICE', 'Failed to generate music', { error });
      this.fallbackToSilence();
    }
  }

  private generateActionMovieMusic(gainNode: GainNode): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Action movie music pattern - driving rhythm with heroic melodies
    const bassPattern = [82.41, 82.41, 110, 82.41]; // E2-E2-A2-E2
    const mainMelody = [
      { freq: 329.63, duration: 0.5 }, // E4
      { freq: 392.00, duration: 0.5 }, // G4
      { freq: 493.88, duration: 1.0 }, // B4
      { freq: 440.00, duration: 0.5 }, // A4
      { freq: 392.00, duration: 0.5 }, // G4
      { freq: 329.63, duration: 1.0 }, // E4
    ];
    
    // Strong bass drum pattern
    this.createDrumPattern(gainNode, now);
    
    // Driving bass line
    this.createBassLine(gainNode, bassPattern, now, 120); // 120 BPM
    
    // Heroic melody
    this.createMelodyLine(gainNode, mainMelody, now, 120);
    
    // High energy harmony
    this.createHarmonySection(gainNode, now);
  }

  private generateHeroicSymphony(gainNode: GainNode): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Heroic fanfare melody
    const heroicMelody = [
      { freq: 261.63, duration: 1.0 }, // C4
      { freq: 329.63, duration: 1.0 }, // E4
      { freq: 392.00, duration: 1.0 }, // G4
      { freq: 523.25, duration: 1.5 }, // C5
      { freq: 392.00, duration: 0.5 }, // G4
      { freq: 329.63, duration: 2.0 }, // E4
    ];
    
    // Orchestral bass
    this.createBassLine(gainNode, [130.81, 164.81, 196.00, 261.63], now, 80);
    
    // Main heroic theme
    this.createMelodyLine(gainNode, heroicMelody, now, 80);
    
    // Brass section harmony
    this.createBrassSection(gainNode, now);
  }

  private generateMysteriousScore(gainNode: GainNode): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Mysterious minor melody
    const mysteriousMelody = [
      { freq: 220.00, duration: 2.0 }, // A3
      { freq: 246.94, duration: 1.0 }, // B3
      { freq: 261.63, duration: 1.5 }, // C4
      { freq: 293.66, duration: 1.0 }, // D4
      { freq: 246.94, duration: 1.5 }, // B3
      { freq: 220.00, duration: 2.0 }, // A3
    ];
    
    // Eerie low drones
    this.createMysteriousDrones(gainNode, now);
    
    // Haunting melody
    this.createMelodyLine(gainNode, mysteriousMelody, now, 60);
    
    // Atmospheric effects
    this.createAtmosphericEffects(gainNode, now);
  }

  private generateAmbientMusic(gainNode: GainNode): void {
    if (!this.audioContext) return;

    const now = this.audioContext.currentTime;
    
    // Gentle ambient melody
    const ambientMelody = [
      { freq: 293.66, duration: 3.0 }, // D4
      { freq: 329.63, duration: 2.0 }, // E4
      { freq: 369.99, duration: 2.5 }, // F#4
      { freq: 392.00, duration: 3.0 }, // G4
      { freq: 329.63, duration: 2.5 }, // E4
      { freq: 293.66, duration: 3.0 }, // D4
    ];
    
    // Soft pad sounds
    this.createAmbientPads(gainNode, now);
    
    // Gentle melody
    this.createMelodyLine(gainNode, ambientMelody, now, 50);
    
    // Nature-like textures
    this.createTextureLayer(gainNode, now);
  }

  private createDrumPattern(gainNode: GainNode, startTime: number): void {
    if (!this.audioContext) return;

    const kickPattern = [0, 0.5, 1.0, 1.5]; // Kick on beats 1, 2, 3, 4
    const beatDuration = 0.5; // 120 BPM
    
    kickPattern.forEach((beat, index) => {
      const timeout = setTimeout(() => {
        if (!this.audioContext) return;
        
        // Kick drum (low frequency burst)
        const kickOsc = this.audioContext.createOscillator();
        const kickGain = this.audioContext.createGain();
        const kickFilter = this.audioContext.createBiquadFilter();
        
        kickOsc.connect(kickFilter);
        kickFilter.connect(kickGain);
        kickGain.connect(gainNode);
        
        kickOsc.frequency.setValueAtTime(80, this.audioContext.currentTime);
        kickOsc.frequency.exponentialRampToValueAtTime(40, this.audioContext.currentTime + 0.1);
        
        kickFilter.type = 'lowpass';
        kickFilter.frequency.setValueAtTime(120, this.audioContext.currentTime);
        
        kickGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        kickGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        
        kickOsc.start();
        kickOsc.stop(this.audioContext.currentTime + 0.2);
        
        this.currentMusicNodes.push(kickOsc, kickGain, kickFilter);
      }, beat * 1000);
      
      this.musicTimeouts.push(timeout);
    });

    // Schedule to repeat
    const repeatTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.createDrumPattern(gainNode, startTime + 2.0);
      }
    }, 2000);
    this.musicTimeouts.push(repeatTimeout);
  }

  private createBassLine(gainNode: GainNode, pattern: number[], startTime: number, bpm: number): void {
    if (!this.audioContext) return;

    const beatDuration = 60 / bpm;
    
    pattern.forEach((freq, index) => {
      const timeout = setTimeout(() => {
        if (!this.audioContext) return;
        
        const bassOsc = this.audioContext.createOscillator();
        const bassGain = this.audioContext.createGain();
        const bassFilter = this.audioContext.createBiquadFilter();
        
        bassOsc.connect(bassFilter);
        bassFilter.connect(bassGain);
        bassGain.connect(gainNode);
        
        bassOsc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
        bassOsc.type = 'sawtooth';
        
        bassFilter.type = 'lowpass';
        bassFilter.frequency.setValueAtTime(300, this.audioContext.currentTime);
        bassFilter.Q.setValueAtTime(2, this.audioContext.currentTime);
        
        bassGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        bassGain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.1);
        bassGain.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + beatDuration - 0.1);
        bassGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + beatDuration);
        
        bassOsc.start();
        bassOsc.stop(this.audioContext.currentTime + beatDuration);
        
        this.currentMusicNodes.push(bassOsc, bassGain, bassFilter);
      }, index * beatDuration * 1000);
      
      this.musicTimeouts.push(timeout);
    });

    // Schedule to repeat
    const repeatTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.createBassLine(gainNode, pattern, startTime + pattern.length * beatDuration, bpm);
      }
    }, pattern.length * beatDuration * 1000);
    this.musicTimeouts.push(repeatTimeout);
  }

  private createMelodyLine(gainNode: GainNode, melody: { freq: number; duration: number }[], startTime: number, bpm: number): void {
    if (!this.audioContext) return;

    let currentTime = 0;
    
    melody.forEach((note, index) => {
      const timeout = setTimeout(() => {
        if (!this.audioContext) return;
        
        const melodyOsc = this.audioContext.createOscillator();
        const melodyGain = this.audioContext.createGain();
        const melodyFilter = this.audioContext.createBiquadFilter();
        
        melodyOsc.connect(melodyFilter);
        melodyFilter.connect(melodyGain);
        melodyGain.connect(gainNode);
        
        melodyOsc.frequency.setValueAtTime(note.freq, this.audioContext.currentTime);
        melodyOsc.type = 'triangle';
        
        melodyFilter.type = 'bandpass';
        melodyFilter.frequency.setValueAtTime(note.freq * 2, this.audioContext.currentTime);
        melodyFilter.Q.setValueAtTime(1, this.audioContext.currentTime);
        
        melodyGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        melodyGain.gain.linearRampToValueAtTime(0.08, this.audioContext.currentTime + 0.1);
        melodyGain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + note.duration - 0.1);
        melodyGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + note.duration);
        
        melodyOsc.start();
        melodyOsc.stop(this.audioContext.currentTime + note.duration);
        
        this.currentMusicNodes.push(melodyOsc, melodyGain, melodyFilter);
      }, currentTime * 1000);
      
      this.musicTimeouts.push(timeout);
      currentTime += note.duration;
    });

    // Schedule to repeat
    const repeatTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.createMelodyLine(gainNode, melody, startTime + currentTime, bpm);
      }
    }, currentTime * 1000);
    this.musicTimeouts.push(repeatTimeout);
  }

  private createHarmonySection(gainNode: GainNode, startTime: number): void {
    if (!this.audioContext) return;

    // Power chords for action music
    const chords = [
      [164.81, 207.65, 246.94], // E3-G#3-B3
      [146.83, 185.00, 220.00], // D3-F#3-A3
      [130.81, 164.81, 196.00], // C3-E3-G3
    ];
    
    chords.forEach((chord, chordIndex) => {
      chord.forEach((freq, noteIndex) => {
        const timeout = setTimeout(() => {
          if (!this.audioContext) return;
          
          const harmonyOsc = this.audioContext.createOscillator();
          const harmonyGain = this.audioContext.createGain();
          
          harmonyOsc.connect(harmonyGain);
          harmonyGain.connect(gainNode);
          
          harmonyOsc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
          harmonyOsc.type = 'square';
          
          harmonyGain.gain.setValueAtTime(0, this.audioContext.currentTime);
          harmonyGain.gain.linearRampToValueAtTime(0.04, this.audioContext.currentTime + 0.2);
          harmonyGain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 1.8);
          harmonyGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2.0);
          
          harmonyOsc.start();
          harmonyOsc.stop(this.audioContext.currentTime + 2.0);
          
          this.currentMusicNodes.push(harmonyOsc, harmonyGain);
        }, chordIndex * 2000);
        
        this.musicTimeouts.push(timeout);
      });
    });

    // Schedule to repeat
    const repeatTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.createHarmonySection(gainNode, startTime + 6.0);
      }
    }, 6000);
    this.musicTimeouts.push(repeatTimeout);
  }

  private createBrassSection(gainNode: GainNode, startTime: number): void {
    if (!this.audioContext) return;

    const brassFreqs = [261.63, 329.63, 392.00]; // C4-E4-G4 major chord
    
    brassFreqs.forEach((freq, index) => {
      const timeout = setTimeout(() => {
        if (!this.audioContext) return;
        
        const brassOsc = this.audioContext.createOscillator();
        const brassGain = this.audioContext.createGain();
        const brassFilter = this.audioContext.createBiquadFilter();
        
        brassOsc.connect(brassFilter);
        brassFilter.connect(brassGain);
        brassGain.connect(gainNode);
        
        brassOsc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
        brassOsc.type = 'sawtooth';
        
        brassFilter.type = 'bandpass';
        brassFilter.frequency.setValueAtTime(freq * 3, this.audioContext.currentTime);
        brassFilter.Q.setValueAtTime(2, this.audioContext.currentTime);
        
        brassGain.gain.setValueAtTime(0, this.audioContext.currentTime);
        brassGain.gain.linearRampToValueAtTime(0.06, this.audioContext.currentTime + 0.3);
        brassGain.gain.linearRampToValueAtTime(0.04, this.audioContext.currentTime + 2.7);
        brassGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 3.0);
        
        brassOsc.start();
        brassOsc.stop(this.audioContext.currentTime + 3.0);
        
        this.currentMusicNodes.push(brassOsc, brassGain, brassFilter);
      }, index * 100);
      
      this.musicTimeouts.push(timeout);
    });

    // Schedule to repeat
    const repeatTimeout = setTimeout(() => {
      if (this.isPlaying) {
        this.createBrassSection(gainNode, startTime + 4.0);
      }
    }, 4000);
    this.musicTimeouts.push(repeatTimeout);
  }

  private createMysteriousDrones(gainNode: GainNode, startTime: number): void {
    if (!this.audioContext) return;

    const droneFreqs = [55, 73.42, 87.31]; // A1-D2-F2
    
    droneFreqs.forEach((freq, index) => {
      const droneOsc = this.audioContext.createOscillator();
      const droneGain = this.audioContext.createGain();
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();
      
      lfo.connect(lfoGain);
      lfoGain.connect(droneGain.gain);
      droneOsc.connect(droneGain);
      droneGain.connect(gainNode);
      
      droneOsc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      droneOsc.type = 'sine';
      
      lfo.frequency.setValueAtTime(0.1 + index * 0.05, this.audioContext.currentTime);
      lfoGain.gain.setValueAtTime(0.02, this.audioContext.currentTime);
      
      droneGain.gain.setValueAtTime(0.03, this.audioContext.currentTime);
      
      droneOsc.start();
      lfo.start();
      
      this.currentMusicNodes.push(droneOsc, droneGain, lfo, lfoGain);
    });
  }

  private createAtmosphericEffects(gainNode: GainNode, startTime: number): void {
    if (!this.audioContext) return;

    // Create whisper-like effects
    const effectTimeout = setTimeout(() => {
      if (!this.audioContext) return;
      
      const noiseBuffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 2, this.audioContext.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      for (let i = 0; i < output.length; i++) {
        output[i] = (Math.random() * 2 - 1) * 0.1;
      }
      
      const noiseSource = this.audioContext.createBufferSource();
      const noiseGain = this.audioContext.createGain();
      const noiseFilter = this.audioContext.createBiquadFilter();
      
      noiseSource.buffer = noiseBuffer;
      noiseSource.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(gainNode);
      
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
      
      noiseGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      noiseGain.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 1.0);
      noiseGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2.0);
      
      noiseSource.start();
      noiseSource.stop(this.audioContext.currentTime + 2.0);
      
      this.currentMusicNodes.push(noiseSource, noiseGain, noiseFilter);
    }, 3000);
    
    this.musicTimeouts.push(effectTimeout);
  }

  private createAmbientPads(gainNode: GainNode, startTime: number): void {
    if (!this.audioContext) return;

    const padFreqs = [196.00, 246.94, 293.66, 349.23]; // G3-B3-D4-F4
    
    padFreqs.forEach((freq, index) => {
      const padOsc = this.audioContext.createOscillator();
      const padGain = this.audioContext.createGain();
      const padFilter = this.audioContext.createBiquadFilter();
      
      padOsc.connect(padFilter);
      padFilter.connect(padGain);
      padGain.connect(gainNode);
      
      padOsc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
      padOsc.type = 'sine';
      
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(800, this.audioContext.currentTime);
      padFilter.Q.setValueAtTime(1, this.audioContext.currentTime);
      
      padGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      padGain.gain.linearRampToValueAtTime(0.03, this.audioContext.currentTime + 3.0);
      
      padOsc.start();
      
      this.currentMusicNodes.push(padOsc, padGain, padFilter);
    });
  }

  private createTextureLayer(gainNode: GainNode, startTime: number): void {
    if (!this.audioContext) return;

    // Create evolving textures
    const textureTimeout = setTimeout(() => {
      if (!this.audioContext) return;
      
      const textureOsc = this.audioContext.createOscillator();
      const textureGain = this.audioContext.createGain();
      const textureLfo = this.audioContext.createOscillator();
      const textureLfoGain = this.audioContext.createGain();
      
      textureLfo.connect(textureLfoGain);
      textureLfoGain.connect(textureOsc.frequency);
      textureOsc.connect(textureGain);
      textureGain.connect(gainNode);
      
      textureOsc.frequency.setValueAtTime(880, this.audioContext.currentTime);
      textureOsc.type = 'triangle';
      
      textureLfo.frequency.setValueAtTime(0.2, this.audioContext.currentTime);
      textureLfoGain.gain.setValueAtTime(100, this.audioContext.currentTime);
      
      textureGain.gain.setValueAtTime(0, this.audioContext.currentTime);
      textureGain.gain.linearRampToValueAtTime(0.02, this.audioContext.currentTime + 2.0);
      textureGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 8.0);
      
      textureOsc.start();
      textureLfo.start();
      textureOsc.stop(this.audioContext.currentTime + 8.0);
      textureLfo.stop(this.audioContext.currentTime + 8.0);
      
      this.currentMusicNodes.push(textureOsc, textureGain, textureLfo, textureLfoGain);
    }, 1000);
    
    this.musicTimeouts.push(textureTimeout);
  }

  private stopAllMusic(): void {
    // Clear all timeouts
    this.musicTimeouts.forEach(timeout => clearTimeout(timeout));
    this.musicTimeouts = [];
    
    // Stop all nodes
    this.currentMusicNodes.forEach(node => {
      try {
        if (node instanceof OscillatorNode) {
          node.stop();
        }
      } catch (error) {
        // Node may already be stopped
      }
    });
    this.currentMusicNodes = [];
  }

  private async fadeIn(gainNode?: GainNode, targetVolume: number = this.volume): Promise<void> {
    return new Promise((resolve) => {
      if (this.currentAudio) {
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
      if (!this.currentAudio && !this.masterGain) {
        resolve();
        return;
      }

      if (this.masterGain && this.audioContext) {
        this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.0);
        setTimeout(() => {
          this.stopCurrent();
          resolve();
        }, 1000);
      } else {
        resolve();
      }
    });
  }

  private stopCurrent(): void {
    this.stopAllMusic();
    
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    this.masterGain = null;
    this.isPlaying = false;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.currentAudio) {
      this.currentAudio.volume = this.volume;
    }
    
    if (this.masterGain && this.audioContext && this.currentSection) {
      const track = this.getTrackForSection(this.currentSection);
      if (track) {
        const targetVolume = track.volume * this.volume;
        this.masterGain.gain.linearRampToValueAtTime(targetVolume, this.audioContext.currentTime + 0.1);
        logger.info('BGM_SERVICE', `Volume updated to ${targetVolume}`);
      }
    }
  }

  async stop(): Promise<void> {
    if (this.isPlaying) {
      await this.fadeOut();
    }
    this.currentSection = null;
  }

  async transitionToMood(mood: MusicMood): Promise<void> {
    if (!this.currentSection) return;
    
    logger.info('BGM_SERVICE', `Transitioning to mood: ${mood} within section: ${this.currentSection}`);
    console.log(`[BGM_SERVICE] Music mood transition: ${mood}`);
  }

  async playForMood(mood: MusicMood): Promise<void> {
    logger.info('BGM_SERVICE', `Playing background music for mood: ${mood}`);
    
    const moodToSection: Record<MusicMood, GameSection> = {
      [MusicMood.Heroic]: GameSection.MainMenu,
      [MusicMood.Battle]: GameSection.ActionGameplay,
      [MusicMood.Tension]: GameSection.ActionGameplay,
      [MusicMood.Exploration]: GameSection.NormalGameplay,
      [MusicMood.Mysterious]: GameSection.NormalGameplay,
      [MusicMood.Somber]: GameSection.NormalGameplay,
      [MusicMood.Intense]: GameSection.ActionGameplay,
      [MusicMood.Ambient]: GameSection.NormalGameplay,
    };

    const section = moodToSection[mood] || GameSection.NormalGameplay;
    await this.playForSection(section);
    await this.transitionToMood(mood);
  }

  getCurrentSection(): GameSection | null {
    return this.currentSection;
  }

  isCurrentlyPlaying(): boolean {
    return this.isPlaying;
  }

  async retryAudioAfterInteraction(): Promise<void> {
    if (this.userHasInteracted && this.currentSection && !this.isPlaying) {
      logger.info('BGM_SERVICE', 'Retrying audio playback after user interaction');
      await this.playForSection(this.currentSection);
    }
  }

  async toggleMute(): Promise<void> {
    this.isMuted = !this.isMuted;
    
    if (this.masterGain && this.audioContext) {
      if (this.isMuted) {
        this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
        logger.info('BGM_SERVICE', 'Music muted');
      } else {
        const track = this.currentSection ? this.getTrackForSection(this.currentSection) : null;
        if (track) {
          const targetVolume = track.volume * this.volume;
          this.masterGain.gain.linearRampToValueAtTime(targetVolume, this.audioContext.currentTime + 0.1);
          logger.info('BGM_SERVICE', 'Music unmuted');
        }
      }
    }
  }

  isMutedState(): boolean {
    return this.isMuted;
  }

  getVolume(): number {
    return this.volume;
  }
}

export const bgmService = new BGMService();
