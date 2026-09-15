# Consumer builds, CI and delivery

## Clean-checkout validation

Generate assets before type checking when source files import generated registries. A development
session may have generated files that a fresh clone lacks. Declare packages imported by generated
code directly: if the asset module imports `Assets` from `@replayablejs/assets`, add that package
at the matching release rather than relying on a transitive dependency or monorepo hoisting.

Use the selected package manager and committed lockfile. For cross-platform support, validate
install, build, checks and export on the intended operating systems; native asset processors and
path handling matter as well as TypeScript. Follow maintained runner versions from the toolkit
when matching its CI. Use `.gitattributes` with `* text=auto eol=lf` to keep Windows checkout
conversion from causing repository-wide formatting failures. A local pass does not prove that a
hosted OS job has passed.

## Catalogs and deployment

When requested, generate catalogs from public variant/config and export APIs. Use the returned
artifact paths, sizes and delivery formats instead of reconstructing filenames. Include every
configured version/language/network automatically. A small static HTML generator is sufficient;
reuse the project's rendering libraries rather than adding a frontend framework for a file list.

Keep browser previews, downloadable delivery artifacts and network testing tools distinct.
Verify external tool links from current network documentation, label app/dashboard/account
requirements, and do not claim a validator pass merely because a link exists. Network acceptance
and real-device behavior remain separate from successful export validation.

For Pages-style CI, validate pull requests without deployment permissions, publish one OS's
catalog only after all required checks pass, and deploy only on the requested branch/events.
Update README links and launch wording after verifying the site is live.

## Testing a local toolkit checkout

Only use a local checkout when the user requests toolkit development or local-package testing.
Read or inspect toolkit source without interpreting that as permission to modify or publish it.

A consumer helper can build and pack the required public packages, including their Replayable
transitive dependencies, then install those tarballs temporarily. Keep package versions coherent,
preserve the original manifest/lockfile, and provide explicit connect, refresh, status and restore
operations. Unique tarball paths avoid reusing stale packages with unchanged versions. Refuse to
overwrite dependency files changed after connection.

Document that the connection is a snapshot: stop the dev server, refresh after toolkit edits,
then restart. Show an explicit `/path/to/replayable` placeholder rather than assuming sibling
repositories. State actual OS support; a helper invoking package-manager executables may have
different Windows support than the playable itself. Restore published dependencies before
committing temporary dependency changes. Local testing does not request a toolkit release.
