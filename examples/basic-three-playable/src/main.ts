import { createEndCardTrigger, createStats } from '@replayablejs/devtools';
import { playable } from '@replayablejs/runtime';
import { createThree } from '@replayablejs/three';
import { createMeshoptIntegration } from '@replayablejs/three/meshopt';
import { Color, PCFShadowMap } from 'three';

import { loadImage } from './loaders/load-image';
import { createCamera } from './scene/create-camera';
import { createMainScene } from './scene/create-main-scene';

// Install the renderer and its asset loaders before readiness starts loading.
// Replayable owns the canvas, rendering loop, and camera aspect on resize.
playable.loader.register('sprites', loadImage);

const three = createThree({
  camera: createCamera(),
  integrations: [createMeshoptIntegration()],
});
three.scene.background = new Color('#dce8ec');
three.renderer.shadowMap.enabled = true;
three.renderer.shadowMap.type = PCFShadowMap;

await playable.ready();

// Compose the scene after its primary assets have loaded.
createMainScene({
  scene: three.scene,
  camera: three.camera,
});

createStats();
createEndCardTrigger();

// Sounds and end-card artwork load in the background after gameplay is ready.
void playable.loader.load('secondary');
