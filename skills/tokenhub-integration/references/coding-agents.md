# Coding agents

| Client | AI Hub route | Guide |
|---|---|---|
| Codex CLI | `/api/v1/responses` (OpenAI Responses) | `/docs/markdown/codex-cli` |
| Claude Code | `/api/v1/messages` (Anthropic Messages) | `/docs/markdown/claude-code` |
| Qwen Code, OpenCode, OpenClaw, Hermes Agent | `/api/v1/chat/completions` | `/docs/markdown/qwen-code`, `/opencode`, `/openclaw`, `/hermes-agent` |

Follow each guide's exact settings. Claude Desktop and Codex Desktop are not supported yet.

Responses route limits:

- Stateless. `store: true`, `previous_response_id` and `background: true` are refused with 400.
  Send `store: false` and the full history every turn.
- Only `function` and `namespace` tools run. Hosted tools such as `web_search` are ignored and
  named in `X-TokenHub-Ignored-Fields`. Disable web search in the client.

Messages route limits:

- `mcp_servers`, `container` and `document` blocks are refused with 400.
- `thinking`, server tools and several other fields are ignored and reported in
  `X-TokenHub-Ignored-Fields`. `count_tokens` is not served; Claude Code estimates instead.

Connecting the AI Hub MCP server gives an agent docs and catalogue tools. It does not make
AI Hub the agent's model provider; configure that separately with the guide above.
