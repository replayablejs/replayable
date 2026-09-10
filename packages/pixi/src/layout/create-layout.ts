import { Container } from 'pixi.js';

import type {
  LayoutAttachment,
  LayoutConfig,
  ReplayableLayout,
  ResolvedLayoutArea,
} from '#types/layout.js';

import { createDebugLayout } from './debug/create-debug-layout.js';
import { createLayoutDebugRenderer } from './debug/create-layout-debug-renderer.js';
import { applyContentLayout, resolveContentLayout } from './layout-content.js';
import { resolveLayout } from './resolve-layout.js';

/**
 * Creates a named-area layout whose container can be mounted on any Pixi stage.
 *
 * @example Fitting rotated content through an explicit layout root
 * ```ts
 * const layoutRoot = new Container();
 * const image = createSprite({ texture: 'character' });
 *
 * image.rotation = Math.PI / 4;
 * layoutRoot.addChild(image);
 * layout.attach('character', layoutRoot);
 * ```
 *
 * The extra container is opt-in: ordinary untransformed content can be
 * attached directly without adding hidden nodes to the Pixi scene graph.
 *
 * Development builds transparently decorate the core controller with layout
 * diagnostics. `import.meta.env.DEV` is replaced at build time, allowing the
 * complete debugger branch to be removed from production playable bundles.
 */
export function createLayout(config: LayoutConfig): ReplayableLayout {
  const layout = createCoreLayout(config);

  if (!import.meta.env.DEV) {
    return layout;
  }

  return createDebugLayout(layout, config, createLayoutDebugRenderer(layout.container));
}

/**
 * Implements layout ownership and placement without development instrumentation.
 *
 * The controller owns one Pixi container and the transforms of every attached
 * object. It deliberately keeps content as direct children: applications do
 * not pay for an extra wrapper per area. The attachment map is authoritative
 * for ownership; the Pixi parent is checked as a separate invariant so manual
 * reparenting fails clearly instead of silently corrupting future updates.
 */
