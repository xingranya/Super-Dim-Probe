import React, { memo, useCallback } from 'react';
import { FaultMode, MODES } from '../types';

interface ControlsProps {
  currentMode: FaultMode;
  onModeChange: (mode: FaultMode) => void;
  onAutoDemo?: (enabled: boolean) => void;
  isAutoDemo?: boolean;  // 从外部接收演示状态（用于演示完成后同步）
}

/**
 * 模式选择器和自动演示控制组件
 * 自适应布局，中文界面
 */
export const ModeSelector: React.FC<ControlsProps> = memo(({ currentMode, onModeChange, onAutoDemo, isAutoDemo = false }) => {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  // 切换自动演示模式
  const toggleAutoDemo = useCallback(() => {
    onAutoDemo?.(!isAutoDemo);
  }, [isAutoDemo, onAutoDemo]);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-20 pointer-events-auto">
      {/* 折叠/展开按钮 */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="text-[10px] text-cyan-500/70 hover:text-cyan-400 font-bold tracking-wider transition-colors"
      >
        {isCollapsed ? '▼ 展开控制面板' : '▲ 收起'}
      </button>

      {!isCollapsed && (
        <>
          {/* 自动演示按钮 */}
          <button
            onClick={toggleAutoDemo}
            className={`
              px-4 py-2 rounded-lg text-sm font-bold transition-all
              ${isAutoDemo 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 animate-pulse' 
                : 'bg-slate-800/80 text-slate-400 border border-slate-600/30 hover:text-white hover:border-cyan-500/50'
              }
            `}
          >
            {isAutoDemo ? '⏸ 停止演示' : '▶ 自动演示'}
          </button>

          {/* 故障模式选择 */}
          <div className="text-[9px] text-cyan-500/50 font-bold tracking-wider">故障模式选择</div>
          <div className="flex flex-wrap justify-center gap-1 bg-black/70 p-2 border border-white/5 backdrop-blur-md rounded-lg max-w-[90vw]">
            {MODES.map((mode) => (
              <button
                key={mode.id}
                onClick={() => onModeChange(mode.id)}
                className={`
                  flex flex-col items-center justify-center min-w-[70px] py-2 px-3 rounded transition-all
                  ${currentMode === mode.id 
                    ? 'bg-cyan-600/20 text-white border-cyan-500/50 border' 
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                  }
                `}
              >
                <span className="text-lg">{mode.icon}</span>
                <span className="text-[9px] font-bold text-center leading-tight mt-1">{mode.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
});