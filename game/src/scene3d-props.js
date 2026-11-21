// scene3d-props.js — the observatory's instruments and furniture in
// Three.js: the gear train, the barometer and gauges, the star charts, the
// hanging lantern, the great telescope, the candelabrum, the desk with its
// books, astrolabe, ink and candle, the orrery, and the cat on the rug.
//
// Each object is built from primitives with real materials and lights, and
// each difference that lives in it registers a handler that changes the
// scene graph — a planet's mesh hidden, a needle's rotation swung, a gear's
// tooth removed, a flame's sprite put out — plus an anchor Object3D at the
// feature, which scene-paint.js projects into panel pixels for the markers
// and the clicking.

const THREE = window.THREE;

import {
  makeChartTexture, makeBarometerTexture, makeGaugeTexture, makeFlameTexture,
  LYRA_POINTS, LYRA_LINES, CYGNUS_POINTS, CYGNUS_LINES,
} from './textures.js';

function anchorAt(parent, x, y, z) {
  const anchor = new THREE.Object3D();
  anchor.position.set(x, y, z);
  parent.add(anchor);
  return anchor;
}

function shadowed(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildProps(P) {
  const group = new THREE.Group();
  const anchors = new Map();
  const handlers = new Map();

  const brass = new THREE.MeshStandardMaterial({ color: P.brass, metalness: 0.85, roughness: 0.34 });
  const brassDark = new THREE.MeshStandardMaterial({ color: P.brassDark, metalness: 0.8, roughness: 0.45 });
  const copper = new THREE.MeshStandardMaterial({ color: P.copper, metalness: 0.85, roughness: 0.38 });
  const woodDark = new THREE.MeshStandardMaterial({ color: 0x3a2410, roughness: 0.9 });
  const woodMid = new THREE.MeshStandardMaterial({ color: 0x5d3c1a, roughness: 0.85 });
  const ironDark = new THREE.MeshStandardMaterial({ color: 0x241d16, metalness: 0.6, roughness: 0.6 });
  const flameTexture = makeFlameTexture();

  const flameSprite = (x, y, z, scale) => {
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({
      map: flameTexture, transparent: true, depthWrite: false,
    }));
    sprite.position.set(x, y, z);
    sprite.scale.set(scale, scale * 1.25, 1);
    return sprite;
  };

  // ——— The star charts ———
  const lyraTextures = {
    base: makeChartTexture({ label: 'LYRA', points: LYRA_POINTS, lines: LYRA_LINES }),
    label: makeChartTexture({ label: 'LYRE', points: LYRA_POINTS, lines: LYRA_LINES }),
    star: makeChartTexture({ label: 'LYRA', points: LYRA_POINTS, lines: LYRA_LINES, skipStar: 1 }),
  };
  const cygnusTextures = {
    base: makeChartTexture({ label: 'CYGNUS', points: CYGNUS_POINTS, lines: CYGNUS_LINES }),
    line: makeChartTexture({ label: 'CYGNUS', points: CYGNUS_POINTS, lines: CYGNUS_LINES, skipLine: [2, 5] }),
  };
  function makeChart(texture, x, y) {
    const chart = new THREE.Group();
    const frame = shadowed(new THREE.Mesh(new THREE.BoxGeometry(6.4, 4.95, 0.18), woodDark));
    chart.add(frame);
    const face = new THREE.Mesh(
      new THREE.PlaneGeometry(5.9, 4.45),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.85 }),
    );
    face.position.z = 0.1;
    chart.add(face);
    chart.position.set(x, y, 0.3);
    group.add(chart);
    return face;
  }
  const lyraFace = makeChart(lyraTextures.base, -11.3, 13.1);
  const cygnusFace = makeChart(cygnusTextures.base, -11.3, 8.5);
  handlers.set('chart-label', (on) => { lyraFace.material.map = on ? lyraTextures.label : lyraTextures.base; });
  handlers.set('chart-star', (on) => { lyraFace.material.map = on ? lyraTextures.star : lyraTextures.base; });
  handlers.set('constellation-line', (on) => { cygnusFace.material.map = on ? cygnusTextures.line : cygnusTextures.base; });
  anchors.set('chart-label', anchorAt(group, -11.3, 11.3, 0.5));
  anchors.set('chart-star', anchorAt(group, -11.66, 13.66, 0.5));
  anchors.set('constellation-line', anchorAt(group, -11.3, 8.5, 0.5));

  // ——— The hanging lantern ———
  const lantern = new THREE.Group();
  lantern.position.set(-10.4, 0, 1.9);
  group.add(lantern);
  const chainLinks = [];
  for (let i = 0; i < 10; i++) {
    const link = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.05, 6, 12), brassDark);
    link.position.y = 21.5 - i * 0.52;
    link.rotation.y = (i % 2) * Math.PI / 2;
    chainLinks.push(link);
    lantern.add(link);
  }
  handlers.set('chain-links', (on) => {
    chainLinks[4].visible = !on;
    chainLinks[5].visible = !on;
  });
  anchors.set('chain-links', anchorAt(lantern, 0, 19.2, 0));
  const lanternGlass = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 1.15, 0.95),
    new THREE.MeshStandardMaterial({
      color: 0xffc37a, emissive: 0xff9a30, emissiveIntensity: 0.95, transparent: true, opacity: 0.9,
    }),
  );
  lanternGlass.position.y = 15.9;
  lantern.add(lanternGlass);
  for (const [cx, cz] of [[-0.5, -0.5], [0.5, -0.5], [-0.5, 0.5], [0.5, 0.5]]) {
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.35, 0.1), brassDark);
    post.position.set(cx, 15.9, cz);
    lantern.add(post);
  }
  const lanternCap = new THREE.Mesh(new THREE.ConeGeometry(0.85, 0.55, 4), brass);
  lanternCap.position.y = 16.85;
  lanternCap.rotation.y = Math.PI / 4;
  lantern.add(lanternCap);
  const lanternFlame = flameSprite(0, 15.85, 0, 0.62);
  lantern.add(lanternFlame);
  const lanternLight = new THREE.PointLight(0xffa050, 26, 19, 2);
  lanternLight.position.set(0, 15.9, 0.8);
  lantern.add(lanternLight);
  handlers.set('lantern-dark', (on) => {
    lanternGlass.material.emissiveIntensity = on ? 0.02 : 0.95;
    lanternFlame.visible = !on;
    lanternLight.intensity = on ? 0 : 26;
  });
  anchors.set('lantern-dark', anchorAt(lantern, 0, 15.9, 0.4));

  // ——— Dials: the barometer and the two gauges ———
  function makeDial(r, faceTexture, x, y) {
    const dial = new THREE.Group();
    const rim = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.34, 32), brassDark));
    rim.rotation.x = Math.PI / 2;
    dial.add(rim);
    const face = new THREE.Mesh(
      new THREE.CircleGeometry(r * 0.92, 32),
      new THREE.MeshStandardMaterial({ map: faceTexture, roughness: 0.8 }),
    );
    face.position.z = 0.18;
    dial.add(face);
    const needlePivot = new THREE.Group();
    needlePivot.position.z = 0.26;
    const needle = new THREE.Mesh(
      new THREE.BoxGeometry(0.09, r * 0.74, 0.04),
      new THREE.MeshStandardMaterial({ color: 0x8c1f28, roughness: 0.5 }),
    );
    needle.geometry.translate(0, r * 0.3, 0);
    needlePivot.add(needle);
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.1, 12), brassDark);
    pin.rotation.x = Math.PI / 2;
    pin.position.z = 0.26;
    dial.add(needlePivot, pin);
    dial.position.set(x, y, 0.45);
    group.add(dial);
    return { dial, face, needlePivot };
  }

  const barometerTextures = {
    base: makeBarometerTexture({ word: 'FAIR', topTick: true }),
    text: makeBarometerTexture({ word: 'STORMY', topTick: true }),
    tick: makeBarometerTexture({ word: 'FAIR', topTick: false }),
  };
  const barometer = makeDial(1.55, barometerTextures.base, -4.9, 11.4);
  barometer.needlePivot.rotation.z = -0.55;
  handlers.set('needle-move', (on) => { barometer.needlePivot.rotation.z = on ? 1.15 : -0.55; });
  handlers.set('dial-text', (on) => { barometer.face.material.map = on ? barometerTextures.text : barometerTextures.base; });
  handlers.set('dial-tick', (on) => { barometer.face.material.map = on ? barometerTextures.tick : barometerTextures.base; });
  anchors.set('needle-move', anchorAt(group, -4.9, 11.4, 0.6));
  anchors.set('dial-text', anchorAt(group, -4.9, 10.55, 0.6));
  anchors.set('dial-tick', anchorAt(group, -4.9, 12.75, 0.6));

  const gaugeTexture = makeGaugeTexture();
  const gaugeOne = makeDial(0.78, gaugeTexture, 7.3, 13.8);
  gaugeOne.needlePivot.rotation.z = -0.5;
  const gaugeTwo = makeDial(0.78, gaugeTexture, 10.3, 14.3);
  gaugeTwo.needlePivot.rotation.z = 0.14;
  handlers.set('gauge-needle', (on) => { gaugeOne.needlePivot.rotation.z = on ? 0.85 : -0.5; });
  handlers.set('gauge-needle-two', (on) => { gaugeTwo.needlePivot.rotation.z = on ? 0.62 : 0.14; });
  anchors.set('gauge-needle', anchorAt(group, 7.3, 13.8, 0.6));
  anchors.set('gauge-needle-two', anchorAt(group, 10.3, 14.3, 0.6));

  // ——— The gear train ———
  function makeGear(r, teeth, material) {
    const gear = new THREE.Group();
    const disc = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.88, 0.5, 36), material));
    disc.rotation.x = Math.PI / 2;
    gear.add(disc);
    const toothGeometry = new THREE.BoxGeometry(r * 0.3, r * 0.25, 0.5);
    const toothMeshes = [];
    for (let i = 0; i < teeth; i++) {
      const a = Math.PI / 2 + (i / teeth) * Math.PI * 2;
      const tooth = shadowed(new THREE.Mesh(toothGeometry, material));
      tooth.position.set(Math.cos(a) * r * 0.97, Math.sin(a) * r * 0.97, 0);
      tooth.rotation.z = a;
      toothMeshes.push(tooth);
      gear.add(tooth);
    }
    const faceRing = new THREE.Mesh(new THREE.TorusGeometry(r * 0.6, 0.06, 8, 36), brassDark);
    faceRing.position.z = 0.27;
    gear.add(faceRing);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.2, r * 0.2, 0.72, 16), brassDark);
    hub.rotation.x = Math.PI / 2;
    gear.add(hub);
    return { gear, toothMeshes, disc };
  }
  const bigGear = makeGear(2.8, 12, brass);
  bigGear.gear.position.set(9.0, 11.6, 1.0);
  bigGear.gear.rotation.z = 0.26;
  group.add(bigGear.gear);
  handlers.set('gear-color', (on) => {
    const material = on ? copper : brass;
    bigGear.disc.material = material;
    for (const tooth of bigGear.toothMeshes) tooth.material = material;
  });
  anchors.set('gear-color', anchorAt(group, 9.0, 11.6, 1.2));

  const midGear = makeGear(1.9, 10, brass);
  midGear.gear.position.set(12.8, 7.2, 1.0);
  group.add(midGear.gear);
  handlers.set('gear-tooth', (on) => { midGear.toothMeshes[0].visible = !on; });
  anchors.set('gear-tooth', anchorAt(group, 12.8, 9.15, 1.2));

  const smallGear = makeGear(1.6, 9, brass);
  smallGear.gear.position.set(6.1, 6.9, 1.0);
  group.add(smallGear.gear);
  handlers.set('gear-rotation', (on) => { smallGear.gear.rotation.z = on ? Math.PI / 9 : 0; });
  anchors.set('gear-rotation', anchorAt(group, 6.1, 6.9, 1.2));

  const tinyGear = makeGear(1.0, 8, copper);
  tinyGear.gear.position.set(11.6, 14.9, 1.0);
  tinyGear.gear.rotation.z = 0.5;
  group.add(tinyGear.gear);

  // ——— The great telescope ———
  const telescope = new THREE.Group();
  telescope.position.set(-5.6, 0, 4.8);
  group.add(telescope);
  const pier = shadowed(new THREE.Mesh(new THREE.BoxGeometry(1.7, 5.4, 1.7), woodDark));
  pier.position.y = 2.7;
  telescope.add(pier);
  const pierBase = shadowed(new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.4, 2.5), woodMid));
  pierBase.position.y = 0.2;
  telescope.add(pierBase);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 1.15, 20), brass);
  hub.rotation.z = Math.PI / 2;
  hub.position.set(0.5, 5.9, -0.2);
  telescope.add(hub);

  const tubeGroup = new THREE.Group();
  tubeGroup.position.set(0.5, 5.9, -0.2);
  tubeGroup.rotation.z = -1.02;
  telescope.add(tubeGroup);
  const tubeMaterial = new THREE.MeshStandardMaterial({ color: 0x7a4d1c, metalness: 0.65, roughness: 0.38 });
  const tube = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.52, 8.8, 24), tubeMaterial));
  tube.geometry.translate(0, 4.4, 0);
  tubeGroup.add(tube);
  const tubeRings = [];
  for (const y of [0.7, 4.4, 8.3]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.7, 0.1, 8, 24), brass);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = y;
    tubeRings.push(ring);
    tubeGroup.add(ring);
  }
  handlers.set('telescope-ring', (on) => { tubeRings[1].visible = !on; });
  anchors.set('telescope-ring', anchorAt(tubeGroup, 0, 4.4, 0.95));
  const objective = new THREE.Mesh(
    new THREE.CircleGeometry(0.6, 24),
    new THREE.MeshStandardMaterial({ color: 0x9fd4e8, emissive: 0x2a4a5e, roughness: 0.15, metalness: 0.2 }),
  );
  objective.rotation.x = -Math.PI / 2;
  objective.position.y = 8.82;
  tubeGroup.add(objective);
  const eyepiece = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.19, 0.7, 12), ironDark);
  eyepiece.position.y = -0.5;
  tubeGroup.add(eyepiece);
  const finder = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 3.4, 10), brassDark);
  finder.geometry.translate(0, 1.7, 0);
  finder.position.set(0.78, 3.4, 0);
  tubeGroup.add(finder);
  const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.32, 12), brass);
  knob.rotation.x = Math.PI / 2;
  knob.position.set(0, 1.0, 0.68);
  tubeGroup.add(knob);
  handlers.set('telescope-knob', (on) => { knob.material = on ? ironDark : brass; });
  anchors.set('telescope-knob', anchorAt(tubeGroup, 0, 1.0, 1.0));

  // ——— The candelabrum ———
  const candelabrum = new THREE.Group();
  candelabrum.position.set(-10.5, 0, 5.8);
  group.add(candelabrum);
  const candleBase = shadowed(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 1.05, 0.2, 20), brassDark));
  candleBase.position.y = 0.1;
  candelabrum.add(candleBase);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.13, 5.6, 10), brassDark);
  stem.position.y = 3.0;
  candelabrum.add(stem);
  const arms = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.08, 8, 24, Math.PI), brassDark);
  arms.rotation.z = Math.PI;
  arms.position.y = 5.6;
  candelabrum.add(arms);
  const wax = new THREE.MeshStandardMaterial({ color: 0xefe3c2, roughness: 0.6 });
  const candleSpecs = [
    { x: -1.15, base: 5.6, h: 1.05 },
    { x: 0, base: 5.85, h: 1.6 },
    { x: 1.15, base: 5.6, h: 1.15 },
  ];
  const candleFlames = candleSpecs.map((spec) => {
    const candle = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, spec.h, 12), wax);
    candle.position.set(spec.x, spec.base + spec.h / 2, 0);
    candelabrum.add(candle);
    const flame = flameSprite(spec.x, spec.base + spec.h + 0.48, 0, 0.55);
    candelabrum.add(flame);
    return flame;
  });
  const candelabrumLight = new THREE.PointLight(0xff9a40, 34, 22, 2);
  candelabrumLight.position.set(0, 8.4, 1.4);
  candelabrum.add(candelabrumLight);
  handlers.set('flame-out', (on) => { candleFlames[1].visible = !on; });
  handlers.set('flame-right-out', (on) => { candleFlames[2].visible = !on; });
  anchors.set('flame-out', anchorAt(candelabrum, 0, 7.95, 0));
  anchors.set('flame-right-out', anchorAt(candelabrum, 1.15, 7.25, 0));

  // ——— The desk and its things ———
  const desk = new THREE.Group();
  group.add(desk);
  const deskTop = shadowed(new THREE.Mesh(new THREE.BoxGeometry(10.8, 0.5, 3.6), woodMid));
  deskTop.position.set(-1.6, 3.05, 5.4);
  desk.add(deskTop);
  for (const [lx, lz] of [[-6.4, 4.0], [3.2, 4.0], [-6.4, 6.8], [3.2, 6.8]]) {
    const leg = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.55, 2.8, 0.55), woodDark));
    leg.position.set(lx, 1.4, lz);
    desk.add(leg);
  }
  const bookColors = [0x274b63, 0x7e2434, 0x2e5d3a];
  const bookMeshes = bookColors.map((color, i) => {
    const book = shadowed(new THREE.Mesh(
      new THREE.BoxGeometry(3.0 - i * 0.12, 0.55, 2.1),
      new THREE.MeshStandardMaterial({ color, roughness: 0.7 }),
    ));
    book.position.set(-5.4 + i * 0.06, 3.58 + i * 0.56, 5.2);
    desk.add(book);
    return book;
  });
  handlers.set('book-missing', (on) => { bookMeshes[2].visible = !on; });
  handlers.set('book-color', (on) => { bookMeshes[1].material.color.set(on ? 0x274b63 : 0x7e2434); });
  anchors.set('book-missing', anchorAt(desk, -5.28, 4.7, 5.2));
  anchors.set('book-color', anchorAt(desk, -5.34, 4.15, 5.2));
  const leaningGeometry = new THREE.BoxGeometry(0.55, 2.3, 1.7);
  leaningGeometry.translate(0, 1.15, 0);
  const leaningBook = shadowed(new THREE.Mesh(
    leaningGeometry, new THREE.MeshStandardMaterial({ color: 0x6d4c12, roughness: 0.7 }),
  ));
  leaningBook.position.set(-3.35, 3.3, 5.2);
  leaningBook.rotation.z = -0.3;
  desk.add(leaningBook);
  handlers.set('book-tilt', (on) => { leaningBook.rotation.z = on ? -0.58 : -0.3; });
  anchors.set('book-tilt', anchorAt(desk, -3.1, 4.3, 5.2));

  const astrolabe = new THREE.Group();
  astrolabe.position.set(0.4, 3.3, 5.6);
  desk.add(astrolabe);
  const astroStand = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), brassDark);
  astroStand.position.y = 0.27;
  astrolabe.add(astroStand);
  const astroOuter = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.07, 8, 32), brass);
  astroOuter.position.y = 1.5;
  astrolabe.add(astroOuter);
  const astroInner = new THREE.Mesh(new THREE.TorusGeometry(0.6, 0.05, 8, 28), brass);
  astroInner.position.y = 1.5;
  astrolabe.add(astroInner);
  const astroBarH = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.07, 0.05), brass);
  astroBarH.position.y = 1.5;
  astrolabe.add(astroBarH);
  const astroBarV = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.7, 0.05), brass);
  astroBarV.position.y = 1.5;
  astrolabe.add(astroBarV);
  handlers.set('astrolabe-ring', (on) => { astroInner.visible = !on; });
  anchors.set('astrolabe-ring', anchorAt(astrolabe, 0, 1.5, 0.2));

  const inkPot = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.34, 0.5, 14),
    new THREE.MeshStandardMaterial({ color: 0x14100c, roughness: 0.35 }),
  );
  inkPot.position.set(2.5, 3.55, 5.8);
  desk.add(inkPot);
  const quill = new THREE.Group();
  quill.position.set(2.5, 3.75, 5.8);
  quill.rotation.z = 0.5;
  desk.add(quill);
  const quillShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.9, 8),
    new THREE.MeshStandardMaterial({ color: 0xe9e2d0, roughness: 0.6 }));
  quillShaft.position.y = 0.95;
  quill.add(quillShaft);
  const feather = new THREE.Mesh(new THREE.ConeGeometry(0.3, 1.8, 6),
    new THREE.MeshStandardMaterial({ color: 0xf2ecdc, roughness: 0.8 }));
  feather.scale.set(1, 1, 0.28);
  feather.position.y = 1.55;
  quill.add(feather);
  handlers.set('quill-side', (on) => { quill.rotation.z = on ? -0.5 : 0.5; });
  anchors.set('quill-side', anchorAt(desk, 2.5, 4.6, 5.8));

  const deskCandle = new THREE.Group();
  deskCandle.position.set(4.0, 3.42, 4.9);
  desk.add(deskCandle);
  const holder = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 0.14, 16), brassDark);
  holder.position.y = -0.05;
  deskCandle.add(holder);
  const deskCandleGeometry = new THREE.CylinderGeometry(0.17, 0.19, 1.5, 12);
  deskCandleGeometry.translate(0, 0.75, 0);
  const deskCandleMesh = new THREE.Mesh(deskCandleGeometry, wax);
  deskCandle.add(deskCandleMesh);
  const deskFlame = flameSprite(0, 1.95, 0, 0.5);
  deskCandle.add(deskFlame);
  const drip = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 0.5, 8), wax);
  drip.position.set(0.19, 1.05, 0);
  deskCandle.add(drip);
  const deskCandleLight = new THREE.PointLight(0xff9a40, 9, 13, 2);
  deskCandleLight.position.set(4.0, 5.8, 5.8);
  group.add(deskCandleLight);
  handlers.set('candle-height', (on) => {
    deskCandleMesh.scale.y = on ? 0.42 : 1;
    deskFlame.position.y = on ? 1.08 : 1.95;
    drip.visible = !on; // the drip lives on the tall candle's side
  });
  handlers.set('candle-drip', (on) => { drip.visible = !on; });
  anchors.set('candle-height', anchorAt(deskCandle, 0, 1.7, 0));
  anchors.set('candle-drip', anchorAt(deskCandle, 0.3, 1.05, 0));

  // ——— The orrery ———
  const orrery = new THREE.Group();
  group.add(orrery);
  const orreryTop = shadowed(new THREE.Mesh(new THREE.BoxGeometry(9.6, 0.45, 3.4), woodMid));
  orreryTop.position.set(9.0, 2.5, 6.6);
  orrery.add(orreryTop);
  for (const [lx, lz] of [[4.7, 5.3], [13.3, 5.3], [4.7, 7.9], [13.3, 7.9]]) {
    const leg = shadowed(new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.3, 0.5), woodDark));
    leg.position.set(lx, 1.15, lz);
    orrery.add(leg);
  }
  const column = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 2.6, 12), brassDark);
  column.position.set(9.0, 4.0, 6.6);
  orrery.add(column);
  const sun = new THREE.Mesh(
    new THREE.SphereGeometry(0.85, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0xcc7a10, emissive: 0xffa726, emissiveIntensity: 1.5 }),
  );
  sun.position.set(9.0, 6.05, 6.6);
  orrery.add(sun);
  const sunGlow = new THREE.Sprite(new THREE.SpriteMaterial({
    map: makeFlameTexture(), color: 0xffb340, transparent: true, opacity: 0.4, depthWrite: false,
  }));
  sunGlow.position.copy(sun.position);
  sunGlow.scale.set(4.6, 4.6, 1);
  orrery.add(sunGlow);

  function orreryArm(px, py, r, color) {
    const sx = 9.0;
    const sy = 6.05;
    const length = Math.hypot(px - sx, py - sy);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, length, 8), brass);
    arm.position.set((sx + px) / 2, (sy + py) / 2, 6.6);
    arm.rotation.z = Math.atan2(py - sy, px - sx) - Math.PI / 2;
    orrery.add(arm);
    const planet = shadowed(new THREE.Mesh(
      new THREE.SphereGeometry(r, 20, 14),
      new THREE.MeshStandardMaterial({ color, roughness: 0.45, metalness: 0.25 }),
    ));
    planet.position.set(px, py, 6.6);
    orrery.add(planet);
    return { arm, planet };
  }
  const smallPlanet = orreryArm(6.4, 7.0, 0.45, 0xc96f4a);
  handlers.set('planet-small', (on) => { smallPlanet.planet.scale.setScalar(on ? 0.6 : 1); });
  anchors.set('planet-small', anchorAt(orrery, 6.4, 7.0, 6.6));
  const ringedPlanet = orreryArm(6.8, 4.7, 0.5, 0xd9a441);
  const planetRing = new THREE.Mesh(new THREE.TorusGeometry(0.88, 0.06, 8, 28), brass);
  planetRing.position.copy(ringedPlanet.planet.position);
  planetRing.rotation.x = 1.15;
  planetRing.rotation.y = 0.3;
  orrery.add(planetRing);
  handlers.set('orrery-ring', (on) => { planetRing.visible = !on; });
  anchors.set('orrery-ring', anchorAt(orrery, 6.8, 4.7, 6.6));
  const bluePlanet = orreryArm(11.8, 5.1, 0.55, 0x3f7fbf);
  handlers.set('planet-color', (on) => { bluePlanet.planet.material.color.set(on ? 0x4fae62 : 0x3f7fbf); });
  anchors.set('planet-color', anchorAt(orrery, 11.8, 5.1, 6.6));
  const outerPlanet = orreryArm(12.5, 7.4, 0.6, 0xb8b0a4);
  handlers.set('planet-missing', (on) => {
    outerPlanet.planet.visible = !on;
    outerPlanet.arm.visible = !on;
  });
  anchors.set('planet-missing', anchorAt(orrery, 12.5, 7.4, 6.6));

  // ——— The cat, asleep on the rug ———
  const cat = new THREE.Group();
  cat.position.set(-1.5, 0, 10.9);
  group.add(cat);
  const fur = new THREE.MeshStandardMaterial({ color: 0x6b5136, roughness: 1 });
  const body = shadowed(new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), fur));
  body.scale.set(1.6, 0.6, 1.0);
  body.position.y = 0.55;
  cat.add(body);
  for (const off of [-0.5, 0.1, 0.7]) {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 1.1),
      new THREE.MeshStandardMaterial({ color: 0x2d2010, roughness: 1 }));
    stripe.position.set(off, 1.08, 0);
    stripe.rotation.z = off * 0.35;
    cat.add(stripe);
  }
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.58, 18, 12), fur);
  head.position.set(-1.55, 0.5, 0.15);
  cat.add(head);
  const earLeft = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 8), fur);
  earLeft.position.set(-1.78, 1.02, 0.15);
  earLeft.rotation.z = 0.15;
  cat.add(earLeft);
  const earRight = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.42, 8), fur);
  earRight.position.set(-1.32, 1.02, 0.15);
  earRight.rotation.z = -0.15;
  cat.add(earRight);
  handlers.set('cat-ear', (on) => { earRight.rotation.x = on ? 1.85 : 0; });
  anchors.set('cat-ear', anchorAt(cat, -1.3, 1.05, 0.15));
  const tailCurveUp = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.4, 0.35, 0), new THREE.Vector3(2.3, 0.3, -0.3), new THREE.Vector3(2.5, 0.95, -0.5),
  ]);
  const tailCurveDown = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.4, 0.3, 0), new THREE.Vector3(2.4, 0.16, 0.4), new THREE.Vector3(2.65, 0.35, 0.85),
  ]);
  const tailUp = new THREE.Mesh(new THREE.TubeGeometry(tailCurveUp, 12, 0.14, 8), fur);
  const tailDown = new THREE.Mesh(new THREE.TubeGeometry(tailCurveDown, 12, 0.14, 8), fur);
  tailDown.visible = false;
  cat.add(tailUp, tailDown);
  handlers.set('cat-tail', (on) => {
    tailUp.visible = !on;
    tailDown.visible = on;
  });
  anchors.set('cat-tail', anchorAt(cat, 2.5, 0.6, 0));

  return { group, anchors, handlers };
}
