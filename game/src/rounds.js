// rounds.js — the three rounds of one night in the observatory.
//
// Each round re-lights the same room (evening, midnight, eclipse), hides a
// fresh twelve differences from the catalogue, and tightens the clock and
// the player's purse of hints. Scoring lives here too, so the shape of a
// game — three rounds, rising pressure — can be read in one file.

export const ROUNDS = [
  {
    title: 'Round 1 — Evening',
    phase: 'evening',
    seconds: 240,
    hints: 3,
    seed: 1101,
    blurb: 'Lamplight and first stars. Twelve differences hide in the room.',
    differences: [
      'planet-missing', 'flame-out', 'gear-color', 'moon-crescent',
      'chart-label', 'book-missing', 'needle-move', 'cat-tail',
      'telescope-ring', 'star-missing', 'candle-height', 'lantern-dark',
    ],
  },
  {
    title: 'Round 2 — Midnight',
    phase: 'midnight',
    seconds: 210,
    hints: 2,
    seed: 2202,
    blurb: 'The room cools and the changes shrink. Twelve more, slyer ones.',
    differences: [
      'gear-tooth', 'constellation-line', 'planet-color', 'gauge-needle',
      'flame-right-out', 'astrolabe-ring', 'star-cluster', 'book-color',
      'chain-links', 'dial-text', 'orrery-ring', 'rug-stripe',
    ],
  },
  {
    title: 'Round 3 — The Eclipse',
    phase: 'eclipse',
    seconds: 180,
    hints: 2,
    seed: 3303,
    blurb: 'The moon goes black and the room dims to ember. Twelve whispers.',
    differences: [
      'gear-rotation', 'star-faint', 'chart-star', 'gauge-needle-two',
      'quill-side', 'candle-drip', 'planet-small', 'corona-ray',
      'book-tilt', 'telescope-knob', 'cat-ear', 'dial-tick',
    ],
  },
];

export const SCORE = {
  find: 100, // points per difference found
  hintCost: 40, // points a hint takes away
  missSeconds: 5, // countdown seconds a misclick takes away
  missPoints: 25, // points a misclick takes away
  secondBonus: 2, // points per second left when a round is cleared
};
