# Deployment

Railway is the host this project is set up for. No service was created from this environment because the Railway CLI is not authenticated here.

## 1. Repository

Create a GitHub repository named `socals-new-homes` under the account that owns the project. This environment can read GitHub as `aaroncervantes` and cannot create or push repositories (`gh` is not logged in).

```bash
git remote add origin git@github.com:aaroncervantes/socals-new-homes.git
git push -u origin main
git push -u origin cursor/socal-lead-funnel-5308
```

Use the branch you intend to deploy. The app builds with `npm run build` and starts with `npm start`, which listens on `0.0.0.0` and `$PORT`.

## 2. Railway

1. Install the CLI and run `railway login` (this needs the owner).
2. From this directory, `railway init` and create a project.
3. Add the PostgreSQL plugin. Railway injects `DATABASE_URL`.
4. Set the variables in `.env.example`. At minimum for a durable, notifying production deploy:
   - `DATABASE_URL` (from the plugin)
   - `LEAD_NOTIFICATION_EMAIL`
   - `EMAIL_API_KEY` (Resend)
   - `EMAIL_FROM` (a sender verified in Resend)
   - `NEXT_PUBLIC_SITE_URL` (the public https origin, no trailing slash)
5. `NEXT_PUBLIC_*` values are read at build time. Set them before the deploy, then redeploy if you change them.
6. Connect the GitHub repo for automatic deploys, or run `railway up`.
7. Confirm `GET /api/health` returns `"ok": true` and `"durable": true`. `durable` is true only for Postgres. SQLite on Railway’s disk is wiped on redeploy, so do not use it in production.
8. Submit the form once on the live URL. Confirm the row in Postgres. Confirm the email arrived. If email variables are missing, the row is still saved and `email_status` is `skipped`.

`railway.toml` uses Nixpacks, `npm start`, and `/api/health`.

## 3. Domain

`socalsnewhomes.com` was not purchased.

Checked on 20 November 2026, without a charge:

- Verisign RDAP returned HTTP 404 for `socalsnewhomes.com`.
- Google DNS returned NXDOMAIN (status 3) for both A and NS.

That means the name was not in the .com registry at the time of the check. Availability can change. Check again in the registrar immediately before paying.

Recommended registrar: Cloudflare Registrar, which bills at the wholesale rate. Porkbun or the owner’s existing registrar is also fine. Do not buy the name until the owner approves the charge.

After the name is registered (not before):

1. In Railway, open the service → Networking → Custom Domain. Add `socalsnewhomes.com` and `www.socalsnewhomes.com`. Railway shows the records to create.
2. At the DNS host:
   - `www` as a CNAME to the Railway hostname.
   - The apex as an ALIAS, ANAME, or flattened CNAME to that same hostname. Cloudflare can put a CNAME on the apex. Leave the proxy off (DNS only) until the certificate is issued.
3. Railway requests a Let’s Encrypt certificate and serves HTTPS. Use one canonical host. Prefer `https://socalsnewhomes.com`, and redirect `www` to the apex in Railway.
4. Set `NEXT_PUBLIC_SITE_URL=https://socalsnewhomes.com` and redeploy so the canonical tag, Open Graph URL, and sitemap match the live host.
5. Open both hosts and confirm they resolve, the certificate is valid, and HTTP redirects to HTTPS.

Nothing in this file creates a bill.
