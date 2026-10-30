# Speech and music generation

Read the live `audio-api` doc before building a request. Discover models with
`GET <base>/models?output_modalities=all` and read each model's `endpoints[].route`; that route,
not the output modality, decides the request shape. Audio input to chat is a different contract:
see `references/multimodal.md`.

## Named speech

`POST <base>/audio/speech` takes `model`, `input`, `voice` and optional `response_format: "wav"`,
for a model listed with an `audio_speech` endpoint. It returns WAV bytes, not JSON.

- Input is 1–600 Unicode characters. Omit `language` when `model` is supplied.
- Generic `speed`, raw `pcm` and `mp3` are not part of this contract.
- Voice names are case-sensitive and not shared across models. For
  `qwen/qwen-audio-3.0-tts-flash`, `loongjohn` is a supported stock voice. The model list does not
  expose voices; use the live doc's examples and the provider's voice reference.

## Other speech contracts

These are separate contracts; do not reuse the named speech body.

- `xiaomi/mimo-v2.5-tts` and its variants are served on `POST <base>/chat/completions`. The text
  to speak is the final `assistant` message, and the audio returns in `message.audio.data`. Read
  the live page's section on them.
- `POST <base>/audio/speech/jobs` is the asynchronous workflow.
- Fixed speech tasks with no model are in the live `capabilities` doc.

## Music

1. `POST <base>/audio/generations` with `model`, `prompt`, optional `callback_url`, and a required
   `Idempotency-Key` you persist before sending. Do not add duration or format fields.
2. Persist the job ID and poll `GET <base>/audio/generations/<id>`.
3. The job is finished only at terminal status `completed`. Read `usage` and download through the
   returned authenticated content URL before its expiry.

To recover an uncertain submit, replay the same key and identical body, supported for 24 hours.
`callback_url` needs a workspace signing secret and a public HTTPS URL; see the live `webhooks` doc.
Use the returned content type rather than assuming an extension: music can be MP3.

## Checks and cost

A successful response is not proof of playable audio; check the file. Speech can be priced per
character or with separate input-text and output-audio token legs, and music can be priced per
request. A zero text-token price is not a free music promise; see `references/pricing.md`.
