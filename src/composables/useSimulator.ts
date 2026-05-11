import { ref } from 'vue';
import type { SimulationResponse } from '../types/game';

// Persistent draft state for Simulator (now just reactive state)
const primaryRotation = ref<string[]>([]);
const revisitRotation = ref<string[]>([]);
const simulatorAnalysis = ref<SimulationResponse | null>(null);

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
