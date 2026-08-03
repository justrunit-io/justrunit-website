/**
 * Just Run It — OIDC + workspace isolation demo recorder (elaborate)
 *
 * Captures enterprise SSO (Keycloak), IdP groups → roles, and multi-team
 * workspace isolation. Medium theme, 1920×1080, chapter cards + captions.
 *
 * Prerequisites:
 *   ./scripts/demo-up.sh   (hybrid SSO + seed workspaces)
 *   Playwright available (run from a dir with node_modules/playwright, e.g. /tmp)
 *
 * Usage:
 *   cd /tmp && JRI_VIDEO_OUT=.../website/assets/video node .../record-oidc-workspace-demo.mjs
 *
 * Output:
 *   justrunit-oidc-workspace-demo.webm
 *   justrunit-oidc-workspace-demo.mp4
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import os from 'os';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WEB_ROOT = path.resolve(__dirname, '..');
const BASE = process.env.JRI_BASE || 'http://localhost:8080';
const OUT_DIR = process.env.JRI_VIDEO_OUT || path.join(WEB_ROOT, 'assets', 'video');
const VIEWPORT = { width: 1920, height: 1080 };

const USERS = {
  viewer: { user: 'sso-viewer', pass: 'DemoView1!', label: 'Viewer (Finance read)' },
  finance: { user: 'sso-ops-finance', pass: 'DemoOps1!', label: 'Finance operator' },
  platform: { user: 'sso-ops-platform', pass: 'DemoOps1!', label: 'Platform operator' },
  admin: { user: 'sso-admin', pass: 'DemoAdmin1!', label: 'SSO Admin' },
};

const BRAND = {
  bg: '#1e293b',
  card: '#273549',
  accent: '#60a5fa',
  accent2: '#67e8f9',
  text: '#f1f5f9',
  muted: '#cbd5e1',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  const home = os.homedir();
  const candidates = [
    '/tmp/ffmpeg-static/ffmpeg',
    path.join(home, 'bin/ffmpeg'),
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    path.join(home, '.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux'),
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

async function setMedium(page) {
  await page.addInitScript(() => {
    localStorage.setItem('automation-theme', 'medium');
    document.documentElement.setAttribute('data-theme', 'medium');
  });
}

async function applyMedium(page) {
  await page.evaluate(() => {
    localStorage.setItem('automation-theme', 'medium');
    document.documentElement.setAttribute('data-theme', 'medium');
    if (window.AutomationTheme) window.AutomationTheme.apply('medium', true);
  }).catch(() => {});
  await sleep(200);
}

async function showCard(page, { eyebrow, title, body, seconds = 3.5 }) {
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 100vw; height: 100vh;
    display: flex; align-items: center; justify-content: center;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    background: radial-gradient(ellipse at 28% 18%, #334155 0%, ${BRAND.bg} 52%, #0f172a 100%);
    color: ${BRAND.text};
  }
  .card {
    width: min(960px, 90vw);
    padding: 2.6rem 3rem;
    border-radius: 18px;
    background: linear-gradient(160deg, ${BRAND.card} 0%, #1e293b 100%);
    border: 1px solid rgba(148,163,184,0.35);
    box-shadow: 0 24px 64px rgba(0,0,0,0.45);
  }
  .mark {
    display: inline-flex; align-items: center; justify-content: center;
    width: 2.4rem; height: 2.4rem; border-radius: 0.6rem;
    background: ${BRAND.accent}; color: #0f172a; font-weight: 800;
    font-size: 0.8rem; margin-bottom: 1.1rem;
  }
  .eyebrow {
    font-size: 0.92rem; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: ${BRAND.accent2}; margin-bottom: 0.75rem;
  }
  h1 {
    font-size: clamp(1.85rem, 3.2vw, 2.55rem); line-height: 1.15;
    letter-spacing: -0.02em; margin-bottom: 0.9rem; font-weight: 700;
  }
  p { font-size: 1.18rem; line-height: 1.55; color: ${BRAND.muted}; max-width: 48ch; }
</style></head>
<body>
  <div class="card">
    <div class="mark">JR</div>
    <div class="eyebrow">${eyebrow || 'Just Run It'}</div>
    <h1>${title}</h1>
    ${body ? `<p>${body}</p>` : ''}
  </div>
</body></html>`;
  await page.setContent(html, { waitUntil: 'domcontentloaded' });
  await sleep(Math.round(seconds * 1000));
}

async function caption(page, text, { holdMs = 2400 } = {}) {
  await page.evaluate((label) => {
    let el = document.getElementById('jri-demo-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'jri-demo-caption';
      el.setAttribute('style', [
        'position:fixed', 'left:50%', 'bottom:28px', 'transform:translateX(-50%)',
        'z-index:2147483647', 'max-width:min(980px,94vw)',
        'padding:0.8rem 1.35rem', 'border-radius:999px',
        'background:rgba(15,23,42,0.9)', 'color:#f1f5f9',
        'border:1px solid rgba(96,165,250,0.5)',
        'box-shadow:0 10px 30px rgba(0,0,0,0.45)',
        'font:600 1.05rem/1.35 "Segoe UI",system-ui,sans-serif',
        'letter-spacing:0.01em', 'text-align:center',
        'pointer-events:none', 'backdrop-filter:blur(8px)',
      ].join(';'));
      document.body.appendChild(el);
    }
    el.textContent = label;
    el.style.opacity = '1';
  }, text);
  await sleep(holdMs);
}

async function clearCaption(page) {
  await page.evaluate(() => {
    const el = document.getElementById('jri-demo-caption');
    if (el) el.style.opacity = '0';
  }).catch(() => {});
}

async function gentleScroll(page, total = 220, steps = 7) {
  const step = total / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step);
    await sleep(85);
  }
  await sleep(300);
}

async function goApp(page, urlPath = '/') {
  await page.goto(BASE + urlPath, { waitUntil: 'networkidle', timeout: 60000 });
  await applyMedium(page);
  await sleep(350);
}

async function clearIdpSession(page, context) {
  // End Keycloak SSO session so the next login shows the username/password form
  try {
    await page.goto('http://localhost:8082/realms/justrunit/protocol/openid-connect/logout', {
      waitUntil: 'domcontentloaded',
      timeout: 15000,
    });
    await sleep(400);
  } catch {
    /* ignore */
  }
  try {
    await context.clearCookies();
  } catch {
    /* ignore */
  }
}

