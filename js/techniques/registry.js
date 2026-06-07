import { sudarshanKriya } from './sudarshan-kriya.js';
import { pranayam } from './pranayam.js';
import { bhastrika } from './bhastrika.js';
import { placeholders } from './placeholder.js';

export const TECHNIQUES = {
  'sudarshan-kriya': sudarshanKriya,
  pranayam,
  bhastrika,
};

export const ALL_TECHNIQUES = [
  sudarshanKriya,
  pranayam,
  bhastrika,
  ...placeholders,
];

export function getTechnique(id) {
  return TECHNIQUES[id] || null;
}

export function isRunnable(id) {
  return id in TECHNIQUES;
}
