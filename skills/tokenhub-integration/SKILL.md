---
name: tokenhub-integration
description: Use when integrating BeLive AI Hub (aihub.belive.sg, the OpenAI-compatible LLM gateway) into an application, pointing a coding agent such as Codex CLI or Claude Code at it, migrating an OpenAI-compatible client to it, generating images, video, speech or music through it, calling its fixed-price capability APIs (translation, OCR, transcription, video processing), handling its job webhooks, or troubleshooting its chat, streaming, tool-calling, media, capability, Responses or Messages routes. Not for Tencent Cloud TokenHub (tokenhub.tencentmaas.com), which is a different product.
license: MIT. Complete terms in LICENSE.txt.
metadata:
  version: 1.2.6
  docs: https://aihub.belive.sg/docs
---

# BeLive AI Hub integration

BeLive AI Hub is one OpenAI-compatible API over many model providers. One inference key
(`sk-tokenhub-…`) calls models permitted by its workspace and key restrictions. It is **not** Tencent Cloud TokenHub; never reuse that
product's domains, keys or configuration.

## Workflow

1. **Identify the target.** Which application or agent, which environment (production or
   staging), and which wire protocol: Chat Completions, Responses (Codex CLI), Messages
   (Claude Code), a media route or a capability route. Read the existing configuration before proposing an edit, and keep every other
   provider it configures.
2. **Read current docs.** Use the AI Hub MCP server's `get_doc` when it is connected;
   otherwise fetch `<docs host>/docs/markdown/<slug>` (index: `<docs host>/llms.txt`), using the
   docs host of the chosen environment from `references/api-and-auth.md`. The references below
   are a dated snapshot; prefer the live pages for anything volatile.
3. **Pick an exact model.** Skip this for a capability route, which has no model to choose. List `GET <base>/models` (public, no key) or call `list_models`.
   Use the full `author/slug` id. Tool use needs `tools` in the model's `supported_parameters`.
   A listed model may still be blocked by the caller's key restrictions.
4. **Make the smallest change.** Set the base URL and key through the client's own supported
   settings. Keep the key in an environment variable or secret manager, never in source.
   Do not install an OpenRouter-specific SDK because an example looks similar.
5. **Validate locally first.** Run the offline checks in `assets/`. A live call is billed to the
   user's key; make one only within a budget the user has authorized.
6. **Report.** Files changed, the check you ran and its result, client and model versions, and
   any field AI Hub ignored or refused (see `X-TokenHub-Ignored-Fields`).

## Load only what the task needs

| Task | Reference |
|---|---|
| Base URLs, keys, environments, errors | `references/api-and-auth.md` |
| Choosing a model and route | `references/model-discovery.md` |
| All pricing shapes, estimates and receipts | `references/pricing.md` |
| Image generation and edits | `references/media-images.md` |
| Video jobs and webhooks | `references/media-video.md` |
| Speech and music generation | `references/media-audio.md` |
| Ready-made tasks with no model: translation, OCR, transcription, video processing | `references/capabilities.md` |
| Streaming, tool calling | `references/streaming-and-tools.md` |
| Codex CLI, Claude Code and other agents | `references/coding-agents.md` |
| Something fails | `references/troubleshooting.md` |

Runnable code: `assets/` (first request, terminal chat, function tools, browser chat, offline
fixtures). These are the same files the cookbook at `<docs host>/docs/cookbook` shows.

## Multimodal input

Read `references/multimodal.md` before adding image, audio, PDF or video input. The wire protocol and selected route matter: Chat content parts, Responses images, Messages images and embeddings are different contracts.

## Hard rules

- Never print, commit or paste a real key. Placeholders are `sk-tokenhub-…`.
- Never claim a capability the catalogue or docs do not state, such as hosted web search or
  gateway execution of MCP tools.
- Never select a staging-only model for a production configuration.
- Never automatically resubmit an accepted or uncertain media job; it can charge twice. Paid
  media validation needs the user's existing bounded allowance. The same applies to capability jobs.
- Never set a consent or rights field on the user's behalf unless the user has confirmed it.
