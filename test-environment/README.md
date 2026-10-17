# Isolated Docker environment

Requires Docker Desktop/Engine and Compose. Commands run from the plugin package
directory. Only that directory is mounted, read-only, at `/ridian`; the host home
directory and Docker socket are not mounted. The Gateway runs as UID 1000 and
publishes only `127.0.0.1:18879`. Credentials persist in the project's named
`state` volume. The image version and digest are pinned in `compose.yaml`.

Choose the intended Ridian test MCP endpoint before bootstrap. Do not reuse a
production credential store. This fixture creates no Ridian account or mailbox.

```sh
npm test
npm run check:package
npm pack --ignore-scripts
docker compose -f test-environment/compose.yaml pull
docker compose -f test-environment/compose.yaml run --rm --no-deps --entrypoint node gateway \
  /ridian/test-environment/bootstrap.mjs https://YOUR_TEST_RIDIAN_HOST/mcp
docker compose -f test-environment/compose.yaml run --rm --no-deps --entrypoint node gateway \
  dist/index.js plugins install /ridian/getridian-openclaw-ridian-0.1.0-alpha.3.tgz --force --accept-capabilities
docker compose -f test-environment/compose.yaml up -d --wait
```

Bootstrap refuses to overwrite an existing config. For an existing setup, skip
bootstrap and use the normal OpenClaw configuration commands. Do not remove its
volume to fix a configuration error. A local archive has no verified registry
provenance; the host reports that separately from runtime loading.

Check without contacting Ridian:

```sh
docker compose -f test-environment/compose.yaml exec gateway node dist/index.js plugins inspect ridian --runtime --json
docker compose -f test-environment/compose.yaml exec gateway node dist/index.js mcp status --json
```

Expected: plugin loaded, MCP URL matching the selected environment, OAuth
unauthenticated until the human signs in. Wait for Gateway health before running
CLI commands; the first start briefly locks the state database for migration.

Open <http://127.0.0.1:18879/>. Copy the Gateway token privately from the container
into your clipboard, then paste it into the UI's token field. On macOS:

```sh
docker compose -f test-environment/compose.yaml exec -T gateway node -e \
  'process.stdout.write(JSON.parse(require("fs").readFileSync("/home/node/.openclaw/openclaw.json","utf8")).gateway.auth.token)' | pbcopy
```

The command prints nothing in the terminal. Do not paste the clipboard into
chat. If OpenClaw requests device pairing, inspect `devices list` in this same
container and approve only your browser's request using `devices approve <id>`.
Do not disable device authentication.

Start Ridian authorization in the container:

```sh
docker compose -f test-environment/compose.yaml exec gateway node dist/index.js mcp login ridian
```

Open the printed authorization URL in the Mac browser and inspect the permission
selection. Settings → MCP shows this CLI login command; it does not offer a
sign-in button in the pinned host. This fixture does not publish the CLI callback port. If the browser redirects
to an unreachable `127.0.0.1:8989/oauth/callback` page, keep that tab open;
the Ridian consent can already be complete. Let the first login command finish
with its callback timeout, then use the documented manual fallback below.
Do not restart login before completing the fallback, because a new attempt
replaces the pending PKCE state.

In a local terminal, run this Python 3 snippet and paste the full callback URL
from your browser at its hidden prompt. It extracts the code without putting
the URL in shell history and passes it only to this container's OpenClaw CLI:

```sh
python3 - <<'PYCODE'
import getpass, subprocess
from urllib.parse import urlsplit, parse_qs
u = urlsplit(getpass.getpass("Callback URL (hidden): "))
q = parse_qs(u.query)
if (u.scheme != "http" or u.hostname != "127.0.0.1" or u.port != 8989
        or u.path != "/oauth/callback" or len(q.get("code", [])) != 1):
    raise SystemExit("Use the callback URL from this OpenClaw login attempt.")
subprocess.run(["docker", "compose", "-f", "test-environment/compose.yaml",
    "exec", "-T", "gateway", "node", "dist/index.js", "mcp", "login",
    "ridian", "--code", q["code"][0]], check=True)
PYCODE
```

The callback URL is a credential: do not paste it into chat, issues or docs.
After completing login, run `mcp doctor ridian --probe` in this container. For a chat test, first
configure your chosen model provider in OpenClaw; this fixture contains no model
API keys and copies none from the host. Select a model allowed by your provider
account and use its required regional endpoint. A model appearing in the catalog
is not proof that the account can call it: test a short response before trying
Ridian tools. OpenRouter can report policy exclusions as HTTP 404. Inspect the
provider error and keep the existing privacy restrictions.

For a safe first read ask for the calendar list or Agent Mailbox list. Sending,
calendar changes, interruption/reconnect and revocation are separate tests with
explicitly selected test data. Do not infer write behavior from a successful
catalog probe.

Run the offline host-contract test (no external network or credentials):

```sh
docker run --rm --network none \
  --mount "type=bind,src=$PWD,dst=/ridian,readonly" \
  ghcr.io/openclaw/openclaw:2026.10.4@sha256:614004ec2cf2e6095124ea544dc8d950c49306aef445a1fc300b88717e24261a \
  node --test /ridian/test-environment/host-test.mjs
```

Stop with `docker compose -f test-environment/compose.yaml down`. This preserves
the private volume; `up -d --wait` resumes it. Avoid `down -v` unless you intend
to permanently delete its config and credentials.
