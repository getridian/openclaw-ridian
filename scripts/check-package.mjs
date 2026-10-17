import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const cwd = fileURLToPath(new URL('..', import.meta.url));
const [pack] = JSON.parse(execFileSync('npm', ['pack', '--dry-run', '--ignore-scripts', '--json'], { cwd, encoding: 'utf8' }));
const expected = ['assets/icon.png', 'LICENSE', 'README.md', 'docs/setup.de.md', 'index.js', 'openclaw.plugin.json', 'package.json', 'scripts/connection.mjs'].sort();
assert.deepEqual(pack.files.map(file => file.path).sort(), expected, 'Unexpected published file; inspect the package allowlist.');
console.log(`Package allowlist verified: ${expected.length} files.`);
