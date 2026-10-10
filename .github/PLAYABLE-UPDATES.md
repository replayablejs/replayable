# Playable dependency updates

The Release workflow calls `update-playables.yml` after successful npm publication, passing the exact version from the release checkout. Manual runs accept an exact published version, including prereleases. Both music-mixer-playable and color-loop-playable are updated independently; a failure in one does not cancel the other or undo publication.

## Enable

Create a GitHub App with repository Contents and Pull requests read/write permissions. Install it on the two playable repositories. In the Replayable repository configure:

- Variable `PLAYABLE_UPDATER_CLIENT_ID`: the App client ID.
- Secret `PLAYABLE_UPDATER_PRIVATE_KEY`: the App private key.
- Variable `PLAYABLE_UPDATES_ENABLED`: `true`, after the credentials are configured.

The workflow requests a short-lived token scoped to one playable per job and does not persist checkout credentials. App-authored PRs can trigger the target repository's normal CI.

## Behavior

Only existing `@replayablejs/*` registry dependencies in the root package.json are updated. Their dependency sections and unrelated dependencies are preserved. The current two projects do not use pnpm catalogs. Catalog, workspace, and local-file references deliberately fail instead of being overwritten; add catalog support before migrating these projects to catalogs.

pnpm regenerates the lockfile, then builds the playable to generate its asset registries before running checks. Typechecking requires these generated files on a fresh checkout. Both steps must pass before a PR is created. Only package.json and pnpm-lock.yaml are included in the PR; generated assets are excluded. No automatic merge is configured. Rerunning the same version updates the same PR branch, and an already-current checkout produces no PR. Before manually rerunning an old release, confirm that it is still the desired target version; manual runs can intentionally downgrade.

No changeset is needed for this repository-only automation. To test the manifest updater locally, run `node --test scripts/update-playable-dependencies.test.ts`. The full root check includes these tests. End-to-end PR creation requires the App configuration and a GitHub Actions run.

Before installing, the updater waits for every public Replayable package at the requested version to appear in npm's package metadata, including transitive packages. It retries missing packages and registry failures every 10 seconds for up to five minutes. If publication remains incomplete, the job fails with the missing package names and last registry errors; rerun after publication is resolved. This avoids starting installation while npm is still publishing the release.
