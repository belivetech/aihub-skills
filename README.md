# AI Hub Skills

Agent Skills for building with [BeLive AI Hub](https://aihub.belive.sg): one OpenAI-compatible
API over many model providers. AI Hub is not Tencent Cloud TokenHub.

## Skills

| Skill | Use it for |
|---|---|
| [tokenhub-integration](skills/tokenhub-integration/SKILL.md) | Base URLs and keys, current model discovery, chat, streaming and function tools, Responses and Messages compatibility, multimodal input, pricing shapes and complete application examples |

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

Pin a release with `--pin v1.2.6`. `gh skill` records the source in the installed `SKILL.md`
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
cp -R skills/tokenhub-integration ~/.codex/skills/
```

Restart the client and check that `tokenhub-integration` is listed. A versioned ZIP of the same
files is on the [AI Hub Skills page](https://aihub.belive.sg/docs/integration-skill).

Optionally connect the MCP server for live model and price tools:

```bash
claude mcp add --transport http tokenhub https://aihub.belive.sg/mcp
```

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

`manifest.json` lists every file with its SHA-256. Each release is a tag (`v1.2.6`). A released
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
