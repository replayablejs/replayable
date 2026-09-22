# @replayablejs/three

Three.js rendering and model loading for Replayable. It connects a WebGL 2 renderer to the
shared canvas, screen resolution, and lifecycle-controlled frame loop.

## Usage

Install this package with compatible `three` and `@replayablejs/runtime` peers.
TypeScript applications also need `@types/three` matching their Three.js version.

```ts
import { PerspectiveCamera, Mesh, BoxGeometry, MeshNormalMaterial } from 'three';
import { createThree } from '@replayablejs/three';
import { playable } from '@replayablejs/runtime';

const camera = new PerspectiveCamera(40, 1, 0.1, 100);
camera.position.set(0, 1, 5);
camera.lookAt(0, 0, 0);

const three = createThree({ camera, antialias: true });
await playable.ready();

const geometry = new BoxGeometry();
const material = new MeshNormalMaterial();
three.scene.add(new Mesh(geometry, material));

// When the application ends this renderer's lifetime:
// three.destroy();
// geometry.dispose();
// material.dispose();
```

`createThree` is synchronous and does not call `playable.ready()`. It returns
`renderer`, `scene`, `camera`, and `destroy()`. The required camera is a Three.js
`PerspectiveCamera`. Automatic orthographic framing is not part of this foundation.

## Rendering and resizing

Replayable owns scheduling. Do not start another requestAnimationFrame loop or call
`renderer.setAnimationLoop()`. Rendering starts through the runtime after readiness
and pauses with runtime visibility. Callbacks use the runtime's subscription order;
use `playable.fixedUpdate` for simulation that must precede rendering.

Resizing uses the resolved frame width/height and resolution, rather than reading
window dimensions or devicePixelRatio independently. It changes camera aspect and
projection, preserving its position, field of view, near/far planes, and zoom.
Canvas CSS sizing remains owned by the shared canvas host.

The returned renderer and scene are ordinary Three.js objects. The application
configures lighting, shadows, tone mapping, background, and scene composition.

## Shared canvas and cleanup

The first renderer creates the WebGL 2 context and clears frames to the configured
playable background. A borrowing renderer reuses that context with automatic
clearing disabled. Context antialiasing and power preference are selected by the
first renderer and cannot be changed by a borrower. Coordinate render order and
any depth clearing when composing multiple renderers. Keep the owning renderer
alive until its borrowers are destroyed.

`destroy()` is idempotent. It stops frame and resize subscriptions, detaches scene
children, disposes renderer-owned resources, and removes the canvas only when this
instance owns it. It never forces context loss. Setup failures roll back acquired
resources, and cleanup continues even if an individual release throws.

Removing an object from a scene does not dispose its GPU resources. Application
geometry, materials, textures, render targets, and camera remain application-owned.
Dispose them explicitly when no remaining scene or model uses them.

## Standalone textures

`createThree()` registers the runtime's `textures` handler before readiness.
Loaded values in `playable.loader.cache.textures` are Three.js textures:

```ts
import { Texture, SRGBColorSpace } from 'three';

await playable.ready();
const texture = playable.loader.cache.textures?.['surfaces/wood'];
if (!(texture instanceof Texture)) throw new Error('Wood texture is not loaded.');
texture.colorSpace = SRGBColorSpace; // This image will be used as base color.
material.map = texture;
material.needsUpdate = true;
```

The playable chooses color space, wrapping, filtering, and UV orientation for the
intended material slot. Data maps, such as normals and roughness, keep the default
`NoColorSpace`. Build-time image scaling does not change normalized UVs. Embedded
GLB textures use `GLTFLoader` and do not need standalone texture registration.

Textures stay in the runtime cache when the renderer is destroyed. Call
`texture.dispose()` once no materials use it; texture disposal does not reset or
reload a runtime bundle.

## Models and animation

Create the integration before `playable.ready()` so its model handler is registered
before bundles load. Only one Three integration can register the runtime's model
handler. For a secondary bundle, await its load before creating its models.

