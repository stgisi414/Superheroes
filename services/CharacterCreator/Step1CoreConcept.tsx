
import React, { useState } from 'react';
import Button from '../../components/ui/Button'; // Corrected path

interface Step1CoreConceptProps {
  onSubmit: (name: string, concept: string) => void;
}

const Step1CoreConcept: React.FC<Step1CoreConceptProps> = ({ 
  onSubmit 
}) => {
  const [name, setName] = useState('');
  const [concept, setConcept] = useState('');
  const [error, setError] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Name cannot be empty.');
      return;
    }
    if (!concept.trim()) {
      setError('Concept cannot be empty.');
      return;
    }
    setError('');
    onSubmit(name.trim(), concept.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="characterName" className="block text-sm font-medium text-slate-300 mb-1">
          Character Name
        </label>
        <input
          type="text"
          id="characterName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Captain Comet, Dr. Malevolence"
          className="w-full p-3 bg-slate-700 text-slate-100 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
        />
      </div>
      <div>
        <label htmlFor="characterConcept" className="block text-sm font-medium text-slate-300 mb-1">
          High-Level Concept
        </label>
        <textarea
          id="characterConcept"
          value={concept}
          onChange={(e) => setConcept(e.target.value)}
          rows={4}
          placeholder="e.g., A tech-based hero who controls electricity, a mysterious shadowmancer villain, an ancient guardian of nature."
          className="w-full p-3 bg-slate-700 text-slate-100 rounded-md focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none resize-none scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-700"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button type="submit" fullWidth>
        Next: Forge Origin
      </Button>
    </form>
  );
};

export default Step1CoreConcept;