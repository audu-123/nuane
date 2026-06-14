import React, { useState, useEffect } from 'react';
import { FileText, MessageSquare, Trash2, Plus } from 'lucide-react';
import { HighlightShuttle } from './HighlightShuttle';
import { SendStrategyPanel } from './SendStrategy';
import { mockFeedback } from '../data/mockData';
import { callYuanqiAI } from '../services/feishu';
import ResourceCard from './ResourceCard';
import type { ScoringDimension, LearningResource } from '../types';

interface FeedbackPanelProps {
  result: 'pass' | 'fail';
  dimensions: ScoringDimension[];
  candidateName: string;
  position: string;
  noteText: string;
  resources: LearningResource[];
  setResources: React.Dispatch<React.SetStateAction<LearningResource[]>>;
}

// ─────────────────────────────────────────────────────────────────────────────
// [AI接入指引] ── 生成面评内容（对内面评 + 对外反馈）
//
// 当前为 Mock 数据，实际应调用腾讯元器（Yuanqi）Agent API。
// 接入步骤：
//   1. 在腾讯元器平台创建一个 Agent，将以下 System Prompt 配置进去：
//      "你是一名专业的面试反馈撰写助手。请根据面试官提供的
//       【候选人姓名】【应聘岗位】【各维度评分（格式：维度名:分值）】
//       【备注标签】【面试结果（通过/未过）】，
//       生成一份对内面评和一份对外反馈。
//       对内面评：语气专业客观，总结亮点或淘汰原因。
//       对外反馈：若通过，输出《通关锦囊》；若未过，输出《成长建议书》。
//       所有涉及能力定性的关键名词请用 <tag> 包裹，定性结论词请用 <hl> 包裹。"
//   2. 获取 Agent 的 API endpoint 和 token。
//   3. 将面试官的打分数据序列化为 JSON，作为 user message 传入：
//        { candidateName, position, dimensions: [{label, score}], noteTags, result }
//   4. 解析返回的字符串，提取 <tag> 和 <hl> 标签渲染高亮。
//   参考文档：https://yuanqi.tencent.com/docs/api
//
// [AI接入指引] ── 冲突检测（打分与 AI 定性词语义背离）
//   在 System Prompt 中要求 AI 自检：
//   "若某维度打分为负（<0），但你生成的对应定性词为正面语义，
//    请在该词前插入 <conflict> 标签以触发前端冲突预警。"
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// [AI接入指引] ── 学习资源推荐卡片
//
// 当前为 Mock 数据（learningResources），实际应通过腾讯元器知识库 API 动态抓取。
// 接入步骤：
//   1. 将腾讯课堂或内部学习平台的课程数据导入元器知识库。
//   2. 以候选人低分维度标签为 query，调用元器知识库检索接口。
//   3. 取返回结果的前 2~3 条映射为 { icon, title, desc, url } 格式渲染为推荐卡片。
// ─────────────────────────────────────────────────────────────────────────────
function ResourceCards({ resources, setResources }: { resources: LearningResource[], setResources: React.Dispatch<React.SetStateAction<LearningResource[]>> }) {
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = () => {
    if (!newTitle) return;
    const newResource: LearningResource = {
      id: Date.now(),
      icon: '📘',
      title: newTitle,
      desc: newDesc,
      url: newUrl || 'https://ke.qq.com',
    };
    setResources([...resources, newResource]);
    setIsAdding(false);
    setNewTitle('');
    setNewDesc('');
    setNewUrl('');
  };

  const handleDelete = (id: number) => {
    setResources(resources.filter(r => r.id !== id));
  };

  return (
    <div className="mt-3 space-y-2">
      {resources.map((r) => (
        <div key={r.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-[#0052D9]/30 hover:shadow-sm transition-all group">
          <span className="text-xl flex-shrink-0">{r.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 mb-0.5">{r.title}</div>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{r.desc}</p>
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <button
              onClick={() => handleDelete(r.id)}
              className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              title="删除资源"
            >
              <Trash2 size={14} />
            </button>
            <a
              href={r.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-2.5 py-1 bg-[#0052D9] text-white rounded-lg hover:bg-[#003BA5] transition-colors whitespace-nowrap"
            >
              学习
            </a>
          </div>
        </div>
      ))}
      
      {isAdding ? (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
          <input
            autoFocus
            type="text"
            placeholder="资源名称"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full text-sm px-2 py-1.5 border border-gray-200 rounded outline-none focus:border-[#0052D9]"
          />
          <input
            type="text"
            placeholder="资源描述"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded outline-none focus:border-[#0052D9]"
          />
          <input
            type="text"
            placeholder="资源链接 (选填)"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            className="w-full text-xs px-2 py-1.5 border border-gray-200 rounded outline-none focus:border-[#0052D9]"
          />
          <div className="flex gap-2 justify-end mt-2">
            <button
              onClick={() => setIsAdding(false)}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
            >
              取消
            </button>
            <button
              onClick={handleAdd}
              disabled={!newTitle}
              className="text-xs bg-[#0052D9] text-white px-3 py-1 rounded hover:bg-[#003BA5] disabled:opacity-50"
            >
              确定添加
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsAdding(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-gray-300 text-gray-500 rounded-lg text-xs hover:border-[#0052D9] hover:text-[#0052D9] transition-colors"
        >
          <Plus size={14} />
          新增学习资源
        </button>
      )}
    </div>
  );
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ result, dimensions, candidateName, position, noteText, resources, setResources }) => {
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');

  const [internalText, setInternalText] = useState('');
  const [externalText, setExternalText] = useState('');

  // Fetch AI feedback when result is decided
  useEffect(() => {
    if (!result) return;
    // Reset texts
    setInternalText('');
    setExternalText('');
    // Call Yuanqi AI (fallback to mock on error)
    const fetchFeedback = async () => {
      try {
        const aiResult = await callYuanqiAI({
          result,
          dimensions,
          candidateName,
          position,
          noteText,
        });
        setInternalText(aiResult.internal);

        // Process external text: extract JSON resource cards and strip them from display
        let cleanExternal = aiResult.external;
        const jsonMatch = cleanExternal.match(/```json\s*\n([\s\S]*?)\n\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (Array.isArray(parsed)) {
              setResources(parsed.map((item: any, idx: number) => ({ ...item, id: item.id || idx })));
            }
          } catch {
            // JSON parse failed, keep existing resources
          }
          // Remove the JSON code block from the displayed text
          cleanExternal = cleanExternal.replace(/```json\s*\n[\s\S]*?\n\s*```/, '').trim();
        }
        setExternalText(cleanExternal);
      } catch (e) {
        console.error('AI feedback fetch error, falling back to mock:', e);
        // Fallback to mock
        setInternalText(mockFeedback[result].internal);
        setExternalText(mockFeedback[result].external);
      }
    };
    fetchFeedback();
  }, [result, dimensions, candidateName, position, noteText, setResources]);

  const tabs = [
    { id: 'internal' as const, label: '对内面评', icon: <FileText size={13} /> },
    { id: 'external' as const, label: '对外反馈', icon: <MessageSquare size={13} /> },
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-[#0052D9] border-b-2 border-[#0052D9] bg-[#EEF3FF]'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4">
        {activeTab === 'internal' && (
          <div>
            <HighlightShuttle
              rawText={internalText}
              onChangeRawText={setInternalText}
              dimensions={dimensions}
            />
          </div>
        )}

        {activeTab === 'external' && (
          <div className="space-y-4">
            <HighlightShuttle
              rawText={externalText}
              onChangeRawText={setExternalText}
              dimensions={dimensions}
              isMarkdown={true}
            />
            
            {/* Resource cards */}
            <div className="pt-1">
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">📚 推荐学习资源</div>
              <div className="grid gap-3">
                {resources.map((r) => (
                  <ResourceCard key={r.id} resource={r} />
                ))}
              </div>
            </div>
            {/* Send strategy */}
            <div className="pt-1 border-t border-gray-100">
              <SendStrategyPanel
                disabled={false}
                candidateName={candidateName}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
