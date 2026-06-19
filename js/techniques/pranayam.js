import { wait } from './base.js';

const BREATH_STEPS = [
  { phase: 'in', durationMs: 4000 },
  { phase: 'hold1', durationMs: 4000 },
  { phase: 'out', durationMs: 6000 },
  { phase: 'hold2', durationMs: 2000 },
];

const CYCLES = [8, 8, 6];

export const pranayam = {
  id: 'pranayam',
  name: 'Box Breathing',
  description: '4-4-6-2 pattern · 8 + 8 + 6 breaths per set',
  defaultSets: 1,
  defaultSound: 'singing-bowl',
  isAvailable: true,
  kind: 'four-phase',

  getSetStructure() {
    return '1 set = 8 + 8 + 6 breaths (4s in, 4s hold, 6s out, 2s hold)';
  },

  getSetDurationMs(restSeconds = 20) {
    const breathMs = BREATH_STEPS.reduce((sum, step) => sum + step.durationMs, 0);
    let ms = 0;
    for (let ci = 0; ci < CYCLES.length; ci++) {
      ms += CYCLES[ci] * breathMs;
      if (ci < CYCLES.length - 1 && restSeconds > 0) {
        ms += restSeconds * 1000;
      }
    }
    return ms;
  },

  async *runSet(ctx) {
    let totalBreaths = 0;
    const restSeconds = ctx.restSeconds ?? 20;
    const restMs = restSeconds * 1000;

    for (let ci = 0; ci < CYCLES.length; ci++) {
      const cycleBreaths = CYCLES[ci];
      for (let b = 0; b < cycleBreaths; b++) {
        for (const step of BREATH_STEPS) {
          yield {
            type: 'phase',
            phase: step.phase,
            cycleIndex: ci + 1,
            cycleTotal: CYCLES.length,
            cycleBreaths,
            breathIndex: b + 1,
            breathTotal: cycleBreaths,
            durationMs: step.durationMs,
            setIndex: ctx.setIndex,
            setTotal: ctx.setTotal,
          };
          await wait(step.durationMs, ctx.signal);
        }
        totalBreaths++;
      }
      if (ci < CYCLES.length - 1 && restSeconds > 0) {
        yield { type: 'rest', durationMs: restMs, label: 'Rest' };
      }
    }
    return { breaths: totalBreaths };
  },
};
