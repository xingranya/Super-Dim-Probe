import React, { useEffect, useState, useMemo } from 'react';

/**
 * 分析模块流程图 - 修复版 v2
 * 修复溢出、连线、形状，添加边框发光替代光环
 */

interface AnalysisFlowChartProps {
  progress: number;
  isPaused?: boolean;
}

interface FlowNode {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  activateAt: number;
  shape: 'hexagon' | 'rect' | 'diamond' | 'chip' | 'ellipse' | 'circle' | 'rounded' | 'screen';
  icon: string;
  color: string;
}

interface FlowLink {
  from: string;
  to: string;
  activateAt: number;
}

const AnalysisFlowChart: React.FC<AnalysisFlowChartProps> = ({ progress }) => {
  const [activeNodes, setActiveNodes] = useState<Set<string>>(new Set());
  const [activeLinks, setActiveLinks] = useState<Set<string>>(new Set());

  // 节点配置 - 优化布局防止溢出，每秒一个节点
  const nodes: FlowNode[] = useMemo(() => [
    { id: 'sensor', label: '传感器', x: 20, y: 35, width: 85, height: 42, activateAt: 5, shape: 'hexagon', icon: '📡', color: '#00f3ff' },
    { id: 'amplifier', label: '放大器', x: 130, y: 35, width: 80, height: 40, activateAt: 10, shape: 'rect', icon: '🔊', color: '#3b82f6' },
    { id: 'filter', label: '滤波器', x: 235, y: 35, width: 80, height: 40, activateAt: 15, shape: 'diamond', icon: '〰️', color: '#8b5cf6' },
    { id: 'adc', label: 'A/D', x: 340, y: 35, width: 70, height: 40, activateAt: 20, shape: 'chip', icon: '⚡', color: '#f97316' },
    
    { id: 'xme', label: 'XME0724', x: 340, y: 110, width: 80, height: 42, activateAt: 25, shape: 'chip', icon: '🔲', color: '#eab308' },
    { id: 'preprocess', label: '预处理', x: 235, y: 110, width: 80, height: 40, activateAt: 30, shape: 'rect', icon: '🧮', color: '#22c55e' },
    { id: 'wavelet', label: '小波变换', x: 130, y: 110, width: 80, height: 40, activateAt: 35, shape: 'rect', icon: '📊', color: '#8b5cf6' },
    
    { id: 'prdr', label: 'PRDR', x: 20, y: 110, width: 85, height: 40, activateAt: 40, shape: 'ellipse', icon: '📈', color: '#06b6d4' },
    { id: 'feature', label: '特征提取', x: 20, y: 185, width: 85, height: 40, activateAt: 45, shape: 'ellipse', icon: '🎯', color: '#00f3ff' },
    { id: 'svm', label: 'DAG-SVM', x: 130, y: 185, width: 85, height: 42, activateAt: 50, shape: 'circle', icon: '🧠', color: '#eab308' },
    
    { id: 'fault', label: '故障识别', x: 240, y: 185, width: 85, height: 40, activateAt: 55, shape: 'rounded', icon: '⚠️', color: '#ef4444' },
    { id: 'output', label: '可视化', x: 350, y: 185, width: 75, height: 40, activateAt: 60, shape: 'screen', icon: '🖥️', color: '#ffffff' },
  ], []);

  const links: FlowLink[] = useMemo(() => [
    { from: 'sensor', to: 'amplifier', activateAt: 7 },
    { from: 'amplifier', to: 'filter', activateAt: 12 },
    { from: 'filter', to: 'adc', activateAt: 17 },
    { from: 'adc', to: 'xme', activateAt: 22 },
    { from: 'xme', to: 'preprocess', activateAt: 27 },
    { from: 'preprocess', to: 'wavelet', activateAt: 32 },
    { from: 'wavelet', to: 'prdr', activateAt: 37 },
    { from: 'prdr', to: 'feature', activateAt: 42 },
    { from: 'feature', to: 'svm', activateAt: 47 },
    { from: 'svm', to: 'fault', activateAt: 52 },
    { from: 'fault', to: 'output', activateAt: 57 },
  ], []);

  useEffect(() => {
    const newActiveNodes = new Set<string>();
    const newActiveLinks = new Set<string>();
    nodes.forEach(node => { if (progress >= node.activateAt) newActiveNodes.add(node.id); });
    links.forEach(link => { if (progress >= link.activateAt) newActiveLinks.add(`${link.from}-${link.to}`); });
    setActiveNodes(newActiveNodes);
    setActiveLinks(newActiveLinks);
  }, [progress, nodes, links]);

  // 绘制节点形状
  const renderNodeShape = (node: FlowNode, isActive: boolean) => {
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;
    const fill = isActive ? `${node.color}20` : 'rgba(30, 41, 59, 0.95)';
    const stroke = isActive ? node.color : '#475569';
    const sw = isActive ? 2.5 : 1;

    switch (node.shape) {
      case 'hexagon': {
        const w = node.width / 2, h = node.height / 2;
        const pts = [[cx-w*0.85,cy],[cx-w*0.4,cy-h],[cx+w*0.4,cy-h],[cx+w*0.85,cy],[cx+w*0.4,cy+h],[cx-w*0.4,cy+h]].map(p=>p.join(',')).join(' ');
        return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />;
      }
      case 'diamond': {
        const pts = [[cx,cy-node.height/2],[cx+node.width/2,cy],[cx,cy+node.height/2],[cx-node.width/2,cy]].map(p=>p.join(',')).join(' ');
        return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} />;
      }
      case 'chip':
        return (
          <g>
            <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={3} fill={fill} stroke={stroke} strokeWidth={sw} />
            {[0.25,0.5,0.75].map((r,i)=>(
              <g key={i}>
                <rect x={node.x+node.width*r-2} y={node.y-3} width={4} height={3} fill={stroke} />
                <rect x={node.x+node.width*r-2} y={node.y+node.height} width={4} height={3} fill={stroke} />
              </g>
            ))}
          </g>
        );
      case 'ellipse':
        return <ellipse cx={cx} cy={cy} rx={node.width/2} ry={node.height/2} fill={fill} stroke={stroke} strokeWidth={sw} />;
      case 'circle':
        return <ellipse cx={cx} cy={cy} rx={node.width/2} ry={node.height/2} fill={fill} stroke={stroke} strokeWidth={sw} />;
      case 'rounded':
        return <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={12} fill={fill} stroke={stroke} strokeWidth={sw} />;
      case 'screen':
        return (
          <g>
            <rect x={node.x} y={node.y} width={node.width} height={node.height*0.8} rx={3} fill={fill} stroke={stroke} strokeWidth={sw} />
            <rect x={cx-8} y={node.y+node.height*0.8} width={16} height={node.height*0.2} fill={stroke} />
          </g>
        );
      default:
        return <rect x={node.x} y={node.y} width={node.width} height={node.height} rx={6} fill={fill} stroke={stroke} strokeWidth={sw} />;
    }
  };

  const renderNode = (node: FlowNode) => {
    const isActive = activeNodes.has(node.id);
    const isPulsing = isActive && progress - node.activateAt < 8;
    const cx = node.x + node.width / 2;
    const cy = node.y + node.height / 2;

    return (
      <g key={node.id}>
        {/* 激活时的发光边框效果 */}
        {isActive && isPulsing && (
          <rect 
            x={node.x - 3} y={node.y - 3} 
            width={node.width + 6} height={node.height + 6} 
            rx={10} fill="none" 
            stroke={node.color} strokeWidth={1.5} 
            opacity={0.6}
            className="animate-pulse"
          />
        )}
        {renderNodeShape(node, isActive)}
        {/* 图标 + 标签 */}
        <text x={cx} y={cy + 1} fontSize={10} fill={isActive ? '#fff' : '#94a3b8'} textAnchor="middle" dominantBaseline="middle" fontFamily="'Microsoft YaHei',sans-serif">
          <tspan>{node.icon}</tspan>
          <tspan dx={2}>{node.label}</tspan>
        </text>
      </g>
    );
  };

  const getLinkPath = (link: FlowLink): string => {
    const from = nodes.find(n => n.id === link.from);
    const to = nodes.find(n => n.id === link.to);
    if (!from || !to) return '';

    const fx = from.x + from.width / 2, fy = from.y + from.height / 2;
    const tx = to.x + to.width / 2, ty = to.y + to.height / 2;

    // 水平连接
    if (Math.abs(fy - ty) < 20) {
      const sx = fx < tx ? from.x + from.width : from.x;
      const ex = fx < tx ? to.x : to.x + to.width;
      return `M ${sx} ${fy} L ${ex} ${ty}`;
    }
    // 垂直连接
    const sy = fy < ty ? from.y + from.height : from.y;
    const ey = fy < ty ? to.y : to.y + to.height;
    const my = (sy + ey) / 2;
    return `M ${fx} ${sy} L ${fx} ${my} L ${tx} ${my} L ${tx} ${ey}`;
  };

  const renderLink = (link: FlowLink) => {
    const isActive = activeLinks.has(`${link.from}-${link.to}`);
    const path = getLinkPath(link);
    const fromNode = nodes.find(n => n.id === link.from);

    return (
      <g key={`${link.from}-${link.to}`}>
        <path d={path} fill="none" stroke={isActive ? (fromNode?.color || '#00f3ff') : '#475569'} strokeWidth={isActive ? 2 : 1} opacity={isActive ? 1 : 0.4} />
        {isActive && (
          <circle r={3} fill={fromNode?.color || '#00f3ff'}>
            <animateMotion dur="0.5s" repeatCount="indefinite" path={path} />
          </circle>
        )}
      </g>
    );
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="text-center py-1.5 border-b border-cyan-500/20 shrink-0">
        <h2 className="text-cyan-400 text-sm font-bold">信号处理与分析流程</h2>
      </div>
      <div className="flex-1 p-2">
        <svg viewBox="0 0 450 250" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="g3" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1e293b" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#g3)" opacity={0.5} />
          {links.map(link => renderLink(link))}
          {nodes.map(node => renderNode(node))}
        </svg>
      </div>
    </div>
  );
};

export default AnalysisFlowChart;
