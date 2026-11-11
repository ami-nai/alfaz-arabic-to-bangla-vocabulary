import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearchText, createWordSearchIndex, createSearchMatcher } from '../src/lib/search.ts';

const matches = (word, query) => createSearchMatcher(query)(createWordSearchIndex(word));
// Representative values from the project's vocabulary CSV.
const peace = { arabic: 'سَلَامٌ', banglaMeaning: 'শান্তি', transliteration: 'সালামুন্' };
const hot = { arabic: 'حَارٌّ', banglaMeaning: 'গরম / উষ্ণ', transliteration: 'হাররুন্' };

test('Arabic matches with no, partial, or full vowel marks', () => {
  for (const query of ['سلام', 'سَلام', 'سَلَامٌ', '  سلام  ']) assert.equal(matches(peace, query), true);
  assert.equal(matches(hot, 'حار'), true);
  assert.equal(matches(peace, 'كتاب'), false);
});
test('Arabic alef variants, elongation and presentation forms normalize', () => {
  for (const value of ['إِسْلَام', 'أَسْلَام', 'آسلام', 'ٱسلام', 'اسـلام', 'اسﻼم']) {
    assert.equal(matches({ arabic: value }, 'اسلام'), true);
  }
  assert.equal(matches({ arabic: 'عَلَى' }, 'علي'), true);
});
test('Bangla signs remain significant', () => {
  assert.equal(matches(hot, 'উষ্ণ'), true);
  assert.equal(matches(peace, 'শান্তি'), true);
  assert.equal(matches({ banglaMeaning: 'দিন' }, 'দীন'), false);
  assert.notEqual(normalizeSearchText('কাল'), normalizeSearchText('কল'));
});
test('canonically equivalent Bangla spelling matches', () => {
  assert.equal(matches({ banglaMeaning: 'বড়' }, 'বড়'), true);
  assert.equal(matches({ banglaMeaning: 'সময়' }, 'সময়'), true);
});
test('pronunciation is searchable and case insensitive', () => {
  assert.equal(matches(peace, 'সালামুন্'), true);
  assert.equal(matches({ transliteration: 'Kitaabun' }, 'KITAAB'), true);
});
test('all verb forms are searchable', () => {
  for (const key of ['bab', 'masdar', 'madi', 'mudari', 'amr', 'nahy']) {
    assert.equal(matches({ [key]: 'يَكْتُبُ' }, 'يكتب'), true, key);
  }
});
test('multi-term search requires every term, including mixed scripts', () => {
  assert.equal(matches(hot, '  উষ্ণ   গরম '), true);
  assert.equal(matches(peace, 'سلام শান্তি'), true);
  assert.equal(matches(peace, 'سلام গরম'), false);
});
test('copied invisible controls and repeated whitespace do not block matches', () => {
  assert.equal(matches(peace, '\u200fسلا\u200dم\u200e'), true);
  assert.equal(matches({ banglaMeaning: 'শান্তি বর্ষিত হোক' }, 'শান্তি\nবর্ষিত'), true);
});
test('empty query matches all, punctuation-only or mark-only does not', () => {
  assert.equal(matches(peace, '  '), true);
  assert.equal(matches(peace, '!!!'), false);
  assert.equal(matches(peace, 'َ'), false);
});
test('optional fields are safe and matching cannot cross field boundaries', () => {
  assert.equal(matches({}, 'سلام'), false);
  assert.equal(matches({ arabic: 'ab', banglaMeaning: 'cd' }, 'bc'), false);
});
