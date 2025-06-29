
import React from 'react';

interface LandingPageProps {
  onStartNewGame: () => void;
  onLoadGame: () => void;
  hasSavedGame: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartNewGame, onLoadGame, hasSavedGame }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 halftone-bg">
      <div className="comic-panel w-full max-w-2xl p-8 text-center animate-comic-pop">
        <div className="mb-8">
          <h1 className="font-bangers text-6xl mb-4 pow-text transform -rotate-2">
            COMIC RPG
          </h1>
          <h2 className="font-bangers text-4xl text-blue-600 transform rotate-1">
            ADVENTURE!
          </h2>
          <div className="mt-4 p-4 bg-yellow-300 border-4 border-black transform -rotate-1 inline-block">
            <p className="font-comic text-black text-lg font-bold">
              ⚡ POWERED BY AI ⚡
            </p>
          </div>
        </div>

        <div className="speech-bubble mb-6">
          <p className="font-comic text-black text-lg font-bold">
            "Ready to embark on an epic adventure? Create your hero and dive into a world 
            of endless possibilities!"
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onStartNewGame}
            className="comic-button w-full py-4 px-6 text-black font-bold shadow-lg hover:shadow-xl transition-all"
          >
            🌟 START NEW ADVENTURE! 🌟
          </button>
          
          {hasSavedGame && (
            <button
              onClick={onLoadGame}
              className="comic-button-secondary w-full py-4 px-6 text-white font-bold shadow-lg hover:shadow-xl transition-all"
            >
              📖 CONTINUE STORY 📖
            </button>
          )}
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <div className="bg-red-500 border-4 border-black p-2 transform rotate-3">
            <span className="font-bangers text-white text-xl">POW!</span>
          </div>
          <div className="bg-yellow-400 border-4 border-black p-2 transform -rotate-2">
            <span className="font-bangers text-black text-xl">BAM!</span>
          </div>
          <div className="bg-blue-500 border-4 border-black p-2 transform rotate-1">
            <span className="font-bangers text-white text-xl">ZAP!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
