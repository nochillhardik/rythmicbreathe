import { setVolume, unlockAudio, initVoices, setVocalMode } from './audio.js';
import { SessionController } from './session/session-controller.js';
import { initDragSequence, getSequence } from './ui/drag-sequence.js';

const el = {
  pageSetup: document.getElementById('page-setup'),
  pageSession: document.getElementById('page-session'),
  pool: document.getElementById('technique-pool'),
  sequenceList: document.getElementById('sequence-list'),
  beginBtn: document.getElementById('begin-btn'),
  volSlider: document.getElementById('vol-slider'),
  volVal: document.getElementById('vol-val'),
  vocalMode: document.getElementById('vocal-mode'),
  readyState: document.getElementById('ready-state'),
  sessionUi: document.getElementById('session-ui'),
  transitionState: document.getElementById('transition-state'),
  transitionTitle: document.getElementById('transition-title'),
  transitionSub: document.getElementById('transition-sub'),
  techniqueHeader: document.getElementById('technique-header'),
  elapsedDisplay: document.getElementById('elapsed-display'),
  phaseBar: document.getElementById('phase-bar'),
  phaseLabels: document.getElementById('phase-labels'),
  orb: document.getElementById('orb'),
  orbWord: document.getElementById('orb-word'),
  statCycle: document.getElementById('stat-cycle'),
  statBreath: document.getElementById('stat-breath'),
  statTotal: document.getElementById('stat-total'),
  statsRow: document.getElementById('stats-row'),
  breathCount: document.getElementById('breath-count'),
  breathDots: document.getElementById('breath-dots'),
  pressRing: document.getElementById('press-ring'),
  ringFill: document.getElementById('ring-fill'),
  pressHint: document.getElementById('press-hint'),
  sessionPage: document.getElementById('page-session'),
  completeOverlay: document.getElementById('complete-overlay'),
  completeSub: document.getElementById('complete-sub'),
  btnAgain: document.getElementById('btn-again'),
  seg: {
    slow: document.getElementById('seg-slow'),
    med: document.getElementById('seg-med'),
    fast: document.getElementById('seg-fast'),
  },
  lbl: {
    slow: document.getElementById('lbl-slow'),
    med: document.getElementById('lbl-med'),
    fast: document.getElementById('lbl-fast'),
  },
};

const controller = new SessionController(el);

initVoices();

initDragSequence({
  pool: el.pool,
  sequenceList: el.sequenceList,
  beginButton: el.beginBtn,
  totalTime: document.getElementById('session-total-time'),
  onSequenceChange: (seq) => {
    controller.setSequence(seq);
  },
});

el.volSlider.addEventListener('input', () => {
  const v = parseInt(el.volSlider.value, 10);
  el.volVal.textContent = v + '%';
  setVolume(v / 100);
});

setVolume(parseInt(el.volSlider.value, 10) / 100);

el.vocalMode.addEventListener('change', () => {
  setVocalMode(el.vocalMode.value);
});
setVocalMode(el.vocalMode.value);

el.beginBtn.addEventListener('click', () => {
  const seq = getSequence();
  if (!seq.length) return;
  unlockAudio();
  initVoices();
  controller.setSequence(seq);
  controller.showReady();
  el.pageSetup.classList.add('hidden');
  el.pageSession.classList.remove('hidden');
});

el.btnAgain.addEventListener('click', () => {
  controller.resetToSetup();
});
