import React, { useState, useEffect, useMemo } from 'react';
import { Activity, AlertTriangle, ChevronDown, ChevronUp, Signal, Zap } from 'lucide-react';
import type { MapNode } from '@/types/map';

interface MapHUDProps {
  nodes: MapNode[];
  onNodeSelect?: (node: MapNode) => void;
  onFilterChange?: (filter: 'all' | 'normal' | 'warning' | 'fault') => void;
  selectedNodeId?: string | null;
  zoom: number;
}

const isNodeVisibleInPanel = (node: MapNode, zoom: number) => {
  if (node.status === 'warning' || node.status === 'fault') return true;
  if (node.nodeType === 'substation') return true;
  if (zoom < 14.2) return false;
  if (zoom < 15.2) return node.renderPriority !== 'tertiary' || node.nodeType === 'grounding';
  return true;
};

const getNodeLabel = (node: MapNode) => {
  if (node.nodeType === 'substation') return '变电站';
  if (node.nodeType === 'grounding') return '接地箱';
  if (node.nodeType === 'user_station') return '用户站';
  if (node.nodeType === 'switch_station') return '开关站';
  return '环网柜';
};

const getStatusTone = (status: MapNode['status']) => {
  if (status === 'fault') return 'text-rose-300 border-rose-400/30 bg-rose-400/12';
  if (status === 'warning') return 'text-amber-200 border-amber-400/30 bg-amber-400/10';
  return 'text-emerald-200 border-emerald-400/20 bg-emerald-400/8';
};

const MapHUD: React.FC<MapHUDProps> = ({
  nodes,
  onNodeSelect,
  onFilterChange,
  selectedNodeId,
  zoom,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'normal' | 'warning' | 'fault'>('all');
  const [panelExpanded, setPanelExpanded] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const visibleNodes = useMemo(
    () => nodes.filter((node) => isNodeVisibleInPanel(node, zoom)),
    [nodes, zoom]
  );

  const stats = useMemo(() => ({
    normal: nodes.filter((node) => node.status === 'normal').length,
    warning: nodes.filter((node) => node.status === 'warning').length,
    fault: nodes.filter((node) => node.status === 'fault').length,
  }), [nodes]);

  const handleFilterChange = (nextFilter: 'all' | 'normal' | 'warning' | 'fault') => {
    setFilter(nextFilter);
    onFilterChange?.(nextFilter);
  };

  const filteredNodes = useMemo(() => {
    if (filter === 'all') return visibleNodes;
    return visibleNodes.filter((node) => node.status === filter);
  }, [filter, visibleNodes]);

  const groupedNodes = useMemo(() => {
    const abnormal = filteredNodes.filter((node) => node.status === 'warning' || node.status === 'fault');
    const core = filteredNodes.filter(
      (node) => node.status === 'normal' && (node.nodeType === 'substation' || node.renderPriority === 'primary')
    );
    const all = filteredNodes.filter(
      (node) => !abnormal.some((item) => item.id === node.id) && !core.some((item) => item.id === node.id)
    );

    return [
      { id: 'abnormal', title: '异常节点', nodes: abnormal },
      { id: 'core', title: '核心节点', nodes: core },
      { id: 'all', title: '全部节点', nodes: all },
    ].filter((group) => group.nodes.length > 0);
  }, [filteredNodes]);

  return (
    <>
      <div className="absolute top-3 left-3 z-10 pointer-events-none max-w-[min(38rem,calc(100%-5rem))]">
        <div className="app-panel-dark pointer-events-auto rounded-2xl px-3 py-2 sm:px-3.5 sm:py-2">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-400/12 text-cyan-300">
                <Signal size={14} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">荆州电缆监测网络</div>
                <div className="text-[11px] text-slate-400">
                  {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
                </div>
              </div>
            </div>

            <div className="hidden h-6 w-px bg-white/10 sm:block" />

            <div className="flex items-center gap-3 text-xs text-slate-200">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
                {stats.normal}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                {stats.warning}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-400" />
                {stats.fault}
              </span>
            </div>

            <div className="flex flex-wrap gap-1 sm:ml-auto">
              {(['all', 'normal', 'warning', 'fault'] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => handleFilterChange(item)}
                  className={`min-h-7 rounded-full px-3 text-[11px] font-medium transition-colors ${
                    filter === item
                      ? 'bg-cyan-300 text-slate-950'
                      : 'bg-white/6 text-slate-300 hover:bg-white/12 hover:text-white'
                  }`}
                >
                  {item === 'all' ? '全部' : item === 'normal' ? '正常' : item === 'warning' ? '告警' : '故障'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-3 right-3 z-20">
        <button
          type="button"
          onClick={() => setPanelExpanded((current) => !current)}
          aria-label={panelExpanded ? '收起监测节点面板' : '展开监测节点面板'}
          aria-expanded={panelExpanded}
          className="app-panel-dark app-focus-dark flex min-h-10 items-center gap-2 rounded-2xl px-3 py-2 text-white"
        >
          <Activity size={14} className="text-cyan-300" />
          <span className="text-xs font-medium">监测节点</span>
          <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-slate-300">{filteredNodes.length}</span>
          {panelExpanded ? <ChevronUp size={14} className="text-cyan-300" /> : <ChevronDown size={14} className="text-cyan-300" />}
        </button>
      </div>

      <div
        className={`absolute z-20 pointer-events-auto transition-all duration-300 ease-out ${
          panelExpanded ? 'opacity-100 translate-y-0' : 'opacity-0 pointer-events-none -translate-y-2'
        } top-16 right-3 w-[min(22rem,calc(100vw-1.5rem))] md:w-80`}
      >
        <div className="app-panel-dark rounded-2xl overflow-hidden">
          <div className="max-h-[min(70vh,34rem)] overflow-y-auto app-scrollbar px-3 py-3">
            {groupedNodes.map((group) => (
              <div key={group.id} className="mb-4 last:mb-0">
                <div className="mb-2 px-1 text-[11px] font-medium tracking-[0.12em] text-slate-500 uppercase">
                  {group.title}
                </div>
                <div className="space-y-1.5">
                  {group.nodes.map((node) => (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => onNodeSelect?.(node)}
                      className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                        selectedNodeId === node.id
                          ? 'border-cyan-300/35 bg-cyan-300/10'
                          : 'border-white/6 bg-white/[0.03] hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.06] text-slate-200">
                          <Zap size={14} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm font-medium text-white">{node.name}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full border px-2 py-0.5 text-[10px] ${getStatusTone(node.status)}`}>
                              {node.status === 'fault' ? '故障' : node.status === 'warning' ? '告警' : '正常'}
                            </span>
                            <span className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] text-slate-400">
                              {getNodeLabel(node)}
                            </span>
                            {node.voltageLevel && (
                              <span className="rounded-full border border-white/8 px-2 py-0.5 text-[10px] text-slate-300">
                                {node.voltageLevel}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default MapHUD;
