import { AnimationMixer, SkinnedMesh } from 'three';
import type { Object3D, Skeleton } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';
import { clone as cloneSkinnedScene } from 'three/addons/utils/SkeletonUtils.js';

import { cleanupThreeResources } from '#lifecycle/cleanup-three-resources.js';
import type { ReplayableModel } from '#types/models.js';

/**
 * Creates an independent hierarchy and mixer from a loaded model.
 * Geometry, materials, textures, and animation clips remain shared with the asset.
 * The playable controls animation updates and stops them before destruction.
 */
export function createModelInstance(gltf: GLTF): ReplayableModel {
  const cleanups: (() => void)[] = [];

  // SkeletonUtils reconnects cloned meshes to cloned bones; Object3D.clone does not.
  const root = cloneSkinnedScene(gltf.scene);
  for (const skeleton of collectSkeletons(root)) {
    cleanups.push(() => skeleton.dispose());
  }

  cleanups.push(() => root.clear());
  cleanups.push(() => root.removeFromParent());

  const mixer = new AnimationMixer(root);
  cleanups.push(() => mixer.uncacheRoot(root));
  cleanups.push(() => mixer.stopAllAction());

  return {
    root,
    animations: gltf.animations,
    mixer,

    destroy(): void {
      // Reverse cleanup stops playback, releases bindings, detaches the hierarchy,
      // then disposes cloned skeletons. Draining the stack makes this idempotent.
      cleanupThreeResources(cleanups);
    },
  };
}

/** Captures instance-owned skeletons once, even when several meshes share one. */
function collectSkeletons(scene: Object3D): Set<Skeleton> {
  const skeletons = new Set<Skeleton>();
  scene.traverse((object) => {
    if (object instanceof SkinnedMesh) {
      skeletons.add(object.skeleton);
    }
  });
  return skeletons;
}
