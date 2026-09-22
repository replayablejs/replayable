import { Mesh, MeshStandardMaterial } from 'three';
import type { Material, Object3D, Texture } from 'three';

const woodlandTint = '#dce3cf';

/**
 * Applies the shared palette to a city model's materials. Clones share these
 * materials, so later instances of the same asset inherit this appearance.
 * This function does not create or dispose textures.
 */
export function applyCityPalette(root: Object3D, palette: Texture): void {
  root.traverse(applyToMesh);

  /** Groups have no materials; meshes can have one material or several. */
  function applyToMesh(object: Object3D): void {
    if (!(object instanceof Mesh)) {
      return;
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      applyToMaterial(material);
    }
  }

  /** Attach the color map, soften its colors, and tell Three.js to update the shader. */
  function applyToMaterial(material: Material): void {
    if (!(material instanceof MeshStandardMaterial) || material.map === palette) {
      return;
    }

    material.map = palette;
    material.color.set(woodlandTint);
    material.needsUpdate = true;
  }
}
