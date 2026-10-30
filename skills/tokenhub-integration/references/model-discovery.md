# Model discovery

- `GET <base>/models` lists default catalogue modalities; `GET <base>/models?output_modalities=all` adds image,
  video, audio and 3D models. No key is needed.
- `GET <base>/models/<author>/<slug>` returns one model in `{"data": {...}}` with pricing,
  `supported_parameters` and its endpoints.
- Use the exact `id` (`author/slug`). Do not guess an id from a provider's own naming.
- `supported_parameters` decides features: `tools` for tool calling, `response_format` for JSON
  output. Model-level parameters do not publish every provider constraint. Check the selected route; missing optional metadata is unknown.
- Prices are decimal strings in USD. Some models carry a price table instead of flat per-token
  prices; read the table rather than converting it to one number.
- The catalogue says what is listed, not what a given key may call: a key's model allowlist can
  narrow it.
- Never cite an external benchmark or ranking as AI Hub data.

Live page: `<docs host>/docs/markdown/models`. With MCP: `list_models`, `get_model`.

Use `/docs/markdown/endpoints` for API, limitations and recovery cross-links. Image options are model declarations, not per-provider bounds. A model author or chat route does not certify Responses, Messages or a desktop client.

Audio output includes speech, music and realtime where listed. Inspect `endpoints[].route`;
`audio_speech`, `audio_generations` and `realtime` are different request contracts. `pricing: null`
does not establish a free model or non-token billing. Read `references/pricing.md`, and use
`get_model` when an MCP list result omits serving endpoints. A public catalogue response is not
proof that a supplied key authenticated or can perform inference.