export function createCoreLayout(config: LayoutConfig): ReplayableLayout {
  const container = new Container();
  const attachments = new Map<Container, LayoutAttachment>();
  let areas = resolveLayout(config);
  let destroyed = false;

  return {
    container,

    /**
     * Returns the currently resolved, immutable area snapshot.
     *
     * Coordinates are layout-local pixels, not normalized authoring values.
     * Callers must request the area again after `update()` because the returned
     * snapshot intentionally does not mutate in place.
     */
    getArea(name): ResolvedLayoutArea | undefined {
      requireActive();
      return areas.get(name);
    },

    /**
     * Transfers placement ownership of one Pixi object to a named area.
     *
     * Every operation capable of failing runs before the scene graph or
     * attachment map changes. The resolved transform is therefore committed
     * only after validation and measurement succeed. Destroyed content removes
     * its own bookkeeping entry through Pixi's `destroyed` event.
     */
    attach(areaName, content): void {
      requireActive();
      const area = requireArea(areaName);

      if (attachments.has(content)) {
        throw new Error('Content is already attached to this layout. Use move() instead.');
      }

      if (content.destroyed) {
        throw new Error('Cannot attach destroyed content to a layout.');
      }

      assertNoParentCycle(content);
      const contentLayout = resolveContentLayout(content, area);

      container.addChild(content);

      /** Forgets ownership when application code destroys content directly. */
      const handleDestroyed = (): void => {
        attachments.delete(content);
      };

      content.once('destroyed', handleDestroyed);
      attachments.set(content, { areaName, handleDestroyed });
      applyContentLayout(content, contentLayout);
    },

    /**
     * Reassigns managed content to another area without reparenting it.
     *
     * Measurement is completed before either the recorded area name or live
     * transform changes, preserving the old valid placement if resolution
     * throws—for example when scaled content has zero-sized local bounds.
     */
    move(content, areaName): void {
      requireActive();
      const attachment = requireAttachment(content);
      const area = requireArea(areaName);

      requireManagedParent(content);
      const contentLayout = resolveContentLayout(content, area);

      attachments.set(content, { ...attachment, areaName });
      applyContentLayout(content, contentLayout);
    },

    /**
     * Releases placement ownership and removes content from this container.
     *
     * Detach never destroys application content. The parent check makes the
     * final removal tolerant of content already removed by Pixi destruction,
     * while `requireAttachment` still rejects objects this layout never owned.
     */
    detach(content): void {
      requireActive();
      const attachment = requireAttachment(content);

      content.off('destroyed', attachment.handleDestroyed);
      attachments.delete(content);

      if (content.parent === container) {
        container.removeChild(content);
      }
    },

    /**
     * Atomically replaces bounds and areas, then relays out every attachment.
     *
     * Resolution and all content measurements are staged first. No current
     * area or live transform changes unless the complete next configuration is
     * valid for every attachment. Occupied areas cannot disappear because that
     * would leave their content without a deterministic destination.
     */
    update(nextConfig): void {
      requireActive();
      const nextAreas = resolveLayout(nextConfig);
      const nextContentLayouts = new Map<Container, ReturnType<typeof resolveContentLayout>>();

      for (const [content, { areaName }] of attachments) {
        requireManagedParent(content);
        const area = nextAreas.get(areaName);

        if (area === undefined) {
          throw new Error(`Cannot remove occupied layout area "${areaName}".`);
        }

        nextContentLayouts.set(content, resolveContentLayout(content, area));
      }

      areas = nextAreas;

      for (const [content, contentLayout] of nextContentLayouts) {
        applyContentLayout(content, contentLayout);
      }
    },

    /**
     * Idempotently releases layout bookkeeping and destroys only its container.
     *
     * Attached application objects are detached, not destroyed. Their listeners
     * are removed explicitly so they no longer retain this controller after its
     * lifecycle ends.
     */
    destroy(): void {
      if (destroyed) {
        return;
      }

      destroyed = true;

      for (const [content, attachment] of attachments) {
        content.off('destroyed', attachment.handleDestroyed);

        if (content.parent === container) {
          container.removeChild(content);
        }
      }

      attachments.clear();
      areas = new Map();
      container.destroy();
    },
  };

  /** Guards every read and mutation whose state disappears during destruction. */
  function requireActive(): void {
    if (destroyed) {
      throw new Error('Cannot use a destroyed Replayable layout.');
    }
  }

  /** Resolves a required area while producing an error that names the authoring key. */
  function requireArea(name: string): ResolvedLayoutArea {
    const area = areas.get(name);

    if (area === undefined) {
      throw new Error(`Layout area "${name}" does not exist.`);
    }

    return area;
  }

  /** Returns this layout's ownership record for content or rejects foreign content. */
  function requireAttachment(content: Container): LayoutAttachment {
    const attachment = attachments.get(content);

    if (attachment === undefined) {
      throw new Error('Content is not attached to this layout.');
    }

    return attachment;
  }

  /**
   * Detects manual scene-graph reparenting of managed content.
   *
   * Continuing after reparenting would update an object in another coordinate
   * space, so failing is safer than producing a visually incorrect placement.
   */
  function requireManagedParent(content: Container): void {
    if (content.parent !== container) {
      throw new Error('Attached layout content was reparented outside the layout container.');
    }
  }

  /**
   * Prevents Pixi from parenting the layout beneath its own descendant.
   *
   * Walking upward from the owned container catches both the container itself
   * and any ancestor supplied as content, either of which would create a cycle.
   */
  function assertNoParentCycle(content: Container): void {
    let ancestor: Container | null = container;

    while (ancestor !== null) {
      if (ancestor === content) {
        throw new Error('Cannot attach the layout container or one of its ancestors.');
      }

      ancestor = ancestor.parent;
    }
  }
}
