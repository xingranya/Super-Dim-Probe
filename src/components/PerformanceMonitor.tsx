import React, { useEffect, useState, useRef } from 'react';

interface PerformanceMonitorProps {
  enabled?: boolean;
}

/**
 * 性能监控组件 - 实时显示FPS和内存使用情况
 * 仅在开发模式下显示
 */
const PerformanceMonitor: React.FC<PerformanceMonitorProps> = ({ enabled = true }) => {
  const [fps, setFps] = useState(60);
  const [memory, setMemory] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());

  useEffect(() => {
    if (!enabled) return;

    let animationId: number;

    const measurePerformance = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTimeRef.current;

      frameCountRef.current++;

      // 每秒更新一次FPS
      if (deltaTime >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / deltaTime);
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTimeRef.current = currentTime;

        // 获取内存使用情况（仅Chrome支持）
        try {
          const perfMemory = (performance as any).memory;
          if (perfMemory && perfMemory.usedJSHeapSize) {
            const usedMB = Math.round(perfMemory.usedJSHeapSize / 1048576);
            setMemory(usedMB);
          }
        } catch (e) {
          // 浏览器不支持memory API
        }
      }

      animationId = requestAnimationFrame(measurePerformance);
    };

    animationId = requestAnimationFrame(measurePerformance);

    return () => cancelAnimationFrame(animationId);
  }, [enabled]);

  if (!enabled) return null;

  const fpsColor = fps >= 55 ? '#00ff00' : fps >= 30 ? '#ffaa00' : '#ff3333';
  const memoryColor = memory < 150 ? '#00ff00' : memory < 250 ? '#ffaa00' : '#ff3333';

  return (
    <div className="fixed top-4 right-4 bg-black/90 border border-cyan-500/30 p-3 rounded-lg backdrop-blur-md z-50 font-mono text-xs">
      <div className="text-cyan-400 font-bold mb-2 uppercase tracking-wider">Performance</div>
      
      <div className="flex items-center gap-2 mb-1">
        <span className="text-gray-400 w-12">FPS:</span>
        <div className="flex-1 bg-gray-800 h-4 rounded overflow-hidden">
          <div 
            className="h-full transition-all duration-300" 
            style={{ 
              width: `${Math.min((fps / 60) * 100, 100)}%`,
              backgroundColor: fpsColor
            }}
          />
        </div>
        <span className="text-white font-bold w-8 text-right" style={{ color: fpsColor }}>
          {fps}
        </span>
      </div>

      {memory > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-gray-400 w-12">MEM:</span>
          <div className="flex-1 bg-gray-800 h-4 rounded overflow-hidden">
            <div 
              className="h-full transition-all duration-300" 
              style={{ 
                width: `${Math.min((memory / 300) * 100, 100)}%`,
                backgroundColor: memoryColor
              }}
            />
          </div>
          <span className="text-white font-bold w-8 text-right text-[10px]" style={{ color: memoryColor }}>
            {memory}M
          </span>
        </div>
      )}

      <div className="mt-2 pt-2 border-t border-gray-700 text-[9px] text-gray-500">
        {fps >= 55 ? '✓ Optimal' : fps >= 30 ? '⚠ Degraded' : '✗ Critical'}
      </div>
    </div>
  );
};

export default PerformanceMonitor;
