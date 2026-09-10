# Alpha preparation and publication

This is a maintainer procedure. It does not authorize publication. The target is
`0.1.0-alpha.0` for all ten `@replayablejs` packages, with one shared version for every release afterward.
Complete the candidate checks in this procedure before publication.

## Prepare versions

In the release-preparation checkout, review `pnpm changeset status`, then enter alpha mode once:

```sh
pnpm changeset pre enter alpha
pnpm changeset version
pnpm install --lockfile-only --ignore-scripts
pnpm install --frozen-lockfile
```

Check every public version is `0.1.0-alpha.0`, root/docs/examples remain private, and the
changelogs, dependency ranges, prerelease state and lockfile agree. Workspace ranges can remain
`workspace:*` in source; pnpm converts them in tarballs. For subsequent alpha changes stay in
prerelease mode and run the version/lockfile steps with new changesets.

Run fresh candidate checks, examples and packed consumers. Complete manual browser and asset
rights review. Obtain approval of the exact commit, versions and package contents. No previous
local rehearsal is a substitute for this candidate verification.

## First publication

The proposed bootstrap is interactive publication by the npm owner, using account login and 2FA.
This avoids a temporary CI write token. Log in with `npm login` and verify the account with
`npm whoami`. Authentication and 2FA responses belong in npm's prompts, never repository files.

Pack each public package with pnpm into a local release directory. Review the unchanged tarballs
and record their hashes. Do not publish source folders with unresolved workspace/catalog ranges.
The current dependency/peer order is:

1. runtime
2. assets
3. canvas
4. devtools
5. tween
6. config
7. pixi
8. build
9. export
10. cli

After explicit release approval, publish each reviewed tarball with public access and `alpha`.
For example, from the directory containing `release-tarballs`:

```sh
npm publish ./release-tarballs/replayablejs-runtime-0.1.0-alpha.0.tgz --access public --tag alpha --registry https://registry.npmjs.org
npm view @replayablejs/runtime@0.1.0-alpha.0 version dist.integrity --registry https://registry.npmjs.org
npm view @replayablejs/runtime dist-tags --json --registry https://registry.npmjs.org
```

Repeat for the approved packages in order. Verify the registry version, tarball integrity and
`alpha` tag after each publication. Reserve `latest` for a regular release. On failure, inspect
registry state before retrying; published name/version pairs cannot be overwritten. Do not delete
published packages to retry. This bootstrap from a local machine has no GitHub build provenance.

After publication, repeat npm and pnpm installations using registry packages, with no tarball
or workspace overrides, then rebuild and test representative playables.
[Official npm publish reference](https://docs.npmjs.com/commands/npm-publish/).

## Later trusted publishing

The planned GitHub identity is organization `replayablejs`, repository `replayable`, workflow
`publish.yml`. That workflow is not implemented yet. Choose any release environment when
implementing it, then configure the exact workflow/environment identity in each package's npm
trusted-publisher settings. Enable direct publication if that is the chosen workflow.

Use a GitHub-hosted runner, npm >=11.5.1 and Node >=22.14.0, with `contents: read` and
`id-token: write` in the publishing job. Ordinary CI remains read-only. OIDC avoids a long-lived
npm write token. Provenance requires a public repository and public package. A saved trust
configuration is not a verified publish; check the next approved release's registry evidence.
[Official trusted-publishing documentation](https://docs.npmjs.com/trusted-publishers/).

## Release evidence

Record the candidate commit, versions, hashes, CI results, manual checks and registry verification
at release time. Retain evidence locally; Only the Pages site is uploaded by CI; release evidence stays local. Documentation
hosting is configured separately from npm publication. Do not describe a prepared version as published or ready
until the corresponding checks have actually completed.
