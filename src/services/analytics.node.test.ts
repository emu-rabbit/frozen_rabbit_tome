import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('analytics in node environment', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  it('stays unavailable and no-ops when imported without window', async () => {
    vi.stubEnv('PROD', true);
    vi.stubEnv('VITE_GA_MEASUREMENT_ID', 'G-TEST123');

    const {
      getAnalyticsConsent,
      initializeAnalytics,
      isAnalyticsAvailable,
      setAnalyticsConsent,
      setAnalyticsLanguage,
      trackJsonDownloaded,
    } = await import('./analytics');

    expect(isAnalyticsAvailable()).toBe(false);
    expect(getAnalyticsConsent()).toBeNull();
    expect(() => initializeAnalytics()).not.toThrow();
    expect(() => setAnalyticsConsent('granted')).not.toThrow();
    expect(() => setAnalyticsLanguage('tw')).not.toThrow();
    expect(() => trackJsonDownloaded({ scenario: 'tome.regular', fileName: 'export.json' })).not.toThrow();
  });
});
