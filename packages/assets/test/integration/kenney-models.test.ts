import { cp, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import {
  NodeIO,
  type Accessor,
  type Document,
  type Primitive,
  type Skin,
} from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import draco from 'draco3dgltf';
import { validateBytes } from 'gltf-validator';
import { MeshoptDecoder } from 'meshoptimizer';
import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { buildAssets } from '../../src/index.js';
import { config } from '../support/config.js';
import { createTestProject } from '../support/test-project.js';

const sources = fileURLToPath(
  new URL('../../../../examples/basic-assets/assets/models/', import.meta.url),
);

async function buildKenneyModel(
  id: string,
  format: 'obj' | 'glb',
  compression: 'none' | 'meshopt' | 'draco',
) {
  const project = await createTestProject();
  await cp(sources, project.path('assets/source/models'), { recursive: true });
  await buildAssets(
    config({
      assets: { models: [{ match: `${id}.${format}`, options: { compression } }] },
      bundles: { secondary: { include: ['models/**/*.glb'] } },
    }),
    project.root,
  );
  const bytes = await project.readBytes(`assets/generated/models/${id}.glb`);
  const report = await validateBytes(bytes, { maxIssues: 100 });
  expect(report.issues).toMatchObject({ numErrors: 0 });
  const json = (await new NodeIO().binaryToJSON(bytes)).json;
  expect(
    json.images?.every((image) => image.uri === undefined && image.bufferView !== undefined),
  ).toBe(true);
  expect(json.buffers?.every((buffer) => buffer.uri === undefined)).toBe(true);
  await MeshoptDecoder.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
    'meshopt.decoder': MeshoptDecoder,
    'draco3d.decoder': await draco.createDecoderModule(),
  });
  return { output: await io.readBinary(bytes), project };
}

function animationTargets(document: Document) {
  return document
    .getRoot()
    .listAnimations()
    .map((animation) => ({
      name: animation.getName(),
      channels: animation.listChannels().map((channel) => ({
        node: channel.getTargetNode()?.getName(),
        path: channel.getTargetPath(),
        interpolation: channel.getSampler()?.getInterpolation(),
      })),
    }));
}

function skinJoints(document: Document) {
  return document
    .getRoot()
    .listSkins()
    .map((skin) => ({
      name: skin.getName(),
      joints: skin.listJoints().map((joint) => joint.getName()),
    }));
}

function values(accessor: Accessor | null | undefined): number[] {
  if (accessor == null) {
    throw new Error('Missing animation accessor.');
  }
  return Array.from({ length: accessor.getCount() }, (_, index) =>
    accessor.getElement(index, []),
  ).flat();
}

function maximumDifference(actual: readonly number[], expected: readonly number[]): number {
  expect(actual).toHaveLength(expected.length);
  return actual.reduce(
    (maximum, value, index) => Math.max(maximum, Math.abs(value - (expected[index] ?? NaN))),
    0,
  );
}

/**
 * Compares effective skin bindings rather than raw inverse-bind matrices.
 * Meshopt changes the position coordinate system and compensates in those matrices;
 * both codecs can reorder vertices. Per-corner weighted joint-space positions and
 * weights must still match as a multiset within the quantization tolerance.
 */
function expectSkinBindings(output: Document, source: Document): void {
  const expectedNodes = source
    .getRoot()
    .listNodes()
    .filter((node) => node.getSkin() !== null);
  const actualNodes = output
    .getRoot()
    .listNodes()
    .filter((node) => node.getSkin() !== null);
  expect(actualNodes.map((node) => node.getName())).toEqual(
    expectedNodes.map((node) => node.getName()),
  );

  for (const [index, node] of expectedNodes.entries()) {
    const actualNode = actualNodes[index];
    const sourceSkin = node.getSkin();
    const actualSkin = actualNode?.getSkin();
    if (sourceSkin == null || actualSkin == null) {
      throw new Error('Missing skin on a skinned model node.');
    }
    const expectedPrimitives = node.getMesh()?.listPrimitives() ?? [];
    const actualPrimitives = actualNode?.getMesh()?.listPrimitives() ?? [];
    expect(expectedPrimitives.length).toBeGreaterThan(0);
    expect(actualPrimitives).toHaveLength(expectedPrimitives.length);

    for (const [primitiveIndex, primitive] of expectedPrimitives.entries()) {
      const actualPrimitive = actualPrimitives[primitiveIndex];
      if (actualPrimitive === undefined) {
        throw new Error('Missing skinned primitive.');
      }
      const expected = skinBindingSamples(primitive, sourceSkin);
      const remaining = skinBindingSamples(actualPrimitive, actualSkin);
      expect(remaining).toHaveLength(expected.length);
      for (const sample of expected) {
        const match = remaining.findIndex(
          (candidate) =>
            candidate.length === sample.length &&
            candidate.every(
              (value, component) => Math.abs(value - (sample[component] ?? NaN)) < 0.001,
            ),
        );
        expect(match).toBeGreaterThanOrEqual(0);
        remaining.splice(match, 1);
      }
      expect(remaining).toHaveLength(0);
    }
  }
}

