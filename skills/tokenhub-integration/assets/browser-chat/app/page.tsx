"use client";

import { useRef, useState } from "react";

type Message = { role: "user" | "assistant"; content: string };

/** SSE allows CRLF, LF and CR line endings; normalise to LF, holding a trailing CR for the next read. */
function normalizeLineEndings(buffer: string): string {
  const hold = buffer.endsWith("\r");
  return (hold ? buffer.slice(0, -1) : buffer).replace(/\r\n?/g, "\n") + (hold ? "\r" : "");
}

/** Reads the passed-through SSE body. Ends only on [DONE]; an error frame or an early end throws. */
async function readStream(res: Response, onText: (text: string) => void): Promise<void> {
  if (!res.ok || !res.body) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.error?.message ?? `HTTP ${res.status}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer = normalizeLineEndings(buffer + decoder.decode(value, { stream: true }));
    let end: number;
    while ((end = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      const data = frame.split("\n").filter((l) => l.startsWith("data:")).map((l) => l.slice(5).trimStart()).join("\n");
      if (data === "") continue; // keep-alive comment
      if (data === "[DONE]") return;
      const chunk = JSON.parse(data);
      if (chunk.error) throw new Error(chunk.error.message ?? "The answer failed.");
      const text = chunk.choices?.[0]?.delta?.content; // the usage chunk has an empty choices array
      if (text) onText(text);
    }
  }
  if (buffer.replace(/\r$/, "").trim() !== "data: [DONE]") throw new Error("The answer was cut off before it finished.");
}

export default function Page() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const abort = useRef<AbortController | null>(null);

  async function send() {
    const text = draft.trim();
    if (!text || busy) return;
    const history: Message[] = [...messages, { role: "user" as const, content: text }].slice(-20);
    setMessages([...history, { role: "assistant", content: "" }]);
    setDraft("");
    setError(null);
    setBusy(true);
    abort.current = new AbortController();
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
        signal: abort.current.signal,
      });
      await readStream(res, (delta) =>
        setMessages((all) => [...all.slice(0, -1), { role: "assistant", content: all[all.length - 1].content + delta }]));
    } catch (err) {
      // Drop the unfinished answer so the next turn does not build on it.
      setMessages(history);
      setError((err as Error).name === "AbortError" ? "Stopped." : (err as Error).message);
    } finally {
      setBusy(false);
      abort.current = null;
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>
      <h1 style={{ fontSize: 20 }}>AI Hub chat</h1>
      <ol style={{ listStyle: "none", padding: 0 }}>
        {messages.map((m, i) => (
          <li key={i} style={{ margin: "8px 0", whiteSpace: "pre-wrap" }}>
            <b>{m.role === "user" ? "You" : "Model"}:</b> {m.content}
          </li>
        ))}
      </ol>
      {error ? <p role="alert" style={{ color: "#b00020" }}>{error}</p> : null}
      <form onSubmit={(e) => { e.preventDefault(); void send(); }} style={{ display: "flex", gap: 8 }}>
        <input value={draft} onChange={(e) => setDraft(e.target.value)} maxLength={8000}
          aria-label="Message" style={{ flex: 1, minWidth: 0, padding: 8 }} />
        {busy
          ? <button type="button" onClick={() => abort.current?.abort()}>Stop</button>
          : <button type="submit">Send</button>}
      </form>
    </main>
  );
}
