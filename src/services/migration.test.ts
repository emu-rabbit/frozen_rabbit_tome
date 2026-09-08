import { describe, expect, it } from 'vitest';
import { DEFAULT_PLAYER_STATS } from '../config/inputLimits';
import { commitImport, MAX_BACKUP_BYTES, MIGRATION_DISMISSED_KEY, parseBackup, prepareImport } from './migration';

const prefix = 'frozen-rabbit-tome-';
const stamp = '2026-09-07T00:00:00.000Z';
const stats = { level: 100, gathering: 5000, perception: 5000, gp: 900 };
const food = { foodId: null, quality: 'hq' };
const nodeBonuses = { gatheringCount: 0, yieldCount: 0, extraRate: 0 };
const input = { itemId: 123, stats, food, nodeBonuses, temporaryGp: 800, hasRelicToolBonus: true };
const tome = { schemaVersion: 2, kind: 'collectable', id: 'one', itemId: 123, input, createdAt: stamp, updatedAt: stamp };
const favorite = { itemId: 123, createdAt: stamp };
const envelope = (data: Record<string, string>, extra = {}) => JSON.stringify({ format: 'frozen-rabbit-tome-backup', version: 1, data, ...extra });
const backup = (data: Record<string, unknown>) => parseBackup(envelope(Object.fromEntries(Object.entries(data).map(([k, v]) => [prefix + k, typeof v === 'string' ? v : JSON.stringify(v)]))));
function storage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return { getItem: k => map.get(k) ?? null, setItem: (k, v) => { map.set(k, v); }, removeItem: k => { map.delete(k); }, clear: () => map.clear(), key: i => [...map.keys()][i] ?? null, get length() { return map.size; } };
}

