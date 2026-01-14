import React from 'react';

/**
 * SystemPortal 组件
 * 提供跳转到 SmartTech 后台管理系统的入口
 */
const SystemPortal: React.FC = () => {
  // 使用 HashRouter 的路径
  const targetUrl = '#/smart-tech/';

  return (
    <div className="absolute top-4 right-4 z-40 pointer-events-auto">
      <a
        href={targetUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center gap-3 px-4 py-2 bg-slate-900/80 border border-cyan-500/30 rounded-lg backdrop-blur-md hover:bg-slate-800/90 hover:border-cyan-400 transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_25px_rgba(6,182,212,0.3)]"
      >
        {/* 图标装饰 */}
        <div className="relative w-8 h-8 flex items-center justify-center bg-cyan-950/50 rounded-md border border-cyan-500/20 group-hover:border-cyan-400/50 transition-colors">
          <svg 
            className="w-5 h-5 text-cyan-400 group-hover:text-cyan-300 transition-colors" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          {/* 脉冲点缀 */}
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_5px_#22d3ee]"></span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-cyan-200/60 font-mono tracking-wider group-hover:text-cyan-200/80">SmartTech</span>
          <span className="text-sm font-bold text-white tracking-wide group-hover:text-cyan-50 transition-colors">
            智能业务平台
            <span className="inline-block ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">→</span>
          </span>
        </div>
        
        {/* 边框光效 */}
        <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-cyan-500/20 group-hover:ring-cyan-400/50 transition-all"></div>
      </a>
    </div>
  );
};

export default SystemPortal;
