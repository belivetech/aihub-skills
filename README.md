# AI Hub Skills

Agent Skills for building with [BeLive AI Hub](https://aihub.belive.sg): one OpenAI-compatible
API over many model providers. AI Hub is not Tencent Cloud TokenHub.

## Skills

| Skill | Use it for |
|---|---|
| [tokenhub-integration](skills/tokenhub-integration/SKILL.md) | Base URLs and keys, current model discovery, chat, streaming and function tools, Codex CLI, Claude Code CLI, Codex Desktop and Claude Desktop setup, Responses and Messages compatibility, multimodal input, pricing shapes and complete application examples |

The skill reads the current AI Hub docs and model catalogue before choosing a model or route.
The [MCP server](https://aihub.belive.sg/docs/tokenhub-mcp) is optional: without it the skill
reads the Markdown docs.

## Install

### Claude Code plugin

Installing as a plugin lets Claude Code update the skill:

```
/plugin marketplace add belivetech/aihub-skills
/plugin install aihub@aihub
```

### GitHub CLI

`gh skill` (GitHub CLI 2.90.0 or later) installs into Claude Code, Codex, Cursor, Gemini CLI and
other clients. Add `--scope user` for every project and `--agent <name>` for one client:

```bash
gh skill install belivetech/aihub-skills tokenhub-integration
```

Pin a release with `--pin v1.2.7`. `gh skill` records the source in the installed `SKILL.md`
frontmatter, so that one file's hash differs from `manifest.json`; the other files match.

### Skills CLI

```bash
npx skills add belivetech/aihub-skills
```

### Cursor

Add a remote rule in **Settings > Rules > Add Rule > Remote Rule (GitHub)** with
`belivetech/aihub-skills`.

### Copy the folder

From a clone of this repository:

```bash
cp -R skills/tokenhub-integration ~/.claude/skills/
cp -R skills/tokenhub-integration ~/.agents/skills/
```

The Codex user folder `~/.agents/skills/` is shared by its local CLI and Desktop clients.
For Claude Desktop chat, upload the versioned ZIP from the AI Hub Skills page in
**Customize → Skills → + → Create skill → Upload a skill**, then enable it.
Organization policy and code-execution settings can control availability.

Restart the client and check that `tokenhub-integration` is listed. A versioned ZIP of the same
files is on the [AI Hub Skills page](https://aihub.belive.sg/docs/integration-skill).

## Set up your coding client

Ask the assistant: **Use the tokenhub-integration skill to set up AI Hub in my
client. Fetch the current guide, preserve my existing configuration and keep my
key out of chat.** Specify the client you use:

| Client | Current provider guide | Docs MCP connection |
|---|---|---|
| Codex CLI | [Codex CLI](https://aihub.belive.sg/docs/codex-cli) | Add the TOML below to the active Codex home |
| Claude Code CLI | [Claude Code](https://aihub.belive.sg/docs/claude-code) | Run the command below |
| Codex Desktop | [Codex Desktop](https://aihub.belive.sg/docs/codex-desktop) | Settings → MCP servers → Add server → Streamable HTTP, or the shared TOML |
| Claude Desktop | [Claude Desktop](https://aihub.belive.sg/docs/claude-desktop) | Customize → Connectors → Add custom connector, No sign in |

Public remote MCP URL: `https://aihub.belive.sg/mcp`. No inference key is needed.

```bash
claude mcp add --transport http tokenhub https://aihub.belive.sg/mcp
```

```toml
[mcp_servers.tokenhub]
url = "https://aihub.belive.sg/mcp"
```

The standard Codex macOS configuration is `~/.codex/config.toml`; the optional
`codex-aihub` launcher uses `~/.codex-aihub/config.toml` instead. Merge the entry
without duplicating an existing table, then restart. See the [MCP guide](https://aihub.belive.sg/docs/tokenhub-mcp)
for Windows paths and managed-client details. Ask the MCP server's `get_doc` tool
for `codex-cli`, `claude-code`, `codex-desktop` or `claude-desktop`.

The skill supplies instructions and MCP supplies public tools. Neither switches
the inference provider or installs credentials. Desktop setup is documented;
the CLI coding-task evidence does not certify Desktop end to end.

## Examples

The examples in `skills/tokenhub-integration/assets/` read `TOKENHUB_BASE_URL`,
`TOKENHUB_API_KEY` and `TOKENHUB_MODEL` from the environment; see
[`.env.example`](skills/tokenhub-integration/assets/.env.example). Python 3 and Node 22 run them.
Keep keys out of source. The offline fixtures make no model call:

```bash
cd skills/tokenhub-integration/assets
node --experimental-strip-types fixtures/run-offline.ts
```

## Versions

`manifest.json` lists every file with its SHA-256. Each release is a tag (`v1.2.7`). A released
version's files never change; a correction ships as a new version. This repository is generated
from the AI Hub console source, so open an issue rather than a pull request that edits the files.

## Checks

`python scripts/validate.py` checks each skill's frontmatter, every file against
`manifest.json`, the plugin versions and the trigger evals; CI runs it with the offline fixtures
on every pull request. `quality/trigger-evals/` holds prompts that should and should not load each
skill, including near misses such as Tencent Cloud TokenHub and OpenRouter, for tuning the
description.

## License

MIT, from version 1.2.4. See [LICENSE](LICENSE).
