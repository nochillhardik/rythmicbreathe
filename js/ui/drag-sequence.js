import { ALL_TECHNIQUES, isRunnable } from '../techniques/registry.js';
import { SOUND_OPTIONS, buildSoundSelectOptions, testTechniqueSound } from '../audio.js';

let sequence = [];
let poolEl, sequenceEl, beginBtn, onChange;

export function initDragSequence({ pool, sequenceList, beginButton, onSequenceChange }) {
  poolEl = pool;
  sequenceEl = sequenceList;
  beginBtn = beginButton;
  onChange = onSequenceChange;
  renderPool();
  renderSequence();

  sequenceEl.addEventListener('dragover', (e) => e.preventDefault());
  sequenceEl.addEventListener('drop', (e) => {
    e.preventDefault();
    if (e.target.closest('.sequence-row')) return;
    const id = e.dataTransfer.getData('text/id');
    if (id) addToSequence(id);
  });
}

export function getSequence() {
  return sequence.map(item => ({ ...item }));
}

function renderPool() {
  poolEl.innerHTML = '';
  ALL_TECHNIQUES.forEach(t => {
    const chip = document.createElement('div');
    chip.className = 'technique-chip' + (t.isAvailable ? '' : ' unavailable');
    chip.draggable = t.isAvailable;
    chip.dataset.id = t.id;
    chip.innerHTML = `<span class="chip-name">${t.name}</span><span class="chip-desc">${t.description}</span>`;
    if (t.isAvailable) {
      chip.addEventListener('dragstart', onDragStart);
      chip.addEventListener('click', () => addToSequence(t.id));
    }
    poolEl.appendChild(chip);
  });
}

function renderSequence() {
  sequenceEl.innerHTML = '';
  if (sequence.length === 0) {
    sequenceEl.innerHTML = '<p class="sequence-empty">Drag techniques here to build your session</p>';
    beginBtn.disabled = true;
    onChange?.(sequence);
    return;
  }

  sequence.forEach((item, index) => {
    sequenceEl.appendChild(createSequenceRow(item, index));
  });
  beginBtn.disabled = false;
  onChange?.(sequence);
}

function createSequenceRow(item, index) {
  const row = document.createElement('div');
  row.className = 'sequence-row';
  row.dataset.id = item.id;

  const handle = document.createElement('span');
  handle.className = 'drag-handle';
  handle.textContent = '⠿';
  handle.draggable = true;
  handle.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/reorder', String(index));
    e.dataTransfer.effectAllowed = 'move';
  });

  const info = document.createElement('div');
  info.className = 'row-info';
  info.innerHTML = `<div class="row-name">${item.name}</div><div class="row-desc">${item.description}</div>`;

  const setsField = document.createElement('div');
  setsField.className = 'row-sets';
  setsField.innerHTML = `<label>Sets</label>`;
  const setsInput = document.createElement('input');
  setsInput.type = 'number';
  setsInput.min = '1';
  setsInput.max = '99';
  setsInput.value = item.sets;
  setsInput.addEventListener('change', () => {
    item.sets = Math.max(1, parseInt(setsInput.value, 10) || 1);
    setsInput.value = item.sets;
  });
  setsField.appendChild(setsInput);

  const soundField = document.createElement('div');
  soundField.className = 'row-sound';
  const soundLabel = document.createElement('label');
  soundLabel.textContent = 'Sound';
  const soundSelect = document.createElement('select');
  soundSelect.className = 'sound-select';
  populateSoundSelect(soundSelect, item.sound);
  soundSelect.addEventListener('change', () => { item.sound = soundSelect.value; });
  soundField.append(soundLabel, soundSelect);

  const restField = document.createElement('div');
  restField.className = 'row-rest';
  const restLabel = document.createElement('label');
  restLabel.textContent = 'Rest (sec)';
  const restInput = document.createElement('input');
  restInput.type = 'number';
  restInput.min = '0';
  restInput.max = '300';
  restInput.value = item.restSeconds ?? 20;
  restInput.addEventListener('change', () => {
    item.restSeconds = Math.max(0, parseInt(restInput.value, 10) || 0);
    restInput.value = item.restSeconds;
  });
  restField.append(restLabel, restInput);

  const testBtn = document.createElement('button');
  testBtn.type = 'button';
  testBtn.className = 'test-btn row-test';
  testBtn.textContent = 'Test';
  testBtn.addEventListener('click', () => testTechniqueSound(item.sound, item.id));

  const reorderBtns = document.createElement('div');
  reorderBtns.className = 'reorder-btns';
  const upBtn = document.createElement('button');
  upBtn.type = 'button';
  upBtn.className = 'reorder-btn';
  upBtn.textContent = '↑';
  upBtn.disabled = index === 0;
  upBtn.addEventListener('click', () => moveItem(index, -1));
  const downBtn = document.createElement('button');
  downBtn.type = 'button';
  downBtn.className = 'reorder-btn';
  downBtn.textContent = '↓';
  downBtn.disabled = index === sequence.length - 1;
  downBtn.addEventListener('click', () => moveItem(index, 1));

  reorderBtns.append(upBtn, downBtn);

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'remove-btn';
  removeBtn.textContent = '×';
  removeBtn.addEventListener('click', () => {
    sequence.splice(index, 1);
    renderSequence();
  });

  const rowControls = document.createElement('div');
  rowControls.className = 'row-controls';
  rowControls.append(setsField, soundField, restField, testBtn);

  row.append(handle, info, rowControls, reorderBtns, removeBtn);

  row.addEventListener('dragover', (e) => { e.preventDefault(); row.classList.add('drag-over'); });
  row.addEventListener('dragleave', () => row.classList.remove('drag-over'));
  row.addEventListener('drop', onRowDrop);

  return row;
}

function populateSoundSelect(select, value) {
  const groups = buildSoundSelectOptions();
  Object.entries(groups).forEach(([groupName, opts]) => {
    const og = document.createElement('optgroup');
    og.label = groupName;
    opts.forEach(o => {
      const opt = document.createElement('option');
      opt.value = o.value;
      opt.textContent = o.label;
      if (o.value === value) opt.selected = true;
      og.appendChild(opt);
    });
    select.appendChild(og);
  });
}

function onDragStart(e) {
  e.dataTransfer.setData('text/id', e.currentTarget.dataset.id);
  e.dataTransfer.effectAllowed = 'copy';
}

function onRowDrop(e) {
  e.preventDefault();
  e.currentTarget.classList.remove('drag-over');
  const reorder = e.dataTransfer.getData('text/reorder');
  if (reorder) {
    const from = parseInt(reorder, 10);
    const to = [...sequenceEl.children].indexOf(e.currentTarget.closest('.sequence-row'));
    if (from !== to && from >= 0 && to >= 0) {
      const [moved] = sequence.splice(from, 1);
      sequence.splice(to, 0, moved);
      renderSequence();
    }
    return;
  }
  const id = e.dataTransfer.getData('text/id');
  if (id) addToSequence(id);
}

function addToSequence(id) {
  if (!isRunnable(id)) return;
  const t = ALL_TECHNIQUES.find(x => x.id === id);
  if (!t) return;
  sequence.push({
    id: t.id,
    name: t.name,
    description: t.description,
    sets: t.defaultSets,
    sound: t.defaultSound,
    restSeconds: t.defaultRestSeconds ?? 20,
  });
  renderSequence();
}

function moveItem(index, dir) {
  const to = index + dir;
  if (to < 0 || to >= sequence.length) return;
  [sequence[index], sequence[to]] = [sequence[to], sequence[index]];
  renderSequence();
}

export { SOUND_OPTIONS };
