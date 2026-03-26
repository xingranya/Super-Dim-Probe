import React, { useMemo } from 'react';
import { Thermometer, Zap, Activity, AlertTriangle, CheckCircle, X } from 'lucide-react';
import type { MapNode } from '@/types/map';
import { seededRange } from '@/utils/mockMetrics';

interface NodeTooltipProps {
  node: MapNode | null;
  position?: { x: number; y: number };
  onClose?: () => void;
  onViewDetails?: (node: MapNode) => void;
  onViewHistory?: (node: MapNode) => void;
}

const CARD_WIDTH = 264;

const NodeTooltip: React.FC<NodeTooltipProps> = ({
  node,
  position,
  onClose,
  onViewDetails,
  onViewHistory,
}) => {
  if (!node) return null;

  const metrics = useMemo(() => ({
    temp: seededRange(`${node.id}-temp`, 31, 48, 1).toFixed(1),
    pd: seededRange(`${node.id}-pd`, 5, 36, 1).toFixed(1),
    voltage: node.voltageLevel || '110',
    current: seededRange(`${node.id}-current`, 120, 520, 0).toFixed(0),
  }), [node]);

  const statusConfig = (() => {
    if (node.status === 'fault') {
      return { label: '故障', tone: 'border-rose-400/30 bg-rose-400/10 text-rose-200', icon: AlertTriangle };
    }
    if (node.status === 'warning') {
      return { label: '告警', tone: 'border-amber-400/30 bg-amber-400/10 text-amber-200', icon: AlertTriangle };
    }
    return { label: '正常', tone: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200', icon: CheckCircle };
  })();

  const tooltipPosition = (() => {
    if (!position || typeof window === 'undefined') {
      return { left: 24, top: 96 };
    }

    const maxLeft = Math.max(16, window.innerWidth - CARD_WIDTH - 16);
    const nextLeft = Math.min(position.x + 16, maxLeft);
    const nextTop = Math.max(72, Math.min(position.y - 12, window.innerHeight - 220));

    return { left: nextLeft, top: nextTop };
  })();

  const StatusIcon = statusConfig.icon;

  return (
    <div
      className="fixed z-50 pointer-events-auto"
      role="dialog"
      aria-modal="false"
      aria-labelledby="node-tooltip-title"
      style={tooltipPosition}
    >
      <div className="app-panel-dark w-[min(16.5rem,calc(100vw-2rem))] rounded-2xl overflow-hidden">
        <div className="flex items-start justify-between gap-3 border-b border-white/8 px-4 py-3">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusConfig.tone}`}>
                <StatusIcon size={10} />
                {statusConfig.label}
              </span>
              <span className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] text-slate-400">
                {node.nodeType === 'substation' ? '变电站' : node.nodeType === 'grounding' ? '接地箱' : node.nodeType === 'user_station' ? '用户站' : '环网柜'}
              </span>
            </div>
            <h3 id="node-tooltip-title" className="truncate text-sm font-semibold text-white">{node.name}</h3>
            <p className="mt-1 text-[11px] text-slate-500">{node.id.toUpperCase()}</p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭节点详情"
              className="app-icon-button app-focus-dark h-9 w-9 rounded-xl text-slate-400 hover:bg-white/6 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 px-4 py-3">
          <div className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
            <div className="mb-1 flex items-center gap-1 text-[10px] text-slate-500">
              <Thermometer size={10} />
              温度
            </div>
            <div className="text-sm font-semibold text-white">{metrics.temp}<span className="ml-1 text-[10px] text-slate-500">°C</span></div>
          </div>
          <div className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
            <div className="mb-1 flex items-center gap-1 text-[10px] text-slate-500">
              <Activity size={10} />
              局放
            </div>
            <div className="text-sm font-semibold text-white">{metrics.pd}<span className="ml-1 text-[10px] text-slate-500">pC</span></div>
          </div>
          <div className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
            <div className="mb-1 flex items-center gap-1 text-[10px] text-slate-500">
              <Zap size={10} />
              电压
            </div>
            <div className="text-sm font-semibold text-white">{metrics.voltage}<span className="ml-1 text-[10px] text-slate-500">kV</span></div>
          </div>
          <div className="rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2">
            <div className="mb-1 flex items-center gap-1 text-[10px] text-slate-500">
              <Activity size={10} />
              电流
            </div>
            <div className="text-sm font-semibold text-white">{metrics.current}<span className="ml-1 text-[10px] text-slate-500">A</span></div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-white/8 px-4 py-3">
          <button
            type="button"
            onClick={() => onViewDetails?.(node)}
            className="flex-1 rounded-xl bg-cyan-300/12 px-3 py-2 text-xs font-medium text-cyan-200 border border-cyan-300/20 hover:bg-cyan-300/18"
          >
            查看详情
          </button>
          <button
            type="button"
            onClick={() => onViewHistory?.(node)}
            className="flex-1 rounded-xl bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-300 border border-white/8 hover:bg-white/[0.08]"
          >
            历史曲线
          </button>
        </div>
      </div>
    </div>
  );
};

export default NodeTooltip;
