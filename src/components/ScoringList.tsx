import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { SCORE_ANCHORS } from '../data/mockData';
import type { ScoringDimension } from '../types';

interface ScoringListProps {
  dimensions: ScoringDimension[];
  onScoreChange: (id: string, score: number) => void;
  onRemoveDimension: (id: string) => void;
  onAddDimension: (label: string) => void;
}

const SCORES = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5];
const ANCHOR_SCORES = [-5, -3, -1, 0, 1, 3, 5];

function getRowBg(score: number | null): string {
  if (score === null) return 'bg-white';
  if (score < 0) return 'bg-[#FFF0F0]';
  if (score > 0) return 'bg-[#F0F5FF]';
  return 'bg-white';
}

function getNodeColor(nodeScore: number, currentScore: number | null): string {
  if (currentScore === null || nodeScore !== currentScore) {
    return 'bg-white border-gray-200';
  }
  if (currentScore < 0) return 'bg-white border-red-400';
  if (currentScore > 0) return 'bg-white border-[#0052D9]';
  return 'bg-white border-gray-500';
}

function getSelectedNodeColor(nodeScore: number, currentScore: number | null): string {
  if (currentScore === null || nodeScore !== currentScore) {
    return 'bg-gray-200 border-gray-200';
  }
  if (currentScore < 0) return 'bg-red-500 border-red-500';
  if (currentScore > 0) return 'bg-[#0052D9] border-[#0052D9]';
  return 'bg-gray-500 border-gray-500';
}

export const ScoringList: React.FC<ScoringListProps> = ({
  dimensions,
  onScoreChange,
  onRemoveDimension,
  onAddDimension,
}) => {
  const [newDimInput, setNewDimInput] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);

  const handleAdd = () => {
    const trimmed = newDimInput.trim();
    if (trimmed) {
      onAddDimension(trimmed);
      setNewDimInput('');
      setShowAddInput(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">维度评分</h3>
        <button
          onClick={() => setShowAddInput(true)}
          className="flex items-center gap-1 text-xs text-[#0052D9] hover:text-[#003BA5] transition-colors"
        >
          <Plus size={13} />
          新增维度
        </button>
      </div>

      {/* Add input */}
      {showAddInput && (
        <div className="flex gap-2 px-4 py-3 bg-[#F8FAFF] border-b border-gray-100">
          <input
            autoFocus
            type="text"
            value={newDimInput}
            onChange={(e) => setNewDimInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAdd();
              if (e.key === 'Escape') setShowAddInput(false);
            }}
            placeholder="输入维度名称，Enter 确认..."
            className="flex-1 px-3 py-1.5 text-sm border border-[#0052D9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0052D9]/20"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 bg-[#0052D9] text-white text-xs rounded-lg hover:bg-[#003BA5] transition-colors"
          >
            添加
          </button>
          <button
            onClick={() => setShowAddInput(false)}
            className="px-3 py-1.5 border border-gray-200 text-gray-500 text-xs rounded-lg hover:bg-gray-50"
          >
            取消
          </button>
        </div>
      )}

      {/* Dimension rows */}
      {dimensions.length === 0 && (
        <div className="px-4 py-8 text-center text-sm text-gray-400">
          暂无评分维度，请点击「新增维度」或从标签配置中同步
        </div>
      )}
      {dimensions.map((dim, idx) => (
        <div
          key={dim.id}
          className={`transition-colors duration-300 ${getRowBg(dim.score)} ${
            idx < dimensions.length - 1 ? 'border-b border-gray-100' : ''
          }`}
        >
          <div className="px-4 py-3">
            {/* Row header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-700">{dim.label}</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onRemoveDimension(dim.id)}
                  className="text-gray-300 hover:text-red-400 transition-colors"
                  title="删除此维度"
                >
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Score bar - 3 independent flex rows for perfect centering */}
            <div className="relative px-2 mb-2">
              {/* Row 1: Score numbers */}
              <div className="flex justify-between relative z-10">
                {SCORES.map((s) => {
                  const isSelected = dim.score === s;
                  return (
                    <div key={s} className="w-[40px] flex justify-center h-4 items-end mb-1">
                      <span
                        className={`text-[10px] leading-none ${
                          isSelected
                            ? dim.score! < 0 ? 'text-red-500 font-bold text-[11px]' : dim.score! > 0 ? 'text-[#0052D9] font-bold text-[11px]' : 'text-gray-600 font-bold text-[11px]'
                            : 'text-gray-400'
                        }`}
                      >
                        {s > 0 ? `+${s}` : s}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Row 2: Track line & Nodes */}
              <div className="relative h-4 flex items-center my-1.5">
                {/* Track line perfectly centered in the row */}
                <div className="absolute left-5 right-5 h-[2px] bg-gray-200 z-0" />
                
                <div className="relative z-10 w-full flex justify-between">
                  {SCORES.map((s) => {
                    const isAnchor = ANCHOR_SCORES.includes(s);
                    const isSelected = dim.score === s;
                    
                    return (
                      <div key={s} className="w-[40px] flex justify-center items-center">
                        <button
                          onClick={() => onScoreChange(dim.id, s)}
                          title={SCORE_ANCHORS[s] || String(s)}
                          className={`rounded-full border-[3px] transition-all duration-150 ${
                            isSelected
                              ? `w-4 h-4 ${getSelectedNodeColor(s, dim.score)} scale-125 shadow-sm`
                              : `${isAnchor ? 'w-[14px] h-[14px]' : 'w-2.5 h-2.5'} ${getNodeColor(s, dim.score)}`
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Row 3: Anchor text */}
              <div className="flex justify-between">
                {SCORES.map((s) => {
                  const isAnchor = ANCHOR_SCORES.includes(s);
                  return (
                    <div key={s} className="w-[40px] flex justify-center h-6 mt-1">
                      {isAnchor && (
                        <span className="text-center text-gray-400 leading-[1.1]" style={{ fontSize: '10px', width: '36px' }}>
                          {SCORE_ANCHORS[s]}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
