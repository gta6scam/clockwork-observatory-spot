// scene3d-room.js — the observatory's shell in Three.js: the back wall, the
// plank floor, the rug, and the great dome whose slit is a true hole cut by
// an alpha map, with the night sky, the moon and its eclipse corona behind
// it. The differences that live in the room itself — the moon's phase, the
// slit stars, a corona ray, the rug's stripe — register their handlers and
// anchors here; the instruments live in scene3d-props.js.
//
// Every builder in this family returns the same contract:
//   { group, anchors: Map<id, Object3D>, handlers: Map<id, (on) => void> }
// so scene3d.js can merge them without knowing what they built.

const THREE = window.THREE;

import { makeRng } from './rng.js';
import {
  makeFloorTexture, makeRugTexture, makeGlowTexture, makeRayTexture, makeDomeAlphaTexture,
} from './textures.js';

function anchorAt(x, y, z) {
  const anchor = new THREE.Object3D();
  anchor.position.set(x, y, z);
  return anchor;
}

function starSprite(glowTexture, color, x, y, z, scale) {
  const material = new THREE.SpriteMaterial({
    map: glowTexture, color, transparent: true, depthWrite: false,
  });
  const sprite = new THREE.Sprite(material);
  sprite.position.set(x, y, z);
  sprite.scale.set(scale, scale, 1);
  return sprite;
}

