import type { Word } from '../types/word';

// Normalize spelling/formatting, not meaning. In particular, never strip all
// Unicode combining marks: Bangla vowel signs are essential to the word.
export function normalizeSearchText(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u0610-\u061a\u064b-\u065f\u0670\u06d6-\u06ed]/g, '')
    .replace(/\u0640/g, '') // Arabic tatweel (decorative elongation)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/[ىی]/g, 'ي')
    .replace(/ک/g, 'ك')
    .replace(/[\u200b-\u200f\u202a-\u202e\u2060\u2066-\u2069\ufeff]/g, '')
    .replace(/[\p{P}\p{S}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function createWordSearchIndex(word: Word): string[] {
  // Keep fields separate so a partial word cannot straddle field boundaries.
  return [word.arabic, word.banglaMeaning, word.transliteration,
    word.bab, word.masdar, word.madi, word.mudari, word.amr, word.nahy]
    .filter((value): value is string => typeof value === 'string' && value.length > 0)
    .map(normalizeSearchText);
}

export function createSearchMatcher(query: string): (fields: string[]) => boolean {
  if (!query.trim()) return () => true;
  const normalized = normalizeSearchText(query);
  if (!normalized) return () => false;
  const terms = normalized.split(' ');
  // Each term must occur, but Arabic and Bangla terms can match different fields.
  return fields => terms.every(term => fields.some(field => field.includes(term)));
}