/** Captures each joint's weight and weighted inverse-bind-transformed position per corner. */
function skinBindingSamples(primitive: Primitive, skin: Skin): number[][] {
  const positions = primitive.getAttribute('POSITION');
  const joints = primitive.getAttribute('JOINTS_0');
  const weights = primitive.getAttribute('WEIGHTS_0');
  const matrices = skin.getInverseBindMatrices();
  if (positions === null || joints === null || weights === null || matrices === null) {
    throw new Error('Missing position, skin attributes, or inverse-bind matrices.');
  }
  expect(matrices.getCount()).toBe(skin.listJoints().length);
  const indices = primitive.getIndices();
  return Array.from({ length: indices?.getCount() ?? positions.getCount() }, (_, corner) => {
    const vertex = indices?.getScalar(corner) ?? corner;
    const position = positions.getElement(vertex, []);
    const jointIndices = joints.getElement(vertex, []);
    const influenceWeights = weights.getElement(vertex, []);
    const sample: number[] = Array.from({ length: skin.listJoints().length * 4 }, () => 0);
    for (const [influence, joint] of jointIndices.entries()) {
      const weight = influenceWeights[influence] ?? NaN;
      const matrix = matrices.getElement(joint, []);
      const offset = joint * 4;
      sample[offset] = (sample[offset] ?? 0) + weight;
      for (let axis = 0; axis < 3; axis++) {
        const transformed =
          (matrix[axis] ?? NaN) * (position[0] ?? NaN) +
          (matrix[4 + axis] ?? NaN) * (position[1] ?? NaN) +
          (matrix[8 + axis] ?? NaN) * (position[2] ?? NaN) +
          (matrix[12 + axis] ?? NaN);
        sample[offset + axis + 1] = (sample[offset + axis + 1] ?? 0) + weight * transformed;
      }
    }
    return sample;
  });
}

async function expectTexturePixels(output: Document, source: Uint8Array): Promise<void> {
  const image = output.getRoot().listTextures()[0]?.getImage();
  expect(image).toBeTruthy();
  const expected = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const actual = await sharp(image ?? undefined)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  expect(actual.info).toEqual(expected.info);
  expect(actual.data.equals(expected.data)).toBe(true);
}

