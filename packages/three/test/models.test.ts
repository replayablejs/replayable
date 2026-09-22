// @vitest-environment happy-dom
import {
  AnimationClip,
  Bone,
  BoxGeometry,
  DataTexture,
  Texture,
  MeshStandardMaterial,
  Skeleton,
  SkinnedMesh,
  Uint16BufferAttribute,
  Float32BufferAttribute,
  VectorKeyframeTrack,
  Mesh,
} from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createModel, disposeModelAsset } from '../src/models/create-model.js';
import { LoadedModel } from '../src/models/loaded-model.js';
import { collectModelResources, disposeModelResources } from '../src/models/model-resources.js';

const state = vi.hoisted(() => {
  const models: Record<string, LoadedModel> = {};
  return { cache: { models } };
});
vi.mock('@replayablejs/runtime', () => ({ playable: { loader: { cache: state.cache } } }));
beforeEach(() => {
  vi.restoreAllMocks();
  state.cache.models = {};
});

/** Real Three.js objects exercise cloning and animation instead of mocking their behavior. */
async function modelFixture() {
  const gltf = await new GLTFLoader().parseAsync(
    JSON.stringify({
      asset: { version: '2.0' },
      scene: 0,
      scenes: [{ nodes: [0] }],
      nodes: [{ name: 'Character' }],
    }),
    '',
  );
  const geometry = new BoxGeometry();
  const count = geometry.getAttribute('position').count;
  geometry.setAttribute('skinIndex', new Uint16BufferAttribute(new Uint16Array(count * 4), 4));
  const weights = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    weights[i * 4] = 1;
  }
  geometry.setAttribute('skinWeight', new Float32BufferAttribute(weights, 4));
  const texture = new DataTexture(new Uint8Array([255, 0, 0, 255]), 1, 1);
  const material = new MeshStandardMaterial({ map: texture, normalMap: texture });
  const mesh = new SkinnedMesh(geometry, material);
  mesh.name = 'Body';
  const root = new Bone();
  root.name = 'RootBone';
  const child = new Bone();
  child.name = 'ChildBone';
  root.add(child);
  mesh.add(root);
  mesh.bind(new Skeleton([root, child]));
  gltf.scene.add(mesh);
  // Shared data appears twice and must still be disposed exactly once.
  gltf.scene.add(new Mesh(geometry, material));
  gltf.animations.push(
    new AnimationClip('walk', 1, [
      new VectorKeyframeTrack('RootBone.position', [0, 1], [0, 0, 0, 1, 0, 0]),
    ]),
  );
  const loaded = new LoadedModel(gltf, collectModelResources(gltf));
  return { loaded, geometry, material, texture, mesh };
}

function skinned(root: import('three').Object3D): SkinnedMesh {
  const mesh = root.getObjectByName('Body');
  if (!(mesh instanceof SkinnedMesh)) {
    throw new Error('Missing cloned skinned mesh.');
  }
  return mesh;
}

