import { SessionSequencer, finishSessionComplete } from './sequencer.js';
import { unlockAudio, resetLongPressTicks, playLongPressTick, announceSessionStopped } from '../audio.js';

const HOLD_MS = 1000;
const CIRCUMFERENCE = 2 * Math.PI * 54;

export class SessionController {
  constructor(elements) {
    this.el = elements;
    this.sequencer = new SessionSequencer(this);
    this.sessionActive = false;
    this.pressStart = null;
    this.pressRAF = null;
    this.elapsedIV = null;
    this.elapsedStart = null;
    this.sequence = [];
    this.sessionStarting = false;
    this.bindLongPress();
  }

  setSequence(sequence) {
    this.sequence = sequence;
  }

  showReady() {
    this.el.readyState.style.display = 'flex';
    this.el.sessionUi.style.display = 'none';
    this.el.transitionState.style.display = 'none';
    this.el.pressHint.textContent = 'Hold 1 second to begin';
    this.sessionActive = false;
  }

  showSessionUi() {
    this.el.readyState.style.display = 'none';
    this.el.sessionUi.style.display = 'flex';
    this.el.transitionState.style.display = 'none';
    this.el.pressHint.textContent = 'Hold 1 second to stop';
  }

  onTechniqueStart(technique, item) {
    this.showSessionUi();
    this.sessionActive = true;
    this.el.techniqueHeader.textContent = technique.name;
    this.startElapsed();
  }

  onPhase(event, technique, item) {
    const orb = this.el.orb;
    const word = this.el.orbWord;
    word.textContent = event.phase === 'hold1' || event.phase === 'hold2' ? 'hold' : event.phase;

    const isIn = event.phase === 'in';
    const isOut = event.phase === 'out';
    const dur = (event.durationMs / 1000) + 's';
    orb.style.setProperty('--bd', dur);
    orb.classList.remove('inhale', 'exhale', 'hold-steady');
    void orb.offsetWidth;

    if (isIn) orb.classList.add('inhale');
    else if (isOut) orb.classList.add('exhale');
    else orb.classList.add('hold-steady');

    let header = technique.name;
    if (event.setIndex != null) header += ` · Set ${event.setIndex} of ${event.setTotal}`;
    if (event.cycleIndex != null) header += ` · Cycle ${event.cycleIndex}`;
    if (event.breathIndex != null) header += ` · Breath ${event.breathIndex}/${event.breathTotal}`;
    this.el.techniqueHeader.textContent = header;

    if (event.breathIndex != null && event.breathTotal != null) {
      this.el.breathCount.textContent = `${event.breathIndex} / ${event.breathTotal}`;
      this.buildDots(event.breathTotal);
      this.updateDots(event.breathIndex - 1, event.breathTotal);
    }

    if (technique.id === 'sudarshan-kriya') {
      this.el.phaseBar.style.display = 'flex';
      this.el.phaseLabels.style.display = 'flex';
      this.el.statsRow.style.display = 'flex';
      this.el.statBreath.textContent = event.breathIndex ?? '—';
      if (event.setIndex != null) this.el.statCycle.textContent = event.setIndex;
      if (event.phaseLabel) {
        ['slow', 'med', 'fast'].forEach(p => {
          const active = event.phaseName === p;
          this.el.seg[p].className = 'phase-seg' + (active ? ` active-${p}` : '');
          this.el.lbl[p].className = 'phase-lbl' + (active ? ' active' : '');
        });
        orb.className = 'orb phase-' + event.phaseName + (isIn ? ' inhale' : isOut ? ' exhale' : ' hold-steady');
      }
    } else {
      this.el.phaseBar.style.display = 'none';
      this.el.phaseLabels.style.display = 'none';
      this.el.statsRow.style.display = 'none';
    }

    const breathDone =
      (technique.id === 'pranayam' && event.phase === 'hold2') ||
      (technique.id !== 'pranayam' && event.phase === 'out');
    if (breathDone) {
      this.el.statTotal.textContent = parseInt(this.el.statTotal.textContent, 10) + 1;
    }
  }

  onRest(event) {
    this.el.orbWord.textContent = 'rest';
    this.el.orb.classList.remove('inhale', 'exhale');
    this.el.orb.classList.add('hold-steady');
    if (event?.durationMs) {
      const sec = Math.round(event.durationMs / 1000);
      this.el.techniqueHeader.textContent = `Rest · ${sec}s`;
    }
  }

  onTransition(nextName) {
    this.sessionActive = true;
    this.el.readyState.style.display = 'none';
    this.el.sessionUi.style.display = 'none';
    this.el.transitionState.style.display = 'flex';
    this.el.transitionTitle.textContent = 'Rest';
    this.el.transitionSub.textContent = `Next: ${nextName}`;
    this.el.pressHint.textContent = '';
  }

