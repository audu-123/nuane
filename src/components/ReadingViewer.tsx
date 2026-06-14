import React, { useState, useEffect } from 'react';
import { Copy, Clock, Check, Edit, Eye } from 'lucide-react';

interface ReadingViewerProps {
  rawText: string;
  isMarkdown?: boolean;
  onReadComplete?: () => void;
  onReadComplete?: () => void;
  isGenerating?: boolean;
  timeLeft: number;
  hideCopy?: boolean;
  onChangeRawText?: (text: string) => void;
}

export const ReadingViewer: React.FC<ReadingViewerProps> = ({ 
  rawText, 
  isMarkdown, 
  onReadComplete,
  isGenerating = false,
  timeLeft,
  hideCopy = false,
  onChangeRawText
}) => {
  const [copyDone, setCopyDone] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Reset edit mode when new generation starts
  useEffect(() => {
    if (isGenerating) {
      setIsEditing(false); 
    }
  }, [isGenerating]);

  // Clean tags for preview/reading mode
  const cleanText = rawText.replace(/<\/?tag>/g, '').replace(/<\/?hl>/g, '');

  const renderText = () => {
    if (isMarkdown) {
      const parts = cleanText.split(/(\*\*.*?\*\*|## .*?\n|### .*?\n)/g);
      return parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) {
          return <strong key={i} className="font-bold text-gray-900">{p.slice(2, -2)}</strong>;
        }
        if (p.startsWith('## ')) {
          return <h2 key={i} className="text-base font-bold text-gray-900 mt-4 mb-2">{p.slice(3)}</h2>;
        }
        if (p.startsWith('### ')) {
          return <h3 key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-1.5">{p.slice(4)}</h3>;
        }
        return p;
      });
    }
    return cleanText;
  };

  const handleCopy = () => {
    if (timeLeft > 0 || isGenerating) return;
    navigator.clipboard.writeText(cleanText).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <span className="text-xs text-gray-400">
          {isGenerating ? 'AI 正在生成内容...' : '阅读完毕后方可复制或发送'}
        </span>
        {onChangeRawText && (
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={isGenerating}
            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${
              isGenerating 
                ? 'text-gray-400 bg-gray-100 cursor-not-allowed' 
                : 'text-[#0052D9] hover:text-[#003BA5] bg-[#EEF3FF]'
            }`}
          >
            {isEditing ? <Eye size={12} /> : <Edit size={12} />}
            {isEditing ? '预览模式' : '自由编辑'}
          </button>
        )}
      </div>

      {isEditing && onChangeRawText ? (
        <textarea
          value={rawText}
          onChange={(e) => onChangeRawText(e.target.value)}
          rows={10}
          className="w-full bg-white rounded-lg p-3 text-sm leading-6 text-gray-700 border border-[#0052D9] focus:outline-none focus:ring-2 focus:ring-[#0052D9]/20 transition-all font-mono"
          placeholder="在此编辑全文..."
        />
      ) : (
        <div className="bg-gray-50 rounded-lg p-4 text-sm leading-7 text-gray-700 border border-gray-100 min-h-32 whitespace-pre-wrap">
          {isGenerating ? (
            <div className="flex items-center justify-center h-32 text-gray-400 gap-2">
              <span className="animate-pulse">正在生成...</span>
            </div>
          ) : (
            renderText()
          )}
        </div>
      )}
      
      {!hideCopy && (
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            disabled={timeLeft > 0 || isGenerating}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg transition-colors ${
              (timeLeft > 0 || isGenerating)
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : copyDone
                ? 'bg-emerald-50 text-emerald-600 border border-emerald-400'
                : 'bg-[#0052D9] text-white hover:bg-[#003BA5]'
            }`}
          >
            {isGenerating ? (
              <>生成中...</>
            ) : timeLeft > 0 ? (
              <>
                <Clock size={13} />
                请阅读全文 ({timeLeft}s)
              </>
            ) : copyDone ? (
              <>
                <Check size={13} />
                已复制
              </>
            ) : (
              <>
                <Copy size={13} />
                复制全文
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
