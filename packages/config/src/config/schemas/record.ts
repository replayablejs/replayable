import { z } from 'zod';

/** Checks authored keys before a record schema trims them and could overwrite a value. */
export function withUniqueTrimmedKeys<Value extends z.ZodType>(
  schema: z.ZodRecord<z.ZodString, Value>,
): z.ZodType<Record<string, z.output<Value>>, Record<string, z.input<Value>>> {
  return z
    .transform((input: Record<string, z.input<Value>>, context) => {
      // Leave shape errors to the record schema; this check only owns key collisions.
      if (typeof input !== 'object' || input === null || Array.isArray(input)) {
        return input;
      }

      const keys = new Set<string>();
      for (const key of Object.keys(input)) {
        const normalized = key.trim();
        if (keys.has(normalized)) {
          context.addIssue({
            code: 'custom',
            message: 'Names must be unique after trimming whitespace.',
            path: [key],
          });
        }
        keys.add(normalized);
      }

      return input;
    })
    .pipe(schema);
}