  async onSessionComplete(summary, totalBreaths) {
    this.sessionActive = false;
    this.stopElapsed();
    await finishSessionComplete(summary, totalBreaths);
    const parts = summary.map(s => `${s.name}: ${s.sets} set${s.sets !== 1 ? 's' : ''}`);
    this.el.completeSub.textContent = parts.join(' · ') + ` · ${totalBreaths} breaths`;
    this.el.completeOverlay.style.display = 'flex';
  }

  async stopEarly() {
    this.sequencer.stop();
    this.sessionActive = false;
    this.stopElapsed();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    this.el.completeSub.textContent = 'Session stopped early';
    this.el.completeOverlay.style.display = 'flex';
    announceSessionStopped();
  }

  async startSession() {
    unlockAudio();
    this.showSessionUi();
    this.el.statTotal.textContent = '0';
    this.el.statCycle.textContent = '1';
    this.elapsedStart = null;
    this.stopElapsed();
    await this.sequencer.start(this.sequence);
  }

  buildDots(count) {
    const c = this.el.breathDots;
    c.innerHTML = '';
    const n = Math.min(count, 40);
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      d.className = 'bdot';
      d.id = 'dot-' + i;
      c.appendChild(d);
    }
  }

  updateDots(current, total) {
    const n = Math.min(total, 40);
    for (let i = 0; i < n; i++) {
      const d = document.getElementById('dot-' + i);
      if (!d) continue;
      d.className = 'bdot' + (i < current ? ' done' : i === current ? ' current' : '');
    }
  }

  startElapsed() {
    this.elapsedStart = Date.now();
    this.elapsedIV = setInterval(() => {
      const s = Math.floor((Date.now() - this.elapsedStart) / 1000);
      const m = Math.floor(s / 60);
      const sec = s % 60;
      this.el.elapsedDisplay.textContent =
        String(m).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
    }, 250);
  }

  stopElapsed() {
    if (this.elapsedIV) clearInterval(this.elapsedIV);
    this.elapsedIV = null;
  }

  bindLongPress() {
    const page = this.el.sessionPage;
    let holdCompleted = false;

    const start = (e) => {
      if (e.target.closest('button, input, select')) return;
      e.preventDefault();
      holdCompleted = false;
      unlockAudio();
      this.pressStart = Date.now();
      resetLongPressTicks();
      this.el.pressRing.classList.add('visible');
      this.el.ringFill.style.transition = 'none';
      this.el.ringFill.style.strokeDashoffset = CIRCUMFERENCE;
      requestAnimationFrame(() => this.animateRing(() => { holdCompleted = true; }));
    };
    const cancel = () => {
      if (holdCompleted) return;
      this.pressStart = null;
      resetLongPressTicks();
      if (this.pressRAF) cancelAnimationFrame(this.pressRAF);
      this.el.pressRing.classList.remove('visible');
      this.el.ringFill.style.strokeDashoffset = CIRCUMFERENCE;
    };

    page.addEventListener('touchstart', start, { passive: false });
    page.addEventListener('touchmove', (e) => { if (this.pressStart) e.preventDefault(); }, { passive: false });
    page.addEventListener('touchend', cancel, { passive: false });
    page.addEventListener('touchcancel', cancel, { passive: false });
    page.addEventListener('mousedown', start);
    page.addEventListener('mouseup', cancel);
    page.addEventListener('mouseleave', cancel);
  }

  animateRing(onComplete) {
    if (!this.pressStart) return;
    const elapsed = Date.now() - this.pressStart;
    const progress = Math.min(elapsed / HOLD_MS, 1);
    this.el.ringFill.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
    playLongPressTick(progress);

    if (progress >= 1) {
      this.pressStart = null;
      resetLongPressTicks();
      this.el.pressRing.classList.remove('visible');
      this.el.ringFill.style.strokeDashoffset = CIRCUMFERENCE;
      onComplete?.();

      if (this.sequencer.isRunning() || this.sessionActive) {
        this.stopEarly();
      } else if (!this.sessionStarting) {
        this.sessionStarting = true;
        this.startSession().finally(() => { this.sessionStarting = false; });
      }
      return;
    }
    this.pressRAF = requestAnimationFrame(() => this.animateRing());
  }

  resetToSetup() {
    this.sequencer.stop();
    this.sessionActive = false;
    this.stopElapsed();
    this.elapsedStart = null;
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    this.el.completeOverlay.style.display = 'none';
    this.showReady();
    this.el.pageSession.classList.add('hidden');
    this.el.pageSetup.classList.remove('hidden');
  }
}
