import React, { useState, useEffect } from 'react';
import { FileText, MessageSquare, Trash2, Plus } from 'lucide-react';
import { ReadingViewer } from './ReadingViewer';
import { SendStrategyPanel } from './SendStrategy';
import { mockFeedback } from '../data/mockData';
import { callYuanqiAI } from '../services/feishu';
import ResourceCard from './ResourceCard';
import type { ScoringDimension, LearningResource } from '../types';

interface FeedbackPanelProps {
  result: 'pass' | 'fail';
  dimensions: ScoringDimension[];
  candidateName: string;
  round: string;
  position: string;
  noteText: string;
  resources: LearningResource[];
  setResources: React.Dispatch<React.SetStateAction<LearningResource[]>>;
  onSent: (internal: string, external: string) => void;
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
//       对外反馈：若通过，输出《通关锦囊》；若未过，输出《成长建议书》。"
//   2. 获取 Agent 的 API endpoint 和 token。
//   3. 将面试官的打分数据序列化为 JSON，作为 user message 传入：
//        { candidateName, position, dimensions: [{label, score}], noteTags, result }
//   参考文档：https://yuanqi.tencent.com/docs/api
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
    <div className="space-y-2">
      {resources.length > 0 ? resources.map((r) => (
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
      )) : !isAdding && (
        <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center">
          <p className="text-xs text-gray-400">暂时没有相关学习资源</p>
        </div>
      )}
      
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

export const FeedbackPanel: React.FC<FeedbackPanelProps> = ({ result, dimensions, candidateName, round, position, noteText, resources, setResources, onSent }) => {
  const [activeTab, setActiveTab] = useState<'internal' | 'external'>('internal');
  const [canCopyInternal, setCanCopyInternal] = useState(false);
  const [canSendExternal, setCanSendExternal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [internalTimeLeft, setInternalTimeLeft] = useState(10);
  const [externalTimeLeft, setExternalTimeLeft] = useState(10);
  const [isPageVisible, setIsPageVisible] = useState(true);

  useEffect(() => {
    const handleVisibilityChange = () => setIsPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const [internalText, setInternalText] = useState('');
  const [externalText, setExternalText] = useState('');

  // Fetch AI feedback when result is decided
  useEffect(() => {
    if (!result) return;
    // Reset texts
    setInternalText('');
    setExternalText('');
    setResources([]);
    setIsGenerating(true);
    setCanCopyInternal(false);
    setCanSendExternal(false);
    setInternalTimeLeft(10);
    setExternalTimeLeft(10);
    // Call Yuanqi AI (fallback to mock on error)
    const fetchFeedback = async () => {
      try {
        const aiResult = await callYuanqiAI({
          result,
          dimensions,
          candidateName,
          round,
          position,
          noteText,
        });
        setInternalText(aiResult.internal);

        // Process external text: extract JSON resource cards and strip them from display
        let cleanExternal = aiResult.external;
        
        // Safety net: aggressively strip any "视角轮盘" or "xxx视角" mentions that AI might accidentally output
        cleanExternal = cleanExternal.replace(/\*?\s*\(?视角轮盘[：:].*?\)?\s*\*?/g, '').trim();
        cleanExternal = cleanExternal.replace(/（?以?.*?视角.*?）?/g, '').trim();

        // 优先匹配 ```json ... ```，如果没有则尝试匹配包含对象的 JSON 数组 [ { ... } ]
        const jsonMatch = cleanExternal.match(/```json\s*([\s\S]*?)\s*```/) || cleanExternal.match(/(\[\s*\{[\s\S]*\}\s*\])/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            const parsed = JSON.parse(jsonMatch[1]);
            if (Array.isArray(parsed)) {
              setResources(parsed.map((item: any, idx: number) => ({ ...item, id: item.id || idx })));
            }
          } catch {
            // JSON parse failed, keep existing resources
          }
          // Remove the JSON code block from the displayed text (handle both cases)
          cleanExternal = cleanExternal.replace(/```json\s*[\s\S]*?\s*```/, '').replace(/\[\s*\{[\s\S]*\}\s*\]/, '').trim();
        }
        setExternalText(cleanExternal);
      } catch (e) {
        console.error('AI feedback fetch error, falling back to mock:', e);
        // Fallback to mock
        const isFinal = round.includes('终') || round.includes('最后') || round.includes('三') || round.toUpperCase().includes('HR');
        const mockKey = (result === 'pass' && isFinal) ? 'passFinal' : result;
        setInternalText((mockFeedback as any)[mockKey]?.internal || mockFeedback[result].internal);
        setExternalText((mockFeedback as any)[mockKey]?.external || mockFeedback[result].external);

        // Generate mock resources dynamically based on negative dimensions
        const MOCK_RESOURCE_DB: Record<string, LearningResource> = {
          '算法': { id: 1, icon: '⚡', title: '算法与数据结构系统课', desc: '从基础到进阶，涵盖数组、链表、树等核心主题。', url: 'https://ke.qq.com' },
          '系统设计': { id: 2, icon: '🏗️', title: '系统架构设计实战', desc: '深入解析大规模应用架构设计，包含高并发与微服务。', url: 'https://ke.qq.com' },
          'react': { id: 3, icon: '📘', title: 'React 进阶与原理解析', desc: '深入 React 底层实现，掌握 Fiber、Hooks 核心原理。', url: 'https://ke.qq.com' },
          '用户洞察': { id: 4, icon: '👁️', title: '用户体验与需求洞察', desc: '从场景出发，深入理解用户需求，提升产品同理心。', url: 'https://ke.qq.com' },
          '需求分析': { id: 5, icon: '📊', title: '高阶需求分析方法论', desc: '掌握需求真伪辨别、优先级排序及业务价值度量。', url: 'https://ke.qq.com' },
          '产品思维': { id: 6, icon: '💡', title: '产品经理的底层逻辑', desc: '构建系统化产品思维体系，从0到1拆解产品设计。', url: 'https://ke.qq.com' },
          '沟通': { id: 7, icon: '💬', title: '跨部门协作与高效沟通', desc: '提升职场沟通技巧，解决跨团队协作中的冲突。', url: 'https://ke.qq.com' },
          'go': { id: 8, icon: '🐹', title: 'Go 语言高并发实战', desc: '深入学习 Goroutine、Channel 与底层并发模型。', url: 'https://ke.qq.com' },
          '数据分析': { id: 9, icon: '📈', title: '数据驱动业务决策', desc: '利用 SQL 与统计学思维，从海量数据中挖掘业务增长点。', url: 'https://ke.qq.com' },
          '项目管理': { id: 10, icon: '📅', title: '敏捷项目管理与落地', desc: '掌握 Scrum 与 Kanban，提升团队交付效率。', url: 'https://ke.qq.com' },
        };

        const lowScoreDims = dimensions.filter(d => d.score !== null && d.score < 0);
        if (lowScoreDims.length > 0) {
          const generatedResources = lowScoreDims.map((d, i) => {
            const matchKey = Object.keys(MOCK_RESOURCE_DB).find(k => d.label.toLowerCase().includes(k.toLowerCase()));
            if (matchKey) {
              return { ...MOCK_RESOURCE_DB[matchKey], id: Date.now() + i };
            }
            return {
              id: Date.now() + i,
              icon: '📚',
              title: `${d.label} 专项提升课程`,
              desc: `针对 ${d.label} 能力的系统性强化训练，弥补知识盲区。`,
              url: 'https://ke.qq.com'
            };
          });
          setResources(generatedResources);
        } else {
          setResources([]);
        }
      } finally {
        setIsGenerating(false);
      }
    };
    fetchFeedback();
  }, [result, dimensions, candidateName, position, noteText, setResources]);

  useEffect(() => {
    if (isGenerating || !isPageVisible) return;

    if (activeTab === 'internal') {
      if (internalTimeLeft > 0) {
        const timer = setTimeout(() => setInternalTimeLeft(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else if (!canCopyInternal) {
        setCanCopyInternal(true);
      }
    } else if (activeTab === 'external') {
      if (externalTimeLeft > 0) {
        const timer = setTimeout(() => setExternalTimeLeft(prev => prev - 1), 1000);
        return () => clearTimeout(timer);
      } else if (!canSendExternal) {
        setCanSendExternal(true);
      }
    }
  }, [internalTimeLeft, externalTimeLeft, activeTab, isGenerating, isPageVisible, canCopyInternal, canSendExternal]);

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
            <ReadingViewer
              rawText={internalText}
              isGenerating={isGenerating}
              timeLeft={internalTimeLeft}
              onChangeRawText={setInternalText}
            />
          </div>
        )}

        {activeTab === 'external' && (
          <div className="space-y-4">
            <ReadingViewer
              rawText={externalText}
              isMarkdown={true}
              isGenerating={isGenerating}
              timeLeft={externalTimeLeft}
              hideCopy={true}
              onChangeRawText={setExternalText}
            />
            
            {/* Resource cards */}
            <div className="pt-1">
              <div className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">📚 推荐学习资源</div>
              <ResourceCards resources={resources} setResources={setResources} />
            </div>
            {/* Send strategy */}
            <div className="pt-1 border-t border-gray-100">
              <SendStrategyPanel
                disabled={!canSendExternal}
                isGenerating={isGenerating}
                timeLeft={externalTimeLeft}
                candidateName={candidateName}
                onSent={() => onSent(internalText, externalText)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
