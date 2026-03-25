import React from 'react';
import { Thermometer, Zap, Activity, AlertTriangle, CheckCircle, X } from 'lucide-react';
import type { MapNode } from '@/types/map';

interface NodeTooltipProps {
  node: MapNode | null;
  position?: { x: number; y: number };
  onClose?: () => void;
  onViewDetails?: (node: MapNode) => void;
  onViewHistory?: (node: MapNode) => void;
}

const NodeTooltip: React.FC<NodeTooltipProps> = ({
  node,
  position,
  onClose,
  onViewDetails,
  onViewHistory,
}) => {
  if (!node) return null;

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'normal':
        return {
          color: '#22c55e',
          bg: 'bg-emerald-500/20',
          border: 'border-emerald-500/50',
          label: '正常',
          icon: CheckCircle,
        };
      case 'warning':
        return {
          color: '#f59e0b',
          bg: 'bg-amber-500/20',
          border: 'border-amber-500/50',
          label: '告警',
          icon: AlertTriangle,
        };
      case 'fault':
        return {
          color: '#ef4444',
          bg: 'bg-red-500/20',
          border: 'border-red-500/50',
          label: '故障',
          icon: AlertTriangle,
        };
      default:
        return {
          color: '#94a3b8',
          bg: 'bg-slate-500/20',
          border: 'border-slate-500/50',
          label: '未知',
          icon: Activity,
        };
    }
  };

  const getNodeTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      substation: '变电站',
      joint: '接头井',
      switch_station: '开关站',
      user_station: '用户站',
      grounding: '接地箱',
    };
    return labels[type] || type;
  };

  const statusConfig = getStatusConfig(node.status);
  const StatusIcon = statusConfig.icon;

  // 模拟实时数据
  const mockReadings = {
    temp: (30 + Math.random() * 20).toFixed(1),
    pd: (Math.random() * 30).toFixed(1),
    voltage: node.voltageLevel || '110',
    current: (100 + Math.random() * 500).toFixed(0),
  };

  return (
    <div
      className="fixed z-50 pointer-events-auto"
      style={{
        left: position?.x ?? '50%',
        top: position?.y ?? '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <div className="bg-[#0a0f1a]/95 backdrop-blur-sm border border-[#00d4ff]/30 rounded-xl shadow-2xl shadow-cyan-500/20 w-72 overflow-hidden">
        {/* 头部 */}
        <div className={`px-4 py-3 border-b border-${statusConfig.border} ${statusConfig.bg}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <StatusIcon size={16} style={{ color: statusConfig.color }} />
              <div>
                <h3 className="text-white font-bold text-sm">{node.name}</h3>
                <p className="text-white/50 text-[10px] font-mono">{node.id.toUpperCase()}</p>
              </div>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-white/50 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* 状态标签 */}
        <div className="px-4 py-2 flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-medium ${statusConfig.bg} ${statusConfig.border}`}
            style={{ color: statusConfig.color, borderWidth: 1 }}
          >
            {statusConfig.label}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/50">
            {getNodeTypeLabel(node.nodeType)}
          </span>
          {node.voltageLevel && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-500/20 text-blue-400 border border-blue-500/50">
              {node.voltageLevel}
            </span>
          )}
        </div>

        {/* 实时数据 */}
        <div className="px-4 py-3 grid grid-cols-2 gap-2">
          <div className="bg-[#0a0f1a] rounded-lg p-2 border border-white/10">
            <div className="flex items-center gap-1 text-white/50 text-[10px] mb-1">
              <Thermometer size={10} />
              <span>温度</span>
            </div>
            <div className="text-white font-mono font-bold text-sm">
              {mockReadings.temp}
              <span className="text-white/50 text-[10px] ml-0.5">°C</span>
            </div>
          </div>

          <div className="bg-[#0a0f1a] rounded-lg p-2 border border-white/10">
            <div className="flex items-center gap-1 text-white/50 text-[10px] mb-1">
              <Activity size={10} />
              <span>局放</span>
            </div>
            <div className="text-white font-mono font-bold text-sm">
              {mockReadings.pd}
              <span className="text-white/50 text-[10px] ml-0.5">pC</span>
            </div>
          </div>

          <div className="bg-[#0a0f1a] rounded-lg p-2 border border-white/10">
            <div className="flex items-center gap-1 text-white/50 text-[10px] mb-1">
              <Zap size={10} />
              <span>电压</span>
            </div>
            <div className="text-white font-mono font-bold text-sm">
              {mockReadings.voltage}
              <span className="text-white/50 text-[10px] ml-0.5">kV</span>
            </div>
          </div>

          <div className="bg-[#0a0f1a] rounded-lg p-2 border border-white/10">
            <div className="flex items-center gap-1 text-white/50 text-[10px] mb-1">
              <Activity size={10} />
              <span>电流</span>
            </div>
            <div className="text-white font-mono font-bold text-sm">
              {mockReadings.current}
              <span className="text-white/50 text-[10px] ml-0.5">A</span>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="px-4 pb-3 flex gap-2">
          <button
            onClick={() => onViewDetails?.(node)}
            className="flex-1 py-2 bg-[#00d4ff]/20 hover:bg-[#00d4ff]/30 text-[#00d4ff] rounded-lg text-xs font-medium transition-colors border border-[#00d4ff]/30"
          >
            查看详情
          </button>
          <button
            onClick={() => onViewHistory?.(node)}
            className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-lg text-xs font-medium transition-colors border border-white/10"
          >
            历史曲线
          </button>
        </div>

        {/* 底部装饰线 */}
        <div className="h-0.5 bg-gradient-to-r from-transparent via-[#00d4ff]/50 to-transparent" />
      </div>
    </div>
  );
};

export default NodeTooltip;
