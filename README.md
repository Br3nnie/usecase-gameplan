# Use Case Gameplan

Standalone build of the AI Use Case Validator with a new **Gameplan** step. Same 3 kill-switch gates and 8 weighted scoring dimensions as the original `usecase_validator`, plus: after the score, one dedicated Claude call turns the user's three weakest dimensions into a sequenced, numbered action plan — each step optionally mapped to the relevant stage in Corbelle's 6-stage AI product suite (Readiness Diagnostic, Use Case ID & Prioritisation, AI Audit, Tool & Solution Match, Governance & Policy, Rollout & Adoption).

This is a paid standalone tool. Stripe Checkout grants access immediately after a verified £7 payment, stores the entitlement in Redis, signs the buyer into the app, and sends a one-time backup access link through Resend.

## What's different from usecase_validator

- New `/gameplan` step after Results, with its own loading state and a dedicated `/api/gameplan` Claude call (not bundled into a single results call).
- Each gameplan step carries a `mapsTo` field naming a Corbelle stage tool where one genuinely applies — the model is told not to force a mapping if the step is really just a decision or conversation.
- Print / Save as PDF button on the Gameplan step.
- No email capture, no Loops. The AI Insight box (topRisk/firstAction/timeframe) from the original tool is gone — the Gameplan step supersedes it.

## Deploy to Vercel

### 1. Push to GitHub
```bash
cd usecase-gameplan
git init
git add .
git commit -m "Initial commit"
gh repo create usecase-gameplan --public --push
```
(No `gh` CLI? Create the repo on github.com first, then `git remote add origin <url> && git push -u origin main`.)

### 2. Deploy on Vercel
- vercel.com → Add New Project → Import `usecase-gameplan`
- Framework preset: Vite (auto-detected via `vercel.json`)

### 3. Add environment variables
- Vercel dashboard → project → Settings → Environment Variables
- `ANTHROPIC_API_KEY`
- `APP_URL` (for example `https://usecase-gameplan.vercel.app`)
- `SALES_URL` (for example `https://corbelle.ai/usecasegameplan`)
- `SESSION_SECRET` (a long random value)
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_GAMEPLAN` (the Stripe Price ID for the £7 one-time product)
- `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY` and `MAIL_FROM`
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (the Vercel KV aliases are also supported)
- Redeploy (Settings → Deployments → Redeploy)

### 4. Add the Stripe webhook

Create a Stripe webhook endpoint for `https://usecase-gameplan.vercel.app/api/webhooks/stripe` and subscribe to `checkout.session.completed` and `checkout.session.async_payment_succeeded`. Copy its signing secret into `STRIPE_WEBHOOK_SECRET`.

Live at `your-project.vercel.app`.

## Local dev
```bash
npm install
vercel dev
```
`vercel dev` is needed (not plain `vite`) so the `/api/gameplan` serverless function runs locally. Add `ANTHROPIC_API_KEY` to a `.env.local` file first.

## Notes

- `api/gameplan.js` hardcodes the 6 stage tool names/descriptions to keep the model from inventing product names. If the AI Product Suite's stage lineup changes, update `STAGE_TOOLS` in that file to match `AI-Product-Suite-User-Guide-DRAFT.md`.
- Stage names in the gameplan output are currently text-only — none of the 6 stage tools have public URLs yet, so "Maps to: X" isn't clickable. Add links once those tools are deployed.
