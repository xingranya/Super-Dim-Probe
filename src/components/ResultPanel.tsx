import React, { useEffect, useState, useRef } from 'react';

/**
 * 结果显示面板 - 增强版
 * 参考 dashboard 风格，添加动态文字和实时数值
 */

interface ResultPanelProps {
  progress: number;
  isVisible?: boolean;
}

// 传感器配置 - 包含详细数据
const sensors = [
  { 
    id: 'acoustic', name: '声学', icon: '🔊', status: '正常', color: '#22c55e', showAt: 62,
    value: 42, unit: 'dB', desc: '超声波频谱正常', detail: '40kHz 频段无异常'
  },
  { 
    id: 'electric', name: '电学', icon: '⚡', status: '局部放电', color: '#f59e0b', showAt: 68,
    value: 223, unit: 'pC', desc: '检测到放电信号', detail: '相位45°/135°簇状放电'
  },
  { 
    id: 'thermal', name: '热学', icon: '🔥', status: '轻微过热', color: '#f97316', showAt: 74,
    value: 58.2, unit: '°C', desc: '温度偏高', detail: '正常阈值 55°C'
  },
  { 
    id: 'vibration', name: '振动', icon: '📳', status: '正常', color: '#22c55e', showAt: 80,
    value: 0.12, unit: 'mm/s', desc: '振幅正常', detail: '频率 50Hz'
  },
  { 
    id: 'magnetic', name: '磁学', icon: '🧲', status: '正常', color: '#22c55e', showAt: 86,
    value: 28, unit: 'mT', desc: '磁场强度正常', detail: '三相平衡'
  },
];

// 预生成图表数据
const spectrumBars = Array.from({ length: 16 }, (_, i) => 15 + Math.sin(i * 0.5) * 15 + Math.random() * 10);
const prpdPoints = Array.from({ length: 50 }, () => ({ x: 10 + Math.random() * 80, y: 5 + Math.random() * 35 }));

