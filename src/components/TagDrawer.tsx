import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Save, Trash2 } from 'lucide-react';
import { tagTemplates as initialTagTemplates } from '../data/mockData';
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
  const [templates, setTemplates] = useState<TagTemplate[]>(initialTagTemplates);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [currentTags, setCurrentTags] = useState<string[]>(initialTags);
  const [customInput, setCustomInput] = useState('');
  
  // T1: Save as template state
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  // Reset state when opened with new props
  useEffect(() => {
    if (isOpen) {
      setCurrentTags(initialTags);
      setSelectedTemplates([]);
      setShowSaveTemplate(false);
      setNewTemplateName('');
      // Sync templates from global in case it was modified in another instance
      setTemplates(initialTagTemplates);
    }
  }, [isOpen, initialTags]);

  // 合并模板标签（自动去重）
  const handleTemplateToggle = (template: TagTemplate) => {
    const isSelected = selectedTemplates.includes(template.id);
    if (isSelected) {
      setSelectedTemplates((prev) => prev.filter((id) => id !== template.id));
      // 移除该模板独有的标签（如果没有其他模板也包含它）
      const otherTemplatesTags = templates
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

  // T1 & T2: Add and delete template functionality
  const handleSaveTemplate = () => {
    const trimmedName = newTemplateName.trim();
    if (trimmedName && currentTags.length > 0) {
      const newTemplate: TagTemplate = {
        id: `custom-${Date.now()}`,
        name: trimmedName,
        tags: [...currentTags],
      };
      
      // Update local and global state
      const updatedTemplates = [...templates, newTemplate];
      setTemplates(updatedTemplates);
      initialTagTemplates.push(newTemplate); // Mutate global array to persist across unmounts
      
      setSelectedTemplates(prev => [...prev, newTemplate.id]);
      setShowSaveTemplate(false);
      setNewTemplateName('');
    }
  };

  const handleDeleteTemplate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Prevent template toggle
    const updatedTemplates = templates.filter(t => t.id !== id);
    setTemplates(updatedTemplates);
    
    // Also remove from global array
    const globalIdx = initialTagTemplates.findIndex(t => t.id === id);
    if (globalIdx !== -1) initialTagTemplates.splice(globalIdx, 1);
    
    // If it was selected, unselect it
    setSelectedTemplates(prev => prev.filter(tid => tid !== id));
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
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                模板库
              </h3>
              <span className="text-[10px] text-gray-400">点击选择/取消</span>
            </div>
            <div className="space-y-2">
              {templates.length === 0 && (
                <div className="text-xs text-gray-400 text-center py-4 bg-gray-50 rounded-lg border border-dashed">
                  模板库为空，请在下方保存新模板
                </div>
              )}
              {templates.map((template) => {
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
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => handleDeleteTemplate(e, template.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                          title="删除模板"
                        >
                          <Trash2 size={13} />
                        </button>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                            isSelected ? 'bg-[#0052D9] border-[#0052D9]' : 'border-gray-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check size={10} className="text-white" />}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className={`text-[11px] px-2 py-0.5 rounded-full ${
                            isSelected ? 'bg-white text-[#0052D9]' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {tag}
                        </span>
                      ))}
                      {template.tags.length > 4 && (
                        <span className={`text-[11px] ${isSelected ? 'text-[#0052D9]' : 'text-gray-400'}`}>
                          +{template.tags.length - 4}
                        </span>
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
              当前配置标签 <span className="text-[#0052D9] font-normal">({currentTags.length})</span>
            </h3>
            <div className="flex flex-wrap gap-2 mb-3">
              {currentTags.length === 0 && (
                <span className="text-xs text-gray-400">暂无标签，请从上方模板选择或手动添加</span>
              )}
              {currentTags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-[#0052D9] text-white shadow-sm text-xs rounded-full"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-200 ml-0.5 transition-colors"
                  >
                    <X size={12} />
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

            {/* 保存为模板 */}
            {currentTags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                {showSaveTemplate ? (
                  <div className="flex gap-2 items-center bg-[#F8FAFF] p-2 rounded-lg border border-[#D0E4FF]">
                    <input
                      autoFocus
                      type="text"
                      value={newTemplateName}
                      onChange={(e) => setNewTemplateName(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveTemplate()}
                      placeholder="输入模板名称..."
                      className="flex-1 px-2 py-1.5 text-xs border border-[#0052D9] rounded focus:outline-none"
                    />
                    <button
                      onClick={handleSaveTemplate}
                      className="px-3 py-1.5 bg-[#0052D9] text-white text-xs rounded hover:bg-[#003BA5] transition-colors flex items-center gap-1"
                    >
                      <Save size={12} /> 保存
                    </button>
                    <button
                      onClick={() => setShowSaveTemplate(false)}
                      className="px-3 py-1.5 border border-gray-200 bg-white text-gray-600 text-xs rounded hover:bg-gray-50 transition-colors"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowSaveTemplate(true)}
                    className="flex items-center justify-center w-full gap-1.5 py-2 border border-dashed border-[#0052D9] text-[#0052D9] text-xs rounded-lg hover:bg-[#EEF3FF] transition-colors"
                  >
                    <Save size={13} />
                    将当前标签存为模板
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-100 bg-gray-50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 bg-white text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm"
            >
              取消
            </button>
            <button
              onClick={handleApply}
              className="flex-1 py-2.5 bg-[#0052D9] text-white rounded-lg text-sm font-medium hover:bg-[#003BA5] transition-colors shadow-sm"
            >
              确认应用 ({currentTags.length})
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
