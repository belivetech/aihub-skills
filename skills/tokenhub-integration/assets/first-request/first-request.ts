// First request with Node 22's built-in fetch. No dependencies.
// Needs TOKENHUB_BASE_URL, TOKENHUB_API_KEY and TOKENHUB_MODEL in the environment.
// Run: node --experimental-strip-types first-request.ts
const base = required("TOKENHUB_BASE_URL").replace(/\/+$/, "");
const key = required("TOKENHUB_API_KEY");
const model = required("TOKENHUB_MODEL");

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`set ${name}`);
  return value;
}

// 1. Confirm the exact model id. The catalogue is public; no key is needed.
const found = await fetch(`${base}/models/${model}`);
if (!found.ok) throw new Error(`model ${model} is not in the catalogue (HTTP ${found.status})`);

// 2. One chat completion.
const res = await fetch(`${base}/chat/completions`, {
  method: "POST",
  headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    model,
    max_tokens: 200,
    messages: [{ role: "user", content: "Say hello in one sentence." }],
  }),
});
const body = await res.json();
if (!res.ok) throw new Error(`HTTP ${res.status}: ${body?.error?.message ?? JSON.stringify(body)}`);
console.log(body.choices[0].message.content);
console.log("usage:", body.usage);
// The request id. Look its cost up later with GET /generation?id=<this id>.
console.log("request id:", res.headers.get("x-generation-id"));
