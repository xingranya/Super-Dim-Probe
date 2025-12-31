import React, { useEffect, useState, useRef } from 'react';

interface AIPanelProps {
  isOpen: boolean;
  isLoading: boolean;
  content: string;
  onClose: () => void;
}

const AIPanel: React.FC<AIPanelProps> = ({ isOpen, isLoading, content, onClose }) => {
  const [displayedText, setDisplayedText] = useState('');
  
  // 优化：使用 requestAnimationFrame 代替 setInterval 提升性能
  useEffect(() => {
    if (isLoading) {
      setDisplayedText('');
      return;
    }
    
    if (content) {
      let index = 0;
      setDisplayedText('');
      let animationId: number;
      let lastTime = performance.now();
      
      const animate = (currentTime: number) => {
        const deltaTime = currentTime - lastTime;
        
        // 每16ms更新一次（约60fps）
        if (deltaTime > 16) {
          index = Math.min(index + 3, content.length); // 每次增加3个字符
          setDisplayedText(content.slice(0, index));
          lastTime = currentTime;
        }
        
        if (index < content.length) {
          animationId = requestAnimationFrame(animate);
        }
      };
      
      animationId = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationId);
    }
  }, [content, isLoading]);

  if (!isOpen) return null;

  // Simple Markdown Parser
  const renderFormattedText = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, i) => {
      const trimmed = line.trim();
      
      // Headers
      if (trimmed.startsWith('### ')) {
        return <h3 key={i} className="text-blue-400 font-bold text-base mt-4 mb-2 tracking-wide">{parseInline(trimmed.replace('### ', ''))}</h3>;
      }
      if (trimmed.startsWith('## ')) {
        return <h2 key={i} className="text-blue-300 font-bold text-lg mt-5 mb-3 border-b border-gray-700 pb-1">{parseInline(trimmed.replace('## ', ''))}</h2>;
      }
      
      // List items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <div key={i} className="flex ml-1 mb-1.5">
            <span className="text-blue-500 mr-2 mt-1 text-[10px]">•</span>
            <span className="text-gray-300 flex-1">{parseInline(trimmed.replace(/^[-*] /, ''))}</span>
          </div>
        );
      }
      
      // Empty lines
      if (trimmed === '') {
        return <div key={i} className="h-2" />;
      }
      
      // Paragraphs
      return <p key={i} className="mb-2 text-gray-300 leading-relaxed text-sm">{parseInline(line)}</p>;
    });
  };

  // Helper to parse **bold** text
  const parseInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/); // Split capturing delimiters
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] max-h-[85vh] flex flex-col bg-[#0f131a] border border-blue-500/30 rounded-lg shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200">
      
      {/* Header */}
      <div className="flex-none px-6 py-4 border-b border-gray-800 flex justify-between items-center bg-[#161b22] rounded-t-lg">
        <div className="flex items-center gap-2">
            <span className="text-blue-400 text-lg shadow-blue-500/50 drop-shadow-md">✨</span>
            <h3 className="m-0 text-white text-base tracking-wide font-bold">AI 智能诊断报告</h3>
        </div>
        <button 
          onClick={onClose} 
          className="bg-transparent border-none text-gray-500 hover:text-white text-2xl cursor-pointer leading-none transition-colors"
        >
          &times;
        </button>
      </div>

      {/* Content Body */}
      <div className="flex-1 p-6 overflow-y-auto font-sans bg-[#0f131a]">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-blue-400 gap-4">
            <div className="relative">
              <div className="w-8 h-8 border-2 border-blue-500/30 rounded-full"></div>
              <div className="absolute top-0 left-0 w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <span className="animate-pulse font-mono text-sm tracking-wide">正在解析物理场数据...</span>
          </div>
        ) : (
          <div className="fade-in duration-500">
            {renderFormattedText(displayedText)}
          </div>
        )}
      </div>

       {/* Footer */}
       <div className="flex-none px-6 py-3 border-t border-gray-800 bg-[#161b22] rounded-b-lg text-[10px] text-gray-500 flex justify-between uppercase tracking-wider font-semibold">
          <span>Powered by Gemini 2.5</span>
          <span>IEC 60270 / 60502 Compliant</span>
       </div>
    </div>
  );
};

export default AIPanel;