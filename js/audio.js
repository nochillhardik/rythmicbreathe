/** Audio module — soft tonal profiles, voice, transitions */

const AudioCtx = window.AudioContext || window.webkitAudioContext;
let actx = null;
let volume = 0.7;
let lastTickStep = -1;

export const SOUND_OPTIONS = [
  { value: 'singing-bowl', label: 'Singing Bowl', group: 'Bowls' },
  { value: 'tibetan-bowl', label: 'Tibetan Bowl', group: 'Bowls' },
  { value: 'crystal-bowl', label: 'Crystal Bowl', group: 'Bowls' },
  { value: 'deep-gong', label: 'Deep Gong', group: 'Bowls' },
  { value: 'wind-chime', label: 'Wind Chime', group: 'Bowls' },
  { value: 'hand-pan', label: 'Hand Pan', group: 'Bowls' },
  { value: 'soft-beep', label: 'Soft Beep', group: 'Tones' },
  { value: 'quartz-tone', label: 'Quartz Tone', group: 'Tones' },
  { value: 'warm-pulse', label: 'Warm Pulse', group: 'Tones' },
  { value: 'voice-male', label: 'Voice — Male', group: 'Voice' },
  { value: 'voice-female', label: 'Voice — Female', group: 'Voice' },
];

/** Pranayam four-step pitch map (Hz) */
export const PRANAYAM_PITCHES = {
  standard: { in: 262, hold1: 330, out: 196, hold2: 392 },
  low: { in: 131, hold1: 165, out: 98, hold2: 196 },
  high: { in: 523, hold1: 659, out: 392, hold2: 784 },
};

const OCTAVE_LOW = new Set(['deep-gong', 'tibetan-bowl']);
const OCTAVE_HIGH = new Set(['soft-beep', 'quartz-tone', 'warm-pulse']);

/** Two-phase in/out base frequencies per profile */
const IN_OUT_FREQ = {
  'singing-bowl': { in: 220, out: 174 },
  'tibetan-bowl': { in: 136.1, out: 111 },
  'crystal-bowl': { in: 294, out: 220 },
  'deep-gong': { in: 65, out: 55 },
  'wind-chime': { in: 440, out: 349 },
  'hand-pan': { in: 220, out: 165 },
  'soft-beep': { in: 660, out: 440 },
  'quartz-tone': { in: 523, out: 392 },
  'warm-pulse': { in: 440, out: 330 },
};

/** Synthesis recipes: partials as [ratio, weight], attack ms, decay s, vol cap */
export const SOUND_PROFILES = {
  'singing-bowl': { partials: [[1, 1], [2, 0.5], [3, 0.33], [4, 0.25]], attack: 60, decay: 2.5, cap: 0.5 },
  'tibetan-bowl': { partials: [[1, 1], [2.2, 0.45], [3.5, 0.3], [4.9, 0.2]], attack: 80, decay: 3.5, cap: 0.5 },
  'crystal-bowl': { partials: [[1, 1], [2, 0.35], [3, 0.15]], attack: 50, decay: 2.0, cap: 0.45 },
  'deep-gong': { partials: [[1, 1], [1.5, 0.6], [2, 0.3]], attack: 100, decay: 4.0, cap: 0.55 },
  'wind-chime': { partials: [[1, 1], [1.002, 0.4], [2.01, 0.2]], attack: 40, decay: 2.0, cap: 0.35 },
  'hand-pan': { partials: [[1, 1], [1.5, 0.5], [2, 0.25], [2.5, 0.15]], attack: 55, decay: 2.2, cap: 0.4 },
  'soft-beep': { partials: [[1, 1]], attack: 20, decay: 0.35, cap: 0.35 },
  'quartz-tone': { partials: [[1, 1], [2, 0.08]], attack: 50, decay: 0.8, cap: 0.3 },
  'warm-pulse': { partials: [[1, 1]], attack: 60, decay: 1.2, cap: 0.2 },
};

export function setVolume(v) {
  volume = Math.max(0, Math.min(1, v));
}

export function getVolume() {
  return volume;
}

export const VOCAL_MODES = ['full', 'transitions', 'none'];

let vocalMode = 'full';

export function setVocalMode(mode) {
  vocalMode = VOCAL_MODES.includes(mode) ? mode : 'full';
}

export function getVocalMode() {
  return vocalMode;
}

/** @param {'rest'|'rest-end'|'transition'|'session-start'|'session-end'|'session-stop'} kind */
export function shouldSpeakInstruction(kind) {
  if (vocalMode === 'none') return false;
  if (vocalMode === 'transitions') {
    return kind === 'transition' || kind === 'session-start';
  }
  return true;
}

export function unlockAudio() {
  if (!actx) actx = new AudioCtx();
  if (actx.state === 'suspended') actx.resume();
  return actx;
}

function getCtx() {
  return unlockAudio();
}

function getPranayamFreq(profileId, phase) {
  const map = OCTAVE_LOW.has(profileId) ? PRANAYAM_PITCHES.low
    : OCTAVE_HIGH.has(profileId) ? PRANAYAM_PITCHES.high
    : PRANAYAM_PITCHES.standard;
  const key = phase === 'in' ? 'in'
    : phase === 'hold1' ? 'hold1'
    : phase === 'out' ? 'out'
    : 'hold2';
  return map[key];
}

