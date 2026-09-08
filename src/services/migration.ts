import { DEFAULT_PLAYER_STATS } from '../config/inputLimits'

export const GLEANER_URL = 'https://emu-rabbit.github.io/gleaner/'
export const MIGRATION_DISMISSED_KEY = 'frozen-rabbit-tome-migration-dismissed'
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024
const prefix = 'frozen-rabbit-tome-'
const collections = ['favorite-items', 'library', 'experiments', 'frontier-studies', 'gear-profiles']
const settings = ['lang', 'library-display-mode', 'experiment-database-display-mode', 'frontier-studies-display-mode', 'dark-mode', 'macro-settings', 'solver-settings', 'frontier-settings', 'favorite-item-filters', 'solver-stats', 'selected-food', 'node-bonuses', 'user-stats']
const keys = [...collections, ...settings].map(key => prefix + key)
type RecordValue = Record<string, unknown>
export type BackupData = Record<string, string>
export type ConflictPolicy = 'keep' | 'backup'
export class MigrationError extends Error {
  code: string
  detail: string
  constructor(code: string, detail = '') {
    super(code)
    this.code = code
    this.detail = detail
  }
}
const object = (value: unknown): value is RecordValue => !!value && typeof value === 'object' && !Array.isArray(value)
const fail = (detail: string): never => { throw new MigrationError('invalid', detail) }

const number = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v >= 0
const itemId = (v: unknown) => number(v) && Number.isSafeInteger(v) && v > 0
const date = (v: unknown) => typeof v === 'string' && Number.isFinite(Date.parse(v))
const stats = (v: unknown) => object(v) && ['level', 'gathering', 'perception', 'gp'].every(k => number(v[k]))
const food = (v: unknown) => object(v) && (v.foodId === null || itemId(v.foodId)) && ['nq', 'hq'].includes(String(v.quality))
const bonuses = (v: unknown) => object(v) && ['gatheringCount', 'yieldCount', 'extraRate'].every(k => number(v[k])) && (v.baseIntegrity === undefined || number(v.baseIntegrity))
const rotation = (v: unknown) => Array.isArray(v) && v.every(s => object(s) && (s.type === 'gather' || (s.type === 'action' && itemId(s.actionId))))
const rules = (v: unknown) => Array.isArray(v) && v.every(r => object(r) && typeof r.id === 'string' && typeof r.name === 'string' && ['all', 'any'].includes(String(r.mode)) && typeof r.enabled === 'boolean' && Array.isArray(r.actions) && r.actions.every(a => typeof a === 'string') && Array.isArray(r.conditions) && r.conditions.every(c => object(c) && typeof c.id === 'string' && typeof c.field === 'string' && ['<', '<=', '=', '!=', '>=', '>'].includes(String(c.comparator)) && ['number', 'boolean', 'string'].includes(typeof c.value)))

function json(raw: string, key: string): unknown {
  try { return JSON.parse(raw) } catch { return fail(key) }
}

