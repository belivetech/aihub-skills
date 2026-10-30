#!/usr/bin/env bash
# First request with curl. Needs TOKENHUB_BASE_URL, TOKENHUB_API_KEY and TOKENHUB_MODEL.
set -euo pipefail
: "${TOKENHUB_BASE_URL:?set TOKENHUB_BASE_URL}" "${TOKENHUB_API_KEY:?set TOKENHUB_API_KEY}" "${TOKENHUB_MODEL:?set TOKENHUB_MODEL}"

# 1. Confirm the exact model id exists. The catalogue is public; no key is needed.
curl -fsS "$TOKENHUB_BASE_URL/models/$TOKENHUB_MODEL" > /dev/null \
  || { echo "model $TOKENHUB_MODEL is not in the catalogue" >&2; exit 1; }

# 2. Send one chat completion. -D - prints the response headers, including X-Generation-Id,
#    the request id to look up its cost later (GET /generation?id=…).
curl -sS -D - "$TOKENHUB_BASE_URL/chat/completions" \
  -H "Authorization: Bearer $TOKENHUB_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"model\": \"$TOKENHUB_MODEL\", \"max_tokens\": 200,
       \"messages\": [{\"role\": \"user\", \"content\": \"Say hello in one sentence.\"}]}"
echo
