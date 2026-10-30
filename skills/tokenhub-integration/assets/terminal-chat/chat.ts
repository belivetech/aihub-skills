// A streaming terminal chat with history. No dependencies; Node 22.
// Needs TOKENHUB_BASE_URL, TOKENHUB_API_KEY and TOKENHUB_MODEL.
// Run: node --experimental-strip-types chat.ts   (type /exit or press Ctrl-D to quit)
import { createInterface } from "node:readline/promises";
import { readChatStream, StreamError } from "./sse.ts";

const base = (process.env.TOKENHUB_BASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.TOKENHUB_API_KEY ?? "";
const model = process.env.TOKENHUB_MODEL ?? "";
if (!base || !key || !model) throw new Error("set TOKENHUB_BASE_URL, TOKENHUB_API_KEY and TOKENHUB_MODEL");

/** Keep the last N messages so a long session cannot grow the request without bound. */
const MAX_HISTORY = 20;
const history: { role: "user" | "assistant"; content: string }[] = [];
const rl = createInterface({ input: process.stdin, output: process.stdout });

for (;;) {
  let line: string;
  try {
    line = (await rl.question("you> ")).trim();
  } catch {
    break; // Ctrl-D
  }
  if (line === "/exit") break;
  if (line === "") continue;
  history.push({ role: "user", content: line });
  history.splice(0, Math.max(0, history.length - MAX_HISTORY));

  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages: history, stream: true, max_tokens: 1000 }),
  });
  let answer = "";
  process.stdout.write("bot> ");
  try {
    const stream = readChatStream(res);
    let step = await stream.next();
    while (!step.done) {
      answer += step.value;
      process.stdout.write(step.value);
      step = await stream.next();
    }
    process.stdout.write("\n");
    const usage = step.value;
    if (usage) console.log(`[${usage.prompt_tokens} in, ${usage.completion_tokens} out; request ${res.headers.get("x-generation-id")}]`);
    history.push({ role: "assistant", content: answer });
  } catch (err) {
    // A failed or truncated answer is not kept in the history: the next turn would build on it.
    history.pop();
    const kind = err instanceof StreamError ? err.kind : "unknown";
    console.error(`\n[${kind}] ${(err as Error).message}`);
  }
}
rl.close();
