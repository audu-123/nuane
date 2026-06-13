import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { mockArchiveRecords } from '../data/mockData';
import type { InterviewRecord, ScoringDimension } from '../types';

function ScoreBar({ score }: { score: number }) {
  const isNeg = score < 0;
  const pct = Math.abs(score) / 5;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${isNeg ? 'bg-red-400' : score > 0 ? 'bg-[#0052D9]' : 'bg-gray-300'}`}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <span className={`text-xs font-mono font-bold w-6 text-right ${isNeg ? 'text-red-500' : score > 0 ? 'text-[#0052D9]' : 'text-gray-500'}`}>
        {score > 0 ? `+${score}` : score}
      </span>
    </div>
  );
}

function RecordDetail({ record }: { record: InterviewRecord }) {
  return (
    <div className="px-4 pb-4 pt-1 border-t border-gray-100 space-y-4">
      {/* Scoring chart */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">维度打分分布</div>
        <div className="space-y-2">
          {record.dimensions.map((dim) => (
            <div key={dim.id} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 w-20 flex-shrink-0 truncate">{dim.label}</span>
              <div className="flex-1">
                <ScoreBar score={dim.score ?? 0} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">面试备注</div>
        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed">
          {record.noteText || '暂无备注'}
        </p>
      </div>

      {/* Final feedback */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">对内面评</div>
          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed line-clamp-5">
            {record.feedbackInternal}
          </div>
        </div>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">对外反馈</div>
          <div className="text-xs text-gray-600 bg-gray-50 rounded-lg px-3 py-2 leading-relaxed line-clamp-5">
            {record.feedbackExternal}
          </div>
        </div>
      </div>

      {/* Send time */}
      <div className="flex items-center gap-2 text-xs text-gray-400">
        <span>📤 已于</span>
        <span className="font-medium text-gray-600">{record.sentAt}</span>
        <span>发送给候选人</span>
      </div>
    </div>
  );
}

export const InterviewArchive: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<number[]>([]);

  const filtered = mockArchiveRecords.filter(
    (r) =>
      r.candidateName.includes(searchQuery) ||
      r.position.includes(searchQuery) ||
      searchQuery === ''
  );

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">面试记录</h1>
          <p className="text-sm text-gray-400 mt-0.5">历史归档 · 共 {mockArchiveRecords.length} 条</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="🔍 按候选人姓名或岗位筛选..."
          className="w-full max-w-md px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0052D9] focus:ring-1 focus:ring-[#0052D9]/20 transition-all bg-white"
        />
      </div>

      {/* Records list */}
      <div className="space-y-3 overflow-y-auto pb-4">
        {filtered.length === 0 && (
          <div className="py-12 text-center text-sm text-gray-400">暂无匹配记录</div>
        )}
        {filtered.map((record) => {
          const isExpanded = expandedIds.includes(record.id);
          return (
            <div
              key={record.id}
              className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all"
            >
              <div className="flex items-center gap-4 px-4 py-3.5">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0052D9] to-[#3B82F6] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {record.candidateName.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="font-semibold text-gray-900 text-sm">{record.candidateName}</span>
                    <span className="text-xs text-gray-400">{record.position} · {record.round}</span>
                  </div>
                  <div className="text-xs text-gray-400">{record.date}</div>
                </div>

                {/* Result badge */}
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    record.result === 'pass'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      : 'bg-red-50 text-red-600 border border-red-200'
                  }`}
                >
                  {record.result === 'pass' ? '✅ 通过' : '❌ 未过'}
                </span>

                {/* Expand button */}
                <button
                  onClick={() => toggleExpand(record.id)}
                  className="flex items-center gap-1 text-xs text-[#0052D9] hover:text-[#003BA5] transition-colors px-2 py-1 rounded-lg hover:bg-[#EEF3FF]"
                >
                  {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  {isExpanded ? '收起' : '查看详情'}
                </button>
              </div>

              {/* Detail */}
              {isExpanded && <RecordDetail record={record} />}
            </div>
          );
        })}
      </div>
    </div>
  );
};
