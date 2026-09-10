import { describe, expect, it } from 'vitest';

import { setupPixiIntegrations } from '../src/integrations/setup-pixi-integrations.js';
import type { PixiIntegration } from '../src/types/pixi.js';

describe('Pixi integrations', () => {
  it('sets up in declaration order and cleans up once in reverse order', () => {
    const calls: string[] = [];
    const cleanup = setupPixiIntegrations([
      integration('first', calls),
      integration('second', calls),
    ]);

    cleanup();
    cleanup();

    expect(calls).toEqual(['setup:first', 'setup:second', 'cleanup:second', 'cleanup:first']);
  });

  it('cleans up completed setups when a later integration fails', () => {
    const calls: string[] = [];
    const failure = new Error('setup failed');

    expect(() =>
      setupPixiIntegrations([
        integration('first', calls),
        {
          setup(): () => void {
            throw failure;
          },
        },
      ]),
    ).toThrow(failure);
    expect(calls).toEqual(['setup:first', 'cleanup:first']);
  });

  it('continues cleanup after a failure and never retries a completed cleanup', () => {
    const calls: string[] = [];
    const cleanup = setupPixiIntegrations([
      integration('first', calls),
      {
        setup: () => () => {
          calls.push('cleanup:second');
          throw new Error('second failed');
        },
      },
    ]);
    expect(cleanup).toThrow('second failed');
    expect(calls).toEqual(['setup:first', 'cleanup:second', 'cleanup:first']);
    expect(cleanup).not.toThrow();
  });

  it('preserves setup failure and all cleanup failures', () => {
    const setupError = new Error('setup failed');
    const cleanupError = new Error('cleanup failed');
    let failure: unknown;
    try {
      setupPixiIntegrations([
        {
          setup: () => () => {
            throw cleanupError;
          },
        },
        {
          setup: () => {
            throw setupError;
          },
        },
      ]);
      throw new Error('Expected setup to fail');
    } catch (error) {
      failure = error;
    }
    expect(failure).toMatchObject({ errors: [setupError, cleanupError], cause: setupError });
  });
});

/** Creates an observable integration without coupling tests to implementation details. */
function integration(name: string, calls: string[]): PixiIntegration {
  return {
    setup(): () => void {
      calls.push(`setup:${name}`);

      return () => {
        calls.push(`cleanup:${name}`);
      };
    },
  };
}