```ts
import { createModel, disposeModelAsset } from '@replayablejs/three';

const three = createThree({ camera });
await playable.ready();

const character = createModel({ asset: 'characters/hero' });
three.scene.add(character.root);

const walk = character.animations.find((clip) => clip.name === 'Walk');
if (walk) character.mixer.clipAction(walk).play();

// The playable chooses when and how quickly this animation advances.
const stopAnimation = playable.fixedUpdate.add(({ deltaSeconds }) => {
  character.mixer.update(deltaSeconds);
});

// Later, stop application updates before destroying the instance:
stopAnimation();
character.destroy();
// Once no instances use this asset:
disposeModelAsset({ asset: 'characters/hero' });
```

Use the generated model asset ID. Models load through `GLTFLoader` from either
external URLs or inline data URIs. Missing model dependencies reject the load with
the asset ID, including image failures that Three.js would otherwise recover from.

Each `createModel()` call returns a separate object hierarchy, skeleton, and
animation mixer. Its `root` is the cloned default glTF scene. If placement needs to
be independent of authored or animated root transforms, the playable can add its
own wrapper group. Animation clips, geometry, materials, and textures
are shared between instances. Editing a shared material affects every instance;
applications that clone or replace resources must dispose their own replacements.

The playable owns animation timing and playback. The integration never advances
mixers or starts actions. Call `model.mixer.update(deltaSeconds)` from the playable's
chosen update loop. The example uses `fixedUpdate` to advance animation before
rendering. Stop application-owned update subscriptions before destroying a model
or its Three integration.

`model.destroy()` detaches an instance, stops its actions, and releases its skeleton
state. The playable owns instances and shared loaded resources. After destroying
all instances of an asset, call `disposeModelAsset({ asset })` to release its shared
geometry, materials, textures, and decoded image bitmaps.

`three.destroy()` unregisters the model handler and releases rendering resources;
it does not dispose cached assets or model instances. Already-started loads can
still finish and enter the runtime cache. Await pending bundle loads before final
asset cleanup. Runtime bundles are loaded once: disposing an asset does not reset
its bundle or permit new instances from the disposed template.

## Optional geometry decoders

Uncompressed GLBs need no integration. Import only the codec used by your assets:

```ts
import { createThree } from '@replayablejs/three';
import { createMeshoptIntegration } from '@replayablejs/three/meshopt';

const three = createThree({
  camera,
  integrations: [createMeshoptIntegration()],
});
await playable.ready();
```

For Draco, use the separate entry instead:

```ts
import { createDracoIntegration } from '@replayablejs/three/draco';

const three = createThree({
  camera,
  integrations: [createDracoIntegration()],
});
```

Meshopt uses the decoder bundled with the installed Three.js peer. Draco uses
Three.js's glTF decoder files and a shared worker pool. Decoder setup and readiness
are handled automatically. These integrations configure `GLTFLoader`; they do not
change the compression chosen by the asset build.

The root package does not import either decoder. Registering both is supported for
mixed-codec assets but warns once during setup: prefer one codec to avoid shipping
two decoders. Registering the same codec twice is an error. A missing integration
produces an error naming the model and the required integration before fetching it.

Draco's default decoder URLs point to files in the installed Three.js package, not
a CDN. The bundler must process those asset URLs. Replayable's production build
inlines them for inline profiles and emits files for resource profiles. Custom
hosting can override `decoderPath` with a directory URL or `{ js, wasm }` URLs,
including data URLs. `workerLimit` optionally sets a positive integer limit
(default: 4). Draco requires browser Web Workers and permission to create blob
workers; the default glTF decoder also requires WebAssembly.

`three.destroy()` unregisters integrations. Draco worker disposal waits for active
model loads to settle; those loads can still populate the runtime cache. As with
uncompressed models, the playable owns cached asset and instance cleanup.

## Next example

The Kenney scene example will use these loaders and explicit playable-owned
animation updates.
