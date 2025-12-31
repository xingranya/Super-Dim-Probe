import React, { memo } from 'react';
import { FaultMode, MODES } from '../types';

interface ControlsProps {
  currentMode: FaultMode;
  onModeChange: (mode: FaultMode) => void;
}

// 优化：使用 React.memo 防止不必要的重渲染
export const ModeSelector: React.FC<ControlsProps> = memo(({ currentMode, onModeChange }) => {
  return (
    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 z-10 pointer-events-auto">
      <div className="text-[10px] text-cyan-500/50 font-bold uppercase tracking-[0.3em]">Simulation Scenario Selection</div>
      <div className="flex gap-2 bg-black/80 p-1 border border-white/5 backdrop-blur-md rounded-lg">
        {MODES.map((mode) => (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={`
              flex flex-col items-center justify-center min-w-[120px] py-3 px-4 rounded transition-all
              ${currentMode === mode.id 
                ? 'bg-cyan-600/20 text-white border-cyan-500/50 border' 
                : 'text-gray-500 hover:text-gray-300 border border-transparent'
              }
            `}
          >
            <span className="text-xl mb-1">{mode.icon}</span>
            <span className="text-[9px] font-bold uppercase tracking-tight text-center leading-none">{mode.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
});