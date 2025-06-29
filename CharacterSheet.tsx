
import React from 'react';
import { Character, StatName } from './types';
import ImageViewer from './components/ImageViewer';
import ScrollableArea from './components/ui/ScrollableArea';

interface CharacterSheetProps {
  character: Character;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character }) => {
  const getStatIcon = (statName: StatName) => {
    switch (statName) {
      case StatName.Strength:
        return '💪';
      case StatName.Intellect:
        return '🧠';
      case StatName.Power:
        return '⚡';
      default:
        return '⭐';
    }
  };

  const getStatColor = (value: number) => {
    if (value >= 8) return 'text-green-400';
    if (value >= 6) return 'text-yellow-400';
    if (value >= 4) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4">
      {/* Character Portrait */}
      {character.portraitUrl && (
        <div className="comic-panel p-3">
          <div className="text-center mb-2">
            <span className="font-bangers text-lg bg-yellow-300 border-2 border-black px-2 py-1 text-black">
              HERO PORTRAIT
            </span>
          </div>
          <ImageViewer 
            src={character.portraitUrl} 
            alt={`${character.name} portrait`}
            className="w-full h-32 object-cover border-4 border-black"
          />
        </div>
      )}

      {/* Character Name */}
      <div className="text-center">
        <h2 className="font-bangers text-2xl text-yellow-400 mb-1">
          {character.name.toUpperCase()}
        </h2>
        <div className="bg-blue-500 border-3 border-black p-2 transform -rotate-1 inline-block">
          <p className="font-comic text-white font-bold text-sm">
            {character.concept}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="comic-panel p-4">
        <div className="text-center mb-3">
          <span className="font-bangers text-lg bg-red-400 border-2 border-black px-2 py-1 text-white">
            POWER LEVELS
          </span>
        </div>
        
        <div className="space-y-3">
          {Object.entries(character.stats).map(([statName, value]) => (
            <div key={statName} className="bg-white border-3 border-black p-3 transform hover:rotate-1 transition-transform">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getStatIcon(statName as StatName)}</span>
                  <span className="font-comic font-bold text-black">{statName}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`font-bangers text-2xl ${getStatColor(value)}`}>
                    {value}
                  </span>
                  <div className="flex space-x-1">
                    {[...Array(10)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-2 h-4 border border-black ${
                          i < value ? 'bg-yellow-400' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Origin Story */}
      <div className="comic-panel p-4">
        <div className="text-center mb-3">
          <span className="font-bangers text-lg bg-green-400 border-2 border-black px-2 py-1 text-black">
            ORIGIN STORY
          </span>
        </div>
        <ScrollableArea className="max-h-32">
          <div className="speech-bubble">
            <p className="font-comic text-black text-sm leading-relaxed">
              {character.originStory}
            </p>
          </div>
        </ScrollableArea>
      </div>

      {/* Health/Status (if available) */}
      {character.health !== undefined && (
        <div className="comic-panel p-4">
          <div className="text-center mb-3">
            <span className="font-bangers text-lg bg-red-500 border-2 border-black px-2 py-1 text-white">
              HEALTH STATUS
            </span>
          </div>
          <div className="bg-white border-3 border-black p-3">
            <div className="flex items-center justify-between">
              <span className="font-comic font-bold text-black">❤️ Health</span>
              <span className="font-bangers text-2xl text-red-600">
                {character.health}/100
              </span>
            </div>
            <div className="mt-2 bg-gray-300 border-2 border-black h-4 relative">
              <div 
                className="bg-red-500 h-full border-r-2 border-black transition-all duration-300"
                style={{ width: `${character.health || 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CharacterSheet;
