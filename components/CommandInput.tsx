
import React, { useState } from 'react';
import Button from './ui/Button';

interface CommandInputProps {
  onSendCommand: (command: string) => void;
  isLoading: boolean;
}

const CommandInput: React.FC<CommandInputProps> = ({ onSendCommand, isLoading }) => {
  const [command, setCommand] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (command.trim() && !isLoading) {
      onSendCommand(command.trim());
      setCommand('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-slate-800 border-t border-slate-700">
      <div className="flex items-center space-x-2">
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          placeholder="What do you do next?"
          className="flex-grow p-3 bg-slate-700 text-slate-100 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800"
          rows={2}
          disabled={isLoading}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button type="submit" isLoading={isLoading} disabled={isLoading || !command.trim()} size="lg">
          Send
        </Button>
      </div>
    </form>
  );
};

export default CommandInput;
    