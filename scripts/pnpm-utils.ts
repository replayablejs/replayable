import {
  execFileSync,
  type ExecFileSyncOptions,
  type ExecFileSyncOptionsWithBufferEncoding,
  type ExecFileSyncOptionsWithStringEncoding,
} from 'node:child_process';

export function invokePackageManager(
  pnpmPath: string,
  args: readonly string[],
  options: ExecFileSyncOptionsWithStringEncoding,
): string;
export function invokePackageManager(
  pnpmPath: string,
  args: readonly string[],
  options: ExecFileSyncOptionsWithBufferEncoding,
): Buffer;
export function invokePackageManager(
  pnpmPath: string,
  args: readonly string[],
  options: ExecFileSyncOptions,
): string | Buffer {
  const isJavaScriptLauncher = /\.[cm]?js$/i.test(pnpmPath);

  return execFileSync(
    isJavaScriptLauncher ? process.execPath : pnpmPath,
    isJavaScriptLauncher ? [pnpmPath, ...args] : args,
    options,
  );
}
