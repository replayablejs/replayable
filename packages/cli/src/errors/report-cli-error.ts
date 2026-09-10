import { inspect } from 'node:util';

/** Reports actionable nested failures without a stack dump and marks the command as failed. */
export function reportCliError(error: unknown): void {
  console.error(formatError(error, new Set()));
  process.exitCode = 1;
}

/** Preserves aggregate members and causes, guarding against circular error chains. */
function formatError(error: unknown, ancestors: Set<Error>): string {
  if (!(error instanceof Error)) {
    return typeof error === 'string' ? error : inspect(error, { colors: false, depth: 2 });
  }
  if (ancestors.has(error)) {
    return '[Circular error]';
  }

  ancestors.add(error);
  const lines = [error.message || error.name];

  if (error instanceof AggregateError) {
    const members: readonly unknown[] = error.errors;
    for (const member of members) {
      lines.push(indent(formatError(member, ancestors)));
    }
  }
  if (error.cause !== undefined) {
    lines.push(indent(`Caused by: ${formatError(error.cause, ancestors)}`));
  }

  ancestors.delete(error);
  return lines.join('\n');
}

/** Keeps multiline validation messages aligned beneath their parent failure. */
function indent(message: string): string {
  return message
    .split('\n')
    .map((line) => `  ${line}`)
    .join('\n');
}
