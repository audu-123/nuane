import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { ScoringList } from './ScoringList';
import { SmartNoteBox } from './SmartNoteBox';
import { FeedbackPanel } from './FeedbackPanel';
import type { Candidate, ScoringDimension, LearningResource } from '../types';

interface ScoringBoardProps {
  candidate: Candidate;
  onBack: () => void;
  resources: LearningResource[];
  setResources: React.Dispatch<React.SetStateAction<LearningResource[]>>;
}

let dimIdCounter = 0;
function newDimId() {
  return `dim-${++dimIdCounter}-${Date.now()}`;
}

export const ScoringBoard: React.FC<ScoringBoardProps> = ({ candidate, onBack, resources, setResources }) => {
  const [dimensions, setDimensions] = useState<ScoringDimension[]>(
    candidate.tags.map((t) => ({ id: newDimId(), label: t, score: null }))
  );
  const [noteText, setNoteText] = useState('');
  const [result, setResult] = useState<'pass' | 'fail' | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  const handleScoreChange = (id: string, score: number) => {
    setDimensions((prev) =>
      prev.map((d) => (d.id === id ? { ...d, score } : d))
    );
  };

  const handleRemoveDimension = (id: string) => {
    setDimensions((prev) => prev.filter((d) => d.id !== id));
  };

  const handleAddDimension = (label: string) => {
    setDimensions((prev) => [
      ...prev,
      { id: newDimId(), label, score: null },
    ]);
  };

  // Mock AI generation with loading animation
  // [AI接入指引]
  // 此处模拟 AI 生成延迟，实际替换为：
  // const response = await fetch('https://yuanqi.tencent.com/api/v1/chat', {
  //   method: 'POST',
  //   headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     assistant_id: AGENT_ID,
  //     messages: [{ role: 'user', content: JSON.stringify({ candidate, dimensions, result, noteTags }) }],
  //   }),
  // });
  const handleResultSelect = (r: 'pass' | 'fail') => {
    if (result === r) return;
    setResult(r);
    setShowFeedback(false);
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setShowFeedback(true);
    }, 1200);
  };

  const getRoundBadgeColor = (round: string) => {
    if (round.includes('一')) return 'bg-emerald-50 text-emerald-600 border-emerald-200';
    if (round.includes('二')) return 'bg-blue-50 text-blue-600 border-blue-200';
    if (round.includes('三')) return 'bg-purple-50 text-purple-600 border-purple-200';
    return 'bg-gray-100 text-gray-500 border-gray-200';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center gap-4 mb-5">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={16} />
          返回列表
        </button>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0052D9] to-[#3B82F6] flex items-center justify-center text-white text-sm font-bold">
            {candidate.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">{candidate.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${getRoundBadgeColor(candidate.round)}`}>
                {candidate.round}
              </span>
            </div>
            <div className="text-xs text-gray-400">{candidate.position}</div>
          </div>
        </div>
      </div>

      {/* Main two-column layout */}
      <div className="flex gap-5 flex-1 min-h-0">
        {/* Left column: Scoring & Notes */}
        <div className="flex-1 min-w-0 space-y-4 overflow-y-auto pr-1 pb-4">
          <ScoringList
            dimensions={dimensions}
            onScoreChange={handleScoreChange}
            onRemoveDimension={handleRemoveDimension}
            onAddDimension={handleAddDimension}
          />
          <SmartNoteBox
            noteText={noteText}
            onNoteChange={setNoteText}
          />
        </div>

        {/* Right column: Result & AI Feedback */}
        <div className="w-[420px] flex-shrink-0 space-y-4 overflow-y-auto pb-4">
          {/* Result buttons */}
          <div className="bg-white rounded-lg border border-gray-100 p-4">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              面试结果判定
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleResultSelect('pass')}
                className={`flex flex-col items-center gap-2 py-4 px-3 rounded-lg border-2 transition-all duration-200 ${
                  result === 'pass'
                    ? 'border-emerald-400 bg-emerald-50 shadow-sm shadow-emerald-100'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'
                }`}
              >
                <CheckCircle2
                  size={28}
                  className={result === 'pass' ? 'text-emerald-500' : 'text-gray-300'}
                />
                <span className={`text-sm font-medium text-center leading-tight ${
                  result === 'pass' ? 'text-emerald-700' : 'text-gray-400'
                }`}>
                  ✅ 本轮通过
                  <br />
                  <span className="text-xs font-normal">进入下一轮</span>
                </span>
              </button>
              <button
                onClick={() => handleResultSelect('fail')}
                className={`flex flex-col items-center gap-2 py-4 px-3 rounded-lg border-2 transition-all duration-200 ${
                  result === 'fail'
                    ? 'border-red-400 bg-red-50 shadow-sm shadow-red-100'
                    : 'border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                }`}
              >
                <XCircle
                  size={28}
                  className={result === 'fail' ? 'text-red-500' : 'text-gray-300'}
                />
                <span className={`text-sm font-medium text-center leading-tight ${
                  result === 'fail' ? 'text-red-700' : 'text-gray-400'
                }`}>
                  ❌ 本轮未过
                  <br />
                  <span className="text-xs font-normal">不予通过</span>
                </span>
              </button>
            </div>
          </div>

          {/* AI Generation loading */}
          {isGenerating && (
            <div className="flex items-center gap-3 p-4 bg-[#EEF3FF] rounded-lg border border-[#0052D9]/20">
              <Zap size={16} className="text-[#0052D9] animate-pulse" />
              <div>
                <div className="text-sm font-medium text-[#0052D9]">AI 正在生成面评内容...</div>
                <div className="text-xs text-[#0052D9]/60 mt-0.5">正在分析评分维度与备注标签</div>
              </div>
              <div className="ml-auto flex gap-1">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-[#0052D9] rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Feedback Panel */}
          {showFeedback && result && (
            <FeedbackPanel
              result={result}
              dimensions={dimensions}
              candidateName={candidate.name}
              resources={resources}
              setResources={setResources}
            />
          )}

          {!result && !isGenerating && (
            <div className="p-6 text-center text-sm text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
              <Zap size={24} className="text-gray-300 mx-auto mb-2" />
              点击上方「通过」或「未过」按钮后，AI 将自动生成面评报告
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
