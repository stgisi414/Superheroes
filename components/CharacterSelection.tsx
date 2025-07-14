
import React, { useState, useEffect } from 'react';
import { Character } from '../types';
import { firebaseService } from '../services/firebaseService';
import { User } from 'firebase/auth';
import { logger, LogCategory } from '../services/logger';

interface CharacterSelectionProps {
  user: User;
  onCharacterSelected: (character: Character) => void;
  onNewCharacter: () => void;
  onSignOut: () => void;
}

const CharacterSelection: React.FC<CharacterSelectionProps> = ({ 
  user, 
  onCharacterSelected, 
  onNewCharacter,
  onSignOut 
}) => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCharacters = async () => {
      try {
        setLoading(true);
        const userCharacters = await firebaseService.getUserCharacters(user.uid);
        setCharacters(userCharacters);
        logger.info(LogCategory.CHARACTER, 'Characters loaded', { count: userCharacters.length });
      } catch (err) {
        setError('Failed to load characters');
        logger.error(LogCategory.CHARACTER, 'Failed to load characters', err);
      } finally {
        setLoading(false);
      }
    };

    loadCharacters();
  }, [user.uid]);

  const handleDeleteCharacter = async (characterId: string) => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      try {
        await firebaseService.deleteCharacter(characterId);
        setCharacters(characters.filter(char => char.id !== characterId));
        logger.info(LogCategory.CHARACTER, 'Character deleted', { characterId });
      } catch (err) {
        setError('Failed to delete character');
        logger.error(LogCategory.CHARACTER, 'Failed to delete character', err);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 halftone-bg flex items-center justify-center">
        <div className="comic-panel-dark p-8">
          <h1 className="font-bangers text-4xl text-white mb-4">Loading Characters...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 halftone-bg p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="font-bangers text-6xl pow-text mb-4">
            CHOOSE YOUR HERO!
          </h1>
          <div className="flex justify-between items-center mb-4">
            <div className="bg-yellow-300 border-4 border-black inline-block p-3 transform -rotate-1">
              <span className="font-comic text-black font-bold text-xl">
                Welcome, {user.displayName}!
              </span>
            </div>
            <button
              onClick={onSignOut}
              className="comic-button-secondary px-4 py-2 text-white font-bold"
            >
              Sign Out
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500 border-4 border-black p-4 mb-4 text-white font-bold text-center">
            {error}
          </div>
        )}

        {/* Character Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {characters.map((character) => (
            <div key={character.id} className="comic-panel p-6 bg-white">
              <div className="text-center mb-4">
                <img
                  src={character.portraitUrl}
                  alt={character.name}
                  className="w-32 h-40 mx-auto object-cover border-4 border-black mb-2"
                />
                <h3 className="font-bangers text-2xl text-black">{character.name}</h3>
                <p className="font-comic text-gray-600">{character.concept}</p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => onCharacterSelected(character)}
                  className="comic-button w-full py-2 text-black font-bold"
                >
                  Play as {character.name}
                </button>
                <button
                  onClick={() => handleDeleteCharacter(character.id)}
                  className="comic-button-secondary w-full py-2 text-white font-bold"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}

          {/* New Character Slot */}
          {characters.length < 3 && (
            <div className="comic-panel p-6 bg-gray-200 border-dashed border-4 border-gray-400">
              <div className="text-center h-full flex flex-col justify-center">
                <div className="text-6xl mb-4">➕</div>
                <button
                  onClick={() => {
                    console.log('Create New Hero button clicked');
                    onNewCharacter();
                  }}
                  className="comic-button py-3 text-black font-bold"
                  style={{ 
                    cursor: 'pointer', 
                    pointerEvents: 'auto',
                    backgroundColor: '#fbbf24',
                    border: '2px solid #000',
                    padding: '12px 24px'
                  }}
                >
                  Create New Hero
                </button>
                <p className="font-comic text-gray-600 mt-2">
                  Slot {characters.length + 1} of 3
                </p>
              </div>
            </div>
          )}
        </div>

        {characters.length === 3 && (
          <div className="text-center">
            <div className="bg-yellow-300 border-4 border-black inline-block p-4">
              <span className="font-comic text-black font-bold">
                Maximum characters reached! Delete a character to create a new one.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CharacterSelection;
