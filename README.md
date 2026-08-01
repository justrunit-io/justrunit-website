# Just Run It — public website

Static marketing site for **Just Run It** (enterprise workload automation).

| | |
|--|--|
| **Production domain** | **https://justrunit.io** |
| **Contact** | justrunit.io@gmail.com · 318-232-2280 |
| **Host** | Cloudflare Pages (recommended) |

## Local preview

```bash
cd website
python3 -m http.server 8787
# open http://localhost:8787
```

## Cloudflare Pages deploy

### 1. Create the Pages project

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages**.
2. Connect GitHub repo `robertcsims/automation-platform` (or direct upload of `website/`).
3. Build settings:
   - **Root directory:** `website`
   - **Build command:** *(empty)*
   - **Build output directory:** `/` (static root of that directory)
4. Deploy once so the project has a `*.pages.dev` URL.

### 2. Attach **justrunit.io**

1. In the Pages project → **Custom domains** → **Set up a custom domain**.
2. Enter `justrunit.io` (and optionally `www.justrunit.io`).
3. If the domain is **already in Cloudflare DNS** (same account):
   - Cloudflare can auto-create the correct records (apex CNAME flattening / `www` CNAME to the Pages project).
4. If the domain is registered elsewhere and **not** yet on Cloudflare:
   - Add the site to Cloudflare (change nameservers at the registrar to Cloudflare’s), **or**
   - Create the DNS records Cloudflare shows (typically a CNAME for `www` and CNAME/ALIAS for apex to `your-project.pages.dev`).
5. Wait for SSL (**Full** / Universal SSL). HTTPS should serve at **https://justrunit.io**.

### 3. Optional: redirect www → apex

In the domain’s Cloudflare **Rules** → **Redirect Rules** (or Bulk Redirects):

- From: `www.justrunit.io/*`
- To: `https://justrunit.io/${1}`
- Status: 301

### Wrangler CLI

```bash
cd website
npx wrangler pages deploy . --project-name=justrunit
```

Then attach `justrunit.io` in the dashboard under that project’s **Custom domains**.

## Site assets

- Canonical / Open Graph URLs point at `https://justrunit.io/`
- `robots.txt` and `sitemap.xml` reference the production domain
- Email: **justrunit.io@gmail.com**
- Phone: **318-232-2280** — leave a message; we will call back to discuss needs

## Public downloads

| File | Purpose |
|------|---------|
| `downloads/JustRunIt-Security-Overview.pdf` | One-page security brief (public) |
| `downloads/JustRunIt-Deployment-Architecture.pdf` | One-page architecture (API-only agents) |
| `downloads/JustRunIt-User-Guide.pdf` | UI / capabilities walkthrough |
| `downloads/JustRunIt-Product-Overview.pdf` | Offering summary |
| `downloads/JustRunIt-Capabilities-By-Role.pdf` | User / admin / sysop lists |
| `downloads/JustRunIt-Agents-Guide.pdf` | Agent name, hostname, federation |
| `assets/video/justrunit-product-demo.mp4` | ~2 min product demo (sales / website) |

### Re-record product demo

With the control plane running on `localhost:8080`:

```bash
# Playwright from a directory that has node_modules/playwright
cd /tmp && JRI_VIDEO_OUT=/path/to/website/assets/video \
  node /path/to/website/scripts/record-product-demo.mjs
# Full ffmpeg recommended for MP4 (libx264). Set FFMPEG=/path/to/ffmpeg if needed.
```

Do **not** add internal gap analyses, security scan dumps, or roadmaps — see `PUBLIC-DOWNLOADS.md`.
