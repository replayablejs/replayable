# Security

## Private reports

Use [GitHub private vulnerability reporting](https://github.com/replayablejs/replayable/security/advisories/new)
when available. If it is unavailable, ask a maintainer for a private contact channel without
posting exploit details in a public issue. Do not include credentials or private customer assets.

Describe affected code or package versions, impact, prerequisites and a minimal reproduction.
Keep sensitive details private while maintainers investigate and coordinate a fix.

## Release scope

The initial alpha is not published yet. There is no stable supported-version series. Report
issues against the current repository or a clearly identified candidate commit. Once packages
are released, reports should include exact package versions and the relevant exported artifact.

## Relevant boundaries

Build and asset commands execute on the developer's machine, and TypeScript configuration is
executable code. Review untrusted projects before running their configuration. Playables operate
inside browser and ad-host constraints; a network profile does not guarantee host certification.

Changes to package exports, resource loading, HTML preparation, redirects, store actions and
publishing credentials deserve focused review. Report exposed credentials privately and revoke
them through the owning service; do not copy them into issues or test fixtures.
