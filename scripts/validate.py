#!/usr/bin/env python3
"""Validate the skills, manifest, plugin manifests and trigger evals. Exits 1 on the first set of errors."""
import hashlib
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CREDENTIAL_NAME = re.compile(r"(^|/)(\.env(\..*)?|\.npmrc|\.netrc|id_[a-z0-9]+|.*\.(pem|key|p12|pfx))$", re.I)
errors = []


def frontmatter(text):
    match = re.match(r"^---\n(.*?)\n---\n", text, re.S)
    if not match:
        return None
    fields = {}
    for line in match.group(1).splitlines():
        if re.match(r"^\S[^:]*:", line):
            key, _, value = line.partition(":")
            fields[key] = value.strip()
        elif line.startswith("  version:"):
            fields["metadata.version"] = line.split(":", 1)[1].strip()
    return fields


manifest = json.loads((ROOT / "manifest.json").read_text())
version = manifest["version"]

skills = sorted((ROOT / "skills").glob("*/SKILL.md"))
if not skills:
    errors.append("no skills/*/SKILL.md found")
for skill in skills:
    rel = skill.relative_to(ROOT)
    fields = frontmatter(skill.read_text())
    if fields is None:
        errors.append(f"{rel}: missing YAML frontmatter")
        continue
    if fields.get("name") != skill.parent.name:
        errors.append(f"{rel}: name {fields.get('name')!r} must equal its folder {skill.parent.name!r}")
    description = fields.get("description", "")
    if not description or len(description) > 1024:
        errors.append(f"{rel}: description must be 1-1024 characters (is {len(description)})")
    if not fields.get("license"):
        errors.append(f"{rel}: missing license")
    if fields.get("metadata.version") != version:
        errors.append(f"{rel}: metadata.version {fields.get('metadata.version')} != manifest {version}")

listed = manifest["files"]
on_disk = {p.relative_to(ROOT).as_posix() for p in (ROOT / "skills").rglob("*") if p.is_file()}
for path in sorted(on_disk - listed.keys()):
    errors.append(f"{path}: not in manifest.json")
for path, digest in sorted(listed.items()):
    file = ROOT / path
    if not file.is_file():
        errors.append(f"{path}: listed in manifest.json but missing")
    elif hashlib.sha256(file.read_bytes()).hexdigest() != digest:
        errors.append(f"{path}: SHA-256 differs from manifest.json")
for path in sorted(on_disk):
    if CREDENTIAL_NAME.search(path) and not path.endswith("/.env.example"):
        errors.append(f"{path}: credential or local config file")
    if (ROOT / path).is_symlink():
        errors.append(f"{path}: symbolic link")

for plugin in (".claude-plugin/plugin.json", ".cursor-plugin/plugin.json"):
    data = json.loads((ROOT / plugin).read_text())
    if data.get("version") != version:
        errors.append(f"{plugin}: version {data.get('version')} != manifest {version}")
json.loads((ROOT / ".claude-plugin/marketplace.json").read_text())
json.loads((ROOT / ".cursor-plugin/marketplace.json").read_text())

names = {s.parent.name for s in skills}
for evals in sorted((ROOT / "quality/trigger-evals").glob("*.json")):
    rel = evals.relative_to(ROOT)
    if evals.stem not in names:
        errors.append(f"{rel}: no skill named {evals.stem}")
    cases = json.loads(evals.read_text())
    if not all(isinstance(c.get("query"), str) and c["query"] and isinstance(c.get("should_trigger"), bool) for c in cases):
        errors.append(f"{rel}: every case needs a non-empty query and a boolean should_trigger")
    elif {c["should_trigger"] for c in cases} != {True, False}:
        errors.append(f"{rel}: needs both positive and negative cases")
for name in sorted(names - {e.stem for e in (ROOT / "quality/trigger-evals").glob("*.json")}):
    errors.append(f"skills/{name}: no quality/trigger-evals/{name}.json")

if errors:
    print("\n".join(errors))
    sys.exit(1)
print(f"ok: {len(skills)} skill(s), {len(listed)} files, version {version}")
