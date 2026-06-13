import React, { useState } from 'react';
import { FileText, MessageSquare } from 'lucide-react';
import { HighlightShuttle } from './HighlightShuttle';
import { SendStrategyPanel } from './SendStrategy';
import { mockFeedback, learningResources } from '../data/mockData';
import type { ScoringDimension } from '../types';

interface FeedbackPanelProps {
  result: 'pass' | 'fail';
  dimensions: ScoringDimension[];
  candidateName: string;
}

// [AI接入指引]
// 当前为 Mock 数据，实际应调用腾讯元器（Yuanqi）Agent API。
// 接入步骤：
// 1. 在腾讯元器平台创建一个 Agent，将以下 System Prompt 配置进去：
//    "你是一名专业的面试反馈撰写助手。请根据面试官提供的【候选人姓名】【应聘岗位】
//     【各维度评分（格式：维度名:分值）】【备注标签】【面试结果（通过/未过）】，
//     生成一份对内面评和一份对外反馈。
//     对内面评：语气专业客观，总结亮点或淘汰原因。
//     对外反馈：若通过，输出《通关锦囊》；若未过，输出《成长建议书》。
//     所有涉及能力定性的关键名词请用 <tag> 包裹，定性结论词请用 <hl> 包裹。"
// 2. 获取 Agent 的 API endpoint 和 token。
// 3. 将面试官的打分数据序列化为 JSON，作为 user message 传入。
// 4. 解析返回的字符串，提取 <tag> 和 <hl> 标签渲染高亮。
// 参考文档：https://yuanqi.tencent.com/docs/api

function renderMarkdown(text: string) {
  // Simple markdown-ish renderer for the mock data
  return text.split('\n').map((line, i) => {
    if (line.startsWith('## ')) {
      return <h2 key={i} className="text-base font-bold text-gray-900 mt-4 mb-2">{line.slice(3)}</h2>;
    }
    if (line.startsWith('### ')) {
      return <h3 key={i} className="text-sm font-semibold text-gray-800 mt-3 mb-1.5">{line.slice(4)}</h3>;
    }
    if (line.startsWith('- ')) {
      // bold and links
      const content = line.slice(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return (
        <li key={i} className="text-sm text-gray-700 ml-4 mb-1 list-disc"
          dangerouslySetInnerHTML={{ __html: content }} />
      );
    }
    if (line.startsWith('[') && line.includes('](')) {
      const m = line.match(/\[(.*?)\]\((.*?)\)/);
      if (m) {
        return (
          <a key={i} href={m[2]} target="_blank" rel="noopener noreferrer"
            className="block text-sm text-[#0052D9] hover:underline mb-1">
            🔗 {m[1]}
          </a>
        );
      }
    }
    if (line.trim() === '') return <div key={i} className="h-1" />;
    // bold inline
    const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    return <p key={i} className="text-sm text-gray-700 mb-1" dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

// [AI接入指引]
// 学习资源推荐卡片：当前为 Mock 数据，实际应通过腾讯元器知识库 API 动态抓取。
// 接入步骤：
// 1. 将腾讯课堂或内部学习平台的课程数据导入元器知识库。
// 2. 以候选人低分维度标签为 query，调用元器知识库检索接口。
// 3. 取返回结果的前 2~3 条渲染为推荐卡片。
function ResourceCards() {
  return (
    <div className="mt-3 space-y-2">
      {learningResources.map((r) => (
        <div key={r.id} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-[#0052D9]/30 hover:shadow-sm transition-all">
          <span className="text-xl flex-shrink-0">{r.icon}</span>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-gray-800 mb-0.5">{r.title}</div>
            <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{r.desc}</p>
          </div>
          <a
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 text-xs px-2.5 py-1 bg-[#0052D9] text-white rounded-lg hover:bg-[#003BA5] transition-colors whitespace-nowrap"
          >
            立即学习
          </a>
        </div>
      ))}
    </div>
  );
}

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ result, dimensions, candidateName }) => {
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');
  const [shuttleComplete, setShuttleComplete] = useState(false);

  const feedback = mockFeedback[result];

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
            <div className="mb-3">
              <div className="text-xs text-gray-400 mb-2">对内面评内容（含高亮穿梭审核）：</div>
            </div>
            {/* Highlight shuttle for internal feedback */}
            <HighlightShuttle
              rawText={feedback.internal}
              dimensions={dimensions}
            />
          </div>
        )}

        {activeTab === 'external' && (
          <div className="space-y-4">
            <div className="text-sm text-gray-700 leading-relaxed">
              {renderMarkdown(feedback.external)}
            </div>
            {/* Resource cards */}
            <div className="pt-1">
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">📚 推荐学习资源</div>
              <ResourceCards />
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
