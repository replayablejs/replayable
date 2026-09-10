import type { PixiIntegration } from '#types/pixi.js';

/** Installs integrations in declaration order and cleans them up in reverse order. */
export function setupPixiIntegrations(integrations: readonly PixiIntegration[] = []): () => void {
  const cleanups: (() => void)[] = [];

  try {
    for (const integration of integrations) {
      cleanups.push(integration.setup());
    }
  } catch (error) {
    failPixiSetup(error, cleanups);
  }

  return () => cleanupPixiResources(cleanups);
}
import { cleanupPixiResources, failPixiSetup } from '#lifecycle/cleanup-pixi-resources.js';
