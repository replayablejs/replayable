---
'@replayablejs/config': minor
'@replayablejs/runtime': minor
'@replayablejs/cli': minor
---

Adopt Studio-compatible parameter definitions for number, boolean, text, range, color, select,
and one-level object groups. Resolve partial object overrides independently per child using
project → version → network precedence. Runtime parameter types now also include readonly
objects containing primitive children.

Export reusable named parameter definitions, shared ReplayableParamMetadata and
ReplayableParamCondition contracts, and ReplayableSelectOption. Generated declarations reuse
these types instead of repeating expanded metadata and definition unions throughout the schema.

This replaces the previous authored format. Add label to every definition, move description
to optional info, convert string parameters to select with options shaped as { name, value },
and convert bounded number parameters to range with min, max, and step directly on the definition.
Keep existing runtime keys and values. Use text for unrestricted strings and number for unrestricted
finite numbers. Object groups derive defaults from their scalar children and cannot be nested.

The config command's metadata schemaVersion is now 2. It carries label, info, category, named
select options, range bounds, object child definitions, and optional when metadata. Conditions
can reference a root scalar by name or a grouped scalar using [group, child]; they never filter
runtime values. Studio import, live updates, media parameters, and optional objects are not included.