function playTonal(profileId, frequency) {
  const profile = SOUND_PROFILES[profileId];
  if (!profile) return;
  const ctx = getCtx();
  const attack = profile.attack / 1000;
  const decay = profile.decay;

  profile.partials.forEach(([ratio, weight], i) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = 'sine';
    o.frequency.value = frequency * ratio;
    const hv = (volume * profile.cap * weight) / (i * 0.5 + 1);
    g.gain.setValueAtTime(0, ctx.currentTime);
    g.gain.linearRampToValueAtTime(hv, ctx.currentTime + attack);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + decay);
    o.connect(g);
    g.connect(ctx.destination);
    o.start();
    o.stop(ctx.currentTime + decay + 0.05);
  });
}

function isVoice(cueId) {
  return cueId === 'voice-male' || cueId === 'voice-female';
}

function voiceGender(cueId) {
  return cueId === 'voice-male' ? 'male' : 'female';
}

const MALE_VOICE_KEYS = ['siri', 'male', 'david', 'daniel', 'alex', 'james', 'mark', 'aaron', 'fred'];
const FEMALE_VOICE_KEYS = ['female', 'samantha', 'karen', 'victoria', 'zoe', 'kate'];

function pickVoice(gender, preferSiri = false) {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const keys = gender === 'female' ? FEMALE_VOICE_KEYS : MALE_VOICE_KEYS;
  if (preferSiri) {
    const siri = voices.find(v => {
      const n = v.name.toLowerCase();
      return n.includes('siri') && (gender !== 'male' || !n.includes('female'));
    });
    if (siri) return siri;
  }
  return voices.find(v => keys.some(k => v.name.toLowerCase().includes(k))) ?? null;
}

export function speak(text, opts = {}) {
  if (!window.speechSynthesis) return Promise.resolve();
  return new Promise((resolve) => {
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };
    const maxMs = opts.timeout ?? 5000;
    const timer = setTimeout(finish, maxMs);

    try {
      window.speechSynthesis.cancel();
      if (typeof window.speechSynthesis.resume === 'function') {
        window.speechSynthesis.resume();
      }
      const u = new SpeechSynthesisUtterance(text);
      u.volume = volume;
      u.rate = opts.rate ?? 0.85;
      u.pitch = opts.gender === 'female' ? 1.3 : opts.gender === 'male' ? 0.7 : 1;
      if (opts.gender) {
        const match = pickVoice(opts.gender, opts.preferSiri);
        if (match) u.voice = match;
      }
      u.onend = () => { clearTimeout(timer); finish(); };
      u.onerror = () => { clearTimeout(timer); finish(); };
      window.speechSynthesis.speak(u);
    } catch {
      clearTimeout(timer);
      finish();
    }
  });
}

/** Speak without blocking session flow (mobile-safe). */
export function speakAsync(text, opts = {}) {
  void speak(text, opts);
}

const INSTRUCTION_SPEAK_OPTS = { gender: 'male', preferSiri: true, rate: 0.85 };

/** Gated instructional speech (male Siri-style); does not affect row breath voice cues. */
export function speakInstruction(text, kind, opts = {}) {
  if (!shouldSpeakInstruction(kind)) return Promise.resolve();
  return speak(text, { ...INSTRUCTION_SPEAK_OPTS, ...opts });
}

export function speakInstructionAsync(text, kind, opts = {}) {
  if (!shouldSpeakInstruction(kind)) return;
  void speak(text, { ...INSTRUCTION_SPEAK_OPTS, ...opts });
}

export function playPhaseCue(cueId, phase, techniqueKind = 'two-phase') {
  if (isVoice(cueId)) {
    const word = phase === 'in' ? 'in'
      : phase === 'out' ? 'out'
      : 'hold';
    speak(word, { gender: voiceGender(cueId) });
    return;
  }

  let freq;
  if (techniqueKind === 'four-phase') {
    freq = getPranayamFreq(cueId, phase);
  } else {
    const pair = IN_OUT_FREQ[cueId];
    if (!pair) return;
    freq = phase === 'in' ? pair.in : pair.out;
  }
  playTonal(cueId, freq);
}

export function announceTransition(techniqueName, type) {
  const text = type === 'next' ? `Next: ${techniqueName}` : `Starting ${techniqueName}`;
  return speakInstruction(text, 'transition', { timeout: 6000 });
}

export function announceSessionComplete(summary) {
  return speakInstruction(`Session complete. ${summary}`, 'session-end', { timeout: 8000 });
}

export function announceSessionStopped() {
  return speakInstruction('Session stopped', 'session-stop');
}

export function playLongPressTick(progress) {
  const step = Math.floor(progress * 4);
  if (step === lastTickStep) return;
  lastTickStep = step;
  playTonal('warm-pulse', 330 + step * 40);
}

export function resetLongPressTicks() {
  lastTickStep = -1;
}

export function playCompletionChime() {
  playTonal('crystal-bowl', 262);
}

/** Preview sounds for a technique row */
export async function testTechniqueSound(cueId, techniqueId) {
  unlockAudio();
  if (techniqueId === 'pranayam') {
    const phases = ['in', 'hold1', 'out', 'hold2'];
    for (const phase of phases) {
      playPhaseCue(cueId, phase, 'four-phase');
      await delay(isVoice(cueId) ? 900 : 700);
    }
  } else {
    playPhaseCue(cueId, 'in', 'two-phase');
    await delay(isVoice(cueId) ? 800 : 600);
    playPhaseCue(cueId, 'out', 'two-phase');
  }
}

function delay(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export function initVoices() {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

export function buildSoundSelectOptions() {
  const groups = {};
  SOUND_OPTIONS.forEach(opt => {
    if (!groups[opt.group]) groups[opt.group] = [];
    groups[opt.group].push(opt);
  });
  return groups;
}