describe('Kenney model examples', () => {
  it.each([
    ['blocky-characters/character-a', 'meshopt', 27, 0],
    ['blocky-characters/character-a', 'draco', 27, 0],
    ['platformer-kit/character-oopi', 'meshopt', 25, 1],
    ['platformer-kit/character-oopi', 'draco', 25, 1],
    ['platformer-kit/chest', 'meshopt', 3, 0],
    ['platformer-kit/chest', 'draco', 3, 0],
  ] as const)(
    'preserves animations, skin bindings, materials, and texture colors in %s with %s',
    async (id, compression, clips, skins) => {
      const source = await new NodeIO()
        .registerExtensions(ALL_EXTENSIONS)
        .read(`${sources}/${id}.glb`);
      expect(source.getRoot().listAnimations()).toHaveLength(clips);
      expect(source.getRoot().listSkins()).toHaveLength(skins);
      const { output, project } = await buildKenneyModel(id, 'glb', compression);
      expect(animationTargets(output)).toEqual(animationTargets(source));
      expect(skinJoints(output)).toEqual(skinJoints(source));
      expectSkinBindings(output, source);
      expect(
        output
          .getRoot()
          .listMaterials()
          .map((material) => ({
            name: material.getName(),
            color: material.getBaseColorFactor(),
            metallic: material.getMetallicFactor(),
            roughness: material.getRoughnessFactor(),
            alphaMode: material.getAlphaMode(),
            alphaCutoff: material.getAlphaCutoff(),
            doubleSided: material.getDoubleSided(),
            texture: material.getBaseColorTexture()?.getName(),
            extensions: material.listExtensions().map((extension) => extension.extensionName),
          })),
      ).toEqual(
        source
          .getRoot()
          .listMaterials()
          .map((material) => ({
            name: material.getName(),
            color: material.getBaseColorFactor(),
            metallic: material.getMetallicFactor(),
            roughness: material.getRoughnessFactor(),
            alphaMode: material.getAlphaMode(),
            alphaCutoff: material.getAlphaCutoff(),
            doubleSided: material.getDoubleSided(),
            texture: material.getBaseColorTexture()?.getName(),
            extensions: material.listExtensions().map((extension) => extension.extensionName),
          })),
      );
      expect(output.getRoot().listMeshes().length).toBeGreaterThan(0);
      expect(await project.readText('src/assets/assets.gen.ts')).toContain(
        '"secondary": {\n    models:',
      );
      const texture = source.getRoot().listTextures()[0]?.getImage();
      if (texture == null) {
        throw new Error('Kenney model has no texture.');
      }
      await expectTexturePixels(output, texture);

      const originalSamplers = source
        .getRoot()
        .listAnimations()
        .flatMap((animation) => animation.listSamplers());
      const outputSamplers = output
        .getRoot()
        .listAnimations()
        .flatMap((animation) => animation.listSamplers());
      expect(outputSamplers).toHaveLength(originalSamplers.length);
      for (const [index, sampler] of originalSamplers.entries()) {
        const actual = outputSamplers[index];
        expect(values(actual?.getInput())).toEqual(values(sampler.getInput()));
        expect(
          maximumDifference(values(actual?.getOutput()), values(sampler.getOutput())),
        ).toBeLessThan(0.001);
      }
    },
  );

  it.each([
    ['car-kit/race', 'draco', 1952],
    ['car-kit/race', 'meshopt', 1952],
    ['platformer-kit/tree', 'draco', 816],
    ['platformer-kit/tree', 'meshopt', 816],
    ['platformer-kit/tree', 'none', 816],
  ] as const)(
    'converts %s OBJ/MTL with %s and preserves its geometry and palette',
    async (id, compression, triangles) => {
      const { output } = await buildKenneyModel(id, 'obj', compression);
      const primitives = output
        .getRoot()
        .listMeshes()
        .flatMap((mesh) => mesh.listPrimitives());
      const triangleCount = primitives.reduce(
        (sum, primitive) => sum + (primitive.getIndices()?.getCount() ?? 0) / 3,
        0,
      );
      expect(triangleCount).toBe(triangles);
      expect(primitives.every((primitive) => primitive.getAttribute('TEXCOORD_0') !== null)).toBe(
        true,
      );
      expect(
        output
          .getRoot()
          .listMaterials()
          .every((material) => material.getBaseColorTexture() !== null),
      ).toBe(true);
      const pack = id.split('/')[0];
      await expectTexturePixels(output, await readFile(`${sources}/${pack}/Textures/colormap.png`));
    },
  );

  it('preserves valid UV coordinates outside [0, 1] when Meshopt skips their quantization', async () => {
    const id = 'blocky-characters/character-a';
    const source = await new NodeIO()
      .registerExtensions(ALL_EXTENSIONS)
      .read(`${sources}/${id}.glb`);
    const { output } = await buildKenneyModel(id, 'glb', 'meshopt');
    const sourceUVs = source
      .getRoot()
      .listMeshes()
      .flatMap((mesh) =>
        mesh.listPrimitives().map((primitive) => primitive.getAttribute('TEXCOORD_0')),
      );
    const outputUVs = output
      .getRoot()
      .listMeshes()
      .flatMap((mesh) =>
        mesh.listPrimitives().map((primitive) => primitive.getAttribute('TEXCOORD_0')),
      );
    expect(
      sourceUVs.some(
        (uv) =>
          (uv?.getMinNormalized([]) ?? []).some((value) => value < 0) ||
          (uv?.getMaxNormalized([]) ?? []).some((value) => value > 1),
      ),
    ).toBe(true);
    expect(outputUVs.map((uv) => uv?.getMinNormalized([]))).toEqual(
      sourceUVs.map((uv) => uv?.getMinNormalized([])),
    );
    expect(outputUVs.map((uv) => uv?.getMaxNormalized([]))).toEqual(
      sourceUVs.map((uv) => uv?.getMaxNormalized([])),
    );
  });
});
