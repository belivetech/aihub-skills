# Multimodal input

Reviewed 2026-10-21. Read the environment's live `/docs/markdown/multimodal` and modality guide, then discover eligible endpoint capabilities from `/api/v1/models`.

- Chat image: `image_url: {url}` on a vision route; URL/data support is route-specific.
- Chat audio: `input_audio: {data, format}` for supported inline MP3/WAV; do not put an AI Hub uploaded audio file ID here.
- Chat PDF: `file: {filename, file_data}` with an inline PDF data URL on a declared file-capable route. No universal parser/OCR plugin.
- Chat video: object `video_url: {url}`; an uploaded MP4/MOV may use `tokenhub://files/<id>` when the file belongs to the workspace and remains unexpired.
- Responses accepts text and URL/data images, not input_file/audio/video translation.
- Messages accepts text/image, not document/audio/video blocks.
- Embeddings uses `{input:[{content:[parts]}]}`. Its video part is input_video, not video_url. Media is inline, not remote URLs or PDF. A video embedding can exclude the sound track; check the model.

Read the local input file and base64-encode it in executable code; never fabricate a literal media payload. Check request byte limits and route-specific duration/page/context limits. Use the exact model/route price table and response usage. Do not infer free input from zero prompt tokens.

A schema-valid example is not a paid qualification. Use retained evidence with its exact fixture/protocol boundary or obtain a bounded live-call budget. Do not repeat uncertain generation with a new idempotency key.
