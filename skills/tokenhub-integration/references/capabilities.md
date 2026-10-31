# Capability APIs

Reviewed 2026-10-31. Read the live `capabilities` doc before building a request. This page holds the
contract and the mistakes that cost money; the operation schemas are in `<docs host>/docs/openapi/data-plane.yaml`.

A capability is a ready-made task at a fixed price per unit, on the same key. There is no `model` to
choose, and the response does not say what served it. Do not add `model` from habit: these routes
refuse it with `400`. The two exceptions are `/audio/speech` and `/audio/transcriptions`, where `model`
selects a different contract, priced as that model; see `references/media-audio.md`. To choose a
specific model for any other task, use the chat or media routes.

1. **Check it can be called.** The console's APIs page (`<docs host>/dashboard/apis`) lists every
   capability with its price and state; Live and Beta can be called. Neither the docs nor the OpenAPI
   file prove availability: the file also lists operations that are not open yet. There is no
   key-authenticated listing, so ask the user to check the page, or expect `503 provider_unavailable`.
2. **Upload any input file.** File inputs are a `file_id`, never a URL.
3. **Send the request** to the path, not the capability id. They differ: `POST <base>/vision/ocr`
   answers as `vision/ocr-general`.
4. **Read the answer** at once, or poll the job. Save outputs before they expire.

## Routes

| Family | Answers | Paths under `<base>` |
|---|---|---|
| Text | At once | `/translate`, `/text/sentiment`, `/text/keywords`, `/text/entities`, `/text/moderate`, `/text/intent`, `/text/summarise`, `/commerce/reviews`, `/commerce/listing` |
| Image analysis | At once | `/vision/ocr`, `/vision/ocr/receipt`, `/vision/tables`, `/vision/barcode`, `/vision/moderate`, `/vision/logos`, `/vision/tags`, `/vision/quality`, `/vision/crop`, `/commerce/pricetag`, `/commerce/attributes` |
| Try-on and short speech | At once | `/commerce/tryon`, `/audio/speech` |
| Image editing | Job | `/vision/background`, `/vision/upscale`, `/vision/erase`, `/vision/outpaint`, `/vision/background-replace` |
| Documents | Job | `/documents/extract`, `/documents/convert` |
| Speech | Job | `/audio/transcriptions`, `/audio/language`, `/audio/speakers`, `/audio/moderate`, `/audio/denoise`, `/audio/separate`, `/audio/speech/jobs` |
| Video | Job | `/video/transcode`, `/video/subtitles`, `/video/watermark`, `/video/moderate`, `/video/highlights`, `/video/avatar`, `/video/translate`, `/video/captions`, `/video/quality`, `/video/clips`, `/video/scenes`, `/video/erase`, `/video/interpolate`, `/video/face-blur`, `/video/summarise`, `/video/assemble`, `/video/reframe`, `/media/enhance` |

The live doc has each route's fields. Common limits:

- **Images:** PNG or JPEG, at most 10 MiB; try-on images at most 7 MB.
- **Recordings:** mono MP3 or WAV, up to 60 minutes. `/audio/speakers` also needs at least 30 seconds;
  a shorter one is refused and not charged. `/audio/separate` differs: audio or video up to 30 minutes.
- **Speech text:** `/audio/speech` takes up to 600 characters and returns WAV bytes. `/audio/speech/jobs`
  takes up to 5,000 counted characters. A Chinese character counts as two.
- **Video:** limits differ by route; read its schema. Subtitle uploads are SRT with `content_type`
  `application/x-subrip`. Watermark and subtitle burn-in refuse input above 1080p.
- **What it does not do:** `/video/erase` removes burned-in subtitles only, and `/vision/erase` removes
  overlaid text only. Neither removes logos. `/vision/background-replace` refuses images with people.

## Upload

1. `POST <base>/files` with `content_type` and `bytes`, the exact file size. Reserving costs nothing.
2. Send the bytes to `upload_url` with `upload_method` and every `upload_headers` value, **without the
   API key**. The URL is signed and stops working at `expires_at`. Treat it as a secret.
3. Use `id` as the `file_id`. Read `delete_after` from the response rather than assuming a retention.

A workspace can reserve 20 files an hour by default. Past its limit the answer is
`429 rate_limit_exceeded` with `metadata.retry_after_s`.

## Jobs

1. **Create and store an `Idempotency-Key` before the submit.** It is required on `/audio/speech/jobs`
   and optional on other capability jobs, but send it every time. It lasts 24 hours within the
   workspace. The same key and body return the same job. A `409` with `metadata.reason`
   `idempotency_mismatch` means the key was used with another body. `in_doubt` means the earlier submit
   is still being recorded: try the same key and body again later, never a new key.
2. **Treat `200` and `202` as accepted.** A new job answers `202` with `id` and `polling_url`. A replay
   of an existing key answers `200` with that job. Read `status`, and never resubmit because of the code.
3. **Poll the job's own `polling_url`.** It can be a full URL or a path; resolve a path against the API
   host. Do not build the URL yourself: `GET <base>/jobs/{id}` does not read transcription, language,
   speaker, audio moderation or long-form speech jobs, and answers `404` for one that exists.
4. **Continue until `status` is `completed`, `failed` or `expired`.** A polling timeout does not stop
   the job, and there is no cancel route. Keep reading the same job. Never submit again with a new key
   to recover from a timeout.
5. **Webhooks can replace polling,** except on `/audio/speech/jobs`, which sends none and refuses
   `callback_url`: poll it. Other capability jobs send `job.completed`, `job.failed` or `job.expired` to
   `callback_url` or the workspace default URL. Both need a workspace signing secret; a `callback_url`
   without one is `400 webhook_secret_missing`. Delivery and signatures are in the live `webhooks` doc.
6. **Read the result.** Answers are in `transcript` or `result`, output links in `unsigned_urls` or
   `result`, and the cost in `usage`.
7. **Download before `content_expires_at`.** Outputs need the API key. Check that the URL is on the API
   host before attaching the key, and do not follow redirects.

## Failures

| Answer | Meaning | Do |
|---|---|---|
| `400 content_policy_violation` | The capability refused the content | Change the input; do not retry |
| `422 no_price_found` | `/commerce/pricetag` found no readable price; not charged | Report it |
| `502 capability_failed` | No answer in the documented shape | Report it with the `X-Generation-Id` |
| `503 saturated` | Busy | Honour `Retry-After` |
| `503 provider_unavailable` | Not available to this workspace now. A `502` with this type is a different failure | Check the APIs page; do not loop |

Immediate routes have no idempotency key. After a client timeout or a `5xx`, work may have started and
a repeat can cost again, so do not retry automatically; check Activity or ask the user.

## Price

Each API lists a unit on the APIs page, such as a page, an image, a minute, 1,000 calls or 300 speech
characters. Text can have input-size bands, and image and video can have output tiers or priced options:
read the row that matches the request. Speech is priced per started block of 300 counted characters.
Never quote a price from memory, or derive one from a model's price.

## Consent

`/commerce/tryon` requires `person_image_consent` and `product_image_rights`, both `true`. They state
that the user holds those rights, so set them only when the user has confirmed it.
