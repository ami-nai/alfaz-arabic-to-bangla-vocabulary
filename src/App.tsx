import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createWordSearchIndex, createSearchMatcher } from './lib/search';
import { Word, ViewMode, MemorizedFilter, isVerbCategory } from './types/word';
import {
  getStoredWords,
  fetchWordsFromSupabase,
  toggleMemorized,
  resetToInitial,
  checkNewWordsAvailable,
  syncNewWordsFromSupabase,
} from './services/storage';
import { Header } from './components/Header';
import { StatsCard } from './components/StatsCard';
import { CategoryFilter } from './components/CategoryFilter';
import { WordTable } from './components/WordTable';
import { WordCard } from './components/WordCard';
import { FlashcardMode } from './components/FlashcardMode';
import { NewWordsBanner } from './components/NewWordsBanner';
import { LoginScreen } from './components/LoginScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RefreshCw, AlertTriangle, ArrowUp } from 'lucide-react';

function VocabularyApp() {
  const { user, loading: authLoading } = useAuth();
  const userId = user?.id;

  const [busy, setBusy] = useState(true);
  const busyRef = useRef(true);
  const [operationError, setOperationError] = useState('');
  const [resetError, setResetError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);
  const [words, setWords] = useState<Word[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [memorizedFilter, setMemorizedFilter] = useState<MemorizedFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBab, setSelectedBab] = useState('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  // New Words Sync State
  const [pendingSyncNotice, setPendingSyncNotice] = useState<{
    hasNew: boolean;
    newCount: number;
    message?: string;
  }>({ hasNew: false, newCount: 0 });
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Infinite Scroll Pagination
  const PAGE_SIZE = 40;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Scroll-to-top button visibility
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 300);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Keep cached content on failure, and ignore requests from an unmounted account.
  useEffect(() => {
    if (authLoading || !userId) return;
    let cancelled = false;
    busyRef.current = true;
    setBusy(true);
    setOperationError('');
    const localWords = getStoredWords(userId);
    setWords(localWords);
    (async () => {
      try {
        const notice = await checkNewWordsAvailable(localWords.length, userId);
        if (cancelled) return;
        if (localWords.length && notice.hasNew) {
          setPendingSyncNotice({ hasNew: true, newCount: notice.newCount, message: notice.announcementMessage });
        } else {
          const remote = await fetchWordsFromSupabase(userId);
          if (!cancelled) setWords(remote);
        }
      } catch {
        if (!cancelled) setOperationError('তথ্য লোড হয়নি। আগের সংরক্ষিত তথ্য দেখানো হচ্ছে। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।');
      } finally {
        if (!cancelled) { busyRef.current = false; setBusy(false); }
      }
    })();
    return () => { cancelled = true; };
  }, [userId, authLoading, reloadKey]);

  const handleSyncNewWords = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setIsSyncing(true);
    setOperationError('');
    try {
      setWords(await syncNewWordsFromSupabase(userId));
      setPendingSyncNotice({ hasNew: false, newCount: 0 });
    } catch {
      setOperationError('আপডেট হয়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।');
    } finally {
      busyRef.current = false;
      setBusy(false);
      setIsSyncing(false);
    }
  };

  const searchableWords = useMemo(
    () => words.map(word => ({ word, fields: createWordSearchIndex(word) })),
    [words]
  );

  const showVerbColumns = isVerbCategory(selectedCategory);
  const babOptions = useMemo(() => {
    const values = new Set<string>();
    for (const word of words) {
      const bab = word.bab?.trim();
      if (bab && word.category === selectedCategory) values.add(bab);
    }
    return [...values].sort((a, b) => a.localeCompare(b, 'ar'));
  }, [words, selectedCategory]);
  const activeBab = showVerbColumns && babOptions.includes(selectedBab) ? selectedBab : '';

  // Search the full dictionary before slicing the visible page.
  const filteredWords = useMemo(() => {
    const matchesSearch = createSearchMatcher(searchQuery);
    return searchableWords.filter(({ word: w, fields }) => {
      // Memorized Status Filter
      if (memorizedFilter === 'memorized' && !w.isMemorized) return false;
      if (memorizedFilter === 'unmemorized' && w.isMemorized) return false;

      // Category Filter
      if (selectedCategory !== 'all' && (w.category || 'সাধারণ') !== selectedCategory) return false;

      if (activeBab && w.bab?.trim() !== activeBab) return false;

      return matchesSearch(fields);
    }).map(({ word }) => word);
  }, [searchableWords, memorizedFilter, selectedCategory, searchQuery, activeBab]);

  // Available categories with counts (for the filter dropdown)
  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    words.forEach((w) => {
      const cat = w.category || 'সাধারণ';
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => a.name.localeCompare(b.name, 'bn'));
  }, [words]);


  // Pagination: render in chunks, load more on scroll
  const paginatedWords = useMemo(
    () => filteredWords.slice(0, visibleCount),
    [filteredWords, visibleCount]
  );
  const hasMore = visibleCount < filteredWords.length;
  const loadMore = useCallback(() => setVisibleCount((c) => c + PAGE_SIZE), []);

  // Reset the visible window whenever the search/filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, memorizedFilter, selectedCategory, activeBab]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { rootMargin: '300px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, loadMore, visibleCount, viewMode]);

  // Stats
  const totalCount = words.length;
  const memorizedCount = words.filter((w) => w.isMemorized).length;
  const unmemorizedCount = totalCount - memorizedCount;

  // Handlers
  const handleToggleMemorized = async (id: string) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setOperationError('');
    try {
      setWords(await toggleMemorized(id, userId));
    } catch {
      setOperationError('অগ্রগতি সংরক্ষণ হয়নি। আগের অবস্থা রাখা হয়েছে। সংযোগ পরীক্ষা করে শব্দটিতে আবার চাপুন।');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const handleOpenResetModal = () => {
    if (busyRef.current) return;
    setResetError('');
    setShowResetConfirm(true);
  };

  const handleConfirmReset = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setIsResetting(true);
    setResetError('');
    try {
      setWords(await resetToInitial(userId));
      setSearchQuery('');
      setShowResetConfirm(false);
      setOperationError('');
    } catch {
      setResetError('রিসেট নিশ্চিত করা যায়নি। সংযোগ পরীক্ষা করে আবার চেষ্টা করুন।');
    } finally {
      busyRef.current = false;
      setBusy(false);
      setIsResetting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center font-bangla">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-8 h-8 border-3 border-[#2C3E2E] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-600">অপেক্ষা করুন, একাউন্ট তথ্য লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
        <Header
          totalCount={0}
          memorizedCount={0}
          onResetData={() => {}}
        />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-center">
          <LoginScreen />
        </main>
        <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs font-bangla text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-800">আরবি-বাংলা শব্দভাণ্ডার</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
              <span>Developed by Md. Shahriar Alam</span>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">

      {/* Main App Header */}
      <Header
        totalCount={totalCount}
        memorizedCount={memorizedCount}
        onResetData={handleOpenResetModal}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div aria-live="polite" className="font-bangla text-sm mb-3">
          {busy && <p role="status">তথ্য লোড বা সংরক্ষণ হচ্ছে…</p>}
          {operationError && <div role="alert" className="rounded-xl bg-amber-50 text-amber-900 p-3">
            <p>{operationError}</p>
            <button disabled={busy} onClick={() => setReloadKey(key => key + 1)} className="underline mt-2 disabled:opacity-50">আবার লোড করুন</button>
          </div>}
        </div>
        <fieldset disabled={busy} aria-busy={busy} className="min-w-0">
        
        {/* ACTION BOX: Admin Broadcast / New Words Notification Banner */}
        {pendingSyncNotice.hasNew && (
          <NewWordsBanner
            newCount={pendingSyncNotice.newCount}
            message={pendingSyncNotice.message}
            onSync={handleSyncNewWords}
            onDismiss={() => setPendingSyncNotice({ hasNew: false, newCount: 0 })}
            isLoading={isSyncing}
          />
        )}

        {/* Top Summary Stats */}
        <StatsCard
          total={totalCount}
          memorized={memorizedCount}
          unmemorized={unmemorizedCount}
        />

        {/* Filter & View Mode Controls */}
        <CategoryFilter
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          memorizedFilter={memorizedFilter}
          onMemorizedFilterChange={setMemorizedFilter}
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={(category) => {
            if (category !== selectedCategory) setSelectedBab('');
            setSelectedCategory(category);
          }}
          babOptions={showVerbColumns ? babOptions : undefined}
          selectedBab={activeBab}
          onBabChange={setSelectedBab}
        />

        {/* Active View: Table vs Cards vs Flashcards */}
        {viewMode === 'table' && (
          <WordTable
            words={paginatedWords}
            onToggleMemorized={handleToggleMemorized}
            showVerbColumns={showVerbColumns}
          />
        )}

        {viewMode === 'cards' && (
          <WordCard
            words={paginatedWords}
            onToggleMemorized={handleToggleMemorized}
          />
        )}

        {viewMode === 'flashcards' && (
          <FlashcardMode
            words={filteredWords}
            onToggleMemorized={handleToggleMemorized}
          />
        )}

        {/* Infinite Scroll Sentinel (table & cards only) */}
        {(viewMode === 'table' || viewMode === 'cards') && hasMore && (
          <div ref={sentinelRef} className="h-12 flex items-center justify-center mt-4">
            <div className="w-6 h-6 border-2 border-[#5A5A40] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        </fieldset>
      </main>

      {/* Scroll-to-top floating button */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-11 h-11 rounded-full bg-[#5A5A40] text-white shadow-lg hover:bg-[#4a4a34] flex items-center justify-center transition-all active:scale-95 animate-fade-in"
          title="উপরে যান"
          aria-label="উপরে যান"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs font-bangla animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center space-x-3 text-amber-600 mb-3">
              <div className="p-2.5 bg-amber-50 rounded-xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">মুখস্থ অগ্রগতি রিসেট করুন</h3>
            </div>
            
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              আপনি কি আপনার চিহ্নিত মুখস্থ করার তথ্য রিসেট করতে চান? আপনার চিহ্নিত সব শব্দের অগ্রগতি মুছে গিয়ে ০% এ ফিরে যাবে।
            </p>

            {resetError && <p role="alert" className="text-sm text-rose-700 mb-4">{resetError}</p>}
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
              >
                বাতিল
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-sm disabled:opacity-50"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>রিসেট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>হ্যাঁ, রিসেট করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-12 text-center text-xs font-bangla text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800">
              {user ? 'আলফাজ' : 'আরবি-বাংলা শব্দভাণ্ডার'}
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-slate-400">
            <span>Developed by Md. Shahriar Alam</span>
          </div>
        </div>
      </footer>

    </div>
  );
}

function AccountApp() {
  const { user } = useAuth();
  return <VocabularyApp key={user?.id ?? 'signed-out'} />;
}

export default function App() {
  return (
    <AuthProvider>
      <AccountApp />
    </AuthProvider>
  );
}
