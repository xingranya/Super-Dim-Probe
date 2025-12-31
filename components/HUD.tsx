import React, { useMemo, useState, useEffect } from 'react';
import { SensorData, FaultMode, MODES } from '../types';

interface HUDProps {
  data: SensorData;
  mode: FaultMode;
}

// 优化：使用React.memo防止不必要的重渲染
const TelemetryItem: React.FC<{ label: string; value: string; unit: string; alert?: boolean }> = React.memo(({ label, value, unit, alert }) => (
  <div className={`bg-slate-900/60 border-r-2 ${alert ? 'border-red-500 bg-red-950/20' : 'border-cyan-500'} p-4 backdrop-blur-md transition-colors duration-500`}>
    <div className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em] mb-1">{label}</div>
    <div className="flex items-baseline gap-2">
      <span className="text-3xl font-mono font-bold text-white tabular-nums tracking-tighter">{value}</span>
      <span className="text-xs text-slate-500 font-bold">{unit}</span>
    </div>
  </div>
));

// 性能监控组件
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
    <div className="bg-slate-900/80 backdrop-blur-md border border-cyan-500/30 p-4">
      <div className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.2em] mb-2">Performance</div>
      <div className="flex gap-4 text-xs font-mono">
        <div>
          <span className="text-white font-bold">{fps}</span>
          <span className="text-cyan-500 ml-1">FPS</span>
        </div>
        <div>
          <span className="text-white font-bold">{memory || '--'}M</span>
          <span className="text-cyan-500 ml-1">MEM</span>
        </div>
      </div>
      <div className="text-[9px] text-emerald-400 mt-2">✓ Optimal</div>
    </div>
  );
});

const HUD: React.FC<HUDProps> = ({ data, mode }) => {
  const currentMode = useMemo(() => MODES.find(m => m.id === mode), [mode]);
  const isAlert = useMemo(() => data.temp > 80 || (mode === FaultMode.XLPE_TREEING), [data.temp, mode]);
  
  // 优化：缓存时间戳更新，每秒更新一次
  const timestamp = useMemo(() => new Date().toISOString(), [Math.floor(Date.now() / 1000)]);

  return (
    <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between z-10">
      {/* Upper Dashboard */}
      <div className="flex justify-between items-start">
        <div className="bg-black/80 p-6 border-l-4 border-cyan-500 backdrop-blur-xl">
          <div className="flex items-center gap-4 mb-2">
            <div className={`w-3 h-3 rounded-full ${isAlert ? 'bg-red-500 animate-ping' : 'bg-cyan-500'}`} />
            <h1 className="text-white text-3xl font-black tracking-tighter uppercase leading-none">Node-09 Joint Sentry</h1>
          </div>
          <div className="text-[10px] text-slate-400 font-mono tracking-[0.3em] uppercase">
            Station: High-Voltage Sub / Rack: A-12 / Protocol: MQTT-Over-Secure
          </div>
        </div>

        <div className="flex flex-col gap-4 items-end">
          <PerformanceMonitor />
          <div className="grid grid-cols-2 gap-4 w-96">
            <TelemetryItem label="Joint Temperature" value={data.temp.toFixed(1)} unit="°C" alert={data.temp > 80} />
            <TelemetryItem label="Active Load" value={data.current.toFixed(1)} unit="Amps" />
            <TelemetryItem label="Grid Voltage" value={data.voltage.toFixed(1)} unit="kV" />
            <TelemetryItem label="Phase Angle" value="120.0" unit="DEG" />
          </div>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-4">
            <div className="bg-cyan-900/20 border-t-2 border-cyan-500 p-6 backdrop-blur-md max-w-sm">
                <div className="text-cyan-400 text-[10px] font-black uppercase tracking-[0.2em] mb-2">System Diagnostics</div>
                <div className="text-white text-4xl font-black uppercase tracking-tighter flex items-center gap-4">
                    <span className="text-5xl drop-shadow-[0_0_15px_rgba(0,255,255,0.5)]">{currentMode?.icon}</span>
                    {currentMode?.name}
                </div>
            </div>
            <div className="flex gap-4">
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-white/50 font-bold uppercase tracking-widest">Storage: 94%</div>
                <div className="px-3 py-1 bg-white/5 border border-white/10 rounded text-[9px] text-white/50 font-bold uppercase tracking-widest">Uptime: 1,428h</div>
            </div>
        </div>
        
        <div className="text-right">
            <div className="text-[10px] text-slate-600 font-mono uppercase tracking-[0.1em] mb-1">Authenticated Operator: admin_02</div>
            <div className="text-[12px] text-slate-500 font-mono tracking-tighter">TIMESTAMP: {timestamp}</div>
        </div>
      </div>
    </div>
  );
};

export default HUD;
