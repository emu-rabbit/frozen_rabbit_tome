import type {
  FoodSelection,
  GatherableItem,
  NodeBonuses,
  PlayerStats,
  SolverResponse,
  SolverWorkerErrorResponse
} from '../types/game';
import type {
  CollectablePolicyNode,
  CollectableSolverResult,
  CollectableWorkerErrorResponse
} from '../types/collectable';
import type { CollectableStrategyNode } from '../utils/collectableStrategyTree';

const CONSENT_KEY = 'frozen-rabbit-tome-analytics-consent';
const DEFAULT_MEASUREMENT_ID = 'G-MG8G7L1DNT';
const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || DEFAULT_MEASUREMENT_ID;
const SCRIPT_ID = 'frozen-rabbit-tome-google-analytics';
const GA_ORIGIN = window.location.origin;

let hasTrackedAnalyticsReady = false;
let hasDeniedAnalyticsThisSession = false;
let hasConfiguredGoogleAnalytics = false;
let hasTrackedInitialPageView = false;

type AnalyticsLanguageContext = {
  app_language?: string;
  browser_language?: string;
  browser_languages?: string;
};

type AnalyticsThemeContext = {
  app_theme_mode?: 'light' | 'dark';
};

type AnalyticsTomeSettingsContext = {
  solver_objective_mode?: string;
  gear_profile_count?: number;
  macro_seconds_setting?: string;
  frontier_settings_enabled?: boolean;
};

let languageContext: AnalyticsLanguageContext = {};
let themeContext: AnalyticsThemeContext = {};
let tomeSettingsContext: AnalyticsTomeSettingsContext = {};

export type AnalyticsConsent = 'granted' | 'denied';

type AnalyticsEventParamValue = string | number | boolean | undefined | null;
type AnalyticsEventParams = Record<string, AnalyticsEventParamValue>;

type GatheringRunAnalyticsInput = {
  item?: GatherableItem | null;
  stats?: PlayerStats | null;
  maxGp?: number | null;
  temporaryGp?: number | null;
  selectedFood?: FoodSelection | null;
  nodeBonuses?: NodeBonuses | null;
  hasRelicToolBonus?: boolean | null;
};

const ROUTE_NAME_BY_PATH: Record<string, string> = {
  '/': 'CreateGuide',
  '/solver': 'Solver',
  '/favorite-items': 'FavoriteItems',
  '/library': 'TomeLibrary',
  '/experiment': 'CreateExperiment',
  '/simulator': 'Simulator',
  '/experiment-database': 'ExperimentDatabase',
  '/frontier': 'FrontierCollectable',
  '/frontier/collectable': 'FrontierCollectable',
  '/frontier/studies': 'FrontierStudies',
  '/faq': 'FAQ',
  '/changelog': 'Changelog',
  '/settings': 'Settings',
  '/settings/gear-profiles': 'GearProfiles'
};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

export const isAnalyticsAvailable = () => Boolean(import.meta.env.PROD && MEASUREMENT_ID);

export const getAnalyticsConsent = (): AnalyticsConsent | null => {
  const stored = window.localStorage.getItem(CONSENT_KEY);
  if (stored === 'granted') return 'granted';

  if (stored === 'denied') {
    window.localStorage.removeItem(CONSENT_KEY);
  }

  return hasDeniedAnalyticsThisSession ? 'denied' : null;
};

export const setAnalyticsConsent = (consent: AnalyticsConsent) => {
  loadGoogleAnalytics();

  if (consent === 'granted') {
    hasDeniedAnalyticsThisSession = false;
    window.localStorage.setItem(CONSENT_KEY, consent);
    updateGoogleConsent('granted');
    window.gtag?.('set', 'user_properties', getUserProperties());
    trackInitialPageView();
    trackAnalyticsReady();
    return;
  }

  hasDeniedAnalyticsThisSession = true;
  window.localStorage.removeItem(CONSENT_KEY);
  updateGoogleConsent('denied');
};

export const initializeAnalytics = () => {
  loadGoogleAnalytics();

  if (getAnalyticsConsent() === 'granted') {
    updateGoogleConsent('granted');
    trackInitialPageView();
    trackAnalyticsReady();
  }
};

export const setAnalyticsLanguage = (appLanguage: string) => {
  languageContext = {
    app_language: appLanguage,
    browser_language: window.navigator.language,
    browser_languages: window.navigator.languages?.join(',') || window.navigator.language,
  };

  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return;

  window.gtag('set', 'user_properties', getUserProperties());
  window.gtag('event', 'language_context_updated', {
    send_to: MEASUREMENT_ID,
    ...languageContext,
  });
};

