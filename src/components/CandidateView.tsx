import React, { useState } from 'react';
import { BookOpen, ExternalLink, Heart } from 'lucide-react';
import { learningResources } from '../data/mockData';

// 模拟候选人接收到的反馈内容（来自面试官发送的对外反馈）
// [AI接入指引]
// 实际应通过微信公众号 H5 消息推送能力接收，接入步骤：
// 1. 在微信公众平台创建服务号并获取 AppID/AppSecret。
// 2. 用户关注公众号后，绑定招聘系统中的候选人 ID。
// 3. 调用「模板消息」或「订阅消息」接口，将反馈链接推送给候选人微信。
// 4. 候选人点击链接后打开此 H5 页面，通过 URL 参数获取对应的反馈内容。
const MOCK_RESULT: 'pass' | 'fail' = 'fail'; // 模拟当前候选人收到的是"未过"反馈

const passContent = `
恭喜您顺利通过本轮面试！🎉

我们对您在面试中展现出的 React 工程能力和 TypeScript 深度印象深刻。您对技术细节的把握，以及清晰的表达方式，让面试官认为您非常适合进入下一轮考察。

**下一轮面试提示：**
三面将着重考察系统架构设计与跨团队协作能力，请提前准备相关经历与思考框架。期待您的精彩表现！
`;

const failContent = `
感谢您参与本次面试，以下是我们为您精心准备的成长建议 💪

**您的亮点：**
在面试过程中，您展现出了良好的 React 基础理解和清晰的沟通表达能力。面试官注意到您对新技术保持着积极的探索热情，这是优秀工程师最重要的特质。

**成长建议：**

算法能力方面：建议从基础数据结构入手，每天坚持 1-2 道 LeetCode 练习，循序渐进。算法是可以通过系统训练显著提升的技能，不要焦虑。

系统设计方面：可以尝试从实际项目出发，思考"如果流量增长10倍，当前方案会在哪里遇到瓶颈"。推荐阅读《设计数据密集型应用》，建立系统性思维框架。

期待在未来的机会中再次见到您更出色的表现！
`;

function renderSimpleMarkdown(text: string) {
  return text.trim().split('\n').map((line, i) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <p key={i} className="font-bold text-gray-900 mt-4 mb-1">{line.slice(2, -2)}</p>;
    }
    const html = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    if (line.trim() === '') return <div key={i} className="h-2" />;
    return <p key={i} className="text-sm text-gray-700 leading-relaxed mb-1" dangerouslySetInnerHTML={{ __html: html }} />;
  });
}

export const CandidateView: React.FC = () => {
  const [consent, setConsent] = useState<'yes' | 'no' | null>(null);
  const result = MOCK_RESULT;

  return (
    <div className="flex flex-col h-full">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900">候选人视角</h1>
        <p className="text-sm text-gray-400 mt-0.5">模拟候选人在微信公众号 H5 内看到的页面</p>
      </div>

      {/* Phone frame */}
      <div className="flex justify-center py-2">
        <div className="w-80 bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-200" style={{ minHeight: '600px' }}>
          {/* Status bar */}
          <div className="bg-[#07C160] px-4 py-2 flex items-center justify-between">
            <span className="text-white text-xs font-medium">腾讯招聘</span>
            <div className="flex items-center gap-1">
              <BookOpen size={12} className="text-white opacity-80" />
              <span className="text-white text-xs opacity-80">官方服务号</span>
            </div>
          </div>

          {/* H5 Content */}
          <div className="overflow-y-auto" style={{ maxHeight: '560px' }}>
            {/* Header */}
            <div className="bg-gradient-to-b from-[#0052D9] to-[#003BA5] px-5 pt-6 pb-8 text-white">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">T</span>
                </div>
                <div>
                  <div className="font-bold text-sm">腾讯招聘</div>
                  <div className="text-xs opacity-70">面试反馈通知</div>
                </div>
              </div>
              <div className="text-xl font-bold mb-1">您好，李明 👋</div>
              <div className="text-xs opacity-80">感谢您参与腾讯互娱前端工程师二面</div>
            </div>

            <div className="px-4 -mt-4 space-y-3 pb-6">
              {/* Result card */}
              <div className={`rounded-xl p-4 shadow-sm ${result === 'pass' ? 'bg-emerald-50 border border-emerald-200' : 'bg-white border border-gray-100'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{result === 'pass' ? '🎉' : '📋'}</span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {result === 'pass' ? '恭喜，本轮通过！' : '感谢您的参与'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  {result === 'pass'
                    ? '您已顺利进入下一轮面试，请留意后续通知。'
                    : '本次面试已结束，我们对您的参与表示衷心感谢。'}
                </p>
              </div>

              {/* Consent card */}
              {consent === null && (
                <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    您是否希望接收本次面试的成长建议？
                  </p>
                  <p className="text-xs text-gray-400 mb-3">
                    暖鹅为您准备了专属的{result === 'pass' ? '通关锦囊' : '成长建议书'}，内含详细反馈与学习资源。
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConsent('yes')}
                      className="flex-1 py-2.5 bg-[#0052D9] text-white text-sm rounded-xl font-medium hover:bg-[#003BA5] transition-colors"
                    >
                      是，展示建议
                    </button>
                    <button
                      onClick={() => setConsent('no')}
                      className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm rounded-xl font-medium hover:bg-gray-50 transition-colors"
                    >
                      否，仅告知结果
                    </button>
                  </div>
                </div>
              )}

              {/* No consent */}
              {consent === 'no' && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-center">
                  <p className="text-sm text-gray-700 font-medium">
                    {result === 'pass' ? '✅ 本轮面试：通过' : '本轮面试已结束'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">如需查看详细建议，请联系 HR 获取。</p>
                </div>
              )}

              {/* Full content */}
              {consent === 'yes' && (
                <div className="space-y-3">
                  {/* Main feedback */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-base">{result === 'pass' ? '🗝️' : '🌱'}</span>
                      <span className="font-bold text-gray-900 text-sm">
                        {result === 'pass' ? '通关锦囊' : '成长建议书'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      {renderSimpleMarkdown(result === 'pass' ? passContent : failContent)}
                    </div>
                  </div>

                  {/* Learning resources */}
                  <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      📚 推荐学习资源
                    </div>
                    <div className="space-y-2.5">
                      {learningResources.slice(0, 2).map((r) => (
                        <div key={r.id} className="flex items-start gap-2.5 p-2.5 bg-gray-50 rounded-lg">
                          <span className="text-base flex-shrink-0">{r.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-800 mb-0.5">{r.title}</div>
                            <p className="text-xs text-gray-400 leading-snug line-clamp-2">{r.desc}</p>
                          </div>
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-shrink-0 flex items-center gap-0.5 text-xs text-[#0052D9] font-medium whitespace-nowrap"
                          >
                            学习 <ExternalLink size={10} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="text-center py-3">
                <p className="text-xs text-gray-400 flex items-center justify-center gap-1">
                  感谢您的关注，祝您职业发展顺利
                  <Heart size={10} className="text-red-400" />
                </p>
                <p className="text-xs text-gray-300 mt-0.5">腾讯招聘团队</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
