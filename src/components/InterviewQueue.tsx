import React, { useState } from 'react';
import { Plus, Settings, Users, Clock, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { mockCandidates } from '../data/mockData';
import { TagDrawer } from './TagDrawer';
import type { Candidate } from '../types';

interface InterviewQueueProps {
  candidates: Candidate[];
  onCandidatesChange: (candidates: Candidate[]) => void;
  onEnterScoring: (candidate: Candidate) => void;
}

export const InterviewQueue: React.FC<InterviewQueueProps> = ({
  candidates,
  onCandidatesChange,
  onEnterScoring,
}) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTarget, setDrawerTarget] = useState<Candidate | null>(null);
  const [drawerTitle, setDrawerTitle] = useState('标签配置');

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const openSingleDrawer = (candidate: Candidate) => {
    setDrawerTarget(candidate);
    setDrawerTitle(`配置标签 · ${candidate.name}`);
    setDrawerOpen(true);
  };

  const openBatchDrawer = () => {
    setDrawerTarget(null);
    setDrawerTitle(`批量设置标签（已选 ${selectedIds.length} 人）`);
    setDrawerOpen(true);
  };

  const handleApplyTags = (tags: string[]) => {
    if (drawerTarget) {
      // 单个候选人
      onCandidatesChange(
        candidates.map((c) => (c.id === drawerTarget.id ? { ...c, tags } : c))
      );
    } else {
      // 批量
      onCandidatesChange(
        candidates.map((c) => (selectedIds.includes(c.id) ? { ...c, tags } : c))
      );
      setSelectedIds([]);
    }
  };

  const getRoundBadgeColor = (round: string) => {
    if (round.includes('一')) return 'bg-emerald-50 text-emerald-600';
    if (round.includes('二')) return 'bg-blue-50 text-blue-600';
    if (round.includes('三')) return 'bg-purple-50 text-purple-600';
    return 'bg-gray-100 text-gray-500';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">今日待面试</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
            &nbsp;· 共 {candidates.length} 位候选人
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#0052D9] text-white rounded-lg text-sm font-medium hover:bg-[#003BA5] transition-colors shadow-sm">
          <Plus size={16} />
          手动添加
        </button>
      </div>

      {/* Batch action bar */}
      {selectedIds.length > 0 && (
        <div className="mb-4 flex items-center justify-between px-4 py-3 bg-[#EEF3FF] rounded-lg border border-[#0052D9]/20">
          <span className="text-sm text-[#0052D9] font-medium">
            已选择 {selectedIds.length} 位候选人
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded"
            >
              取消选择
            </button>
            <button
              onClick={openBatchDrawer}
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 bg-[#0052D9] text-white rounded-lg hover:bg-[#003BA5] transition-colors"
            >
              <Settings size={14} />
              批量设置标签
            </button>
          </div>
        </div>
      )}

      {/* Candidate List */}
      <div className="space-y-3">
        {candidates.map((candidate) => {
          const isSelected = selectedIds.includes(candidate.id);
          return (
            <div
              key={candidate.id}
              className={`bg-white rounded-lg border transition-all duration-150 ${
                isSelected
                  ? 'border-[#0052D9] shadow-md shadow-[#0052D9]/10'
                  : 'border-gray-100 hover:border-gray-200 hover:shadow-sm'
              }`}
            >
              <div className="p-4 flex items-center gap-4">
                {/* Checkbox */}
                <button
                  onClick={() => toggleSelect(candidate.id)}
                  className="flex-shrink-0 text-gray-400 hover:text-[#0052D9] transition-colors"
                >
                  {isSelected ? (
                    <CheckSquare size={18} className="text-[#0052D9]" />
                  ) : (
                    <Square size={18} />
                  )}
                </button>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0052D9] to-[#3B82F6] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {candidate.name.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-gray-900 text-sm">{candidate.name}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getRoundBadgeColor(candidate.round)}`}>
                      {candidate.round}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-gray-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Users size={11} />
                      {candidate.position}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      {candidate.time}
                    </span>
                  </div>
                  {/* Tags preview */}
                  <div className="flex flex-wrap gap-1">
                    {candidate.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-0.5 bg-gray-50 text-gray-500 border border-gray-100 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                    {candidate.tags.length > 5 && (
                      <span className="text-xs text-gray-400 px-1">+{candidate.tags.length - 5}</span>
                    )}
                    {candidate.tags.length === 0 && (
                      <span className="text-xs text-gray-300 italic">暂无标签</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => openSingleDrawer(candidate)}
                    className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors flex items-center gap-1"
                  >
                    <Settings size={12} />
                    配置标签
                  </button>
                  <button
                    onClick={() => onEnterScoring(candidate)}
                    className="px-3 py-1.5 text-xs bg-[#0052D9] text-white rounded-lg hover:bg-[#003BA5] transition-colors flex items-center gap-1 shadow-sm"
                  >
                    进入配置
                    <ChevronRight size={12} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tag Drawer */}
      <TagDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        initialTags={drawerTarget?.tags ?? []}
        onApply={handleApplyTags}
        title={drawerTitle}
      />
    </div>
  );
};
