# Deploying CollabU

A checklist, in order. Plan on about 45 minutes the first time. Nothing here costs money on the free plans, but read the limits at the bottom before a demo.

Where things run:

| Piece | Service | Why |
|---|---|---|
| API | Render web service (free) | Runs Flask with gunicorn |
| Database | Render Postgres (free) | Created by `render.yaml` |
| Website | Vercel (free) | Serves the built React app |
| Uploaded files | Supabase Storage (free) | Render's disk is wiped on every deploy |
| Email | Resend (free) | Invites, big project updates, daily digest |
| Daily digest | GitHub Actions (free) | Calls the API once a day |

## 0. Before you start

- [ ] The code is pushed to GitHub, and `backend/.env` and `frontend/.env` are **not** in the repo (`git status` should not list them; `.gitignore` covers them).
- [ ] Make a long random string for the digest, and keep it handy:
  ```bash
  python3 -c "import secrets; print(secrets.token_hex(32))"
  ```

## 1. Supabase Storage (files)

- [ ] Create a project at supabase.com.
- [ ] **Storage > New bucket**: name it `collabu-files`, leave it **private** (the API checks permissions before every download).
- [ ] **Project Settings > Storage > S3 Connection**: turn on S3 access. Copy the **Endpoint** (looks like `https://<ref>.supabase.co/storage/v1/s3`) and the **Region**.
- [ ] On the same page, **New access key**. Copy the **Access key ID** and **Secret access key** right away; the secret is shown once.

## 2. Resend (email)

- [ ] Create an account at resend.com.
- [ ] **Domains > Add domain** and add the DNS records it shows at your domain registrar. Until a domain is verified, Resend only lets you send to your own email address, which is fine for a first test.
- [ ] **API Keys > Create**, with "Sending access". Copy the key (starts with `re_`).
- [ ] Decide the sender, for example `CollabU <hello@yourdomain.com>` (must be on the verified domain).

## 3. Render (API and database)

- [ ] On render.com: **New > Blueprint**, pick your GitHub repo. It reads `render.yaml` and creates `collabu-api` and `collabu-db`. `SECRET_KEY` and `JWT_SECRET_KEY` are generated for you.
- [ ] It asks for the values marked `sync: false`. Fill them in:

| Variable | Value |
|---|---|
| `FRONTEND_URL` | Your Vercel address, for example `https://collabu.vercel.app` (no slash at the end). If you do not know it yet, put `https://example.com` and fix it in step 5. |
| `RESEND_API_KEY` | From step 2 |
| `EMAIL_FROM` | From step 2 |
| `S3_ENDPOINT_URL` | From step 1 |
| `S3_REGION` | From step 1 |
| `S3_BUCKET` | `collabu-files` |
| `S3_ACCESS_KEY_ID` | From step 1 |
| `S3_SECRET_ACCESS_KEY` | From step 1 |
| `DIGEST_TOKEN` | The random string from step 0 |

- [ ] Wait for the first deploy. The build runs `flask db upgrade`, so the database tables are created (and updated on every later deploy). If a migration fails, the deploy fails and the previous version keeps running.
- [ ] Open `https://collabu-api.onrender.com/api/health` (your service name may differ). You should see `{"status": "ok"}`.
- [ ] If the deploy log says `Missing required environment variables`, it lists exactly which ones.

## 4. Vercel (website)

- [ ] On vercel.com: **Add New > Project**, import the repo.
- [ ] **Root Directory**: `frontend`. Framework: Vite (detected).
- [ ] Environment variable: `VITE_API_URL` = `https://collabu-api.onrender.com/api` (your Render address plus `/api`).
- [ ] Deploy and copy the address Vercel gives you.

`frontend/vercel.json` sends every path to the app (so refreshing `/projects/3` works) and adds security headers. Its Content-Security-Policy allows calls to `*.onrender.com`; if you later move the API to your own domain, add that domain to `connect-src` there.

## 5. Connect the two

- [ ] On Render, set `FRONTEND_URL` to the exact Vercel address and save (Render redeploys). In production the API only accepts requests from this one address (CORS), so a typo here shows up as "Network Error" on login.
- [ ] If you add a custom domain on Vercel later, update `FRONTEND_URL` again.

## 6. GitHub Actions (daily digest)

- [ ] In the GitHub repo: **Settings > Secrets and variables > Actions > New repository secret**, twice:
  - `COLLABU_API_URL` = `https://collabu-api.onrender.com/api`
  - `DIGEST_TOKEN` = the same random string as on Render
- [ ] **Actions > Daily digest > Run workflow** once to check it. It runs by itself every day at 12:00 UTC (change the `cron` line in `.github/workflows/daily-digest.yml` to move it).

## 7. Smoke test

- [ ] Register a new account on the Vercel site.
- [ ] Create a project, add a task, drag it across the board.
- [ ] Upload a small PDF on the Files tab, then download it (this proves Supabase works).
- [ ] Invite your own second email address; the invite email should arrive (this proves Resend works).
- [ ] Log in wrong 11 times in a minute: the 11th try says "Too many tries".

## Good to know

- **Free Render sleeps** after about 15 minutes without traffic. The first request after that takes up to a minute. Open `/api/health` a minute before a demo.
- **Free Render Postgres expires** after a limited time (30 days when this was written) unless you upgrade. Check Render's current limits, and export your data before it expires if you care about it.
- **Supabase free projects pause** after a week with no activity. Restore them from the Supabase dashboard.
- **Login tokens** are kept in the browser's localStorage, not cookies, because the website and API are on different domains and many browsers block cross-site cookies. The trade-off: a script injected into the page could read them. The strict Content-Security-Policy on Vercel makes that much harder. Access tokens last 15 minutes and are refreshed quietly; refresh tokens last 30 days, then you log in again. Logging out clears them from the browser (it does not cancel a stolen token on the server).
- **Rate limits** (10 logins and 5 sign-ups per minute per address) are counted in memory, which is exact because the API runs as one process with 8 threads. If you ever raise `--workers` in `render.yaml`, add Redis and set `RATELIMIT_STORAGE_URI`.
- **Secrets** live only in Render, Vercel and GitHub settings. Nothing secret is in the code. `VITE_` variables end up in the public website, so never put a secret in one.
- **Changing the database**: change a model, run `cd backend && venv/bin/flask db migrate -m "what changed"`, check the new file in `backend/migrations/versions`, commit it. Render applies it on the next deploy.
