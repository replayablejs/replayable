import { cleanupThreeResources, failThreeSetup } from '#lifecycle/cleanup-three-resources.js';
import type { ThreeIntegration } from '#types/integrations.js';

/** Installs capabilities in declaration order and rolls back partial setup on failure. */
export function setupThreeIntegrations(integrations: readonly ThreeIntegration[] = []): () => void {
  const cleanups: (() => void)[] = [];
  try {
    for (const integration of integrations) {
      cleanups.push(integration.setup());
    }
  } catch (error) {
    failThreeSetup(error, cleanups);
  }
  return () => cleanupThreeResources(cleanups);
}
