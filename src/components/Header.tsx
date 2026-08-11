import React, { useState, useRef, useEffect } from 'react';
import { BookOpen, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  totalCount: number;
  memorizedCount: number;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCount,
  memorizedCount,
  onResetData,
}) => {
  const { user, signOut } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const percent = totalCount > 0 ? Math.round((memorizedCount / totalCount) * 100) : 0;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-[#f4ece1] border-b border-[#e2d5c3] sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4">
          
          {/* Title & Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center shadow-sm shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              {user ? (
                <h1 className="text-xl sm:text-2xl font-bold font-bangla text-[#3a332d] tracking-tight">
                  আলফাজ
                </h1>
              ) : (
                <>
                  <div className="flex items-center space-x-2">
                    <h1 className="text-xl sm:text-2xl font-bold font-bangla text-[#3a332d] tracking-tight">
                      আরবি-বাংলা শব্দভাণ্ডার <span className="text-[#5A5A40] text-sm font-normal">| আলফাজ</span>
                    </h1>
                  </div>
                  <p className="text-xs sm:text-sm text-[#7c7166] font-bangla">
                    Arabic to Bangla Vocabulary & Memory Tracker
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Quick Metrics & Actions (Single Line) */}
          {user && (
            <div className="flex items-center space-x-2.5 flex-nowrap shrink-0" ref={menuRef}>
              
              {/* Memorized Quick Progress */}
              <div className="hidden sm:flex items-center space-x-2.5 bg-[#fdfaf6] border border-[#e2d5c3] px-3 py-1.5 rounded-xl text-xs">
                <div className="text-right">
                  <p className="text-[11px] font-bangla text-[#7c7166] leading-none">মুখস্থ অগ্রগতি</p>
                  <p className="text-xs font-bold text-[#5A5A40] mt-0.5">
                    {memorizedCount}/{totalCount} ({percent}%)
                  </p>
                </div>
                <div className="w-14 bg-[#ede4d8] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#5A5A40] h-2 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={onResetData}
                className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200/80 rounded-xl transition-colors whitespace-nowrap"
                title="রিসেট করুন (Reset Data)"
              >
                Reset
              </button>

              {/* Person Icon Profile Menu */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className={`p-1.5 rounded-xl border transition-all flex items-center justify-center ${
                    isUserMenuOpen
                      ? 'bg-[#ede4d8] border-[#5A5A40] text-[#3a332d]'
                      : 'bg-[#fdfaf6] hover:bg-[#ede4d8] border-[#d8c7b4] text-[#5A5A40]'
                  }`}
                  title="প্রোফাইল মেনু"
                >
                  <User className="w-4 h-4" />
                </button>

                {/* Popover Dropdown */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-[#d8c7b4] rounded-2xl shadow-xl p-3 z-50 font-bangla animate-fade-in">
                    <div className="px-2 py-1.5 border-b border-slate-100 mb-2">
                      <p className="text-[11px] text-slate-400 font-medium">লগইনকৃত একাউন্ট</p>
                      <p className="text-xs font-bold text-slate-800 truncate" title={user.email || ''}>
                        {user.user_metadata?.display_name || user.email}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center space-x-2 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>লগআউট (Log Out)</span>
                    </button>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      </div>
    </header>
  );
};

