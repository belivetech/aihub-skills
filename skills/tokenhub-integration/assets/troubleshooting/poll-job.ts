// Read an existing job. This program never submits generation or retries a submission.
// node --experimental-strip-types troubleshooting/poll-job.ts
const base = process.env.TOKENHUB_BASE_URL;
const apiKey = process.env.TOKENHUB_API_KEY;
const jobPath = process.env.TOKENHUB_JOB_PATH;
if (!base || !apiKey || !jobPath) throw new Error("Set TOKENHUB_BASE_URL, TOKENHUB_API_KEY and TOKENHUB_JOB_PATH to an existing job path");
const root = new URL(base.endsWith("/") ? base : base + "/");
const url = new URL(jobPath, root);
// Never forward the key to a different origin, signed storage URL, or arbitrary resource.
if (url.origin !== root.origin || !/^\/(?:api\/)?v1\/(?:chat\/jobs|jobs|videos|audio\/(?:generations|transcriptions|speech\/jobs))\/[^/]+$/.test(url.pathname)) {
  throw new Error("Use an existing AI Hub job status path on the configured API host");
}
for (let attempt = 0; attempt < 30; attempt++) {
  const response = await fetch(url, { method: "GET", headers: { Authorization: `Bearer ${apiKey}` }, signal: AbortSignal.timeout(30_000), redirect: "error" });
  if (!response.ok && ![429, 500, 502, 503].includes(response.status)) throw new Error(`Job lookup refused (${response.status}); check the job id and key`);
  if (response.ok) {
    const job = await response.json();
    if (["failed", "cancelled", "canceled"].includes(job.status)) throw new Error(`Job ${job.id ?? ""} ended with ${job.status}; inspect its error before any new submission`);
    if (["completed", "succeeded"].includes(job.status)) { console.log(JSON.stringify(job, null, 2)); break; }
  }
  if (attempt === 29) throw new Error("Polling limit reached; keep the existing job id and resume its lookup later");
  const hint = response.headers.get("Retry-After");
  const seconds = hint && /^\d+$/.test(hint) ? Number(hint) : 2 ** Math.min(attempt, 4);
  await new Promise((resolve) => setTimeout(resolve, Math.min(Math.max(seconds, 1), 30) * 1000));
}
export {};
