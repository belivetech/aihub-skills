// One bounded function-tool loop. No dependencies; Node 22.
// Needs TOKENHUB_BASE_URL, TOKENHUB_API_KEY and a TOKENHUB_MODEL whose supported_parameters
// include "tools". Run: node --experimental-strip-types tools.ts "Where is order A-1002?"
//
// The model only asks for a call. This program decides whether to run it: it accepts only the
// allowlisted function, validates the arguments, and stops after MAX_ROUNDS model turns.
const base = (process.env.TOKENHUB_BASE_URL ?? "").replace(/\/+$/, "");
const key = process.env.TOKENHUB_API_KEY ?? "";
const model = process.env.TOKENHUB_MODEL ?? "";
if (!base || !key || !model) throw new Error("set TOKENHUB_BASE_URL, TOKENHUB_API_KEY and TOKENHUB_MODEL");

const MAX_ROUNDS = 4;

// Fictional data. A real application reads its own store, with its own access rules.
const ORDERS: Record<string, string> = { "A-1001": "delivered", "A-1002": "in transit", "A-1003": "processing" };

const TOOLS = [{
  type: "function",
  function: {
    name: "get_order_status",
    description: "Look up the delivery status of one order by its id, such as A-1001.",
    parameters: {
      type: "object",
      properties: { order_id: { type: "string", pattern: "^A-[0-9]{4}$" } },
      required: ["order_id"],
      additionalProperties: false,
    },
  },
}];

/** Runs one requested call. Every failure becomes a tool result the model can read. */
function runTool(name: string, rawArgs: string): string {
  if (name !== "get_order_status") return JSON.stringify({ error: `unknown tool ${name}` });
  let args: unknown;
  try {
    args = JSON.parse(rawArgs || "{}");
  } catch {
    return JSON.stringify({ error: "arguments were not valid JSON" });
  }
  // `null`, a number or an array parse as JSON too; only an object with exactly order_id is valid.
  if (typeof args !== "object" || args === null || Array.isArray(args)) return JSON.stringify({ error: "arguments must be a JSON object" });
  const keys = Object.keys(args);
  if (keys.length !== 1 || keys[0] !== "order_id") return JSON.stringify({ error: "arguments must contain only order_id" });
  const id = (args as { order_id: unknown }).order_id;
  if (typeof id !== "string" || !/^A-[0-9]{4}$/.test(id)) return JSON.stringify({ error: "order_id must look like A-1001" });
  return JSON.stringify({ order_id: id, status: ORDERS[id] ?? "not found" });
}

type Message = Record<string, unknown>;
const messages: Message[] = [{ role: "user", content: process.argv[2] ?? "Where is order A-1002?" }];

for (let round = 1; round <= MAX_ROUNDS; round++) {
  const res = await fetch(`${base}/chat/completions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, tools: TOOLS, max_tokens: 500 }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${body?.error?.message ?? JSON.stringify(body)}`);
  console.error(`[round ${round}] request ${res.headers.get("x-generation-id")}, usage ${JSON.stringify(body.usage)}`);
  const message = body.choices[0].message;
  messages.push(message);
  const calls: { id: string; function?: { name?: string; arguments?: string } }[] = Array.isArray(message.tool_calls) ? message.tool_calls : [];
  if (calls.length === 0) {
    console.log(message.content);
    process.exit(0);
  }
  for (const call of calls) {
    // Each result names the id of the call it answers.
    messages.push({ role: "tool", tool_call_id: call.id, content: runTool(String(call.function?.name ?? ""), String(call.function?.arguments ?? "")) });
  }
}
console.error(`stopped after ${MAX_ROUNDS} rounds without a final answer`);
process.exit(1);
