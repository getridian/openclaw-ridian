import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

/** Emit public connection settings only. The host owns all credentials. */
export async function connection(endpoint) {
  const manifest = JSON.parse(await readFile(new URL('../openclaw.plugin.json', import.meta.url), 'utf8'));
  const server = structuredClone(manifest.mcpServers.ridian);
  if (endpoint !== undefined) {
    let url;
    try { url = new URL(endpoint); } catch { throw new Error('Use an HTTPS MCP URL without credentials, query or fragment.'); }
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/mcp') {
      throw new Error('Use an HTTPS MCP URL ending in /mcp without credentials, query or fragment.');
    }
    server.url = url.href;
  }
  return server;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length > 1) throw new Error('Usage: node scripts/connection.mjs [https://your-ridian-host/mcp]');
    console.log(JSON.stringify(await connection(args[0])));
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
