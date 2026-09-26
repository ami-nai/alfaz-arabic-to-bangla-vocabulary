export interface Word {
  id: string;
  arabic: string;
  transliteration?: string; // Phonetic pronunciation in Bangla/English
  banglaMeaning: string;
  antonymArabic?: string;   // For Phase 2 (Opposite words)
  antonymBangla?: string;   // For Phase 2
  category?: string;        // e.g., "Nouns", "Verbs", "Common Phrases", "Quranic"
  isMemorized?: boolean;    // For Phase 3 (Tracking progress)
  createdAt?: string;
  exampleArabic?: string;   // Example usage in Arabic
  exampleBangla?: string;   // Example usage in Bangla
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  // Verb (ক্রিয়া) sarf/conjugation details — only set for verb-category words
  bab?: string;             // باب (verb form/pattern)
  masdar?: string;          // مصدر (verbal noun)
  madi?: string;            // ماضي (past tense)
  mudari?: string;          // مضارع (present tense)
  amr?: string;             // أمر (imperative)
  nahy?: string;            // نهي (prohibition)
}

export type ViewMode = 'table' | 'cards' | 'flashcards' | 'antonyms';

export type MemorizedFilter = 'all' | 'memorized' | 'unmemorized';

export interface CategoryStats {
  name: string;
  total: number;
  memorized: number;
}

// Canonical verb category. 'ক্রিয়াপদ' is matched defensively for
// stale localStorage caches / legacy rows.
export const VERB_CATEGORY = 'ক্রিয়া';

export const isVerbCategory = (category?: string): boolean =>
  category === 'ক্রিয়া' || category === 'ক্রিয়াপদ';
