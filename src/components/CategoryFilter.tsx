import React from 'react';
import { Search, X, Table, LayoutGrid, Brain, Filter } from 'lucide-react';
import { ViewMode, MemorizedFilter } from '../types/word';

interface CategoryFilterProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  memorizedFilter: MemorizedFilter;
  onMemorizedFilterChange: (filter: MemorizedFilter) => void;
  categories: { name: string; total: number }[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  searchQuery,
  onSearchChange,
  viewMode,
  onViewModeChange,
  memorizedFilter,
  onMemorizedFilterChange,
  categories,
  selectedCategory,
  onCategoryChange,
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-[#e2d5c3] shadow-xs mb-6 space-y-4">
      
      {/* Top Controls: Search Bar & View Mode Switcher */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7c7166]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="আরবি বা বাংলা অর্থ দিয়ে খুঁজুন..."
            className="w-full pl-10 pr-10 py-2.5 text-sm font-bangla border border-[#e2d5c3] rounded-xl bg-[#fdfaf6] text-[#3a332d] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all placeholder:text-[#7c7166]/60"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#7c7166] hover:text-[#3a332d] rounded-full hover:bg-[#ede4d8]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* View Mode Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#f4ece1] p-1 rounded-xl flex items-center space-x-1 border border-[#e2d5c3]">
            <button
              onClick={() => onViewModeChange('table')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bangla font-medium transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#5A5A40] shadow-xs font-semibold'
                  : 'text-[#7c7166] hover:text-[#3a332d]'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>টেবিল ভিউ</span>
            </button>

            <button
              onClick={() => onViewModeChange('cards')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bangla font-medium transition-all ${
                viewMode === 'cards'
                  ? 'bg-white text-[#5A5A40] shadow-xs font-semibold'
                  : 'text-[#7c7166] hover:text-[#3a332d]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>কার্ড ভিউ</span>
            </button>

            <button
              onClick={() => onViewModeChange('flashcards')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bangla font-medium transition-all ${
                viewMode === 'flashcards'
                  ? 'bg-[#5A5A40] text-white shadow-xs font-semibold'
                  : 'text-[#7c7166] hover:text-[#3a332d]'
              }`}
            >
              <Brain className="w-3.5 h-3.5" />
              <span>ফ্ল্যাশকার্ড অনুশীলন</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Filter Bar: Category Dropdown & Memorized Status Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#f2e9de]">

        {/* Category Dropdown */}
        <div className="flex items-center space-x-2 text-xs font-bangla">
          <span className="text-[#7c7166] hidden lg:inline-flex items-center shrink-0">
            <Filter className="w-3 h-3 mr-1" /> ক্যাটাগরি:
          </span>
          <select
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="px-2.5 py-1.5 text-xs font-bangla font-medium text-[#3a332d] bg-[#f4ece1] border border-[#e2d5c3] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/20 focus:border-[#5A5A40] transition-all cursor-pointer max-w-full"
            aria-label="ক্যাটাগরি ফিল্টার"
          >
            <option value="all">সকল ক্যাটাগরি</option>
            {categories.map((cat) => (
              <option key={cat.name} value={cat.name}>
                {cat.name} ({cat.total})
              </option>
            ))}
          </select>
        </div>
        
        {/* Memorized Status Filter Pills */}
        <div className="flex items-center space-x-1 shrink-0 bg-[#f4ece1] p-1 rounded-xl text-xs font-bangla border border-[#e2d5c3]">
          <span className="text-[#7c7166] pl-2 pr-1 hidden lg:inline flex items-center">
            <Filter className="w-3 h-3 mr-1" /> অবস্থা:
          </span>
          <button
            onClick={() => onMemorizedFilterChange('all')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              memorizedFilter === 'all'
                ? 'bg-white text-[#3a332d] shadow-xs font-semibold'
                : 'text-[#7c7166] hover:text-[#3a332d]'
            }`}
          >
            সকল
          </button>
          <button
            onClick={() => onMemorizedFilterChange('unmemorized')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              memorizedFilter === 'unmemorized'
                ? 'bg-[#7c7166] text-white shadow-xs font-semibold'
                : 'text-[#7c7166] hover:text-[#3a332d]'
            }`}
          >
            পড়ার বাকি
          </button>
          <button
            onClick={() => onMemorizedFilterChange('memorized')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              memorizedFilter === 'memorized'
                ? 'bg-[#5A5A40] text-white shadow-xs font-semibold'
                : 'text-[#7c7166] hover:text-[#3a332d]'
            }`}
          >
            মুখস্থ
          </button>
        </div>

      </div>

    </div>
  );
};