const ResultPanel: React.FC<ResultPanelProps> = ({ progress, isVisible = true }) => {
  const [typedText, setTypedText] = useState('');
  const [animatedValues, setAnimatedValues] = useState<{[key: string]: number}>({});
  
  const showResult = progress >= 60;
  const showConclusion = progress >= 92;
  const conclusionText = '综合诊断: 电学局放+热学过热，建议48小时内检修。健康度82%';

  const animatedSensorsRef = useRef<Set<string>>(new Set());

  // 数值动画
  useEffect(() => {
    // 如果进度重置（例如重播），则重置动画状态
    if (progress < 1) {
      animatedSensorsRef.current.clear();
      setAnimatedValues({});
    }

    sensors.forEach(sensor => {
      if (progress >= sensor.showAt && !animatedSensorsRef.current.has(sensor.id)) {
        animatedSensorsRef.current.add(sensor.id);
        
        let current = 0;
        const target = sensor.value;
        const step = target / 20;
        
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            setAnimatedValues(prev => ({ ...prev, [sensor.id]: target }));
            clearInterval(timer);
          } else {
            setAnimatedValues(prev => ({ ...prev, [sensor.id]: current }));
          }
        }, 50);
      }
    });
  }, [progress]);

  // 打字机效果
  useEffect(() => {
    if (!showConclusion) { setTypedText(''); return; }
    let i = 0;
    const timer = setInterval(() => {
      if (i <= conclusionText.length) { setTypedText(conclusionText.slice(0, i)); i++; }
      else clearInterval(timer);
    }, 25);
    return () => clearInterval(timer);
  }, [showConclusion]);

  // 动态图表
  const renderChart = (id: string, visible: boolean) => {
    if (!visible) return null;
    
    switch (id) {
      case 'acoustic':
        return (
          <svg viewBox="0 0 100 40" className="w-full h-full">
            {spectrumBars.map((h, i) => {
              // 每个柱子不同的动画参数
              const baseH = h * 0.9;
              const minH = h * 0.3 + Math.random() * 10;
              const maxH = h * 1.1;
              const dur = 0.3 + (i % 5) * 0.15; // 0.3s - 0.9s 不同速度
              return (
                <rect key={i} x={i * 6 + 2} y={40 - baseH} width={4} height={baseH} fill="#22c55e" rx={1}>
                  <animate 
                    attributeName="height" 
                    values={`${baseH};${minH};${maxH};${baseH * 0.6};${baseH}`} 
                    dur={`${dur}s`} 
                    repeatCount="indefinite" 
                  />
                  <animate 
                    attributeName="y" 
                    values={`${40-baseH};${40-minH};${40-maxH};${40-baseH*0.6};${40-baseH}`} 
                    dur={`${dur}s`} 
                    repeatCount="indefinite" 
                  />
                </rect>
              );
            })}
          </svg>
        );
      case 'electric':
        return (
          <svg viewBox="0 0 100 45" className="w-full h-full">
            {/* 坐标轴 */}
            <line x1="5" y1="42" x2="95" y2="42" stroke="#334155" strokeWidth="0.5" />
            <line x1="5" y1="5" x2="5" y2="42" stroke="#334155" strokeWidth="0.5" />
            {prpdPoints.map((p, i) => {
              // 每个点随机偏移
              const dx1 = (Math.random() - 0.5) * 4;
              const dx2 = (Math.random() - 0.5) * 4;
              const dy1 = (Math.random() - 0.5) * 4;
              const dy2 = (Math.random() - 0.5) * 4;
              const dur = 1.5 + Math.random() * 2; // 1.5-3.5秒
              return (
                <circle key={i} r={2} fill="#f59e0b">
                  {/* 平滑移动动画 */}
                  <animate 
                    attributeName="cx" 
                    values={`${p.x};${p.x+dx1};${p.x+dx2};${p.x-dx1};${p.x}`}
                    dur={`${dur}s`} 
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
                  />
                  <animate 
                    attributeName="cy" 
                    values={`${p.y};${p.y+dy1};${p.y-dy2};${p.y+dy2};${p.y}`}
                    dur={`${dur}s`} 
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
                  />
                  <animate 
                    attributeName="opacity" 
                    values="0.6;0.9;0.7;1;0.6" 
                    dur={`${dur}s`} 
                    repeatCount="indefinite"
                    calcMode="spline"
                    keySplines="0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1"
                  />
                </circle>
              );
            })}
          </svg>
        );
      case 'thermal':
        return (
          <svg viewBox="0 0 100 30" className="w-full h-full">
            <defs>
              <linearGradient id="tg" x1="0%" x2="100%"><stop offset="0%" stopColor="#3b82f6"/><stop offset="50%" stopColor="#22c55e"/><stop offset="100%" stopColor="#ef4444"/></linearGradient>
            </defs>
            <rect x="5" y="10" width="90" height="12" rx="2" fill="url(#tg)" />
            <polygon points="60,8 56,2 64,2" fill="#fff">
              <animate attributeName="points" values="60,8 56,2 64,2;62,8 58,2 66,2;60,8 56,2 64,2" dur="1s" repeatCount="indefinite" />
            </polygon>
          </svg>
        );
      case 'vibration':
        const wave = Array.from({length:50}, (_,i) => `${i===0?'M':'L'} ${i*2} ${20 + Math.sin(i*0.5)*15}`).join(' ');
        return (
          <svg viewBox="0 0 100 40" className="w-full h-full">
            <line x1="0" y1="20" x2="100" y2="20" stroke="#334155" strokeWidth="0.5" />
            <path d={wave} fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="200" strokeDashoffset="0">
              <animate attributeName="stroke-dashoffset" from="200" to="0" dur="2s" repeatCount="indefinite" />
            </path>
          </svg>
        );
      case 'magnetic':
        return (
          <svg viewBox="0 0 120 50" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
            {/* 背景弧 */}
            <path d="M 20 45 A 40 40 0 0 1 100 45" fill="none" stroke="#334155" strokeWidth="8" strokeLinecap="round" />
            {/* 绿色弧（正常范围） */}
            <path d="M 20 45 A 40 40 0 0 1 60 7" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" />
            {/* 指针 */}
            <g>
              <circle cx="60" cy="45" r="6" fill="#1e293b" stroke="#fff" strokeWidth="2" />
              <line x1="60" y1="45" x2="40" y2="20" stroke="#ef4444" strokeWidth="3" strokeLinecap="round">
                <animateTransform attributeName="transform" type="rotate" values="0 60 45;-15 60 45;0 60 45;15 60 45;0 60 45" dur="3s" repeatCount="indefinite" />
              </line>
            </g>
          </svg>
        );
      default: return null;
    }
  };

  if (!isVisible) return null;

  return (
    <div className="w-full h-full flex flex-col rounded-xl border border-cyan-500/20 bg-gradient-to-br from-[#0a1628] to-[#0d1f35] overflow-hidden">
      {/* 标题 */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-cyan-500/20 bg-slate-900/50 shrink-0">
        <div className={`w-2 h-2 rounded-full ${showResult ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
        <span className="text-cyan-400 text-sm font-bold">诊断结果</span>
        {showResult && <span className="ml-auto text-emerald-400 text-[10px]">IEC 60270</span>}
      </div>

      {/* 传感器列表 */}
      <div className="flex-1 flex flex-col p-1.5 gap-1 overflow-auto">
        {sensors.map((sensor) => {
          const visible = progress >= sensor.showAt;
          const value = animatedValues[sensor.id] ?? 0;
          
          return (
            <div
              key={sensor.id}
              className={`bg-slate-800/60 rounded p-2 border border-slate-700/50 transition-all duration-500 ${visible ? 'opacity-100' : 'opacity-0 h-0 p-0 overflow-hidden'}`}
            >
              {/* 头部：图标、名称、状态 */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-base">{sensor.icon}</span>
                  <span className="text-white text-xs font-bold">{sensor.name}检测</span>
                </div>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${sensor.color}22`, color: sensor.color }}>
                  {sensor.status}
                </span>
              </div>
              
              {/* 数值显示 */}
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-lg font-mono font-bold" style={{ color: sensor.color }}>
                  {value.toFixed(sensor.unit === '°C' || sensor.unit === 'mm/s' ? 1 : 0)}
                </span>
                <span className="text-slate-500 text-[10px]">{sensor.unit}</span>
                <span className="text-slate-400 text-[10px] ml-2">{sensor.desc}</span>
              </div>
              
              {/* 图表 */}
              <div className="h-10 mb-1">{renderChart(sensor.id, visible)}</div>
              
              {/* 详情 */}
              <div className="text-slate-500 text-[9px]">{sensor.detail}</div>
            </div>
          );
        })}

        {/* 综合诊断 */}
        {showConclusion && (
          <div className="mt-auto bg-cyan-500/10 rounded p-2 border border-cyan-500/20 shrink-0">
            <div className="text-cyan-300 text-xs leading-relaxed">
              {typedText}<span className="animate-pulse text-cyan-400">|</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultPanel;
