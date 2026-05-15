// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('useGearProfiles', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('會把舊版職業數值搬移成預設設定檔並刪除舊 key', async () => {
    localStorage.setItem('frozen-rabbit-tome-user-stats', JSON.stringify({
      miner: { level: 99, gathering: 5000, perception: 4900, gp: 900 },
      botanist: { level: 100, gathering: 5300, perception: 5100, gp: 930 }
    }));

    const { useGearProfiles } = await import('./useGearProfiles');
    const { orderedProfiles } = useGearProfiles();

    expect(localStorage.getItem('frozen-rabbit-tome-user-stats')).toBeNull();
    expect(orderedProfiles.value[0]).toMatchObject({
      id: 'default-miner',
      kind: 'default-miner',
      jobs: ['miner'],
      level: 99,
      gathering: 5000,
      perception: 4900,
      currentGp: 900,
      maxGp: 900,
      food: { foodId: null, quality: 'hq' },
      collectableRelicToolBonus: false
    });
    expect(orderedProfiles.value[1]).toMatchObject({
      id: 'default-botanist',
      kind: 'default-botanist',
      jobs: ['botanist'],
      level: 100,
      gathering: 5300,
      perception: 5100,
      currentGp: 930,
      maxGp: 930
    });
  });

  it('預設設定檔不可刪除，且職業類別會保持鎖定', async () => {
    const { useGearProfiles } = await import('./useGearProfiles');
    const profiles = useGearProfiles();

    profiles.updateProfile('default-miner', { jobs: ['botanist'] });
    profiles.deleteProfile('default-miner');

    const miner = profiles.orderedProfiles.value.find((profile) => profile.id === 'default-miner');
    expect(miner).toBeTruthy();
    expect(miner?.jobs).toEqual(['miner']);
  });

  it('自訂設定檔可以作為採掘師與園藝師共用設定檔', async () => {
    const { useGearProfiles } = await import('./useGearProfiles');
    const profiles = useGearProfiles();

    const created = profiles.createProfile({
      name: 'Shared',
      jobs: ['miner', 'botanist'],
      level: 100,
      gathering: 5400,
      perception: 5200,
      currentGp: 950,
      maxGp: 930,
      food: { foodId: null, quality: 'hq' },
      collectableRelicToolBonus: true
    });

    expect(profiles.profilesForJob('miner')).toContainEqual(created);
    expect(profiles.profilesForJob('botanist')).toContainEqual(created);
  });
});
