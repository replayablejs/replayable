# Changesets

Run `pnpm changeset` from the repository root to describe a shipped change. Choose directly
affected `@replayablejs` packages. Compatible fixes use patch; features and pre-1.0 breaking
changes use minor. Explain breaking changes and migration steps explicitly.

All ten public packages share one version through a single `fixed` group. Keep `linked` empty. Root, docs and examples are private.
Docs-only or test-only changes without shipped effects do not need a changeset.

The initial changesets have been applied: all ten public packages are at `0.1.0-alpha.0`,
and `.changeset/pre.json` keeps Changesets in alpha mode. Publication is still pending.
Add new changesets for subsequent alpha changes and follow the
[release procedure](../docs/guide/publishing.md).

Use `pnpm changeset status` to preview intent. Ordinary contributors should not run versioning
or publication. See [CONTRIBUTING.md](../CONTRIBUTING.md) for checks and review expectations.
