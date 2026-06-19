import { wait } from './base.js';

const PHASES = [
  { name: 'slow', label: 'Slow', breaths: 20, inhaleMs: 2500, exhaleMs: 2500 },
  { name: 'med', label: 'Medium', breaths: 40, inhaleMs: 1000, exhaleMs: 1000 },
  { name: 'fast', label: 'Fast', breaths: 40, inhaleMs: 500, exhaleMs: 500 },
];

export const sudarshanKriya = {
  id: 'sudarshan-kriya',
  name: 'Pulse Meditation',
  description: '20 slow · 40 medium · 40 fast breaths per set',
  defaultSets: 1,
  defaultSound: 'singing-bowl',
  isAvailable: true,
  kind: 'two-phase',

  getSetStructure() {
    return '1 set = 20 slow + 40 medium + 40 fast breaths';
  },

  getSetDurationMs() {
    return PHASES.reduce(
      (sum, phase) => sum + phase.breaths * (phase.inhaleMs + phase.exhaleMs),
      0,
    );
  },

  async *runSet(ctx) {
    let totalBreaths = 0;
    for (const phase of PHASES) {
      for (let b = 0; b < phase.breaths; b++) {
        yield {
          type: 'phase',
          phase: 'in',
          phaseName: phase.name,
          phaseLabel: phase.label,
          breathIndex: b + 1,
          breathTotal: phase.breaths,
          durationMs: phase.inhaleMs,
          setIndex: ctx.setIndex,
          setTotal: ctx.setTotal,
        };
        await wait(phase.inhaleMs, ctx.signal);

        yield {
          type: 'phase',
          phase: 'out',
          phaseName: phase.name,
          phaseLabel: phase.label,
          breathIndex: b + 1,
          breathTotal: phase.breaths,
          durationMs: phase.exhaleMs,
          setIndex: ctx.setIndex,
          setTotal: ctx.setTotal,
        };
        await wait(phase.exhaleMs, ctx.signal);
        totalBreaths++;
      }
    }
    return { breaths: totalBreaths };
  },
};
