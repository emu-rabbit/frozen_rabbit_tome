import { computed } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import type { FoodSelection, GearStatProfile, GatheringJob, PlayerStats, UserStats } from '../types/game';

const STORAGE_KEY = 'frozen-rabbit-tome-gear-profiles';
const LEGACY_USER_STATS_KEY = 'frozen-rabbit-tome-user-stats';
const DEFAULT_PROFILE_IDS = ['default-miner', 'default-botanist'] as const;

const DEFAULT_STATS: PlayerStats = {
  level: 100,
  gathering: 5345,
  perception: 5173,
  gp: 930
};

const NO_FOOD: FoodSelection = {
  foodId: null,
  quality: 'hq'
};

function nowIso() {
  return new Date().toISOString();
}

function newId(prefix = 'gear') {
  const randomId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${randomId}`;
}

function cloneFood(food: FoodSelection): FoodSelection {
  return {
    foodId: typeof food.foodId === 'number' ? food.foodId : null,
    quality: food.quality === 'nq' ? 'nq' : 'hq'
  };
}

function normalizeStats(stats?: Partial<PlayerStats>): PlayerStats {
  return {
    level: clampInt(stats?.level, 1, 100, DEFAULT_STATS.level),
    gathering: clampInt(stats?.gathering, 0, 99999, DEFAULT_STATS.gathering),
    perception: clampInt(stats?.perception, 0, 99999, DEFAULT_STATS.perception),
    gp: clampInt(stats?.gp, 0, 99999, DEFAULT_STATS.gp)
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  if (typeof value !== 'number' || Number.isNaN(value)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function createDefaultProfile(job: GatheringJob, stats: PlayerStats = DEFAULT_STATS): GearStatProfile {
  const timestamp = nowIso();
  return {
    id: job === 'miner' ? 'default-miner' : 'default-botanist',
    kind: job === 'miner' ? 'default-miner' : 'default-botanist',
    name: '',
    jobs: [job],
    level: stats.level,
    gathering: stats.gathering,
    perception: stats.perception,
    currentGp: stats.gp,
    maxGp: stats.gp,
    food: { ...NO_FOOD },
    collectableRelicToolBonus: false,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

function readLegacyStats(): Partial<UserStats> | null {
  if (typeof window === 'undefined') return null;

  const raw = window.localStorage.getItem(LEGACY_USER_STATS_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as Partial<UserStats>;
  } catch {
    return null;
  }
}

function normalizeProfile(profile: Partial<GearStatProfile>, fallbackJob: GatheringJob = 'miner'): GearStatProfile {
  const timestamp = nowIso();
  const kind = profile.kind === 'default-miner' || profile.kind === 'default-botanist'
    ? profile.kind
    : 'custom';
  const lockedJob = kind === 'default-miner' ? 'miner' : kind === 'default-botanist' ? 'botanist' : null;
  const jobs: GatheringJob[] = lockedJob
    ? [lockedJob]
    : Array.isArray(profile.jobs)
      ? profile.jobs.filter((job): job is GatheringJob => job === 'miner' || job === 'botanist')
      : [fallbackJob];
  const uniqueJobs: GatheringJob[] = [...new Set(jobs)];
  const maxGp = clampInt(profile.maxGp, 0, 99999, DEFAULT_STATS.gp);

  return {
    id: profile.id || newId(),
    kind,
    name: typeof profile.name === 'string' ? profile.name : '',
    jobs: uniqueJobs.length > 0 ? uniqueJobs : [fallbackJob],
    level: clampInt(profile.level, 1, 100, DEFAULT_STATS.level),
    gathering: clampInt(profile.gathering, 0, 99999, DEFAULT_STATS.gathering),
    perception: clampInt(profile.perception, 0, 99999, DEFAULT_STATS.perception),
    currentGp: clampInt(profile.currentGp, 0, 99999, maxGp),
    maxGp,
    food: cloneFood(profile.food ?? NO_FOOD),
    collectableRelicToolBonus: !!profile.collectableRelicToolBonus,
    createdAt: profile.createdAt || timestamp,
    updatedAt: profile.updatedAt || timestamp
  };
}

function seedProfiles(): GearStatProfile[] {
  const legacy = readLegacyStats();
  const minerStats = normalizeStats(legacy?.miner);
  const botanistStats = normalizeStats(legacy?.botanist);

  if (typeof window !== 'undefined' && legacy) {
    window.localStorage.removeItem(LEGACY_USER_STATS_KEY);
  }

  return [
    createDefaultProfile('miner', minerStats),
    createDefaultProfile('botanist', botanistStats)
  ];
}

const gearProfiles = useLocalStorage<GearStatProfile[]>(STORAGE_KEY, seedProfiles(), {
  serializer: {
    read: (raw) => {
      if (!raw) return seedProfiles();
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.map((profile) => normalizeProfile(profile)) : seedProfiles();
      } catch {
        return seedProfiles();
      }
    },
    write: (value) => JSON.stringify(value)
  }
});

function ensureDefaultProfiles() {
  const existingIds = new Set(gearProfiles.value.map((profile) => profile.id));
  const additions: GearStatProfile[] = [];
  if (!existingIds.has('default-miner')) additions.push(createDefaultProfile('miner'));
  if (!existingIds.has('default-botanist')) additions.push(createDefaultProfile('botanist'));
  if (additions.length) gearProfiles.value = [...additions, ...gearProfiles.value];
}

ensureDefaultProfiles();

export function profileToStats(profile: GearStatProfile): PlayerStats {
  return {
    level: profile.level,
    gathering: profile.gathering,
    perception: profile.perception,
    gp: profile.maxGp
  };
}

export function isDefaultGearProfile(profile: GearStatProfile) {
  return DEFAULT_PROFILE_IDS.includes(profile.id as typeof DEFAULT_PROFILE_IDS[number]);
}

export function useGearProfiles() {
  const orderedProfiles = computed(() => {
    const defaults = DEFAULT_PROFILE_IDS
      .map((id) => gearProfiles.value.find((profile) => profile.id === id))
      .filter((profile): profile is GearStatProfile => !!profile);
    const custom = gearProfiles.value
      .filter((profile) => !DEFAULT_PROFILE_IDS.includes(profile.id as typeof DEFAULT_PROFILE_IDS[number]));
    return [...defaults, ...custom];
  });

  function createProfile(input: Omit<GearStatProfile, 'id' | 'kind' | 'createdAt' | 'updatedAt'>) {
    const timestamp = nowIso();
    const profile = normalizeProfile({
      ...input,
      id: newId(),
      kind: 'custom',
      createdAt: timestamp,
      updatedAt: timestamp
    });
    gearProfiles.value = [...gearProfiles.value, profile];
    return profile;
  }

  function updateProfile(id: string, patch: Partial<GearStatProfile>) {
    gearProfiles.value = gearProfiles.value.map((profile) => {
      if (profile.id !== id) return profile;
      const next = normalizeProfile({
        ...profile,
        ...patch,
        kind: profile.kind,
        jobs: isDefaultGearProfile(profile) ? profile.jobs : patch.jobs ?? profile.jobs,
        updatedAt: nowIso()
      }, profile.jobs[0] ?? 'miner');
      return next;
    });
  }

  function deleteProfile(id: string) {
    if (DEFAULT_PROFILE_IDS.includes(id as typeof DEFAULT_PROFILE_IDS[number])) return;
    gearProfiles.value = gearProfiles.value.filter((profile) => profile.id !== id);
  }

  function defaultProfileForJob(job: GatheringJob) {
    return orderedProfiles.value.find((profile) => profile.id === (job === 'miner' ? 'default-miner' : 'default-botanist'))
      ?? createDefaultProfile(job);
  }

  function profilesForJob(job: GatheringJob) {
    return orderedProfiles.value.filter((profile) => profile.jobs.includes(job));
  }

  return {
    gearProfiles,
    orderedProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    defaultProfileForJob,
    profilesForJob
  };
}
