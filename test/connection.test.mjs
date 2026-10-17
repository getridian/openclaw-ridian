import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, stat, rm, chmod } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { connection } from '../scripts/connection.mjs';
import { bootstrap } from '../test-environment/bootstrap.mjs';

test('one native MCP connection keeps OAuth and TLS in the host, with no copied tools or credentials', async () => {
  const server = await connection();
  assert.equal(server.url, 'https://api.getridian.com/mcp');
  assert.equal(server.transport, 'streamable-http');
  assert.equal(server.auth, 'oauth');
  assert.equal(server.sslVerify, true);
  assert.equal(server.headers, undefined);
  assert.equal(server.toolFilter, undefined);
  assert.equal(server.supportsParallelToolCalls, undefined);
  const manifest = JSON.parse(await readFile(new URL('../openclaw.plugin.json', import.meta.url)));
  assert.deepEqual(Object.keys(manifest.mcpServers), ['ridian']);
  assert.equal(manifest.contracts?.tools, undefined);
  assert.equal(manifest.configSchema.additionalProperties, false);
});

test('environment override is explicit and cannot embed credentials or silently weaken HTTPS', async () => {
  const endpoint = 'https://test.example/mcp';
  assert.equal((await connection(endpoint)).url, endpoint);
  assert.equal((await connection()).url, 'https://api.getridian.com/mcp');
  for (const value of ['http://test.example/mcp', 'https://user:secret@test.example/mcp', 'https://test.example/mcp?token=secret', 'https://test.example/mcp#secret', 'https://test.example/v1/mailboxes', 'invalid']) {
    await assert.rejects(connection(value), error => !error.message.includes('secret'));
  }
});

test('reading, writing, sending and managing remain separate requested scopes, not an authorization grant', async () => {
  const scopes = (await connection()).oauth.scope.split(' ');
  assert.equal(new Set(scopes).size, scopes.length);
  for (const scope of ['offline_access', 'inbox:read', 'inbox:write', 'inbox:send', 'inbox:manage', 'calendar:read', 'calendar:write', 'calendar:rsvp', 'calendar:manage', 'mail:send']) {
    assert.ok(scopes.includes(scope));
  }
});

test('bootstrap requires an explicit environment and preserves existing private credentials', async t => {
  const root = await mkdtemp(join(tmpdir(), 'ridian-bootstrap-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const directory = join(root, 'state');
  await assert.rejects(bootstrap(directory), /HTTPS/);
  await bootstrap(directory, 'https://test.example/mcp');
  const path = join(directory, 'openclaw.json');
  const before = await readFile(path, 'utf8');
  const config = JSON.parse(before);
  assert.equal((await stat(directory)).mode & 0o777, 0o700);
  assert.equal((await stat(path)).mode & 0o777, 0o600);
  assert.match(config.gateway.auth.token, /^[a-f0-9]{64}$/);
  assert.equal(config.mcp.servers.ridian.url, 'https://test.example/mcp');
  await assert.rejects(bootstrap(directory, 'https://other.example/mcp'), { code: 'EEXIST' });
  assert.equal(await readFile(path, 'utf8'), before);
  const publicDirectory = await mkdtemp(join(root, 'public-'));
  await chmod(publicDirectory, 0o755);
  await assert.rejects(bootstrap(publicDirectory, 'https://test.example/mcp'), /owner-only/);
  await assert.rejects(readFile(join(publicDirectory, 'openclaw.json')), { code: 'ENOENT' });
});
