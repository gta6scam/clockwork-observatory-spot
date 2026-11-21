// differences.js — the catalogue of every difference that can hide in the
// observatory. Each entry carries the radius (in panel pixels) a click must
// land inside; the position itself comes from the 3D scene, which projects
// each difference's anchor into the panel when the round is built. The left
// panel is always rendered with no differences; the right panel is rendered
// with the round's twelve.
//
// A difference is an object the scene painters consult by id: they draw the
// observatory one way when the id is absent and another way when it is
// present. Nothing here draws; this file is the map of hiding places.

export const DIFFERENCES = {
  // ——— Round 1, Evening: bold changes, to teach the eye ———
  'planet-missing': {
    name: 'The outer planet has left the orrery',
    hint: 'The orrery feels lighter on one side.',
    r: 18,
  },
  'flame-out': {
    name: 'The middle candle of the candelabrum is out',
    hint: 'Three candles stand together; count their flames.',
    r: 14,
  },
  'gear-color': {
    name: 'The great gear is copper, not brass',
    hint: 'The largest wheel on the wall has changed its metal.',
    r: 40,
  },
  'moon-crescent': {
    name: 'The full moon has waned to a crescent',
    hint: 'Look up, through the slit of the dome.',
    r: 20,
  },
  'chart-label': {
    name: 'The chart reads LYRE instead of LYRA',
    hint: 'Read the labels under the star charts.',
    r: 22,
  },
  'book-missing': {
    name: 'The top book of the desk stack is gone',
    hint: 'The pile of books on the desk is shorter.',
    r: 20,
  },
  'needle-move': {
    name: 'The barometer needle has swung',
    hint: 'The round instrument on the wall tells a different pressure.',
    r: 28,
  },
  'cat-tail': {
    name: 'The cat’s tail curls the other way',
    hint: 'Something stirs on the rug.',
    r: 16,
  },
  'telescope-ring': {
    name: 'A brass ring is missing from the telescope tube',
    hint: 'Run your eye along the telescope’s tube.',
    r: 16,
  },
  'star-missing': {
    name: 'A bright star in the slit is gone',
    hint: 'The sky in the slit has lost one of its lights.',
    r: 13,
  },
  'candle-height': {
    name: 'The desk candle has burned down short',
    hint: 'One candle is much nearer its end.',
    r: 16,
  },
  'lantern-dark': {
    name: 'The hanging lantern has gone dark',
    hint: 'Not every light in the room is still burning.',
    r: 20,
  },

  // ——— Round 2, Midnight: smaller changes, closer to the grain ———
  'gear-tooth': {
    name: 'The middle gear has lost a tooth',
    hint: 'Count the teeth of the middle wheel.',
    r: 16,
  },
  'constellation-line': {
    name: 'A line of the Cygnus constellation is missing',
    hint: 'One chart’s stars are no longer joined up.',
    r: 24,
  },
  'planet-color': {
    name: 'The blue planet has turned green',
    hint: 'One of the orrery’s worlds has changed its colour.',
    r: 15,
  },
  'gauge-needle': {
    name: 'The left gauge needle has crept round',
    hint: 'The small dials above the gears keep their own counsel.',
    r: 15,
  },
  'flame-right-out': {
    name: 'The right-hand candle of the candelabrum is out',
    hint: 'Count the candelabrum’s flames again.',
    r: 12,
  },
  'astrolabe-ring': {
    name: 'The astrolabe has lost its inner ring',
    hint: 'The brass instrument on the desk is incomplete.',
    r: 20,
  },
  'star-cluster': {
    name: 'One star of the slit cluster is missing',
    hint: 'A little knot of stars in the slit is thinner.',
    r: 13,
  },
  'book-color': {
    name: 'The middle book’s spine is blue, not red',
    hint: 'The desk books are not all the colours they were.',
    r: 16,
  },
  'chain-links': {
    name: 'The lantern chain is missing links',
    hint: 'The lantern hangs by less than it did.',
    r: 12,
  },
  'dial-text': {
    name: 'The barometer reads STORMY, not FAIR',
    hint: 'The barometer’s word has changed, whatever its needle says.',
    r: 16,
  },
  'orrery-ring': {
    name: 'The ringed planet has lost its ring',
    hint: 'One world on the orrery used to wear a ring.',
    r: 16,
  },
  'rug-stripe': {
    name: 'The rug’s border stripe has changed colour',
    hint: 'Even the rug is not quite as it was.',
    r: 15,
  },

  // ——— Round 3, Eclipse: the shy ones, hidden in the dimming light ———
  'gear-rotation': {
    name: 'The small gear has turned by half a tooth',
    hint: 'The smallest wheel sits differently in its mesh.',
    r: 28,
  },
  'star-faint': {
    name: 'A star in the slit has faded to a whisper',
    hint: 'One light in the slit is barely there.',
    r: 12,
  },
  'chart-star': {
    name: 'A star is missing from the Lyra chart',
    hint: 'The first chart’s pattern is one point short.',
    r: 14,
  },
  'gauge-needle-two': {
    name: 'The right gauge needle has shifted a notch',
    hint: 'The right-hand small dial has moved — barely.',
    r: 15,
  },
  'quill-side': {
    name: 'The quill leans the other way in its pot',
    hint: 'The writing things on the desk have been touched.',
    r: 13,
  },
  'candle-drip': {
    name: 'The desk candle’s wax drip is gone',
    hint: 'Wax remembers every hour — unless it doesn’t.',
    r: 11,
  },
  'planet-small': {
    name: 'The orrery’s smallest planet has shrunk',
    hint: 'One world is smaller than its orbit suggests.',
    r: 12,
  },
  'corona-ray': {
    name: 'One ray of the eclipse corona is missing',
    hint: 'The black sun’s crown is uneven.',
    r: 10,
  },
  'book-tilt': {
    name: 'The leaning book leans at a lazier angle',
    hint: 'A book against the stack has slumped.',
    r: 18,
  },
  'telescope-knob': {
    name: 'The telescope’s focuser knob is dark iron, not brass',
    hint: 'A small knob on the telescope has lost its shine.',
    r: 12,
  },
  'cat-ear': {
    name: 'The cat’s ear has folded flat',
    hint: 'The cat dreams on, but one ear has folded.',
    r: 11,
  },
  'dial-tick': {
    name: 'The barometer has lost its twelve-o’clock tick',
    hint: 'Count the barometer’s ticks from the top.',
    r: 11,
  },
};

// The twelve hiding places of a round, looked up by id.
export function differencesOf(ids) {
  return ids.map((id) => ({ id, ...DIFFERENCES[id] }));
}
