import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { 
  Thermometer, 
  Activity, 
  AlertTriangle, 
  RefreshCw, 
  Download, 
  Settings,
  Maximize2,
  Minimize2,
  Radio,
  TrendingUp,
  MapPin
} from 'lucide-react';

/**
 * 热学监测页面
 * 分布式温度传感(DTS)与热异常检测
 */
const ThermalMonitoringPage: React.FC = () => {
  const [activeZone, setActiveZone] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'heatmap' | 'trend' | 'gradient'>('heatmap');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tick, setTick] = useState(0);

  // 实时数据更新 - 降低刷新频率以提升性能
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000); // 1秒刷新一次
    return () => clearInterval(timer);
  }, []);

  // 监测区域配置
  const zones = [
    { id: 1, name: '北区段', range: '0-300m', status: 'normal', maxTemp: 42.5, avgTemp: 38.2 },
    { id: 2, name: '中心枢纽', range: '300-400m', status: 'warning', maxTemp: 58.3, avgTemp: 45.6 },
    { id: 3, name: '南区段', range: '400-700m', status: 'normal', maxTemp: 44.1, avgTemp: 39.8 },
    { id: 4, name: '东区段', range: '700-960m', status: 'normal', maxTemp: 41.8, avgTemp: 37.5 },
  ];

  // 实时热学参数
  const thermalParams = {
    maxTemp: 58.3 + Math.random() * 2,
    minTemp: 32.5 + Math.random(),
    avgTemp: 42.8 + Math.random() * 2,
    ambientTemp: 25.5 + Math.random(),
    maxGradient: 2.8 + Math.random() * 0.5,
    hotspotCount: 2,
  };

  // 温度分布热力图配置
  const getHeatmapOption = () => {
    // 生成电缆温度分布数据
    const data: number[][] = [];
    const xLen = 96; // 电缆长度分段
    const yLen = 12; // 圆周方向分段
    
    for (let x = 0; x < xLen; x++) {
      for (let y = 0; y < yLen; y++) {
        let temp = 35 + Math.random() * 5; // 基础温度
        
        // 热点区域
        if (x >= 30 && x <= 40) {
          const dist = Math.abs(x - 35);
          temp += 20 * Math.exp(-dist * dist / 20);
          if (y >= 4 && y <= 8) temp += 5;
        }
        if (x >= 55 && x <= 60) {
          const dist = Math.abs(x - 57);
          temp += 10 * Math.exp(-dist * dist / 15);
        }
        
        data.push([x, y, parseFloat(temp.toFixed(1))]);
      }
    }

    return {
      backgroundColor: 'transparent',
      title: {
        text: '电缆温度分布热力图',
        subtext: `电缆长度: 960m | 最高温度: ${thermalParams.maxTemp.toFixed(1)}°C | 热点数: ${thermalParams.hotspotCount}`,
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 'bold' },
        subtextStyle: { color: '#64748b', fontSize: 12 }
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => 
          `位置: ${(params.value[0] * 10).toFixed(0)}m<br/>角度: ${(params.value[1] * 30).toFixed(0)}°<br/>温度: ${params.value[2]}°C`
      },
      grid: { top: 70, right: 80, bottom: 50, left: 60, containLabel: true },
      xAxis: {
        type: 'category',
        data: Array.from({ length: xLen }, (_, i) => (i * 10).toString()),
        name: '电缆位置 (m)',
        nameLocation: 'middle',
        nameGap: 30,
        splitArea: { show: true },
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { 
          interval: 9,
          color: '#64748b'
        }
      },
      yAxis: {
        type: 'category',
        data: Array.from({ length: yLen }, (_, i) => `${i * 30}°`),
        name: '圆周角度',
        nameLocation: 'middle',
        nameGap: 40,
        splitArea: { show: true },
        axisLine: { lineStyle: { color: '#cbd5e1' } }
      },
      visualMap: {
        min: 30,
        max: 65,
        calculable: true,
        orient: 'vertical',
        right: 10,
        top: 'center',
        itemHeight: 150,
        text: ['高温', '低温'],
        textStyle: { color: '#64748b' },
        inRange: {
          color: ['#3b82f6', '#10b981', '#84cc16', '#eab308', '#f97316', '#ef4444']
        }
      },
      series: [{
        type: 'heatmap',
        data: data,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        }
      }]
    };
  };

  // 温度趋势图配置
  const getTrendOption = () => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    const maxTemps = hours.map((_, i) => 40 + 15 * Math.sin(i * Math.PI / 12) + Math.random() * 3);
    const avgTemps = hours.map((_, i) => 35 + 8 * Math.sin(i * Math.PI / 12) + Math.random() * 2);
    const ambientTemps = hours.map((_, i) => 22 + 6 * Math.sin(i * Math.PI / 12) + Math.random());

    return {
      backgroundColor: 'transparent',
      title: {
        text: '24小时温度趋势',
        subtext: '最高温度 | 平均温度 | 环境温度',
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 'bold' },
        subtextStyle: { color: '#64748b', fontSize: 12 }
      },
      tooltip: { trigger: 'axis' },
      legend: { 
        data: ['最高温度', '平均温度', '环境温度', '告警阈值'], 
        top: 50,
        textStyle: { color: '#64748b' }
      },
      grid: { top: 90, right: 30, bottom: 30, left: 50, containLabel: true },
      xAxis: {
        type: 'category',
        data: hours,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        boundaryGap: false
      },
      yAxis: {
        type: 'value',
        name: '温度 (°C)',
        min: 15,
        max: 70,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      series: [
        {
          name: '最高温度',
          type: 'line',
          data: maxTemps,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#ef4444', width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(239, 68, 68, 0.2)' },
              { offset: 1, color: 'rgba(239, 68, 68, 0)' }
            ])
          }
        },
        {
          name: '平均温度',
          type: 'line',
          data: avgTemps,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#f59e0b', width: 2 }
        },
        {
          name: '环境温度',
          type: 'line',
          data: ambientTemps,
          smooth: true,
          symbol: 'none',
          lineStyle: { color: '#10b981', width: 2, type: 'dashed' }
        },
        {
          name: '告警阈值',
          type: 'line',
          data: hours.map(() => 55),
          symbol: 'none',
          lineStyle: { color: '#ef4444', width: 1, type: 'dotted' }
        }
      ]
    };
  };

  // 温度梯度图配置
  const getGradientOption = () => {
    const position = Array.from({ length: 96 }, (_, i) => i * 10);
    const gradient: number[] = [];
    
    for (let i = 0; i < 96; i++) {
      let val = 0.5 + Math.random() * 0.3; // 基础梯度
      
      // 异常梯度区域
      if (i >= 30 && i <= 40) {
        val += 2.5 * Math.exp(-Math.pow(i - 35, 2) / 20);
      }
      if (i >= 55 && i <= 60) {
        val += 1.5 * Math.exp(-Math.pow(i - 57, 2) / 15);
      }
      
      gradient.push(parseFloat(val.toFixed(2)));
    }

    return {
      backgroundColor: 'transparent',
      title: {
        text: '沿线温度梯度分析',
        subtext: `最大梯度: ${thermalParams.maxGradient.toFixed(2)} °C/m | 异常阈值: 2.0 °C/m`,
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16, fontWeight: 'bold' },
        subtextStyle: { color: '#64748b', fontSize: 12 }
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => 
          `位置: ${params[0].value[0].toFixed(0)} m<br/>温度梯度: ${params[0].value[1].toFixed(2)} °C/m`
      },
      grid: { top: 70, right: 30, bottom: 50, left: 60, containLabel: true },
      xAxis: {
        type: 'value',
        name: '电缆位置 (m)',
        nameLocation: 'middle',
        nameGap: 30,
        min: 0,
        max: 960,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        name: '温度梯度 (°C/m)',
        nameLocation: 'middle',
        nameGap: 50,
        min: 0,
        max: 4,
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        splitLine: { lineStyle: { type: 'dashed', color: '#e2e8f0' } }
      },
      series: [{
        type: 'line',
        data: position.map((p, i) => [p, gradient[i]]),
        smooth: true,
        symbol: 'none',
        lineStyle: { color: '#f97316', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(249, 115, 22, 0.4)' },
            { offset: 1, color: 'rgba(249, 115, 22, 0.05)' }
          ])
        },
        markLine: {
          silent: true,
          data: [
            { yAxis: 2.0, lineStyle: { color: '#ef4444', type: 'dashed' }, label: { formatter: '告警阈值 2.0°C/m' } }
          ]
        },
        markArea: {
          silent: true,
          data: [
            [
              { xAxis: 300, itemStyle: { color: 'rgba(239, 68, 68, 0.1)' } },
              { xAxis: 400, yAxis: 4 }
            ]
          ]
        }
      }]
    };
  };

  // 获取当前图表配置
  const getChartOption = () => {
    switch (viewMode) {
      case 'heatmap': return getHeatmapOption();
      case 'trend': return getTrendOption();
      case 'gradient': return getGradientOption();
      default: return getHeatmapOption();
    }
  };

  // 温度告警列表
  const thermalAlarms = [
    { time: '14:35:22', zone: '中心枢纽', type: '超温告警', value: '58.3°C', status: '未处理', level: 'warning' },
    { time: '14:20:15', zone: '中心枢纽', type: '梯度异常', value: '2.8°C/m', status: '已确认', level: 'warning' },
    { time: '13:45:08', zone: '南区段', type: '温度上升', value: '+3.5°C', status: '已处理', level: 'info' },
    { time: '12:10:33', zone: '北区段', type: '温度波动', value: '±2.1°C', status: '已处理', level: 'info' },
  ];

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-50 p-6' : 'min-h-[calc(100vh-10rem)]'}`}>
      {/* 左侧面板 - 区域监测 */}
      <aside className={`lg:col-span-3 flex flex-col gap-4 ${isFullscreen ? 'hidden' : ''}`}>
        {/* 系统状态概览 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Thermometer size={18} className="text-orange-600" />
            热学监测系统
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">最高温度</div>
              <div className="font-mono font-bold text-red-600">{thermalParams.maxTemp.toFixed(1)}°C</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">最低温度</div>
              <div className="font-mono font-bold text-blue-600">{thermalParams.minTemp.toFixed(1)}°C</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">平均温度</div>
              <div className="font-mono font-bold text-slate-800">{thermalParams.avgTemp.toFixed(1)}°C</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500">环境温度</div>
              <div className="font-mono font-bold text-emerald-600">{thermalParams.ambientTemp.toFixed(1)}°C</div>
            </div>
          </div>
        </div>

        {/* 区域列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <MapPin size={18} className="text-orange-600" />
            监测区域
          </h2>
          <div className="space-y-2">
            {zones.map(zone => (
              <div
                key={zone.id}
                onClick={() => setActiveZone(zone.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all ${
                  activeZone === zone.id
                    ? 'bg-orange-50 border-orange-200 ring-1 ring-orange-200'
                    : 'bg-white border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700 text-sm">{zone.name}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    zone.status === 'normal' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
                  }`} />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{zone.range}</span>
                  <span className={`font-mono ${zone.maxTemp > 50 ? 'text-red-600' : 'text-slate-600'}`}>
                    {zone.maxTemp}°C
                  </span>
                </div>
                <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all ${
                      zone.maxTemp > 55 ? 'bg-red-500' : zone.maxTemp > 45 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, (zone.maxTemp / 70) * 100)}%` }}
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
              {(['heatmap', 'trend', 'gradient'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-xs font-medium rounded-md transition-all ${
                    viewMode === mode 
                      ? 'bg-white text-orange-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {mode === 'heatmap' ? '热力分布' : mode === 'trend' ? '温度趋势' : '梯度分析'}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-600 text-white rounded-lg hover:bg-orange-700">
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

      {/* 右侧面板 - 告警与分析 */}
      <aside className={`lg:col-span-3 flex flex-col gap-4 ${isFullscreen ? 'hidden' : ''}`}>
        {/* 温度告警 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            温度告警
          </h2>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {thermalAlarms.map((alarm, i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-slate-700 text-sm">{alarm.zone}</span>
                  <span className="text-[10px] text-slate-400">{alarm.time}</span>
                </div>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs ${alarm.level === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>
                    {alarm.type}
                  </span>
                  <span className="font-mono text-xs font-medium">{alarm.value}</span>
                </div>
                <div className="flex justify-end">
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                    alarm.status === '未处理' ? 'bg-red-100 text-red-600' : 
                    alarm.status === '已确认' ? 'bg-amber-100 text-amber-600' : 'bg-emerald-100 text-emerald-600'
                  }`}>
                    {alarm.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 热点分析 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-orange-600" />
            热点分析
          </h2>
          <div className="space-y-4">
            {[
              { label: '热点数量', value: thermalParams.hotspotCount.toString(), unit: '个', color: 'text-red-600' },
              { label: '最大梯度', value: thermalParams.maxGradient.toFixed(2), unit: '°C/m', color: 'text-amber-600' },
              { label: '温差范围', value: (thermalParams.maxTemp - thermalParams.minTemp).toFixed(1), unit: '°C', color: 'text-slate-800' },
              { label: '载流裕度', value: '15.2', unit: '%', color: 'text-emerald-600' },
              { label: '预测寿命', value: '28.5', unit: '年', color: 'text-slate-800' },
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
            <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors group">
              <Settings size={20} className="text-slate-400 group-hover:text-orange-500 mb-1" />
              <span className="text-xs">阈值设置</span>
            </button>
            <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-orange-50 hover:text-orange-600 transition-colors group">
              <Activity size={20} className="text-slate-400 group-hover:text-orange-500 mb-1" />
              <span className="text-xs">热分析报告</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
};

export default ThermalMonitoringPage;
