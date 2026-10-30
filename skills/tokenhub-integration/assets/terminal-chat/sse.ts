// A strict reader for AI Hub's chat SSE stream. No dependencies.
//
// It follows the stream contract on /docs/streaming:
// - lines starting with ":" are keep-alive comments and are skipped;
// - the last chunk before [DONE] carries `usage` and an EMPTY `choices` array;
// - a failure after HTTP 200 arrives as one `{"error": …}` frame, and no [DONE] follows;
// - a body that ends without `data: [DONE]` is truncated and is an error, not a short answer.

export type Usage = { prompt_tokens: number; completion_tokens: number; total_tokens: number };

export class StreamError extends Error {
  readonly kind: "error_frame" | "truncated" | "http";
  constructor(message: string, kind: "error_frame" | "truncated" | "http") {
    super(message);
    this.kind = kind;
  }
}

/**
 * SSE allows CRLF, LF and CR line endings. Normalise to LF, keeping a trailing CR until the next
 * read shows whether an LF follows it.
 */
export function normalizeLineEndings(buffer: string): string {
  const hold = buffer.endsWith("\r");
  return (hold ? buffer.slice(0, -1) : buffer).replace(/\r\n?/g, "\n") + (hold ? "\r" : "");
}

/** Yields text deltas and returns the final usage. Throws StreamError on any abnormal end. */
export async function* readChatStream(res: Response): AsyncGenerator<string, Usage | null> {
  if (!res.ok || !res.body) {
    const text = await res.text().catch(() => "");
    throw new StreamError(`HTTP ${res.status}: ${text.slice(0, 500)}`, "http");
  }
  const decoder = new TextDecoder();
  const reader = res.body.getReader();
  let buffer = "";
  let usage: Usage | null = null;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer = normalizeLineEndings(buffer + decoder.decode(value, { stream: true }));
    // Frames end at a blank line; a frame can arrive split across reads.
    let end: number;
    while ((end = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const data = frame
        .split("\n")
        .filter((line) => line.startsWith("data:"))
        .map((line) => line.slice(5).trimStart())
        .join("\n");
      if (data === "") continue; // a comment-only frame
      if (data === "[DONE]") return usage;
      const chunk = JSON.parse(data);
      if (chunk.error) throw new StreamError(chunk.error.message ?? "stream failed", "error_frame");
      if (chunk.usage) usage = chunk.usage;
      const text = chunk.choices?.[0]?.delta?.content;
      if (typeof text === "string" && text !== "") yield text;
    }
  }
  // A terminator with no blank line after it still counts.
  if (buffer.replace(/\r$/, "").trim() === "data: [DONE]") return usage;
  throw new StreamError("the stream ended without data: [DONE]", "truncated");
}
