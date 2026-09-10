import type { CompressedEntryRole } from '#types/javascript.js';

/**
 * Awaits native module evaluation, including top-level await and its failures.
 *
 * A script-element error event does not report every evaluation failure. Import's
 * promise does, without global error listeners or an appended completion event.
 * Each entry is a self-contained build, so it has no relative imports to resolve.
 */
export async function executeModule(source: string, role: CompressedEntryRole): Promise<void> {
  const url = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));

  try {
    await import(/* @vite-ignore */ url);
  } catch (cause) {
    throw new Error(`Failed to execute compressed Replayable ${role} entry.`, { cause });
  } finally {
    // Releases the temporary source URL, not the evaluated module's live objects.
    URL.revokeObjectURL(url);
  }
}
