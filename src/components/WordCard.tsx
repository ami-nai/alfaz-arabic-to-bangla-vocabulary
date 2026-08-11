import React, { useState } from 'react';
import { Word } from '../types/word';
import { CheckCircle2, Circle, Copy, Check } from 'lucide-react';

interface WordCardProps {
  words: Word[];
  onToggleMemorized: (id: string) => void;
}

export const WordCard: React.FC<WordCardProps> = ({
  words,
  onToggleMemorized,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyArabic = (word: Word) => {
    navigator.clipboard.writeText(word.arabic);
    setCopiedId(word.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {words.map((word) => {
        const isCopied = copiedId === word.id;

        return (
          <div
            key={word.id}
            className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
              word.isMemorized
                ? 'border-[#5A5A40] bg-[#f4ece1]/20'
                : 'border-[#e2d5c3] hover:border-[#d8c7b4]'
            }`}
          >
            <div>
              {/* Status Bar */}
              <div className="flex items-center justify-end mb-3">
                <button
                  onClick={() => onToggleMemorized(word.id)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bangla font-medium transition-all ${
                    word.isMemorized
                      ? 'bg-[#5A5A40] text-white'
                      : 'bg-[#f4ece1] text-[#7c7166] hover:bg-[#ede4d8] border border-[#e2d5c3]'
                  }`}
                >
                  {word.isMemorized ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                      <span>মুখস্থ</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-3.5 h-3.5 text-[#7c7166]" />
                      <span>বাকি</span>
                    </>
                  )}
                </button>
              </div>

              {/* Main Word Display */}
              <div className="text-center py-4 bg-[#fdfaf6] rounded-xl border border-[#e2d5c3] mb-4">
                <p className={`font-arabic text-3xl font-bold tracking-normal ${
                  word.isMemorized ? 'text-[#5A5A40]' : 'text-[#3a332d]'
                }`}>
                  {word.arabic}
                </p>
              </div>

              {/* Bangla Meaning */}
              <div className="text-center mb-4">
                <p className="font-bangla text-lg font-bold text-[#3a332d]">
                  {word.banglaMeaning}
                </p>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-end pt-3 border-t border-[#f2e9de]">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => handleCopyArabic(word)}
                  className="p-1.5 text-[#5A5A40]/60 hover:text-[#5A5A40] hover:bg-[#ede4d8] rounded-lg transition-colors"
                  title="কপি করুন"
                >
                  {isCopied ? <Check className="w-4 h-4 text-[#5A5A40]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