function validRecord(value: RecordValue, suffix: string): boolean {
  if (!date(value.createdAt) || (value.updatedAt !== undefined && !date(value.updatedAt))) return false
  if (value.name !== undefined && typeof value.name !== 'string') return false
  if (suffix === 'favorite-items') return itemId(value.itemId) && ['isCollectable', 'isCrystalGathering'].every(k => value[k] === undefined || typeof value[k] === 'boolean')
  if (suffix === 'gear-profiles') return ['custom', 'default-miner', 'default-botanist'].includes(String(value.kind)) &&
    Array.isArray(value.jobs) && value.jobs.length > 0 && value.jobs.every(j => j === 'miner' || j === 'botanist') &&
    ['level', 'gathering', 'perception', 'currentGp', 'maxGp'].every(k => number(value[k])) && food(value.food) && typeof value.collectableRelicToolBonus === 'boolean'
  if (!itemId(value.itemId)) return false
  if (suffix === 'frontier-studies') {
    const p = value.probabilityProfile
    return value.schemaVersion === 2 && date(value.updatedAt) && value.kind === 'frontier.collectable' && object(value.input) &&
      stats(value.input.stats) && number(value.input.temporaryGp) && bonuses(value.input.nodeBonuses) &&
      (value.input.food === undefined || food(value.input.food)) && rules(value.strategy) && object(p) &&
      Array.isArray(p.brazenBuckets) && p.brazenBuckets.every(b => object(b) && typeof b.id === 'string' && number(b.multiplierPercent) && number(b.probabilityPercent)) &&
      number(p.standardProcRatePercent) && (p.highStandardProcRatePercent === null || number(p.highStandardProcRatePercent))
  }
  if (value.kind !== undefined && value.kind !== 'regular' && value.kind !== 'collectable') return false
  if (value.schemaVersion !== undefined && value.schemaVersion !== 1 && value.schemaVersion !== 2) return false
  if (value.schemaVersion === 2 && value.kind === undefined) return false
  const input = value.schemaVersion === 2 ? value.input : value
  if (!object(input) || !stats(input.stats) || !food(input.food) || !bonuses(input.nodeBonuses)) return false
  if (input.temporaryGp !== undefined && !number(input.temporaryGp)) return false
  if (input.hasRelicToolBonus !== undefined && typeof input.hasRelicToolBonus !== 'boolean') return false
  if (value.schemaVersion === 2 && (input.itemId !== value.itemId || !number(input.temporaryGp) || !date(value.updatedAt))) return false
  if (suffix === 'experiments') {
    if (value.schemaVersion === 2) {
      const s = value.strategy
      if (!object(s) || s.kind !== value.kind) return false
      return s.kind === 'collectable' ? rules(s.rules) : rotation(s.primaryRotation) && rotation(s.revisitRotation)
    }
    return value.kind === 'collectable' ? rules(value.collectableRules ?? []) : rotation(value.primaryRotation ?? []) && rotation(value.revisitRotation ?? [])
  }
  if (value.lastSolvedSnapshot !== undefined) {
    const snapshot = value.lastSolvedSnapshot
    if (!object(snapshot) || snapshot.kind !== value.kind) return false
    if (snapshot.kind === 'regular' && !rotation(snapshot.rotation)) return false
    if (snapshot.rotationPlans !== undefined && (!Array.isArray(snapshot.rotationPlans) || !snapshot.rotationPlans.every(p => object(p) && ['primary', 'revisit'].includes(String(p.kind)) && rotation(p.rotation)))) return false
    if (snapshot.previewBranches !== undefined && !Array.isArray(snapshot.previewBranches)) return false
  }
  return value.rotation === undefined || rotation(value.rotation)
}

function parseCollection(raw: string, key: string): RecordValue[] {
  const value = json(raw, key)
  if (!Array.isArray(value)) return fail(key)
  const ids = new Set<string>()
  return value.map((note, index) => {
    const at = `${key}[${index + 1}]`
    if (!object(note) || !validRecord(note, key.slice(prefix.length))) return fail(at)
    const id = key === prefix + 'favorite-items' ? String(note.itemId) : note.id
    if (typeof id !== 'string' || !id.trim() || ids.has(id)) return fail(at)
    ids.add(id)
    return note
  })
}

function validSetting(raw: string, suffix: string): boolean {
  if (suffix === 'lang') return ['tw', 'cn', 'en', 'ja'].includes(raw)
  if (suffix === 'dark-mode') return ['true', 'false'].includes(raw)
  if (suffix.endsWith('display-mode')) return ['compact', 'detailed'].includes(raw)
  const v = json(raw, prefix + suffix)
  if (!object(v)) return false
  switch (suffix) {
    case 'solver-stats': return stats(v)
    case 'user-stats': return stats(v.miner) && stats(v.botanist)
    case 'selected-food': return food(v)
    case 'node-bonuses': return bonuses(v)
    case 'macro-settings': return number(v.secondsPerGather) && number(v.bufferSeconds)
    case 'solver-settings': return ['expected', 'min', 'max'].includes(String(v.objectiveMode)) && (v.collectableRelicToolBonus === undefined || typeof v.collectableRelicToolBonus === 'boolean')
    case 'frontier-settings': return typeof v.enabled === 'boolean' || (v.enabled === undefined && typeof v.collectableEnabled === 'boolean')
    case 'favorite-item-filters': return ['text', 'glvMin', 'glvMax'].every(k => typeof v[k] === 'string') && Array.isArray(v.jobs) && v.jobs.every(j => ['miner', 'botanist'].includes(String(j))) && Array.isArray(v.systems) && v.systems.every(s => ['regular', 'collectable', 'crystal'].includes(String(s)))
    default: return false
  }
}

