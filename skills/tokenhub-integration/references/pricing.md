# Prices, meters and receipts

Fetch the current Cost and Models guides with MCP `get_doc`, or the chosen docs host's
`/docs/markdown/billing` and `/docs/markdown/models`. Read the exact model and serving route.

- Keep decimal strings and the native `pricing`, `tokenhub_pricing` and `tokenhub_price_table`.
  Null flat `pricing` is not free and does not mean non-token billing.
- An image may be priced per `image`, per `request`, or with separate `input_text_token`,
  `input_image_token`, `output_text_token` and `output_image_token` legs. Do not infer the unit
  from the image modality. Wan per-image and token-metered images are different shapes.
- Audio duration uses `audio_second`; use the measured seconds and the declared denominator.
- Speech may use `character` or separate `input_text_token` and `output_audio_token` meters. Music can use `request`.
  Video can combine `video_second`, `input_video_second` and `input_image`. Multimodal and
  embedding rows may use `input_audio_token`, `input_video_token` or `media_token`.
- Token rows can also distinguish `input_token`, `output_token`, `cached_input_token` and
  `cache_write_token`. Reasoning counts inside completion tokens; do not add it twice.
- Match row `when` conditions to the request and observed output. Read every leg's `meter`,
  `amount`, `per` and any `included` allowance. Sum billable quantities at their rates, then
  apply `multiplier` and final rounding. Preserve explicit `unbilled` meters and
  `rounding_unit_usd`; missing required usage stays unknown, not zero.
- Preserve tier boundaries and their basis. A total-prompt tier can price the entire request;
  do not assume marginal-band pricing. Do not flatten a mixed or conditional table into a
  single per-image or per-million price.
- Compare estimates with the original request's settled receipt, not a later catalogue price.
  Use `X-Generation-Id` with `/generation?id=...` in the same workspace. `cost_complete: false`
  means pending/unknown cost. Some pre-dispatch validation errors explicitly say `charged: false`
  but have no persisted generation row and return 404. Preserve that error; a bare 404 alone
  never proves no charge and never authorizes repeating an uncertain inference.
- A third-party BYOK comparison may show zero gateway fee while charging a supplier separately.
  Keep supplier estimates, gateway fees and actual settled charges distinct.
