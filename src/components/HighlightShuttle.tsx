import React, { useState, useCallback } from 'react';
import { Check, SkipForward, Edit3, AlertTriangle, CheckCircle } from 'lucide-react';
import { CONFLICT_WORD, CONFLICT_DIM } from '../data/mockData';

// [AI接入指引]
// 冲突检测：当前为 Mock 预设冲突案例，实际可在 System Prompt 中要求 AI 自检：
// "若某维度打分为负（<0），但你生成的对应定性词为正面语义，
//  请在该词前插入 <conflict> 标签以触发前端冲突预警。"
// 预设冲突案例：算法维度打分为负值，但 AI 生成了负面定性词"比较生疏"
// 注意：此 mock 中故意预设"算法"维度打分为+2，但AI给出了"比较生疏"→ 触发语义冲突

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
  status: 'pending' | 'confirmed' | 'skipped';
  hasConflict: boolean;
}

interface HighlightShuttleProps {
  rawText: string;
  /** 已打分维度，用于检测冲突 */
  dimensions: { label: string; score: number | null }[];
}

function parseHighlightText(raw: string, dims: { label: string; score: number | null }[]): {
  segments: ParsedSegment[];
  pairs: ReviewPair[];
} {
  const segments: ParsedSegment[] = [];
  const pairs: ReviewPair[] = [];

  // 使用更灵活的正则解析
  const regex = /<tag>(.*?)<\/tag>\s*(.*?)<hl>(.*?)<\/hl>/g;
  let lastIndex = 0;
  let match;
  let pairIndex = 0;

  while ((match = regex.exec(raw)) !== null) {
    // 前置文本
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: raw.slice(lastIndex, match.index) });
    }

    const tagWord = match[1];
    const between = match[2]; // tag 和 hl 之间的连接词
    const hlWord = match[3];
    const pairId = `pair-${pairIndex++}`;

    // 检测冲突：当前维度打分与定性词语义相悖
    const dim = dims.find((d) => d.label === tagWord);
    const hasConflict =
      dim !== null &&
      dim !== undefined &&
      dim.score !== null &&
      (
        // 打分为正但 hlWord 是负面词（mock 预设）
        (dim.score > 0 && [CONFLICT_WORD, '略低预期', '不足', '生疏', '较差'].some((w) => hlWord.includes(w))) ||
        // 打分为负但 hlWord 是正面词
        (dim.score < 0 && ['非常好', '优秀', '超出预期', '亮点', '扎实'].some((w) => hlWord.includes(w)))
      );

    pairs.push({ id: pairId, tagWord, hlWord, status: 'pending', hasConflict });

    segments.push({ type: 'tag', content: tagWord, pairId, hasConflict });
    if (between) segments.push({ type: 'text', content: between });
    segments.push({ type: 'hl', content: hlWord, pairId, hasConflict });

    lastIndex = match.index + match[0].length;
  }

  // 剩余文本
  if (lastIndex < raw.length) {
    segments.push({ type: 'text', content: raw.slice(lastIndex) });
  }

  return { segments, pairs };
}

