
import React, { useState, useEffect } from 'react';
import { bgmService } from '../services/bgmService';

const BGMControl: React.FC = () => {
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);

  useEffect(() => {
    setIsMuted(bgmService.isMutedState());
    setVolume(bgmService.getVolume());
  }, []);

  const handleToggleMute = async () => {
    await bgmService.toggleMute();
    setIsMuted(bgmService.isMutedState());
  };

  const handleVolumeChange = (newVolume: number) => {
    bgmService.setVolume(newVolume);
    setVolume(newVolume);
  };

  return (
    <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-80 rounded-lg p-3 border-2 border-yellow-400 backdrop-blur-sm">
      <div className="flex items-center space-x-3">
        {/* Mute/Unmute Button */}
        <button
          onClick={handleToggleMute}
          className="flex items-center justify-center w-10 h-10 bg-yellow-400 hover:bg-yellow-500 rounded-full transition-colors border-2 border-black"
          title={isMuted ? 'Unmute BGM' : 'Mute BGM'}
        >
          <span className="text-black font-bold text-lg">
            {isMuted ? '🔇' : '🎵'}
          </span>
        </button>

        {/* Volume Slider */}
        <div className="flex items-center space-x-2">
          <span className="text-yellow-400 text-sm font-bold">BGM</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-16 h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
            title={`Volume: ${Math.round(volume * 100)}%`}
          />
          <span className="text-yellow-400 text-xs font-mono w-8">
            {Math.round(volume * 100)}%
          </span>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fbbf24;
          border: 2px solid #000;
          cursor: pointer;
        }
        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #fbbf24;
          border: 2px solid #000;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default BGMControl;
