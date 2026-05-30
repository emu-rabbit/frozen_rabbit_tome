import type { FrontierCollectableActionKind } from './frontierCollectableTypes';

interface FrontierCollectableActionDefinition {
  kind: FrontierCollectableActionKind;
  gpCost: number;
  minLevel: number;
}

export const FRONTIER_COLLECTABLE_ACTION_DEFINITIONS: Record<FrontierCollectableActionKind, FrontierCollectableActionDefinition> = {
  collect: { kind: 'collect', gpCost: 0, minLevel: 50 },
  scour: { kind: 'scour', gpCost: 0, minLevel: 50 },
  brazen: { kind: 'brazen', gpCost: 0, minLevel: 50 },
  meticulous: { kind: 'meticulous', gpCost: 0, minLevel: 50 },
  scrutiny: { kind: 'scrutiny', gpCost: 200, minLevel: 50 },
  collectorsFocus: { kind: 'collectorsFocus', gpCost: 100, minLevel: 85 },
  primingTouch: { kind: 'primingTouch', gpCost: 100, minLevel: 95 },
  successI: { kind: 'successI', gpCost: 50, minLevel: 4 },
  successII: { kind: 'successII', gpCost: 100, minLevel: 5 },
  successIII: { kind: 'successIII', gpCost: 250, minLevel: 10 },
  nextCollectSuccess: { kind: 'nextCollectSuccess', gpCost: 50, minLevel: 23 },
  restoreIntegrity: { kind: 'restoreIntegrity', gpCost: 300, minLevel: 25 },
  wiseToTheWorld: { kind: 'wiseToTheWorld', gpCost: 0, minLevel: 90 }
};

export const frontierCollectableActionKinds = Object.keys(
  FRONTIER_COLLECTABLE_ACTION_DEFINITIONS
) as FrontierCollectableActionKind[];
