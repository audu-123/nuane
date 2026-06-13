import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { tagTemplates } from '../data/mockData';
import type { TagTemplate } from '../types';

interface TagDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  initialTags: string[];
  onApply: (tags: string[]) => void;
  title?: string;
}

export const TagDrawer: React.FC<TagDrawerProps> = ({
  isOpen,
  onClose,
  initialTags,
  onApply,
  title = '标签配置',
}) => {
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [currentTags, setCurrentTags] = useState<string[]>(initialTags);
  const [customInput, setCustomInput] = useState('');

  // 合并模板标签（自动去重）
  const handleTemplateToggle = (template: TagTemplate) => {
    const isSelected = selectedTemplates.includes(template.id);
    if (isSelected) {
      setSelectedTemplates((prev) => prev.filter((id) => id !== template.id));
      // 移除该模板独有的标签（如果没有其他模板也包含它）
      const otherTemplatesTags = tagTemplates
        .filter((t) => t.id !== template.id && selectedTemplates.includes(t.id))
        .flatMap((t) => t.tags);
      const tagsToRemove = template.tags.filter((t) => !otherTemplatesTags.includes(t));
      setCurrentTags((prev) => prev.filter((t) => !tagsToRemove.includes(t)));
    } else {
      setSelectedTemplates((prev) => [...prev, template.id]);
      // 添加不重复的标签
      const newTags = template.tags.filter((t) => !currentTags.includes(t));
      setCurrentTags((prev) => [...prev, ...newTags]);
    }
  };

  const handleRemoveTag = (tag: string) => {
    setCurrentTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleAddCustomTag = () => {
    const trimmed = customInput.trim();
    if (trimmed && !currentTags.includes(trimmed)) {
      setCurrentTags((prev) => [...prev, trimmed]);
      setCustomInput('');
    }
  };

  const handleApply = () => {
    onApply(currentTags);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white z-50 shadow-2xl flex flex-col transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* 模板库 */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              模板库
            </h3>
            <div className="space-y-2">
              {tagTemplates.map((template) => {
                const isSelected = selectedTemplates.includes(template.id);
                return (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateToggle(template)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#0052D9] bg-[#EEF3FF]'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{template.name}</span>
                      <div
                        className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          isSelected ? 'bg-[#0052D9] border-[#0052D9]' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <Check size={10} className="text-white" />}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 4 && (
                        <span className="text-xs text-gray-400">+{template.tags.length - 4}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 当前标签 */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              当前标签 <span className="text-[#0052D9] font-normal">({currentTags.length})</span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {currentTags.length === 0 && (
                <span className="text-sm text-gray-400">暂无标签，请从模板选择或手动添加</span>
              )}
              {currentTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#EEF3FF] text-[#0052D9] text-xs rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-[#003BA5] ml-0.5"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
            {/* 手动添加 */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTag()}
                placeholder="输入自定义标签..."
                className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#0052D9] focus:ring-1 focus:ring-[#0052D9]/20 transition-all"
              />
              <button
                onClick={handleAddCustomTag}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-sm flex items-center gap-1 transition-colors"
              >
                <Plus size={14} />
                添加
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-2.5 bg-[#0052D9] text-white rounded-lg text-sm font-medium hover:bg-[#003BA5] transition-colors"
            >
              确认应用
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