async function ssoLogin(page, context, { user, pass }) {
  // Ensure clean IdP session so we always film the Keycloak form
  await clearIdpSession(page, context);
  await goApp(page, '/login');
  await caption(page, 'Enterprise hybrid login — local form + Sign in with SSO (OIDC)', { holdMs: 2200 });
  const sso = page.locator('a[href*="oauth2/authorization/oidc"]');
  await sso.waitFor({ state: 'visible', timeout: 15000 });
  await sleep(600);
  await sso.click();
  // Land on Keycloak (or rare fast-path back to app if session remains)
  await page.waitForLoadState('domcontentloaded').catch(() => {});
  await sleep(800);

  if (page.url().includes('realms/') || page.url().includes('8082')) {
    await caption(page, 'Redirect to identity provider (Keycloak) — same pattern as Entra ID / Okta', {
      holdMs: 2000,
    });
    await page.locator('#username').waitFor({ state: 'visible', timeout: 20000 });
    await page.locator('#username').fill('');
    await page.locator('#username').fill(user);
    await sleep(350);
    await page.locator('#password').fill('');
    await page.locator('#password').fill(pass);
    await sleep(400);
    await page.click('#kc-login');
  }

  // Back on control plane
  await page.waitForURL((u) => u.href.startsWith(BASE) && !u.href.includes('/login/oauth2'), {
    timeout: 45000,
  });
  await page.waitForLoadState('networkidle').catch(() => {});
  await applyMedium(page);
  // Confirm signed-in shell
  await page.locator('text=Signed in as').waitFor({ state: 'visible', timeout: 20000 }).catch(() => {});
  await sleep(700);
}

