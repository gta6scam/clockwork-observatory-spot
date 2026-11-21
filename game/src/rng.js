// rng.js — a tiny seeded random number generator (mulberry32).
//
// The observatory's star fields, dust motes and wood grain must come out the
// same on the left panel, the right panel and every screenshot, so nothing
// in the scene may call Math.random. Everything draws from a seeded stream
// created here; the same seed always paints the same sky.

export function makeRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A star field is a fixed list of points made once from a seed: the backdrop
// painter asks for the same list on both panels, so a star that a difference
// removes is removed by the painter, never by chance.
export function makeStarField(seed, count, width, height, maxRadius) {
  const rng = makeRng(seed);
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: rng() * width,
      y: rng() * height,
      r: 0.6 + rng() * maxRadius,
      tw: rng() * Math.PI * 2,
    });
  }
  return stars;
}
