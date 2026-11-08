# Coding-agent setup

Updated 2026-11-08. This reference covers Codex CLI, Claude Code CLI, Codex Desktop
and Claude Desktop. BeLive AI Hub's docs MCP server and its model API are separate:
MCP supplies public documentation and catalogue tools without a key; model requests
need a workspace inference key and have their normal usage cost.

## Choose the client and fetch the current guide

Use `get_doc` with the slug below when the AI Hub MCP server is connected.
Otherwise fetch `<docs host>/docs/markdown/<slug>`. Production docs are at
`https://aihub.belive.sg`; choose the correct deployment before changing settings.

| Client | `get_doc` slug | Model connection |
|---|---|---|
| Codex CLI | `codex-cli` | Responses; separate `~/.codex-aihub/config.toml` and optional `codex-aihub` command |
| Claude Code CLI | `claude-code` | Messages; optional `claude-aihub` shell function |
| Codex Desktop | `codex-desktop` | Responses; app's effective Codex configuration and credential delivery |
| Claude Desktop | `claude-desktop` | Messages; Desktop third-party inference configuration, not CLI shell variables |

Read `tokenhub-mcp` for MCP installation and `integration-skill` for skill
installation. Qwen Code, OpenCode, OpenClaw and Hermes Agent have separate guides
and use Chat Completions; do not apply their settings to these four clients.

## Configure the model provider

Read the existing configuration first. Preserve other providers and the user's
normal login. Never ask for a key in chat or print a credential to diagnose it.
Use the user's existing environment variable or secret delivery mechanism.

- **Codex CLI:** follow `codex-cli` for the complete separate-home configuration.
  AI Hub's production base is `https://tokenhub-api.belive.sg/api/v1`, with
  `wire_api = "responses"`. Use the guide's command-backed `auth` block to read
  `TOKENHUB_API_KEY` internally; do not combine it with `env_key` or add a local
  `model_catalog_json` workaround. Codex discovers its model metadata from AI Hub.
  The optional launcher sets `CODEX_HOME="$HOME/.codex-aihub"` and uses
  `codex --no-daemon`. Settings in the ordinary Codex home do not configure that
  separate CLI home. Reasoning is `model_reasoning_effort`; the `/model` picker
  shows the levels supported by the selected route. Follow the live guide for
  route limits instead of assuming every model supports `xhigh`.
- **Claude Code CLI:** follow `claude-code` for its scoped shell function and
  model-role mappings. `ANTHROPIC_BASE_URL` ends in `/api`, because the client appends
  `/v1/messages`. The AI Hub key goes in `ANTHROPIC_AUTH_TOKEN`; the function
  clears competing direct-provider settings only inside that invocation. Use
  exact catalogue IDs for primary, small/background and subagent models. The
  guide initially maps these roles to its tested model; that also
  prices background requests as Opus.
- **Codex Desktop:** the macOS app reads `~/.codex/config.toml`; Windows reads
  `%USERPROFILE%\.codex\config.toml`. The separate CLI home above is not selected
  automatically. Merge the provider/auth settings from `codex-cli` into the
  app's effective configuration, keeping top-level keys before TOML tables.
  Ensure the credential reaches the app process; a terminal export does not
  automatically reach a desktop-launched app. Restart the app. The CLI example
  uses a Unix `sh` helper; native Windows needs an installed compatible helper
  from the official gateway instructions, rather than copying that command.
  Setup guidance is based on official configuration documentation; it is not an
  end-to-end AI Hub Desktop qualification.
- **Claude Desktop:** use the third-party inference configuration described in
  `claude-desktop`, including administrator policy, gateway authentication and
  exact model mappings. Select Gateway, Static API key and Bearer authentication;
  use the Messages base ending in `/api`. Do not treat `claude_desktop_config.json`, CLI
  `settings.json` or `ANTHROPIC_BASE_URL` as its inference-provider settings.
  Adding the docs connector below does not configure inference. Current setup
  guidance is documentation-based; it is not an end-to-end AI Hub Desktop
  qualification.

## Connect the public docs MCP server

The production URL is `https://aihub.belive.sg/mcp` (Streamable HTTP, no key).
Use the selected environment's URL from `tokenhub-mcp` for other deployments.

**Claude Code CLI:**

```bash
claude mcp add --transport http tokenhub https://aihub.belive.sg/mcp
```

**Codex CLI or Codex Desktop:** merge this into the effective `config.toml`:

```toml
[mcp_servers.tokenhub]
url = "https://aihub.belive.sg/mcp"
```

For `codex-aihub`, use `~/.codex-aihub/config.toml`; for the standard macOS app,
use `~/.codex/config.toml`. Do not create duplicate tables. Restart the client.
Codex Desktop also offers Settings → MCP servers → Add server → Streamable HTTP.

**Claude Desktop:** add a remote custom connector named AI Hub with that URL in
Customize → Connectors. Choose No sign in, with no API key or custom auth header.
Organization policy may require an owner to add it first. This is a remote
connector, not a local stdio server in `claude_desktop_config.json`.

Ask the assistant:

> Use the AI Hub MCP server to get_doc for my client, then help me configure its
> model provider. Preserve my existing setup and keep my key out of chat.

Expect a real `get_doc` call with the correct slug and current setup text, not
an answer from memory. `list_models` and `get_model` provide exact model IDs and
route metadata; neither validates an inference key.

## Verify the connection

CLI setup was tested with Codex 0.166.0 and Claude Code 2.1.318. Read the current
guides for dated task results and limitations; those CLI results do not certify
the desktop apps. After restarting, inspect the active model, provider and base
URL. With the user's existing permission to make a priced call, test in a
disposable directory: create a small source file and test, run the test, edit the
source for a second case and run it again. Confirm actual tool calls, test
results and the matching AI Hub Activity record. A model's claimed identity is
not connection proof.

Responses is stateless: send `store: false` and full history. Hosted/freeform
tools differ from supported local function tools; disable hosted web search.
Native Anthropic and Bedrock Messages routes preserve qualified thinking and
effort controls, while other routes have narrower support. Backend `mcp_servers`,
containers and document blocks are refused. Read `claude-code` before selecting
advanced controls; do not claim thinking is universally ignored. Translated routes report discarded fields in `X-TokenHub-Ignored-Fields`; native
routes reject unsupported controls with an explicit error.
