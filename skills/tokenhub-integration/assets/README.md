# AI Hub cookbook examples

Runnable examples for the AI Hub cookbook (`/docs/cookbook` on the AI Hub console). The docs
pages and the `tokenhub-integration` skill read these files, so they are the one copy.

| Folder | What it shows | Runtime |
|---|---|---|
| `first-request/` | One chat completion with curl, Python and TypeScript | curl, Python 3.10+, Node 22 |
| `terminal-chat/` | A streaming chat loop with history and a strict SSE reader | Node 22, Python 3.10+ |
| `function-tools/` | One bounded function-tool loop over an allowlisted local function | Node 22 |
| `browser-chat/` | A Next.js chat page whose key stays on its own server | Node 22, Next.js 15.5.27 |
| `fixtures/` | A local SSE fixture server and offline checks for the stream reader | Node 22 |

Every example reads `TOKENHUB_BASE_URL`, `TOKENHUB_API_KEY` and `TOKENHUB_MODEL` from the
environment; see `.env.example`. Nothing is hard-coded, and no example has a default model.

The TypeScript files use only erasable type syntax and run directly:

```bash
node --experimental-strip-types first-request/first-request.ts
```

The offline checks make no network call and need no key:

```bash
node --experimental-strip-types fixtures/run-offline.ts
```

Installing dependencies or building an example never sends a model request. Each live run is
billed to the key you supply.

## Recover an accepted job

Set `TOKENHUB_JOB_PATH` to the existing job's returned status path and run `node --experimental-strip-types troubleshooting/poll-job.ts`. It performs bounded authenticated GETs on the configured host. It never submits generation. A timeout or failed response is not evidence that no work occurred; preserve the original idempotency key/body for endpoints that support replay and inspect the existing job first.
