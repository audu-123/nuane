import React from 'react';

interface SmartNoteBoxProps {
  noteText: string;
  onNoteChange: (text: string) => void;
}

export const SmartNoteBox: React.FC<SmartNoteBoxProps> = ({
  noteText,
  onNoteChange,
}) => {
  return (
    <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">备注</h3>
      </div>

      {/* Note textarea — raw text, no transformation */}
      <div className="px-4 py-4">
        <textarea
          value={noteText}
          onChange={(e) => onNoteChange(e.target.value)}
          placeholder="自由记录面试关键细节，内容将原样保存..."
          rows={5}
          className="w-full text-sm text-gray-700 placeholder-gray-300 border border-gray-100 rounded-lg px-3 py-2 resize-none focus:outline-none focus:border-[#0052D9] focus:ring-1 focus:ring-[#0052D9]/20 transition-all"
        />
      </div>
    </div>
  );
};
