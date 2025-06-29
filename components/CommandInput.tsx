
import React, { useState } from 'react';

interface CommandInputProps {
  onSubmit: (command: string) => void;
  disabled?: boolean;
}

const CommandInput: React.FC<CommandInputProps> = ({ onSubmit, disabled = false }) => {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !disabled) {
      onSubmit(command.trim());
      setCommand('');
    }
  };

  const quickActions = [
    { text: "Look around", icon: "👀" },
    { text: "Attack!", icon: "⚔️" },
    { text: "Talk to someone", icon: "💬" },
    { text: "Use magic", icon: "✨" },
    { text: "Search for items", icon: "🔍" },
    { text: "Rest", icon: "😴" }
  ];

  return (
    <div className="space-y-4">
      {/* Quick Action Buttons */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {quickActions.map((action, index) => (
          <button
            key={index}
            onClick={() => {
              setCommand(action.text);
              onSubmit(action.text);
            }}
            disabled={disabled}
            className="comic-button-secondary p-3 text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <span>{action.icon}</span>
            <span className="font-comic">{action.text}</span>
          </button>
        ))}
      </div>

      {/* Main Command Input */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="comic-panel p-4">
          <label className="block mb-2">
            <span className="font-bangers text-xl text-purple-600">
              WHAT DO YOU DO?
            </span>
          </label>
          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Describe your action... (e.g., 'I cast a fireball at the dragon!')"
            disabled={disabled}
            className="w-full p-4 border-4 border-black font-comic text-lg bg-white resize-none focus:outline-none focus:ring-4 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
        </div>
        
        <button
          type="submit"
          disabled={disabled || !command.trim()}
          className="comic-button w-full py-4 px-6 text-black font-bold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {disabled ? (
            <span className="flex items-center justify-center space-x-2">
              <span>🌀</span>
              <span>PROCESSING...</span>
              <span>🌀</span>
            </span>
          ) : (
            <span className="flex items-center justify-center space-x-2">
              <span>🚀</span>
              <span>TAKE ACTION!</span>
              <span>🚀</span>
            </span>
          )}
        </button>
      </form>
    </div>
  );
};

export default CommandInput;
