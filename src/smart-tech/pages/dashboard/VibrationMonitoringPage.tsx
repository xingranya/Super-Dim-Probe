import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { 
  Vibrate, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Settings,
  Maximize2,
  Minimize2,
  Radio,
  BarChart3,
  Gauge
} from 'lucide-react';

/**
 * 振动监测页面
 * 接触式超声波传感与振动频谱分析
 */
const VibrationMonitoringPage: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'waveform' | 'spectrum' | 'envelope'>('waveform');
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
    { id: 1, name: 'VIB-01', location: '#N1接头', status: 'normal', rms: 2.35, peak: 8.2 },
    { id: 2, name: 'VIB-02', location: '#S2接头', status: 'warning', rms: 5.82, peak: 18.5 },
    { id: 3, name: 'VIB-03', location: '南区变终端', status: 'normal', rms: 1.98, peak: 6.8 },
    { id: 4, name: 'VIB-04', location: '#E1接头', status: 'normal', rms: 2.12, peak: 7.5 },
  ];

  // 实时振动参数
  const vibrationParams = {
    rms: 5.82 + Math.random() * 0.5,
    peak: 18.5 + Math.random() * 2,
    peakToPeak: 35.2 + Math.random() * 3,
    crestFactor: 3.18 + Math.random() * 0.2,
    kurtosis: 4.25 + Math.random() * 0.3,
    skewness: 0.12 + Math.random() * 0.1,
  };

  // 轴承特征频率配置
  const bearingFreqs = {
    BPFO: 125.5,  // 外圈故障频率
    BPFI: 188.3,  // 内圈故障频率
    BSF: 82.1,    // 滚动体故障频率
    FTF: 12.8,    // 保持架故障频率
    rotorSpeed: 1485, // 转速 RPM
  };

  // 振动波形图配置
  const getWaveformOption = () => {
    const channel = channels.find(c => c.id === activeChannel);
    const isWarning = channel?.status === 'warning';
    
    // 生成振动信号波形
    const time = Array.from({ length: 2000 }, (_, i) => i * 0.05); // 100ms
    const signal: number[] = [];
    
    for (let i = 0; i < 2000; i++) {
      let val = 0;
      const t = i * 0.05; // ms
      
      // 基础振动成分
      val += 2 * Math.sin(2 * Math.PI * 25 * t / 1000); // 25Hz 基频
      val += 1.5 * Math.sin(2 * Math.PI * 50 * t / 1000); // 50Hz 工频
      
      if (isWarning) {
        // 冲击成分
        val += 3 * Math.sin(2 * Math.PI * bearingFreqs.BPFO * t / 1000);
        val += 2 * Math.sin(2 * Math.PI * bearingFreqs.BPFI * t / 1000);
        
        // 周期性冲击
        if (Math.floor(t / 8) % 1 < 0.1) {
          val += 8 * Math.exp(-((t % 8) / 2)) * Math.sin(2 * Math.PI * 500 * t / 1000);
        }
      }
      
      // 白噪声
      val += (Math.random() - 0.5) * 1.5;
      
      signal.push(val);
    }

    return {
      backgroundColor: 'transparent',
      title: {
        text: `振动时域波形 - ${channel?.name}`,
        subtext: `位置: ${channel?.location} | RMS: ${channel?.rms} mm/s | 峰值: ${channel?.peak} mm/s`,
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 'bold' },
        subtextStyle: { color: '#64748b', fontSize: 12 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => 
          `时间: ${params[0].value[0].toFixed(2)} ms<br/>加速度: ${params[0].value[1].toFixed(2)} mm/s`
      },
      grid: { top: 70, right: 30, bottom: 60, left: 60, containLabel: true },
      xAxis: {
        type: 'value',
        name: '时间 (ms)',
        nameLocation: 'middle',
        nameGap: 30,
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        name: '速度 (mm/s)',
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
        lineStyle: { color: '#06b6d4', width: 1 },
        animationDuration: 800,
        animationEasing: 'cubicInOut'
      }]
    };
  };

  // 频谱分析图配置
  const getSpectrumOption = () => {
    const channel = channels.find(c => c.id === activeChannel);
    const isWarning = channel?.status === 'warning';
    
    // 生成频谱数据
    const freq = Array.from({ length: 500 }, (_, i) => i); // 0-500 Hz
    const spectrum: number[] = [];
    
    for (let i = 0; i < 500; i++) {
      let val = 0.5 + Math.random() * 0.3; // 噪底
      
      // 基频及谐波
      const peaks = [
        { f: 25, amp: 35, width: 3 },  // 1X 基频
        { f: 50, amp: 28, width: 3 },  // 2X
        { f: 75, amp: 15, width: 3 },  // 3X
        { f: 100, amp: 10, width: 3 }, // 4X
      ];
      
      if (isWarning) {
        // 轴承故障特征频率
        peaks.push({ f: bearingFreqs.BPFO, amp: 45, width: 4 });
        peaks.push({ f: bearingFreqs.BPFI, amp: 38, width: 4 });
        peaks.push({ f: bearingFreqs.BSF, amp: 25, width: 3 });
        peaks.push({ f: bearingFreqs.BPFO * 2, amp: 22, width: 3 }); // 2x BPFO
      }
      
      peaks.forEach(peak => {
        val += peak.amp * Math.exp(-Math.pow(i - peak.f, 2) / (2 * Math.pow(peak.width, 2)));
      });
      
      spectrum.push(val);
    }

    return {
      backgroundColor: 'transparent',
      title: {
        text: '振动频谱分析',
        subtext: `转速: ${bearingFreqs.rotorSpeed} RPM | 基频: 24.75 Hz`,
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 'bold' },
        subtextStyle: { color: '#64748b', fontSize: 12 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => 
          `频率: ${params[0].value[0].toFixed(1)} Hz<br/>幅值: ${params[0].value[1].toFixed(2)} mm/s`
      },
      grid: { top: 70, right: 30, bottom: 50, left: 60, containLabel: true },
      xAxis: {
        type: 'value',
        name: '频率 (Hz)',
        nameLocation: 'middle',
        nameGap: 30,
        min: 0,
        max: 500,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        name: '幅值 (mm/s)',
        nameLocation: 'middle',
        nameGap: 45,
        min: 0,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      series: [{
        type: 'line',
        data: freq.map((f, i) => [f, spectrum[i]]),
        smooth: false,
        symbol: 'none',
        lineStyle: { color: '#06b6d4', width: 1.5 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(6, 182, 212, 0.4)' },
            { offset: 1, color: 'rgba(6, 182, 212, 0.05)' }
          ])
        },
        markLine: {
          silent: true,
          symbol: 'none',
          data: [
            { xAxis: bearingFreqs.BPFO, lineStyle: { color: '#ef4444', type: 'dashed' }, label: { formatter: 'BPFO', position: 'end' } },
            { xAxis: bearingFreqs.BPFI, lineStyle: { color: '#f59e0b', type: 'dashed' }, label: { formatter: 'BPFI', position: 'end' } },
            { xAxis: bearingFreqs.BSF, lineStyle: { color: '#8b5cf6', type: 'dashed' }, label: { formatter: 'BSF', position: 'end' } },
          ]
        }
      }]
    };
  };

  // 包络谱分析图配置
  const getEnvelopeOption = () => {
    const channel = channels.find(c => c.id === activeChannel);
    const isWarning = channel?.status === 'warning';
    
    // 生成包络谱数据
    const freq = Array.from({ length: 300 }, (_, i) => i); // 0-300 Hz
    const envelope: number[] = [];
    
    for (let i = 0; i < 300; i++) {
      let val = 0.2 + Math.random() * 0.1; // 噪底
      
      if (isWarning) {
        // 轴承故障特征在包络谱中更明显
        const peaks = [
          { f: bearingFreqs.BPFO, amp: 55, width: 2 },
          { f: bearingFreqs.BPFO * 2, amp: 35, width: 2 },
          { f: bearingFreqs.BPFO * 3, amp: 20, width: 2 },
          { f: bearingFreqs.BPFI, amp: 42, width: 2 },
          { f: bearingFreqs.BSF, amp: 28, width: 2 },
          { f: bearingFreqs.FTF, amp: 15, width: 1.5 },
        ];
        
        peaks.forEach(peak => {
          val += peak.amp * Math.exp(-Math.pow(i - peak.f, 2) / (2 * Math.pow(peak.width, 2)));
        });
      } else {
        // 正常状态低幅值
        if (Math.abs(i - 25) < 3) val += 8 * Math.exp(-Math.pow(i - 25, 2) / 4);
      }
      
      envelope.push(val);
    }

    return {
      backgroundColor: 'transparent',
      title: {
        text: '包络谱分析 (Hilbert解调)',
        subtext: '用于早期轴承故障检测',
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 'bold' },
        subtextStyle: { color: '#64748b', fontSize: 12 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => 
          `频率: ${params[0].value[0].toFixed(1)} Hz<br/>包络幅值: ${params[0].value[1].toFixed(2)}`
      },
      grid: { top: 70, right: 30, bottom: 50, left: 60, containLabel: true },
      xAxis: {
        type: 'value',
        name: '频率 (Hz)',
        nameLocation: 'middle',
        nameGap: 30,
        min: 0,
        max: 300,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        name: '包络幅值',
        nameLocation: 'middle',
        nameGap: 45,
        min: 0,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      series: [{
        type: 'bar',
        data: freq.map((f, i) => [f, envelope[i]]),
        barWidth: 2,
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: '#a855f7' },
            { offset: 1, color: '#6366f1' }
          ])
        }
      }]
    };
  };

  // 获取当前图表配置
  const getChartOption = () => {
    switch (viewMode) {
      case 'waveform': return getWaveformOption();
      case 'spectrum': return getSpectrumOption();
      case 'envelope': return getEnvelopeOption();
      default: return getWaveformOption();
    }
  };

  // 振动事件列表
  const vibrationEvents = [
    { time: '14:35:22', channel: 'VIB-02', type: '轴承磨损', severity: '中等', rms: '5.82 mm/s', level: 'warning' },
    { time: '14:28:15', channel: 'VIB-02', type: 'BPFO特征', severity: '轻微', rms: '4.25 mm/s', level: 'warning' },
    { time: '13:45:08', channel: 'VIB-01', type: '不平衡', severity: '轻微', rms: '2.35 mm/s', level: 'info' },
    { time: '12:20:33', channel: 'VIB-03', type: '松动', severity: '轻微', rms: '1.98 mm/s', level: 'info' },
  ];

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-50 p-6' : 'min-h-[calc(100vh-10rem)]'}`}>
      {/* 左侧面板 - 传感器通道 */}
      <aside className={`lg:col-span-3 flex flex-col gap-4 ${isFullscreen ? 'hidden' : ''}`}>
        {/* 系统状态概览 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Vibrate size={18} className="text-cyan-600" />
            振动监测系统
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">RMS速度</div>
              <div className="font-mono font-bold text-slate-800">{vibrationParams.rms.toFixed(2)} mm/s</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">峰值</div>
              <div className="font-mono font-bold text-amber-600">{vibrationParams.peak.toFixed(1)} mm/s</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">峰峰值</div>
              <div className="font-mono font-bold text-slate-800">{vibrationParams.peakToPeak.toFixed(1)} mm/s</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">波峰因子</div>
              <div className="font-mono font-bold text-slate-800">{vibrationParams.crestFactor.toFixed(2)}</div>
            </div>
          </div>
        </div>

        {/* 传感器通道列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Radio size={18} className="text-cyan-600" />
            振动传感器
          </h2>
          <div className="space-y-2">
            {channels.map(channel => (
              <div
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeChannel === channel.id
                    ? 'bg-cyan-50 border-cyan-200 ring-1 ring-cyan-200'
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
                  <span className={`font-mono ${channel.rms > 4 ? 'text-amber-600' : 'text-slate-600'}`}>
                    {channel.rms} mm/s
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      channel.rms > 5 ? 'bg-red-500' : channel.rms > 3 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (channel.rms / 10) * 100)}%` }}
                  />
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
              {(['waveform', 'spectrum', 'envelope'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
                    viewMode === mode 
                      ? 'bg-white text-cyan-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mode === 'waveform' ? '时域波形' : mode === 'spectrum' ? '频谱分析' : '包络谱'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-cyan-600 text-white rounded-lg hover:bg-cyan-700">
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

      {/* 右侧面板 - 事件与分析 */}
      <aside className={`lg:col-span-3 flex flex-col gap-4 ${isFullscreen ? 'hidden' : ''}`}>
        {/* 振动事件 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            振动异常
          </h2>
          <div className="space-y-2 max-h-[280px] overflow-y-auto">
            {vibrationEvents.map((evt, i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-slate-700 text-sm">{evt.channel}</span>
                  <span className="text-[10px] text-slate-400">{evt.time}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs ${evt.level === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>
                    {evt.type}
                  </span>
                  <span className="font-mono text-xs font-medium">{evt.rms}</span>
                </div>
                <div className="flex justify-end">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    evt.severity === '中等' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    {evt.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 轴承特征频率 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-cyan-600" />
            轴承特征频率
          </h2>
          <div className="space-y-3 text-sm">
            {[
              { label: 'BPFO (外圈)', value: bearingFreqs.BPFO, unit: 'Hz', status: 'warning' },
              { label: 'BPFI (内圈)', value: bearingFreqs.BPFI, unit: 'Hz', status: 'normal' },
              { label: 'BSF (滚动体)', value: bearingFreqs.BSF, unit: 'Hz', status: 'normal' },
              { label: 'FTF (保持架)', value: bearingFreqs.FTF, unit: 'Hz', status: 'normal' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-slate-500">{item.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full ${
                    item.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />
                  <span className="font-mono font-bold text-slate-800">
                    {item.value} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 振动指标 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Gauge size={18} className="text-cyan-600" />
            振动指标
          </h2>
          <div className="space-y-3">
            {[
              { label: '峭度', value: vibrationParams.kurtosis.toFixed(2), threshold: 3.5, color: vibrationParams.kurtosis > 3.5 ? 'text-amber-600' : 'text-slate-800' },
              { label: '偏度', value: vibrationParams.skewness.toFixed(2), threshold: 0.5, color: 'text-slate-800' },
              { label: '裕度因子', value: '1.42', threshold: 2.0, color: 'text-slate-800' },
              { label: '脉冲因子', value: '3.85', threshold: 4.0, color: 'text-slate-800' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-500">{item.label}</span>
                <span className={`font-mono font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 快捷操作 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-slate-800 mb-3 text-sm">系统工具</h2>
          <div className="grid grid-cols-2 gap-2">
            <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-cyan-50 hover:text-cyan-600 transition-colors group">
              <Settings size={20} className="text-slate-400 group-hover:text-cyan-500 mb-1" />
              <span className="text-xs">阈值设置</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-cyan-50 hover:text-cyan-600 transition-colors group">
              <Activity size={20} className="text-slate-400 group-hover:text-cyan-500 mb-1" />
              <span className="text-xs">诊断报告</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default VibrationMonitoringPage;
