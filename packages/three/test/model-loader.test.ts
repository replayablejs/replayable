// @vitest-environment happy-dom
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { Mesh, BoxGeometry, MeshStandardMaterial } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { loadThreeModel } from '../src/loader/load-three-model.js';
import { disposeModelResources } from '../src/models/model-resources.js';

const context = {
  category: 'models',
  id: 'box',
  assetMode: 'inline',
  source: { src: 'unused.glb', compression: 'none' },
} as const;

afterEach(() => {
  vi.restoreAllMocks();
});

describe('GLB loading', () => {
  it('parses inline GLB bytes without fetch, even when the host blocks requests', async () => {
    const fetch = vi.spyOn(globalThis, 'fetch').mockImplementation(() => {
      throw new Error('Host blocked fetch');
    });
    const bytes = await readFile(
      resolve(process.cwd(), '../assets/test/fixtures/models/vertex-colors/BoxVertexColors.glb'),
    );
    const loaded = await loadThreeModel({
      ...context,
      source: {
        compression: 'none',
        src: `data:model/gltf-binary;base64,${bytes.toString('base64')}`,
      },
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(loaded.gltf.scene.children.length).toBeGreaterThan(0);
    expect(loaded.resources.geometries.size).toBeGreaterThan(0);
    expect(loaded.resources.materials.size).toBeGreaterThan(0);
    disposeModelResources(loaded.resources);
  });

  it('reports malformed inline models with the asset ID', async () => {
    await expect(
      loadThreeModel({
        ...context,
        source: { src: 'data:model/gltf-binary,invalid', compression: 'none' },
      }),
    ).rejects.toThrow('Cannot load model "box": An inline GLB must be a Base64 data URL.');
  });

  it.each(['meshopt', 'draco'] as const)(
    'reports the missing %s integration before attempting a fetch',
    async (compression) => {
      const load = vi.spyOn(GLTFLoader.prototype, 'loadAsync');
      await expect(
        loadThreeModel({ ...context, source: { src: 'unused.glb', compression } }),
      ).rejects.toThrow(
        compression === 'meshopt' ? 'createMeshoptIntegration' : 'createDracoIntegration',
      );
      expect(load).not.toHaveBeenCalled();
    },
  );

  it('adds the asset ID while preserving the original load failure', async () => {
    const cause = new Error('invalid GLB');
    vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockRejectedValue(cause);
    await expect(loadThreeModel(context)).rejects.toMatchObject({
      message: 'Cannot load model "box": invalid GLB',
      cause,
    });
  });

  it('rejects recovered image failures and disposes the incomplete result', async () => {
    const gltf = await new GLTFLoader().parseAsync(
      JSON.stringify({ asset: { version: '2.0' }, scenes: [{}], scene: 0 }),
      '',
    );
    const geometry = new BoxGeometry();
    const material = new MeshStandardMaterial();
    gltf.scene.add(new Mesh(geometry, material));
    const disposeGeometry = vi.spyOn(geometry, 'dispose');
    const disposeMaterial = vi.spyOn(material, 'dispose');
    vi.spyOn(GLTFLoader.prototype, 'loadAsync').mockImplementation(function (this: GLTFLoader) {
      this.manager.itemError('missing-texture.png');
      return Promise.resolve(gltf);
    });
    await expect(loadThreeModel(context)).rejects.toThrow(
      'box": Failed to load model dependencies: missing-texture.png',
    );
    expect(disposeGeometry).toHaveBeenCalledOnce();
    expect(disposeMaterial).toHaveBeenCalledOnce();
  });
});
