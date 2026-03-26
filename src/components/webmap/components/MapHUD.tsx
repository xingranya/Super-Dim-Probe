import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Zap, Thermometer, Signal, ChevronDown, ChevronUp } from 'lucide-react';
import type { MapNode } from '@/types/map';
import { seededRange } from '@/utils/mockMetrics';

interface MapHUDProps {
  nodes: MapNode[];
  cables?: any[];
  onNodeSelect?: (node: MapNode) => void;
  onFilterChange?: (filter: 'all' | 'normal' | 'warning' | 'fault') => void;
  selectedNodeId?: string | null;
}

const MapHUD: React.FC<MapHUDProps> = ({
  nodes,
  onNodeSelect,
  onFilterChange,
  selectedNodeId,
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [filter, setFilter] = useState<'all' | 'normal' | 'warning' | 'fault'>('all');
  const [panelExpanded, setPanelExpanded] = useState(false); // 默认收起

  // 实时时钟
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // 统计数据
  const stats = {
    total: nodes.length,
    normal: nodes.filter(n => n.status === 'normal').length,
    warning: nodes.filter(n => n.status === 'warning').length,
    fault: nodes.filter(n => n.status === 'fault').length,
  };

  const handleFilterChange = (newFilter: 'all' | 'normal' | 'warning' | 'fault') => {
    setFilter(newFilter);
    onFilterChange?.(newFilter);
  };

  // 过滤后的节点
  const filteredNodes = filter === 'all'
    ? nodes
    : nodes.filter(n => n.status === filter);

  const stableTemperatures = React.useMemo(() => {
    return Object.fromEntries(
      filteredNodes.map((node) => [node.id, seededRange(`${node.id}-hud-temp`, 30, 50, 0)])
    ) as Record<string, number>;
  }, [filteredNodes]);

  return (
    <>
      {/* 顶部状态栏 - 左侧固定，右侧留出空间给展开按钮 */}
      <div className="absolute top-4 left-4 z-10 flex items-center justify-between pointer-events-none max-w-[calc(100%-200px)]">
        <div className="bg-[#0a0f1a]/90 backdrop-blur-sm border border-[#00d4ff]/30 rounded-xl px-5 py-3 pointer-events-auto shadow-lg shadow-cyan-500/10 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#00d4ff]/20 rounded-lg">
              <Signal size={18} className="text-[#00d4ff]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm">荆州电缆监测网络</h2>
              <p className="text-[#00d4ff]/60 text-[10px]">
                {currentTime.toLocaleTimeString('zh-CN', { hour12: false })}
              </p>
            </div>
          </div>

          {/* 分割线 */}
          <div className="w-px h-8 bg-white/10" />

          {/* 统计 */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-white/70 text-xs">{stats.normal}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-white/70 text-xs">{stats.warning}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-white/70 text-xs">{stats.fault}</span>
            </div>
          </div>

          {/* 分割线 */}
          <div className="w-px h-8 bg-white/10" />

          {/* 筛选按钮 */}
          <div className="flex gap-1">
            {(['all', 'normal', 'warning', 'fault'] as const).map(f => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`
                  px-2.5 py-1 rounded-md text-[11px] font-medium transition-all
                  ${filter === f
                    ? 'bg-[#00d4ff] text-[#0a0f1a]'
                    : 'bg-white/5 text-white/60 hover:text-white'
                  }
                `}
              >
                {f === 'all' ? '全部' : f === 'normal' ? '正常' : f === 'warning' ? '告警' : '故障'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧收起/展开按钮 - 始终显示 */}
      <div className="absolute top-4 right-4 z-20">
        <button
          onClick={() => setPanelExpanded(!panelExpanded)}
          type="button"
          aria-label={panelExpanded ? '收起监测节点面板' : '展开监测节点面板'}
          aria-expanded={panelExpanded}
          className="bg-[#0a0f1a]/90 backdrop-blur-sm border border-[#00d4ff]/30 rounded-lg px-3 py-2 flex items-center gap-2 shadow-lg shadow-cyan-500/10 hover:bg-[#0a0f1a] transition-all app-focus-dark"
        >
          <Activity size={14} className="text-[#00d4ff]" />
          <span className="text-white text-xs font-medium">
            监测节点 ({filteredNodes.length})
          </span>
          {panelExpanded ? (
            <ChevronUp size={14} className="text-[#00d4ff]" />
          ) : (
            <ChevronDown size={14} className="text-[#00d4ff]" />
          )}
        </button>
      </div>

      {/* 右侧节点详情面板 - 可展开/收起 */}
      <div className={`
        absolute top-16 right-4 w-80 z-10 pointer-events-auto
        transition-all duration-300 ease-in-out overflow-hidden
        ${panelExpanded ? 'bottom-4 opacity-100' : 'h-0 opacity-0'}
      `}>
        <div className="bg-[#0a0f1a]/90 backdrop-blur-sm border border-[#00d4ff]/30 rounded-xl h-full flex flex-col shadow-lg shadow-cyan-500/10 overflow-hidden">
          {/* 节点列表 */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {filteredNodes.map(node => (
              <button
                key={node.id}
                onClick={() => onNodeSelect?.(node)}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg transition-all text-left
                  ${selectedNodeId === node.id
                    ? 'bg-[#00d4ff]/20 border border-[#00d4ff]/50'
                    : 'bg-[#0a0f1a]/50 border border-transparent hover:border-white/20'
                  }
                `}
              >
                {/* 节点图标 */}
                <div className={`
                  w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                  ${node.nodeType === 'substation' ? 'bg-blue-500/20 text-blue-400' : ''}
                  ${node.nodeType === 'joint' ? 'bg-slate-500/20 text-slate-400' : ''}
                  ${node.nodeType === 'user_station' ? 'bg-emerald-500/20 text-emerald-400' : ''}
                  ${node.nodeType === 'grounding' ? 'bg-amber-500/20 text-amber-400' : ''}
                `}>
                  <Zap size={14} />
                </div>

                {/* 节点信息 */}
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-medium truncate">{node.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-white/40 text-[10px] font-mono">{node.id}</span>
                    {node.voltageLevel && (
                      <span className="text-[#00d4ff]/60 text-[10px]">{node.voltageLevel}</span>
                    )}
                  </div>
                </div>

                {/* 状态 */}
                <div className="flex flex-col items-end gap-1">
                  <div className={`
                    w-2 h-2 rounded-full
                    ${node.status === 'normal' ? 'bg-emerald-400' : ''}
                    ${node.status === 'warning' ? 'bg-amber-400 animate-pulse' : ''}
                    ${node.status === 'fault' ? 'bg-red-500 animate-pulse' : ''}
                  `} />
                  {node.status !== 'fault' && (
                    <span className="text-[#00d4ff]/60 text-[10px]">
                      {stableTemperatures[node.id]}°
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* 底部图例 */}
          <div className="px-4 py-3 border-t border-[#00d4ff]/20 bg-[#0a0f1a]/50">
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded bg-blue-500" />
                <span className="text-white/50">变电站</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-slate-400" />
                <span className="text-white/50">接头井</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded bg-emerald-500" />
                <span className="text-white/50">用户站</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded bg-amber-500" />
                <span className="text-white/50">接地箱</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(0, 212, 255, 0.3);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(0, 212, 255, 0.5);
        }
      `}</style>
    </>
  );
};

export default MapHUD;
