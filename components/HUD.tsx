import React, { useMemo, useState, useEffect } from 'react';
import { SensorData, FaultMode, MODES } from '../types';

interface HUDProps {
  data: SensorData;
  mode: FaultMode;
}

// 优化：使用React.memo防止不必要的重渲染
const TelemetryItem: React.FC<{ label: string; value: string; unit: string; alert?: boolean }> = React.memo(({ label, value, unit, alert }) => (
  <div className={`bg-slate-900/50 border-l-2 ${alert ? 'border-red-500 bg-red-950/20' : 'border-cyan-500/50'} px-3 py-2 backdrop-blur-sm transition-colors duration-500`}>
    <div className="text-[8px] text-cyan-400/80 font-bold tracking-wider mb-0.5">{label}</div>
    <div className="flex items-baseline gap-1">
      <span className="text-xl font-mono font-bold text-white tabular-nums">{value}</span>
      <span className="text-[10px] text-slate-500">{unit}</span>
    </div>
  </div>
));

// 性能监控组件 - 更紧凑
const PerformanceMonitor: React.FC = React.memo(() => {
  const [fps, setFps] = useState(60);
  const [memory, setMemory] = useState(0);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    
    const updateMetrics = () => {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        setFps(Math.round(frameCount * 1000 / (now - lastTime)));
        frameCount = 0;
        lastTime = now;
        
        // 获取内存使用
        if ((performance as any).memory) {
          setMemory(Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024));
        }
      }
      requestAnimationFrame(updateMetrics);
    };
    
    const animationId = requestAnimationFrame(updateMetrics);
    return () => cancelAnimationFrame(animationId);
  }, []);
  
  return (
    <div className="bg-slate-900/60 backdrop-blur-sm border border-cyan-500/20 px-3 py-2 text-right">
      <div className="flex gap-3 text-xs font-mono justify-end">
        <div>
          <span className="text-white font-bold">{fps}</span>
          <span className="text-cyan-500/70 ml-1 text-[10px]">帧</span>
        </div>
        <div>
          <span className="text-white font-bold">{memory || '--'}M</span>
          <span className="text-cyan-500/70 ml-1 text-[10px]">内存</span>
        </div>
      </div>
    </div>
  );
});

const HUD: React.FC<HUDProps> = ({ data, mode }) => {
  const currentMode = useMemo(() => MODES.find(m => m.id === mode), [mode]);
  const isAlert = useMemo(() => data.temp > 80 || (mode === FaultMode.XLPE_TREEING), [data.temp, mode]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // 优化：缓存时间戳更新，每秒更新一次
  const timestamp = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('zh-CN', { hour12: false });
  }, [Math.floor(Date.now() / 1000)]);

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-10">
      {/* 顶部仪表盘 - 更紧凑 */}
      <div className="flex justify-between items-start gap-4">
        {/* 左上角标题 */}
        <div className="bg-black/60 px-4 py-3 border-l-2 border-cyan-500 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-1">
            <div className={`w-2 h-2 rounded-full ${isAlert ? 'bg-red-500 animate-ping' : 'bg-cyan-500'}`} />
            <h1 className="text-white text-xl font-bold tracking-tight">电缆接头监测终端</h1>
          </div>
          <div className="text-[9px] text-slate-500 font-mono">
            节点: 09 / 变电站: 高压站 / 通信: 安全链路
          </div>
        </div>

        {/* 右上角数据面板 - 可折叠 */}
        <div className="flex flex-col items-end gap-2">
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="pointer-events-auto text-[9px] text-cyan-500/50 hover:text-cyan-400 transition-colors"
          >
            {isCollapsed ? '◀ 展开' : '▶ 收起'}
          </button>
          
          {!isCollapsed && (
            <>
              <PerformanceMonitor />
              <div className="grid grid-cols-2 gap-2">
                <TelemetryItem label="接头温度" value={data.temp.toFixed(1)} unit="°C" alert={data.temp > 80} />
                <TelemetryItem label="负载电流" value={data.current.toFixed(1)} unit="A" />
                <TelemetryItem label="电网电压" value={data.voltage.toFixed(1)} unit="kV" />
                <TelemetryItem label="相位角" value="120.0" unit="°" />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 底部状态栏 - 更简洁 */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-2">
          {/* 当前模式显示 */}
          <div className="bg-cyan-900/20 border-t border-cyan-500/50 px-4 py-3 backdrop-blur-sm">
            <div className="text-cyan-400/70 text-[9px] font-bold tracking-wider mb-1">当前诊断模式</div>
            <div className="text-white text-2xl font-bold flex items-center gap-3">
              <span className="text-3xl">{currentMode?.icon}</span>
              {currentMode?.name}
            </div>
          </div>
          {/* 系统状态 */}
          <div className="flex gap-2 text-[8px] text-white/40 font-mono">
            <span>存储: 94%</span>
            <span>·</span>
            <span>运行: 1,428小时</span>
          </div>
        </div>
        
        {/* 右下角时间戳 */}
        <div className="text-right text-[9px] text-slate-600 font-mono">
          <div>{timestamp}</div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
