// Offline checks for the stream reader against the local fixture server. No key, no spend.
// Run: node --experimental-strip-types fixtures/run-offline.ts   (from examples/tokenhub)
import assert from "node:assert/strict";
import { readChatStream, StreamError } from "../terminal-chat/sse.ts";
import { startFixtureServer } from "./sse-fixture-server.ts";

const { server, baseUrl } = await startFixtureServer();
const call = (model: string) => fetch(`${baseUrl}/chat/completions`, { method: "POST", body: JSON.stringify({ model, stream: true }) });

async function collect(model: string): Promise<{ text: string; usage: unknown }> {
  const stream = readChatStream(await call(model));
  let text = "";
  let step = await stream.next();
  while (!step.done) { text += step.value; step = await stream.next(); }
  return { text, usage: step.value };
}

const results: [string, () => Promise<void>][] = [
  ["normal stream yields text and usage", async () => {
    const { text, usage } = await collect("fixture/normal");
    assert.equal(text, "Hello");
    assert.deepEqual(usage, { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 });
  }],
  ["frames split across reads", async () => assert.equal((await collect("fixture/split")).text, "Hello")],
  ["CRLF line endings, split between reads", async () => assert.equal((await collect("fixture/crlf")).text, "Hello")],
  ["error after HTTP 200 throws", async () => {
    await assert.rejects(collect("fixture/error-after-200"), (e: unknown) => e instanceof StreamError && e.kind === "error_frame");
  }],
  ["missing [DONE] throws", async () => {
    await assert.rejects(collect("fixture/truncated"), (e: unknown) => e instanceof StreamError && e.kind === "truncated");
  }],
  ["HTTP error throws", async () => {
    await assert.rejects(collect("fixture/unknown"), (e: unknown) => e instanceof StreamError && e.kind === "http");
  }],
];

let failed = 0;
for (const [name, run] of results) {
  try { await run(); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}: ${(e as Error).message}`); }
}
server.close();
process.exit(failed === 0 ? 0 : 1);
