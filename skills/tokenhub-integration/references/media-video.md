# Video generation

Read the live `video` doc before building a request. This page holds the contract and the
mistakes that cost money; the live page holds the per-model tables and examples.

## Flow

1. **Choose the model.** `GET <base>/videos/models` needs no key and lists
   `supported_resolutions`, `supported_aspect_ratios`, `supported_durations` and
   `supported_frame_images`. Model forms differ: some take no text-only request, and some require
   a first frame or references. Check the live doc's input table.
2. **Submit once.** `POST <base>/videos` with an `Idempotency-Key` you generate and persist
   **before** sending. A new job answers `202` with `id`, `generation_id`, `polling_url` and
   `status`.
3. **Persist the job ID,** then poll `GET <base>/videos/{id}` every few seconds, or use a webhook.
4. **Download before expiry.** `GET <base>/videos/{id}/content` with the key, before
   `content_expires_at`.
5. **Check the file.** Confirm it plays with the expected duration and size. A `202` or a
   `completed` status alone is not proof of a usable video.

## Idempotency and uncertain submits

- After a timeout or `5xx`, the job may have started. Resend with the same key and identical body,
  which returns the same job with `200` for 24 hours. A new key can create and charge a second
  video.
- The same key with a different body is `409 conflict`.
- A polling script that stops locally has not stopped the job. Poll the same ID again; never
  re-run the submit step to recover.
- A deliberate rerun after a failure is a new paid request with a fresh key; follow the media
  reruns section of the live `routing` doc.

## Status

| Field | Meaning |
|---|---|
| `pending`, `in_progress` | Not finished. A finished job reads `in_progress` until its charge settles, so the first `completed` already carries its cost. |
| `pending` with `queued: true` | Accepted and waiting for capacity. Keep polling; do not POST again. |
| `queue_expires_at` | The waiting deadline. Past it the job ends `failed` with `queue_expired: true` and `error.code: upstream_timeout`, costs nothing and releases its reservation. |
| `reservation_ceiling_usd` | The reserved ceiling, not the charge. |
| `completed` | Carries `unsigned_urls`, `usage` and `content_expires_at`. The charge is `usage.tokenhub_cost`. |
| `failed`, `cancelled`, `expired` | Terminal. `failed` carries `error`. |

An organisation at its video job total can get `429 rate_limit_exceeded`; honour `Retry-After`.
`POST <base>/videos/{id}/cancel` on a queued job costs nothing; after execution starts the outcome
is provider-specific, so poll for it.

## Download

The content route either streams the MP4 (`200` or `206`) or answers `302` with a time-limited
URL, depending on the route. Send the AI Hub key to AI Hub only: **do not forward `Authorization`
to the redirect target.** `curl -L` already drops it for another host; in another HTTP client, read
the redirect and fetch the URL without the header. Browsers hide cross-origin redirects, so
download on the server.

## Request

| Field | Rule |
|---|---|
| `resolution` | A tier from the model's `supported_resolutions`. The list writes `720p` and the docs write `720P`; either case is accepted. |
| `duration`, `aspect_ratio`, `generate_audio`, `seed`, `watermark` | Only where the model supports them. Set `aspect_ratio` for text to video: on some models the default depends on the route that serves the job. |
| `frame_images` | `[{"type": "image_url", "image_url": {"url": "…"}, "frame_type": "first_frame"}]`, with an optional `last_frame` item. Not sent together with `input_references`. |
| `input_references` | Items of `image_url`, `video_url` or `audio_url`. Limits differ by model and media type. |
| `reference_video`, `characters` | Motion control and saved characters; see those live doc sections. Saved characters need `consent` and belong to one workspace. |

Input media is a public `https` URL or a base64 PNG, JPEG or WebP `data:` URI; a reference video
must be a URL. `size` is not a video field. A field the model does not take is
`400 unsupported_parameter`, and a value out of range is `400 invalid_request`. Neither starts a
job or costs anything.

## Webhooks

Read the live `webhooks` doc before adding one. A workspace default URL, or `callback_url` on the
request, receives terminal events such as `video.generation.completed`. Both need a workspace
signing secret, or the request is `400 webhook_secret_missing`. Verify `X-TokenHub-Signature`
against the raw body before parsing it. Delivery is at least once and may arrive out of order, so
deduplicate on `X-TokenHub-Idempotency-Key` and read the job's GET route for the current state.

## Cost

The basis varies by model: per output second or output tokens, by resolution, sometimes by audio
or references. On `kling/…`, a first-frame job prices at the tier of the output's short side: a square frame
requested at `720P` prices at `1080P`. Estimate from the
model's `tokenhub_price_table` and the live doc's billing notes, then compare with `usage` on the
completed job; see `references/pricing.md`.
