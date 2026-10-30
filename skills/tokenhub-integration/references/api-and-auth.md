# API, authentication and environments

| Environment | Data-plane base URL | Docs | MCP |
|---|---|---|---|
| Production | `https://tokenhub-api.belive.sg/api/v1` | `https://aihub.belive.sg/docs` | `https://aihub.belive.sg/mcp` |

- Every route is served under both `/v1` and `/api/v1`, with no redirect. SDKs take the base
  ending in `/api/v1` and append `/chat/completions`. Do not add a second `/v1`.
- Authentication: `Authorization: Bearer sk-tokenhub-…`. Keys are created in the console under
  API Keys and shown once. A key belongs to one workspace and may carry a model allowlist and a
  monthly spend cap.
- The Messages route also accepts the key as `x-api-key`, which Anthropic SDKs send.
- Errors are `{"error": {"code", "type", "message", "metadata"}}`; `code` repeats the HTTP status.
  The Responses and Messages routes answer in OpenAI's and Anthropic's own envelopes.
- Every response carries `X-Generation-Id` (`req_…`). `GET <base>/generation?id=<id>` with the
  same key returns that request's tokens and cost.

Live page: `<docs host>/docs/markdown/auth` and `/docs/markdown/errors`.
