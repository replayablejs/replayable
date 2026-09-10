import { mkdir, mkdtemp, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

import sharp from 'sharp';
import { glob } from 'tinyglobby';
import { onTestFinished, vi } from 'vitest';

// Tests delete fixtures immediately; libvips caching can retain Windows file handles.
sharp.cache(false);
// Integration fixtures invoke native image, audio and font encoders.
vi.setConfig({ testTimeout: 30_000 });

/** Filesystem sandbox owned by one test and removed when that test finishes. */
export interface TestProject {
  /** Absolute root passed to APIs that accept a working directory. */
  readonly root: string;
  /** Creates a directory, including missing parents. */
  readonly directory: (path: string) => Promise<void>;
  /** Lists the direct children of a directory. */
  readonly entries: (path: string) => Promise<string[]>;
  /** Lists all files beneath a directory using project-relative POSIX paths. */
  readonly files: (path: string) => Promise<string[]>;
  /** Creates a symbolic link inside the project. */
  readonly link: (target: string, path: string) => Promise<void>;
  /** Resolves project-relative path segments to an absolute path. */
  readonly path: (...segments: string[]) => string;
  /** Reads a file as bytes. */
  readonly readBytes: (path: string) => Promise<Buffer>;
  /** Reads a UTF-8 text file. */
  readonly readText: (path: string) => Promise<string>;
  /** Writes a file after creating its parent directory. */
  readonly write: (path: string, contents: string | Uint8Array) => Promise<void>;
}

/**
 * Creates an isolated temporary project for one test.
 *
 * File methods accept paths relative to the project root and create parent
 * directories where appropriate. The entire project is removed automatically
 * after the owning Vitest test finishes, including when an assertion fails.
 */
export async function createTestProject(prefix = 'replayable-assets-'): Promise<TestProject> {
  const root = await mkdtemp(resolve(tmpdir(), prefix));
  const path = (...segments: string[]): string => resolve(root, ...segments);

  // Windows may hold native encoder files briefly after processing.
  onTestFinished(
    () =>
      rm(root, {
        force: true,
        maxRetries: 5,
        recursive: true,
        retryDelay: 20,
      }),
    30_000,
  );

  return {
    root,
    async directory(relativePath): Promise<void> {
      await mkdir(path(relativePath), { recursive: true });
    },
    entries: (relativePath) => readdir(path(relativePath)),
    files: (relativePath) =>
      glob('**/*', {
        cwd: path(relativePath),
        dot: true,
        onlyFiles: true,
      }),
    async link(target, relativePath): Promise<void> {
      await symlink(target, path(relativePath));
    },
    path,
    readBytes: (relativePath) => readFile(path(relativePath)),
    readText: (relativePath) => readFile(path(relativePath), 'utf8'),
    async write(relativePath, contents): Promise<void> {
      const file = path(relativePath);

      await mkdir(dirname(file), { recursive: true });
      await writeFile(file, contents);
    },
  };
}
