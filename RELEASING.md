# Release preparation

Maintainer: Ridian. Repository name: `kalender-sync/openclaw-ridian`. License:
MIT. Package name: `@kalender-sync/openclaw-ridian`, runtime plugin ID: `ridian`.
The ClawHub publisher must control the matching `kalender-sync` namespace.
Confirm that ownership before publishing or change the package scope consistently.

Use this standalone repository, not a checkout of another product. Source
provenance must identify this repository's exact reviewed commit. Keep private
credentials and environment-specific evidence out of the repository and archive.

1. Run `npm test` and `npm run check:package`.
2. Run the isolated host test from `test-environment/README.md` with the pinned
   OpenClaw image. Test any other host version before extending compatibility.
3. Generate the archive with `npm pack --ignore-scripts`; inspect its seven-file
   allowlist and install that exact archive in the isolated environment.
4. Verify human OAuth, tool discovery and one read through the real host.
   This adapter reuses the existing Ridian MCP handlers and OpenClaw OAuth
   implementation. Repeat deeper contract tests when those integration surfaces
   change; do not make unchanged server workflows a separate plugin release gate.
   Record the actual test scope in release evidence.
5. Create/review the standalone repository commit. Run the pinned ClawHub CLI
   from that checkout. Validation accepts a folder, not a `.tgz` path; extract
   the archive into a fresh temporary directory to validate the installed files:

   ```sh
   npx --yes clawhub@0.23.3 package validate /path/to/extracted/package
   npx --yes clawhub@0.23.3 package publish . --owner kalender-sync \
     --source-repo kalender-sync/openclaw-ridian \
     --source-commit YOUR_REVIEWED_COMMIT --dry-run
   ```

6. Review the DE/EN descriptions, package, source commit and publish owner with
   Paul. After his publication instruction, publish the reviewed version with
   the same explicit source metadata, using `--wait` instead of `--dry-run`.
   ClawHub's checks determine when the version becomes installable. Do not
   describe a pending upload as publicly available.
7. Verify installation from the resulting ClawHub listing in a fresh profile,
   then record the release and update the Ridian integration documentation.

Keep publishing manual for the first release. A local Plugin Inspector pass is
not a ClawHub review, a namespace claim, an OAuth acceptance test or a release.
