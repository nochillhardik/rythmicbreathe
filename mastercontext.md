# Rythmic Breathe — Master Context

Audio-first meditation breathing guide for mobile (GitHub Pages). User practices with eyes closed; all timing is driven by sound.

## Techniques

| ID | Name | 1 Set | Default sets |
|----|------|-------|--------------|
| `sudarshan-kriya` | Pulse Meditation | 20 slow + 40 med + 40 fast | 1 |
| `pranayam` | Box Breathing | 8+8+6 breaths (4-4-6-2), configurable rest between sub-cycles | 1 |
| `bhastrika` | Burst Detox | 20 breaths (2s in, 1s out) | 3 |

Placeholders (not runnable): Body Scan, Loving-Kindness, 4-7-8 Breathing.

## Default session

On first load, the sequence is pre-filled:

| Order | Technique | Sets | Sound | Rest |
|-------|-----------|------|-------|------|
| 1 | Box Breathing | 1 | Singing Bowl | 20s |
| 2 | Burst Detox | 3 | Singing Bowl | 20s |
| 3 | Pulse Meditation | 1 | Singing Bowl | 20s |

Users can reorder, remove, or change any row. Defaults apply only on page load.

## Duration display

Setup page shows estimated time per technique row and a **Total** below the sequence. Estimates include breathing, intra-technique rests, inter-set rests, and fixed 30s transitions between techniques. Sound choice does not affect duration; sets and rest do.

Default arrangement total: **~14 min 52 sec** (Box Breathing 6m32s + Burst Detox 3m40s + Pulse Meditation 3m40s + 2×30s transitions).

Logic lives in `js/session/duration.js`; each technique exposes `getSetDurationMs(restSeconds)`.

## Rest timing

Each sequence row has **Rest (sec)** (default **20**, min **0**).

| When | Rest? |
|------|-------|
| Box Breathing: after 8-breath sub-cycle (not after final 6) | Yes, row setting |
| After a set, if another set of same technique follows | Yes, row setting |
| After last set of a technique | No — goes to next technique or session end |
| Between techniques | **30s fixed** (`"Next: …"` / `"Starting …"`) — not configurable |

Spoken **"Rest"** at the start of each intra-technique or inter-set rest (when vocal guidance allows). **"Starting again"** is spoken 5 seconds before each such rest ends (skipped if rest ≤ 5s). Set Rest to **0** to skip pauses for that technique.

## Vocal guidance (Global)

Setup page **Global** card includes a **Vocal guidance** master switch (default: **Full guidance**). Controls instructional speech only — per-row Voice Male/Female breath cues (in/out/hold) are unaffected.

| Mode | What is spoken |
|------|----------------|
| **Full guidance** | Rest, Starting again, Starting [technique], Next/Starting transitions, session complete, session stopped |
| **Technique changes only** | Starting [first technique], Next: …, Starting … (between techniques) |
| **Off** | No instructional speech |

Instructional voice uses male Siri-style TTS where available (Web Speech API); falls back to best male system voice. Row-level Voice sound is separate.

Logic: `shouldSpeakInstruction()` and `speakInstruction()` in `js/audio.js`; rest timing in `runRestPeriod()` in `js/session/sequencer.js`.

## File map

```
index.html              Entry point (GitHub Pages)
css/tokens.css          Colors, fonts
css/layout.css          Setup page, sequence builder
css/session.css         Session orb, overlays
js/main.js              Boot wiring
js/audio.js             Sounds, voice, 9 tonal profiles
js/techniques/          Technique engines
js/session/             Sequencer, constants, duration estimates, UI controller
js/ui/drag-sequence.js  Sequence builder
legacy/                 Original single-file app
```

## Sound options (per technique row)

Singing Bowl, Tibetan Bowl, Crystal Bowl, Deep Gong, Wind Chime, Hand Pan, Soft Beep, Quartz Tone, Warm Pulse, Voice Male/Female.

Box Breathing with tonal sounds: 4 distinct pitches per breath (in → hold → out → hold).

Transitions between techniques: spoken "Next: …" then after 25s "Starting …" (30s total break).

## How to test

1. **Open locally:** serve the folder (ES modules need HTTP). Example: `npx serve .` then open the URL on phone/PC.
2. **Default load:** sequence shows Box Breathing (1), Burst Detox (3), Pulse Meditation (1); total ~14 min 52 sec.
3. **GitHub Pages:** push repo; open your Pages URL on mobile.
4. **Box Breathing, rest=20, Full guidance:** hear "Rest" twice (after first 8 and second 8 breaths); "Starting again" ~5s before each rest ends; no rest after 6 breaths.
5. **Burst Detox, 3 sets, rest=20, Full guidance:** hear "Rest" + "Starting again" twice between sets; no rest after set 3.
6. **Pulse Meditation → Burst Detox:** no rest after Pulse Meditation's last set; hear "Next: Burst Detox" immediately (Full or Technique changes only).
7. **Technique changes only:** no Rest / Starting again; transitions and first Starting still spoken.
8. **Vocal guidance Off:** no instructional speech; row breath sounds still play.
9. **rest=0:** no rest pauses or rest speech.
10. **rest≤5:** "Rest" at start only (Full mode); no "Starting again".
11. **Duration UI:** change sets or rest on a row — per-row time and total update immediately.
12. **Stop early:** hold 1s during session → hear "Session stopped" (Full guidance only).

## Session flow

Setup (eyes open) → Begin → Ready → hold 1s → techniques run in order → Session complete (spoken + overlay) → Practice Again.
