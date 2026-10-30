// The server half. The AI Hub key stays here; the browser never sees it.
//
// This sample has no sign-in. It refuses to run as a production server unless you set
// TOKENHUB_SAMPLE_ALLOW_HOSTED=1, which you should do only after putting your own
// authentication in front of this route. Otherwise anyone who can reach it spends your key.

const MAX_MESSAGES = 20;
const MAX_CHARS = 8000;

type Message = { role: "user" | "assistant"; content: string };

function bad(status: number, message: string) {
  return Response.json({ error: { message } }, { status });
}

export async function POST(req: Request) {
  if (process.env.NODE_ENV === "production" && process.env.TOKENHUB_SAMPLE_ALLOW_HOSTED !== "1")
    return bad(403, "This sample has no authentication. Add your own before hosting it.");
  const base = (process.env.TOKENHUB_BASE_URL ?? "").replace(/\/+$/, "");
  const key = process.env.TOKENHUB_API_KEY;
  const model = process.env.TOKENHUB_MODEL;
  if (!base || !key || !model) return bad(500, "Set TOKENHUB_BASE_URL, TOKENHUB_API_KEY and TOKENHUB_MODEL.");

  let messages: Message[];
  try {
    const body = await req.json();
    messages = body.messages;
  } catch {
    return bad(400, "Send a JSON body with a messages array.");
  }
  // Bound what one request may send upstream.
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES)
    return bad(400, `Send 1 to ${MAX_MESSAGES} messages.`);
  for (const m of messages)
    if ((m?.role !== "user" && m?.role !== "assistant") || typeof m.content !== "string" || m.content.length > MAX_CHARS)
      return bad(400, `Each message needs role user or assistant and at most ${MAX_CHARS} characters.`);

  // req.signal aborts when the browser disconnects, which cancels the AI Hub request too.
  const upstream = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 1000 }),
    signal: req.signal,
  });
  if (!upstream.ok || !upstream.body) {
    const text = await upstream.text().catch(() => "");
    let message = `AI Hub answered HTTP ${upstream.status}`;
    try { message = JSON.parse(text).error.message ?? message; } catch { /* not JSON */ }
    return bad(upstream.status === 401 ? 500 : 502, message);
  }
  // Pass the SSE bytes through unchanged; the page parses them with the same rules.
  return new Response(upstream.body, {
    headers: { "content-type": "text/event-stream", "cache-control": "no-store",
      "x-generation-id": upstream.headers.get("x-generation-id") ?? "" },
  });
}
