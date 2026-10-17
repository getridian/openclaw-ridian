import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);
const tool = {
  name: 'list_inboxes', description: 'Synthetic mailbox fixture, no real account.',
  inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
};

test('OpenClaw loads the plugin, discovers changing tools and rejects unauthorized discovery without leaking response bodies', { timeout: 120000 }, async t => {
  const directory = await mkdtemp(join(tmpdir(), 'ridian-host-test-'));
  const requests = [];
  let refused = false;
  let tools = [tool];
  const server = createServer(async (request, response) => {
    if (refused) {
      response.writeHead(401, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'synthetic auth refusal' }));
      return;
    }
    if (request.method !== 'POST') { response.writeHead(405).end(); return; }
    let body = '';
    for await (const chunk of request) body += chunk;
    const rpc = JSON.parse(body);
    requests.push(rpc.method);
    if (rpc.id === undefined) { response.writeHead(202).end(); return; }
    const result = rpc.method === 'initialize'
      ? { protocolVersion: rpc.params.protocolVersion, capabilities: { tools: {} }, serverInfo: { name: 'ridian-fixture', version: '1.0.0' } }
      : rpc.method === 'tools/list' ? { tools }
      : rpc.method === 'resources/list' ? { resources: [] }
      : rpc.method === 'prompts/list' ? { prompts: [] } : {};
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ jsonrpc: '2.0', id: rpc.id, result }));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(async () => { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); await rm(directory, { recursive: true, force: true }); });
  const configPath = join(directory, 'openclaw.json');
  await writeFile(configPath, JSON.stringify({
    gateway: { mode: 'local' },
    plugins: { allow: ['ridian'], load: { paths: ['/ridian'] }, entries: { ridian: { enabled: true } } },
    mcp: { servers: { ridian: { url: `http://127.0.0.1:${server.address().port}/mcp`, transport: 'streamable-http' } } },
  }), { mode: 0o600 });
  const env = { ...process.env, OPENCLAW_CONFIG_PATH: configPath, OPENCLAW_STATE_DIR: directory };
  const cli = async (...args) => {
    const { stdout } = await run(process.execPath, ['/app/dist/index.js', ...args], { env, timeout: 35000, maxBuffer: 1024 * 1024 });
    return JSON.parse(stdout);
  };
  const inspected = await cli('plugins', 'inspect', 'ridian', '--runtime', '--json');
  assert.equal(inspected.plugin.status, 'loaded');
  assert.equal(inspected.plugin.mcpServers.ridian.auth, 'oauth');
  assert.equal(requests.length, 0, 'Plugin inspection must not call the server.');
  const probe = await cli('mcp', 'probe', 'ridian', '--json');
  assert.deepEqual(probe.tools, ['ridian__list_inboxes']);
  assert.ok(requests.includes('initialize'));
  assert.ok(requests.includes('tools/list'));
  assert.ok(!requests.includes('tools/call'), 'Catalog inspection must not execute tools.');
  tools = [{ ...tool, name: 'list_calendars' }];
  const refreshed = await cli('mcp', 'probe', 'ridian', '--json');
  assert.ok(JSON.stringify(refreshed).includes('list_calendars'));
  assert.ok(!JSON.stringify(refreshed).includes('list_inboxes'), 'No copied/stale plugin tool catalog.');
  refused = true;
  await assert.rejects(cli('mcp', 'probe', 'ridian', '--json'), error => {
    assert.notEqual(error.code, 0);
    const failure = JSON.parse(error.stdout);
    assert.deepEqual(failure.tools, []);
    assert.equal(failure.diagnostics[0].serverName, 'ridian');
    assert.ok(!(error.stdout + error.stderr).includes('synthetic auth refusal'), 'Raw error bodies must not leak.');
    return true;
  });
});
