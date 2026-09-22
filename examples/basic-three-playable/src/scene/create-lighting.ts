import { DirectionalLight, Group, HemisphereLight } from 'three';

/** Combines soft sky/ground fill with one warm sun that casts the scene's shadows. */
export function createLighting() {
  const root = new Group();
  root.name = 'neighborhood-lighting';

  // White light from above and muted green from below keep shaded surfaces readable.
  // This light provides ambient fill without creating another shadow map.
  const sky = new HemisphereLight('#ffffff', '#8d9b86', 2);

  // The sun points from this position toward its target at the neighborhood origin.
  const sun = new DirectionalLight('#fff2dc', 3);
  sun.position.set(-3, 8, 5);
  sun.castShadow = true;

  // Cover both streets, including the houses beside the upper road.
  // A 1024px map keeps shadows detailed across this wider 20-by-20 area.
  sun.shadow.mapSize.set(1024, 1024);
  const shadowCamera = sun.shadow.camera;
  shadowCamera.left = -18;
  shadowCamera.right = 18;
  shadowCamera.top = 18;
  shadowCamera.bottom = -18;
  shadowCamera.near = 0.1;
  shadowCamera.far = 30;

  // Small offsets prevent surfaces from drawing speckled shadows onto themselves.
  sun.shadow.normalBias = 0.025;
  sun.shadow.bias = -0.0005;

  root.add(sky, sun, sun.target);
  return { root, destroy };

  /** Detach the lights and release the sun's GPU shadow resources. */
  function destroy(): void {
    root.removeFromParent();
    sun.dispose();
    root.clear();
  }
}
