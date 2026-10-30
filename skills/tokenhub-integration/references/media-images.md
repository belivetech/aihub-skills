# Image generation

Read the live `images` doc before building a request. This page holds the contract and the
mistakes that cost money; the live page holds the per-model tables.

1. **Choose the model.** `GET <base>/images/models` needs no key. Each entry's
   `tokenhub_image_options` lists its ratios, tiers, default and the exact `size` of every pair.
2. **Send one request.** `POST <base>/images/generations` is synchronous: the image is in the
   response.
3. **Save the bytes.** Decode `data[0].b64_json`. The format is what the provider produced, PNG or
   JPEG, and this route does not state it, so read the type from the bytes rather than assuming an
   extension. `POST <base>/images` is a second route that adds `media_type` and `usage`; with no
   `resolution` it uses the `2K` size where the model offers one, which can cost more than the
   model's default.
4. **Check the result.** Open the file and check its dimensions. An HTTP 200 alone is not proof of
   a usable image.

## Request

| Field | Rule |
|---|---|
| `model`, `prompt` | Required. The prompt reaches the provider as written. |
| `aspect_ratio`, `resolution` | Optional. `W:H` and `1K`, `2K` or `4K`, from the model's own pairs. Omit both, and `size`, for the default size. |
| `size` | Only the exact values in `tokenhub_image_options`, not any width and height. On `POST <base>/images`, `1K`, `2K` or `4K` is read as `resolution`. |
| `input_references` | `[{"type": "image_url", "image_url": {"url": "…"}}]`, each a public `https` URL or a base64 PNG, JPEG or WebP `data:` URI. Only on models that take references; edit models require them. |
| `n` | 1 on every model. Send several requests for several images. |
| `provider` | Only `order`, `only` and `allow_fallbacks`. `tokenhub_image_options` describes the first provider; a pinned provider can offer other pairs. |

`seed`, `negative_prompt`, `output_format`, `style`, `watermark` and `stream: true` are refused on
every image model. `quality` is refused on the models in the live tables. A pair the model does
not offer, or a `size` that disagrees with it, is a `400`; read the message for what is accepted.

## Failures and cost

- Set a generous client timeout: some models run up to 300 seconds inside the request. If the
  client stops waiting, generation may still finish and be charged.
- Never automatically resubmit an uncertain image. A rerun is a new paid request; follow the media
  reruns section of the live `routing` doc.
- The price may be per image, per request, by tier or by number of references. Read the model's
  `tokenhub_price_table`; see `references/pricing.md`.
