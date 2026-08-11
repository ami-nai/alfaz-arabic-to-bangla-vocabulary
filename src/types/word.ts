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
}

export type ViewMode = 'table' | 'cards' | 'flashcards' | 'antonyms';

export type MemorizedFilter = 'all' | 'memorized' | 'unmemorized';

export interface CategoryStats {
  name: string;
  total: number;
  memorized: number;
}
