import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Thermometer, 
  Zap, 
  Volume2,
  Waves,
  ArrowLeft,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';

/**
 * 传感器监测数据总览仪表盘
 * 点击传感器后显示的多图表界面
 */

interface SensorDashboardProps {
  sensorId: string;
  onBack: () => void;
}

// 模拟传感器详情数据 - 与CableNetwork3D中的SENSORS保持一致
const SENSOR_INFO: Record<string, { name: string; location: string; status: string }> = {
  // 蓝色外环节点
  'S1': { name: '西北枢纽', location: '110kV 主环网 西北角', status: 'normal' },
  'S2': { name: '东北枢纽', location: '110kV 主环网 东北角', status: 'normal' },
  'S3': { name: '西南枢纽', location: '110kV 主环网 西南角', status: 'warning' },
  'S4': { name: '东南枢纽', location: '110kV 主环网 东南角', status: 'normal' },
  // 绿色十字中心
  'S5': { name: '中央配电站', location: '35kV 配电中心', status: 'fault' },
};

const SensorDashboard: React.FC<SensorDashboardProps> = ({ sensorId, onBack }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [animatedValues, setAnimatedValues] = useState({
    voltage: 110.5,
    current: 425,
    temperature: 42.3,
    pd: 15.2,
    vibration: 3.8,
    acoustic: 28
  });

  // 模拟实时数据更新
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setAnimatedValues(prev => ({
        voltage: +(110.5 + (Math.random() - 0.5) * 0.4).toFixed(1),
        current: Math.round(425 + (Math.random() - 0.5) * 20),
        temperature: +(42.3 + (Math.random() - 0.5) * 2).toFixed(1),
        pd: +(15.2 + (Math.random() - 0.5) * 3).toFixed(1),
        vibration: +(3.8 + (Math.random() - 0.5) * 0.5).toFixed(2),
        acoustic: Math.round(28 + (Math.random() - 0.5) * 5)
      }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const sensorInfo = SENSOR_INFO[sensorId] || { name: '未知传感器', location: '未知位置', status: 'normal' };

  // 波形数据生成
  const generateWaveData = (points: number, amplitude: number, offset: number) => {
    const data = [];
    for (let i = 0; i < points; i++) {
      data.push(Math.sin(i * 0.1 + offset) * amplitude + (Math.random() - 0.5) * amplitude * 0.3);
    }
    return data;
  };

  // SVG波形路径
  const createWavePath = (data: number[], width: number, height: number, baseline: number) => {
    const step = width / (data.length - 1);
    return data.map((v, i) => `${i === 0 ? 'M' : 'L'} ${i * step} ${baseline - v}`).join(' ');
  };

  // 恢复原始波形数据生成
  const waveData1 = generateWaveData(50, 20, Date.now() * 0.001);
  const waveData2 = generateWaveData(50, 15, Date.now() * 0.002);

  return (
    <div className="w-full h-screen bg-[#0a0f1a] text-white overflow-y-auto overflow-x-hidden">
      {/* 顶部导航 */}
      <header className="sticky top-0 z-10 bg-[#0a0f1a]/95 backdrop-blur border-b border-slate-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-cyan-400">{sensorInfo.name}</h1>
              <p className="text-sm text-slate-400">{sensorInfo.location}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              sensorInfo.status === 'normal' ? 'bg-emerald-900/50 text-emerald-400' :
              sensorInfo.status === 'warning' ? 'bg-amber-900/50 text-amber-400' :
              'bg-red-900/50 text-red-400'
            }`}>
              {sensorInfo.status === 'normal' ? '● 运行正常' : 
               sensorInfo.status === 'warning' ? '● 预警状态' : '● 故障告警'}
            </div>
            <div className="text-sm text-slate-400 font-mono">
              {currentTime.toLocaleTimeString('zh-CN')}
            </div>
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 电学监测卡片 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Zap size={18} className="text-blue-400" />
            </div>
            <h2 className="font-bold">电学状态监测</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-slate-400">工作电压</div>
                <div className="text-2xl font-mono font-bold text-blue-400">
                  {animatedValues.voltage} <span className="text-sm">kV</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">负载电流</div>
                <div className="text-2xl font-mono font-bold text-cyan-400">
                  {animatedValues.current} <span className="text-sm">A</span>
                </div>
              </div>
            </div>
            
            {/* 电压波形 */}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-2">电压波形</div>
              <svg className="w-full h-16" viewBox="0 0 200 60">
                <path 
                  d={createWavePath(waveData1, 200, 60, 30)} 
                  fill="none" 
                  stroke="#3b82f6" 
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800/30 p-2 rounded">
                <div className="text-xs text-slate-500">功率因数</div>
                <div className="font-mono text-slate-300">0.92</div>
              </div>
              <div className="bg-slate-800/30 p-2 rounded">
                <div className="text-xs text-slate-500">有功功率</div>
                <div className="font-mono text-slate-300">48.5 MW</div>
              </div>
            </div>
          </div>
        </div>

        {/* 热学监测卡片 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-orange-600/20 rounded-lg">
              <Thermometer size={18} className="text-orange-400" />
            </div>
            <h2 className="font-bold">热学状态监测</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-slate-400">线芯温度</div>
                <div className="text-2xl font-mono font-bold text-orange-400">
                  {animatedValues.temperature} <span className="text-sm">°C</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">环境温度</div>
                <div className="text-lg font-mono text-slate-400">
                  25.8 <span className="text-sm">°C</span>
                </div>
              </div>
            </div>
            
            {/* 温度梯度条 */}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-2">温度分布</div>
              <div className="h-8 rounded-lg overflow-hidden" style={{
                background: 'linear-gradient(to right, #3b82f6, #22c55e, #eab308, #ef4444)'
              }}>
                <div 
                  className="h-full w-1 bg-white shadow-lg"
                  style={{ marginLeft: `${(animatedValues.temperature / 80) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-slate-500 mt-1">
                <span>0°C</span>
                <span>80°C</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800/30 p-2 rounded">
                <div className="text-xs text-slate-500">最高温度</div>
                <div className="font-mono text-orange-300">58.2°C</div>
              </div>
              <div className="bg-slate-800/30 p-2 rounded">
                <div className="text-xs text-slate-500">温升速率</div>
                <div className="font-mono text-slate-300">+0.3°C/h</div>
              </div>
            </div>
          </div>
        </div>

        {/* 局部放电监测卡片 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Activity size={18} className="text-purple-400" />
            </div>
            <h2 className="font-bold">局部放电监测</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div>
                <div className="text-xs text-slate-400">放电幅值</div>
                <div className="text-2xl font-mono font-bold text-purple-400">
                  {animatedValues.pd} <span className="text-sm">pC</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs text-slate-400">脉冲计数</div>
                <div className="text-lg font-mono text-slate-400">
                  156 <span className="text-sm">pps</span>
                </div>
              </div>
            </div>
            
            {/* 频谱柱状图 */}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-2">局放频谱</div>
              <div className="flex items-end gap-1 h-12">
                {[0.6, 0.8, 1, 0.7, 0.5, 0.9, 0.4, 0.6, 0.3, 0.5, 0.2, 0.4].map((h, i) => (
                  <div 
                    key={i}
                    className="flex-1 bg-purple-500 rounded-t transition-all duration-300"
                    style={{ height: `${h * 100 * (0.8 + Math.random() * 0.4)}%` }}
                  />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800/30 p-2 rounded">
                <div className="text-xs text-slate-500">主频点</div>
                <div className="font-mono text-slate-300">125 kHz</div>
              </div>
              <div className="bg-slate-800/30 p-2 rounded">
                <div className="text-xs text-slate-500">趋势</div>
                <div className="font-mono text-emerald-400 flex items-center gap-1">
                  <TrendingUp size={12} /> 稳定
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 振动监测卡片 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-cyan-600/20 rounded-lg">
              <Waves size={18} className="text-cyan-400" />
            </div>
            <h2 className="font-bold">振动状态监测</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-400">振动幅值 (RMS)</div>
              <div className="text-2xl font-mono font-bold text-cyan-400">
                {animatedValues.vibration} <span className="text-sm">mm/s</span>
              </div>
            </div>
            
            {/* 振动波形 */}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-2">时域波形</div>
              <svg className="w-full h-16" viewBox="0 0 200 60">
                <line x1="0" y1="30" x2="200" y2="30" stroke="#334155" strokeWidth="1" />
                <path 
                  d={createWavePath(waveData2, 200, 60, 30)} 
                  fill="none" 
                  stroke="#06b6d4" 
                  strokeWidth="2"
                />
              </svg>
            </div>

            <div className="grid grid-cols-3 gap-2 text-sm">
              <div className="bg-slate-800/30 p-2 rounded text-center">
                <div className="text-xs text-slate-500">X轴</div>
                <div className="font-mono text-slate-300">2.1</div>
              </div>
              <div className="bg-slate-800/30 p-2 rounded text-center">
                <div className="text-xs text-slate-500">Y轴</div>
                <div className="font-mono text-slate-300">1.8</div>
              </div>
              <div className="bg-slate-800/30 p-2 rounded text-center">
                <div className="text-xs text-slate-500">Z轴</div>
                <div className="font-mono text-slate-300">2.5</div>
              </div>
            </div>
          </div>
        </div>

        {/* 声学监测卡片 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-green-600/20 rounded-lg">
              <Volume2 size={18} className="text-green-400" />
            </div>
            <h2 className="font-bold">声学状态监测</h2>
          </div>
          
          <div className="space-y-4">
            <div>
              <div className="text-xs text-slate-400">超声幅值</div>
              <div className="text-2xl font-mono font-bold text-green-400">
                {animatedValues.acoustic} <span className="text-sm">dB</span>
              </div>
            </div>
            
            {/* 声学频谱 */}
            <div className="bg-slate-800/50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-2">频谱分析</div>
              <div className="flex items-end gap-0.5 h-12">
                {Array.from({ length: 24 }, (_, i) => {
                  const val = Math.random() * 0.5 + (i < 8 ? 0.5 : i < 16 ? 0.3 : 0.1);
                  return (
                    <div 
                      key={i}
                      className="flex-1 bg-green-500 rounded-t transition-all duration-300"
                      style={{ 
                        height: `${val * 100}%`,
                        opacity: 0.4 + val * 0.6
                      }}
                    />
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-800/30 p-2 rounded">
                <div className="text-xs text-slate-500">检测频段</div>
                <div className="font-mono text-slate-300">20-100 kHz</div>
              </div>
              <div className="bg-slate-800/30 p-2 rounded">
                <div className="text-xs text-slate-500">背景噪声</div>
                <div className="font-mono text-slate-300">18 dB</div>
              </div>
            </div>
          </div>
        </div>

        {/* 综合健康评估卡片 */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-600/20 rounded-lg">
              <AlertTriangle size={18} className="text-emerald-400" />
            </div>
            <h2 className="font-bold">综合健康评估</h2>
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="40" cy="40" r="35" fill="none" stroke="#1e293b" strokeWidth="6" />
                  <circle 
                    cx="40" cy="40" r="35" fill="none" 
                    stroke="#22c55e" strokeWidth="6"
                    strokeDasharray={`${94 * 2.2} ${100 * 2.2}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-emerald-400">94%</span>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400">健康指数</div>
                <div className="text-lg font-bold text-emerald-400">优良</div>
                <div className="text-xs text-slate-500">预计剩余寿命: 28.5年</div>
              </div>
            </div>
            
            <div className="space-y-2">
              {[
                { label: '电气状态', value: 96, color: 'bg-blue-500' },
                { label: '热学状态', value: 92, color: 'bg-orange-500' },
                { label: '绝缘状态', value: 94, color: 'bg-purple-500' },
                { label: '机械状态', value: 98, color: 'bg-cyan-500' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 w-16">{item.label}</span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                  </div>
                  <span className="text-xs font-mono text-slate-300 w-8">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SensorDashboard;
