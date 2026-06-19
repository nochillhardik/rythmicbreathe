import { wait } from './base.js';

const BREATHS_PER_SET = 20;
const INHALE_MS = 2000;
const EXHALE_MS = 1000;

export const bhastrika = {
  id: 'bhastrika',
  name: 'Burst Detox',
  description: '2s in · 1s out · 20 breaths per set',
  defaultSets: 3,
  defaultSound: 'singing-bowl',
  isAvailable: true,
  kind: 'two-phase',

  getSetStructure() {
    return '1 set = 20 breaths (2s in, 1s out)';
  },

  getSetDurationMs() {
    return BREATHS_PER_SET * (INHALE_MS + EXHALE_MS);
  },

  async *runSet(ctx) {
    let totalBreaths = 0;
    for (let b = 0; b < BREATHS_PER_SET; b++) {
      yield {
        type: 'phase',
        phase: 'in',
        breathIndex: b + 1,
        breathTotal: BREATHS_PER_SET,
        durationMs: INHALE_MS,
        setIndex: ctx.setIndex,
        setTotal: ctx.setTotal,
      };
      await wait(INHALE_MS, ctx.signal);

      yield {
        type: 'phase',
        phase: 'out',
        breathIndex: b + 1,
        breathTotal: BREATHS_PER_SET,
        durationMs: EXHALE_MS,
        setIndex: ctx.setIndex,
        setTotal: ctx.setTotal,
      };
      await wait(EXHALE_MS, ctx.signal);
      totalBreaths++;
    }
    return { breaths: totalBreaths };
  },
};