export const HighlightShuttle: React.FC<HighlightShuttleProps> = ({ rawText, dimensions }) => {
  const { segments: initialSegments, pairs: initialPairs } = parseHighlightText(rawText, dimensions);

  const [pairs, setPairs] = useState<ReviewPair[]>(initialPairs);
  const [segments, setSegments] = useState<ParsedSegment[]>(initialSegments);
  const [currentPairIdx, setCurrentPairIdx] = useState(0);
  const [editingPairId, setEditingPairId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const currentPair = pairs[currentPairIdx];
  const allDone = pairs.every((p) => p.status !== 'pending');

  const goNext = useCallback(() => {
    const nextIdx = pairs.findIndex((p, i) => i > currentPairIdx && p.status === 'pending');
    if (nextIdx !== -1) setCurrentPairIdx(nextIdx);
  }, [pairs, currentPairIdx]);

  const handleConfirm = () => {
    setPairs((prev) =>
      prev.map((p) => (p.id === currentPair.id ? { ...p, status: 'confirmed' } : p))
    );
    // auto advance
    setTimeout(() => {
      const nextIdx = pairs.findIndex((p, i) => i > currentPairIdx && p.status === 'pending');
      if (nextIdx !== -1) setCurrentPairIdx(nextIdx);
    }, 100);
  };

  const handleSkip = () => {
    setPairs((prev) =>
      prev.map((p) => (p.id === currentPair.id ? { ...p, status: 'skipped' } : p))
    );
    goNext();
  };

  const handleEditStart = () => {
    setEditingPairId(currentPair.id);
    setEditValue(currentPair.hlWord);
  };

  const handleEditConfirm = () => {
    const newHl = editValue.trim() || currentPair.hlWord;
    setPairs((prev) =>
      prev.map((p) => (p.id === editingPairId ? { ...p, hlWord: newHl } : p))
    );
    setSegments((prev) =>
      prev.map((s) =>
        s.pairId === editingPairId && s.type === 'hl' ? { ...s, content: newHl } : s
      )
    );
    setEditingPairId(null);
  };

  const handleSegmentClick = (pairId: string | undefined) => {
    if (!pairId) return;
    const idx = pairs.findIndex((p) => p.id === pairId);
    if (idx !== -1 && pairs[idx].status === 'pending') {
      setCurrentPairIdx(idx);
    }
  };

  // Render segment with highlights
  const renderSegment = (seg: ParsedSegment, idx: number) => {
    if (seg.type === 'text') {
      return (
        <span key={idx} className="whitespace-pre-wrap">
          {seg.content}
        </span>
      );
    }

    const pair = pairs.find((p) => p.id === seg.pairId);
    const isCurrent = pair?.id === currentPair?.id;
    const isConfirmed = pair?.status === 'confirmed';
    const isSkipped = pair?.status === 'skipped';
    const hasConflict = pair?.hasConflict;

    // editing inline
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
      } else if (isSkipped) {
        bgClass = 'bg-gray-100';
        textClass = 'text-gray-400';
      } else {
        bgClass = 'bg-slate-200';
        ringClass = isCurrent ? 'ring-2 ring-slate-400 ring-offset-1' : '';
      }
    } else {
      // hl type
      if (isConfirmed) {
        bgClass = 'bg-[#D0E4FF]';
        ringClass = isCurrent ? 'ring-2 ring-[#0052D9] ring-offset-1' : '';
      } else if (isSkipped) {
        bgClass = 'bg-gray-100';
        textClass = 'text-gray-400';
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
        onClick={() => handleSegmentClick(seg.pairId)}
        className={`inline-block rounded px-1 cursor-pointer transition-all duration-150 ${bgClass} ${textClass} ${ringClass}`}
      >
        {seg.type === 'tag' ? seg.content : (pair?.hlWord ?? seg.content)}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Rendered text with highlights */}
      <div className="bg-gray-50 rounded-lg p-4 text-sm leading-7 text-gray-700 border border-gray-100 min-h-32">
        {segments.map((seg, idx) => renderSegment(seg, idx))}
      </div>

      {/* Conflict warning */}
      {currentPair?.hasConflict && (
        <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg">
          <AlertTriangle size={15} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">
            <strong>AI 生成内容与您的打分存在逻辑冲突，请检查修改。</strong>
            <br />
            「{currentPair.tagWord}」维度打分为正，但 AI 描述为负面定性，建议点击「修改」调整措辞。
          </p>
        </div>
      )}

      {/* Shuttle control panel */}
      {!allDone ? (
        <div className="bg-white rounded-lg border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-gray-400">穿梭审核控制台</span>
            <span className="text-xs text-gray-400">
              {pairs.filter((p) => p.status !== 'pending').length}/{pairs.length} 已处理
            </span>
          </div>

          {currentPair && (
            <>
              {/* Current pair display */}
              <div className="flex items-center gap-2 mb-3 p-2.5 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">当前审核：</span>
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
                    className="px-2 py-0.5 border border-[#0052D9] rounded text-xs outline-none"
                  />
                ) : (
                  <span
                    className={`px-2 py-0.5 text-xs rounded font-medium ${
                      currentPair.hasConflict
                        ? 'bg-red-100 text-red-700'
                        : 'bg-[#FFF3CD] text-gray-700'
                    }`}
                  >
                    {currentPair.hlWord}
                  </span>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#0052D9] text-white text-xs rounded-lg hover:bg-[#003BA5] transition-colors"
                >
                  <Check size={13} />
                  确认
                </button>
                <button
                  onClick={handleSkip}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 text-gray-600 text-xs rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <SkipForward size={13} />
                  跳过
                </button>
                <button
                  onClick={editingPairId ? handleEditConfirm : handleEditStart}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-[#0052D9] text-[#0052D9] text-xs rounded-lg hover:bg-[#EEF3FF] transition-colors"
                >
                  <Edit3 size={13} />
                  {editingPairId ? '保存' : '修改'}
                </button>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 py-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <CheckCircle size={16} className="text-emerald-500" />
          <span className="text-sm font-medium text-emerald-700">✅ 审核完成，可进行发送设置</span>
        </div>
      )}
    </div>
  );
};
