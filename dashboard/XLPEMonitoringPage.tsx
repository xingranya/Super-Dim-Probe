import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, 
  Thermometer, 
  Zap, 
  AlertTriangle, 
  Navigation,
  Layers,
  Settings,
  Map as MapIcon,
  Maximize2,
  Minimize2
} from 'lucide-react';

/**
 * XLPE电缆综合在线监测系统页面
 * 旗舰版 V2.0：超大规模复杂电网拓扑、贝塞尔曲线路径、地理信息融合
 */
const XLPEMonitoringPage: React.FC = () => {
  const [activeElement, setActiveElement] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'normal' | 'thermal' | 'fault'>('normal');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [simulatedLoad, setSimulatedLoad] = useState(0.75);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 模拟实时负载波动
  useEffect(() => {
    const timer = setInterval(() => {
      setSimulatedLoad(prev => {
        const change = (Math.random() - 0.5) * 0.05;
        return Math.max(0.4, Math.min(0.95, prev + change));
      });
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- 复杂拓扑数据生成 ---
  
  // 节点类型定义
  type NodeType = 'substation' | 'joint' | 'switch_station' | 'user_station';
  
  interface Node {
    id: string;
    type: NodeType;
    name: string;
    x: number;
    y: number;
    status?: 'normal' | 'warning' | 'alarm';
    grounding?: boolean; // 是否接地箱
  }

  interface Link {
    id: string;
    start: string;
    end: string;
    controlPoint?: { x: number, y: number }; // 贝塞尔曲线控制点
    baseCurrent: number;
    status: 'normal' | 'warning' | 'alarm';
    voltage: '110kV' | '35kV' | '10kV';
  }

  // 1. 核心骨干网 (110kV 双环网)
  const coreNodes: Node[] = [
    { id: 'sub-center', type: 'substation', name: '220kV 中心枢纽站', x: 50, y: 50, status: 'normal' },
    { id: 'sub-north', type: 'substation', name: '110kV 北区变', x: 50, y: 15, status: 'normal' },
    { id: 'sub-east', type: 'substation', name: '110kV 东区变', x: 85, y: 50, status: 'normal' },
    { id: 'sub-south', type: 'substation', name: '110kV 南区变', x: 50, y: 85, status: 'warning' },
    { id: 'sub-west', type: 'substation', name: '110kV 西区变', x: 15, y: 50, status: 'normal' },
  ];

  // 2. 辐射接头节点 (生成大量中间节点)
  const jointNodes: Node[] = [
    // 北线接头
    { id: 'j-n1', type: 'joint', name: '#N1 接头', x: 50, y: 38, status: 'normal', grounding: true },
    { id: 'j-n2', type: 'joint', name: '#N2 接头', x: 45, y: 28, status: 'normal' },
    { id: 'j-n3', type: 'joint', name: '#N3 接头', x: 55, y: 25, status: 'normal', grounding: true },
    
    // 东线接头
    { id: 'j-e1', type: 'joint', name: '#E1 接头', x: 65, y: 50, status: 'normal' },
    { id: 'j-e2', type: 'joint', name: '#E2 接头', x: 75, y: 45, status: 'normal', grounding: true },
    
    // 南线接头 (故障区)
    { id: 'j-s1', type: 'joint', name: '#S1 接头', x: 50, y: 62, status: 'normal' },
    { id: 'j-s2', type: 'joint', name: '#S2 接头', x: 52, y: 72, status: 'warning', grounding: true },
    
    // 西线接头
    { id: 'j-w1', type: 'joint', name: '#W1 接头', x: 35, y: 50, status: 'normal' },
    { id: 'j-w2', type: 'joint', name: '#W2 接头', x: 25, y: 55, status: 'normal', grounding: true },

    // 环网联络线接头
    { id: 'j-nw1', type: 'joint', name: '#NW1 联络', x: 30, y: 30, status: 'normal' },
    { id: 'j-ne1', type: 'joint', name: '#NE1 联络', x: 70, y: 30, status: 'normal' },
    { id: 'j-se1', type: 'joint', name: '#SE1 联络', x: 70, y: 70, status: 'normal' },
    { id: 'j-sw1', type: 'joint', name: '#SW1 联络', x: 30, y: 70, status: 'normal' },
  ];

  // 3. 末端用户站
  const endNodes: Node[] = [
    { id: 'usr-tech', type: 'user_station', name: '高新产业园', x: 80, y: 20, status: 'normal' },
    { id: 'usr-cbd', type: 'user_station', name: '中央商务区', x: 90, y: 80, status: 'normal' },
    { id: 'usr-ind', type: 'user_station', name: '重工制造厂', x: 20, y: 80, status: 'normal' },
    { id: 'usr-res', type: 'user_station', name: '滨湖居住区', x: 10, y: 20, status: 'normal' },
  ];

  const allNodes = [...coreNodes, ...jointNodes, ...endNodes];

  // 4. 线路连接 (使用贝塞尔控制点模拟自然走向)
  const allLinks: Link[] = [
    // 中心放射线
    { id: 'l-c-n1', start: 'sub-center', end: 'j-n1', baseCurrent: 800, status: 'normal', voltage: '110kV' },
    { id: 'l-n1-n2', start: 'j-n1', end: 'j-n2', baseCurrent: 800, status: 'normal', voltage: '110kV' },
    { id: 'l-n2-n3', start: 'j-n2', end: 'j-n3', baseCurrent: 800, status: 'normal', voltage: '110kV' },
    { id: 'l-n3-north', start: 'j-n3', end: 'sub-north', baseCurrent: 800, status: 'normal', voltage: '110kV' },

    { id: 'l-c-e1', start: 'sub-center', end: 'j-e1', baseCurrent: 750, status: 'normal', voltage: '110kV' },
    { id: 'l-e1-e2', start: 'j-e1', end: 'j-e2', baseCurrent: 750, status: 'normal', voltage: '110kV' },
    { id: 'l-e2-east', start: 'j-e2', end: 'sub-east', baseCurrent: 750, status: 'normal', voltage: '110kV' },

    { id: 'l-c-s1', start: 'sub-center', end: 'j-s1', baseCurrent: 820, status: 'normal', voltage: '110kV' },
    { id: 'l-s1-s2', start: 'j-s1', end: 'j-s2', baseCurrent: 820, status: 'warning', voltage: '110kV' }, // 故障段
    { id: 'l-s2-south', start: 'j-s2', end: 'sub-south', baseCurrent: 820, status: 'normal', voltage: '110kV' },

    { id: 'l-c-w1', start: 'sub-center', end: 'j-w1', baseCurrent: 600, status: 'normal', voltage: '110kV' },
    { id: 'l-w1-w2', start: 'j-w1', end: 'j-w2', baseCurrent: 600, status: 'normal', voltage: '110kV' },
    { id: 'l-w2-west', start: 'j-w2', end: 'sub-west', baseCurrent: 600, status: 'normal', voltage: '110kV' },

    // 外环联络线 (曲线)
    { id: 'l-nw', start: 'sub-north', end: 'sub-west', controlPoint: {x: 20, y: 20}, baseCurrent: 300, status: 'normal', voltage: '110kV' },
    { id: 'l-ne', start: 'sub-north', end: 'sub-east', controlPoint: {x: 80, y: 20}, baseCurrent: 320, status: 'normal', voltage: '110kV' },
    { id: 'l-se', start: 'sub-east', end: 'sub-south', controlPoint: {x: 80, y: 80}, baseCurrent: 280, status: 'normal', voltage: '110kV' },
    { id: 'l-sw', start: 'sub-south', end: 'sub-west', controlPoint: {x: 20, y: 80}, baseCurrent: 290, status: 'normal', voltage: '110kV' },

    // 用户配网分支
    { id: 'l-usr1', start: 'sub-north', end: 'usr-tech', controlPoint: {x: 60, y: 10}, baseCurrent: 150, status: 'normal', voltage: '35kV' },
    { id: 'l-usr2', start: 'sub-east', end: 'usr-cbd', controlPoint: {x: 95, y: 60}, baseCurrent: 200, status: 'normal', voltage: '35kV' },
    { id: 'l-usr3', start: 'sub-south', end: 'usr-ind', controlPoint: {x: 40, y: 90}, baseCurrent: 400, status: 'normal', voltage: '35kV' },
    { id: 'l-usr4', start: 'sub-west', end: 'usr-res', controlPoint: {x: 5, y: 40}, baseCurrent: 120, status: 'normal', voltage: '35kV' },
  ];

  // 辅助函数
  const getNodePos = (id: string) => allNodes.find(n => n.id === id) || { x: 0, y: 0 };
  
  const getPathD = (link: Link) => {
    const start = getNodePos(link.start);
    const end = getNodePos(link.end);
    if (link.controlPoint) {
      return `M ${start.x} ${start.y} Q ${link.controlPoint.x} ${link.controlPoint.y} ${end.x} ${end.y}`;
    }
    return `M ${start.x} ${start.y} L ${end.x} ${end.y}`;
  };

  const getStatusColor = (status: string, type: 'stroke' | 'fill' | 'text' = 'stroke') => {
    const colors = {
      normal: { stroke: '#10b981', fill: '#d1fae5', text: 'text-emerald-600' },
      warning: { stroke: '#f59e0b', fill: '#fef3c7', text: 'text-amber-600' },
      alarm: { stroke: '#ef4444', fill: '#fee2e2', text: 'text-red-600' },
      default: { stroke: '#94a3b8', fill: '#f1f5f9', text: 'text-slate-600' }
    };
    
    if (viewMode === 'thermal') {
       if (status === 'warning') return type === 'stroke' ? '#f97316' : type === 'fill' ? '#ffedd5' : 'text-orange-600';
       if (status === 'alarm') return type === 'stroke' ? '#dc2626' : type === 'fill' ? '#fee2e2' : 'text-red-600';
       return type === 'stroke' ? '#3b82f6' : type === 'fill' ? '#dbeafe' : 'text-blue-600';
    }
    return colors[status as keyof typeof colors] ? colors[status as keyof typeof colors][type] : colors.default[type];
  };

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-50 p-6' : 'h-[calc(100vh-6rem)]'}`}>
      {/* 左侧面板 */}
      <aside className={`lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1 ${isFullscreen ? 'hidden' : ''}`}>
        {/* 系统概览 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
            <Activity size={18} className="text-brand-600" />
            全网负荷监控
          </h2>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-3xl font-bold text-slate-800">{(simulatedLoad * 100).toFixed(1)}</span>
            <span className="text-sm text-slate-500 mb-1">%</span>
            <span className={`text-xs px-2 py-0.5 rounded-full mb-1.5 ${simulatedLoad > 0.85 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
              {simulatedLoad > 0.85 ? '重载' : '正常'}
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${simulatedLoad > 0.85 ? 'bg-red-500' : 'bg-brand-500'}`}
              style={{ width: `${simulatedLoad * 100}%` }}
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <div className="text-xs text-slate-400">有功功率</div>
              <div className="font-mono font-bold text-slate-700">{(350 * simulatedLoad).toFixed(1)} MW</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">无功功率</div>
              <div className="font-mono font-bold text-slate-700">{(45 * simulatedLoad).toFixed(1)} MVar</div>
            </div>
          </div>
        </div>

        {/* 告警列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
          <h2 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-500" />
            异常事件
          </h2>
          <div className="space-y-3">
            {[
              { time: '14:35:22', loc: '#S2 接头', type: '温度过高', val: '43.5°C', level: 'warning' },
              { time: '14:30:15', loc: '南区变', type: '局放预警', val: '22pC', level: 'warning' },
              { time: '12:15:00', loc: '高新园线', type: '负荷突增', val: '+25%', level: 'info' },
            ].map((evt, i) => (
              <div key={i} className="p-3 rounded-lg bg-gray-50 border border-gray-100 hover:bg-gray-100 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-slate-700 text-sm">{evt.loc}</span>
                  <span className="text-[10px] text-slate-400">{evt.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className={`text-xs ${evt.level === 'warning' ? 'text-amber-600' : 'text-blue-600'}`}>{evt.type}</span>
                  <span className="font-mono text-xs font-medium">{evt.val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* 中间面板 - 超大规模拓扑图 */}
      <section className={`${isFullscreen ? 'col-span-12' : 'lg:col-span-6'} flex flex-col gap-4 transition-all duration-300`}>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-1 flex-1 flex flex-col relative overflow-hidden">
          {/* 顶部控制栏 */}
          <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center bg-white/90 backdrop-blur-sm p-2 rounded-lg border border-gray-200 shadow-sm pointer-events-auto">
            <div className="flex items-center gap-3 px-2">
              <div className="p-1.5 bg-brand-100 rounded text-brand-600">
                <MapIcon size={18} />
              </div>
              <div>
                <h2 className="font-bold text-slate-800 text-sm">荆州核心区 110kV 电缆输电网</h2>
                <div className="text-[10px] text-slate-500 flex gap-2">
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>在线: 42</span>
                  <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>告警: 2</span>
                </div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                {(['normal', 'thermal', 'fault'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                      viewMode === mode 
                        ? 'bg-white text-brand-600 shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {mode === 'normal' ? '标准' : mode === 'thermal' ? '热力' : '故障'}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-gray-100 rounded-lg text-slate-500 transition-colors"
              >
                {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
              </button>
            </div>
          </div>

          {/* SVG 拓扑图容器 */}
          <div className="flex-1 w-full h-full bg-[#f8fafc] relative overflow-hidden cursor-grab active:cursor-grabbing">
            {/* 地理背景纹理 (模拟地图) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
               {/* 模拟河流 */}
               <path d="M -10 30 Q 30 40 50 20 T 110 30" stroke="#3b82f6" strokeWidth="8" fill="none" />
               {/* 模拟主干道 */}
               <path d="M 20 -10 L 20 110" stroke="#94a3b8" strokeWidth="4" fill="none" />
               <path d="M -10 80 L 110 80" stroke="#94a3b8" strokeWidth="4" fill="none" />
            </svg>

            {/* 动态网格点阵 */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)',
                backgroundSize: '20px 20px'
              }}
            />

            <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
              <defs>
                <filter id="glow-intense" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="1" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <linearGradient id="cable-gradient" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="50%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#64748b" />
                </linearGradient>
              </defs>

              {/* 连线层 */}
              {allLinks.map((link) => {
                const pathD = getPathD(link);
                const isWarning = link.status !== 'normal';
                const strokeColor = getStatusColor(link.status, 'stroke');
                const flowSpeed = Math.max(0.2, 1.5 - simulatedLoad); // 负载越大，速度越快(duration越小)

                return (
                  <g key={link.id} onClick={() => setActiveElement(link.id)} className="cursor-pointer group">
                    {/* 交互热区 (透明加粗) */}
                    <path d={pathD} stroke="transparent" strokeWidth="4" fill="none" />
                    
                    {/* 选中高亮 */}
                    <path 
                      d={pathD} 
                      stroke="#3b82f6" 
                      strokeWidth="2.5" 
                      strokeOpacity={activeElement === link.id ? 0.4 : 0} 
                      fill="none" 
                      className="transition-all"
                    />

                    {/* 电缆本体 */}
                    <path 
                      d={pathD} 
                      stroke={link.voltage === '110kV' ? '#475569' : '#64748b'} 
                      strokeWidth={link.voltage === '110kV' ? '0.8' : '0.5'} 
                      fill="none" 
                      strokeLinecap="round"
                    />

                    {/* 状态色线 */}
                    <path 
                      d={pathD} 
                      stroke={strokeColor} 
                      strokeWidth={link.voltage === '110kV' ? '0.3' : '0.2'} 
                      fill="none" 
                      className="transition-colors duration-500"
                    />

                    {/* 动态电流粒子 */}
                    {viewMode !== 'fault' && (
                      <path 
                        d={pathD} 
                        stroke="white" 
                        strokeWidth={link.voltage === '110kV' ? '0.2' : '0.1'} 
                        strokeDasharray={link.voltage === '110kV' ? '0.5 1' : '0.3 0.8'}
                        fill="none"
                        style={{ animation: `flow ${flowSpeed}s linear infinite` }}
                      />
                    )}

                    {/* 故障行波特效 */}
                    {viewMode === 'fault' && isWarning && (
                      <>
                        <circle r="0.6" fill="red" filter="url(#glow-intense)">
                          <animateMotion dur="1s" repeatCount="indefinite" path={pathD} />
                          <animate attributeName="opacity" values="1;0" dur="1s" repeatCount="indefinite" />
                        </circle>
                        {/* 反向行波 */}
                        <circle r="0.6" fill="red" filter="url(#glow-intense)">
                          <animateMotion dur="1s" repeatCount="indefinite" keyPoints="1;0" keyTimes="0;1" calcMode="linear">
                             <mpath href={`#path-${link.id}`} /> {/* Note: mpath needs ID, simplified here */}
                          </animateMotion>
                          {/* 简化实现：直接用反向路径太复杂，这里用另一个圆模拟 */}
                        </circle>
                      </>
                    )}
                  </g>
                );
              })}

              {/* 节点层 */}
              {allNodes.map((node) => (
                <g 
                  key={node.id} 
                  onClick={() => setActiveElement(node.id)}
                  className="cursor-pointer transition-transform hover:scale-110"
                  style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
                >
                  {node.type === 'substation' ? (
                    // 变电站 (大型方块)
                    <g transform={`translate(-3, -3)`}>
                      <rect x={node.x} y={node.y} width="6" height="6" rx="1" fill="white" stroke="#1e293b" strokeWidth="0.3" className="shadow-lg" />
                      <path d={`M ${node.x+1.5} ${node.y+1.5} L ${node.x+4.5} ${node.y+4.5} M ${node.x+4.5} ${node.y+1.5} L ${node.x+1.5} ${node.y+4.5}`} stroke="#e2e8f0" strokeWidth="0.2" />
                      <Zap x={node.x} y={node.y} transform="translate(1.5, 1.5)" size={3} className="text-brand-600" />
                      <text x={node.x} y={node.y} dx="3" dy="8" textAnchor="middle" className="text-[0.25rem] font-bold fill-slate-800">{node.name}</text>
                    </g>
                  ) : node.type === 'user_station' ? (
                    // 用户站 (小型房屋)
                    <g transform={`translate(-2, -2)`}>
                      <path d={`M ${node.x} ${node.y+2} L ${node.x+2} ${node.y} L ${node.x+4} ${node.y+2} V ${node.y+4} H ${node.x} Z`} fill="white" stroke="#475569" strokeWidth="0.2" />
                      <text x={node.x} y={node.y} dx="2" dy="6" textAnchor="middle" className="text-[0.2rem] font-medium fill-slate-600">{node.name}</text>
                    </g>
                  ) : (
                    // 接头井 (圆形)
                    <g>
                      {node.grounding && (
                        <path d={`M ${node.x} ${node.y+0.6} V ${node.y+1.5} M ${node.x-0.5} ${node.y+1.5} H ${node.x+0.5}`} stroke="#94a3b8" strokeWidth="0.15" />
                      )}
                      <circle cx={node.x} cy={node.y} r="0.8" fill="white" stroke={getStatusColor(node.status || 'normal', 'stroke')} strokeWidth="0.2" />
                      <circle cx={node.x} cy={node.y} r="0.4" fill={getStatusColor(node.status || 'normal', 'fill')} />
                      <text x={node.x} y={node.y} dy="-1.5" textAnchor="middle" className="text-[0.2rem] fill-slate-500">{node.name}</text>
                    </g>
                  )}
                </g>
              ))}
            </svg>

            {/* 悬浮详情卡片 */}
            {activeElement && (
              <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur border border-gray-200 p-4 rounded-xl shadow-2xl w-80 animate-in slide-in-from-bottom-4 fade-in duration-300 z-30">
                <div className="flex justify-between items-start mb-3 border-b border-gray-100 pb-2">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">
                      {allNodes.find(n => n.id === activeElement)?.name || '110kV 高压电缆段'}
                    </h3>
                    <div className="text-xs text-slate-400 font-mono mt-0.5">ID: {activeElement.toUpperCase()}</div>
                  </div>
                  <button onClick={() => setActiveElement(null)} className="text-slate-400 hover:text-slate-600">×</button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="bg-slate-50 p-2 rounded">
                    <div className="text-[10px] text-slate-500">实时负荷</div>
                    <div className="font-mono font-bold text-brand-600 text-sm">{(820 * simulatedLoad).toFixed(0)} A</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <div className="text-[10px] text-slate-500">线芯温度</div>
                    <div className="font-mono font-bold text-orange-500 text-sm">{(45 + Math.random()*2).toFixed(1)} °C</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <div className="text-[10px] text-slate-500">局放幅值</div>
                    <div className="font-mono font-bold text-slate-700 text-sm">12 pC</div>
                  </div>
                  <div className="bg-slate-50 p-2 rounded">
                    <div className="text-[10px] text-slate-500">剩余寿命</div>
                    <div className="font-mono font-bold text-emerald-600 text-sm">28.5 年</div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="flex-1 py-1.5 bg-brand-600 text-white rounded text-xs hover:bg-brand-700 transition-colors">查看历史曲线</button>
                  <button className="flex-1 py-1.5 bg-white border border-gray-200 text-slate-600 rounded text-xs hover:bg-gray-50 transition-colors">生成诊断报告</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 右侧面板 */}
      <aside className={`lg:col-span-3 flex flex-col gap-4 overflow-y-auto pl-1 ${isFullscreen ? 'hidden' : ''}`}>
        {/* 节点列表 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex-1">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-bold text-slate-800 flex items-center gap-2">
              <Navigation size={18} className="text-brand-600" />
              关键节点
            </h2>
            <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-slate-500">共 {allNodes.length} 个</span>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
            {allNodes.filter(n => n.type !== 'joint' || n.status !== 'normal').map(node => (
              <div 
                key={node.id}
                onClick={() => setActiveElement(node.id)}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer ${
                  activeElement === node.id 
                    ? 'bg-brand-50 border-brand-200 ring-1 ring-brand-200' 
                    : 'bg-white border-gray-100 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-1.5 h-1.5 rounded-full ${
                    node.status === 'normal' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  <span className="text-xs font-medium text-slate-700">{node.name}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">{(35 + Math.random()*5).toFixed(1)}°C</span>
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
               <span className="text-xs">参数配置</span>
             </button>
             <button className="flex flex-col items-center justify-center p-3 bg-gray-50 rounded-lg hover:bg-brand-50 hover:text-brand-600 transition-colors group">
               <Layers size={20} className="text-slate-400 group-hover:text-brand-500 mb-1" />
               <span className="text-xs">图层管理</span>
             </button>
           </div>
        </div>
      </aside>

      <style>{`
        @keyframes flow {
          from { stroke-dashoffset: 2; }
          to { stroke-dashoffset: 0; }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 2px; }
      `}</style>
    </div>
  );
};

export default XLPEMonitoringPage;
