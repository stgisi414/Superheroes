
// Simulates interactions with audio services like Lyria and Google Cloud TTS.
import { MusicMood, VoiceProfile } from '../types';
import { bgmService } from './bgmService';

class AudioService {
  private currentTTSAudio: HTMLAudioElement | null = null;

  playBackgroundMusic(mood: MusicMood): void {
    // Delegate mood transitions to BGM service
    console.log(`[AudioService] Requesting mood transition to: ${mood}`);
    bgmService.transitionToMood(mood);
  }

  async speakText(text: string, voiceProfile: VoiceProfile): Promise<HTMLAudioElement> {
    // In a real app, this would call Google Cloud TTS API, get an audio stream/URL.
    console.log(`[AudioService] Simulating: Generating TTS for text: "${text}" with voice: ${voiceProfile}`);
    
    // Stop any currently playing TTS
    if (this.currentTTSAudio) {
      this.currentTTSAudio.pause();
      this.currentTTSAudio.currentTime = 0;
      this.currentTTSAudio = null;
    }

    // For simulation, we can use the browser's SpeechSynthesis API if available,
    // or just simulate a delay and return a dummy audio element.
    // Using SpeechSynthesis for a slightly more interactive demo:
    return new Promise((resolve, reject) => {
      if ('speechSynthesis' in window) {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          // Basic voice profile mapping (very simplified)
          const voices = window.speechSynthesis.getVoices();
          let selectedVoice = voices[0]; // Default voice

          if (voiceProfile === VoiceProfile.GruffMale) {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes('male') && (v.lang.startsWith('en'))) || selectedVoice;
          } else if (voiceProfile === VoiceProfile.CalmFemale) {
            selectedVoice = voices.find(v => v.name.toLowerCase().includes('female') && (v.lang.startsWith('en'))) || selectedVoice;
          } else if (voiceProfile === VoiceProfile.Robotic) {
             // Hard to find a truly robotic one, might need specific voice names or external library
             utterance.pitch = 0.5;
             utterance.rate = 0.8;
          }
          
          if (selectedVoice) utterance.voice = selectedVoice;

          // Create a dummy HTMLAudioElement to satisfy the return type and control via AudioOrchestrator
          const audio = new Audio(); 
          
          utterance.onstart = () => {
            console.log("[AudioService] TTS playback started (simulated via SpeechSynthesis).");
          };
          utterance.onend = () => {
            console.log("[AudioService] TTS playback finished (simulated via SpeechSynthesis).");
            // Manually trigger 'ended' on the dummy audio element
            const event = new Event('ended');
            audio.dispatchEvent(event);
          };
          utterance.onerror = (event) => {
            console.error("[AudioService] SpeechSynthesis Error:", event);
            reject(event.error);
             const errorEvent = new Event('error');
            audio.dispatchEvent(errorEvent);
          };
          
          window.speechSynthesis.speak(utterance);
          this.currentTTSAudio = audio; // Track this for potential interruption
          resolve(audio); // Resolve with the dummy audio element

        } catch (e) {
            console.error("SpeechSynthesis API error:", e);
            reject(e);
        }
      } else {
        console.warn("[AudioService] SpeechSynthesis API not available. Simulating TTS with delay only.");
        // Fallback: Simulate delay and resolve with a dummy audio element
        setTimeout(() => {
          const audio = new Audio(); // Dummy audio element
          // Manually dispatch 'ended' after a delay to simulate playback
          setTimeout(() => {
            const event = new Event('ended');
            audio.dispatchEvent(event);
          }, text.length * 50); // Rough delay based on text length
          resolve(audio);
        }, 500);
      }
    });
  }

  stopAllTTS(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (this.currentTTSAudio) {
      this.currentTTSAudio.pause();
      this.currentTTSAudio = null;
    }
    console.log("[AudioService] All TTS stopped.");
  }
}

// Ensure voices are loaded for SpeechSynthesis
if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    // console.log("Voices loaded:", window.speechSynthesis.getVoices().map(v => v.name));
  };
}


export const audioService = new AudioService();
    