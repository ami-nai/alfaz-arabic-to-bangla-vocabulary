import { Word } from '../types/word';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const STORAGE_KEY = 'arabic_bangla_vocab_words_v1';

// Helper: Convert Supabase database row to Word object
function mapRowToWord(row: Record<string, any>, isMemorizedOverride?: boolean): Word {
  return {
    id: String(row.id || `w-${Date.now()}`),
    arabic: row.arabic || row.arabic_text || '',
    transliteration: row.transliteration || '',
    banglaMeaning: row.bangla_meaning ?? row.banglameaning ?? row.banglaMeaning ?? '',
    antonymArabic: row.antonym_arabic ?? row.antonymarabic ?? row.antonymArabic ?? '',
    antonymBangla: row.antonym_bangla ?? row.antonymbangla ?? row.antonymBangla ?? '',
    category: row.category || 'সাধারণ',
    isMemorized: isMemorizedOverride !== undefined
      ? isMemorizedOverride
      : Boolean(row.is_memorized ?? row.ismemorized ?? row.isMemorized ?? false),
    createdAt: row.created_at ?? row.createdat ?? row.createdAt ?? new Date().toISOString(),
    exampleArabic: row.example_arabic ?? row.examplearabic ?? row.exampleArabic ?? '',
    exampleBangla: row.example_bangla ?? row.examplebangla ?? row.exampleBangla ?? '',
    bab: row.bab ?? '',
    masdar: row.masdar ?? '',
    madi: row.madi ?? '',
    mudari: row.mudari ?? '',
    amr: row.amr ?? '',
    nahy: row.nahy ?? '',
  };
}

// Helper: Convert Word object to Supabase database row format (snake_case standard)
function mapWordToRow(word: Word): Record<string, any> {
  return {
    id: word.id,
    arabic: word.arabic,
    transliteration: word.transliteration || null,
    bangla_meaning: word.banglaMeaning,
    antonym_arabic: word.antonymArabic || null,
    antonym_bangla: word.antonymBangla || null,
    category: word.category || 'সাধারণ',
    created_at: word.createdAt || new Date().toISOString(),
    example_arabic: word.exampleArabic || null,
    example_bangla: word.exampleBangla || null,
    bab: word.bab || null,
    masdar: word.masdar || null,
    madi: word.madi || null,
    mudari: word.mudari || null,
    amr: word.amr || null,
    nahy: word.nahy || null,
  };
}

// Helper: Fallback camelCase row formatting in case Supabase schema was created with camelCase
function mapWordToCamelRow(word: Word): Record<string, any> {
  return {
    id: word.id,
    arabic: word.arabic,
    transliteration: word.transliteration || null,
    banglaMeaning: word.banglaMeaning,
    antonymArabic: word.antonymArabic || null,
    antonymBangla: word.antonymBangla || null,
    category: word.category || 'সাধারণ',
    createdAt: word.createdAt || new Date().toISOString(),
    exampleArabic: word.exampleArabic || null,
    exampleBangla: word.exampleBangla || null,
    bab: word.bab || null,
    masdar: word.masdar || null,
    madi: word.madi || null,
    mudari: word.mudari || null,
    amr: word.amr || null,
    nahy: word.nahy || null,
  };
}

// Get words synchronously from LocalStorage cache (scoped by user ID if available)
export const getStoredWords = (userId?: string): Word[] => {
  const key = userId ? `${STORAGE_KEY}_user_${userId}` : STORAGE_KEY;
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to parse vocabulary words from localStorage:', err);
    return [];
  }
};

// Save words to LocalStorage cache
export const saveWords = (words: Word[], userId?: string): void => {
  const key = userId ? `${STORAGE_KEY}_user_${userId}` : STORAGE_KEY;
  try {
    localStorage.setItem(key, JSON.stringify(words));
  } catch (err) {
    console.error('Failed to save vocabulary words to localStorage:', err);
  }
};

// Read every page; the API may cap each response even when no limit is supplied.
async function readAllPages(query: (from: number, to: number) => PromiseLike<any>) {
  const rows: Record<string, any>[] = [];
  for (let from = 0; ; ) {
    const { data, error } = await query(from, from + 499);
    if (error) throw error;
    if (!data?.length) return rows;
    rows.push(...data);
    from += data.length;
  }
}

// Errors propagate to the UI; never replace a valid cache with incomplete progress.
export const fetchWordsFromSupabase = async (userId?: string): Promise<Word[]> => {
  if (!isSupabaseConfigured || !supabase || !userId) {
    throw new Error('অ্যাকাউন্ট সার্ভিসের সাথে সংযোগ নেই।');
  }
  const wordsData = await readAllPages((from, to) => supabase
    .from('words').select('*').order('id').range(from, to));
  const progressData = await readAllPages((from, to) => supabase
    .from('user_word_progress').select('word_id, status, is_memorized')
    .eq('user_id', userId).order('word_id').range(from, to));
  const progress = new Map(progressData.map(row => [String(row.word_id),
    row.status === 'memorized' || Boolean(row.is_memorized)]));
  const words = wordsData.map(row => mapRowToWord(row, progress.get(String(row.id)) ?? false));
  saveWords(words, userId);
  return words;
};

