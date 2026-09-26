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
    if (!data) {
      // Fallback to base key if user key not set
      const baseData = localStorage.getItem(STORAGE_KEY);
      if (baseData) {
        return JSON.parse(baseData);
      }
      return [];
    }
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

// Fetch words asynchronously from Supabase, applying per-user word progress if logged in
export const fetchWordsFromSupabase = async (userId?: string): Promise<Word[]> => {
  if (!isSupabaseConfigured || !supabase) {
    return getStoredWords(userId);
  }

  try {
    // 1. Fetch global dictionary of words
    const { data: wordsData, error: wordsError } = await supabase
      .from('words')
      .select('*')
      .order('created_at', { ascending: false });

    if (wordsError) {
      console.warn('Supabase words fetch notice:', wordsError.message);
      return getStoredWords(userId);
    }

    if (!wordsData || wordsData.length === 0) {
      return getStoredWords(userId);
    }

    // 2. Fetch user_word_progress if userId is provided
    let userProgressMap = new Map<string, boolean>();
    if (userId) {
      try {
        const { data: progressData, error: progressError } = await supabase
          .from('user_word_progress')
          .select('word_id, status, is_memorized')
          .eq('user_id', userId);

        if (!progressError && progressData) {
          progressData.forEach((item: any) => {
            const wordId = String(item.word_id);
            const isMemo =
              item.status === 'memorized' ||
              Boolean(item.is_memorized);
            userProgressMap.set(wordId, isMemo);
          });
        }
      } catch (pErr) {
        console.warn('user_word_progress table fetch fallback notice:', pErr);
      }
    }

    // 3. Map words with per-user memorized status
    const mappedWords = wordsData.map((row) => {
      const wordId = String(row.id);
      const isMemorizedForUser = userId && userProgressMap.has(wordId)
        ? userProgressMap.get(wordId)
        : undefined;

      return mapRowToWord(row, isMemorizedForUser);
    });

    saveWords(mappedWords, userId);
    return mappedWords;
  } catch (err) {
    console.error('Error fetching words from Supabase:', err);
    return getStoredWords(userId);
  }
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

// Toggle memorized status per-user (updates locally & syncs with user_word_progress in Supabase)
export const toggleMemorized = (id: string, userId?: string): Word[] => {
  const current = getStoredWords(userId);
  let targetWord: Word | undefined;
  const updated = current.map((item) => {
    if (item.id === id) {
      targetWord = { ...item, isMemorized: !item.isMemorized };
      return targetWord;
    }
    return item;
  });
  saveWords(updated, userId);

  if (isSupabaseConfigured && supabase && targetWord) {
    const isMemo = targetWord.isMemorized;
    const statusStr = isMemo ? 'memorized' : 'learning';

    (async () => {
      try {
        // 1. Primary: Save to user_word_progress junction table if logged in
        if (userId) {
          const { error: pErr } = await supabase.from('user_word_progress').upsert(
            [
              {
                user_id: userId,
                word_id: id,
                status: statusStr,
                is_memorized: isMemo,
                last_reviewed_at: new Date().toISOString(),
              },
            ],
            { onConflict: 'user_id,word_id' }
          );

          if (pErr) {
            console.warn('user_word_progress upsert fallback:', pErr.message);
          }
        }
      } catch (err) {
        console.error('Supabase toggleMemorized error:', err);
      }
    })();
  }

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

// Reset user memorized progress back to 0% (unmemorize all words)
export const resetToInitial = async (userId?: string): Promise<Word[]> => {
  const current = getStoredWords(userId);
  const unmemorizedWords = current.map((item) => ({ ...item, isMemorized: false }));
  saveWords(unmemorizedWords, userId);

  if (isSupabaseConfigured && supabase) {
    try {
      if (userId) {
        await supabase
          .from('user_word_progress')
          .delete()
          .eq('user_id', userId);
      }
    } catch (err) {
      console.error('Supabase reset progress error:', err);
    }

    try {
      return await fetchWordsFromSupabase(userId);
    } catch (fetchErr) {
      console.warn('Fallback to local unmemorized words:', fetchErr);
      return unmemorizedWords;
    }
  }

  return unmemorizedWords;
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