async function logout(page, context) {
  await clearCaption(page);
  const form = page.locator('form[action*="logout"]');
  if (await form.count()) {
    await Promise.all([
      page.waitForURL(/login/, { timeout: 20000 }).catch(() => null),
      form.locator('button, input[type=submit]').first().click(),
    ]);
  } else {
    await goApp(page, '/login');
  }
  await page.waitForURL(/login/, { timeout: 15000 }).catch(() => null);
  await clearIdpSession(page, context);
  await sleep(500);
}

async function highlightWorkspace(page) {
  await page.evaluate(() => {
    const sw = document.querySelector('.workspace-switcher, select[name="workspaceId"]');
    if (!sw) return;
    const el = sw.closest('.workspace-switcher') || sw;
    el.style.outline = '3px solid #60a5fa';
    el.style.outlineOffset = '4px';
    el.style.boxShadow = '0 0 0 6px rgba(96,165,250,0.25)';
  }).catch(() => {});
}

async function selectWorkspaceByText(page, textPart) {
  const select = page.locator('select[name="workspaceId"]');
  if (!(await select.count())) return false;
  const option = select.locator('option').filter({ hasText: textPart }).first();
  if (!(await option.count())) return false;
  const value = await option.getAttribute('value');
  if (value == null) return false;
  // Submit the workspace form
  await select.selectOption(value);
  await sleep(200);
  const form = page.locator('form[action*="workspace"]').first();
  if (await form.count()) {
    await Promise.all([
      page.waitForLoadState('networkidle').catch(() => null),
      form.evaluate((f) => f.requestSubmit ? f.requestSubmit() : f.submit()),
    ]);
  }
  await applyMedium(page);
  await sleep(500);
  return true;
}

async function openNav(page, name) {
  const link = page.locator('nav a, .nav a').filter({ hasText: new RegExp(`^${name}$`, 'i') }).first();
  if (await link.count()) {
    await link.click();
    await page.waitForLoadState('networkidle').catch(() => null);
    await applyMedium(page);
    await sleep(500);
    return true;
  }
  return false;
}

