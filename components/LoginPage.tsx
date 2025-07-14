
import React, { useState } from 'react';
import { firebaseService } from '../services/firebaseService';
import { logger, LogCategory } from '../services/logger';

interface LoginPageProps {
  onLogin: () => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await firebaseService.signInWithGoogle();
      logger.info(LogCategory.AUTH, 'User signed in successfully');
      onLogin();
    } catch (err) {
      setError('Failed to sign in. Please try again.');
      logger.error(LogCategory.AUTH, 'Sign in failed', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 halftone-bg flex items-center justify-center p-4">
      <div className="comic-panel-dark p-8 max-w-md w-full text-center">
        <h1 className="font-bangers text-6xl pow-text mb-8">
          SUPERHERO RPG
        </h1>
        
        <div className="space-y-6">
          <p className="font-comic text-white text-lg">
            Sign in to create and manage your heroes!
          </p>

          {error && (
            <div className="bg-red-500 border-4 border-black p-4 text-white font-bold">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="comic-button w-full py-4 text-black font-bold text-xl disabled:opacity-50"
          >
            {loading ? 'Signing In...' : 'Sign In with Google'}
          </button>
        </div>

        <div className="mt-8 text-sm text-gray-300 font-comic">
          <p>• Create up to 3 characters per account</p>
          <p>• Your progress is automatically saved</p>
          <p>• Continue your adventures anywhere</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