export function parseBackup(text: string): BackupData {
  if (new Blob([text]).size > MAX_BACKUP_BYTES) throw new MigrationError('tooLarge')
  let envelope: unknown
  try { envelope = JSON.parse(text.replace(/^\uFEFF/, '')) } catch { throw new MigrationError('invalid') }
  if (!object(envelope) || envelope.format !== 'frozen-rabbit-tome-backup' || envelope.version !== 1) throw new MigrationError('format')
  if (!object(envelope.data) || !Object.keys(envelope.data).length) throw new MigrationError('invalid')
  const data: BackupData = {}
  for (const [key, raw] of Object.entries(envelope.data)) {
    // Early Gleaner v1 files included the selected item; never restore it.
    if (key === prefix + 'active-item' && typeof raw === 'string') continue
    if (!keys.includes(key) || typeof raw !== 'string') return fail(key)
    const suffix = key.slice(prefix.length)
    if (collections.includes(suffix)) data[key] = JSON.stringify(parseCollection(raw, key))
    else {
      if (!validSetting(raw, suffix)) return fail(key)
      data[key] = raw
    }
  }
  if (!Object.keys(data).length) throw new MigrationError('invalid')
  return data
}

// Match startup values without importing composables that write to localStorage.
const defaultSettings: Record<string, unknown> = {
  lang: 'tw',
  'dark-mode': false,
  'library-display-mode': 'detailed',
  'experiment-database-display-mode': 'detailed',
  'frontier-studies-display-mode': 'detailed',
  'macro-settings': { secondsPerGather: 4, bufferSeconds: 2 },
  'solver-settings': { objectiveMode: 'expected', collectableRelicToolBonus: false },
  'frontier-settings': { enabled: false },
  'favorite-item-filters': { text: '', glvMin: '', glvMax: '', jobs: [], systems: [] },
  'solver-stats': { level: 100, gathering: 5345, perception: 5137, gp: 930 },
  'selected-food': { foodId: null, quality: 'hq' },
  'node-bonuses': { baseIntegrity: 4, gatheringCount: 0, yieldCount: 0, extraRate: 0 }
}

function equivalent(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((v, i) => equivalent(v, b[i]))
  if (!object(a) || !object(b)) return false
  return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(k => Object.hasOwn(b, k) && equivalent(a[k], b[k]))
}

function isDefaultSetting(key: string, raw: string): boolean {
  const suffix = key.slice(prefix.length)
  if (!Object.hasOwn(defaultSettings, suffix)) return false
  let value: unknown = raw
  try { value = JSON.parse(raw) } catch { /* Language and display modes are raw strings. */ }
  return equivalent(value, defaultSettings[suffix])
}

function isDefaultGear(profile: RecordValue): boolean {
  const job = profile.id === 'default-miner' ? 'miner' : profile.id === 'default-botanist' ? 'botanist' : null
  if (!job) return false
  const { createdAt, updatedAt, ...value } = profile
  return equivalent(value, {
    id: `default-${job}`, kind: `default-${job}`, name: '', jobs: [job],
    level: DEFAULT_PLAYER_STATS.level, gathering: DEFAULT_PLAYER_STATS.gathering,
    perception: DEFAULT_PLAYER_STATS.perception, currentGp: DEFAULT_PLAYER_STATS.gp,
    maxGp: DEFAULT_PLAYER_STATS.gp, food: { foodId: null, quality: 'hq' },
    collectableRelicToolBonus: false
  })
}

