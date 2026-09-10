import { z } from 'zod';

const OPAQUE_HEX_COLOR_PATTERN = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;

/** First-paint color shown behind the playable before and after content mounts. */
export const backgroundColorSchema = z
  .string()
  .regex(
    OPAQUE_HEX_COLOR_PATTERN,
    'Background color must be an opaque three- or six-digit hexadecimal CSS color.',
  )
  .default('#000000');
