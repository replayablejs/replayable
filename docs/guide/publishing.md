# Releases and publication

All ten public packages share one version through Changesets. Versions `0.1.0-alpha.0`
and `0.1.0-alpha.1` have been published. The `alpha` and `latest` tags currently point to
`0.1.0-alpha.1`. Root, docs and examples remain private.

## Prepare a change

Run `pnpm changeset`, select the packages directly affected, and describe the shipped change.
Use patch for compatible fixes and minor for features or pre-1.0 breaking changes. Keep alpha
mode active until the project is ready for a regular release.

After the change reaches `main` and CI succeeds, `.github/workflows/publish.yml` uses Changesets
v3 actions to create or update a version pull request. Review its versions, changelogs and
lockfile before merging. GitHub Actions must be allowed to create pull requests in repository
Settings → Actions → General. A PR created with the default GitHub token may need to be closed
and reopened by a maintainer to trigger PR CI; merging it always triggers the main CI gate.

## Automated publication

The release workflow runs only after successful push CI on `main` in this repository. It checks
that the tested commit is still the current main commit before selecting work. Pull requests and
fork CI cannot enter this workflow's release jobs.

When no changesets remain and unpublished versions exist, a read-only job builds the packages,
checks clean packed installation, audits production dependencies, and packs the publication
artifacts. A separate publishing job receives those artifacts and uses npm OIDC authentication.
It also creates package Git tags and GitHub releases. No npm write token is stored in GitHub.

Publication is gated by the repository Actions variable `NPM_TRUSTED_PUBLISHING=true`.
Leave it unset until the npm setup below is complete. The workflow can still prepare version
PRs and package artifacts while publication is disabled. To retry a failed run, rerun the Release
workflow in GitHub Actions; Changesets skips versions that are already published. Inspect any
partial publication before retrying, since published versions cannot be overwritten.

The prerelease state selects the `alpha` tag. OIDC publication does not replace the separate
maintainer step of advancing `latest` during the alpha period. After a release is verified, an
npm owner can update it with `npm dist-tag add @replayablejs/<package>@<version> latest` for
each package, completing npm's authentication prompts. Keep all ten default versions aligned.

## One-time npm setup

For each of the ten packages, open its npm Settings page and add a GitHub Actions trusted
publisher with these exact fields:

| Field                | Value                       |
| -------------------- | --------------------------- |
| Organization or user | `replayablejs`              |
| Repository           | `replayable`                |
| Workflow filename    | `publish.yml`               |
| Environment name     | Leave empty                 |
| Allowed actions      | Enable direct `npm publish` |

Packages: runtime, assets, canvas, devtools, tween, config, pixi, build, export and cli, all under
`@replayablejs`. After saving all ten records, set `NPM_TRUSTED_PUBLISHING` to `true` in
GitHub Settings → Secrets and variables → Actions → Variables. The workflow uses Node 24.13.0
with npm 11.6.2, which meets npm's trusted publishing requirements.

A saved configuration is not proof of a successful OIDC publication. Verify the next release's
registry versions, integrity, tags and provenance after the publishing job succeeds.
[Official npm trusted publishing documentation](https://docs.npmjs.com/trusted-publishers/).

## Manual recovery

Use `npm login` and `npm whoami` to authenticate locally. Keep authentication codes in npm's
prompts. Build and pack with pnpm so workspace and catalog dependency ranges are resolved;
do not publish source folders with those ranges unresolved.

Publish reviewed tarballs in dependency order: runtime, assets, canvas, devtools, tween,
config, pixi, build, export, cli. Pass `--access public --tag alpha` explicitly for alpha releases.
Verify each version and its `dist.integrity` against the reviewed tarball before completing
release tags. Registry metadata can briefly lag successful publication; retry read-only checks
before attempting another write. Never delete a published version to retry it.

Retain the candidate commit, tarball hashes and verification logs locally. Check clean registry
installation and representative ad builds after publication. Documentation deployment remains
separate from npm publication.
[Official npm publish reference](https://docs.npmjs.com/commands/npm-publish/).
