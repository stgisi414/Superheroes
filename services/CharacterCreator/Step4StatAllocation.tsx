import React, { useState, useEffect, useCallback } from 'react';
import { CharacterStats, StatName } from '../../types';
import { INITIAL_STAT_POINTS, MIN_STAT_VALUE, MAX_STAT_VALUE } from '../../constants';
import Button from '../../components/ui/Button';

interface Step4StatAllocationProps {
  currentStats: CharacterStats;
  onConfirm: (stats: CharacterStats) => void;
}

const StatInput: React.FC<{
  label: StatName;
  value: number;
  onChange: (value: number) => void;
  canIncrease: boolean;
  canDecrease: boolean;
}> = ({ label, value, onChange, canIncrease, canDecrease }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-700 rounded-md">
      <label className="text-lg text-slate-200">{label}:</label>
      <div className="flex items-center space-x-3">
        <Button
          type="button"
          onClick={() => onChange(value - 1)}
          disabled={!canDecrease}
          className="px-3 py-1 !text-xl bg-slate-600 hover:bg-slate-500"
          aria-label={`Decrease ${label}`}
        >
          -
        </Button>
        <span className="text-xl font-bold text-cyan-400 w-8 text-center">{value}</span>
        <Button
          type="button"
          onClick={() => onChange(value + 1)}
          disabled={!canIncrease}
          className="px-3 py-1 !text-xl bg-slate-600 hover:bg-slate-500"
          aria-label={`Increase ${label}`}
        >
          +
        </Button>
      </div>
    </div>
  );
};


const Step4StatAllocation: React.FC<Step4StatAllocationProps> = ({ currentStats, onConfirm }) => {
  const [stats, setStats] = useState<CharacterStats>(currentStats);
  const [pointsRemaining, setPointsRemaining] = useState<number>(INITIAL_STAT_POINTS);

  const calculatePointsUsed = useCallback((currentStatsToCalc: CharacterStats) => {
    return Object.values(currentStatsToCalc).reduce((sum, val) => sum + (val - MIN_STAT_VALUE), 0);
  }, []);

  useEffect(() => {
    setPointsRemaining(INITIAL_STAT_POINTS - calculatePointsUsed(stats));
  }, [stats, calculatePointsUsed]);

  const handleStatChange = (statName: StatName, newValue: number) => {
    const newStats = { ...stats, [statName]: newValue };
    const pointsUsed = calculatePointsUsed(newStats);

    if (pointsUsed <= INITIAL_STAT_POINTS && newValue >= MIN_STAT_VALUE && newValue <= MAX_STAT_VALUE) {
      setStats(newStats);
    }
  };

  const statEntries = Object.entries(stats) as [StatName, number][];

  return (
    <div className="space-y-6">
      <div className="text-center p-3 bg-cyan-700 rounded-md">
        <p className="text-xl font-semibold text-white">
          Points Remaining: <span className="font-orbitron">{pointsRemaining}</span> / {INITIAL_STAT_POINTS}
        </p>
        <p className="text-xs text-cyan-200">(Each stat starts at {MIN_STAT_VALUE}. Max {MAX_STAT_VALUE} per stat.)</p>
      </div>

      <div className="space-y-4">
        {statEntries.map(([statName, value]) => (
          <StatInput
            key={statName}
            label={statName}
            value={value}
            onChange={(newValue) => handleStatChange(statName, newValue)}
            canIncrease={pointsRemaining > 0 && value < MAX_STAT_VALUE}
            canDecrease={value > MIN_STAT_VALUE}
          />
        ))}
      </div>
      
      <Button 
        onClick={() => onConfirm(stats)} 
        disabled={pointsRemaining < 0} // Should ideally not happen with logic
        fullWidth
      >
        Complete Character
      </Button>
      {pointsRemaining < 0 && <p className="text-red-400 text-center mt-2">You have overallocated points!</p>}
    </div>
  );
};

export default Step4StatAllocation;