export const setAnalyticsThemeMode = (isDarkMode: boolean) => {
  themeContext = {
    app_theme_mode: isDarkMode ? 'dark' : 'light',
  };

  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return;

  window.gtag('set', 'user_properties', getUserProperties());
  window.gtag('event', 'theme_context_updated', {
    send_to: MEASUREMENT_ID,
    ...themeContext,
  });
};

export const setAnalyticsTomeSettings = (context: {
  objectiveMode: string;
  gearProfileCount: number;
  macroSecondsPerGather: number;
  macroBufferSeconds: number;
  frontierEnabled: boolean;
}) => {
  tomeSettingsContext = {
    solver_objective_mode: context.objectiveMode,
    gear_profile_count: context.gearProfileCount,
    macro_seconds_setting: `${context.macroSecondsPerGather}+${context.macroBufferSeconds}`,
    frontier_settings_enabled: context.frontierEnabled,
  };

  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return;

  window.gtag('set', 'user_properties', getUserProperties());
  trackEvent('tome_settings_context_updated', tomeSettingsContext);
};

const getUserProperties = () => ({
  ...languageContext,
  ...themeContext,
  ...tomeSettingsContext,
});

const getCommonEventParams = () => ({
  ...getUserProperties(),
});

export const getRouteNameFromPagePath = (pagePath: string) => {
  const hashRoute = pagePath.split('#')[1]?.split('?')[0] ?? '/';
  const normalizedPath = hashRoute.startsWith('/') ? hashRoute : `/${hashRoute}`;
  return ROUTE_NAME_BY_PATH[normalizedPath] ?? normalizedPath.replace(/^\//, '') ?? 'CreateGuide';
};

export const trackPageView = (
  pagePath = window.location.pathname + window.location.hash,
  routeName = getRouteNameFromPagePath(pagePath)
) => {
  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return;

  window.gtag('event', 'page_view', {
    send_to: MEASUREMENT_ID,
    ...getCommonEventParams(),
    route_name: routeName,
    page_title: document.title,
    page_location: `${GA_ORIGIN}${pagePath}`,
    page_path: pagePath,
  });
};

const trackInitialPageView = () => {
  if (hasTrackedInitialPageView || !isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return;

  hasTrackedInitialPageView = true;
  trackPageView();
};

export const trackAnalyticsReady = () => {
  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag || hasTrackedAnalyticsReady) return;

  hasTrackedAnalyticsReady = true;
  window.gtag('event', 'analytics_ready', {
    send_to: MEASUREMENT_ID,
    ...getCommonEventParams(),
    route_name: getRouteNameFromPagePath(window.location.pathname + window.location.hash),
    page_title: document.title,
    page_location: window.location.href,
    page_path: window.location.pathname + window.location.hash,
  });
};

export const trackRouteChange = (routeName: string) => {
  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return;

  const pagePath = window.location.pathname + window.location.hash;
  trackPageView(pagePath, routeName);
  window.gtag('event', 'route_change', {
    send_to: MEASUREMENT_ID,
    ...getCommonEventParams(),
    route_name: routeName,
    page_title: document.title,
    page_location: `${GA_ORIGIN}${pagePath}`,
    page_path: pagePath,
  });
};

export const getFixedWidthBucket = (value: number, width: number) => {
  if (!Number.isFinite(value)) return undefined;
  if (value <= 0) return '0';

  const lower = Math.floor((value - 1) / width) * width + 1;
  const upper = lower + width - 1;
  return `${lower}~${upper}`;
};

export const getDurationBucket = (durationMs: number) => {
  if (!Number.isFinite(durationMs)) return undefined;
  if (durationMs < 10) return '< 10 ms';
  if (durationMs <= 100) return '11-100 ms';
  if (durationMs <= 1000) return '101 ms-1 s';
  if (durationMs <= 5000) return '1-5 s';
  if (durationMs <= 10000) return '5-10 s';
  if (durationMs <= 30000) return '10-30 s';
  if (durationMs <= 60000) return '30-60 s';
  return '60 s+';
};

export const getPercentageBucket = (percent: number) => {
  if (!Number.isFinite(percent)) return undefined;
  if (percent <= 0) return '0%';
  if (percent >= 100) return '100%';

  const lower = Math.floor(percent / 10) * 10;
  const upper = Math.min(100, lower + 10);
  return `${lower}-${upper}%`;
};

export const countCollectablePolicyNodes = (root?: CollectablePolicyNode | null) => {
  if (!root) return undefined;

  const visited = new Set<string>();
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || visited.has(node.id)) continue;

    visited.add(node.id);
    node.branches.forEach((branch) => {
      if (branch.next) stack.push(branch.next);
    });
  }

  return visited.size;
};

export const countCollectableStrategyNodes = (root?: CollectableStrategyNode | null) => {
  if (!root) return undefined;

  const visited = new Set<string>();
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || visited.has(node.id)) continue;

    visited.add(node.id);
    node.branches.forEach((branch) => {
      if (branch.child) stack.push(branch.child);
    });
  }

  return visited.size;
};

