/**
 * Just Run It — sales product demo recorder
 *
 * Records a paced, professional UI walkthrough of the live control plane
 * (medium theme, 1920×1080) with chapter cards and on-screen captions.
 *
 * Prerequisites:
 *   - Control plane at JRI_BASE (default http://localhost:8080)
 *   - Playwright: npm install playwright  (or use /tmp/node_modules)
 *   - Chromium installed for Playwright
 *
 * Usage:
 *   node website/scripts/record-product-demo.mjs
 *   JRI_BASE=http://localhost:8080 JRI_USER=admin JRI_PASS=change-me node ...
 *
 * Output:
 *   website/assets/video/justrunit-product-demo.webm  (raw Playwright)
 *   website/assets/video/justrunit-product-demo.mp4   (H.264, shareable)
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
const USER = process.env.JRI_USER || 'admin';
const PASS = process.env.JRI_PASS || 'change-me';
const OUT_DIR = process.env.JRI_VIDEO_OUT || path.join(WEB_ROOT, 'assets', 'video');
const VIEWPORT = { width: 1920, height: 1080 };

const BRAND = {
  bg: '#1e293b',
  card: '#273549',
  accent: '#60a5fa',
  accent2: '#67e8f9',
  text: '#f1f5f9',
  muted: '#cbd5e1',
  ok: '#4ade80',
};

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  const home = os.homedir();
  // Prefer full builds (libx264 + mp4). Playwright's bundled ffmpeg is VP8/WebM-only.
  const candidates = [
    '/tmp/ffmpeg-static/ffmpeg',
    path.join(home, 'bin/ffmpeg'),
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg',
    'ffmpeg',
    path.join(home, '.cache/ms-playwright/ffmpeg-1011/ffmpeg-linux'),
    path.join(home, '.cache/ms-playwright/ffmpeg-1010/ffmpeg-linux'),
  ];
  for (const c of candidates) {
    if (c === 'ffmpeg') return c;
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
  });
  await sleep(250);
}

async function showCard(page, { eyebrow, title, body, seconds = 3.2 }) {
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: 100vw; height: 100vh;
    display: flex; align-items: center; justify-content: center;
    font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
    background: radial-gradient(ellipse at 30% 20%, #334155 0%, ${BRAND.bg} 55%, #0f172a 100%);
    color: ${BRAND.text};
  }
  .card {
    width: min(920px, 88vw);
    padding: 2.75rem 3rem;
    border-radius: 18px;
    background: linear-gradient(160deg, ${BRAND.card} 0%, #1e293b 100%);
    border: 1px solid rgba(148,163,184,0.35);
    box-shadow: 0 24px 64px rgba(0,0,0,0.45);
  }
  .eyebrow {
    font-size: 0.95rem; font-weight: 600; letter-spacing: 0.12em;
    text-transform: uppercase; color: ${BRAND.accent2}; margin-bottom: 0.85rem;
  }
  h1 {
    font-size: clamp(2rem, 3.4vw, 2.75rem); line-height: 1.15;
    letter-spacing: -0.02em; margin-bottom: 1rem; font-weight: 700;
  }
  p {
    font-size: 1.25rem; line-height: 1.55; color: ${BRAND.muted}; max-width: 46ch;
  }
  .mark {
    display: inline-flex; align-items: center; justify-content: center;
    width: 2.5rem; height: 2.5rem; border-radius: 0.65rem;
    background: ${BRAND.accent}; color: #0f172a; font-weight: 800;
    font-size: 0.85rem; margin-bottom: 1.25rem;
  }
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

async function caption(page, text, { holdMs = 2200 } = {}) {
  await page.evaluate((label) => {
    let el = document.getElementById('jri-demo-caption');
    if (!el) {
      el = document.createElement('div');
      el.id = 'jri-demo-caption';
      el.setAttribute('style', [
        'position:fixed', 'left:50%', 'bottom:28px', 'transform:translateX(-50%)',
        'z-index:2147483647', 'max-width:min(920px,92vw)',
        'padding:0.75rem 1.25rem', 'border-radius:999px',
        'background:rgba(15,23,42,0.88)', 'color:#f1f5f9',
        'border:1px solid rgba(96,165,250,0.45)',
        'box-shadow:0 10px 30px rgba(0,0,0,0.4)',
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

async function go(page, urlPath) {
  await page.goto(BASE + urlPath, { waitUntil: 'networkidle', timeout: 60000 });
  await applyMedium(page);
  await sleep(400);
}

async function gentleScroll(page, total = 280, steps = 8) {
  const step = total / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, step);
    await sleep(90);
  }
  await sleep(350);
}

async function login(page) {
  await go(page, '/login');
  await caption(page, 'Secure sign-in — local accounts or enterprise SSO (OIDC)', { holdMs: 1800 });
  await page.locator('#username').fill(USER);
  await sleep(400);
  await page.locator('#password').fill(PASS);
  await sleep(350);
  await Promise.all([
    page.waitForNavigation({ waitUntil: 'networkidle' }),
    page.click('button[type="submit"]'),
  ]);
  await applyMedium(page);
  await sleep(600);
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const rawDir = fs.mkdtempSync(path.join(os.tmpdir(), 'jri-demo-'));
  console.log('Recording to', rawDir);
  console.log('Target app', BASE);

  const browser = await chromium.launch({
    headless: true,
    args: ['--disable-dev-shm-usage'],
  });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: {
      dir: rawDir,
      size: VIEWPORT,
    },
  });
  const page = await context.newPage();
  await setMedium(page);

  // ── Opening ──────────────────────────────────────────────
  await showCard(page, {
    eyebrow: 'Product demo',
    title: 'Just Run It',
    body: 'Enterprise workload automation — define work, run it where files live, schedule it, and govern who can see it.',
    seconds: 4.0,
  });
  await showCard(page, {
    eyebrow: 'What you will see',
    title: 'Jobs · Workflows · Agents · Control',
    body: 'A live walkthrough of the operations control plane — the same UI your teams use every day.',
    seconds: 3.4,
  });

  // ── Login & dashboard ────────────────────────────────────
  await login(page);
  await caption(page, 'Operations dashboard — counts, agents, recent executions', { holdMs: 2800 });
  await gentleScroll(page, 220);
  await sleep(1200);

  // ── Jobs ─────────────────────────────────────────────────
  await showCard(page, {
    eyebrow: 'Define work',
    title: 'Jobs are the unit of automation',
    body: 'NOOP, COMMAND (real shell), HTTP probes, and GIT_RELEASE binaries — run on the control plane or a preferred agent.',
    seconds: 3.5,
  });
  await go(page, '/jobs');
  await caption(page, 'Job catalog — search, filter, edit, schedule, or run now', { holdMs: 2600 });
  await gentleScroll(page, 200);
  await sleep(800);

  // Open job editor
  const editHref = await page.locator('a[href*="/jobs/"][href*="/edit"]').first().getAttribute('href').catch(() => null);
  if (editHref) {
    await page.click(`a[href="${editHref}"]`);
    await page.waitForLoadState('networkidle');
    await applyMedium(page);
    await caption(page, 'Job editor — type, payload, preferred agent, timeouts, concurrency', { holdMs: 3000 });
    await gentleScroll(page, 240);
    await sleep(900);
  }

  // Back to jobs and run a sample job (HTTP health is realistic)
  await go(page, '/jobs');
  await caption(page, 'Run a job on demand — agents claim work and report results', { holdMs: 1800 });
  const runForm = page.locator('form[action*="/jobs/"][action$="/run"]').first();
  // Prefer http-health-sample if present
  const httpRun = page.locator('tr:has-text("http-health-sample") form[action$="/run"] button[type="submit"]').first();
  const anyRun = page.locator('form[action$="/run"] button[type="submit"]').first();
  if (await httpRun.count()) {
    await Promise.all([
      page.waitForLoadState('networkidle'),
      httpRun.click(),
    ]).catch(async () => {
      await httpRun.click();
      await sleep(1500);
    });
  } else if (await anyRun.count()) {
    await anyRun.click();
    await sleep(1500);
  }
  await applyMedium(page);
  await caption(page, 'Job submitted — visible immediately in executions', { holdMs: 2200 });
  await sleep(800);

  // ── Workflows ────────────────────────────────────────────
  await showCard(page, {
    eyebrow: 'Orchestrate',
    title: 'Multi-step workflows',
    body: 'Ordered steps with conditions and restart — build extract → transform → load without a visual designer tax.',
    seconds: 3.4,
  });
  await go(page, '/workflows');
  await caption(page, 'Workflows — serial pipelines and conditional steps', { holdMs: 2800 });
  await gentleScroll(page, 180);
  await sleep(900);

  // ── Schedules ────────────────────────────────────────────
  await showCard(page, {
    eyebrow: 'Automate on time',
    title: 'Cron schedules for jobs and workflows',
    body: 'Hands-off nightly and business-hour runs with clear ownership in the control plane.',
    seconds: 3.2,
  });
  await go(page, '/schedules');
  await caption(page, 'Schedules — cron triggers for jobs or full workflows', { holdMs: 2800 });
  await gentleScroll(page, 160);
  await sleep(900);

  // ── Agents ───────────────────────────────────────────────
  await showCard(page, {
    eyebrow: 'Run where work lives',
    title: 'Federated agents',
    body: 'Linux, Windows, containers — register workers, track capacity and heartbeats, pin preferred hosts.',
    seconds: 3.5,
  });
  await go(page, '/agents');
  await caption(page, 'Agents — ONLINE capacity, heartbeats, federated execution hosts', { holdMs: 3000 });
  await gentleScroll(page, 160);
  await sleep(900);

  // ── Executions ───────────────────────────────────────────
  await showCard(page, {
    eyebrow: 'Operate with confidence',
    title: 'Execution history & triage',
    body: 'Search, filter by status, cancel or kill runs, and open detail with error reason and log output.',
    seconds: 3.5,
  });
  await go(page, '/executions');
  await caption(page, 'Executions — history, status filters, and drill-down', { holdMs: 2800 });
  await gentleScroll(page, 260);
  await sleep(800);

  const execHref = await page.locator('a[href*="/executions/jobs/"]').first().getAttribute('href').catch(() => null);
  if (execHref) {
    await page.click(`a[href="${execHref}"]`);
    await page.waitForLoadState('networkidle');
    await applyMedium(page);
    await caption(page, 'Execution detail — status, timing, agent, logs for fast triage', { holdMs: 3200 });
    await gentleScroll(page, 220);
    await sleep(1000);
  }

  // ── Users / governance ───────────────────────────────────
  await showCard(page, {
    eyebrow: 'Govern access',
    title: 'RBAC, workspaces, optional SSO',
    body: 'Local roles for operators and admins; personal and group workspaces; OIDC when your IdP is ready.',
    seconds: 3.4,
  });
  await go(page, '/admin/users');
  await caption(page, 'User administration — roles, enable/disable, password management', { holdMs: 2800 });
  await gentleScroll(page, 160);
  await sleep(1000);

  // ── Close ────────────────────────────────────────────────
  await clearCaption(page);
  await showCard(page, {
    eyebrow: 'Just Run It',
    title: 'Define. Run. Schedule. Observe.',
    body: 'Docker Compose or Kubernetes · justrunit.io · justrunit.io@gmail.com · 318-232-2280',
    seconds: 4.5,
  });
  await showCard(page, {
    eyebrow: 'Next step',
    title: 'Talk with us about licensing',
    body: 'Share this demo with stakeholders, then schedule a guided walkthrough for your environment.',
    seconds: 3.5,
  });

  await page.close();
  await context.close();
  await browser.close();

  // Playwright writes one webm per page; after close the file is finalized
  const files = fs.readdirSync(rawDir).filter((f) => f.endsWith('.webm'));
  if (!files.length) {
    throw new Error('No video file produced in ' + rawDir);
  }
  // Prefer largest (main recording)
  files.sort((a, b) => fs.statSync(path.join(rawDir, b)).size - fs.statSync(path.join(rawDir, a)).size);
  const webmSrc = path.join(rawDir, files[0]);
  const webmDest = path.join(OUT_DIR, 'justrunit-product-demo.webm');
  const mp4Dest = path.join(OUT_DIR, 'justrunit-product-demo.mp4');
  fs.copyFileSync(webmSrc, webmDest);
  console.log('WebM:', webmDest, (fs.statSync(webmDest).size / 1024 / 1024).toFixed(2), 'MB');

  const ffmpeg = findFfmpeg();
  if (!ffmpeg) {
    console.warn('ffmpeg not found — leaving WebM only');
    return;
  }
  // H.264 yuv420p for maximum compatibility (website, email, Teams, etc.)
  const args = [
    '-y',
    '-i', webmSrc,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    '-an',
    mp4Dest,
  ];
  console.log('Encoding MP4 with', ffmpeg);
  let r = spawnSync(ffmpeg, args, { stdio: 'inherit' });
  if (r.status !== 0) {
    console.warn('libx264 failed — trying copy-to-webm only path notice');
    // Last resort: re-mux is not useful; keep WebM for modern browsers
    console.warn('MP4 encode failed; WebM is still available at', webmDest);
    console.warn('Install a full ffmpeg (e.g. johnvansickle static build) and re-run with FFMPEG=/path/to/ffmpeg');
    return;
  }
  console.log('MP4:', mp4Dest, (fs.statSync(mp4Dest).size / 1024 / 1024).toFixed(2), 'MB');
  // cleanup temp
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
