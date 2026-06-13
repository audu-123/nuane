import React, { useState, useEffect } from 'react';
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
function ResourceCards() {
  // [AI接入指引] 替换 learningResources 为从元器知识库检索的动态结果
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

  // [AI接入指引] 以下 mockFeedback[result] 为 Mock 硬编码数据。
  // 替换方式：在 ScoringBoard 的 handleResultSelect 中调用元器 Agent API，
  // 将返回的字符串（含 <tag>/<hl> 标签）直接传入此组件的 rawText。
  const feedback = mockFeedback[result];

  const [internalText, setInternalText] = useState(feedback.internal);
  const [externalText, setExternalText] = useState(feedback.external);

  useEffect(() => {
    setInternalText(mockFeedback[result].internal);
    setExternalText(mockFeedback[result].external);
  }, [result]);

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
