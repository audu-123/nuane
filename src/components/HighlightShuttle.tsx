import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Check, SkipForward, AlertTriangle, Copy, Edit, Eye } from 'lucide-react';
import { CONFLICT_WORD } from '../data/mockData';

// [AI接入指引] ── 冲突检测（打分与 AI 定性词语义背离）
// 当前为 Mock 预设冲突案例，实际可在 System Prompt 中要求 AI 自检：
// "若某维度打分为负（<0），但你生成的对应定性词为正面语义，
//  请在该词前插入 <conflict> 标签以触发前端冲突预警。"

interface ParsedSegment {
  type: 'text' | 'tag' | 'hl';
  content: string;
  pairId?: string;
  hasConflict?: boolean;
}

interface ReviewPair {
  id: string;
  tagWord: string;
  hlWord: string;
  status: 'pending' | 'confirmed';
  hasConflict: boolean;
}

interface HighlightShuttleProps {
  rawText: string;
  onChangeRawText: (newText: string) => void;
  dimensions: { label: string; score: number | null }[];
  isMarkdown?: boolean;
}

function parseHighlightText(
  raw: string,
  dims: { label: string; score: number | null }[]
): { segments: ParsedSegment[]; pairs: ReviewPair[] } {
  const segments: ParsedSegment[] = [];
  const pairs: ReviewPair[] = [];
  
  // Match <tag>...<\/tag> OR <hl>...<\/hl>
  const regex = /(<tag>.*?<\/tag>|<hl>.*?<\/hl>)/g;
  let lastIndex = 0;
  let match;
  let pairIndex = 0;

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: raw.slice(lastIndex, match.index) });
    }
    
    const token = match[0];
    
    if (token.startsWith('<tag>')) {
      const tagWord = token.replace(/<\/?tag>/g, '');
      const pairId = `pair-${pairIndex++}`;
      pairs.push({ id: pairId, tagWord, hlWord: '', status: 'pending', hasConflict: false });
      segments.push({ type: 'tag', content: tagWord, pairId });
    } 
    else if (token.startsWith('<hl>')) {
      const hlWord = token.replace(/<\/?hl>/g, '');
      let pair = pairs[pairs.length - 1];
      
      // If no tag precedes this hl, or the last tag already has an hl, create a standalone pair
      if (!pair || pair.hlWord !== '') {
        const pairId = `pair-${pairIndex++}`;
        pair = { id: pairId, tagWord: '未关联维度', hlWord: '', status: 'pending', hasConflict: false };
        pairs.push(pair);
      }
      
      pair.hlWord = hlWord;
      
      const dim = dims.find((d) => d.label === pair.tagWord);
      pair.hasConflict = dim != null && dim.score !== null && (
        (dim.score > 0 && [CONFLICT_WORD, '略低预期', '不足', '生疏', '较差'].some((w) => hlWord.includes(w))) ||
        (dim.score < 0 && ['非常好', '优秀', '超出预期', '亮点', '扎实'].some((w) => hlWord.includes(w)))
      );
      
      // Update the associated tag segment's conflict status if it exists
      const tagSeg = segments.find((s) => s.pairId === pair.id && s.type === 'tag');
      if (tagSeg) tagSeg.hasConflict = pair.hasConflict;

      segments.push({ type: 'hl', content: hlWord, pairId: pair.id, hasConflict: pair.hasConflict });
    }
    
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < raw.length) {
    segments.push({ type: 'text', content: raw.slice(lastIndex) });
  }

  // Filter out pairs that have no hlWord from the control panel?
  // Actually, if there is no hlWord, the user can still confirm the tag itself.
  
  return { segments, pairs };
}

