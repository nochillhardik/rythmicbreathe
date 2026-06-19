import { getTechnique } from '../techniques/registry.js';
import { TRANSITION_MS } from './constants.js';

export function estimateItemDurationMs(item) {
  const technique = getTechnique(item.id);
  if (!technique?.getSetDurationMs) return 0;

  const restSeconds = item.restSeconds ?? 20;
  const sets = item.sets ?? 1;
  const setMs = technique.getSetDurationMs(restSeconds);
  let total = setMs * sets;

  if (restSeconds > 0 && sets > 1) {
    total += (sets - 1) * restSeconds * 1000;
  }

  return total;
}

export function estimateSequenceDurationMs(sequence) {
  if (!sequence.length) return 0;

  let total = sequence.reduce((sum, item) => sum + estimateItemDurationMs(item), 0);
  total += (sequence.length - 1) * TRANSITION_MS;
  return total;
}

export function formatDuration(ms) {
  const totalSec = Math.round(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;

  if (min === 0) return `${sec} sec`;
  if (sec === 0) return `${min} min`;
  return `${min} min ${sec} sec`;
}
