# Alpha release

This documentation describes **Replayable 0.1.0-alpha.1**. Install packages from the
`@replayablejs` scope. The npm `alpha` tag selects the current alpha; pin exact versions when
you need reproducible installations.

## Versioning

All ten public packages start at `0.1.0-alpha.0` and advance together in one fixed release
group. Install matching Replayable package versions. Documentation refers to that shared toolkit
version; breaking releases need migration guidance and access to the previous documentation. APIs may change before 1.0; review package changelogs when upgrading.

## Compatibility

Build tooling requires Node.js 24+. The repository uses pnpm 10.32.1. Consumer TypeScript projects
use `strict: true` and `skipLibCheck: true` because of third-party declaration conflicts in the
Pixi/WebGPU and Motion dependency paths.

Builds target iOS 16.1 and Chrome 105. Test your final playable on the actual devices and ad hosts
you intend to support. Export validation enforces implemented delivery rules; it does not certify
acceptance by an ad network.

## Package names

The product and CLI are named Replayable and `replayable`. The GitHub organization and npm scope
are `replayablejs`. Root, documentation and example workspaces are private and are not published
as installable packages.

Continue with [getting started](./getting-started.md).
