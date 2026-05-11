import { ref } from 'vue';
import { useLocalStorage } from '@vueuse/core';
import type { SimulationResponse } from '../types/game';

// Persistent draft state for Simulator
const primaryRotation = useLocalStorage<string[]>('frozen-rabbit-tome-simulator-primary', []);
const revisitRotation = useLocalStorage<string[]>('frozen-rabbit-tome-simulator-revisit', []);
const simulatorAnalysis = useLocalStorage<SimulationResponse | null>('frozen-rabbit-tome-simulator-analysis', null);

export function useSimulator() {
  const reset = () => {
    primaryRotation.value = [];
    revisitRotation.value = [];
    simulatorAnalysis.value = null;
  };

  return {
    primaryRotation,
    revisitRotation,
    simulatorAnalysis,
    reset
  };
}
