import type {
  AnimationClip,
  AnimationMixer,
  BufferGeometry,
  Object3D,
  Material,
  Skeleton,
  Texture,
} from 'three';

/** Creates an independent scene instance from an already-loaded asset ID. */
export interface CreateModelOptions {
  /** Extensionless ID from the generated models registry. */
  readonly asset: string;
}

/** One model instance; geometry, materials, textures, and clips remain shared asset data. */
export interface ReplayableModel {
  /** Cloned default glTF scene, unattached and ready to add to the playable scene. */
  readonly root: Object3D;
  /** Authored clips; use mixer.clipAction(clip).play() to start playback. */
  readonly animations: readonly AnimationClip[];
  /** Instance-specific mixer; the playable explicitly controls playback and updates. */
  readonly mixer: AnimationMixer;
  /** Stops playback, detaches the root, and releases instance skeletons once. */
  destroy(): void;
}

/** Disposable GPU/image resources captured across every scene in a loaded GLB. */
export interface ModelResources {
  readonly geometries: Set<BufferGeometry>;
  readonly materials: Set<Material>;
  readonly textures: Set<Texture>;
  readonly skeletons: Set<Skeleton>;
  readonly bitmaps: Set<ImageBitmap>;
}
