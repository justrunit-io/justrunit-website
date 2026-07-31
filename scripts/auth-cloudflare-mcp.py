#!/usr/bin/env python3
"""
Authenticate Cloudflare remote MCP servers for Grok without WSL localhost issues.

Callback runs on **Windows** PowerShell (127.0.0.1 where Chrome lives).
Tokens saved to ~/.grok/mcp_credentials.json for Grok MCP OAuth.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import secrets
import subprocess
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

CHROME = Path("/mnt/c/Program Files/Google/Chrome/Application/chrome.exe")
POWERSHELL = Path("/mnt/c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe")
SCRIPT_DIR = Path(__file__).resolve().parent
PS1 = SCRIPT_DIR / "auth-cloudflare-mcp.ps1"
CRED_PATH = Path.home() / ".grok" / "mcp_credentials.json"
# Windows path readable from WSL
WIN_CALLBACK = Path("/mnt/c/Users/rober/.grok/mcp_oauth_callback.json")
WIN_CALLBACK_WIN = r"C:\Users\rober\.grok\mcp_oauth_callback.json"
PORT = 18765

SERVERS = [
    ("cloudflare-api", "https://mcp.cloudflare.com/mcp", "https://mcp.cloudflare.com"),
    ("cloudflare-bindings", "https://bindings.mcp.cloudflare.com/mcp", "https://bindings.mcp.cloudflare.com"),
    ("cloudflare-builds", "https://builds.mcp.cloudflare.com/mcp", "https://builds.mcp.cloudflare.com"),
    ("cloudflare-observability", "https://observability.mcp.cloudflare.com/mcp", "https://observability.mcp.cloudflare.com"),
]


def http_json(method: str, url: str, data=None, headers=None, timeout=45):
    body = None
    h = {"Accept": "application/json", "User-Agent": "grok-mcp-oauth/1.0"}
    if headers:
        h.update(headers)
    if data is not None:
        body = json.dumps(data).encode()
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=body, headers=h, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode() or "{}"
            return resp.status, json.loads(raw)
    except urllib.error.HTTPError as e:
        raw = e.read().decode(errors="replace")
        raise RuntimeError(f"HTTP {e.code} {url}: {raw[:500]}") from e


def http_form(url: str, form: dict, timeout=45):
    body = urllib.parse.urlencode(form).encode()
    h = {
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json",
        "User-Agent": "grok-mcp-oauth/1.0",
    }
    req = urllib.request.Request(url, data=body, headers=h, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode(errors="replace")
        raise RuntimeError(f"HTTP {e.code} token exchange: {raw[:500]}") from e


def b64url(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def pkce():
    verifier = b64url(secrets.token_bytes(32))
    challenge = b64url(hashlib.sha256(verifier.encode()).digest())
    return verifier, challenge


def get_metadata(issuer: str) -> dict:
    url = issuer.rstrip("/") + "/.well-known/oauth-authorization-server"
    _, meta = http_json("GET", url)
    return meta


def register_client(meta: dict, redirect_uri: str) -> dict:
    reg = meta.get("registration_endpoint")
    if not reg:
        raise RuntimeError("no registration_endpoint in OAuth metadata")
    payload = {
        "client_name": "Grok Build Cloudflare MCP",
        "redirect_uris": [redirect_uri],
        "grant_types": ["authorization_code", "refresh_token"],
        "response_types": ["code"],
        "token_endpoint_auth_method": "none",
        "application_type": "native",
    }
    _, body = http_json("POST", reg, payload)
    if "client_id" not in body:
        raise RuntimeError(f"registration failed: {body}")
    return body


def start_windows_listener() -> subprocess.Popen:
    WIN_CALLBACK.parent.mkdir(parents=True, exist_ok=True)
    if WIN_CALLBACK.exists():
        WIN_CALLBACK.unlink()
    # Convert PS1 path to Windows
    ps1_win = str(PS1).replace("/mnt/c/", "C:\\").replace("/", "\\")
    cmd = [
        str(POWERSHELL),
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        ps1_win,
        "-Port",
        str(PORT),
        "-OutFile",
        WIN_CALLBACK_WIN,
        "-TimeoutSec",
        "300",
    ]
    # Start detached enough to keep listening
    return subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)


def open_chrome(url: str) -> None:
    if CHROME.exists():
        subprocess.Popen(
            [str(CHROME), "--new-window", url],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        print("Opened Chrome for Cloudflare login.")
    else:
        print("Open this URL in Chrome:\n", url)


def wait_callback(timeout=300) -> dict:
    start = time.time()
    while time.time() - start < timeout:
        if WIN_CALLBACK.exists():
            try:
                text = WIN_CALLBACK.read_text(encoding="utf-8-sig").strip()
                if text:
                    data = json.loads(text)
                    return data
            except Exception:
                pass
        time.sleep(0.4)
    raise TimeoutError(
        "No OAuth callback received. Approve the Cloudflare login in Chrome; "
        "callback must reach http://127.0.0.1:8765/callback on Windows."
    )


def auth_one(name: str, resource_url: str, issuer: str) -> dict:
    print(f"\n=== {name} ===")
    print(f"Resource: {resource_url}")
    meta = get_metadata(issuer)
    redirect_uri = f"http://127.0.0.1:{PORT}/callback"

    client = register_client(meta, redirect_uri)
    client_id = client["client_id"]
    client_secret = client.get("client_secret")
    print(f"Registered OAuth client: {client_id[:20]}...")

    verifier, challenge = pkce()
    state = secrets.token_urlsafe(16)
    params = {
        "response_type": "code",
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "resource": resource_url,
    }
    auth_url = meta["authorization_endpoint"] + "?" + urllib.parse.urlencode(params)

    listener = start_windows_listener()
    time.sleep(1.2)
    if listener.poll() is not None:
        out = listener.stdout.read() if listener.stdout else ""
        raise RuntimeError(f"Windows listener failed to start:\n{out}")

    open_chrome(auth_url)
    print("In Chrome: sign into Cloudflare and click Allow.")
    print(f"Waiting for callback on Windows http://127.0.0.1:{PORT}/callback ...")

    try:
        result = wait_callback(300)
    finally:
        if listener.poll() is None:
            listener.terminate()
        if WIN_CALLBACK.exists():
            try:
                WIN_CALLBACK.unlink()
            except OSError:
                pass

    if result.get("error"):
        raise RuntimeError(
            f"OAuth denied: {result.get('error')} {result.get('error_description', '')}"
        )
    if result.get("state") != state:
        raise RuntimeError(f"state mismatch: got {result.get('state')}")
    code = result.get("code")
    if not code:
        raise RuntimeError(f"no authorization code: {result}")

    form = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": redirect_uri,
        "client_id": client_id,
        "code_verifier": verifier,
        "resource": resource_url,
    }
    if client_secret:
        form["client_secret"] = client_secret
    token = http_form(meta["token_endpoint"], form)
    if "access_token" not in token:
        raise RuntimeError(f"token response missing access_token: {token}")

    print(f"Token OK (expires_in={token.get('expires_in')})")
    scopes = token["scope"].split() if token.get("scope") else []
    received = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%fZ")
    stored = {
        "client_id": client_id,
        "token_response": {
            "access_token": token["access_token"],
            "token_type": token.get("token_type", "Bearer"),
            "expires_in": token.get("expires_in"),
            "refresh_token": token.get("refresh_token"),
            "scope": token.get("scope"),
        },
        "granted_scopes": scopes,
        "token_received_at": received,
        "issuer": issuer,
        "resource": resource_url,
    }
    if client_secret:
        stored["client_secret"] = client_secret
    return stored



def inject_config_headers(store: dict) -> None:
    """Write Bearer tokens into ~/.grok/config.toml so Grok sessions work without env vars."""
    cfg_path = Path.home() / ".grok" / "config.toml"
    if not cfg_path.exists():
        return
    mapping = {
        "https://mcp.cloudflare.com/mcp": "cloudflare-api",
        "https://bindings.mcp.cloudflare.com/mcp": "cloudflare-bindings",
        "https://builds.mcp.cloudflare.com/mcp": "cloudflare-builds",
        "https://observability.mcp.cloudflare.com/mcp": "cloudflare-observability",
    }
    text = cfg_path.read_text()
    # Ensure server blocks exist with placeholder then replace
    # Prefer replace existing Bearer lines under each section by rewriting Authorization lines
    for url, name in mapping.items():
        entry = store.get(url)
        if not entry:
            continue
        tok = entry["token_response"]["access_token"]
        # replace any Authorization line that sits near this server - simple global replace of known env form
        # and also replace previous bearer tokens for this server block using a targeted approach
        import re
        pattern = rf'(\[mcp_servers\.{re.escape(name)}\.headers\]\s*\nAuthorization = )"Bearer [^"]*"'
        repl = rf'\1"Bearer {tok}"'
        new_text, n = re.subn(pattern, repl, text)
        if n:
            text = new_text
            print(f"Updated config header for {name}")
        else:
            # try env placeholder
            text2 = text.replace(
                f'Authorization = "Bearer ${{CLOUDFLARE_MCP_{name.split("-")[-1].upper()}_TOKEN}}"',
                f'Authorization = "Bearer {tok}"',
            )
            if text2 != text:
                text = text2
                print(f"Updated env placeholder for {name}")
    cfg_path.write_text(text)
    cfg_path.chmod(0o600)

def main() -> int:
    CRED_PATH.parent.mkdir(parents=True, exist_ok=True)
    store: dict = {}
    if CRED_PATH.exists():
        try:
            store = json.loads(CRED_PATH.read_text())
        except Exception:
            store = {}

    failures = []
    for name, resource, issuer in SERVERS:
        try:
            cred = auth_one(name, resource, issuer)
            store[resource] = cred
            store[name] = cred
            CRED_PATH.write_text(json.dumps(store, indent=2))
            os.chmod(CRED_PATH, 0o600)
            print(f"Saved {name} → {CRED_PATH}")
        except Exception as e:
            failures.append((name, str(e)))
            print(f"FAILED {name}: {e}")
            # continue with remaining servers

    print("\n=== Summary ===")
    failed = {n for n, _ in failures}
    for name, resource, _ in SERVERS:
        print(("OK  " if name not in failed else "FAIL"), name)
    for name, err in failures:
        print(f"  · {name}: {err}")
    inject_config_headers(store)
    print(f"\nCredentials: {CRED_PATH}")
    print("Next: restart Grok or press r in /mcps, then: grok mcp doctor")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
