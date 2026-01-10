import React, { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import { RefreshCw, Download, Filter } from 'lucide-react';

const XLPEAnalysisPage: React.FC = () => {
  const [stateType, setStateType] = useState('normal');
  const [defectType, setDefectType] = useState('void');
  const [sensorId, setSensorId] = useState('1');
  const [voltageLevel, setVoltageLevel] = useState('35kV');
  
  // 缓存数据以保持连续性
  const cachedTFData = useRef<any>(null);
  const cachedPRDRData = useRef<any>(null);

  // 状态类型映射
  const stateTypeNames: Record<string, string> = {
    'normal': '正常状态',
    'early-aging': '初期老化',
    'medium-aging': '中期老化',
    'severe-aging': '严重老化',
    'critical': '临界状态'
  };

  // 缺陷类型映射
  const defectTypeNames: Record<string, string> = {
    'void': '气隙缺陷',
    'protrusion': '尖端放电',
    'surface': '表面放电',
    'water-tree': '水树缺陷',
    'electrical-tree': '电树缺陷'
  };

  // 生成 TF-Map 数据
  const getTFMapOption = () => {
    const statePatterns: any = {
      'normal': { centers: [[5, 0.5]], spreadX: [2], spreadY: [0.3], intensity: 0.3 },
      'early-aging': { centers: [[5, 0.5], [8, 1.2]], spreadX: [2, 2], spreadY: [0.3, 0.4], intensity: 0.5 },
      'medium-aging': { centers: [[5, 0.5], [8, 1.2], [12, 2.0]], spreadX: [2, 2.5, 3], spreadY: [0.3, 0.4, 0.6], intensity: 0.7 },
      'severe-aging': { centers: [[5, 0.5], [8, 1.2], [12, 2.0], [15, 3.0]], spreadX: [2, 2.5, 3, 3.5], spreadY: [0.3, 0.4, 0.6, 0.8], intensity: 0.85 },
      'critical': { centers: [[5, 0.5], [8, 1.2], [12, 2.0], [15, 3.0], [18, 4.0]], spreadX: [2, 2.5, 3, 3.5, 4], spreadY: [0.3, 0.4, 0.6, 0.8, 1.0], intensity: 1.0 }
    };

    const sensorAdjustment: any = {
      '1': { intensityMult: 1.0, noiseMult: 1.0 },
      '2': { intensityMult: 1.1, noiseMult: 0.9 },
      '3': { intensityMult: 0.9, noiseMult: 1.1 },
      '4': { intensityMult: 1.05, noiseMult: 0.95 }
    };

    const pattern = statePatterns[stateType];
    const adjustment = sensorAdjustment[sensorId];

    let data = [];
    if (cachedTFData.current && cachedTFData.current.state === stateType && cachedTFData.current.sensor === sensorId) {
      data = cachedTFData.current.data.map((pt: number[]) => [
        Math.max(0, Math.min(20, pt[0] + (Math.random() - 0.5) * 0.3)),
        Math.max(0, Math.min(5, pt[1] + (Math.random() - 0.5) * 0.05)),
        Math.max(0, Math.min(1, pt[2] + (Math.random() - 0.5) * 0.03))
      ]).filter((pt: number[]) => pt[2] > 0.01);
    } else {
      for (let i = 0; i < 200; i++) {
        const time = Math.random() * 20;
        const freq = Math.random() * 5;
        const value = Math.random() * 0.05 * adjustment.noiseMult;
        if (value > 0.01) data.push([time, freq, value]);
      }

      pattern.centers.forEach((center: number[], idx: number) => {
        const cx = center[0], cy = center[1];
        const sx = pattern.spreadX[idx], sy = pattern.spreadY[idx];
        
        for (let i = 0; i < 150; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const radius = Math.sqrt(-2 * Math.log(Math.random()));
          const dx = radius * Math.cos(angle) * sx;
          const dy = radius * Math.sin(angle) * sy;

          let x = Math.max(0, Math.min(20, cx + dx));
          let y = Math.max(0, Math.min(5, cy + dy));

          const dist = Math.sqrt(dx * dx / (sx * sx) + dy * dy / (sy * sy));
          let value = adjustment.intensityMult * pattern.intensity * Math.exp(-dist * dist / 2);
          value += (Math.random() - 0.5) * 0.05;
          value = Math.max(0, Math.min(1, value));

          if (value > 0.02) data.push([x, y, value]);
        }
      });
    }

    cachedTFData.current = { state: stateType, sensor: sensorId, data };

    return {
      backgroundColor: 'transparent',
      title: {
        text: `电缆状态时频图谱 - ${stateTypeNames[stateType]}`,
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16 }
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => `时间: ${params.value[0].toFixed(2)}ms<br/>频率: ${params.value[1].toFixed(2)}MHz<br/>强度: ${(params.value[2] * 100).toFixed(1)}%`
      },
      grid: { top: 40, right: 20, bottom: 90, left: 40, containLabel: true },
      xAxis: {
        type: 'value',
        name: '时间 (ms)',
        nameLocation: 'middle',
        nameGap: 30,
        min: 0,
        max: 20,
        splitLine: { lineStyle: { type: 'dashed' } }
      },
      yAxis: {
        type: 'value',
        name: '频率 (MHz)',
        nameLocation: 'middle',
        nameGap: 35,
        min: 0,
        max: 5,
        splitLine: { lineStyle: { type: 'dashed' } }
      },
      visualMap: {
        min: 0,
        max: 1,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemWidth: 15,
        itemHeight: 100,
        text: ['高', '低'],
        textGap: 10,
        inRange: {
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        }
      },
      series: [{
        type: 'scatter',
        symbolSize: 6,
        data: data,
        animationDuration: 800,
        animationEasing: 'cubicInOut'
      }]
    };
  };

  // 生成 PRDR 数据
  const getPRDROption = () => {
    const defectPatterns: any = {
      'void': { centers: [[90, 300], [270, 300]], spreadPhase: [25], spreadAmp: [80], maxAmp: 500, intensity: 0.8 },
      'protrusion': { centers: [[60, 400], [240, 400]], spreadPhase: [25], spreadAmp: [120], maxAmp: 800, intensity: 0.9 },
      'surface': { centers: [[90, 600], [270, 600]], spreadPhase: [70], spreadAmp: [180], maxAmp: 1000, intensity: 0.7 },
      'water-tree': { centers: [[120, 120], [240, 120], [30, 80], [330, 80]], spreadPhase: [50, 50, 40, 40], spreadAmp: [30, 30, 25, 25], maxAmp: 200, intensity: 0.6 },
      'electrical-tree': { centers: [[90, 300], [270, 300], [180, 200]], spreadPhase: [40, 40, 30], spreadAmp: [100, 100, 80], maxAmp: 600, intensity: 0.75 }
    };

    const sensorAdjustment: any = {
      '1': { maxAmpMult: 1.0, intensityMult: 1.0 },
      '2': { maxAmpMult: 1.2, intensityMult: 0.9 },
      '3': { maxAmpMult: 0.9, intensityMult: 1.1 },
      '4': { maxAmpMult: 1.1, intensityMult: 0.8 }
    };

    const pattern = defectPatterns[defectType];
    const adj = sensorAdjustment[sensorId];
    const maxAmp = pattern.maxAmp * adj.maxAmpMult;
    const intensity = pattern.intensity * adj.intensityMult;

    let data = [];
    if (cachedPRDRData.current && cachedPRDRData.current.defect === defectType && cachedPRDRData.current.sensor === sensorId) {
      data = cachedPRDRData.current.data.map((pt: number[]) => [
        (pt[0] + (Math.random() - 0.5) * 3 + 360) % 360,
        Math.max(0, pt[1] + (Math.random() - 0.5) * 10),
        Math.max(0, Math.min(1, pt[2] + (Math.random() - 0.5) * 0.02))
      ]).filter((pt: number[]) => pt[2] > 0.02);
    } else {
      for (let i = 0; i < 150; i++) {
        data.push([Math.random() * 360, Math.random() * maxAmp * 0.2, Math.random() * 0.2]);
      }

      pattern.centers.forEach((center: number[], idx: number) => {
        const sPhase = pattern.spreadPhase[Math.min(idx, pattern.spreadPhase.length - 1)];
        const sAmp = pattern.spreadAmp[Math.min(idx, pattern.spreadAmp.length - 1)];

        for (let i = 0; i < 120; i++) {
          const angle = Math.random() * 2 * Math.PI;
          const r = Math.sqrt(-2 * Math.log(Math.random()));
          let phaseOffset = r * Math.cos(angle) * sPhase;
          let ampOffset = r * Math.sin(angle) * sAmp;

          let phase = ((center[0] + phaseOffset + 360) % 360);
          let amp = Math.max(0, Math.min(maxAmp, center[1] + ampOffset));
          
          const dPhase = Math.min(Math.abs(phaseOffset), 360 - Math.abs(phaseOffset)) / sPhase;
          const dAmp = Math.abs(ampOffset) / sAmp;
          const dist = Math.sqrt(dPhase * dPhase + dAmp * dAmp);

          let val = intensity * Math.exp(-dist * dist / 2);
          val += (Math.random() - 0.5) * 0.1;
          val = Math.max(0, Math.min(1, val));

          if (val > 0.05) data.push([phase, amp, val]);
        }
      });
    }

    cachedPRDRData.current = { defect: defectType, sensor: sensorId, data };

    return {
      backgroundColor: 'transparent',
      title: {
        text: `缺陷相位分辨图谱 - ${defectTypeNames[defectType]}`,
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16 }
      },
      tooltip: {
        position: 'top',
        formatter: (params: any) => `相位: ${params.value[0].toFixed(1)}°<br/>幅值: ${params.value[1].toFixed(1)}pC<br/>强度: ${(params.value[2] * 100).toFixed(1)}%`
      },
      grid: { top: 40, right: 20, bottom: 90, left: 40, containLabel: true },
      xAxis: {
        type: 'value',
        name: '相位 (°)',
        nameLocation: 'middle',
        nameGap: 30,
        min: 0,
        max: 360,
        splitLine: { lineStyle: { type: 'dashed' } }
      },
      yAxis: {
        type: 'value',
        name: '幅值 (pC)',
        nameLocation: 'middle',
        nameGap: 35,
        min: 0,
        max: maxAmp * 1.2,
        splitLine: { lineStyle: { type: 'dashed' } }
      },
      visualMap: {
        min: 0,
        max: intensity,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemWidth: 15,
        itemHeight: 100,
        text: ['高', '低'],
        textGap: 10,
        inRange: {
          color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8', '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
        }
      },
      series: [{
        type: 'scatter',
        symbolSize: 6,
        data: data,
        animationDuration: 800,
        animationEasing: 'cubicInOut'
      }]
    };
  };

  // 生成分类结果数据
  const getClassificationOption = () => {
    const defectProbabilities: any = {
      'void': [99.7, 0.1, 0.1, 0.05, 0.05],
      'protrusion': [0.2, 99.5, 0.1, 0.1, 0.1],
      'surface': [0.2, 0.1, 99.3, 0.2, 0.2],
      'water-tree': [0.1, 0.1, 0.2, 99.4, 0.2],
      'electrical-tree': [0.1, 0.1, 0.1, 0.1, 99.6]
    };

    const featureImportance: any = {
      'void': [85, 92, 78, 65, 70],
      'protrusion': [75, 88, 95, 70, 65],
      'surface': [70, 95, 65, 60, 80],
      'water-tree': [60, 70, 75, 90, 85],
      'electrical-tree': [75, 80, 85, 75, 90]
    };

    return {
      backgroundColor: 'transparent',
      title: {
        text: `缺陷分类结果与特征重要性`,
        left: 'center',
        textStyle: { color: '#334155', fontSize: 16 }
      },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['分类概率 (%)', '特征重要性 (%)'], top: 30, textStyle: { color: '#64748b' } },
      grid: { top: 70, right: 40, bottom: 30, left: 40, containLabel: true },
      xAxis: {
        type: 'category',
        data: ['气隙缺陷', '尖端放电', '表面放电', '水树缺陷', '电树缺陷'],
        axisLine: { lineStyle: { color: '#cbd5e1' } },
        axisLabel: { color: '#64748b', rotate: 30, interval: 0 }
      },
      yAxis: [
        { type: 'value', name: '分类概率 (%)', min: 0, max: 100, splitLine: { lineStyle: { type: 'dashed' } } },
        { type: 'value', name: '特征重要性 (%)', min: 0, max: 100, splitLine: { show: false } }
      ],
      series: [
        {
          name: '分类概率 (%)',
          type: 'bar',
          data: defectProbabilities[defectType],
          itemStyle: {
            color: (params: any) => {
              const types = ['void', 'protrusion', 'surface', 'water-tree', 'electrical-tree'];
              return params.dataIndex === types.indexOf(defectType) 
                ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#f87171' }, { offset: 1, color: '#ef4444' }])
                : new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#60a5fa' }, { offset: 1, color: '#3b82f6' }]);
            }
          }
        },
        {
          name: '特征重要性 (%)',
          type: 'line',
          yAxisIndex: 1,
          data: featureImportance[defectType],
          symbol: 'circle',
          symbolSize: 8,
          lineStyle: { width: 3, color: '#34d399' },
          itemStyle: { color: '#34d399' }
        }
      ]
    };
  };

  // 动画驱动 - 1秒刷新一次实现平滑动画
  const [tick, setTick] = useState(0);

  // 自动刷新动画
  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000); // 1秒刷新一次
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* 控制面板 */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">电缆状态</label>
              <select 
                value={stateType}
                onChange={(e) => setStateType(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {Object.entries(stateTypeNames).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">缺陷类型</label>
              <select 
                value={defectType}
                onChange={(e) => setDefectType(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {Object.entries(defectTypeNames).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">传感器编号</label>
              <select 
                value={sensorId}
                onChange={(e) => setSensorId(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {[1, 2, 3, 4].map(id => (
                  <option key={id} value={id}>五维公路传感器{id}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-slate-500">电压等级</label>
              <select 
                value={voltageLevel}
                onChange={(e) => setVoltageLevel(e.target.value)}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {['10kV', '35kV', '110kV', '220kV'].map(v => (
                  <option key={v} value={v}>{v}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors">
              <RefreshCw size={16} /> 更新分析
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg hover:bg-gray-50 transition-colors">
              <Download size={16} /> 导出数据
            </button>
          </div>
        </div>
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-[400px]">
          <ReactECharts option={getTFMapOption()} style={{ height: '100%', width: '100%' }} notMerge={false} />
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-[400px]">
          <ReactECharts option={getPRDROption()} style={{ height: '100%', width: '100%' }} notMerge={false} />
        </div>
      </div>

      {/* 分类结果 */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-[400px]">
        <ReactECharts option={getClassificationOption()} style={{ height: '100%', width: '100%' }} notMerge={false} />
      </div>

      {/* 特征表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-slate-800">特征提取与分类结果</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-3">特征</th>
                <th className="px-6 py-3">气隙缺陷</th>
                <th className="px-6 py-3">尖端放电</th>
                <th className="px-6 py-3">表面放电</th>
                <th className="px-6 py-3">水树缺陷</th>
                <th className="px-6 py-3">电树缺陷</th>
                <th className="px-6 py-3 text-brand-600">当前缺陷</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { name: '放电幅值(pC)', values: ['100-500', '200-800', '300-1000', '50-200', '150-600'], current: '120' },
                { name: '相位分布(°)', values: ['60-120, 240-300', '30-90, 210-270', '0-180, 180-360', '不规则', '45-135, 225-315'], current: '不规则' },
                { name: '频率特征(MHz)', values: ['0.5-5', '1-10', '0.1-2', '0.05-1', '0.2-3'], current: '0.3' },
                { name: '脉冲重复率(Hz)', values: ['100-500', '200-1000', '50-300', '10-100', '30-200'], current: '45' },
                { name: '信噪比(dB)', values: ['30-45', '35-50', '25-40', '20-35', '25-40'], current: '28' },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3 font-medium text-slate-700">{row.name}</td>
                  {row.values.map((val, i) => (
                    <td key={i} className="px-6 py-3 text-slate-500">{val}</td>
                  ))}
                  <td className="px-6 py-3 font-bold text-brand-600">{row.current}</td>
                </tr>
              ))}
              <tr className="bg-brand-50/30">
                <td className="px-6 py-3 font-medium text-slate-700">分类结果</td>
                <td className="px-6 py-3 text-slate-400">-</td>
                <td className="px-6 py-3 text-slate-400">-</td>
                <td className="px-6 py-3 text-slate-400">-</td>
                <td className="px-6 py-3 text-slate-400">-</td>
                <td className="px-6 py-3 text-slate-400">-</td>
                <td className="px-6 py-3 font-bold text-brand-600">
                  {defectTypeNames[defectType]} (99.4%)
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default XLPEAnalysisPage;
