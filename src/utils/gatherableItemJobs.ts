import type { GatherableItem, GatheringJob } from '../types/game';

export const GATHERING_JOBS: GatheringJob[] = ['miner', 'botanist'];

export function gatherableItemJobs(item: Pick<GatherableItem, 'jobType' | 'jobTypes'> | null | undefined): GatheringJob[] {
  if (!item) return [];

  const jobs = Array.isArray(item.jobTypes)
    ? item.jobTypes.filter((job): job is GatheringJob => GATHERING_JOBS.includes(job as GatheringJob))
    : [];

  if (jobs.length > 0) return [...new Set(jobs)];
  return item.jobType ? [item.jobType] : [];
}

export function gatherableItemSupportsJob(
  item: Pick<GatherableItem, 'jobType' | 'jobTypes'>,
  job: GatheringJob
): boolean {
  return gatherableItemJobs(item).includes(job);
}