// Add a new word (saves locally & syncs with Supabase)
export const addWord = (newWord: Omit<Word, 'id' | 'createdAt'>, userId?: string): Word => {
  const current = getStoredWords(userId);
  const created: Word = {
    ...newWord,
    id: `w-custom-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    isMemorized: newWord.isMemorized ?? false,
  };
  const updated = [created, ...current];
  saveWords(updated, userId);

  // Sync with Supabase asynchronously
  if (isSupabaseConfigured && supabase) {
    (async () => {
      try {
        const row = mapWordToRow(created);
        const { error } = await supabase.from('words').insert([row]);
        if (error) {
          await supabase.from('words').insert([mapWordToCamelRow(created)]);
        }

        // If user is logged in, also record initial progress in user_word_progress
        if (userId && created.isMemorized) {
          await supabase.from('user_word_progress').upsert(
            [
              {
                user_id: userId,
                word_id: created.id,
                status: 'memorized',
                last_reviewed_at: new Date().toISOString(),
              },
            ],
            { onConflict: 'user_id,word_id' }
          );
        }
      } catch (err) {
        console.error('Supabase addWord error:', err);
      }
    })();
  }

  return created;
};

// Update existing word (updates locally & syncs with Supabase)
export const updateWord = (id: string, updates: Partial<Word>, userId?: string): Word[] => {
  const current = getStoredWords(userId);
  const updated = current.map((item) => (item.id === id ? { ...item, ...updates } : item));
  saveWords(updated, userId);

  const updatedWord = updated.find((item) => item.id === id);

  if (isSupabaseConfigured && supabase && updatedWord) {
    (async () => {
      try {
        const row = mapWordToRow(updatedWord);
        const { error } = await supabase.from('words').upsert([row], { onConflict: 'id' });
        if (error) {
          await supabase.from('words').upsert([mapWordToCamelRow(updatedWord)], { onConflict: 'id' });
        }
      } catch (err) {
        console.error('Supabase updateWord error:', err);
      }
    })();
  }

  return updated;
};

// Only report success after the database confirms the saved row.
export const toggleMemorized = async (id: string, userId?: string): Promise<Word[]> => {
  if (!isSupabaseConfigured || !supabase || !userId) {
    throw new Error('অগ্রগতি সংরক্ষণ করতে লগইন ও ইন্টারনেট সংযোগ প্রয়োজন।');
  }
  const current = getStoredWords(userId);
  const target = current.find(word => word.id === id);
  if (!target) throw new Error('শব্দটি পাওয়া যায়নি। আবার লোড করুন।');
  const isMemorized = !target.isMemorized;
  const { data, error } = await supabase.from('user_word_progress').upsert({
    user_id: userId,
    word_id: id,
    status: isMemorized ? 'memorized' : 'learning',
    is_memorized: isMemorized,
    last_reviewed_at: new Date().toISOString(),
  }, { onConflict: 'user_id,word_id' }).select('word_id').single();
  if (error) throw error;
  if (!data) throw new Error('অগ্রগতি সংরক্ষণ নিশ্চিত করা যায়নি।');
  const updated = current.map(word => word.id === id ? { ...word, isMemorized } : word);
  saveWords(updated, userId);
  return updated;
};

// Delete word (deletes locally & syncs with Supabase)
export const deleteWord = (id: string, userId?: string): Word[] => {
  const current = getStoredWords(userId);
  const updated = current.filter((item) => item.id !== id);
  saveWords(updated, userId);

  if (isSupabaseConfigured && supabase) {
    (async () => {
      try {
        await supabase.from('words').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase deleteWord error:', err);
      }
    })();
  }

  return updated;
};

// A failed reset leaves the local progress intact. Verify the server result too:
// RLS can reject DELETE by filtering all rows without returning an error.
export const resetToInitial = async (userId?: string): Promise<Word[]> => {
  if (!isSupabaseConfigured || !supabase || !userId) {
    throw new Error('রিসেট করতে লগইন ও ইন্টারনেট সংযোগ প্রয়োজন।');
  }
  const { error } = await supabase.from('user_word_progress').delete().eq('user_id', userId);
  if (error) throw error;
  const { count, error: verifyError } = await supabase.from('user_word_progress')
    .select('*', { count: 'exact', head: true }).eq('user_id', userId);
  if (verifyError) throw verifyError;
  if (count !== 0) throw new Error('রিসেট সম্পূর্ণ হয়নি। আবার চেষ্টা করুন।');
  const words = getStoredWords(userId).map(word => ({ ...word, isMemorized: false }));
  saveWords(words, userId);
  return words;
};

// Export to JSON
export const exportToJson = (words: Word[]): void => {
  const jsonStr = JSON.stringify(words, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `arabic-bangla-vocabulary-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

// Import from JSON (imports locally & uploads to Supabase)
export const importFromJson = (file: File, userId?: string): Promise<Word[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].arabic) {
          saveWords(parsed, userId);

          // Upload imported words to Supabase
          if (isSupabaseConfigured && supabase) {
            const rows = parsed.map(mapWordToRow);
            await supabase.from('words').upsert(rows, { onConflict: 'id' });
          }

          resolve(parsed);
        } else {
          reject(new Error('অবৈধ ডেটা ফরম্যাট (Invalid vocabulary JSON format)'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('ফাইল পড়তে সমস্যা হয়েছে'));
    reader.readAsText(file);
  });
};