export function prepareImport(data: BackupData, storage: Storage, policy: ConflictPolicy) {
  const before: Record<string, string | null> = {}
  const writes: BackupData = {}
  const counts = { library: 0, experiments: 0, studies: 0, gear: 0, favorites: 0, settings: 0, conflicts: 0 }
  const incomingData = { ...data }
  // Convert legacy job stats before merging, since startup already seeds default profiles.
  const legacyKey = prefix + 'user-stats'
  if (incomingData[legacyKey]) {
    const legacy = json(incomingData[legacyKey], legacyKey) as RecordValue
    const gearKey = prefix + 'gear-profiles'
    const profiles = incomingData[gearKey] ? parseCollection(incomingData[gearKey], gearKey) : []
    for (const job of ['miner', 'botanist']) {
      const id = `default-${job}`
      if (profiles.some(p => p.id === id)) continue
      const s = legacy[job] as RecordValue
      profiles.push({ id, kind: id, name: '', jobs: [job], level: s.level, gathering: s.gathering, perception: s.perception, currentGp: s.gp, maxGp: s.gp, food: { foodId: null, quality: 'hq' }, collectableRelicToolBonus: false, createdAt: '1970-01-01T00:00:00.000Z', updatedAt: '1970-01-01T00:00:00.000Z' })
    }
    incomingData[gearKey] = JSON.stringify(profiles)
    delete incomingData[legacyKey]
  }
  for (const [key, raw] of Object.entries(incomingData)) {
    const existing = storage.getItem(key)
    before[key] = existing
    if (collections.some(suffix => key === prefix + suffix)) {
      const incoming = parseCollection(raw, key)
      const current = existing === null ? [] : parseCollection(existing, key)
      const group = { 'favorite-items': 'favorites', library: 'library', experiments: 'experiments', 'frontier-studies': 'studies', 'gear-profiles': 'gear' } as const
      counts[group[key.slice(prefix.length) as keyof typeof group]] = incoming.length
      const identity = (entry: RecordValue) => key === prefix + 'favorite-items' ? entry.itemId : entry.id
      const merged = new Map(current.map(note => [identity(note), note]))
      for (const note of incoming) {
        if (merged.has(identity(note)) && !(key === prefix + 'gear-profiles' && isDefaultGear(merged.get(identity(note))!))) {
          if (JSON.stringify(merged.get(identity(note))) !== JSON.stringify(note)) counts.conflicts++
          if (policy === 'keep') continue
        }
        merged.set(identity(note), note)
      }
      writes[key] = JSON.stringify([...merged.values()])
    } else {
      counts.settings++
      const hasCurrentValue = existing !== null && !isDefaultSetting(key, existing)
      if (hasCurrentValue && existing !== raw) counts.conflicts++
      writes[key] = policy === 'keep' && hasCurrentValue ? existing! : raw
    }
  }
  // Imported settings complete onboarding; privacy consent remains independent.
  const initialized = prefix + 'initialized'
  before[initialized] = storage.getItem(initialized)
  writes[initialized] = 'true'
  before[MIGRATION_DISMISSED_KEY] = storage.getItem(MIGRATION_DISMISSED_KEY)
  writes[MIGRATION_DISMISSED_KEY] = 'true'
  return { before, writes, counts }
}

export function commitImport(plan: ReturnType<typeof prepareImport>, storage: Storage) {
  for (const [key, raw] of Object.entries(plan.before)) {
    const current = storage.getItem(key)
    // The reminder checkbox can change while the import preview is open.
    if (key === MIGRATION_DISMISSED_KEY) plan.before[key] = current
    else if (current !== raw) throw new MigrationError('changed')
  }
  const written: string[] = []
  try {
    for (const [key, raw] of Object.entries(plan.writes)) {
      storage.setItem(key, raw)
      written.push(key)
    }
  } catch {
    let rollbackFailed = false
    for (const key of written.reverse()) {
      try {
        const raw = plan.before[key]
        if (raw === null) storage.removeItem(key)
        else storage.setItem(key, raw!)
      } catch { rollbackFailed = true }
    }
    throw new MigrationError(rollbackFailed ? 'rollback' : 'storage')
  }
}