export function buildRoom(P, phaseName) {
  const group = new THREE.Group();
  const anchors = new Map();
  const handlers = new Map();
  const glowTexture = makeGlowTexture();

  // ——— Floor and wall ———
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 24),
    new THREE.MeshStandardMaterial({ map: makeFloorTexture(), roughness: 0.9, metalness: 0.05 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, 9);
  floor.receiveShadow = true;
  group.add(floor);

  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(38, 20),
    new THREE.MeshStandardMaterial({ color: P.wall, roughness: 0.95, metalness: 0.02 }),
  );
  wall.position.set(0, 10, -0.4);
  wall.receiveShadow = true;
  group.add(wall);

  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(38, 0.32, 0.2),
    new THREE.MeshStandardMaterial({ color: P.brassDark, roughness: 0.5, metalness: 0.7 }),
  );
  rail.position.set(0, 0.55, -0.25);
  group.add(rail);

  // ——— The rug ———
  const rugTextures = {
    true_: makeRugTexture('#2e7f76'),
    altered: makeRugTexture('#c9973f'),
  };
  const rug = new THREE.Mesh(
    new THREE.CircleGeometry(7.4, 40),
    new THREE.MeshStandardMaterial({ map: rugTextures.true_, roughness: 0.96 }),
  );
  rug.rotation.x = -Math.PI / 2;
  rug.scale.set(1, 0.36, 1);
  rug.position.set(0, 0.05, 10.8);
  rug.receiveShadow = true;
  group.add(rug);
  handlers.set('rug-stripe', (on) => {
    rug.material.map = on ? rugTextures.altered : rugTextures.true_;
    rug.material.needsUpdate = true;
  });
  anchors.set('rug-stripe', anchorAt(-6.2, 0.2, 10.8));

  // ——— The sky behind the dome ———
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(70, 24, 16),
    new THREE.MeshBasicMaterial({ color: P.skyBottom, side: THREE.BackSide }),
  );
  sky.position.set(0, 12, 0);
  group.add(sky);

  const rng = makeRng(4242);
  const starPositions = [];
  for (let i = 0; i < 380; i++) {
    const theta = Math.acos(1 - rng() * 0.95); // upper sky
    const phi = rng() * Math.PI * 2;
    const r = 66;
    starPositions.push(
      r * Math.sin(theta) * Math.cos(phi),
      12 + r * Math.cos(theta),
      r * Math.sin(theta) * Math.sin(phi),
    );
  }
  const starGeometry = new THREE.BufferGeometry();
  starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starPositions, 3));
  const skyStars = new THREE.Points(starGeometry, new THREE.PointsMaterial({
    color: P.star, size: 0.85, transparent: true, opacity: 0.9, depthWrite: false,
  }));
  group.add(skyStars);

  // ——— The dome, with its slit knocked out by the alpha map ———
  const domeGroup = new THREE.Group();
  domeGroup.position.set(0, 17.4, -0.3);
  domeGroup.scale.set(1, 0.62, 0.52);
  group.add(domeGroup);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(15.8, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshStandardMaterial({
      color: P.dome, roughness: 0.9, metalness: 0.12,
      alphaMap: makeDomeAlphaTexture(), alphaTest: 0.5, side: THREE.DoubleSide,
    }),
  );
  domeGroup.add(dome);

  const ribMaterial = new THREE.MeshStandardMaterial({ color: P.domeRib, roughness: 0.6, metalness: 0.5 });
  for (const rotY of [-0.9, -0.45, 0, 0.45, 0.9]) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(15.8, 0.11, 8, 48, Math.PI), ribMaterial);
    rib.rotation.y = rotY;
    domeGroup.add(rib);
  }
  for (const [theta, tube] of [[0.6, 0.1], [1.05, 0.09]]) {
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(15.8 * Math.sin(theta), tube, 8, 48), ribMaterial,
    );
    band.rotation.x = Math.PI / 2;
    band.position.y = 15.8 * Math.cos(theta);
    domeGroup.add(band);
  }
  const domeBase = new THREE.Mesh(new THREE.TorusGeometry(15.8, 0.2, 8, 48), ribMaterial);
  domeBase.rotation.x = Math.PI / 2;
  domeGroup.add(domeBase);

  // ——— The moon, its crescent bite and its eclipse corona ———
  const moonPos = new THREE.Vector3(6.3, 27.9, 3.9);
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(2.0, 28, 20),
    new THREE.MeshBasicMaterial({ color: phaseName === 'eclipse' ? '#0b0b12' : P.moon }),
  );
  moon.position.copy(moonPos);
  group.add(moon);
  const moonGlow = starSprite(glowTexture, 0xcfd8ff, moonPos.x, moonPos.y, moonPos.z - 0.5, 9);
  moonGlow.material.opacity = phaseName === 'eclipse' ? 0.25 : 0.4;
  group.add(moonGlow);

  const crescent = new THREE.Mesh(
    new THREE.SphereGeometry(1.86, 24, 18),
    new THREE.MeshBasicMaterial({ color: P.skyTop }),
  );
  crescent.position.copy(moonPos).add(new THREE.Vector3(1.05, 0.32, 0.95));
  crescent.visible = false;
  group.add(crescent);
  handlers.set('moon-crescent', (on) => { crescent.visible = on; });
  // The anchor sits on the moon's visible lower crescent, not its centre:
  // the disc's centre projects just above the panel's top edge, which would
  // put the click target (and the found ring) outside the frame.
  anchors.set('moon-crescent', anchorAt(moonPos.x, moonPos.y - 1.0, moonPos.z));

  // The corona: eight gradient rays in the moon's plane, eclipse only.
  const corona = new THREE.Group();
  const rayTexture = makeRayTexture();
  const rays = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.4;
    const geometry = new THREE.PlaneGeometry(0.55, 2.6 + (i % 2) * 0.9);
    geometry.translate(0, geometry.parameters.height / 2, 0);
    const ray = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({
      map: rayTexture, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    }));
    ray.position.copy(moonPos).add(new THREE.Vector3(Math.cos(a) * 2.1, Math.sin(a) * 2.1, -0.2));
    ray.rotation.z = a - Math.PI / 2;
    rays.push(ray);
    corona.add(ray);
  }
  const coronaRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.12, 0.055, 8, 40),
    new THREE.MeshBasicMaterial({ color: 0xeef2ff }),
  );
  coronaRing.position.copy(moonPos);
  corona.add(coronaRing);
  corona.visible = phaseName === 'eclipse';
  group.add(corona);
  // Ray 7 is the one ray of the crown that crosses the visible sky strip:
  // it points right and slightly down, in frame beside the black moon. The
  // upward rays leave the frame entirely, so a missing one could never be
  // spotted; the meddler takes ray 7 instead, and the anchor rides its middle.
  handlers.set('corona-ray', (on) => { rays[7].visible = !on; });
  anchors.set('corona-ray', anchorAt(moonPos.x + 3.4, moonPos.y - 1.4, moonPos.z));

  // ——— The named stars of the slit ———
  // The faint star hangs low in the slit, inside the frame: at its first
  // height its glow never entered the panel, and a faded star nobody can
  // see is no difference at all.
  const faintStar = starSprite(glowTexture, P.star, 4.6, 27.3, 3.4, 1.25);
  const missingStar = starSprite(glowTexture, P.star, 8.8, 25.6, 4.6, 1.5);
  const cluster = [
    starSprite(glowTexture, P.star, 10.4, 23.9, 5.0, 1.15),
    starSprite(glowTexture, P.star, 11.5, 23.1, 5.2, 0.95),
    starSprite(glowTexture, P.star, 10.9, 22.2, 5.1, 1.0),
  ];
  group.add(faintStar, missingStar, ...cluster);
  handlers.set('star-faint', (on) => { faintStar.material.opacity = on ? 0.13 : 1; });
  handlers.set('star-missing', (on) => { missingStar.visible = !on; });
  handlers.set('star-cluster', (on) => { cluster[2].visible = !on; });
  anchors.set('star-faint', anchorAt(4.6, 27.3, 3.4));
  anchors.set('star-missing', anchorAt(8.8, 25.6, 4.6));
  anchors.set('star-cluster', anchorAt(10.9, 23.0, 5.1));

  return { group, anchors, handlers };
}
