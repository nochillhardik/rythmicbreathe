# Rythmic Breathe — Master Context

Audio-first meditation breathing guide for mobile (GitHub Pages). User practices with eyes closed; all timing is driven by sound.

## Techniques

| ID | Name | 1 Set | Default sets |
|----|------|-------|--------------|
| `sudarshan-kriya` | Sudarshan Kriya | 20 slow + 40 med + 40 fast | 1 |
| `pranayam` | Pranayam | 8+8+6 breaths (4-4-6-2), configurable rest between sub-cycles | 1 |
| `bhastrika` | Bhastrika | 20 breaths (2s in, 1s out) | 3 |

Placeholders (not runnable): Body Scan, Loving-Kindness, 4-7-8 Breathing.

## Rest timing

Each sequence row has **Rest (sec)** (default **20**, min **0**).

| When | Rest? |
|------|-------|
| Pranayam: after 8-breath sub-cycle (not after final 6) | Yes, row setting |
| After a set, if another set of same technique follows | Yes, row setting |
| After last set of a technique | No — goes to next technique or session end |
| Between techniques | **30s fixed** (`"Next: …"` / `"Starting …"`) — not configurable |

Spoken **"Rest"** at the start of each intra-technique rest. Set Rest to **0** to skip pauses for that technique.

## File map

```
index.html              Entry point (GitHub Pages)
css/tokens.css          Colors, fonts
css/layout.css          Setup page, sequence builder
css/session.css         Session orb, overlays
js/main.js              Boot wiring
js/audio.js             Sounds, voice, 9 tonal profiles
js/techniques/          Technique engines
js/session/             Sequencer + UI controller
js/ui/drag-sequence.js  Sequence builder
legacy/                 Original single-file app
```

## Sound options (per technique row)

Singing Bowl, Tibetan Bowl, Crystal Bowl, Deep Gong, Wind Chime, Hand Pan, Soft Beep, Quartz Tone, Warm Pulse, Voice Male/Female.

Pranayam with tonal sounds: 4 distinct pitches per breath (in → hold → out → hold).

Transitions between techniques: spoken "Next: …" then after 25s "Starting …" (30s total break).

## How to test

1. **Open locally:** serve the folder (ES modules need HTTP). Example: `npx serve .` then open the URL on phone/PC.
2. **GitHub Pages:** push repo; open your Pages URL on mobile.
3. **Pranayam, rest=20:** hear "Rest" twice (after first 8 and second 8 breaths); no rest after 6 breaths.
4. **Bhastrika, 3 sets, rest=20:** hear "Rest" twice between sets; no rest after set 3.
5. **SK → Bhastrika:** no rest after SK's last set; hear "Next: Bhastrika" immediately.
6. **rest=0:** no "Rest" pauses for that technique.
7. **Stop early:** hold 1s during session → hear "Session stopped".

## Session flow

Setup (eyes open) → Begin → Ready → hold 1s → techniques run in order → Session complete (spoken + overlay) → Practice Again.
