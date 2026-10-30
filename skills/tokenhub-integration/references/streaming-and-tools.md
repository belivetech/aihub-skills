# Streaming and tool calling

## Streaming

Set `"stream": true`. The body is server-sent events in OpenAI's chunk format.

- Lines starting with `:` are keep-alive comments. Skip them.
- The last chunk before `data: [DONE]` carries `usage` and an **empty `choices` array**. Guard
  every `choices[0]` read.
- The stream is complete only when `data: [DONE]` arrives. A body that ends without it is
  truncated; treat it as an error.
- A failure after HTTP 200 arrives as one frame with a top-level `error` and no `choices`, and no
  `[DONE]` follows. Check each payload for `error` first.
- An SDK iterator that simply stops does not prove `[DONE]` arrived. `assets/terminal-chat/sse.ts`
  is a strict reader that throws on both failure kinds.

## Tool calling

- Send `tools` as OpenAI function tools. The model returns `tool_calls`; it never runs them.
- The application validates the arguments, runs only allowlisted functions, and answers each
  call with a `tool` message whose `tool_call_id` matches.
- Bound the loop: a maximum number of rounds and of tokens per round.
- `assets/function-tools/tools.ts` is a complete bounded loop.

Live pages: `/docs/markdown/streaming`, `/docs/markdown/tools`.
