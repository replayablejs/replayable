import { parse, type AnyNode } from 'acorn';
import { simple } from 'acorn-walk';

const BROWSER_OBJECTS = new Set(['window', 'self', 'globalThis', 'document']);

/**
 * Checks direct browser navigation without mistaking shader .location properties,
 * comments, or strings for executable redirects. Each module is parsed separately:
 * independent build entries may legitimately reuse the same top-level bindings.
 * This is a static direct-API check, not analysis of aliases or dynamically built code.
 */
export function containsBrowserRedirect(source: string): boolean {
  const program = parse(source, { ecmaVersion: 'latest', sourceType: 'module' });
  let redirects = false;
  simple(program, {
    AssignmentExpression(node) {
      const path = browserPath(node.left);
      redirects ||= path === 'location' || path === 'location.href';
    },
    CallExpression(node) {
      const path = browserPath(node.callee);
      redirects ||= path === 'location.assign' || path === 'location.replace' || path === 'open';
    },
  });
  return redirects;
}

/** Removes only recognized browser roots; arbitrary object properties do not match. */
function browserPath(node: AnyNode): string | undefined {
  const path = memberPath(node);
  if (path === undefined) {
    return undefined;
  }
  const [root, ...properties] = path;
  if (root === 'document' && properties[0] !== 'location') {
    return undefined;
  }
  if (root !== undefined && BROWSER_OBJECTS.has(root)) {
    return properties.join('.');
  }
  return root === 'location' ? path.join('.') : undefined;
}

/** Resolves literal member access, including window['location'] and optional chains. */
function memberPath(node: AnyNode): string[] | undefined {
  if (node.type === 'Identifier') {
    return [node.name];
  }
  if (node.type === 'ChainExpression') {
    return memberPath(node.expression);
  }
  if (node.type !== 'MemberExpression') {
    return undefined;
  }
  const object = memberPath(node.object);
  const property = node.property;
  const name =
    !node.computed && property.type === 'Identifier'
      ? property.name
      : property.type === 'Literal' && typeof property.value === 'string'
        ? property.value
        : undefined;
  return object !== undefined && name !== undefined ? [...object, name] : undefined;
}
