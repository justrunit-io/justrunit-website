# Deploy to Cloudflare Pages (no local OAuth callback)

Browser `wrangler login` uses `http://localhost:8976` and often fails on WSL.  
**Do not use it.** Use an **API token** or **GitHub integration** instead.

## Option A — API token + CLI (what we use from this machine)

1. Open https://dash.cloudflare.com/profile/api-tokens  
2. **Create Token** → template **Edit Cloudflare Workers** (Pages included)  
3. Create and copy the token  

Save on this machine (do not put the token in chat or git):

```bash
mkdir -p ~/.config/cloudflare
umask 077
printf '%s' 'PASTE_TOKEN_HERE' > ~/.config/cloudflare/api_token
```

Deploy:

```bash
cd /mnt/c/Users/rober/develop/automation-platform/website
chmod +x scripts/deploy-pages.sh
./scripts/deploy-pages.sh
```

This uploads the static files in this directory to project **`justrunit`**.

Attach domain:

```bash
export CLOUDFLARE_API_TOKEN="$(cat ~/.config/cloudflare/api_token)"
npx wrangler pages domain add justrunit.io --project-name=justrunit
```

(Or Custom domains in the Cloudflare dashboard.)

## Option B — GitHub only (zero local Cloudflare login)

Repo already public: https://github.com/justrunit-io/justrunit-website

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Pages**  
2. **Connect to Git** → GitHub → **justrunit-io/justrunit-website**  
3. Build settings:
   - Build command: *(empty)*  
   - Build output directory: `/`  
4. Save and deploy  
5. **Custom domains** → `justrunit.io`

Every push to `main` redeploys automatically.

## What is *not* required

- `wrangler login`  
- Localhost OAuth callbacks  
- Running a browser on the WSL host  
