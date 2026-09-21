import { cp, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { Document, NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco from 'draco3dgltf';
import { validateBytes } from 'gltf-validator';
import { MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { buildAssets } from '../../src/index.js';
import { processModelTextures } from '../../src/processors/model-textures.js';
import { config } from '../support/config.js';
import { createTestProject, type TestProject } from '../support/test-project.js';

const fixtureRoot = fileURLToPath(new URL('../fixtures/models/', import.meta.url));
const triangle = 'v 0 0 0\nv 1 0 0\nv 0 1 0\nf 1 2 3\n';

async function createModelsProject(): Promise<TestProject> {
  const project = await createTestProject();
  await cp(fixtureRoot, project.path('assets/source/models'), { recursive: true });
  return project;
}

async function readGLB(bytes: Uint8Array): Promise<Document> {
  await MeshoptDecoder.ready;
  return new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.decoder': await draco.createDecoderModule(),
      'meshopt.decoder': MeshoptDecoder,
    })
    .readBinary(bytes);
}

async function expectValidGLB(bytes: Uint8Array): Promise<void> {
  const result = await validateBytes(bytes, { maxIssues: 100 });
  expect(result.issues).toMatchObject({ numErrors: 0 });
  const json = (await new NodeIO().binaryToJSON(bytes)).json;
  expect(json.buffers?.every((buffer) => buffer.uri === undefined)).toBe(true);
  expect(json.images?.every((image) => image.uri === undefined) ?? true).toBe(true);
}

describe('model assets', () => {
  it('converts OBJ, colored MTL, textured MTL, glTF animation, and GLB into deterministic self-contained assets', async () => {
    const project = await createModelsProject();
    const settings = config({
      assets: { models: [{}] },
      bundles: { secondary: { include: ['models/animated-triangle/**'] } },
      emit: { assets: 'src/assets/assets.gen.ts', registries: 'src/assets/registries' },
    });
    const result = await buildAssets(settings, project.root);
    expect(result).toMatchObject({
      emittedAssets: 5,
      emittedFiles: 5,
      bundles: ['primary', 'secondary'],
    });
    const outputs = (await project.files('assets/generated/models')).sort();
    expect(outputs).toEqual([
      'animated-triangle/AnimatedTriangle.glb',
      'geometry/triangle.glb',
      'solid/triangle.glb',
      'textured/triangle.glb',
      'vertex-colors/BoxVertexColors.glb',
    ]);
    const first = await Promise.all(
      outputs.map((path) => project.readBytes(`assets/generated/models/${path}`)),
    );
    for (const bytes of first) {
      await expectValidGLB(bytes);
    }
    const module = await project.readText('src/assets/assets.gen.ts');
    expect(module).toContain('compression: "none"');
    expect(module).toContain('"secondary": {\n    models:');
    expect(module).not.toMatch(/\.mtl|\.png|\.bin/);
    expect(await project.readText('src/assets/registries/models.ts')).toContain(
      '"geometry/triangle": "geometry/triangle"',
    );

    const solid = await readGLB(
      await project.readBytes('assets/generated/models/solid/triangle.glb'),
    );
    expect(solid.getRoot().listTextures()).toHaveLength(0);
    expect(solid.getRoot().listMaterials()[0]?.getBaseColorFactor()).toEqual([0.2, 0.6, 0.9, 1]);
    const textured = await readGLB(
      await project.readBytes('assets/generated/models/textured/triangle.glb'),
    );
    expect(textured.getRoot().listMaterials()[0]?.getBaseColorTexture()).not.toBeNull();
    const animation = await readGLB(
      await project.readBytes('assets/generated/models/animated-triangle/AnimatedTriangle.glb'),
    );
    expect(animation.getRoot().listAnimations()).toHaveLength(1);
    expect(animation.getRoot().listAnimations()[0]?.listChannels()[0]?.getTargetPath()).toBe(
      'rotation',
    );

    await buildAssets(settings, project.root);
    const second = await Promise.all(
      outputs.map((path) => project.readBytes(`assets/generated/models/${path}`)),
    );
    expect(second).toEqual(first);
  });

  it.each(['draco', 'meshopt'] as const)(
    'writes %s geometry that an independent decoder can read',
    async (compression) => {
      const project = await createModelsProject();
      await buildAssets(
        config({
          assets: {
            models: [
              {
                match: 'textured/*.obj',
                options: { compression, textures: { scale: 0.5, quality: 75 } },
              },
            ],
          },
        }),
        project.root,
      );
      const bytes = await project.readBytes('assets/generated/models/textured/triangle.glb');
      await expectValidGLB(bytes);
      const json = (await new NodeIO().binaryToJSON(bytes)).json;
      expect(json.extensionsRequired).toContain(
        compression === 'draco' ? 'KHR_draco_mesh_compression' : 'EXT_meshopt_compression',
      );
      const document = await readGLB(bytes);
      const primitive = document.getRoot().listMeshes()[0]?.listPrimitives()[0];
      expect(primitive?.getAttribute('POSITION')?.getCount()).toBe(3);
      expect(primitive?.getAttribute('TEXCOORD_0')?.getCount()).toBe(3);
      expect(primitive?.getIndices()?.getCount()).toBe(3);
      const texture = document.getRoot().listTextures()[0]?.getImage();
      expect(texture).toBeTruthy();
      expect(await sharp(texture ?? undefined).metadata()).toMatchObject({ width: 16, height: 16 });

      // Re-importing compressed models must honor a later no-codec build setting.
      await project.write('assets/source/models/decoded.glb', bytes);
      await buildAssets(config({ assets: { models: [{ match: 'decoded.glb' }] } }), project.root);
      const decodedBytes = await project.readBytes('assets/generated/models/decoded.glb');
      const decodedJson = (await new NodeIO().binaryToJSON(decodedBytes)).json;
      expect(decodedJson.extensionsRequired ?? []).not.toContain('KHR_draco_mesh_compression');
      expect(decodedJson.extensionsRequired ?? []).not.toContain('EXT_meshopt_compression');
      await expectValidGLB(decodedBytes);
    },
  );

  it('preserves animation targets and keyframes through Meshopt compression', async () => {
    const project = await createModelsProject();
    const source = await new NodeIO().read(
      project.path('assets/source/models/animated-triangle/AnimatedTriangle.gltf'),
    );
    await buildAssets(
      config({
        assets: {
          models: [{ match: 'animated-triangle/*.gltf', options: { compression: 'meshopt' } }],
        },
      }),
      project.root,
    );
    const output = await readGLB(
      await project.readBytes('assets/generated/models/animated-triangle/AnimatedTriangle.glb'),
    );
    const original = source.getRoot().listAnimations()[0]?.listSamplers()[0];
    const actual = output.getRoot().listAnimations()[0]?.listSamplers()[0];
    expect(actual?.getInput()?.getArray()).toEqual(original?.getInput()?.getArray());
    const expectedValues = Array.from(original?.getOutput()?.getArray() ?? []);
    const actualValues = Array.from(actual?.getOutput()?.getArray() ?? []);
    expect(actualValues).toHaveLength(expectedValues.length);
    actualValues.forEach((value, index) =>
      expect(value).toBeCloseTo(expectedValues[index] ?? NaN, 3),
    );
    expect(output.getRoot().listAnimations()[0]?.listChannels()[0]?.getTargetNode()).toBe(
      output.getRoot().listScenes()[0]?.listChildren()[0],
    );
  });

  it.each([
    ['material', 'mtllib missing.mtl\n' + triangle, undefined],
    [
      'texture',
      'mtllib surface.mtl\nusemtl Surface\n' + triangle,
      'newmtl Surface\nmap_Kd missing.png\n',
    ],
  ])(
    'rejects a missing %s with its source path and preserves the previous output',
    async (_kind, obj, mtl) => {
      const project = await createTestProject();
      await project.write('assets/source/models/triangle.obj', triangle);
      const settings = config({ assets: { models: [{}] } });
      await buildAssets(settings, project.root);
      const before = await project.readBytes('assets/generated/models/triangle.glb');
      await project.write('assets/source/models/triangle.obj', obj);
      if (mtl !== undefined) {
        await project.write('assets/source/models/surface.mtl', mtl);
      }
      await expect(buildAssets(settings, project.root)).rejects.toThrow(
        /models\/triangle.obj[\s\S]*missing\.(mtl|png)/,
      );
      expect(await project.readBytes('assets/generated/models/triangle.glb')).toEqual(before);
    },
  );

  it.each([
    ['misspelled', 'mtllib surface.mtl\nusemtl Missing Paint\n', 'newmtl Paint\nKd 0.2 0.6 0.9\n'],
    ['no library', 'usemtl Missing Paint\n', undefined],
    ['empty library', 'mtllib surface.mtl\nusemtl Missing Paint\n', '# no definitions\n'],
  ])(
    'rejects an undefined OBJ material (%s) and preserves previous output',
    async (_kind, header, mtl) => {
      const project = await createTestProject();
      await project.write('assets/source/models/car.obj', triangle);
      const settings = config({ assets: { models: [{}] } });
      await buildAssets(settings, project.root);
      const before = await project.readBytes('assets/generated/models/car.glb');
      await project.write('assets/source/models/car.obj', header + triangle);
      if (mtl !== undefined) {
        await project.write('assets/source/models/surface.mtl', mtl);
      }
      await expect(buildAssets(settings, project.root)).rejects.toThrow(
        /models\/car.obj.*Undefined OBJ material.*Missing Paint/,
      );
      expect(await project.readBytes('assets/generated/models/car.glb')).toEqual(before);
    },
  );

  it.each([
    ['multiple', 'first.mtl nested/paint file.mtl'],
    ['quoted', '"nested/paint file.mtl"'],
    ['backslashes', 'nested\\paint file.mtl'],
  ])('resolves named materials from %s library paths', async (_kind, libraries) => {
    const project = await createTestProject();
    await project.write(
      'assets/source/models/car.obj',
      `mtllib ${libraries}\nusemtl Blue Paint\n${triangle}`,
    );
    await project.write('assets/source/models/first.mtl', 'newmtl Unused\nKd 1 0 0\n');
    await project.write(
      'assets/source/models/nested/paint file.mtl',
      'newmtl Blue Paint\nKd 0.2 0.6 0.9\n',
    );
    await buildAssets(config({ assets: { models: [{}] } }), project.root);
    const model = await readGLB(await project.readBytes('assets/generated/models/car.glb'));
    expect(model.getRoot().listMaterials()[0]?.getBaseColorFactor()).toEqual([0.2, 0.6, 0.9, 1]);
  });

  it('rejects a named material library outside the OBJ directory', async () => {
    const project = await createTestProject();
    await project.write(
      'assets/source/models/car.obj',
      `mtllib ../outside.mtl\nusemtl Paint\n${triangle}`,
    );
    await project.write('assets/source/outside.mtl', 'newmtl Paint\nKd 1 0 0\n');
    await expect(buildAssets(config({ assets: { models: [{}] } }), project.root)).rejects.toThrow(
      /models\/car.obj.*outside the model directory/,
    );
  });

  it('rejects missing glTF buffers and unsupported optional extensions', async () => {
    const project = await createModelsProject();
    const gltfPath = 'assets/source/models/animated-triangle/AnimatedTriangle.gltf';
    const original = await project.readText(gltfPath);
    const settings = config({ assets: { models: [{ match: 'animated-triangle/*.gltf' }] } });
    await project.write(gltfPath, original.replace('AnimatedTriangle_geometry.bin', 'missing.bin'));
    await expect(buildAssets(settings, project.root)).rejects.toThrow(
      /AnimatedTriangle.gltf[\s\S]*missing.bin/,
    );
    const json: Record<string, unknown> = JSON.parse(original);
    json.extensionsUsed = ['VENDOR_unsupported'];
    await project.write(gltfPath, JSON.stringify(json));
    await expect(buildAssets(settings, project.root)).rejects.toThrow(/VENDOR_unsupported/);
  });

  it('preserves skin joints, node hierarchy, and morph targets', async () => {
    const project = await createTestProject();
    const source = new Document();
    const buffer = source.createBuffer();
    const positions = source
      .createAccessor()
      .setType('VEC3')
      .setArray(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0]))
      .setBuffer(buffer);
    const joints = source
      .createAccessor()
      .setType('VEC4')
      .setArray(new Uint16Array(12))
      .setBuffer(buffer);
    const weights = source
      .createAccessor()
      .setType('VEC4')
      .setArray(new Float32Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]))
      .setBuffer(buffer);
    const offsets = source
      .createAccessor()
      .setType('VEC3')
      .setArray(new Float32Array([0, 0, 0.2, 0, 0, 0.2, 0, 0, 0.2]))
      .setBuffer(buffer);
    const target = source.createPrimitiveTarget().setAttribute('POSITION', offsets);
    const primitive = source
      .createPrimitive()
      .setAttribute('POSITION', positions)
      .setAttribute('JOINTS_0', joints)
      .setAttribute('WEIGHTS_0', weights)
      .addTarget(target);
    const mesh = source.createMesh('triangle').addPrimitive(primitive).setWeights([0.5]);
    const joint = source.createNode('joint');
    const skin = source.createSkin('skin').addJoint(joint).setSkeleton(joint);
    const model = source.createNode('model').setMesh(mesh).setSkin(skin);
    const parent = source.createNode('parent').addChild(joint).addChild(model);
    source.createScene('scene').addChild(parent);
    await project.write('assets/source/models/skin.glb', await new NodeIO().writeBinary(source));
    await buildAssets(config({ assets: { models: [{}] } }), project.root);
    const bytes = await project.readBytes('assets/generated/models/skin.glb');
    await expectValidGLB(bytes);
    const result = await readGLB(bytes);
    expect(result.getRoot().listSkins()[0]?.listJoints()[0]?.getName()).toBe('joint');
    expect(
      result
        .getRoot()
        .listScenes()[0]
        ?.listChildren()[0]
        ?.listChildren()
        .map((node) => node.getName()),
    ).toEqual(['joint', 'model']);
    expect(result.getRoot().listMeshes()[0]?.getWeights()).toEqual([0.5]);
    expect(
      result
        .getRoot()
        .listMeshes()[0]
        ?.listPrimitives()[0]
        ?.listTargets()[0]
        ?.getAttribute('POSITION')
        ?.getArray(),
    ).toEqual(offsets.getArray());
  });

  it('preserves texture alpha and UV coordinates without trimming', async () => {
    const project = await createModelsProject();
    const image = await sharp({
      create: {
        width: 12,
        height: 8,
        channels: 4,
        background: { r: 20, g: 40, b: 80, alpha: 0.5 },
      },
    })
      .png()
      .toBuffer();
    await project.write('assets/source/models/textured/checker.png', image);
    await buildAssets(config({ assets: { models: [{ match: 'textured/*.obj' }] } }), project.root);
    const bytes = await project.readBytes('assets/generated/models/textured/triangle.glb');
    await expectValidGLB(bytes);
    const document = await readGLB(bytes);
    const material = document.getRoot().listMaterials()[0];
    expect(material?.getAlphaMode()).toBe('BLEND');
    const texture = material?.getBaseColorTexture()?.getImage();
    expect(await sharp(texture ?? undefined).metadata()).toMatchObject({ width: 12, height: 8 });
    const actual = await sharp(texture ?? undefined)
      .ensureAlpha()
      .raw()
      .toBuffer();
    const expected = await sharp(image).ensureAlpha().raw().toBuffer();
    expect(actual).toEqual(expected);
    expect(
      document
        .getRoot()
        .listMeshes()[0]
        ?.listPrimitives()[0]
        ?.getAttribute('TEXCOORD_0')
        ?.getArray(),
    ).toEqual(new Float32Array([0, 1, 1, 1, 0, 0]));
  });

  it('excludes model entry points before reading dependencies and rejects output collisions', async () => {
    const project = await createTestProject();
    await project.write('assets/source/models/skip.obj', 'mtllib missing.mtl\n' + triangle);
    await project.write('assets/source/models/keep.obj', triangle);
    const settings = config({ assets: { models: [{}] }, exclude: ['models/skip.obj'] });
    expect(await buildAssets(settings, project.root)).toMatchObject({ emittedAssets: 1 });
    await project.write('assets/source/models/keep.glb', 'collision');
    await expect(buildAssets(settings, project.root)).rejects.toThrow(/Asset output collision/);
  });

  it('rebuilds embedded textures when a referenced image changes', async () => {
    const project = await createModelsProject();
    const settings = config({ assets: { models: [{ match: 'textured/*.obj' }] } });
    await buildAssets(settings, project.root);
    const before = await project.readBytes('assets/generated/models/textured/triangle.glb');
    await project.write(
      'assets/source/models/textured/checker.png',
      await sharp({ create: { width: 32, height: 32, channels: 4, background: '#00ff00' } })
        .png()
        .toBuffer(),
    );
    await buildAssets(settings, project.root);
    const after = await project.readBytes('assets/generated/models/textured/triangle.glb');
    expect(after).not.toEqual(before);
    await expectValidGLB(after);
  });

  it('keeps data-map pixels lossless even when shared with a color slot under a lossy policy', async () => {
    const document = new Document();
    const source = await readFile(`${fixtureRoot}/textured/checker.png`);
    const texture = document.createTexture('shared').setImage(source).setMimeType('image/png');
    document.createMaterial().setBaseColorTexture(texture).setNormalTexture(texture);
    await processModelTextures(document, { scale: 1, lossless: false, quality: 1 });
    const expected = await sharp(source).ensureAlpha().raw().toBuffer();
    const actual = await sharp(texture.getImage() ?? undefined)
      .ensureAlpha()
      .raw()
      .toBuffer();
    expect(actual).toEqual(expected);
  });
});
