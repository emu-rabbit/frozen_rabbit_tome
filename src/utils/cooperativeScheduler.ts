export class CooperativeAbortError extends Error {
  constructor() {
    super('Cooperative work was aborted.');
    this.name = 'CooperativeAbortError';
  }
}

export interface CooperativeSchedulerOptions {
  signal?: AbortSignal;
  yieldEvery?: number;
}

export interface CooperativeScheduler {
  step: () => Promise<void>;
  yieldNow: () => Promise<void>;
}

export function createCooperativeScheduler(options: CooperativeSchedulerOptions = {}): CooperativeScheduler {
  const yieldEvery = Math.max(1, Math.floor(options.yieldEvery ?? 180));
  let steps = 0;

  async function yieldNow() {
    throwIfAborted(options.signal);
    await yieldToEventQueue();
    throwIfAborted(options.signal);
  }

  return {
    async step() {
      throwIfAborted(options.signal);
      steps += 1;
      if (steps % yieldEvery !== 0) return;
      await yieldNow();
    },
    yieldNow
  };
}

export function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new CooperativeAbortError();
}

export function isCooperativeAbort(error: unknown) {
  return error instanceof CooperativeAbortError
    || (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError');
}

export function yieldToEventQueue() {
  return new Promise<void>((resolve) => {
    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      window.requestAnimationFrame(() => {
        window.setTimeout(resolve, 0);
      });
      return;
    }

    setTimeout(resolve, 0);
  });
}
