import React from 'react';
import { BookOpen, CheckCircle2, Circle } from 'lucide-react';

interface StatsCardProps {
  total: number;
  memorized: number;
  unmemorized: number;
}

export const StatsCard: React.FC<StatsCardProps> = ({
  total,
  memorized,
  unmemorized,
}) => {
  const percent = total > 0 ? Math.round((memorized / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
      {/* Total Words */}
      <div className="bg-white p-4 rounded-2xl border border-[#e2d5c3] shadow-xs flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-[#ede4d8] text-[#5A5A40] flex items-center justify-center shrink-0">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium font-bangla text-[#7c7166]">মোট শব্দ</p>
          <p className="text-xl font-bold text-[#3a332d] mt-0.5">{total}</p>
        </div>
      </div>

      {/* Memorized Words */}
      <div className="bg-white p-4 rounded-2xl border border-[#e2d5c3] shadow-xs flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-[#ede4d8] text-[#5A5A40] flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium font-bangla text-[#7c7166]">মুখস্থ সম্পন্ন</p>
          <div className="flex items-baseline space-x-1 mt-0.5">
            <span className="text-xl font-bold text-[#5A5A40]">{memorized}</span>
            <span className="text-xs font-semibold text-[#5A5A40]">({percent}%)</span>
          </div>
        </div>
      </div>

      {/* Unmemorized Words */}
      <div className="bg-white p-4 rounded-2xl border border-[#e2d5c3] shadow-xs flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-[#f4ece1] text-[#7c7166] flex items-center justify-center shrink-0">
          <Circle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-xs font-medium font-bangla text-[#7c7166]">পড়ার বাকি</p>
          <p className="text-xl font-bold text-[#7c7166] mt-0.5">{unmemorized}</p>
        </div>
      </div>
    </div>
  );
};
