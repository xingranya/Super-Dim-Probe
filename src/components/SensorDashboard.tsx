import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Thermometer, 
  Zap, 
  Volume2,
  Waves,
  ArrowLeft,
  Magnet,
  TrendingUp,
  Layers,
  Cpu
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import CableCrossSection3D from './CableCrossSection3D';
import { 
  VoltageWaveform, 
  MagneticFieldViz, 
  VibrationWaveform, 
  AcousticSpectrum, 
  ThermalGradient 
} from './DynamicCharts';

/**
 * 局部放电频谱条组件 - 使用独立状态避免父组件重渲染导致闪烁
 */
const PDSpectrumBars: React.FC<{ pdValue: number }> = React.memo(({ pdValue }) => {
  const [bars, setBars] = React.useState<number[]>(() => 
    Array.from({ length: 20 }, () => Math.random() * 60 + 20)
  );

  React.useEffect(() => {
    let frameId: number;
    let lastUpdate = 0;
    
    const updateBars = (timestamp: number) => {
      // 每 100ms 更新一次，避免过于频繁
      if (timestamp - lastUpdate > 100) {
        setBars(prev => prev.map((v, i) => {
          // 平滑过渡：基于当前值和目标值的插值
          const target = 20 + Math.random() * 60 * (pdValue / 20);
          return v + (target - v) * 0.3;
        }));
        lastUpdate = timestamp;
      }
      frameId = requestAnimationFrame(updateBars);
    };
    
    frameId = requestAnimationFrame(updateBars);
    return () => cancelAnimationFrame(frameId);
  }, [pdValue]);

  return (
    <div className="flex items-end gap-0.5 w-full h-10">
      {bars.map((height, i) => (
        <div 
          key={i} 
          className="flex-1 bg-purple-500/70 rounded-t-sm"
          style={{ height: `${Math.max(10, height)}%` }}
        />
      ))}
    </div>
  );
});
PDSpectrumBars.displayName = 'PDSpectrumBars';

interface SensorDashboardProps {
  active?: boolean;
  sensorId: string;
  onBack: () => void;
}

const SENSOR_INFO: Record<string, { name: string; location: string; status: string }> = {
  'S1': { name: '西北枢纽', location: '110kV 主环网 西北角', status: 'normal' },
  'S2': { name: '东北枢纽', location: '110kV 主环网 东北角', status: 'normal' },
  'S3': { name: '西南枢纽', location: '110kV 主环网 西南角', status: 'warning' },
  'S4': { name: '东南枢纽', location: '110kV 主环网 东南角', status: 'normal' },
  'S5': { name: '中央配电站', location: '35kV 配电中心', status: 'fault' },
  'S6': { name: '北侧交汇点', location: '35kV线路与110kV环网 北侧交叉', status: 'normal' },
  'S7': { name: '南侧交汇点', location: '35kV线路与110kV环网 南侧交叉', status: 'normal' },
  'S8': { name: '西侧端点', location: '35kV联络线 西端', status: 'normal' },
  'S9': { name: '东侧端点', location: '35kV联络线 东端', status: 'warning' },
  'S10': { name: '西北管沟', location: '低压通信管线 西北拐点', status: 'normal' },
  'S11': { name: '东北管沟', location: '低压通信管线 东北拐点', status: 'normal' },
  'S12': { name: '西南管沟', location: '低压通信管线 西南拐点', status: 'normal' },
  'S13': { name: '东南管沟', location: '低压通信管线 东南拐点', status: 'normal' },
};

