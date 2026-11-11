import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';

const cache = new Map();
globalThis.localStorage = {
  getItem: key => cache.get(key) ?? null,
  setItem: (key, value) => cache.set(key, value),
};
let rows, progress, failure, deleted, invisibleDelete, writes;
globalThis.testSupabase = {
  from(table) {
    let operation = 'select', payload, head = false, start = 0, end = Infinity, owner;
    const run = () => {
      if (failure === table || failure === operation) return { error: new Error('network or policy failure') };
      if (operation === 'upsert') { writes.push(payload); return { data: { word_id: payload.word_id }, error: null }; }
      if (operation === 'delete') { if (!invisibleDelete) deleted = true; return { error: null }; }
      const data = table === 'words' ? rows : (deleted ? [] : progress.filter(row => row.user_id === owner));
      return head ? { count: data.length, error: null } : { data: data.slice(start, end + 1), error: null };
    };
    const query = {
      select(_columns, options) { head = options?.head ?? false; return query; },
      order() { return query; },
      eq(_column, value) { owner = value; return query; },
      range(from, to) { start = from; end = to; return query; },
      upsert(value) { operation = 'upsert'; payload = value; return query; },
      delete() { operation = 'delete'; return query; },
      single() { return query; },
      then(resolve, reject) { return Promise.resolve(run()).then(resolve, reject); },
    };
    return query;
  },
};
const result = await build({
  entryPoints: ['src/services/storage.ts'], bundle: true, write: false, format: 'esm', platform: 'node',
  plugins: [{ name: 'mock-supabase', setup(build) {
    build.onResolve({ filter: /lib\/supabase$/ }, () => ({ path: 'supabase', namespace: 'mock' }));
    build.onLoad({ filter: /.*/, namespace: 'mock' }, () => ({ contents: 'export const isSupabaseConfigured = true; export const supabase = globalThis.testSupabase;' }));
  } }],
});
const storage = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].text).toString('base64')}`);
const word = { id: 'w1', arabic: 'كتاب', banglaMeaning: 'বই', isMemorized: true };
beforeEach(() => {
  cache.clear(); rows = [{ id: 'w1', arabic: 'كتاب', bangla_meaning: 'বই', is_memorized: true }];
  progress = [{ user_id: 'A', word_id: 'w1', is_memorized: true }];
  failure = null; deleted = false; invisibleDelete = false; writes = [];
  storage.saveWords([word], 'A');
});
test('new accounts never inherit another account or legacy progress', async () => {
  storage.saveWords([word]);
  assert.deepEqual(storage.getStoredWords('B'), []);
  const fetched = await storage.fetchWordsFromSupabase('B');
  assert.equal(fetched[0].isMemorized, false);
});
test('failed save preserves previously confirmed cache and rejects', async () => {
  failure = 'upsert';
  await assert.rejects(storage.toggleMemorized('w1', 'A'));
  assert.equal(storage.getStoredWords('A')[0].isMemorized, true);
});
test('successful save writes the correct account and updates cache', async () => {
  const saved = await storage.toggleMemorized('w1', 'A');
  assert.equal(saved[0].isMemorized, false);
  assert.equal(writes[0].user_id, 'A');
  assert.equal(writes[0].is_memorized, false);
});
test('progress fetch failure does not erase cached memorization', async () => {
  failure = 'user_word_progress';
  await assert.rejects(storage.fetchWordsFromSupabase('A'));
  assert.equal(storage.getStoredWords('A')[0].isMemorized, true);
});
test('failed reset preserves cache and rejects', async () => {
  failure = 'delete';
  await assert.rejects(storage.resetToInitial('A'));
  assert.equal(storage.getStoredWords('A')[0].isMemorized, true);
});
test('reset detects a policy-filtered delete that reports no error', async () => {
  invisibleDelete = true;
  await assert.rejects(storage.resetToInitial('A'));
  assert.equal(storage.getStoredWords('A')[0].isMemorized, true);
});
test('confirmed reset clears only the current account cache', async () => {
  storage.saveWords([word], 'B');
  assert.equal((await storage.resetToInitial('A'))[0].isMemorized, false);
  assert.equal(storage.getStoredWords('B')[0].isMemorized, true);
});
test('dictionary and progress are fetched beyond the first API page', async () => {
  rows = Array.from({ length: 1002 }, (_, i) => ({ id: `w${i}`, arabic: 'كتاب' }));
  progress = rows.map(row => ({ user_id: 'A', word_id: row.id, is_memorized: true }));
  const fetched = await storage.fetchWordsFromSupabase('A');
  assert.equal(fetched.length, 1002);
  assert.equal(fetched.filter(word => word.isMemorized).length, 1002);
});
test('empty dictionary replaces stale cached words', async () => {
  rows = []; progress = [];
  assert.deepEqual(await storage.fetchWordsFromSupabase('A'), []);
  assert.deepEqual(storage.getStoredWords('A'), []);
});