async function tryRunFirstJob(page) {
  const runBtn = page.locator('form[action*="/run"] button[type="submit"], button:has-text("Run")').first();
  if (await runBtn.count()) {
    await caption(page, 'OPERATOR can run jobs in workspaces they manage', { holdMs: 1600 });
    await runBtn.click();
    await page.waitForLoadState('networkidle').catch(() => null);
    await applyMedium(page);
    await sleep(1200);
    return true;
  }
  return false;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const rawDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jri-oidc-demo-'));
  console.log('Recording OIDC/workspace demo →', rawDir);
  console.log('App', BASE);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: { dir: rawDir, size: VIEWPORT },
  });
  const page = await context.newPage();
  await setMedium(page);

  // ── Opening ──────────────────────────────────────────────
  await showCard(page, {
    eyebrow: 'Product demo · Enterprise identity',
    title: 'OIDC SSO + workspace isolation',
    body: 'See how Just Run It maps IdP groups to roles, and keeps multi-team catalogs separate on one control plane.',
    seconds: 4.2,
  });
  await showCard(page, {
    eyebrow: 'What you will see',
    title: 'SSO · Roles · Finance vs Platform',
    body: 'Hybrid login, Keycloak groups → VIEWER / OPERATOR / ADMIN, then two operator teams that cannot see each other’s jobs.',
    seconds: 4.0,
  });

  // ── Login page hybrid ────────────────────────────────────
  await goApp(page, '/login');
  await caption(page, 'Hybrid mode: local break-glass accounts + enterprise Sign in with SSO', {
    holdMs: 3200,
  });
  await sleep(800);

  // ── Viewer SSO ───────────────────────────────────────────
  await showCard(page, {
    eyebrow: 'Step 1 · Least privilege',
    title: 'Sign in as Viewer via SSO',
    body: 'IdP group automation-viewers maps to VIEWER. Read access to assigned workspaces only.',
    seconds: 3.6,
  });
  await ssoLogin(page, context, USERS.viewer);
  await caption(page, `Signed in as ${USERS.viewer.user} — VIEWER from IdP group`, { holdMs: 2600 });
  await highlightWorkspace(page);
  await caption(page, 'Workspace switcher: only catalogs this user may see (Finance Batch + personal)', {
    holdMs: 3200,
  });
  await openNav(page, 'Jobs');
  await caption(page, 'Job catalog scoped by membership — not a global free-for-all', { holdMs: 2800 });
  await gentleScroll(page, 180);
  await sleep(900);

  // ── Finance operator ─────────────────────────────────────
  await showCard(page, {
    eyebrow: 'Step 2 · Finance operator',
    title: 'Same product, team-owned work',
    body: 'SSO as sso-ops-finance (OPERATOR). Run jobs in Finance Batch — the daily production persona.',
    seconds: 3.8,
  });
  await logout(page, context);
  await ssoLogin(page, context, USERS.finance);
  await caption(page, `Signed in as ${USERS.finance.user} — OPERATOR via automation-operators group`, {
    holdMs: 2800,
  });
  await highlightWorkspace(page);
  await selectWorkspaceByText(page, 'Finance');
  await caption(page, 'Filter: Finance Batch — team catalog only', { holdMs: 2600 });
  await openNav(page, 'Jobs');
  await caption(page, 'Finance jobs: nightly extract, HTTP health — owned by this team', { holdMs: 2800 });
  await gentleScroll(page, 160);
  await tryRunFirstJob(page);
  await openNav(page, 'Executions');
  await caption(page, 'Execution history for triage — status, timing, drill-down', { holdMs: 2800 });
  await gentleScroll(page, 200);
  await sleep(900);

  // ── Platform operator isolation ──────────────────────────
  await showCard(page, {
    eyebrow: 'Step 3 · Isolation proof',
    title: 'Same role, different workspace',
    body: 'sso-ops-platform is also OPERATOR — but only Platform Ops. Finance work stays with Finance.',
    seconds: 4.0,
  });
  await logout(page, context);
  await ssoLogin(page, context, USERS.platform);
  await caption(page, `Signed in as ${USERS.platform.user} — OPERATOR, Platform Ops membership`, {
    holdMs: 2800,
  });
  await highlightWorkspace(page);
  await selectWorkspaceByText(page, 'Platform');
  await caption(page, 'Platform Ops catalog — infrastructure team jobs, not Finance', { holdMs: 3000 });
  await openNav(page, 'Jobs');
  await caption(page, 'Isolation: same RBAC role, different membership → different visible jobs', {
    holdMs: 3400,
  });
  await gentleScroll(page, 160);
  await tryRunFirstJob(page);
  await sleep(800);

  // ── Admin SSO ────────────────────────────────────────────
  await showCard(page, {
    eyebrow: 'Step 4 · Platform owner',
    title: 'SSO Admin sees the whole estate',
    body: 'automation-admins → ADMIN. All workspaces, user admin, group membership control.',
    seconds: 3.8,
  });
  await logout(page, context);
  await ssoLogin(page, context, USERS.admin);
  await caption(page, `Signed in as ${USERS.admin.user} — ADMIN from IdP group`, { holdMs: 2600 });
  await highlightWorkspace(page);
  await caption(page, 'Admin workspace filter: Finance, Platform Ops, personal, platform shared', {
    holdMs: 3000,
  });
  await openNav(page, 'Jobs');
  await caption(page, 'Full catalog visibility across teams', { holdMs: 2400 });
  await gentleScroll(page, 140);

  // Groups / workspaces admin
  const groupsLink = page.locator('a[href*="/admin/workspaces"]').first();
  if (await groupsLink.count()) {
    await groupsLink.click();
    await page.waitForLoadState('networkidle').catch(() => null);
    await applyMedium(page);
    await caption(page, 'Groups / Workspaces admin — create teams, assign OWNER · MANAGER · MEMBER', {
      holdMs: 3400,
    });
    await gentleScroll(page, 160);
    // Open finance members if link present
    const members = page.locator('a:has-text("Members")').first();
    if (await members.count()) {
      await members.click();
      await page.waitForLoadState('networkidle').catch(() => null);
      await applyMedium(page);
      await caption(page, 'Membership list ties SSO usernames to team catalogs', { holdMs: 3000 });
      await sleep(800);
    }
  }

  // Users admin
  const usersLink = page.locator('a[href*="/admin/users"]').first();
  if (await usersLink.count()) {
    await usersLink.click();
    await page.waitForLoadState('networkidle').catch(() => null);
    await applyMedium(page);
    await caption(page, 'Local user admin still available — hybrid: SSO for people, local for agents/break-glass', {
      holdMs: 3400,
    });
    await gentleScroll(page, 120);
  }

  await openNav(page, 'Agents');
  await caption(page, 'Agents use HTTP Basic (service account) — not browser OIDC. Correct enterprise pattern.', {
    holdMs: 3400,
  });
  await gentleScroll(page, 140);
  await sleep(700);

  // ── Close ────────────────────────────────────────────────
  await clearCaption(page);
  await showCard(page, {
    eyebrow: 'Just Run It',
    title: 'SSO. Groups. Workspaces. Agents.',
    body: 'Enterprise identity for people. API-only agents where files live. Multi-team catalogs on one control plane.',
    seconds: 4.5,
  });
  await showCard(page, {
    eyebrow: 'Next step',
    title: 'See it live · talk licensing',
    body: 'justrunit.io · Security & architecture PDFs in Downloads · justrunit.io@gmail.com · 318-232-2280',
    seconds: 4.0,
  });

  await page.close();
  await context.close();
  await browser.close();

  const files = fs.readdirSync(rawDir).filter((f) => f.endsWith('.webm'));
  if (!files.length) throw new Error('No video produced in ' + rawDir);
  files.sort((a, b) => fs.statSync(path.join(rawDir, b)).size - fs.statSync(path.join(rawDir, a)).size);
  const webmSrc = path.join(rawDir, files[0]);
  const webmDest = path.join(OUT_DIR, 'justrunit-oidc-workspace-demo.webm');
  const mp4Dest = path.join(OUT_DIR, 'justrunit-oidc-workspace-demo.mp4');
  fs.copyFileSync(webmSrc, webmDest);
  console.log('WebM:', webmDest, (fs.statSync(webmDest).size / 1024 / 1024).toFixed(2), 'MB');

  const ffmpeg = findFfmpeg();
  if (!ffmpeg) {
    console.warn('ffmpeg not found — WebM only');
    return;
  }
  console.log('Encoding MP4 with', ffmpeg);
  const r = spawnSync(ffmpeg, [
    '-y', '-i', webmSrc,
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20',
    '-pix_fmt', 'yuv420p', '-movflags', '+faststart', '-an',
    mp4Dest,
  ], { stdio: 'inherit' });
  if (r.status !== 0) {
    console.warn('MP4 encode failed; WebM available at', webmDest);
    return;
  }
  console.log('MP4:', mp4Dest, (fs.statSync(mp4Dest).size / 1024 / 1024).toFixed(2), 'MB');
  try {
    fs.rmSync(rawDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
