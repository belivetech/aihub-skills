"""First request with the Python standard library only. Python 3.10+.

Needs TOKENHUB_BASE_URL, TOKENHUB_API_KEY and TOKENHUB_MODEL in the environment.
Run: python3 first_request.py
"""
import json
import os
import sys
import urllib.error
import urllib.request

BASE = os.environ["TOKENHUB_BASE_URL"].rstrip("/")
KEY = os.environ["TOKENHUB_API_KEY"]
MODEL = os.environ["TOKENHUB_MODEL"]


def request(method, path, body=None, auth=True):
    headers = {"Content-Type": "application/json"}
    if auth:
        headers["Authorization"] = f"Bearer {KEY}"
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(f"{BASE}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return resp.headers, json.load(resp)
    except urllib.error.HTTPError as err:
        payload = json.load(err)
        sys.exit(f"HTTP {err.code}: {payload.get('error', {}).get('message', payload)}")


# 1. Confirm the exact model id and that it serves chat. The catalogue needs no key.
_, model = request("GET", f"/models/{MODEL}", auth=False)
print("model:", model["data"]["id"])

# 2. One chat completion.
headers, answer = request("POST", "/chat/completions", {
    "model": MODEL,
    "max_tokens": 200,
    "messages": [{"role": "user", "content": "Say hello in one sentence."}],
})
print(answer["choices"][0]["message"]["content"])
print("usage:", answer.get("usage"))
# The request id. Look its cost up later with GET /generation?id=<this id>.
print("request id:", headers.get("X-Generation-Id"))
