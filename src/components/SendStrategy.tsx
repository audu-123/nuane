import React, { useState } from 'react';
import { Clock, Send, Calendar, CheckCircle } from 'lucide-react';
import type { SendStrategy } from '../types';

interface SendStrategyPanelProps {
  disabled?: boolean;
  isGenerating?: boolean;
  timeLeft?: number;
  candidateName: string;
  onSent?: () => void;
}

export const SendStrategyPanel: React.FC<SendStrategyPanelProps> = ({
  disabled = false,
  isGenerating = false,
  timeLeft = 0,
  candidateName,
  onSent,
}) => {
  const [strategy, setStrategy] = useState<SendStrategy>('delay2h');
  const [customTime, setCustomTime] = useState('');
  const [sent, setSent] = useState(false);
  const [sentMessage, setSentMessage] = useState('');

  const getScheduledTime = () => {
    if (strategy === 'immediate') return '立即';
    if (strategy === 'delay2h') {
      const t = new Date();
      t.setHours(t.getHours() + 2);
      return `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')} 今日`;
    }
    return customTime || '自定义时间未设置';
  };

  const handleSend = () => {
    const time = getScheduledTime();
    setSentMessage(`已安排于 ${time} 推送给候选人 ${candidateName}`);
    setSent(true);
    onSent?.();
  };

  if (disabled) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center flex flex-col items-center justify-center">
        {isGenerating ? (
          <>
            <Send size={20} className="text-gray-300 mb-2" />
            <p className="text-xs text-gray-400">AI 正在生成内容，请稍候...</p>
          </>
        ) : (
          <>
            <Clock size={20} className="text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-600 mb-1">请阅读全文 ({timeLeft}s)</p>
            <p className="text-xs text-gray-400">倒计时结束后，发送策略控制台将自动激活</p>
          </>
        )}
      </div>
    );
  }

  if (sent) {
    return (
      <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-lg border border-emerald-200">
        <CheckCircle size={18} className="text-emerald-500 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-emerald-700">发送成功</p>
          <p className="text-xs text-emerald-600 mt-0.5">{sentMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Send size={14} className="text-[#0052D9]" />
          发送策略控制台
        </h3>
      </div>

      <div className="p-4 space-y-2">
        {/* Options */}
        {[
          { value: 'immediate' as SendStrategy, icon: <Send size={13} />, label: '立即发送', sub: '审核通过后立即推送' },
          {
            value: 'delay2h' as SendStrategy,
            icon: <Clock size={13} />,
            label: '2 小时后发送',
            sub: '默认推荐，给候选人缓冲时间',
          },
          { value: 'custom' as SendStrategy, icon: <Calendar size={13} />, label: '自定义时间', sub: '' },
        ].map((opt) => (
          <label
            key={opt.value}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
              strategy === opt.value
                ? 'border-[#0052D9] bg-[#EEF3FF]'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="sendStrategy"
              value={opt.value}
              checked={strategy === opt.value}
              onChange={() => setStrategy(opt.value)}
              className="accent-[#0052D9]"
            />
            <span className={strategy === opt.value ? 'text-[#0052D9]' : 'text-gray-400'}>
              {opt.icon}
            </span>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-700">{opt.label}</div>
              {opt.sub && <div className="text-xs text-gray-400">{opt.sub}</div>}
              {opt.value === 'custom' && strategy === 'custom' && (
                <input
                  type="datetime-local"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="mt-1.5 w-full text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:border-[#0052D9]"
                />
              )}
            </div>
            {opt.value === 'delay2h' && (
              <span className="text-xs px-1.5 py-0.5 bg-[#0052D9] text-white rounded">默认</span>
            )}
          </label>
        ))}

        <button
          onClick={handleSend}
          className="w-full mt-2 py-2.5 bg-[#0052D9] text-white text-sm font-medium rounded-lg hover:bg-[#003BA5] transition-colors flex items-center justify-center gap-2"
        >
          <Send size={14} />
          确认发送
        </button>
      </div>
    </div>
  );
};
