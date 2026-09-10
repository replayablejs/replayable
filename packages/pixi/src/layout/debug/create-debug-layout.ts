import type { Container } from 'pixi.js';

import type { DebugLayoutArea, LayoutDebugRenderer } from '#types/layout-debug.js';
import type {
  LayoutAttachment,
  LayoutConfig,
  ReplayableLayout,
  ResolvedLayoutArea,
} from '#types/layout.js';

import { resolveContentBounds } from './resolve-content-bounds.js';
import { resolveLayoutDebugOptions } from './resolve-layout-debug-options.js';

/**
 * Wraps a layout with the development boundary used by diagnostics.
 *
 * Delegation remains intentionally transparent: successful operations keep
 * their normal behavior and failures escape unchanged. Diagnostic state
 * therefore changes only after a delegated mutation has completed.
 */
export function createDebugLayout(
  layout: ReplayableLayout,
  initialConfig: LayoutConfig,
  renderer: LayoutDebugRenderer,
): ReplayableLayout {
  const attachments = new Map<Container, LayoutAttachment>();
  let config = initialConfig;
  let destroyed = false;

  renderInspection();

  return {
    container: layout.container,

    /** Delegates reads directly; the decorator never owns resolved area state. */
    getArea(name): ResolvedLayoutArea | undefined {
      return layout.getArea(name);
    },

    /**
     * Delegates attachment first, then mirrors ownership for diagnostics.
     *
     * This order is essential: if core validation or measurement throws, the
     * debugger records nothing and emits no misleading redraw. The additional
     * destruction listener updates the overlay when application code destroys
     * attached content without calling `detach()`.
     */
    attach(areaName, content): void {
      layout.attach(areaName, content);

      /** Mirrors core cleanup and immediately removes the stale diagnostic box. */
      const handleDestroyed = (): void => {
        attachments.delete(content);
        renderInspection();
      };

      content.once('destroyed', handleDestroyed);
      attachments.set(content, { areaName, handleDestroyed });
      renderInspection();
    },

    /** Mirrors a new area name only after the core move has succeeded. */
    move(content, areaName): void {
      layout.move(content, areaName);
      const attachment = requireAttachment(content);

      attachments.set(content, { ...attachment, areaName });
      renderInspection();
    },

    /**
     * Stops diagnostic tracking after core ownership is successfully released.
     * The exact registered callback is removed to avoid retaining the decorator.
     */
    detach(content): void {
      layout.detach(content);
      const attachment = requireAttachment(content);

      content.off('destroyed', attachment.handleDestroyed);
      attachments.delete(content);
      renderInspection();
    },

    /**
     * Adopts new debug configuration only after the atomic core update succeeds.
     * This keeps the drawn inspection synchronized with actual live transforms.
     */
    update(nextConfig): void {
      layout.update(nextConfig);
      config = nextConfig;
      renderInspection();
    },

    /**
     * Idempotently releases decorator listeners and renderer resources before
     * delegating destruction to the core layout and its owned container.
     */
    destroy(): void {
      if (destroyed) {
        return;
      }

      destroyed = true;

      for (const [content, attachment] of attachments) {
        content.off('destroyed', attachment.handleDestroyed);
      }

      attachments.clear();
      renderer.destroy();
      layout.destroy();
    },
  } satisfies ReplayableLayout;

  /**
   * Resolves public debug shorthand and sends one complete renderer snapshot.
   * `undefined` is an explicit request to remove the overlay. Content geometry
   * is not measured when its corresponding diagnostic is disabled.
   */
  function renderInspection(): void {
    const options = resolveLayoutDebugOptions(config.debug);

    if (options === undefined) {
      renderer.render(undefined);
      return;
    }

    renderer.render({
      areas: Object.keys(config.areas).map((name) =>
        inspectArea(name, options.contentBounds || options.labels.content),
      ),
      bounds: config.bounds,
      options,
    });
  }

  /**
   * Combines authoritative core area geometry with decorator-owned occupancy.
   *
   * Attached content is filtered in map insertion order, so multiple diagnostic
   * boxes follow deterministic attachment order without exposing the map itself.
   */
  function inspectArea(name: string, includeContentBounds: boolean): DebugLayoutArea {
    const area = layout.getArea(name);

    if (area === undefined) {
      throw new Error(`Debug layout could not inspect area "${name}".`);
    }

    const areaAttachments = [...attachments].filter(
      ([, attachment]) => attachment.areaName === name,
    );

    return {
      ...area,
      contentBounds: includeContentBounds
        ? areaAttachments.map(([content]) => resolveContentBounds(content))
        : [],
      occupied: areaAttachments.length > 0,
    };
  }

  /** Guards the invariant that every successful core attachment was mirrored. */
  function requireAttachment(content: Container): LayoutAttachment {
    const attachment = attachments.get(content);

    if (attachment === undefined) {
      throw new Error('Debug layout lost track of attached content.');
    }

    return attachment;
  }
}