// ==========================================
// ADMIN & SYNC SERVICES
// ==========================================

const ANNOUNCEMENT_KEY = 'arabic_bangla_vocab_latest_announcement';

// Add new word directly to Supabase words table as Admin
export const addWordToSupabase = async (
  newWordData: Omit<Word, 'id' | 'createdAt'>,
  userId?: string
): Promise<Word | null> => {
  const newWord: Word = {
    ...newWordData,
    id: `w-sb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    isMemorized: false,
  };

  if (!isSupabaseConfigured || !supabase) {
    // Local fallback
    const current = getStoredWords(userId);
    const updated = [newWord, ...current];
    saveWords(updated, userId);
    return newWord;
  }

  try {
    const row = mapWordToRow(newWord);
    const { error } = await supabase.from('words').insert([row]);

    if (error) {
      console.warn('Snake_case insert error, trying camelCase:', error.message);
      const camelRow = mapWordToCamelRow(newWord);
      await supabase.from('words').insert([camelRow]);
    }

    // Auto broadcast an update announcement
    await broadcastAdminAnnouncement(`এডমিন দ্বারা নতুন শব্দ "${newWord.arabic}" যুক্ত করা হয়েছে! শব্দভাণ্ডার আপডেট করুন।`);

    return newWord;
  } catch (err) {
    console.error('Failed to insert word into Supabase:', err);
    return null;
  }
};

// Broadcast an announcement to all users
export const broadcastAdminAnnouncement = async (message: string): Promise<boolean> => {
  const announcement = {
    id: `ann-${Date.now()}`,
    message,
    createdAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem(ANNOUNCEMENT_KEY, JSON.stringify(announcement));
  } catch (err) {
    console.error('LocalStorage announcement save error:', err);
  }

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('app_announcements').insert([
        {
          id: announcement.id,
          message: announcement.message,
          created_at: announcement.createdAt,
        },
      ]);
    } catch (err) {
      console.warn('Supabase app_announcements table insert notice (using fallback):', err);
    }
  }

  return true;
};

// Fetch latest broadcast announcement
export const fetchLatestAnnouncement = async (): Promise<{ message: string; createdAt: string } | null> => {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('app_announcements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!error && data && data.length > 0) {
        return {
          message: data[0].message,
          createdAt: data[0].created_at || data[0].createdAt,
        };
      }
    } catch (err) {
      console.warn('Supabase announcement fetch notice:', err);
    }
  }

  try {
    const stored = localStorage.getItem(ANNOUNCEMENT_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        message: parsed.message,
        createdAt: parsed.createdAt,
      };
    }
  } catch (err) {
    console.error('Error reading local announcement:', err);
  }

  return null;
};

// Check if new words exist in Supabase compared to current user list
export const checkNewWordsAvailable = async (
  currentLocalCount: number,
  userId?: string
): Promise<{ hasNew: boolean; newCount: number; announcementMessage?: string }> => {
  if (!isSupabaseConfigured || !supabase) {
    return { hasNew: false, newCount: 0 };
  }

  try {
    const { count, error } = await supabase.from('words').select('*', { count: 'exact', head: true });

    if (error || count === null) {
      return { hasNew: false, newCount: 0 };
    }

    if (count > currentLocalCount) {
      const announcement = await fetchLatestAnnouncement();
      return {
        hasNew: true,
        newCount: count - currentLocalCount,
        announcementMessage: announcement?.message,
      };
    }
  } catch (err) {
    console.warn('Check new words notice:', err);
  }

  return { hasNew: false, newCount: 0 };
};

// Sync latest words from Supabase while preserving user progress
export const syncNewWordsFromSupabase = async (userId?: string): Promise<Word[]> => {
  return await fetchWordsFromSupabase(userId);
};

