import React, { useState } from 'react';
import { Word } from '../types/word';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, RotateCcw, ChevronLeft, ChevronRight, Shuffle, Sparkles, Circle } from 'lucide-react';

interface FlashcardModeProps {
  words: Word[];
  onToggleMemorized: (id: string) => void;
}

export const FlashcardMode: React.FC<FlashcardModeProps> = ({
  words,
  onToggleMemorized,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [order, setOrder] = useState<string[]>(() => words.map((w) => w.id));
  const prevIdsRef = React.useRef<string>('');

  // Rebuild the card order only when the actual word list changes (adds/removes).
  // Memorized toggles keep the current position.
  React.useEffect(() => {
    const idsKey = words.map((w) => w.id).join('|');
    if (idsKey !== prevIdsRef.current) {
      prevIdsRef.current = idsKey;
      setOrder(words.map((w) => w.id));
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  }, [words]);

  if (order.length === 0 || words.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#e2d5c3] p-12 text-center">
        <p className="font-bangla text-[#7c7166]">অনুশীলনের জন্য কোনো শব্দ পাওয়া যায়নি।</p>
      </div>
    );
  }

  const currentWord = words.find((w) => w.id === order[currentIndex]) || words[0];

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % order.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + order.length) % order.length);
  };

  const handleShuffle = () => {
    setOrder([...words].map((w) => w.id).sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 my-4">
      {/* Top Header Controls */}
      <div className="flex items-center justify-between text-xs font-bangla text-[#7c7166]">
        <span className="font-semibold text-[#3a332d]">
          কার্ড {currentIndex + 1} / {order.length}
        </span>

        <button
          onClick={handleShuffle}
          className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-white border border-[#e2d5c3] text-[#5A5A40] hover:bg-[#f4ece1] transition-colors shadow-xs"
        >
          <Shuffle className="w-3.5 h-3.5 text-[#5A5A40]" />
          <span>র্যান্ডম এলোমেলো</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#ede4d8] h-2 rounded-full overflow-hidden">
        <div
          className="bg-[#5A5A40] h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / order.length) * 100}%` }}
        />
      </div>

      {/* Flip Card Container */}
      <div
        onClick={() => setIsFlipped(!isFlipped)}
        className="cursor-pointer perspective-1000 min-h-[320px] relative rounded-3xl"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentWord.id}-${isFlipped ? 'back' : 'front'}`}
            initial={{ rotateY: isFlipped ? -90 : 90, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: isFlipped ? 90 : -90, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={`w-full min-h-[320px] rounded-3xl p-8 border shadow-md flex flex-col justify-between text-center select-none ${
              isFlipped
                ? 'bg-gradient-to-br from-[#4a4a34] to-[#3a332d] text-white border-[#5A5A40]'
                : 'bg-white border-[#e2d5c3] text-[#3a332d]'
            }`}
          >
            {/* Main Content */}
            <div className="my-auto py-6 space-y-4">
              {!isFlipped ? (
                <>
                  <p className="font-arabic text-5xl font-bold leading-relaxed tracking-wide text-[#3a332d]">
                    {currentWord.arabic}
                  </p>
                  <div className="pt-4 flex items-center justify-center text-xs font-bangla text-[#5A5A40] font-medium">
                    <Sparkles className="w-3.5 h-3.5 mr-1 animate-pulse" />
                    বাংলা অর্থ দেখতে ট্যাপ করুন
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wider text-[#ede4d8] font-medium font-bangla">
                      বাংলা অর্থ
                    </p>
                    <p className="font-bangla text-3xl font-extrabold text-white">
                      {currentWord.banglaMeaning}
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Card Footer Status */}
            <div className="text-xs font-bangla">
              {currentWord.isMemorized ? (
                <span className={`inline-flex items-center font-medium ${isFlipped ? 'text-[#ede4d8]' : 'text-[#5A5A40]'}`}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> এটি মুখস্থ করা আছে
                </span>
              ) : (
                <span className={`font-medium ${isFlipped ? 'text-[#ede4d8]/70' : 'text-[#7c7166]'}`}>
                  এখনও মুখস্থ হয়নি
                </span>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={handlePrev}
          className="flex-1 flex items-center justify-center space-x-1 bg-white border border-[#e2d5c3] hover:bg-[#f4ece1] py-3 rounded-2xl text-[#3a332d] font-bangla text-sm font-semibold shadow-xs transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-[#5A5A40]" />
          <span>আগের কার্ড</span>
        </button>

        <button
          onClick={() => onToggleMemorized(currentWord.id)}
          className={`flex-1 flex items-center justify-center space-x-1.5 py-3 rounded-2xl font-bangla text-sm font-semibold shadow-xs transition-colors ${
            currentWord.isMemorized
              ? 'bg-[#ede4d8] text-[#5A5A40] border border-[#d8c7b4] hover:bg-[#d8c7b4]'
              : 'bg-[#5A5A40] text-white hover:bg-[#4a4a34]'
          }`}
        >
          {currentWord.isMemorized ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" />
              <span>মুখস্থ করা আছে</span>
            </>
          ) : (
            <>
              <Circle className="w-4 h-4 text-white/80" />
              <span>মুখস্থ চিহ্নিত করুন</span>
            </>
          )}
        </button>

        <button
          onClick={handleNext}
          className="flex-1 flex items-center justify-center space-x-1 bg-white border border-[#e2d5c3] hover:bg-[#f4ece1] py-3 rounded-2xl text-[#3a332d] font-bangla text-sm font-semibold shadow-xs transition-colors"
        >
          <span>পরের কার্ড</span>
          <ChevronRight className="w-4 h-4 text-[#5A5A40]" />
        </button>
      </div>
    </div>
  );
};