export const trackRegularSolverCompleted = (context: {
  input: GatheringRunAnalyticsInput;
  result: SolverResponse;
}) => {
  const search = context.result.debug?.plans.find((plan) => plan.kind === 'primary')?.search
    ?? context.result.debug?.plans[0]?.search;

  trackEvent('regular_solver_completed', {
    ...buildGatheringRunParams(context.input),
    ...buildSearchParams(search, context.result.calculationTime),
    regular_action_count: context.result.bestRotation.length,
  });
};

export const trackCollectableSolverCompleted = (context: {
  input: GatheringRunAnalyticsInput;
  result: CollectableSolverResult;
}) => {
  const primaryPolicy = context.result.policyPlans.find((plan) => plan.kind === 'primary')?.policy
    ?? context.result.policy;
  const search = context.result.debug?.plans.find((plan) => plan.kind === 'primary')?.search
    ?? context.result.debug?.plans[0]?.search;

  trackEvent('collectable_solver_completed', {
    ...buildGatheringRunParams(context.input),
    ...buildSearchParams(search, context.result.calculationTime),
    collectable_node_count: countCollectablePolicyNodes(primaryPolicy),
  });
};

export const trackRegularAnalyzerCompleted = (context: {
  input: GatheringRunAnalyticsInput;
  actionCount: number;
  calculationTime?: number;
}) => {
  trackEvent('regular_analyzer_completed', {
    ...buildGatheringRunParams(context.input),
    ...buildDurationParams(context.calculationTime),
    regular_action_count: context.actionCount,
  });
};

export const trackCollectableAnalyzerCompleted = (context: {
  input: GatheringRunAnalyticsInput;
  treeRoot?: CollectableStrategyNode | null;
  strategyCount: number;
  calculationTime?: number;
  isFrontierMode?: boolean;
}) => {
  trackEvent('collectable_analyzer_completed', {
    ...buildGatheringRunParams(context.input),
    ...buildDurationParams(context.calculationTime),
    collectable_node_count: countCollectableStrategyNodes(context.treeRoot),
    strategy_count: context.strategyCount,
    is_frontier_mode: context.isFrontierMode,
  });
};

export const trackRegularSolverFailed = (context: {
  input: GatheringRunAnalyticsInput;
  error: SolverWorkerErrorResponse | { errorType: string; memoCapacityPower?: number };
}) => {
  trackEvent('regular_solver_failed', {
    ...buildGatheringRunParams(context.input),
    failure_reason: context.error.errorType,
    ...buildMemoParams(context.error.memoCapacityPower),
  });
};

export const trackCollectableSolverFailed = (context: {
  input: GatheringRunAnalyticsInput;
  error: CollectableWorkerErrorResponse | { errorType: string; memoCapacityPower?: number };
}) => {
  trackEvent('collectable_solver_failed', {
    ...buildGatheringRunParams(context.input),
    failure_reason: context.error.errorType,
    ...buildMemoParams(context.error.memoCapacityPower),
  });
};

export const trackFavoriteItemAdded = (item: GatherableItem) => {
  trackEvent('favorite_item_added', {
    item_id: item.itemId,
    item_glv: item.glv,
    item_kind: item.isCollectable ? 'collectable' : item.isCrystalGathering ? 'crystal' : 'regular',
  });
};

export const trackTomeLibraryEntryAdded = (context: {
  itemId: number;
  kind: 'regular' | 'collectable';
  source?: 'solver' | 'import';
}) => {
  trackEvent('tome_library_entry_added', {
    item_id: context.itemId,
    entry_kind: context.kind,
    entry_source: context.source ?? 'solver',
  });
};

export const trackExperimentDatabaseEntryAdded = (context: {
  itemId: number;
  kind: 'regular' | 'collectable';
  source?: 'analysis' | 'import';
}) => {
  trackEvent('experiment_database_entry_added', {
    item_id: context.itemId,
    entry_kind: context.kind,
    entry_source: context.source ?? 'analysis',
  });
};

export const trackMacroCopied = (context: {
  success: boolean;
  lineCount: number;
  partIndex: number;
  partCount: number;
  hasGroups: boolean;
  groupKey?: string;
}) => {
  trackEvent('macro_copied', {
    copy_success: context.success,
    macro_line_count: context.lineCount,
    macro_part_index: context.partIndex,
    macro_part_count: context.partCount,
    macro_has_groups: context.hasGroups,
    macro_group_key: context.groupKey,
  });
};

export const trackDecisionTreeHtmlExported = (context: {
  fileName?: string;
}) => {
  trackEvent('decision_tree_html_exported', {
    file_name: context.fileName,
  });
};

