import React from 'react';
import { Character, StatName } from './types';
import ImageViewer from './components/ImageViewer';
import ScrollableArea from './components/ui/ScrollableArea';

interface CharacterSheetProps {
  character: Character;
}

const CharacterSheet: React.FC<CharacterSheetProps> = ({ character }) => {
  return (
    <div className="w-full md:w-80 lg:w-96 bg-slate-800 p-4 shadow-lg h-full flex flex-col">
      <h2 className="text-3xl font-bold mb-4 text-center text-cyan-400 font-orbitron">{character.name}</h2>
      
      <div className="mb-4 mx-auto w-48 h-48 md:w-56 md:h-56">
        <ImageViewer src={character.portraitUrl} alt={`${character.name}'s Portrait`} className="rounded-full overflow-hidden border-4 border-slate-700" />
      </div>

      <ScrollableArea className="flex-grow space-y-4" maxHeight="calc(100% - 200px)">
        <div>
          <h3 className="text-xl font-semibold text-slate-300 mb-1 font-orbitron">Concept</h3>
          <p className="text-sm text-slate-400 italic">{character.concept}</p>
        </div>

        <div>
          <h3 className="text-xl font-semibold text-slate-300 mb-1 font-orbitron">Stats</h3>
          <ul className="space-y-1">
            {Object.values(StatName).map((stat) => (
              <li key={stat} className="flex justify-between items-center bg-slate-700 p-2 rounded">
                <span className="text-slate-200">{stat}:</span>
                <span className="font-bold text-cyan-400 text-lg">{character.stats[stat]}</span>
              </li>
            ))}
          </ul>
        </div>

        {character.abilities.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-slate-300 mb-1 font-orbitron">Abilities</h3>
            <ul className="list-disc list-inside pl-2 space-y-1">
              {character.abilities.map((ability, index) => (
                <li key={index} className="text-sm text-slate-400">{ability}</li>
              ))}
            </ul>
          </div>
        )}

        {character.inventory.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold text-slate-300 mb-1 font-orbitron">Inventory</h3>
            <ul className="list-disc list-inside pl-2 space-y-1">
              {character.inventory.map((item, index) => (
                <li key={index} className="text-sm text-slate-400">{item}</li>
              ))}
            </ul>
          </div>
        )}
         <div>
          <h3 className="text-xl font-semibold text-slate-300 mb-1 font-orbitron">Origin Story</h3>
          <p className="text-sm text-slate-400 story-text-font bg-slate-700 p-3 rounded">{character.originStory}</p>
        </div>
      </ScrollableArea>
    </div>
  );
};

export default CharacterSheet;