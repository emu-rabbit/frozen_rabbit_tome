import { describe, expect, it } from 'vitest';
import { simulateGatheringRotation, validateSimulatorRotation } from './rotationSimulator';
import type { SimulationRequest } from './rotationSimulator';

const baseRequest: SimulationRequest = {
  stats: {
    level: 100,
    gathering: 5345,
    perception: 5173,
    gp: 930
  },
  baseValues: {
    Gathering: 4000,
    Perception: 4000
  },
  itemLevel: 100,
  nodeBonuses: {
    baseIntegrity: 4,
    gatheringCount: 0,
    yieldCount: 0,
    extraRate: 0
  },
  temporaryGp: 930,
  jobType: 'miner',
  isTimedNode: false,
  primaryRotation: [],
  revisitRotation: []
};

describe('rotationSimulator', () => {
  it('simulates a user rotation without requiring integrity to reach zero', () => {
    const result = simulateGatheringRotation({
      ...baseRequest,
      primaryRotation: ['採集']
    });

    expect(result.primary.finalIntegrityRange).toEqual([3, 3]);
    expect(result.primary.minYield).toBe(1);
    expect(result.primary.maxYield).toBe(2);
    expect(result.primary.expectedYield).toBeGreaterThan(1);
  });

  it('adds revisit outcomes when the user supplies a revisit rotation', () => {
    const result = simulateGatheringRotation({
      ...baseRequest,
      primaryRotation: ['採集', '採集', '採集', '採集'],
      revisitRotation: ['採集']
    });

    expect(result.revisitChance).toBe(0.05);
    expect(result.revisit?.rotation).toEqual(['採集']);
    expect(result.total.expectedYield).toBeGreaterThan(result.primary.expectedYield);
  });

  it('branches Solid Reason and Wise to the World as conditional durability recovery', () => {
    const result = simulateGatheringRotation({
      ...baseRequest,
      nodeBonuses: {
        ...baseRequest.nodeBonuses,
        baseIntegrity: 1
      },
      primaryRotation: ['採集', '石工之理', '採集', '理智同興', '採集']
    });

    expect(result.primary.finalIntegrityRange[0]).toBeLessThanOrEqual(0);
    expect(result.primary.finalIntegrityRange[1]).toBe(0);
    expect(result.primary.outcomeDistribution.length).toBeGreaterThan(1);
  });

  it('allows Wise to the World after Solid Reason when durability is not full', () => {
    const request: SimulationRequest = {
      ...baseRequest,
      nodeBonuses: {
        ...baseRequest.nodeBonuses,
        baseIntegrity: 3
      },
      primaryRotation: ['採集', '採集', '石工之理', '理智同興']
    };

    const validation = validateSimulatorRotation(request, request.primaryRotation);
    const result = simulateGatheringRotation(request);

    expect(validation.isValid).toBe(true);
    expect(result.primary.finalIntegrityRange).toEqual([2, 3]);
  });

  it('reports invalid rotation steps when stats make a skill impossible', () => {
    const request: SimulationRequest = {
      ...baseRequest,
      stats: {
        ...baseRequest.stats,
        gp: 100
      },
      temporaryGp: 100,
      primaryRotation: ['莫非王土II']
    };

    expect(validateSimulatorRotation(request, request.primaryRotation).invalidIndexes).toEqual([0]);
  });
});
