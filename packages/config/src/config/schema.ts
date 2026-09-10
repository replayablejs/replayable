import { z } from 'zod';

import { replayableAssetsSchema } from './schemas/assets.js';
import { audioSchema } from './schemas/audio.js';
import { backgroundColorSchema } from './schemas/background.js';
import { requiredStringSchema } from './schemas/base.js';
import { buildSchema } from './schemas/build.js';
import { completionSchema } from './schemas/completion.js';
import { controlsSchema } from './schemas/controls.js';
import { devtoolsSchema } from './schemas/devtools.js';
import { localizationSchema } from './schemas/localization.js';
import { paramsSchema } from './schemas/params.js';
import { screenSchema } from './schemas/screen.js';
import { storeSchema } from './schemas/store.js';
import { networksSchema, versionsSchema } from './schemas/variants.js';
import { validateParamOverrides } from './validation/params.js';

export { replayableAssetsSchema } from './schemas/assets.js';

/**
 * Runtime schema for the human-authored `replayable.config.ts` contract.
 *
 * Parsing trims meaningful strings; applies the default audio capability,
 * background color, entry, version, and preview network; and rejects unknown
 * fields.
 */
export const replayableConfigSchema = z
  .strictObject({
    assets: replayableAssetsSchema,
    audio: audioSchema,
    backgroundColor: backgroundColorSchema,
    build: buildSchema,
    completion: completionSchema,
    controls: controlsSchema,
    devtools: devtoolsSchema,
    entry: requiredStringSchema.default('src/main.ts'),
    localization: localizationSchema,
    name: requiredStringSchema,
    networks: networksSchema,
    params: paramsSchema,
    screen: screenSchema,
    store: storeSchema,
    versions: versionsSchema,
  })
  .superRefine(({ networks, params, versions }, context) => {
    validateParamOverrides('networks', networks, params, context);
    validateParamOverrides('versions', versions, params, context);
  });
