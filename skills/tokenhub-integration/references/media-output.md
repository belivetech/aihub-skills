# Media output

Read the live `images`, `video`, `audio-api` and `billing` docs before building a request.
Use the model's endpoint route and supported options; an output modality is not a protocol.

- Images: use the documented image route and exact size/resolution. A token-metered image model
  differs from one priced per image or request. Follow `references/pricing.md`.
- Video: AI Hub options use values such as `720P`, with case significant for the mapping.
  Do not copy OpenRouter's lowercase resolution blindly. Persist the job/idempotency identity,
  poll the accepted job, and validate the downloadable output rather than only the submit status.
- Named TTS: `POST <base>/audio/speech` takes `model`, `input`, `voice` and optional
  `response_format: "wav"`. Input is 1–600 Unicode characters; omit `language` when model is
  supplied. Generic `speed`, raw `pcm` and `mp3` are not this request contract. For
  `qwen/qwen-audio-3.0-tts-flash`, `loongjohn` is a supported stock voice. The public model
  response does not currently expose a voice list; use the audio guide's concrete examples and
  the provider's model-specific voice reference. Save the binary WAV response.
- Music: `/audio/generations` uses model and prompt plus optional callback, with a stable
  `Idempotency-Key`. Do not add unsupported duration/format fields. Read terminal status and
  usage, and retrieve content through the authenticated URL before expiry. A music model can be priced
  per request; zero text-token prices are not a free music promise.

A model-less fixed speech capability, named synchronous TTS and long-form speech job are
separate contracts. A successful HTTP response is not sufficient proof of a playable image,
audio or video artifact. Paid validation requires the user's existing bounded allowance;
never automatically resubmit an accepted or uncertain job.
