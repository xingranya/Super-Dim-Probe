import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { 
  Zap, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Settings,
  Maximize2,
  Minimize2,
  Radio,
  Gauge
} from 'lucide-react';

/**
 * 电学监测页面
 * 局部放电(PD)检测与时域反射(TDR)分析
 */
const ElectricalMonitoringPage: React.FC = () => {
  const [activeChannel, setActiveChannel] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'prpd' | 'tdr' | 'trend'>('prpd');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tick, setTick] = useState(0);
  
  // 缓存数据
  const cachedPRPDData = useRef<any>(null);
  const cachedTDRData = useRef<any>(null);

  // 实时数据更新 - 降低刷新频率以提升性能
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000); // 1秒刷新一次
    return () => clearInterval(timer);
  }, []);

  // 传感器通道配置
  const channels = [
    { id: 1, name: 'PD-01', location: '#N1接头', status: 'normal', pdCount: 156 },
    { id: 2, name: 'PD-02', location: '#S2接头', status: 'warning', pdCount: 423 },
    { id: 3, name: 'PD-03', location: '南区变终端', status: 'normal', pdCount: 89 },
    { id: 4, name: 'PD-04', location: '#E1接头', status: 'normal', pdCount: 112 },
  ];

  // 实时电气参数
  const electricalParams = {
    voltage: 108.5 + Math.random() * 2,
    current: 245 + Math.random() * 10,
    powerFactor: 0.92 + Math.random() * 0.03,
    insulationResistance: 1200 + Math.random() * 100,
    tanDelta: 0.0015 + Math.random() * 0.0002,
    temperature: 42.5 + Math.random() * 2,
  };

  // PRPD相位分辨图谱配置
  const getPRPDOption = () => {
    const channel = channels.find(c => c.id === activeChannel);
    const isWarning = channel?.status === 'warning';
    
    // 生成PRPD数据
    let data: number[][] = [];
    
    // 背景噪声
    for (let i = 0; i < 100; i++) {
      data.push([Math.random() * 360, Math.random() * 50, Math.random() * 0.1]);
    }
    
    // 主放电簇 - 根据通道状态生成不同模式
    const patterns = isWarning 
      ? [
          { phase: 45, amp: 180, spread: 25, count: 80 },
          { phase: 135, amp: 220, spread: 30, count: 100 },
          { phase: 225, amp: 160, spread: 25, count: 70 },
          { phase: 315, amp: 200, spread: 30, count: 90 },
        ]
      : [
          { phase: 90, amp: 80, spread: 20, count: 40 },
          { phase: 270, amp: 75, spread: 20, count: 35 },
        ];

    patterns.forEach(pattern => {
      for (let i = 0; i < pattern.count; i++) {
        const phase = pattern.phase + (Math.random() - 0.5) * pattern.spread * 2;
        const amp = pattern.amp * (0.3 + Math.random() * 0.7);
        const intensity = Math.exp(-Math.pow(Math.random(), 2)) * (isWarning ? 0.9 : 0.6);
        data.push([
          (phase + 360) % 360,
          Math.max(0, amp + (Math.random() - 0.5) * 30),
          intensity
        ]);
      }
    });

    return {
      backgroundColor: 'transparent',
      title: {
        text: `PRPD相位分辨局放图谱 - ${channel?.name}`,
        subtext: `位置: ${channel?.location} | 放电次数: ${channel?.pdCount}/min`,
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 'bold' },
        subtextStyle: { color: '#64748b', fontSize: 12 }
      },
      tooltip: {
        formatter: (params: any) => 
          `相位: ${params.value[0].toFixed(1)}°<br/>幅值: ${params.value[1].toFixed(1)} pC<br/>密度: ${(params.value[2] * 100).toFixed(1)}%`
      },
      grid: { top: 70, right: 30, bottom: 80, left: 50, containLabel: true },
      xAxis: {
        type: 'value',
        name: '相位 (°)',
        nameLocation: 'middle',
        nameGap: 35,
        min: 0,
        max: 360,
        splitNumber: 8,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        name: '放电幅值 (pC)',
        nameLocation: 'middle',
        nameGap: 45,
        min: 0,
        max: isWarning ? 300 : 150,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      visualMap: {
        min: 0,
        max: 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 5,
        itemWidth: 12,
        itemHeight: 80,
        text: ['高密度', '低密度'],
        textGap: 8,
        textStyle: { color: '#64748b', fontSize: 11 },
        inRange: {
          color: ['#dbeafe', '#60a5fa', '#2563eb', '#f59e0b', '#ef4444']
        }
      },
      animation: true,
      animationDuration: 800,
      animationEasing: 'cubicInOut',
      series: [{
        type: 'scatter',
        symbolSize: (val: number[]) => Math.max(4, val[2] * 10),
        data: data,
        animationDuration: 800,
        animationEasing: 'cubicInOut'
      }]
    };
  };

  // TDR时域反射图谱配置
  const getTDROption = () => {
    const distance = Array.from({ length: 500 }, (_, i) => i * 2); // 0-1000m
    const signal: number[] = [];
    
    // 模拟TDR信号
    for (let i = 0; i < 500; i++) {
      let val = 0;
      // 发射脉冲
      if (i < 10) val = Math.exp(-i * 0.5) * 100;
      // 接头反射
      if (Math.abs(i - 150) < 5) val += 25 * Math.exp(-Math.pow(i - 150, 2) / 8);
      if (Math.abs(i - 280) < 5) val += 45 * Math.exp(-Math.pow(i - 280, 2) / 8); // 异常反射
      if (Math.abs(i - 380) < 5) val += 20 * Math.exp(-Math.pow(i - 380, 2) / 8);
      // 终端反射
      if (Math.abs(i - 480) < 8) val += 80 * Math.exp(-Math.pow(i - 480, 2) / 15);
      // 噪声
      val += (Math.random() - 0.5) * 3;
      signal.push(val);
    }

    return {
      backgroundColor: 'transparent',
      title: {
        text: 'TDR时域反射分析',
        subtext: '电缆长度: 960m | 传播速度: 172m/μs',
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 'bold' },
        subtextStyle: { color: '#64748b', fontSize: 12 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => 
          `距离: ${params[0].value[0].toFixed(0)} m<br/>反射幅值: ${params[0].value[1].toFixed(2)} mV`
      },
      grid: { top: 70, right: 30, bottom: 50, left: 60, containLabel: true },
      xAxis: {
        type: 'value',
        name: '距离 (m)',
        nameLocation: 'middle',
        nameGap: 30,
        min: 0,
        max: 1000,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        name: '反射幅值 (mV)',
        nameLocation: 'middle',
        nameGap: 45,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      series: [{
        type: 'line',
        data: distance.map((d, i) => [d, signal[i]]),
        smooth: false,
        symbol: 'none',
        lineStyle: { color: '#3b82f6', width: 1.5 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
          ])
        },
        markPoint: {
          symbol: 'pin',
          symbolSize: 40,
          data: [
            { coord: [300, 15], value: '接头#N1', itemStyle: { color: '#10b981' } },
            { coord: [560, 45], value: '异常点', itemStyle: { color: '#ef4444' } },
            { coord: [760, 20], value: '接头#S2', itemStyle: { color: '#10b981' } },
          ]
        },
        markLine: {
          silent: true,
          data: [
            { xAxis: 560, lineStyle: { color: '#ef4444', type: 'dashed' }, label: { formatter: '疑似缺陷 560m' } }
          ]
        }
      }]
    };
  };

  // 放电趋势图配置
  const getTrendOption = () => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const pdCounts = hours.map(() => Math.floor(80 + Math.random() * 100));
    const maxAmps = hours.map(() => 50 + Math.random() * 80);

    return {
      backgroundColor: 'transparent',
      title: {
        text: '24小时放电趋势',
        left: 'center',
        top: 10,
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 'bold' }
      },
      tooltip: { trigger: 'axis' },
      legend: { 
        data: ['放电次数', '最大幅值'], 
        top: 40,
        textStyle: { color: '#64748b' }
      },
      grid: { top: 80, right: 60, bottom: 30, left: 60, containLabel: true },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#cbd5e1' } }
      },
      yAxis: [
        { 
          type: 'value', 
          name: '放电次数 (次/min)',
          axisLine: { lineStyle: { color: '#3b82f6' } },
          splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
        },
        { 
          type: 'value', 
          name: '最大幅值 (pC)',
          axisLine: { lineStyle: { color: '#f59e0b' } },
          splitLine: { show: false }
        }
      ],
      series: [
        {
          name: '放电次数',
          type: 'bar',
          data: pdCounts,
          itemStyle: { 
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#60a5fa' },
              { offset: 1, color: '#3b82f6' }
            ])
          }
        },
        {
          name: '最大幅值',
          type: 'line',
          yAxisIndex: 1,
          data: maxAmps,
          smooth: true,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: { color: '#f59e0b', width: 2 },
          itemStyle: { color: '#f59e0b' }
        }
      ]
    };
  };

  // 获取当前图表配置
  const getChartOption = () => {
    switch (viewMode) {
      case 'prpd': return getPRPDOption();
      case 'tdr': return getTDROption();
      case 'trend': return getTrendOption();
      default: return getPRPDOption();
    }
  };

  // 告警事件列表
  const alarmEvents = [
    { time: '14:35:22', channel: 'PD-02', type: '尖端放电', amplitude: '223 pC', level: 'warning' },
    { time: '14:30:15', channel: 'PD-02', type: '气隙放电', amplitude: '189 pC', level: 'warning' },
    { time: '13:45:08', channel: 'PD-01', type: '表面放电', amplitude: '95 pC', level: 'info' },
    { time: '12:20:33', channel: 'PD-03', type: '噪声干扰', amplitude: '45 pC', level: 'info' },
  ];

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-50 p-6' : 'min-h-[calc(100vh-10rem)]'}`}>
      {/* 左侧面板 - 传感器通道 */}
      <aside className={`lg:col-span-3 flex flex-col gap-4 ${isFullscreen ? 'hidden' : ''}`}>
        {/* 系统状态概览 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Zap size={18} className="text-brand-600" />
            电学监测系统
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">系统电压</div>
              <div className="font-mono font-bold text-slate-800">{electricalParams.voltage.toFixed(1)} kV</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">负载电流</div>
              <div className="font-mono font-bold text-slate-800">{electricalParams.current.toFixed(0)} A</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">功率因数</div>
              <div className="font-mono font-bold text-emerald-600">{electricalParams.powerFactor.toFixed(3)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">介损角tanδ</div>
              <div className="font-mono font-bold text-slate-800">{(electricalParams.tanDelta * 1000).toFixed(2)}‰</div>
            </div>
          </div>
        </div>

        {/* 传感器通道列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Radio size={18} className="text-brand-600" />
            局放传感器
          </h2>
          <div className="space-y-2">
            {channels.map(channel => (
              <div
                key={channel.id}
                onClick={() => setActiveChannel(channel.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeChannel === channel.id
                    ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200'
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
                  <span className="font-mono text-slate-600">{channel.pdCount} 次/min</span>
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
              {(['prpd', 'tdr', 'trend'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
                    viewMode === mode 
                      ? 'bg-white text-brand-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mode === 'prpd' ? 'PRPD图谱' : mode === 'tdr' ? 'TDR分析' : '趋势分析'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-brand-600 text-white rounded-lg hover:bg-brand-700">
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

      {/* 右侧面板 - 告警与参数 */}
      <aside className={`lg:col-span-3 flex flex-col gap-4 ${isFullscreen ? 'hidden' : ''}`}>
        {/* 告警事件 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            放电事件
          </h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {alarmEvents.map((evt, i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-slate-700 text-sm">{evt.channel}</span>
                  <span className="text-[10px] text-slate-400">{evt.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${evt.level === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>
                    {evt.type}
                  </span>
                  <span className="font-mono text-xs font-medium">{evt.amplitude}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 放电统计 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Gauge size={18} className="text-brand-600" />
            放电统计
          </h2>
          <div className="space-y-4">
            {[
              { label: '累计放电量', value: '12.5', unit: 'nC', color: 'text-slate-800' },
              { label: '最大放电幅值', value: '223', unit: 'pC', color: 'text-amber-600' },
              { label: '平均放电幅值', value: '89.5', unit: 'pC', color: 'text-slate-800' },
              { label: '放电重复率', value: '156', unit: '次/min', color: 'text-slate-800' },
              { label: '绝缘电阻', value: electricalParams.insulationResistance.toFixed(0), unit: 'MΩ', color: 'text-emerald-600' },
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
            <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-brand-50 hover:text-brand-600 transition-colors group">
              <Settings size={20} className="text-slate-400 group-hover:text-brand-500 mb-1" />
              <span className="text-xs">阈值设置</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-brand-50 hover:text-brand-600 transition-colors group">
              <Activity size={20} className="text-slate-400 group-hover:text-brand-500 mb-1" />
              <span className="text-xs">诊断报告</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ElectricalMonitoringPage;
