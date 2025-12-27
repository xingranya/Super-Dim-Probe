import React from 'react';
import { FaultMode, MODES } from '../types';

interface ControlsProps {
  currentMode: FaultMode;
  isScanning: boolean;
  onModeChange: (mode: FaultMode) => void;
  onToggleScan: () => void;
  onAnalyze: () => void;
  isAiLoading: boolean;
}

export const ModeSelector: React.FC<{ currentMode: FaultMode; onModeChange: (m: FaultMode) => void }> = ({ currentMode, onModeChange }) => {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 bg-[#0c1018]/95 p-2.5 rounded border border-white/10 shadow-2xl z-10 pointer-events-auto backdrop-blur-sm">
      {MODES.map((mode) => (
        <button
          key={mode.id}
          onClick={() => onModeChange(mode.id)}
          className={`
            flex flex-col items-center justify-center min-w-[80px] py-2 px-4 rounded border transition-all duration-200
            ${currentMode === mode.id 
              ? 'bg-blue-500/15 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(31,111,235,0.15)]' 
              : 'bg-transparent border-[#30363d] text-gray-500 hover:bg-white/5 hover:text-white hover:border-gray-400'
            }
          `}
        >
          <span className="text-lg mb-1 block">{mode.icon}</span>
          <span className="text-xs font-semibold whitespace-nowrap">{mode.name}</span>
        </button>
      ))}
    </div>
  );
};

export const ActionButtons: React.FC<Omit<ControlsProps, 'currentMode' | 'onModeChange'>> = ({ isScanning, onToggleScan, onAnalyze, isAiLoading }) => {
  return (
    <div className="absolute bottom-10 right-10 flex gap-3 z-10 pointer-events-auto">
      <button
        onClick={onAnalyze}
        disabled={isAiLoading}
        className={`
          bg-[#6e40c9] border border-[#a371f7] text-white py-2.5 px-5 rounded-sm font-semibold text-sm shadow-lg transition-all duration-200
          hover:bg-[#8957e5] hover:shadow-[0_0_15px_rgba(163,113,247,0.4)] hover:-translate-y-px active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isAiLoading ? 'Analyzing...' : '✨ AI Diagnosis'}
      </button>
      <button
        onClick={onToggleScan}
        className="bg-[#238636] border border-white/10 text-white py-2.5 px-5 rounded-sm font-semibold text-sm shadow-lg transition-all duration-200 hover:bg-[#2ea043] hover:-translate-y-px active:translate-y-0"
      >
        {isScanning ? '⏸ Pause Scan' : '▶ Resume Scan'}
      </button>
    </div>
  );
};