describe('Three model ownership', () => {
  it('creates independent skeletons and animations while sharing geometry, materials, and textures', async () => {
    const fixture = await modelFixture();
    state.cache.models.character = fixture.loaded;
    const first = createModel({ asset: 'character' });
    const second = createModel({ asset: 'character' });
    const firstMesh = skinned(first.root),
      secondMesh = skinned(second.root);
    expect(first.root.parent).toBeNull();
    expect(first.root).not.toBe(fixture.loaded.gltf.scene);
    expect(first.root.children.map((child) => child.name)).toEqual(
      fixture.loaded.gltf.scene.children.map((child) => child.name),
    );
    expect(first.mixer.getRoot()).toBe(first.root);
    expect(first.root).not.toBe(second.root);
    expect(firstMesh.skeleton).not.toBe(secondMesh.skeleton);
    expect(firstMesh.skeleton.bones[0]).not.toBe(secondMesh.skeleton.bones[0]);
    expect(firstMesh.skeleton.bones[0]).toBe(first.root.getObjectByName('RootBone'));
    expect(firstMesh.geometry).toBe(fixture.geometry);
    expect(firstMesh.material).toBe(fixture.material);
    expect(first.animations).toBe(fixture.loaded.gltf.animations);
    const clip = first.animations[0];
    if (clip === undefined) {
      throw new Error('Missing clip.');
    }
    first.mixer.clipAction(clip).play();
    first.mixer.update(0.5);
    expect(firstMesh.skeleton.bones[0]?.position.x).toBeCloseTo(0.5);
    expect(secondMesh.skeleton.bones[0]?.position.x).toBe(0);
    expect(fixture.mesh.skeleton.bones[0]?.position.x).toBe(0);
    first.destroy();
    second.destroy();
    disposeModelAsset({ asset: 'character' });
  });

  it('destroys instances without disposing shared assets and stops their animation actions', async () => {
    const fixture = await modelFixture();
    state.cache.models.character = fixture.loaded;
    const first = createModel({ asset: 'character' }),
      second = createModel({ asset: 'character' });
    fixture.loaded.gltf.scene.add(first.root);
    const dispose = vi.spyOn(fixture.geometry, 'dispose');
    const skeletonDispose = vi.spyOn(skinned(first.root).skeleton, 'dispose');
    const stopActions = vi.spyOn(first.mixer, 'stopAllAction');
    first.destroy();
    first.destroy();
    expect(first.root.parent).toBeNull();
    expect(skeletonDispose).toHaveBeenCalledOnce();
    expect(dispose).not.toHaveBeenCalled();
    expect(stopActions).toHaveBeenCalledOnce();
    expect(skinned(second.root).geometry).toBe(fixture.geometry);
    second.destroy();
    disposeModelAsset({ asset: 'character' });
    expect(dispose).toHaveBeenCalledOnce();
  });

  it('releases shared asset resources once and prevents factory use after teardown', async () => {
    const fixture = await modelFixture();
    state.cache.models.character = fixture.loaded;
    const spies = [fixture.geometry, fixture.material, fixture.texture, fixture.mesh.skeleton].map(
      (resource) => vi.spyOn(resource, 'dispose'),
    );
    const instance = createModel({ asset: 'character' });
    const skeleton = vi.spyOn(skinned(instance.root).skeleton, 'dispose');
    disposeModelAsset({ asset: 'character' });
    disposeModelAsset({ asset: 'character' });
    for (const spy of spies) {
      expect(spy).toHaveBeenCalledOnce();
    }
    expect(skeleton).not.toHaveBeenCalled();
    instance.destroy();
    expect(skeleton).toHaveBeenCalledOnce();
    expect(() => createModel({ asset: 'character' })).toThrow('disposed');
  });

  it('rejects unloaded assets with guidance to await their bundle', () => {
    expect(() => createModel({ asset: 'later' })).toThrow('bundle load');
  });

  it('continues shared resource cleanup after a disposal failure', async () => {
    const fixture = await modelFixture();
    state.cache.models.character = fixture.loaded;
    vi.spyOn(fixture.geometry, 'dispose').mockImplementation(() => {
      throw new Error('geometry failed');
    });
    const material = vi.spyOn(fixture.material, 'dispose');
    expect(() => disposeModelAsset({ asset: 'character' })).toThrow('geometry failed');
    expect(material).toHaveBeenCalledOnce();
    expect(() => disposeModelAsset({ asset: 'character' })).not.toThrow();
  });

  it('captures textures in multiple material slots and closes shared image bitmaps once', async () => {
    const fixture = await modelFixture();
    class TestBitmap {
      close = vi.fn<() => void>();
    }
    vi.stubGlobal('ImageBitmap', TestBitmap);
    try {
      const bitmap = new TestBitmap();
      const texture = new Texture();
      texture.source.data = bitmap;
      fixture.material.map = texture;
      fixture.material.normalMap = texture;
      const resources = collectModelResources(fixture.loaded.gltf);
      expect(resources.textures.size).toBe(1);
      disposeModelResources(resources);
      disposeModelResources(resources);
      expect(bitmap.close).toHaveBeenCalledOnce();
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