export const HighlightShuttle: React.FC<HighlightShuttleProps> = ({
  rawText,
  onChangeRawText,
  dimensions,
  isMarkdown = false,
}) => {
  const { segments: parsedSegments, pairs: parsedPairs } = useMemo(
    () => parseHighlightText(rawText, dimensions),
    [rawText, dimensions]
  );

  const [pairs, setPairs] = useState<ReviewPair[]>(parsedPairs);
  const [segments, setSegments] = useState<ParsedSegment[]>(parsedSegments);
  
  useEffect(() => {
    setSegments(parsedSegments);
    setPairs(prev => parsedPairs.map(np => {
      const existing = prev.find(p => p.tagWord === np.tagWord && p.hlWord === np.hlWord);
      return existing ? { ...np, status: existing.status } : np;
    }));
  }, [parsedSegments, parsedPairs]);

  const [currentPairIdx, setCurrentPairIdx] = useState(0);
  const [editingPairId, setEditingPairId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [copyDone, setCopyDone] = useState(false);
  const [isFullEditMode, setIsFullEditMode] = useState(false);

  const currentPair = pairs[currentPairIdx];
  const allConfirmed = pairs.length > 0 && pairs.every((p) => p.status === 'confirmed');
  const confirmedCount = pairs.filter((p) => p.status === 'confirmed').length;

  const handleSkip = useCallback(() => {
    if (pairs.length === 0) return;
    setCurrentPairIdx((prev) => (prev + 1) % pairs.length);
  }, [pairs.length]);

  const handleConfirm = () => {
    if (!currentPair) return;
    setPairs((prev) =>
      prev.map((p) => (p.id === currentPair.id ? { ...p, status: 'confirmed' } : p))
    );
    setTimeout(() => {
      const nextIdx = pairs.findIndex((p, i) => i > currentPairIdx && p.status === 'pending');
      if (nextIdx !== -1) {
        setCurrentPairIdx(nextIdx);
      } else {
        const anyIdx = pairs.findIndex((p) => p.status === 'pending');
        if (anyIdx !== -1) setCurrentPairIdx(anyIdx);
      }
    }, 100);
  };

  const handleEditStart = (pairId: string, currentHl: string) => {
    setEditingPairId(pairId);
    setEditValue(currentHl);
    const idx = pairs.findIndex((p) => p.id === pairId);
    if (idx !== -1) setCurrentPairIdx(idx);
  };

  const handleEditConfirm = () => {
    const pairToEdit = pairs.find(p => p.id === editingPairId);
    if (!pairToEdit) return;
    const newHl = editValue.trim() || pairToEdit.hlWord;
    
    let newRawText = '';
    segments.forEach(seg => {
      if (seg.type === 'text') newRawText += seg.content;
      else if (seg.type === 'tag') {
        const p = pairs.find(x => x.id === seg.pairId);
        newRawText += `<tag>${p?.tagWord ?? seg.content}</tag>`;
      } else if (seg.type === 'hl') {
        if (seg.pairId === editingPairId) newRawText += `<hl>${newHl}</hl>`;
        else {
          const p = pairs.find(x => x.id === seg.pairId);
          newRawText += `<hl>${p?.hlWord ?? seg.content}</hl>`;
        }
      }
    });
    
    setPairs(prev => prev.map(p => p.id === editingPairId ? { ...p, hlWord: newHl, status: 'pending' } : p));
    setEditingPairId(null);
    onChangeRawText(newRawText);
  };

  const handleCopy = () => {
    if (!allConfirmed && pairs.length > 0) return;
    const text = segments
      .map((seg) => {
        if (seg.type === 'text') return seg.content;
        if (seg.type === 'tag') return pairs.find((p) => p.id === seg.pairId)?.tagWord ?? seg.content;
        return pairs.find((p) => p.id === seg.pairId)?.hlWord ?? seg.content;
      })
      .join('');
    navigator.clipboard.writeText(text).then(() => {
      setCopyDone(true);
      setTimeout(() => setCopyDone(false), 2000);
    });
  };

  const handleSegmentClick = (pairId: string | undefined, isHl: boolean) => {
    if (!pairId) return;
    const idx = pairs.findIndex((p) => p.id === pairId);
    if (idx !== -1) {
      setCurrentPairIdx(idx);
      if (isHl) handleEditStart(pairId, pairs[idx].hlWord);
    }
  };

  const renderSegment = (seg: ParsedSegment, idx: number) => {
    if (seg.type === 'text') {
      let content: React.ReactNode = seg.content;
      if (isMarkdown) {
        const parts = seg.content.split(/(\*\*.*?\*\*|## .*?\n|### .*?\n)/g);
        content = parts.map((p, i) => {
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
      return <span key={idx} className="whitespace-pre-wrap">{content}</span>;
    }

    const pair = pairs.find((p) => p.id === seg.pairId);
    const isCurrent = pair?.id === currentPair?.id;
    const isConfirmed = pair?.status === 'confirmed';
    const hasConflict = pair?.hasConflict;

    if (seg.type === 'hl' && editingPairId === seg.pairId) {
      return (
        <input
          key={idx}
          autoFocus
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleEditConfirm()}
          onBlur={handleEditConfirm}
          className="inline border-b-2 border-[#0052D9] bg-transparent outline-none text-sm px-1 min-w-16"
          style={{ width: `${editValue.length + 2}ch` }}
        />
      );
    }

    let bgClass = '';
    let textClass = 'text-gray-800';
    let ringClass = isCurrent ? 'ring-2 ring-offset-1' : '';

    if (seg.type === 'tag') {
      if (isConfirmed) {
        bgClass = 'bg-[#D0E4FF]';
        ringClass = isCurrent ? 'ring-2 ring-[#0052D9] ring-offset-1' : '';
      } else {
        bgClass = 'bg-slate-200';
        ringClass = isCurrent ? 'ring-2 ring-slate-400 ring-offset-1' : '';
      }
    } else {
      if (isConfirmed) {
        bgClass = 'bg-[#D0E4FF]';
        ringClass = isCurrent ? 'ring-2 ring-[#0052D9] ring-offset-1' : '';
      } else if (hasConflict) {
        bgClass = 'bg-red-100';
        textClass = 'text-red-700';
        ringClass = isCurrent ? 'ring-2 ring-red-400 ring-offset-1' : '';
      } else {
        bgClass = 'bg-[#FFF3CD]';
        ringClass = isCurrent ? 'ring-2 ring-yellow-400 ring-offset-1' : '';
      }
    }

    return (
      <span
        key={idx}
        onClick={() => handleSegmentClick(seg.pairId, seg.type === 'hl')}
        className={`inline-block rounded px-1 cursor-pointer transition-all duration-150 ${bgClass} ${textClass} ${ringClass}`}
        title={seg.type === 'hl' ? '点击修改' : ''}
      >
        {seg.type === 'tag' ? seg.content : (pair?.hlWord ?? seg.content)}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Mode Toggle */}
      <div className="flex justify-between items-center px-1">
        <span className="text-xs text-gray-400">
          {isFullEditMode ? '自由编辑模式（含高亮标记代码）' : '穿梭审核模式（点击高亮词直接修改）'}
        </span>
        <button
          onClick={() => setIsFullEditMode(!isFullEditMode)}
          className="flex items-center gap-1 text-xs text-[#0052D9] hover:text-[#003BA5] transition-colors bg-[#EEF3FF] px-2 py-1 rounded"
        >
          {isFullEditMode ? <Eye size={12} /> : <Edit size={12} />}
          {isFullEditMode ? '返回穿梭审核' : '自由编辑全文'}
        </button>
      </div>

      {isFullEditMode ? (
        <textarea
          value={rawText}
          onChange={(e) => onChangeRawText(e.target.value)}
          rows={10}
          className="w-full bg-white rounded-lg p-3 text-sm leading-6 text-gray-700 border border-[#0052D9] focus:outline-none focus:ring-2 focus:ring-[#0052D9]/20 transition-all font-mono"
          placeholder="在此自由编辑全文..."
        />
      ) : (
        <>
          <div className="bg-gray-50 rounded-lg p-4 text-sm leading-7 text-gray-700 border border-gray-100 min-h-32">
            {segments.map((seg, idx) => renderSegment(seg, idx))}
          </div>

          {currentPair?.hasConflict && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700">
                <strong>AI 生成内容与您的打分存在逻辑冲突，请检查修改。</strong>
                <br />
                「{currentPair.tagWord}」维度打分为正，但 AI 描述为负面定性，建议点击进行调整。
              </p>
            </div>
          )}

          {pairs.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500">控制台</span>
                <span className="text-xs text-gray-400">
                  {confirmedCount}/{pairs.length} 已确认
                </span>
              </div>

              {currentPair && (
                <div className="flex items-center gap-2 mb-3 p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                  <span className="text-xs text-gray-500">当前：</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-gray-700 text-xs rounded font-medium">
                    {currentPair.tagWord}
                  </span>
                  <span className="text-gray-400 text-xs">→</span>
                  {editingPairId === currentPair.id ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleEditConfirm()}
                      onBlur={handleEditConfirm}
                      className="px-2 py-0.5 border border-[#0052D9] rounded text-xs outline-none"
                    />
                  ) : (
                    <span
                      onClick={() => {
                        if (currentPair.hlWord) handleEditStart(currentPair.id, currentPair.hlWord);
                      }}
                      className={`px-2 py-0.5 text-xs rounded font-medium ${
                        currentPair.hlWord ? 'cursor-pointer hover:ring-2 hover:ring-offset-1 transition-all' : ''
                      } ${
                        currentPair.hasConflict ? 'bg-red-100 text-red-700' : 'bg-[#FFF3CD] text-gray-700'
                      }`}
                      title={currentPair.hlWord ? '点击修改' : ''}
                    >
                      {currentPair.hlWord || '（无高亮定性词）'}
                    </span>
                  )}
                  {currentPair.status === 'confirmed' && (
                    <span className="text-xs text-emerald-600 ml-1">✓ 已确认</span>
                  )}
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  disabled={!currentPair || editingPairId !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0052D9] text-white text-xs rounded-lg hover:bg-[#003BA5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Check size={13} />
                  确认
                </button>
                <button
                  onClick={handleSkip}
                  disabled={!currentPair || editingPairId !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <SkipForward size={13} />
                  跳过
                </button>
                <button
                  onClick={handleCopy}
                  disabled={!allConfirmed && pairs.length > 0}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs rounded-lg transition-colors ${
                    (!allConfirmed && pairs.length > 0)
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : copyDone
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-400'
                      : 'bg-[#0052D9] text-white hover:bg-[#003BA5]'
                  }`}
                >
                  <Copy size={13} />
                  {copyDone ? '已复制' : '复制全文'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