// Helper for Glassmorphism Cards (Moved outside to prevent re-creation on render)
const GlassCard = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl ${className}`}>
    {/* 光泽效果 */}
    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    <div className="relative z-10 p-5 h-full flex flex-col">
      {children}
    </div>
  </div>
);

const SensorDashboard: React.FC<SensorDashboardProps> = ({ active = true, sensorId, onBack }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animatedValues, setAnimatedValues] = useState({
    voltage: 110.5,
    current: 425,
    temperature: 42.3,
    pd: 15.2,
    vibration: 3.8,
    acoustic: 28,
    magnetic: 450 // uT
  });

  useEffect(() => {
    // 如果不激活，不启动定时器
    if (!active) return;

    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setAnimatedValues(prev => ({
        voltage: +(110.5 + (Math.random() - 0.5) * 0.4).toFixed(1),
        current: Math.round(425 + (Math.random() - 0.5) * 20),
        temperature: +(42.3 + (Math.random() - 0.5) * 2).toFixed(1),
        pd: +(15.2 + (Math.random() - 0.5) * 3).toFixed(1),
        vibration: +(3.8 + (Math.random() - 0.5) * 0.5).toFixed(2),
        acoustic: Math.round(28 + (Math.random() - 0.5) * 5),
        magnetic: Math.round(450 + (Math.random() - 0.5) * 30)
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, [active]); // 依赖 active

const sensorInfo = SENSOR_INFO[sensorId] || { name: '未知传感器', location: '未知位置', status: 'normal' };

  return (
    <div className="w-full h-screen bg-[#020617] text-white overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* 背景光效 */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* 顶部导航 */}
      <header className="relative z-20 flex items-center justify-between px-8 py-6 h-[100px]">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="group p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 backdrop-blur-md"
          >
            <ArrowLeft size={20} className="text-slate-300 group-hover:text-white transition-colors" />
          </button>
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              {sensorInfo.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <p className="text-sm text-indigo-200/80 font-medium tracking-wide">{sensorInfo.location}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className={`px-4 py-1.5 rounded-full text-sm font-semibold border backdrop-blur-md flex items-center gap-2 ${
            sensorInfo.status === 'normal' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
            sensorInfo.status === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
            'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              sensorInfo.status === 'normal' ? 'bg-emerald-400' :
              sensorInfo.status === 'warning' ? 'bg-amber-400' : 'bg-red-400'
            } animate-pulse`} />
            {sensorInfo.status === 'normal' ? '系统正常' : 
             sensorInfo.status === 'warning' ? '系统预警' : '系统故障'}
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono font-bold text-slate-200">
              {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
            </div>
            <div className="text-xs text-slate-500 font-medium tracking-wider uppercase">实时监测中</div>
          </div>
        </div>
      </header>

      {/* 主内容网格 */}
      <main className="relative z-10 px-8 pb-8 h-[calc(100vh-100px)] grid grid-cols-12 grid-rows-2 gap-6">
        
        {/* 左侧：数字孪生 (3D Cross Section) */}
        <div className="col-span-4 row-span-2 min-h-[500px]">
          <GlassCard className="!p-0 relative group h-full">
            <div className="absolute top-6 left-6 z-20 pointer-events-none">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 bg-indigo-500/20 rounded-lg backdrop-blur-md">
                  <Layers size={20} className="text-indigo-400" />
                </div>
                <h2 className="text-lg font-bold text-white">数字孪生</h2>
              </div>
              <p className="text-xs text-slate-400 max-w-[200px]">电缆内部结构与热力状态实时3D可视化</p>
            </div>
            
            {/* 3D View - 使用 absolute inset-0 确保填满容器 */}
            <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_50%_30%,_rgba(30,41,59,0.6)_0%,_rgba(2,6,23,0.95)_90%)]">
              <CableCrossSection3D 
                active={active}
                temperature={animatedValues.temperature} 
                load={animatedValues.current / 500 * 100} 
              />
            </div>

            {/* 底部图例 */}
            <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-end pointer-events-none">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-3 h-3 rounded-full bg-[#ffdf00] shadow-[0_0_10px_#ffdf00]" /> 导体
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-3 h-3 rounded-full bg-[#e2e8f0]/50" /> 绝缘层
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <span className="w-3 h-3 rounded-full bg-[#b87333]" /> 屏蔽层
                </div>
              </div>
              <div className="text-right">
                 <div className="text-xs text-slate-500 mb-1">线芯温度</div>
                 <div className="text-3xl font-mono font-bold text-orange-400 drop-shadow-lg">
                   {animatedValues.temperature}°C
                 </div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* 中间：核心指标 (5个维度) */}
        <div className="col-span-5 row-span-2 grid grid-rows-3 gap-6">
          {/* 1. 电学 (Voltage & Current) */}
          {/* 1. 局部放电监测 (原电学位置) */}
          {/* 1. 局部放电监测 (原电学位置) */}
          <GlassCard className="row-span-1 relative overflow-hidden !p-3">
            {/* 数据显示区域 */}
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-xl">
                  <Activity size={20} className="text-purple-400" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">局部放电强度</div>
                  <div className="text-2xl font-mono font-bold text-white">
                    {animatedValues.pd} <span className="text-sm text-slate-500">pC</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mb-1">
                  <Zap size={10} />{animatedValues.current}A | {animatedValues.voltage}kV
                </div>
                <div className="text-xs text-slate-400">放电频次</div>
                <div className="text-xl font-mono font-bold text-purple-400">
                  156 <span className="text-xs text-slate-500">次/min</span>
                </div>
              </div>
            </div>
            
            {/* 频谱图 - 增大高度 */}
            <div className="h-12 bg-slate-900/40 rounded-lg px-2 py-1">
              <PDSpectrumBars pdValue={animatedValues.pd} />
            </div>
          </GlassCard>

          {/* 2. 磁场 & 热学 (Magnetic & Thermal) */}
          <div className="row-span-1 grid grid-cols-2 gap-6">
             {/* 磁场 */}
            <GlassCard>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Magnet size={18} className="text-pink-400" />
                  <h3 className="font-semibold text-slate-200">磁场强度</h3>
                </div>
                <div className="text-xl font-mono font-bold text-pink-400">
                  {animatedValues.magnetic} <span className="text-xs text-slate-500">uT</span>
                </div>
              </div>
              {/* 动态磁场可视化 */}
              <div className="flex-1 relative flex items-center justify-center overflow-hidden rounded-lg bg-[radial-gradient(circle_at_center,_rgba(236,72,153,0.15)_0%,_rgba(0,0,0,0)_70%)] border border-pink-500/10">
                 <MagneticFieldViz intensity={animatedValues.magnetic} />
              </div>
            </GlassCard>

            {/* 热学分布 (原局放位置) */}
            <GlassCard>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <Thermometer size={18} className="text-orange-400" />
                  <h3 className="font-semibold text-slate-200">热学分布</h3>
                </div>
                <div className="text-xl font-mono font-bold text-orange-400">
                  {animatedValues.temperature} <span className="text-xs text-slate-500">°C</span>
                </div>
              </div>
              <div className="flex-1 flex flex-col justify-center gap-2">
                 <ThermalGradient temp={animatedValues.temperature} />
                 <div className="flex justify-between text-[10px] text-slate-500 px-1">
                    <span>光纤测温</span>
                    <span>实时分布</span>
                 </div>
              </div>
            </GlassCard>
          </div>

          {/* 3. 振动 & 声学 (Vibration & Acoustic) */}
          <div className="row-span-1 grid grid-cols-2 gap-6">
            <GlassCard>
              <div className="flex items-center gap-2 mb-2">
                <Waves size={16} className="text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-300">机械振动</h3>
              </div>
              <div className="mt-auto">
                <div className="text-2xl font-mono font-bold text-white">
                  {animatedValues.vibration} <span className="text-xs text-slate-500">mm/s</span>
                </div>
                {/* 动态波形 */}
                <div className="w-full h-12 mt-2 flex items-center gap-0.5 overflow-hidden">
                   <VibrationWaveform amplitude={animatedValues.vibration} />
                </div>
              </div>
            </GlassCard>
            <GlassCard>
              <div className="flex items-center gap-2 mb-2">
                <Volume2 size={16} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-300">声学信号</h3>
              </div>
              <div className="mt-auto">
                <div className="text-2xl font-mono font-bold text-white">
                  {animatedValues.acoustic} <span className="text-xs text-slate-500">dB</span>
                </div>
                <div className="w-full h-12 mt-2 rounded-lg overflow-hidden">
                  <AcousticSpectrum />
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* 右侧：健康评估 & 详情 */}
        <div className="col-span-3 row-span-2 grid grid-rows-[1fr_auto] gap-4">
          <GlassCard className="flex flex-col min-h-0 overflow-hidden">
            <div className="flex items-center gap-2 mb-2 flex-none">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <Cpu size={20} className="text-emerald-400" />
              </div>
              <h2 className="font-bold text-lg">AI 智能诊断</h2>
            </div>

            <div className="flex-1 flex flex-col relative min-h-0">
              {/* 中心评分 (绝对定位叠加在雷达图上) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none pb-2">
                <div className="relative">
                  <div className="text-5xl font-bold text-white drop-shadow-[0_0_15px_rgba(16,185,129,0.5)] tracking-tight">
                    94<span className="text-xl text-emerald-400 ml-0.5">%</span>
                  </div>
                  <div className="text-[10px] text-emerald-400/80 font-medium uppercase tracking-[0.2em] text-center mt-1">
                    健康评分
                  </div>
                  {/* 装饰性光环 */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -z-10" />
                </div>
              </div>

              {/* 雷达图 - 调整位置和半径以适配中心文字 */}
              <div className="flex-1 min-h-0 w-full h-full">
                <ReactECharts 
                  option={{
                    backgroundColor: 'transparent',
                    radar: {
                      indicator: [
                        { name: '电气', max: 100 },
                        { name: '热学', max: 100 },
                        { name: '机械', max: 100 },
                        { name: '化学', max: 100 },
                        { name: '环境', max: 100 },
                        { name: '寿命', max: 100 }
                      ],
                      center: ['50%', '50%'],
                      radius: ['45%', '70%'], // 内半径空出给文字，外半径扩大
                      splitNumber: 4,
                      axisName: { 
                        color: '#94a3b8', 
                        fontSize: 11,
                        fontWeight: 500
                      },
                      splitLine: { 
                        lineStyle: { color: 'rgba(255, 255, 255, 0.08)' } 
                      },
                      splitArea: { 
                        show: true,
                        areaStyle: {
                          color: ['rgba(255,255,255,0.02)', 'rgba(255,255,255,0.05)']
                        }
                      },
                      axisLine: { 
                        lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } 
                      }
                    },
                    series: [{
                      type: 'radar',
                      data: [{
                        value: [96, 92, 98, 85, 90, 88],
                        name: '健康状态',
                        symbol: 'circle',
                        symbolSize: 4,
                        itemStyle: { color: '#10b981' },
                        lineStyle: { width: 2, color: '#10b981' },
                        areaStyle: {
                          color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                            { offset: 0, color: 'rgba(16, 185, 129, 0.1)' },
                            { offset: 1, color: 'rgba(16, 185, 129, 0.5)' }
                          ])
                        }
                      }]
                    }]
                  }}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'canvas' }}
                />
              </div>

              {/* 底部：模型信息 */}
              <div className="flex-none pt-3 pb-1 border-t border-white/5">
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>模型: Transformer-v4</span>
                  <span>置信度: <span className="text-emerald-400">98.2%</span></span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* 生成报告 - 均衡布局 (避免空旷) - 手动实现 Glass 效果以修复布局冲突 */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl group cursor-pointer hover:bg-white/10 transition-all">
            {/* 光泽背景 */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
            
            {/* 内容容器 - 显式控制布局 */}
            <div className="relative z-10 p-3.5 flex items-center gap-3">
              {/* 1. 图标 */}
              <div className="p-2 rounded-lg bg-indigo-500/20 flex-shrink-0">
                <TrendingUp size={18} className="text-indigo-400" />
              </div>
              
              {/* 2. 标题区 (自适应填充) */}
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-baseline justify-between">
                  <span className="font-semibold text-white text-sm whitespace-nowrap">生成报告</span>
                  {/* 时间戳靠右对齐 */}
                  <span className="text-[10px] text-slate-500 font-mono ml-2">10:24 AM</span>
                </div>
                {/* 进度条装饰 */}
                <div className="w-full h-1 bg-white/5 rounded-full mt-1.5 overflow-hidden">
                  <div className="w-2/3 h-full bg-indigo-500/50 rounded-full" />
                </div>
              </div>

              {/* 3. 按钮组 (紧凑) */}
              <div className="flex items-center gap-2 pl-2 border-l border-white/5">
                <button className="h-8 px-3 rounded bg-indigo-500/20 text-indigo-300 text-xs font-bold hover:bg-indigo-500/30 transition-colors border border-indigo-500/20">
                  PDF
                </button>
                <button className="h-8 px-3 rounded bg-slate-700/50 text-slate-300 text-xs font-bold hover:bg-slate-600/50 transition-colors border border-white/5">
                  XLS
                </button>
              </div>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default SensorDashboard;
