import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import dracoCodec from 'draco3dgltf';
import { MeshoptDecoder, MeshoptEncoder } from 'meshoptimizer';

/** Shared initialization result, including a rejected promise if initialization fails. */
let codecDependencies: Promise<Record<string, unknown>> | undefined;

/**
 * Creates the glTF reader/writer used for one model conversion.
 *
 * Each call returns a fresh NodeIO instance, while Draco modules and Meshopt
 * readiness are initialized once per module instance. Registering both codecs
 * allows the source compression to differ from the selected output compression.
 * This is build-time support; it does not install decoders in a playable runtime.
 *
 * All extensions supplied by glTF Transform are registered to preserve supported
 * authored features. Debug and informational output are suppressed. Warnings and
 * errors fail the build, except for the documented safe UV quantization fallback;
 * unknown optional extensions must not silently disappear from the output.
 *
 * @returns A reader/writer with initialized codec dependencies and strict diagnostics.
 * @throws If any codec fails to initialize. Later read, transform, and write calls
 * can also throw through this instance's logger.
 *
 * @example
 *
 * ```ts
 * const io = await createModelIO();
 * const document = await io.read('/project/assets/models/character.glb');
 * const bytes = await io.writeBinary(document);
 * ```
 */
export async function createModelIO(): Promise<NodeIO> {
  const dependencies = await getCodecDependencies();

  return new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies(dependencies)
    .setLogger({
      debug() {},
      info() {},
      warn: handleWarning,
      error: failConversion,
    });
}

/**
 * Shares the pending promise as well as its result across concurrent conversions.
 *
 * Caching only resolved modules would allow simultaneous callers to initialize
 * duplicate codecs. A rejection is deliberately retained; this module does not
 * retry codec initialization independently for each failed asset.
 */
function getCodecDependencies(): Promise<Record<string, unknown>> {
  codecDependencies ??= initializeCodecs();
  return codecDependencies;
}

/**
 * Starts both Draco modules and waits for both Meshopt components concurrently.
 *
 * glTF Transform looks up dependencies by these exact registration keys. Draco
 * returns opaque module objects, whereas Meshopt exposes encoder/decoder objects
 * whose readiness promises must resolve before use. The dependency map therefore
 * passes codec objects through without attempting to model their internal APIs.
 */
async function initializeCodecs(): Promise<Record<string, unknown>> {
  const [dracoDecoder, dracoEncoder] = await Promise.all([
    dracoCodec.createDecoderModule(),
    dracoCodec.createEncoderModule(),
    MeshoptDecoder.ready,
    MeshoptEncoder.ready,
  ]);

  return {
    'draco3d.decoder': dracoDecoder,
    'draco3d.encoder': dracoEncoder,
    'meshopt.decoder': MeshoptDecoder,
    'meshopt.encoder': MeshoptEncoder,
  };
}

/**
 * Converts potentially lossy library warnings into build failures.
 *
 * The only accepted warning reports that an out-of-range texture coordinate
 * accessor was left unquantized. That fallback preserves repeating UVs as floats.
 * Match the specific diagnostic rather than ignoring all quantization warnings,
 * since a different warning may indicate that authored data was discarded.
 *
 * @param message - Diagnostic emitted by glTF Transform.
 * @throws For every warning outside the explicitly accepted fallback.
 */
function handleWarning(message: string): void {
  // Repeating textures can use UVs outside [0, 1]. Meshopt safely preserves
  // these coordinates as floats instead of quantizing them.
  const preservesRepeatingUVs = /^quantize: Skipping TEXCOORD_\d+; out of \[0,1\] range\.$/.test(
    message,
  );
  if (preservesRepeatingUVs) {
    return;
  }

  failConversion(message);
}

/**
 * Throws the original library diagnostic without rewriting it.
 *
 * The model processor wraps this failure with the source asset path, so errors
 * raised during reads, transforms, and writes receive the same outer context.
 */
function failConversion(message: string): never {
  throw new Error(message);
}