describe('Gleaner Tome v1 migration', () => {
  it.each([
    ['lang', 'tw', 'ja'],
    ['dark-mode', 'false', 'true'],
    ['library-display-mode', 'detailed', 'compact'],
    ['experiment-database-display-mode', 'detailed', 'compact'],
    ['frontier-studies-display-mode', 'detailed', 'compact'],
    ['selected-food', { foodId: null, quality: 'hq' }, { foodId: 123, quality: 'hq' }],
    ['node-bonuses', { baseIntegrity: 4, gatheringCount: 0, yieldCount: 0, extraRate: 0 }, { baseIntegrity: 4, gatheringCount: 1, yieldCount: 0, extraRate: 0 }],
    ['favorite-item-filters', { text: '', glvMin: '', glvMax: '', jobs: [], systems: [] }, { text: 'ore', glvMin: '', glvMax: '', jobs: [], systems: [] }]
  ])('restores %s over its startup default', (key, initial, incoming) => {
    const name = String(key);
    const store = storage({ [prefix + name]: typeof initial === 'string' ? initial : JSON.stringify(initial) });
    const data = backup({ [name]: incoming });
    const plan = prepareImport(data, store, 'keep');
    expect(plan.counts.conflicts).toBe(0);
    commitImport(plan, store);
    expect(store.getItem(prefix + name)).toBe(data[prefix + name]);
  });
  it('replaces startup defaults without conflicts even when keeping current data', () => {
    const defaults = ['miner', 'botanist'].map(job => ({
      id: `default-${job}`, kind: `default-${job}`, name: '', jobs: [job],
      level: DEFAULT_PLAYER_STATS.level, gathering: DEFAULT_PLAYER_STATS.gathering,
      perception: DEFAULT_PLAYER_STATS.perception, currentGp: DEFAULT_PLAYER_STATS.gp,
      maxGp: DEFAULT_PLAYER_STATS.gp, food, collectableRelicToolBonus: false,
      createdAt: stamp, updatedAt: stamp
    }));
    const incoming = defaults.map(p => ({ ...p, gathering: 5233, maxGp: 931, currentGp: 931, collectableRelicToolBonus: true, createdAt: '2026-05-01T00:00:00.000Z' }));
    const store = storage({
      [prefix + 'gear-profiles']: JSON.stringify(defaults),
      [prefix + 'macro-settings']: '{ "bufferSeconds": 2, "secondsPerGather": 4 }',
      [prefix + 'solver-settings']: JSON.stringify({ objectiveMode: 'expected', collectableRelicToolBonus: false }),
      [prefix + 'frontier-settings']: '{"enabled":false}',
      [prefix + 'solver-stats']: JSON.stringify({ level: 100, gathering: 5345, perception: 5137, gp: 930 })
    });
    const data = backup({ 'gear-profiles': incoming, 'macro-settings': { secondsPerGather: 3, bufferSeconds: 1 }, 'solver-settings': { objectiveMode: 'expected', collectableRelicToolBonus: true }, 'frontier-settings': { enabled: true }, 'solver-stats': stats });
    const plan = prepareImport(data, store, 'keep');
    expect(plan.counts.conflicts).toBe(0);
    commitImport(plan, store);
    for (const [key, value] of Object.entries(data)) expect(store.getItem(key)).toBe(value);

    // Real edits and custom profiles must still be protected.
    const edited = incoming.map(p => ({ ...p, name: 'My gear' }));
    store.setItem(prefix + 'gear-profiles', JSON.stringify(edited));
    store.setItem(prefix + 'macro-settings', '{"secondsPerGather":5,"bufferSeconds":1}');
    const keep = prepareImport(data, store, 'keep');
    expect(keep.counts.conflicts).toBe(3);
    commitImport(keep, store);
    expect(JSON.parse(store.getItem(prefix + 'gear-profiles')!)).toEqual(edited);
    expect(JSON.parse(store.getItem(prefix + 'macro-settings')!).secondsPerGather).toBe(5);
  });
  it('preserves all five collections and settings through repeated imports', () => {
    const experiment = { ...tome, strategy: { kind: 'collectable', rules: [], hasRelicToolBonus: true } };
    const study = { ...tome, kind: 'frontier.collectable', strategy: [], probabilityProfile: { brazenBuckets: [], standardProcRatePercent: 20, highStandardProcRatePercent: null } };
    const gear = { id: 'custom', kind: 'custom', jobs: ['miner'], name: 'Test', ...stats, currentGp: 800, maxGp: 900, food, collectableRelicToolBonus: true, createdAt: stamp, updatedAt: stamp };
    const data = backup({ library: [tome], experiments: [experiment], 'frontier-studies': [study], 'gear-profiles': [gear], 'favorite-items': [favorite], lang: 'en', 'dark-mode': 'true' });
    const store = storage({ consent: 'denied' });
    const plan = prepareImport(data, store, 'backup');
    expect(plan.counts).toEqual({ library: 1, experiments: 1, studies: 1, gear: 1, favorites: 1, settings: 2, conflicts: 0 });
    commitImport(plan, store);
    commitImport(prepareImport(data, store, 'backup'), store);
    for (const [key, value] of Object.entries(data)) expect(store.getItem(key)).toBe(value);
    expect(store.getItem('consent')).toBe('denied');
    expect(store.getItem(prefix + 'initialized')).toBe('true');
    expect(store.getItem(MIGRATION_DISMISSED_KEY)).toBe('true');
  });
  it('merges collections by ID and favorites by itemId, without truncation', () => {
    const current = { ...tome, name: 'Current' };
    const store = storage({ [prefix + 'library']: JSON.stringify([current]), [prefix + 'favorite-items']: JSON.stringify([favorite]) });
    const incoming = Array.from({ length: 100 }, (_, i) => ({ ...tome, id: String(i) }));
    const data = backup({ library: [tome, ...incoming], 'favorite-items': [favorite] });
    const keep = prepareImport(data, store, 'keep');
    expect(keep.counts.conflicts).toBe(1);
    commitImport(keep, store);
    expect(JSON.parse(store.getItem(prefix + 'library')!)).toEqual([current, ...incoming]);
    commitImport(prepareImport(data, store, 'backup'), store);
    expect(JSON.parse(store.getItem(prefix + 'library')!)).toEqual([tome, ...incoming]);
    expect(JSON.parse(store.getItem(prefix + 'favorite-items')!)).toEqual([favorite]);
  });
  it('converts legacy stats even when startup has seeded gear profiles', () => {
    const data = backup({ 'user-stats': { miner: stats, botanist: { ...stats, gp: 700 } } });
    const store = storage();
    commitImport(prepareImport(data, store, 'backup'), store);
    const profiles = JSON.parse(store.getItem(prefix + 'gear-profiles')!);
    expect(profiles.map((p: { maxGp: number }) => p.maxGp)).toEqual([900, 700]);
    expect(store.getItem(prefix + 'user-stats')).toBeNull();
    const updated = backup({ 'user-stats': { miner: { ...stats, gp: 600 }, botanist: stats } });
    expect(prepareImport(updated, store, 'keep').counts.conflicts).toBe(2);
    commitImport(prepareImport(updated, store, 'keep'), store);
    expect(JSON.parse(store.getItem(prefix + 'gear-profiles')!)).toEqual(profiles);
    commitImport(prepareImport(updated, store, 'backup'), store);
    expect(JSON.parse(store.getItem(prefix + 'gear-profiles')!)[0].maxGp).toBe(600);
  });
  it('accepts valid legacy library records without dropping old snapshots', () => {
    const legacy = { id: 'old', itemId: 123, stats, food, nodeBonuses, rotation: [{ type: 'gather' }], createdAt: stamp };
    expect(JSON.parse(backup({ library: [legacy] })[prefix + 'library']!)).toEqual([legacy]);
  });
  it('ignores early active-item backups and preserves existing selection', () => {
    const data = backup({ 'active-item': '{broken', lang: 'ja' });
    expect(data).toEqual({ [prefix + 'lang']: 'ja' });
  });
  it.each([
    { library: [tome, tome] }, { library: [{ ...tome, input: {} }] },
    { library: [{ ...tome, schemaVersion: 99 }] }, { library: '{broken' },
    { 'favorite-items': [{ itemId: 0, createdAt: stamp }] }, { lang: 'xx' },
    { 'solver-stats': { gp: 1 } }, { 'debug-settings': '{}' }, { 'analytics-consent': 'granted' },
    { experiments: [{ ...tome, strategy: {} }] }, { 'gear-profiles': [{ id: 'a' }] },
    { library: [{ ...tome, kind: 'regular', lastSolvedSnapshot: { kind: 'regular' } }] }
  ])('rejects invalid data as a whole: %j', data => expect(() => backup(data)).toThrow('invalid'));
  it('rejects other projects, versions and oversized files', () => {
    expect(() => parseBackup(envelope({}, { format: 'frozen-rabbit-workshop-backup' }))).toThrow('format');
    expect(() => parseBackup(envelope({}, { version: 2 }))).toThrow('format');
    expect(() => parseBackup(' '.repeat(MAX_BACKUP_BYTES + 1))).toThrow('tooLarge');
  });
  it('rejects changed previews and corrupt current collections', () => {
    const store = storage();
    const data = backup({ library: [tome] });
    const plan = prepareImport(data, store, 'keep');
    store.setItem(prefix + 'library', '{}');
    expect(() => commitImport(plan, store)).toThrow('changed');
    expect(() => prepareImport(data, store, 'keep')).toThrow('invalid');
  });
  it('rolls back completed writes after a quota failure', () => {
    const store = storage({ [prefix + 'library']: '[]' });
    const plan = prepareImport(backup({ library: [tome], lang: 'en' }), store, 'backup');
    const write = store.setItem;
    store.setItem = (key, value) => { if (key === prefix + 'lang') throw Error('quota'); write(key, value); };
    expect(() => commitImport(plan, store)).toThrow('storage');
    expect(store.getItem(prefix + 'library')).toBe('[]');
    expect(store.getItem(prefix + 'initialized')).toBeNull();
  });
  it('reports failed rollback and allows reminder preference changes after preview', () => {
    const store = storage();
    const plan = prepareImport(backup({ library: [] }), store, 'backup');
    store.setItem(MIGRATION_DISMISSED_KEY, 'true');
    const write = store.setItem;
    store.setItem = (key, value) => { if (key === prefix + 'initialized') throw Error('blocked'); write(key, value); };
    store.removeItem = () => { throw Error('blocked'); };
    expect(() => commitImport(plan, store)).toThrow('rollback');
  });
});
