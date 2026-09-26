import React, { useState } from 'react';
import { Word } from '../types/word';
import { CheckCircle2, Circle, Copy, Check } from 'lucide-react';

interface WordTableProps {
  words: Word[];
  onToggleMemorized: (id: string) => void;
  showVerbColumns?: boolean;
}

const verbCell = (value?: string) => value && value.trim() ? value : '—';

export const WordTable: React.FC<WordTableProps> = ({
  words,
  onToggleMemorized,
  showVerbColumns = false,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyArabic = (word: Word) => {
    navigator.clipboard.writeText(word.arabic);
    setCopiedId(word.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (words.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e2d5c3] p-12 text-center shadow-xs">
        <h3 className="text-lg font-bold font-bangla text-[#3a332d]">কোনো শব্দ পাওয়া যায়নি</h3>
        <p className="text-sm font-bangla text-[#7c7166] mt-1 max-w-md mx-auto">
          আপনার সার্চ ফিল্টার পরিবর্তন করুন অথবা নতুন শব্দ যোগ করুন।
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e2d5c3] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#fdfaf6] border-b border-[#e2d5c3] text-xs font-bangla text-[#5A5A40] font-bold uppercase tracking-wider">
              <th className="py-3.5 px-4 w-12 text-center">#</th>
              <th className="py-3.5 px-4 text-right sm:text-right font-bold text-[#5A5A40]">আরবি শব্দ</th>
              <th className="py-3.5 px-4">বাংলা অর্থ</th>
              {showVerbColumns && (
                <>
                  <th className="py-3.5 px-4 text-right">বাব</th>
                  <th className="py-3.5 px-4 text-right">মাসদার</th>
                  <th className="py-3.5 px-4 text-right">মাদি</th>
                  <th className="py-3.5 px-4 text-right">মুদারি</th>
                  <th className="py-3.5 px-4 text-right">আমর</th>
                  <th className="py-3.5 px-4 text-right">নাহি</th>
                </>
              )}
              <th className="py-3.5 px-4 text-center">মুখস্থ</th>
              <th className="py-3.5 px-4 text-right">কপি</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f2e9de] text-sm">
            {words.map((word, index) => {
              const isCopied = copiedId === word.id;

              return (
                <tr
                  key={word.id}
                  className={`hover:bg-[#f9f5f0] transition-colors group ${
                    word.isMemorized ? 'bg-[#f4ece1]/30' : ''
                  }`}
                >
                  {/* Index */}
                  <td className="py-4 px-4 text-center font-mono text-xs text-[#7c7166]/60 font-medium">
                    {String(index + 1).padStart(2, '0')}
                  </td>

                  {/* Arabic Word */}
                  <td className="py-4 px-4 text-right">
                    <span className={`font-arabic text-2xl font-bold leading-relaxed tracking-normal ${
                      word.isMemorized ? 'text-[#5A5A40]' : 'text-[#3a332d]'
                    }`}>
                      {word.arabic}
                    </span>
                  </td>

                  {/* Bangla Meaning */}
                  <td className="py-4 px-4 font-bangla font-semibold text-[#3a332d] text-base">
                    {word.banglaMeaning}
                  </td>

                  {/* Verb sarf columns (only when verb category is selected) */}
                  {showVerbColumns && (
                    <>
                      <td className="py-4 px-4 text-right font-arabic text-xl text-[#3a332d]">{verbCell(word.bab)}</td>
                      <td className="py-4 px-4 text-right font-arabic text-xl text-[#3a332d]">{verbCell(word.masdar)}</td>
                      <td className="py-4 px-4 text-right font-arabic text-xl text-[#3a332d]">{verbCell(word.madi)}</td>
                      <td className="py-4 px-4 text-right font-arabic text-xl text-[#3a332d]">{verbCell(word.mudari)}</td>
                      <td className="py-4 px-4 text-right font-arabic text-xl text-[#3a332d]">{verbCell(word.amr)}</td>
                      <td className="py-4 px-4 text-right font-arabic text-xl text-[#3a332d]">{verbCell(word.nahy)}</td>
                    </>
                  )}

                  {/* Memorized Toggle */}
                  <td className="py-4 px-4 text-center">
                    <button
                      onClick={() => onToggleMemorized(word.id)}
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bangla font-medium transition-all ${
                        word.isMemorized
                          ? 'bg-[#5A5A40] text-white border border-[#5A5A40]'
                          : 'bg-[#f4ece1] text-[#7c7166] hover:bg-[#ede4d8] border border-[#e2d5c3]'
                      }`}
                      title={word.isMemorized ? 'মুখস্থ সম্পন্ন' : 'মুখস্থ হিসেবে চিহ্নিত করুন'}
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
                  </td>

                  {/* Copy Action */}
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end">
                      <button
                        onClick={() => handleCopyArabic(word)}
                        className="p-1.5 text-[#5A5A40]/60 hover:text-[#5A5A40] hover:bg-[#ede4d8] rounded-lg transition-colors"
                        title="আরবি কপি করুন"
                      >
                        {isCopied ? (
                          <Check className="w-4 h-4 text-[#5A5A40]" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
