import React, { useState, useEffect, useRef, useCallback } from 'react';
import ThreeScene from './ThreeScene';
import AnalysisFlowChart from './AnalysisFlowChart';
import ResultPanel from './ResultPanel';
import SignalParticles from './SignalParticles';
import { FaultMode, SensorData } from '../types';

/**
 * 信号流动态演示页面
 * 布局：3D传感器 (22%) | 分析流程图 (50%) | 结果面板 (28%)
 */

interface SignalFlowDemoProps {
  autoPlay?: boolean;
  cycleDuration?: number;
  onExit?: () => void;
}

const SignalFlowDemo: React.FC<SignalFlowDemoProps> = ({
  autoPlay = true,
  cycleDuration = 30,  // 30秒完整动画
  onExit,
}) => {
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(!autoPlay);
  const [sensorData, setSensorData] = useState<SensorData>({
    pd: 0, temp: 25, vib: 0, loss: 0.02, voltage: 110.0, current: 425.0,
  });

  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>(0);
  const progressRef = useRef(progress); // 用于动画循环中跟踪进度

  // 同步 progress 到 ref
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // 更新容器尺寸
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // 动画循环
  useEffect(() => {
    if (isPaused) return;

    let animationFrameId: number;
    let lastTime = performance.now();
    // 从当前进度开始
    let currentProgress = progressRef.current;

    const animate = (currentTime: number) => {
      const dt = currentTime - lastTime;
      lastTime = currentTime;

      const safeDt = Math.min(dt, 100);
      const increment = (safeDt / (cycleDuration * 1000)) * 100;
      
      currentProgress += increment;

      if (currentProgress >= 100) {
        setProgress(100);
        setIsPaused(true);
        return; // 停止动画循环
      }
      
      setProgress(currentProgress);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isPaused, cycleDuration]);

  const handleSensorUpdate = useCallback((data: SensorData) => {
    setSensorData(data);
  }, []);

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onExit) onExit();
      else if (e.key === ' ') { 
        e.preventDefault(); 
        if (progress >= 100) setProgress(0); // 如果已结束，重置进度
        setIsPaused(prev => !prev); 
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onExit, progress]);

  // 计算进度条宽度百分比
  const progressWidth = `${progress}%`;

  return (
    <div ref={containerRef} className="fixed inset-0 z-50 bg-[#020508] overflow-hidden">
      {/* 背景网格 */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: `linear-gradient(rgba(0, 243, 255, 0.1) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(0, 243, 255, 0.1) 1px, transparent 1px)`,
        backgroundSize: '40px 40px',
      }} />

      {/* 顶部标题栏 */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-black/90 to-transparent z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h1 className="text-white text-base font-bold">超维探缆 - 信号处理流程演示</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => {
            if (progress >= 100) setProgress(0); // 如果已结束，重置进度
            setIsPaused(prev => !prev);
          }}
            className="px-3 py-1 bg-slate-800/80 border border-cyan-500/30 rounded text-cyan-400 text-sm hover:bg-slate-700/80">
            {isPaused || progress >= 100 ? '▶ 播放' : '⏸ 暂停'}
          </button>
          {onExit && (
            <button onClick={onExit}
              className="px-3 py-1 bg-slate-800/80 border border-slate-600/30 rounded text-slate-400 text-sm hover:text-white">
              ✕ 退出
            </button>
          )}
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="absolute inset-0 pt-12 pb-10 px-2 flex gap-2">
        {/* 左侧：传感器模型 - 使用静态图片替代3D以确保显示 */}
        <div className="w-[22%] h-full flex flex-col rounded-lg overflow-hidden border border-cyan-500/20 bg-[#0a1628]">
          <div className="bg-slate-900/80 px-3 py-2 border-b border-cyan-500/20">
            <span className="text-cyan-400 text-sm font-bold">传感器阵列</span>
          </div>
          <div className="flex-1 relative">
            {/* 3D传感器场景 - 确保容器有尺寸后再渲染 */}
            {containerSize.width > 0 && (
              <ThreeScene
                currentMode={FaultMode.XLPE_TREEING}
                isScanning={true}
                isAutoDemo={!isPaused}
                onSensorUpdate={handleSensorUpdate}
              />
            )}
          </div>
          {/* 传感器状态指示 */}
          <div className="bg-slate-900/60 px-3 py-2 border-t border-cyan-500/20 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>温度</span>
              <span className="text-cyan-400 font-mono">{sensorData.temp.toFixed(1)}°C</span>
            </div>
            <div className="flex justify-between text-slate-400 mt-1">
              <span>电流</span>
              <span className="text-cyan-400 font-mono">{sensorData.current.toFixed(0)}A</span>
            </div>
          </div>
        </div>

        {/* 中间：分析流程图 */}
        <div className="w-[50%] h-full rounded-lg overflow-hidden border border-cyan-500/20 bg-[#0a1628]">
          <AnalysisFlowChart progress={progress} isPaused={isPaused} />
        </div>

        {/* 右侧：结果面板 */}
        <div className="w-[28%] h-full">
          <ResultPanel progress={progress} isVisible={true} />
        </div>
      </div>

      {/* 信号粒子流 */}
      {containerSize.width > 0 && (
        <div className="absolute inset-0 pt-12 pb-10 px-2 pointer-events-none">
          <SignalParticles
            progress={progress}
            width={containerSize.width - 16}
            height={containerSize.height - 88}
            leftRatio={0.22}
            rightRatio={0.28}
          />
        </div>
      )}

      {/* 底部状态栏 - 统一进度显示 */}
      <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/90 to-black/50 z-20 flex items-center px-4 gap-4">
        {/* 进度条 */}
        <div className="flex-1 h-3 bg-slate-700/80 rounded-full overflow-hidden border border-slate-600/50">
          <div
            className="h-full rounded-full"
            style={{ 
              width: progressWidth,
              background: 'linear-gradient(90deg, #06b6d4, #10b981, #22d3ee)',
              boxShadow: '0 0 10px #06b6d4, 0 0 20px #06b6d480'
            }}
          />
        </div>
        {/* 进度数值 */}
        <span className="text-cyan-300 text-sm font-mono font-bold min-w-[50px]">{progress.toFixed(0)}%</span>
        {/* 时间显示 */}
        <span className="text-slate-400 text-xs font-mono">
          {((progress / 100) * cycleDuration).toFixed(1)}s
        </span>
      </div>
    </div>
  );
};

export default SignalFlowDemo;
