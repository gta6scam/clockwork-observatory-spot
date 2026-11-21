# The Clockwork Observatory

A spot-the-difference game in a steampunk observatory, rendered as a real
3D scene with Three.js. One night, three lights — Evening, Midnight, and
the Eclipse — and in each light a meddler has changed twelve things in the
room: among the gear train, the telescope, the orrery, the star charts,
the candles and the stars in the dome's slit.

[![Bounty](https://make.fun/badge/best-spot-the-difference-game-20261121-0451.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![Rank](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/gta6scam/clockwork-observatory-spot/rank.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)
[![Reward](https://make.fun/badge/best-spot-the-difference-game-20261121-0451/gta6scam/clockwork-observatory-spot/reward.svg)](https://make.fun/bounty/best-spot-the-difference-game-20261121-0451)

## How it plays

- The two panels are two renders of the **same 3D observatory** from the
  same camera: the left as it truly is, the right as the meddler left it.
- **12 differences per round**, hidden by design in the scene graph itself —
  a gear's tooth removed, a barometer needle swung, a candle put out, an
  orrery planet gone, a star missing from the slit.
- Click a difference on either panel (or steer the lens with the arrow
  keys / WASD and press Enter) to ring it on both panels with a brass
  marker. The **counter of what remains** never leaves the top of the
  screen.
- A **countdown** runs each round and the frame itself reddens as it runs
  out; a misclick costs 5 seconds and 25 points.
- **Hints** are limited per round and answer with a gentle pulse around
  the hiding place, never an outline.
- Sounds are synthesised live with WebAudio — no audio files.

## Structure

- `main.ts` — the hand-in program: copies `game/` and `screenshots/` to
  the output folder and writes `dossier.json` with the vendored library.
- `game/index.html` — the page, its head-up display and overlay screens.
- `game/vendor/three.min.js` — Three.js, vendored (not our source).
- `game/src/scene3d.js` — assembles the observatory per round and lights it.
- `game/src/scene3d-room.js` — the room shell: dome with a real sky slit,
  moon and corona, floor and rug.
- `game/src/scene3d-props.js` — the instruments and furniture, each
  registering its differences and anchors.
- `game/src/textures.js` — canvas-painted textures (star charts, dials,
  floor, rug, flames).
- `game/src/scene-paint.js` — renders both panels and projects the 3D
  anchors into panel pixels; draws markers, hint pulses and miss marks.
- `game/src/game.js` — the state machine: rounds, timer, scoring, input.
- `game/src/differences.js` / `rounds.js` — the catalogue of 36 hiding
  places and the three rounds that draw on it.
- `game/src/audio.js` — the synthesised sounds. `game/src/palette.js` —
  the three lights. `game/src/rng.js` — seeded randomness for star fields.

## Running it

Serve `game/` with any static server (for example `node serve.ts`) and
open it in a desktop browser. It plays fully offline.

## License

MIT — see `LICENSE`.
