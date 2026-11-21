// scene3d.js — assembles the whole observatory for one round: the room
// shell and the instruments under the round's light, with a camera that
// frames the diorama for the panel. It merges the room's and the props'
// difference handlers and anchors into one registry, so the panel painter
// can say "apply these twelve differences" without knowing where they live.

const THREE = window.THREE;

import { PHASES } from './palette.js';
import { buildRoom } from './scene3d-room.js';
import { buildProps } from './scene3d-props.js';

// The light of each phase: a hemisphere wash, and the moonlight that falls
// through the slit and throws the room's shadows.
const PHASE_LIGHT = {
  evening: { hemiSky: 0x8fa3cc, hemiGround: 0x3a2716, hemi: 0.55, moon: 0xbfd0ff, moonIntensity: 1.15 },
  midnight: { hemiSky: 0x5f74b8, hemiGround: 0x1c2030, hemi: 0.5, moon: 0xcfe0ff, moonIntensity: 1.45 },
  eclipse: { hemiSky: 0x6a4a6a, hemiGround: 0x20131a, hemi: 0.42, moon: 0xffd9c0, moonIntensity: 0.5 },
};

// The environment reflection map is built once and shared by every round:
// metals need it to shine, and building it per round would waste seconds.
let environmentTexture = null;

function environmentFor(renderer) {
  if (environmentTexture || !renderer || !THREE.RoomEnvironment) return environmentTexture;
  const pmrem = new THREE.PMREMGenerator(renderer);
  environmentTexture = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  return environmentTexture;
}

export function buildObservatory(phaseName, renderer) {
  const P = PHASES[phaseName];
  const light = PHASE_LIGHT[phaseName];
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(P.skyBottom);
  scene.fog = new THREE.Fog(P.skyBottom, 55, 120);

  const env = environmentFor(renderer);
  if (env) {
    scene.environment = env;
    if ('environmentIntensity' in scene) scene.environmentIntensity = 0.35;
  }

  const room = buildRoom(P, phaseName);
  const props = buildProps(P);
  scene.add(room.group, props.group);

  const hemi = new THREE.HemisphereLight(light.hemiSky, light.hemiGround, light.hemi);
  scene.add(hemi);
  const moonlight = new THREE.DirectionalLight(light.moon, light.moonIntensity);
  moonlight.position.set(14, 26, 16);
  moonlight.castShadow = true;
  moonlight.shadow.mapSize.set(1024, 1024);
  moonlight.shadow.camera.left = -22;
  moonlight.shadow.camera.right = 22;
  moonlight.shadow.camera.top = 24;
  moonlight.shadow.camera.bottom = -6;
  moonlight.shadow.camera.near = 1;
  moonlight.shadow.camera.far = 90;
  moonlight.shadow.bias = -0.0006;
  scene.add(moonlight);
  const fill = new THREE.DirectionalLight(0xffe0b3, 0.28);
  fill.position.set(-12, 10, 30);
  scene.add(fill);

  const camera = new THREE.PerspectiveCamera(46, 600 / 640, 0.1, 300);
  camera.position.set(0, 10.2, 44);
  camera.lookAt(0, 10.6, 0);

  const anchors = new Map([...room.anchors, ...props.anchors]);
  const handlers = new Map([...room.handlers, ...props.handlers]);

  return {
    scene,
    camera,
    anchors,
    setDifference(id, on) {
      const handler = handlers.get(id);
      if (handler) handler(on);
    },
    hasDifference(id) {
      return handlers.has(id);
    },
  };
}
