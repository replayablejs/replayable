# Contributing to Replayable

## Local Git hooks

`pnpm install` enables Husky through the root `prepare` script. Before a commit, lint-staged
checks formatting for staged source and documentation files. Fix formatting with `pnpm format`,
review the changes and stage them again. Before a push, the hook runs `pnpm check`.

CI remains the final verification because local hooks can be skipped. After recreating Git
metadata for the initial commit, run `pnpm prepare` to enable the hooks again.

Use Node.js 24+ and pnpm 10.32.1. The repository contains ten public `@replayablejs` packages,
three private examples and a private VitePress documentation workspace.

## Set up and check changes

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm check
```

`pnpm check` runs formatting, dependency-singleton validation, then Turbo lint, typecheck, test
and build tasks. `pnpm build` builds packages and docs, excluding examples. Use `pnpm format`
to apply repository formatting. Work on source files and regenerate build products.

Use package-scoped commands for a focused change, such as
`pnpm --filter @replayablejs/runtime test`. Before a release, also run:

```sh
pnpm --filter @replayablejs/example-basic-playable export
pnpm --filter @replayablejs/example-basic-pixi-playable export
pnpm packages:check
```

These require the preceding builds. The packed-consumer script installs unchanged tarballs
outside the workspace, checks public imports in NodeNext and Bundler modes, and runs CLI help.
Its consumer-only overrides resolve unpublished internal versions. It is not a registry-install
or gameplay test. Successful temporary directories are removed; failures retain a local path.
CI does not upload artifacts, so remote temporary files disappear with the runner.

## Changesets

Run `pnpm changeset` for shipped behavior, API/types, compatibility, dependency or packaging
changes. Select directly affected public packages and explain the observable change.

| Change before 1.0  | Version intent                          |
| ------------------ | --------------------------------------- |
| Compatible fix     | Patch                                   |
| New capability     | Minor                                   |
| Breaking change    | Minor, with explicit migration guidance |
| Initial stable 1.0 | Separate maintainer decision            |

Docs-only, test-only and internal changes without shipped effects can omit a changeset; explain
that in review. Keep all ten public packages in one Changesets `fixed` group and leave `linked` empty.
A release advances the complete group to the same version, even when only one package changes. Do not change package versions as part of an ordinary PR.

The initial alpha changeset includes all ten public packages. `pnpm changeset status` previews
intent without applying it. Until prerelease mode is active it shows the stable target `0.1.0`.
See [release preparation](docs/guide/publishing.md) for the alpha sequence.

## Code and resource review

Keep package exports deliberate and validate packed consumption when they change. Preserve one
runtime instance across integrations. Exercise generated assets and examples when changing their
contracts. Runtime/browser behavior needs manual verification beyond DOM-emulated unit tests;
browser automation is optional.

Original contributions use the repository's MIT license. Keep provenance and required license
notices with third-party resources. Obtain the rights needed for the intended distribution before
adding fonts, artwork, sound or Spine assets. Security reports follow [SECURITY.md](SECURITY.md).

## CI and release boundaries

CI runs frozen installation, repository checks, both example exports and packed-consumer checks
on Ubuntu 24.04, Windows Server 2025 and macOS 26 using Node 24.13.0. Its actions are pinned.
A configured job is not evidence that the remote runner has passed. Branch protection and the
publishing workflow need separate setup.

The first target is `0.1.0-alpha.0`, under npm's `alpha` tag. Review the maintainer publication status below before proposing publication. Root, docs and examples
remain private. Never run versioning, Git history resets, pushes or publication merely because
ordinary checks passed.

## Maintainer publication status

User-facing documentation is written for the published `0.1.0-alpha.0` release. This editorial
convention does not mean publication has occurred: all ten package versions are prepared at
`0.1.0-alpha.0`, with Changesets alpha mode active. Publication and GitHub CI execution remain
unverified.

Before publication, run the final candidate build/export/pack and consumer checks, verify GitHub
CI and review the exact candidate. Afterward verify actual registry installations. Browser
automation is optional. CI uploads only the Pages site; release evidence stays local. The Pages
workflow is implemented, while actual deployment and future npm trusted publishing remain pending.

## Documentation and demo hosting

CI builds the Pages site on Linux for pull requests and pushes. On pushes to `main`, it uploads
`docs/dist` and deploys only after the entire three-platform check matrix succeeds.
Select **Settings → Pages → Build and deployment → Source → GitHub Actions** once in GitHub.
The site is served at `https://replayablejs.github.io/replayable/`.

To reproduce the site locally, run `pnpm check`, export both playable examples using the commands
above, then run `pnpm pages:build`. This copies their English preview exports into generated
`docs/public/demos/` and builds the documentation with the `/replayable/` base path. Missing
preview exports fail the build. Preview with `pnpm --filter @replayablejs/docs exec vitepress preview --outDir dist --base /replayable/`.

Only the documentation and the two standalone preview ads are uploaded. npm publication is a
separate release operation. Deployment requires the repository's GitHub Pages settings to be enabled.
