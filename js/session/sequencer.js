import {
  playPhaseCue,
  announceTransition,
  announceRest,
  announceSessionComplete,
  announceSessionStopped,
  playCompletionChime,
} from '../audio.js';
import { getTechnique } from '../techniques/registry.js';

const TRANSITION_MS = 30000;
const TRANSITION_WARNING_MS = 25000;

export class SessionSequencer {
  constructor(controller) {
    this.controller = controller;
    this.abortController = null;
    this.running = false;
    this.summary = [];
    this.totalBreaths = 0;
  }

  async start(sequence) {
    if (!sequence.length) return;
    this.running = true;
    this.summary = [];
    this.totalBreaths = 0;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      for (let i = 0; i < sequence.length; i++) {
        if (signal.aborted) break;
        const item = sequence[i];
        const technique = getTechnique(item.id);
        if (!technique) continue;

        if (i === 0) {
          await announceTransition(technique.name, 'starting');
          await delay(800);
        }

        this.controller.onTechniqueStart(technique, item);

        for (let s = 0; s < item.sets; s++) {
          if (signal.aborted) break;
          const setResult = await this.runOneSet(technique, item, s + 1, item.sets, signal);
          if (setResult?.breaths) this.totalBreaths += setResult.breaths;

          if (s + 1 < item.sets && !signal.aborted) {
            await this.runIntraRest(item.restSeconds ?? 20, signal);
          }
        }

        this.summary.push({
          name: technique.name,
          sets: item.sets,
        });

        if (i < sequence.length - 1 && !signal.aborted) {
          const next = getTechnique(sequence[i + 1].id);
          await this.runTransition(next.name, signal);
        }
      }

      if (!signal.aborted) {
        this.controller.onSessionComplete(this.summary, this.totalBreaths);
      }
    } catch (e) {
      if (e.name !== 'AbortError') throw e;
    } finally {
      this.running = false;
    }
  }

  async runOneSet(technique, item, setIndex, setTotal, signal) {
    const gen = technique.runSet({
      setIndex,
      setTotal,
      signal,
      restSeconds: item.restSeconds ?? 20,
    });

    let result = { breaths: 0 };
    while (true) {
      const { value: event, done } = await gen.next();
      if (done) {
        if (event) result = event;
        break;
      }
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError');

      if (event.type === 'rest') {
        this.controller.onRest(event);
        await announceRest();
        continue;
      }

      if (event.type === 'phase') {
        this.controller.onPhase(event, technique, item);
        playPhaseCue(item.sound, event.phase, technique.kind);
      }
    }
    return result;
  }

  async runIntraRest(seconds, signal) {
    if (seconds <= 0) return;
    const durationMs = seconds * 1000;
    this.controller.onRest({ durationMs, label: 'Rest' });
    await announceRest();
    await waitUntil(durationMs, signal);
  }

  async runTransition(nextName, signal) {
    this.controller.onTransition(nextName);
    await announceTransition(nextName, 'next');
    await waitUntil(TRANSITION_WARNING_MS, signal);
    await announceTransition(nextName, 'starting');
    await waitUntil(TRANSITION_MS - TRANSITION_WARNING_MS, signal);
  }

  stop() {
    this.abortController?.abort();
    this.running = false;
  }

  isRunning() {
    return this.running;
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function waitUntil(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new DOMException('Aborted', 'AbortError'));
      return;
    }
    const t = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(t);
      reject(new DOMException('Aborted', 'AbortError'));
    }, { once: true });
  });
}

export async function finishSessionStopped(summary, totalBreaths) {
  await announceSessionStopped();
}

export async function finishSessionComplete(summary, totalBreaths) {
  playCompletionChime();
  const text = `${summary.length} technique${summary.length !== 1 ? 's' : ''}, ${totalBreaths} breaths`;
  await announceSessionComplete(text);
}
