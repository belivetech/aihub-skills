# Troubleshooting

| Symptom | Likely cause | Check |
|---|---|---|
| 404 on every call | Doubled path, such as `/api/v1/v1/chat/completions` | The SDK base must end in `/api/v1` |
| 404 `not_found` | The id is not listed, or is listed in the other environment | `GET <base>/models/<id>` on the same host |
| 401 | Missing or revoked key, or a key from the other environment | Keys do not cross environments |
| 403 | The key or workspace does not permit the request | The key's settings in the console |
| 402 | The workspace is out of credit or over the key's monthly cap | Billing and the key's cap |
| 429 | A request/token/concurrency limit or provider throttling; timed retry hints are conditional | Honour `Retry-After` when present. Reconcile an accepted job before another submission |
| 400 `unsupported_parameter` | A field the route does not accept, such as an unknown key inside `provider` | The error message names it. Supported routing fields such as `provider.only` and `provider.order` are valid; keep them |
| Answer cut off, no error | The stream ended without `[DONE]` | Treat as an error; see streaming reference |
| `IndexError` or `undefined` on `choices[0]` | Reading the final usage chunk | Guard the empty `choices` array |
| Tool never called | The model lacks `tools` in `supported_parameters` | Pick a model that lists it |
| Settings from another TokenHub product | Tencent Cloud TokenHub domains or keys | Use only the BeLive hosts above |

Live page: `/docs/markdown/errors`.

## Protocol and uncertain completion

- Chat uses numeric `error.code` and `error.type`; Responses uses string codes and `response.failed`; Messages uses Anthropic error envelopes and stream error events.
- A 200 stream can fail later. Require the terminal marker for that protocol; do not automatically resubmit incomplete generation.
- For supported job submits, retain the same Idempotency-Key and identical body, save the returned job ID and reconcile through read-only status. Not every submit supports replay.
- A timeout or 5xx does not establish that no work or cost occurred. Polling may use bounded backoff; starting new work is a separate action.
- Find the method/path, security and schema via `/docs/markdown/endpoints` and `/docs/openapi/data-plane.yaml`. Unpublished model/provider bounds remain unknown.

For empty text with `finish_reason: length`, read `thinking`: reasoning may consume the whole
output cap. Use an appropriate task budget or a documented off switch on optional-thinking
models. `reasoning_effort: low` is supported on the measured Kimi K3.1 Pro route; GLM-5.3 uses
low/high/max. Accepted fields do not prove identical compute
or that an always-thinking model was switched off.

A public catalogue HTTP 200 does not authenticate a key. For cost questions, distinguish a
recorded receipt from a pre-dispatch validation error that has no generation row; see
`references/pricing.md`. Preserve original errors and job IDs rather than probing by rerunning
paid requests.
