import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { 
  Volume2, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Settings,
  Maximize2,
  Minimize2,
  Radio,
  Waves,
  Target
} from 'lucide-react';

/**
 * 声学监测页面
 * 声发射(AE)检测与超声波分析
 */
const AcousticMonitoringPage: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'waveform' | 'spectrum' | 'location'>('waveform');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tick, setTick] = useState(0);

  // 实时数据更新 - 降低刷新频率以提升性能
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000); // 1秒刷新一次
    return () => clearInterval(timer);
  }, []);

  // 传感器通道配置
  const channels = [
    { id: 1, name: 'AE-01', location: '#N1接头', status: 'normal', amplitude: 45, snr: 28.5 },
    { id: 2, name: 'AE-02', location: '#S2接头', status: 'warning', amplitude: 82, snr: 35.2 },
    { id: 3, name: 'AE-03', location: '南区变终端', status: 'normal', amplitude: 38, snr: 26.8 },
    { id: 4, name: 'AE-04', location: '#E1接头', status: 'normal', amplitude: 41, snr: 27.1 },
    { id: 5, name: 'US-01', location: '超声波探头', status: 'normal', amplitude: 55, snr: 32.0 },
  ];

  // 实时声学参数
  const acousticParams = {
    peakAmplitude: 82 + Math.random() * 10,
    rmsLevel: 45 + Math.random() * 5,
    eventRate: 23 + Math.floor(Math.random() * 10),
    signalEnergy: 1.25 + Math.random() * 0.3,
    dominantFreq: 125 + Math.random() * 20,
    bandwidth: 80 + Math.random() * 15,
  };

  // AE波形图配置
  const getWaveformOption = () => {
    const channel = channels.find(c => c.id === activeChannel);
    const isWarning = channel?.status === 'warning';
    
    // 生成AE信号波形
    const time = Array.from({ length: 1000 }, (_, i) => i * 0.01); // 10ms
    const signal: number[] = [];
    
    for (let i = 0; i < 1000; i++) {
      let val = 0;
      // 背景噪声
      val += (Math.random() - 0.5) * 10;
      
      // AE突发信号
      if (isWarning) {
        // 多个突发事件
        const bursts = [
          { center: 150, amp: 75, decay: 30 },
          { center: 400, amp: 85, decay: 35 },
          { center: 650, amp: 60, decay: 25 },
          { center: 850, amp: 70, decay: 30 },
        ];
        bursts.forEach(burst => {
          if (i >= burst.center && i < burst.center + 100) {
            const t = i - burst.center;
            val += burst.amp * Math.exp(-t / burst.decay) * Math.sin(2 * Math.PI * 150 * t / 1000);
          }
        });
      } else {
        // 单个突发事件
        if (i >= 300 && i < 400) {
          const t = i - 300;
          val += 45 * Math.exp(-t / 25) * Math.sin(2 * Math.PI * 120 * t / 1000);
        }
      }
      
      signal.push(val);
    }

    return {
      backgroundColor: 'transparent',
      title: {
        text: `声发射波形 - ${channel?.name}`,
        subtext: `位置: ${channel?.location} | 峰值: ${channel?.amplitude} dB | SNR: ${channel?.snr} dB`,
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 'bold' },
        subtextStyle: { color: '#64748b', fontSize: 12 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => 
          `时间: ${params[0].value[0].toFixed(2)} ms<br/>幅值: ${params[0].value[1].toFixed(1)} mV`
      },
      grid: { top: 70, right: 30, bottom: 50, left: 60, containLabel: true },
      xAxis: {
        type: 'value',
        name: '时间 (ms)',
        nameLocation: 'middle',
        nameGap: 30,
        min: 0,
        max: 10,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        name: '幅值 (mV)',
        nameLocation: 'middle',
        nameGap: 45,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      dataZoom: [
        { type: 'inside', xAxisIndex: 0 },
        { type: 'slider', xAxisIndex: 0, height: 20, bottom: 5 }
      ],
      series: [{
        type: 'line',
        data: time.map((t, i) => [t, signal[i]]),
        smooth: false,
        symbol: 'none',
        lineStyle: { color: '#10b981', width: 1 },
        animationDuration: 800,
        animationEasing: 'cubicInOut'
      }]
    };
  };

  // FFT频谱图配置
  const getSpectrumOption = () => {
    const channel = channels.find(c => c.id === activeChannel);
    const isWarning = channel?.status === 'warning';
    
    // 生成频谱数据
    const freq = Array.from({ length: 200 }, (_, i) => i * 2); // 0-400 kHz
    const spectrum: number[] = [];
    
    for (let i = 0; i < 200; i++) {
      let val = 5 + Math.random() * 3; // 噪底
      
      // 特征峰
      if (isWarning) {
        // 多个特征峰 - 异常模式
        const peaks = [
          { center: 60, amp: 65, width: 15 },
          { center: 125, amp: 80, width: 20 },
          { center: 180, amp: 55, width: 12 },
          { center: 250, amp: 45, width: 18 },
        ];
        peaks.forEach(peak => {
          val += peak.amp * Math.exp(-Math.pow(i - peak.center / 2, 2) / (2 * Math.pow(peak.width / 2, 2)));
        });
      } else {
        // 正常模式 - 单峰
        const peaks = [
          { center: 120, amp: 45, width: 25 },
        ];
        peaks.forEach(peak => {
          val += peak.amp * Math.exp(-Math.pow(i - peak.center / 2, 2) / (2 * Math.pow(peak.width / 2, 2)));
        });
      }
      
      spectrum.push(val);
    }

    return {
      backgroundColor: 'transparent',
      title: {
        text: 'FFT频谱分析',
        subtext: `主频: ${acousticParams.dominantFreq.toFixed(0)} kHz | 带宽: ${acousticParams.bandwidth.toFixed(0)} kHz`,
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 'bold' },
        subtextStyle: { color: '#64748b', fontSize: 12 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => 
          `频率: ${params[0].value[0].toFixed(0)} kHz<br/>幅值: ${params[0].value[1].toFixed(1)} dB`
      },
      grid: { top: 70, right: 30, bottom: 50, left: 60, containLabel: true },
      xAxis: {
        type: 'value',
        name: '频率 (kHz)',
        nameLocation: 'middle',
        nameGap: 30,
        min: 0,
        max: 400,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        name: '幅值 (dB)',
        nameLocation: 'middle',
        nameGap: 45,
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      series: [{
        type: 'line',
        data: freq.map((f, i) => [f, spectrum[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#8b5cf6', width: 1.5 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(139, 92, 246, 0.4)' },
            { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
          ])
        },
        markLine: {
          silent: true,
          data: [
            { xAxis: acousticParams.dominantFreq, lineStyle: { color: '#ef4444', type: 'dashed' }, label: { formatter: '主频' } }
          ]
        }
      }]
    };
  };

  // 声源定位热力图配置
  const getLocationOption = () => {
    // 模拟电缆三维定位数据
    const data: number[][] = [];
    
    // 正常区域散点
    for (let i = 0; i < 50; i++) {
      data.push([
        Math.random() * 100,
        Math.random() * 50,
        Math.random() * 20
      ]);
    }
    
    // 热点区域
    const hotspots = [
      { x: 35, y: 25, intensity: 80 },
      { x: 70, y: 30, intensity: 60 },
    ];
    
    hotspots.forEach(h => {
      for (let i = 0; i < 30; i++) {
        data.push([
          h.x + (Math.random() - 0.5) * 15,
          h.y + (Math.random() - 0.5) * 10,
          h.intensity * (0.5 + Math.random() * 0.5)
        ]);
      }
    });

    return {
      backgroundColor: 'transparent',
      title: {
        text: '声源定位分布图',
        subtext: '电缆长度: 960m | 检测范围: 全线',
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 'bold' },
        subtextStyle: { color: '#64748b', fontSize: 12 }
      },
      tooltip: {
        formatter: (params: any) => 
          `位置: ${(params.value[0] * 9.6).toFixed(0)}m<br/>径向: ${params.value[1].toFixed(1)}°<br/>强度: ${params.value[2].toFixed(1)} dB`
      },
      grid: { top: 70, right: 80, bottom: 50, left: 60, containLabel: true },
      xAxis: {
        type: 'value',
        name: '轴向位置 (%)',
        nameLocation: 'middle',
        nameGap: 30,
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        name: '径向位置 (°)',
        nameLocation: 'middle',
        nameGap: 40,
        min: 0,
        max: 50,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'vertical',
        right: 10,
        top: 'center',
        itemHeight: 120,
        text: ['高', '低'],
        textStyle: { color: '#64748b' },
        inRange: {
          color: ['#dbeafe', '#60a5fa', '#f59e0b', '#ef4444']
        }
      },
      series: [{
        type: 'scatter',
        symbolSize: (val: number[]) => Math.max(6, val[2] / 5),
        data: data,
        animationDuration: 800,
        animationEasing: 'cubicInOut'
      }]
    };
  };

  // 获取当前图表配置
  const getChartOption = () => {
    switch (viewMode) {
      case 'waveform': return getWaveformOption();
      case 'spectrum': return getSpectrumOption();
      case 'location': return getLocationOption();
      default: return getWaveformOption();
    }
  };

  // 声发射事件列表
  const aeEvents = [
    { time: '14:35:22', channel: 'AE-02', type: '突发信号', amplitude: '82 dB', duration: '2.3 ms', level: 'warning' },
    { time: '14:32:15', channel: 'AE-02', type: '连续信号', amplitude: '68 dB', duration: '15.5 ms', level: 'warning' },
    { time: '14:28:08', channel: 'AE-01', type: '突发信号', amplitude: '45 dB', duration: '1.2 ms', level: 'info' },
    { time: '14:15:33', channel: 'US-01', type: '超声回波', amplitude: '55 dB', duration: '0.8 ms', level: 'info' },
  ];

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-50 p-6' : 'min-h-[calc(100vh-10rem)]'}`}>
      {/* 左侧面板 - 传感器通道 */}
      <aside className={`lg:col-span-3 flex flex-col gap-4 ${isFullscreen ? 'hidden' : ''}`}>
        {/* 系统状态概览 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Volume2 size={18} className="text-purple-600" />
            声学监测系统
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">峰值幅度</div>
              <div className="font-mono font-bold text-slate-800">{acousticParams.peakAmplitude.toFixed(1)} dB</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">RMS电平</div>
              <div className="font-mono font-bold text-slate-800">{acousticParams.rmsLevel.toFixed(1)} dB</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">事件频率</div>
              <div className="font-mono font-bold text-amber-600">{acousticParams.eventRate} 次/min</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">信号能量</div>
              <div className="font-mono font-bold text-slate-800">{acousticParams.signalEnergy.toFixed(2)} mJ</div>
            </div>
          </div>
        </div>

        {/* 传感器通道列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Radio size={18} className="text-purple-600" />
            声学传感器
          </h2>
          <div className="space-y-2">
            {channels.map(channel => (
              <div
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeChannel === channel.id
                    ? 'bg-purple-50 border-purple-200 ring-1 ring-purple-200'
                    : 'bg-white border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700 text-sm">{channel.name}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    channel.status === 'normal' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{channel.location}</span>
                  <span className="font-mono text-slate-600">{channel.amplitude} dB</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* 中间面板 - 主图表区 */}
      <section className={`${isFullscreen ? 'col-span-12' : 'lg:col-span-6'} flex flex-col gap-4`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex-1 flex flex-col">
          {/* 顶部控制栏 */}
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {(['waveform', 'spectrum', 'location'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
                    viewMode === mode 
                      ? 'bg-white text-purple-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mode === 'waveform' ? 'AE波形' : mode === 'spectrum' ? 'FFT频谱' : '声源定位'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                <RefreshCw size={14} /> 刷新
              </button>
              <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-white border border-gray-200 text-slate-600 rounded-lg hover:bg-gray-50">
                <Download size={14} /> 导出
              </button>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-slate-500"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>

          {/* 图表容器 */}
          <div className="flex-1 p-4 min-h-[400px]">
            <ReactECharts 
              option={getChartOption()} 
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
              notMerge={false}
            />
          </div>
        </div>
      </section>

      {/* 右侧面板 - 事件与参数 */}
      <aside className={`lg:col-span-3 flex flex-col gap-4 ${isFullscreen ? 'hidden' : ''}`}>
        {/* 声发射事件 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            声发射事件
          </h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {aeEvents.map((evt, i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-slate-700 text-sm">{evt.channel}</span>
                  <span className="text-[10px] text-slate-400">{evt.time}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs ${evt.level === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>
                    {evt.type}
                  </span>
                  <span className="font-mono text-xs font-medium">{evt.amplitude}</span>
                </div>
                <div className="text-[10px] text-slate-400">持续时间: {evt.duration}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 频谱特征 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Waves size={18} className="text-purple-600" />
            频谱特征
          </h2>
          <div className="space-y-4">
            {[
              { label: '主频率', value: acousticParams.dominantFreq.toFixed(0), unit: 'kHz', color: 'text-slate-800' },
              { label: '带宽', value: acousticParams.bandwidth.toFixed(0), unit: 'kHz', color: 'text-slate-800' },
              { label: '峰值频率', value: '125', unit: 'kHz', color: 'text-purple-600' },
              { label: '谱质心', value: '145', unit: 'kHz', color: 'text-slate-800' },
              { label: '谱峭度', value: '3.2', unit: '', color: 'text-slate-800' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className={`font-mono font-bold ${item.color}`}>
                  {item.value} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-slate-800 mb-3 text-sm">系统工具</h2>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-colors group">
              <Settings size={20} className="text-slate-400 group-hover:text-purple-500 mb-1" />
              <span className="text-xs">阈值设置</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-purple-50 hover:text-purple-600 transition-colors group">
              <Target size={20} className="text-slate-400 group-hover:text-purple-500 mb-1" />
              <span className="text-xs">定位校准</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default AcousticMonitoringPage;
