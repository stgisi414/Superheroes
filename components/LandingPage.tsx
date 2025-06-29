// components/LandingPage.tsx

import React from 'react';

interface LandingPageProps {
  onStartNewGame: () => void;
  onLoadGame: () => void;
  hasSavedGame: boolean;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStartNewGame, onLoadGame, hasSavedGame }) => {
  return (
    <div style={{ 
      backgroundColor: '#2c3e50', 
      color: 'white', 
      height: '100vh', 
      display: 'flex', 
      flexDirection: 'column',
      alignItems: 'center', 
      justifyContent: 'center',
      fontFamily: '"Courier New", Courier, monospace'
    }}>
      <h1 style={{ fontSize: '4rem', textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff' }}>Superheroes</h1>
      <p style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>An AI-powered text-based adventure</p>
      <div style={{
        width: '50%',
        height: '300px',
        border: '2px solid #00ffff',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <p>[ Placeholder for Imgen4-generated graphic ]</p>
      </div>
      <button 
        onClick={onStartNewGame}
        style={{
          backgroundColor: '#00ffff',
          color: '#2c3e50',
          border: 'none',
          padding: '1rem 2rem',
          fontSize: '1.5rem',
          cursor: 'pointer',
          marginBottom: '1rem'
        }}
      >
        Start New Game
      </button>
      {hasSavedGame && (
        <button 
          onClick={onLoadGame}
          style={{
            backgroundColor: 'transparent',
            color: '#00ffff',
            border: '2px solid #00ffff',
            padding: '1rem 2rem',
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          Load Saved Game
        </button>
      )}
    </div>
  );
};

export default LandingPage;