export const trackJsonDownloaded = (context: {
  scenario?: string;
  fileName?: string;
}) => {
  trackEvent('json_downloaded', {
    export_scenario: context.scenario,
    file_name: context.fileName,
  });
};

function buildGatheringRunParams(input: GatheringRunAnalyticsInput): AnalyticsEventParams {
  const stats = input.stats ?? undefined;
  const item = input.item ?? undefined;
  const nodeBonuses = input.nodeBonuses ?? undefined;
  const maxGp = input.maxGp ?? stats?.gp;
  const currentGp = normalizeNumber(input.temporaryGp);
  const food = input.selectedFood ?? undefined;
  const foodId = food?.foodId ?? null;

  return {
    item_id: item?.itemId,
    item_glv: item?.glv,
    player_level: stats?.level,
    player_level_bucket: stats ? getFixedWidthBucket(stats.level, 10) : undefined,
    player_gathering: stats?.gathering,
    player_gathering_bucket: stats ? getFixedWidthBucket(stats.gathering, 1000) : undefined,
    player_perception: stats?.perception,
    player_perception_bucket: stats ? getFixedWidthBucket(stats.perception, 1000) : undefined,
    current_gp: currentGp,
    current_gp_bucket: currentGp !== undefined ? getFixedWidthBucket(currentGp, 100) : undefined,
    is_full_gp: currentGp !== undefined && maxGp !== undefined ? currentGp >= maxGp : undefined,
    food_selection: foodId ? `${foodId}:${food?.quality ?? 'hq'}` : 'none',
    food_id: foodId ?? undefined,
    food_quality: foodId ? food?.quality ?? 'hq' : 'none',
    node_base_integrity: nodeBonuses?.baseIntegrity,
    node_gathering_count_bonus: nodeBonuses?.gatheringCount,
    node_yield_count_bonus: nodeBonuses?.yieldCount,
    node_extra_rate_bonus: nodeBonuses?.extraRate,
    has_relic_tool_bonus: input.hasRelicToolBonus ?? undefined,
  };
}

function buildSearchParams(
  search: {
    workerCalculationTime?: number;
    memoHitRate?: number;
    memoCapacityPower?: number;
  } | undefined,
  fallbackCalculationTime?: number
): AnalyticsEventParams {
  const duration = search?.workerCalculationTime ?? fallbackCalculationTime;

  return {
    ...buildDurationParams(duration),
    cache_hit_rate: search?.memoHitRate,
    cache_hit_rate_bucket: search?.memoHitRate !== undefined ? getPercentageBucket(search.memoHitRate) : undefined,
    ...buildMemoParams(search?.memoCapacityPower),
  };
}

function buildDurationParams(durationMs?: number): AnalyticsEventParams {
  return {
    calculation_time_ms: durationMs,
    calculation_time_bucket: durationMs !== undefined ? getDurationBucket(durationMs) : undefined,
  };
}

function buildMemoParams(memoCapacityPower?: number): AnalyticsEventParams {
  return {
    memo_table_power: memoCapacityPower,
    memo_table_size: memoCapacityPower !== undefined ? `2^${memoCapacityPower}` : undefined,
  };
}

function normalizeNumber(value?: number | null) {
  return Number.isFinite(value) ? Number(value) : undefined;
}

function trackEvent(eventName: string, params: AnalyticsEventParams = {}) {
  if (!isAnalyticsAvailable() || getAnalyticsConsent() !== 'granted' || !window.gtag) return;

  window.gtag('event', eventName, {
    send_to: MEASUREMENT_ID,
    ...getCommonEventParams(),
    ...removeEmptyParams(params),
  });
}

function removeEmptyParams(params: AnalyticsEventParams) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null)
  );
}

const loadGoogleAnalytics = () => {
  if (!isAnalyticsAvailable()) return;

  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };
  }

  if (!hasConfiguredGoogleAnalytics) {
    hasConfiguredGoogleAnalytics = true;
    window.gtag('consent', 'default', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied',
      wait_for_update: 500,
    });
    window.gtag('js', new Date());
    window.gtag('config', MEASUREMENT_ID, {
      send_page_view: false,
    });
    window.gtag('set', 'user_properties', getUserProperties());
  }

  if (document.getElementById(SCRIPT_ID)) {
    return;
  }

  const script = document.createElement('script');
  script.id = SCRIPT_ID;
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  script.addEventListener('load', () => {
    if (getAnalyticsConsent() !== 'granted') return;

    trackInitialPageView();
    trackAnalyticsReady();
  }, { once: true });
  document.head.appendChild(script);
};

const updateGoogleConsent = (analyticsConsent: AnalyticsConsent) => {
  if (!isAnalyticsAvailable() || !window.gtag) return;

  window.gtag('consent', 'update', {
    analytics_storage: analyticsConsent,
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });
};
