"""A streaming terminal chat with history, standard library only. Python 3.10+.

Needs TOKENHUB_BASE_URL, TOKENHUB_API_KEY and TOKENHUB_MODEL.
Run: python3 terminal_chat.py   (type /exit or press Ctrl-D to quit)
"""
import json
import os
import urllib.error
import urllib.request

BASE = os.environ["TOKENHUB_BASE_URL"].rstrip("/")
KEY = os.environ["TOKENHUB_API_KEY"]
MODEL = os.environ["TOKENHUB_MODEL"]
MAX_HISTORY = 20  # keep the request bounded


class StreamError(Exception):
    pass


def stream_chat(messages):
    """Yields text deltas; returns usage. Raises StreamError on an error frame or truncation."""
    body = json.dumps({"model": MODEL, "messages": messages, "stream": True, "max_tokens": 1000})
    req = urllib.request.Request(f"{BASE}/chat/completions", data=body.encode(), method="POST", headers={
        "Authorization": f"Bearer {KEY}", "Content-Type": "application/json"})
    usage = None
    try:
        resp = urllib.request.urlopen(req, timeout=300)
    except urllib.error.HTTPError as err:
        raise StreamError(f"HTTP {err.code}: {err.read()[:500].decode(errors='replace')}") from None
    with resp:
        data_lines = []
        for raw in resp:
            line = raw.decode().rstrip("\r\n")
            if line.startswith(":"):
                continue  # keep-alive comment
            if line.startswith("data:"):
                data_lines.append(line[5:].lstrip())
                continue
            if line != "" or not data_lines:
                continue
            data, data_lines = "\n".join(data_lines), []
            if data == "[DONE]":
                return usage
            chunk = json.loads(data)
            if chunk.get("error"):
                raise StreamError(chunk["error"].get("message", "stream failed"))
            if chunk.get("usage"):
                usage = chunk["usage"]  # the last chunk: usage and an empty choices list
            choices = chunk.get("choices") or []
            if choices:
                text = (choices[0].get("delta") or {}).get("content")
                if text:
                    yield text
        if data_lines == ["[DONE]"]:  # a terminator with no blank line after it
            return usage
    raise StreamError("the stream ended without data: [DONE]")


def main():
    history = []
    while True:
        try:
            line = input("you> ").strip()
        except EOFError:
            break
        if line == "/exit":
            break
        if not line:
            continue
        history.append({"role": "user", "content": line})
        history[:] = history[-MAX_HISTORY:]
        print("bot> ", end="", flush=True)
        answer = ""
        stream = stream_chat(history)
        try:
            while True:
                text = next(stream)
                answer += text
                print(text, end="", flush=True)
        except StopIteration as stop:
            print()
            if stop.value:
                print(f"[{stop.value['prompt_tokens']} in, {stop.value['completion_tokens']} out]")
            history.append({"role": "assistant", "content": answer})
        except StreamError as err:
            history.pop()  # do not build the next turn on a failed answer
            print(f"\n[error] {err}")


if __name__ == "__main__":
    main()
