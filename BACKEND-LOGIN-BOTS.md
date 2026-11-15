# MM2 Vault – Backend / Login / Bot roadmap

This repository currently hosts a **static GitHub Pages frontend**. It does not authenticate users, inspect game inventory, connect Roblox game clients, or execute trades.

## Authentication (planned)
- Implement Roblox sign-in only through the official OAuth 2.0 / OpenID Connect flow on a separately hosted HTTPS backend.
- Validate issuer, audience, state, nonce, redirect URI and ID-token signature server-side.
- Store only the Roblox user ID and minimum profile data needed. Use secure, HttpOnly, SameSite cookies; CSRF protection, rate limits, session rotation and logout.
- Keep client secrets and signing keys in the hosting provider's secret manager / environment variables. **Never commit secrets.**
- Never ask users for Roblox passwords, .ROBLOSECURITY cookies, session tokens or 2FA codes. Do not build cookie-based login.
- Frontend's “Roblox verbinden” dialog is a nonfunctional, honest placeholder until backend endpoints exist.

## Inventory verification
- A user ID/profile is **not** proof of MM2 item ownership.
- Only connect a legitimate, documented and permitted inventory source or game integration. If none is available, display “not verified” and do not allow verified trade listings.
- Server must own the inventory state; never trust localStorage, browser requests or user-submitted item names.
- Verify freshness, quantities and ownership server-side before a listing or transaction. Log changes and handle stale data safely.

## Bot / custody / trade flow
A bot joining a live Roblox server, taking custody of items and trading them is a separate game automation and custody system—not a GitHub Pages feature. Before building it, confirm Roblox and MM2 rules permit the automation and the custody model. Do not promise escrow or safe custody without a real audited system, clear recovery/refund rules, and operator controls.
- Do not collect Roblox credentials or automate account login with browser cookies.
- Do not label a simulated bot as online or verified.
- Manual Roblox trades must be confirmed by users inside the official game UI unless a documented, permitted integration says otherwise.

## Suggested deployment split
- Frontend: GitHub Pages (this repo).
- Backend: separate Node/TypeScript service or trusted managed backend, HTTPS domain, database, secret manager and monitoring.
- Frontend API base URL should be public configuration only; secrets must never ship to browser JavaScript.
- Add endpoints only after the inventory source and supported bot design are settled.
