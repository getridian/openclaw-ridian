# Publishing a Ridian plugin release

Release source: `getridian/openclaw-ridian`. Package:
`@getridian/openclaw-ridian`; runtime ID: `ridian`; license: MIT.

ClawHub Trusted Publishing binds this package to this repository's
`release.yml` workflow and the GitHub environment `clawhub`. That environment
requires Paul’s approval and only accepts version tags. The publishing job uses
GitHub OIDC to obtain a short-lived, package/version-specific credential. No
ClawHub token is stored in GitHub. A failed OIDC exchange fails the job.

The ClawHub CLI runs only from `tools/clawhub/package-lock.json`, installed with
`npm ci --ignore-scripts`: every transitive package is pinned with an integrity
hash and no install script runs in the job that holds the publishing token.
Update the CLI only through a reviewed change to that lockfile
(`npm install --package-lock-only --ignore-scripts` in `tools/clawhub`).

## Prepare and publish

1. Update the version in `package.json`, `openclaw.plugin.json`, and the DE/EN
   installation examples. Keep Alpha versions on the `alpha` channel.
2. Run `npm test`, `npm run check:package`, and the isolated host test from
   `test-environment/README.md`. Review the eight-file archive allowlist.
   Repeat real OAuth/tool tests when the adapter or host contract changes;
   document the actual scope rather than claiming unchanged server workflows
   were tested again.
3. Merge the reviewed PR through the required Node 24/26 and secret-scan checks.
   Tag its merged commit `vVERSION` and push that tag.
4. Dispatch the release workflow **at that tag**, not at `main`:

   ```sh
   gh workflow run release.yml --repo getridian/openclaw-ridian --ref vVERSION
   ```

   ClawHub accepts OIDC publishing from `workflow_dispatch`. A tag push alone
   does not publish. The workflow checks the tag/version, verifies that the
   commit belongs to `main`, checks the package, runs Plugin Inspector and a
   publish dry run, then waits for the protected environment approval.
5. Review the exact commit, package artifact and Inspector report. Approve the
   `clawhub` deployment after the release is authorized. The publishing job
   downloads the reviewed artifact and waits for ClawHub's security checks.
6. Verify the ClawHub receipt, source commit and GitHub publishing identity.
   Download the public version and compare its SHA-256 with the workflow
   artifact. Install that public version in a fresh OpenClaw profile.
7. Attach the verified archive to a GitHub prerelease for the same tag and record
   the release evidence. Keep the previous versions available.

## Recovery

A timeout does not mean the upload failed. Inspect the attempt ID before
retrying; do not upload a second copy of a pending version. A blocked or failed
attempt needs its cause resolved first. Do not add a persistent token or use a
manual override to bypass OIDC. A package manager can inspect the binding with:

```sh
npx --yes clawhub@0.23.3 package trusted-publisher get @getridian/openclaw-ridian
```

Deleting that binding stops new OIDC credentials; it does not unpublish an
existing release. Treat changes to the binding, workflow or environment as
release security changes.

## What the proof means

Trusted Publishing identifies the GitHub repository, workflow and commit that
published the package. It does not confer OpenClaw's Official status. OpenClaw
2026.10.4 reserves its trusted runtime classification for its official catalog;
a community plugin can load successfully while reporting `provenance-invalid`.
Do not edit local trust records or suppress that warning to claim official trust.
