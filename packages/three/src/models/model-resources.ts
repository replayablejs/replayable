import { Line, Mesh, Points, SkinnedMesh, Texture } from 'three';
import type { Material, Object3D } from 'three';
import type { GLTF } from 'three/addons/loaders/GLTFLoader.js';

import { cleanupThreeResources } from '#lifecycle/cleanup-three-resources.js';
import type { ModelResources } from '#types/models.js';

/**
 * Captures resources from all glTF scenes, including scenes not used by the factory.
 *
 * Several meshes and scenes may reference the same geometry, material, or texture.
 * Sets make ownership explicit and prevent double disposal. Material texture slots
 * are inspected rather than assuming base-color is the only image in the asset.
 * Capture immediately after loading, before application instances can alter nodes.
 */
export function collectModelResources(gltf: GLTF): ModelResources {
  const resources: ModelResources = {
    geometries: new Set(),
    materials: new Set(),
    textures: new Set(),
    skeletons: new Set(),
    bitmaps: new Set(),
  };

  // First collect scene-owned geometry, skeletons, and materials.
  for (const scene of gltf.scenes) {
    scene.traverse((object) => collectObjectResources(object, resources));
  }

  // Inspect each shared material once, regardless of how many meshes use it.
  for (const material of resources.materials) {
    collectMaterialTextures(material, resources.textures);
  }

  // Texture disposal releases GPU data; decoded bitmaps also need close().
  for (const texture of resources.textures) {
    const image: unknown = texture.source.data;
    if (typeof ImageBitmap !== 'undefined' && image instanceof ImageBitmap) {
      resources.bitmaps.add(image);
    }
  }

  return resources;
}

/** Records resources directly attached to one renderable scene object. */
function collectObjectResources(object: Object3D, resources: ModelResources): void {
  if (object instanceof SkinnedMesh) {
    resources.skeletons.add(object.skeleton);
  }

  // Groups, cameras, and lights do not own geometry or mesh materials.
  if (!(object instanceof Mesh || object instanceof Line || object instanceof Points)) {
    return;
  }

  resources.geometries.add(object.geometry);

  // A mesh can use one material or separate materials for its geometry groups.
  const materials = Array.isArray(object.material) ? object.material : [object.material];
  for (const material of materials) {
    resources.materials.add(material);
  }
}

/**
 * Collects all direct texture slots, including normal, emissive, and PBR maps.
 * GLTFLoader assigns these as material properties. Checking their values avoids
 * maintaining a separate list of map names for every supported material extension.
 */
function collectMaterialTextures(material: Material, textures: Set<Texture>): void {
  const properties: unknown[] = Object.values(material);
  for (const property of properties) {
    if (property instanceof Texture) {
      textures.add(property);
    }
  }
}

/**
 * Releases an asset's unique GPU resources and closes its decoded image bitmaps.
 *
 * Call only after every instance has been destroyed: instances intentionally share
 * these resources. Snapshot cleanup operations and clear ownership sets before
 * disposal so a throwing disposer cannot cause a later attempt to double-release.
 * Every release is attempted even if an earlier one fails.
 */
export function disposeModelResources(resources: ModelResources): void {
  const cleanups: (() => void)[] = [];
  for (const bitmap of resources.bitmaps) {
    cleanups.push(() => bitmap.close());
  }
  for (const collection of [
    resources.textures,
    resources.materials,
    resources.geometries,
    resources.skeletons,
  ]) {
    for (const resource of collection) {
      cleanups.push(() => resource.dispose());
    }
    collection.clear();
  }
  resources.bitmaps.clear();
  cleanupThreeResources(cleanups);
}
