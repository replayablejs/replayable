import { afterEach, expect, it, vi } from 'vitest';

import { reportCliError } from '../src/errors/report-cli-error.js';

const originalExitCode = process.exitCode;

afterEach(() => {
  process.exitCode = originalExitCode;
  vi.restoreAllMocks();
});

it('reports aggregate members and nested causes, and sets a failure exit code', () => {
  const output = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  reportCliError(
    new AggregateError(
      [
        new Error('Build failed', { cause: new Error('Missing entry') }),
        new Error('Restoration failed'),
      ],
      'Project failed',
    ),
  );

  expect(output).toHaveBeenCalledExactlyOnceWith(
    'Project failed\n  Build failed\n    Caused by: Missing entry\n  Restoration failed',
  );
  expect(process.exitCode).toBe(1);
});

it('handles circular causes without hiding the original message', () => {
  const output = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const error = new Error('Failed');
  error.cause = error;
  reportCliError(error);
  expect(output).toHaveBeenCalledExactlyOnceWith('Failed\n  Caused by: [Circular error]');
});

it('preserves repeated errors in separate branches rather than calling them circular', () => {
  const output = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  const error = new Error('Shared failure');
  reportCliError(new AggregateError([error, error], 'Two failures'));
  expect(output).toHaveBeenCalledExactlyOnceWith(
    'Two failures\n  Shared failure\n  Shared failure',
  );
});

it.each(['plain failure', undefined, { detail: 'failure' }])(
  'reports non-Error failures: %j',
  (error) => {
    const output = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    reportCliError(error);
    expect(output).toHaveBeenCalledOnce();
    expect(process.exitCode).toBe(1);
  },
);
