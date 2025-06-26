
import React, { useEffect, useState, useRef } from 'react';
import { MusicMood, VoiceProfile } from '../types';
import { audioService } from '../services/audioService';

interface AudioOrchestratorProps {
  currentMusicMood?: MusicMood;
  ttsQueue: Array<{ text: string; voice: VoiceProfile; id: string }>;
  onTtsPlayed: (id: string) => void;
}

const AudioOrchestrator: React.FC<AudioOrchestratorProps> = ({ currentMusicMood, ttsQueue, onTtsPlayed }) => {
  const [currentPlayingTTS, setCurrentPlayingTTS] = useState<HTMLAudioElement | null>(null);
  const ttsQueueRef = useRef(ttsQueue); // Ref to hold the latest ttsQueue

  useEffect(() => {
    ttsQueueRef.current = ttsQueue;
  }, [ttsQueue]);

  useEffect(() => {
    if (currentMusicMood) {
      audioService.playBackgroundMusic(currentMusicMood);
    }
  }, [currentMusicMood]);

  useEffect(() => {
    const playNextTTS = async () => {
      if (currentPlayingTTS && !currentPlayingTTS.ended) {
        // Already playing something
        return;
      }

      if (ttsQueueRef.current.length > 0) {
        const nextTTS = ttsQueueRef.current[0];
        try {
          // Simulate fetching/playing TTS
          const audio = await audioService.speakText(nextTTS.text, nextTTS.voice);
          setCurrentPlayingTTS(audio);
          audio.play();
          audio.onended = () => {
            onTtsPlayed(nextTTS.id); // Mark as played
            setCurrentPlayingTTS(null); // Clear current
            // No need to call playNextTTS here, effect will re-run if queue changes
          };
        } catch (error) {
          console.error('Error playing TTS:', error);
          onTtsPlayed(nextTTS.id); // Still remove from queue on error
          setCurrentPlayingTTS(null);
        }
      }
    };

    playNextTTS();

    // Cleanup function
    return () => {
      if (currentPlayingTTS) {
        currentPlayingTTS.pause();
        currentPlayingTTS.onended = null; // Remove event listener
        setCurrentPlayingTTS(null);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [ttsQueue, onTtsPlayed]); // currentPlayingTTS is managed internally

  // This component doesn't render anything visible
  return null; 
};

export default AudioOrchestrator;
    