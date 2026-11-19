# PRTR modules: architecture and delivery plan

Status: planning. Last updated 2026-11-13. Nothing in this document is implemented yet unless it says "already". Diagrams of the sign-in flows are in `architecture.md`, sections 2, 6.2 and 6.3.

## 1. Modules

| # | Module | Purpose | Built with | Welsh |
|---|--------|---------|-----------|-------|
| 1 | Login | Email page, then OTP page. Shared by modules 2 and 3 | Custom code | Follows the module it is placed in |
| 2 | PRTR address book | Collects contact details of the facilities/operators who will submit PRTR data | Mostly Defra forms | No |
| 3 | Operator pollutant and waste reporting | Collects pollutant data from operators. Operator records come from module 2 | Mostly Defra forms | **Yes (only module with Welsh)** |

Module 1 is placed inside modules 2 and 3. Each placement signs users in through **that module's own backend** and returns the user to that module's pages.

### Services

There is **one frontend** and **two backend services**. The frontend serves both modules.

| Service | Role |
|------|------|
| `aqie-prtr-submissions-frontend` | Hapi + Nunjucks frontend for **both** modules: login module, language handling, Defra forms hosting |
| `aqie-prtr-submissions-backend` | Hapi API + MongoDB for the **data collection** module: OTP, facilities, GOV.UK Notify. Calls ADD BE to verify emails |
| Address book backend (**ADD BE**) | Separate service, not in these repositories. Holds the address book. Signs in users of the **address book** module directly, and answers email checks from the submissions backend |

GOV.UK Notify is called directly by each backend that sends codes (decision made; `aqie-notify-service` is not used for this flow).

## 2. Key decisions

1. **The module is identified by the first segment of the URL.** One registry maps URL prefixes to modules. Everything module-specific (language, content, collection, redirect target) is looked up from that registry.
2. **The login module is registered once per module** with a route prefix, for example `/<module>/sign-in` and `/<module>/sign-in/otp`. The module then comes from the URL and does not depend on a query parameter.
3. **Authentication is per module.** Signing in to one module does not sign you in to another. Admin and public users never share an authentication state.
4. **Language support is a per-module setting, not a global one.** Only module 3 supports Welsh. Modules 1 (when placed inside module 2) and 2 are English-only, with no toggle.
5. **The backend that signs a user in owns the OTP and Notify.** For the address book module that is ADD BE. For the data collection module it is the submissions backend, which first checks the email with ADD BE. The frontend only calls the right backend and stores "authenticated for module X" in the session.
6. **English code is `en-GB`** and Welsh is `cy`, matching the Defra forms engine. The query parameter and session key are both `language`.
7. **Which backend a module uses is set in the module registry**, so the same login pages work for both.

## 3. Module registry (single source of truth)

One config object in the frontend, and one in the submissions backend for the modules it signs in. URL prefixes are confirmed.

```js
// frontend: src/config/modules.js (sketch)
export const modules = {
  'address-book': {
    prefixes: ['address-book'],
    languages: ['en-GB'],
    startPath: '/address-book/about-you',
    authBackend: 'address-book-backend'     // frontend calls ADD BE directly
  },
  'pollutant-data-collection': {
    prefixes: ['pollutant-data-collection'],
    languages: ['en-GB', 'cy'],
    startPath: '/pollutant-data-collection/facilities',
    authBackend: 'submissions-backend'      // submissions backend calls ADD BE
  }
}
```

```js
// submissions backend: src/config (sketch). Only modules this backend signs in.
auth: {
  modules: {
    'pollutant-data-collection': { otpTemplateId: '<id>' }
  }
}
```

- The Welsh switch is `languages: ['en-GB', 'cy']` on the module. It can also be driven by an environment variable (for example `WELSH_MODULES=pollutant-data-collection`) so Welsh can be turned on or off per environment without a code change.
- The frontend needs one base URL per backend (submissions backend and ADD BE), read from the environment.
- There are no per-module user collections in the submissions backend any more: users come from ADD BE.

## 4. Login module

### 4.1 Pages and routes

| Route (per module prefix) | Page |
|---------------------------|------|
| `GET/POST /<module>/sign-in` | Email page |
| `GET/POST /<module>/sign-in/otp` | OTP verification page |

#### Frontend URL structure

The module is always the **first** path segment, then the page. The login pages sit inside each module, not on a shared root path.

| URL | What it is |
|-----|-----------|
| `/address-book/about-you` | Module 2 landing page after login (requires login) |
| `/address-book/sign-in` | Module 2 email page |
| `/address-book/sign-in/otp` | Module 2 OTP page |
| `/pollutant-data-collection/facilities` | Module 3 landing page after login (requires login) |
| `/pollutant-data-collection/sign-in` | Module 3 email page |
| `/pollutant-data-collection/sign-in/otp` | Module 3 OTP page |
| `/<module>/<form or page>/...` | Module pages and Defra forms, behind login |
| `/cookies`, `/health`, `/public/...` | Shared pages and assets, outside any module |

Why `/{module}/sign-in` and not `/sign-in/{module}`:

- One rule everywhere: the first segment identifies the module. The language policy (section 5), the session auth scope (section 4.3), the redirect target and the backend path (`/{module}/auth/...`) all use the same rule and the same registry.
- With `/sign-in/{module}` the first segment is `sign-in`, so the language policy and module lookup would need a special case.
- The redirect after login stays inside the module, and a module can be moved, switched off or given its own rules by prefix.
- It matches how Defra form slugs already work (`/{slug}/...`).

Rules:

- Module names are reserved URL prefixes. They must not collide with shared paths (`cookies`, `health`, `public`, and so on).
- `sign-in` and `sign-out` are reserved page names inside a module. No Defra form page may use those paths (see risk R6).
- The post-login `returnUrl` must be a relative path that starts with `/<module>/`. Anything else is ignored and the user goes to the module's landing page (see 4.6).
- Links the login pages create (the form actions, the "use a different email" link, the OTP page redirect) are built from the module name given when the plugin is registered. Nothing is written by hand for each module.
- The language switch keeps the current path and adds `?language=...`, so it works the same under every prefix.

- Input elements are identical in all modules (email field, code field, Continue button, "not recognised" and "code not arrived" help sections).
- Content that changes per module: page heading, intro text, hint text, help-section text, and the redirect after login.

**How the shared pages know their module.** The login plugin is registered once per module with a route prefix and the module name as a plugin option, for example `server.register({ plugin: login, options: { module: 'address-book' } }, { routes: { prefix: '/address-book' } })`. The same controllers and templates serve every module. They read the module name from that option, load the module's text, and build backend URLs from it. Nothing parses the URL to guess the module.

### 4.2 Module-specific content

Keep one content file for the login module with a shared default and optional per-module overrides, for example:

```js
// src/server/routes/login/content.js (sketch)
export const content = {
  'en-GB': {
    default: { heading: '...', intro: '...', hint: '...' },
    'pollutant-data-collection': { heading: '...' }   // overrides only what differs
  },
  cy: {
    'pollutant-data-collection': { heading: '...' }   // Welsh only exists for the Welsh module
  }
}
```

A small `tm(key)` helper looks up `<module>.<key>`, then `default.<key>`, then falls back to English, so a module only has to override the parts that differ.

### 4.3 Flow

The pages are the same for both modules. What differs is the backend behind them. Diagrams are in `architecture.md` (sections 6.2 and 6.3).

**Common start and end**

1. User opens a protected page in a module and is not authenticated, so they are redirected to `/<module>/sign-in`.
2. User submits an email. If it is empty or badly formed the page shows an error and nothing is sent to a backend.
3. After a correct code the frontend marks the session authenticated for that module only, then redirects to the module's landing page (or the page the user originally asked for, if it is on the same module).

**Address book module** (frontend calls ADD BE directly)

1. The frontend asks ADD BE to send a code for the email.
2. ADD BE checks the email against its address book. If it is not there, the page shows "Enter a valid email".
3. If it is there, ADD BE creates a 6-digit code, stores only a hash in its own `sign-in-one-time-codes`, and emails the code with GOV.UK Notify.
4. The frontend redirects to `/address-book/sign-in/otp`. The user enters the code and the frontend asks ADD BE to verify it.

**Data collection module** (frontend calls the submissions backend)

1. The frontend calls `POST /pollutant-data-collection/auth/otp/send { email }` on the submissions backend.
2. The submissions backend asks ADD BE to verify the email. If it is not recognised it answers 404 and the page shows "Enter a valid email".
3. If it is recognised, ADD BE answers with a true flag and the national IDs linked to the email. The submissions backend creates a 6-digit code, stores only a hash in its own `sign-in-one-time-codes`, emails the code with GOV.UK Notify, and answers with the national IDs (a normal success response). The frontend keeps them in the session. ADD BE is not called again.
4. The frontend redirects to `/pollutant-data-collection/sign-in/otp`. The user enters the code and the frontend calls `POST /pollutant-data-collection/auth/otp/verify { email, otp, nationalIds }`, with the national IDs from the session.
5. After a correct code the submissions backend looks those national IDs up in its `facilities` collection and returns the **facility name and national ID** of each match. The frontend keeps them in the session.

### 4.4 Backend APIs

**Submissions backend (data collection module)**

| Endpoint | Behaviour |
|----------|-----------|
| `POST /{module}/auth/otp/send` | Validate email. Ask ADD BE to verify it. If not recognised: 404. If recognised: generate code, store hash, send email, respond with `{ nationalIds }` (success). 502 if Notify fails. |
| `POST /{module}/auth/otp/verify` | Validate the code (`{ email, otp, nationalIds }`, at most 30 IDs). On success return `{ valid: true, facilities: [{ facilityName, nationalId }] }`, otherwise `{ valid: false }`. A correct code is single-use. ADD BE is not called. |

**ADD BE, called by the submissions backend**

Returns `{ verifiedEmail, isNationalRegulator, associatedNationalIds: [{ nationalId, name }] }` for an email. A user has **about 30 national IDs at most**. This is mocked in the submissions backend until ADD BE exists. `isNationalRegulator` is part of the agreed response but not used by either module yet.

**ADD BE, called by the frontend (address book module)**

Needs "request a code" and "verify a code". Paths, responses and service-to-service authentication are **not agreed yet**. Proposal: the same two operations as the submissions backend, so the one login module can talk to either.

The module is the first path segment on the frontend and on the submissions backend. The submissions backend registers these routes once per module it signs in, so an unknown module has no route and gets a 404 without any extra validation.

### 4.5 Security requirements

- Codes are generated with `crypto.randomInt`, stored as an HMAC hash (secret from the environment, required in production), expire after **15 minutes**, are single-use (marked with `usedAt`), and are locked after 5 wrong attempts. Attempts are counted atomically. This applies to each backend that creates codes (ADD BE and the submissions backend).
- Each module has its own backend, so a code for one module cannot verify for another. If several modules ever share one backend, records need a `module` field.
- Resend cooldown (60 seconds) and additional per-IP rate limiting before production.
- The acceptance criteria show an error for an unrecognised email, which reveals which emails are known. This needs rate limiting and is an open decision (D1).
- Calls from the submissions backend to ADD BE need authentication between the services (not agreed yet).
- Never log the code or the full email address.
- After a successful login, regenerate the session so the old session id cannot be reused.
- Do not allow the post-login redirect to leave the module (`returnUrl` must be a relative path inside the same module prefix).

### 4.6 Landing pages after login

After a successful login the user is sent to the module's landing page. At first these pages are blank (heading and caption only).

| Module | Landing URL | Page title | Page caption |
|--------|-------------|-----------|--------------|
| 2 PRTR address book | `/address-book/about-you` | About you | PRTR address book |
| 3 Operator pollutant and waste reporting | `/pollutant-data-collection/facilities` | Facilities | Operator pollutant and waste reporting |

- Each page lives in `src/server/routes/<module>/<page>/` with its own `content.js`, so the text is `t('address-book.about-you.title')` and so on.
- Only module 3's page has an empty `cy: {}` block ready for Welsh. Module 2 has no Welsh block at all.
- The module registry's `startPath` is the landing URL, and it is the default target when a `returnUrl` is missing or not allowed.
- The pages must check that the user is signed in to this module. This is part of Phase 2.
- The bare module prefix (`/address-book`, `/pollutant-data-collection`) redirects to `/<module>/sign-in` when signed out, and to the landing page when signed in.

### 4.7 Implementation status

Nothing described in section 4 is built yet. The starter Home and About pages have been removed. The next steps are in section 7.

## 5. Language support

### 5.1 Rules

- A request's language is decided by: the module's allowed languages, then the user's choice (`?language=` or the session), then `en-GB`.
- English-only modules ignore `?language=cy`, show no toggle, and render `<html lang="en-GB">`.
- The Welsh module shows the toggle only if Welsh strings exist, and every page there needs Welsh strings before release (otherwise English text appears under `<html lang="cy">`).

### 5.2 Implementation

1. `getModule(path)` returns the module for the first URL segment, or `undefined` for shared pages.
2. The language plugin runs on `onPreAuth` after `@hapi/yar` (already done), and now also looks up the module's allowed languages. It sets `request.app.language` and `request.app.languageOptions` (empty means no toggle).
3. The context passes `languageOptions` and `currentLanguage` to the layout, so the toggle is driven per request and not by a global flag.
4. For Defra forms: the forms engine calls `getLanguage(query, yar)` and gets no request. Store the **effective** language for each request in the session under `language` (what the engine reads) and the user's **preference** under a separate key (for example `languagePreference`). Each request recomputes `language` from the module policy plus the preference. Verify this against the forms engine version in use.
5. Keep the user's Welsh preference when they visit an English-only module, so it is still applied when they return to the Welsh one.

### 5.3 Shared pages (cookies, 404, errors)

Pages outside any module default to English-only (decision D2).

## 6. Defra forms modules (2 and 3)

- Forms are hosted by `@defra/forms-engine-plugin`, with an `onRequest` hook that sends unauthenticated users to the module's sign-in page. The hook must check authentication **for that module** and redirect to `/<module>/sign-in`.
- Form definitions for module 3 carry Welsh text in `metadata.translations.cy` (title, pages, components, list items), as in `aqie-prtr-frontend`. Module 2 definitions need no `cy` block.
- Custom form controllers (for example dynamic radios) must use the shared language value and the shared `translate()` helper. Do not add a second `en`/`cy` mechanism.
- A form's URL starts with its slug. If module 3 has several forms (for example `pollutant-data-collection` and `wastewater-transfers`), the first path segment is not one module name. See risk R1.

## 7. Delivery phases

### Phase 1: Submissions backend (data collection module)
- [ ] Module registry for the modules this backend signs in.
- [ ] ADD BE client (mocked) returning `verifiedEmail`, `isNationalRegulator` and `associatedNationalIds`.
- [ ] `POST /{module}/auth/otp/send` and `verify`, with the `sign-in-one-time-codes` collection and GOV.UK Notify.
- [ ] `facilities` collection with dummy records, and the lookup by national ID returning facility name and national ID.
- [ ] Backend tests (unknown email, expiry, attempts, reused code, facilities returned, Notify failure).

### Phase 2: Login module in the frontend
- [ ] Module registry with the auth backend per module, and one base URL per backend.
- [ ] Sign-in routes for each module (`/address-book`, `/pollutant-data-collection`), as in the URL table in 4.1.
- [ ] Module-aware content (`default` plus per-module overrides).
- [ ] Per-module session auth state (facilities kept for data collection), session regeneration, redirect to the landing page after login.
- [ ] Landing pages and the "signed in to this module" check.
- [ ] Safe `returnUrl` back to the page the user first asked for.
- [ ] Frontend tests: each module's sign-in, wrong module redirect, redirect after login.

### Phase 2b: Address book module against ADD BE (blocked on ADD BE)
- [ ] Agree the sign-in operations and service-to-service authentication with the address book team.
- [ ] Frontend calls ADD BE directly for the address book module.

### Phase 3: Language per module
- [ ] Module-aware language plugin and context (`languageOptions` per request).
- [ ] Welsh switch per module through the registry, with tests for a Welsh module, an English-only module, and shared pages.
- [ ] Welsh text for the login pages and the facilities landing page (module 3).
- [ ] Translator sign-off on the Welsh text.

### Phase 4: Modules 2 and 3 (not started; Defra forms deferred)
- [ ] Landing pages for each module, behind the module login (blank placeholders).
- [ ] Module 2 (address book) as Defra forms behind module 2 login.
- [ ] Module 3 (operator reporting) as Defra forms behind module 3 login, with Welsh.
- [ ] Forms engine language hook (section 5.2, step 4).

### Phase 5: Hardening and deployment
- [ ] Rate limiting, production secrets (`NOTIFY` key, template IDs, `OTP_HASH_SECRET`), CDP proxy for Notify calls, separate Notify keys per environment, authentication between the frontend, the submissions backend and ADD BE.
- [ ] Accessibility review of the sign-in pages (error summary, focus, `lang` attributes).
- [ ] Monitoring and logging review (no PII in logs).

## 8. Decisions

| ID | Question | Status |
|----|----------|--------|
| D1 | For an email that is not recognised: show "not recognised", or respond exactly as for a valid email? | **Acceptance criteria say show an error** ("Enter a valid email"). This reveals which emails are known, so it needs rate limiting. Needs product and security agreement |
| D2 | Language for shared pages (cookies, errors)? | Open. Suggested: English only |
| D3 | URL prefixes | **Decided:** module 2 `address-book`, module 3 `pollutant-data-collection` |
| D4 | Who holds the users? | **Decided:** ADD BE holds the address book. The submissions backend has no user collection and asks ADD BE |
| D5 | Shared login between modules? | **Decided:** no. Users must sign in separately for each module |
| D6 | Notify templates | Open. Each backend that sends codes uses Notify. Whether they share one template and key is not decided |
| D7 | Backend URL shape | **Decided** for the submissions backend: `/{module}/auth/otp/send` and `/{module}/auth/otp/verify` (module first, same as the frontend) |
| D8 | Frontend URL shape | **Decided:** `/{module}/sign-in` and `/{module}/sign-in/otp` (module first, page second). See 4.1 |
| D9 | Which backend signs each module in | **Decided:** address book module uses ADD BE directly. Data collection module uses the submissions backend, which calls ADD BE |
| D10 | ADD BE sign-in operations for the frontend | Open. Paths, responses and authentication not agreed. Proposal: same two operations as the submissions backend |
| D11 | National IDs at verify time | **Decided:** ADD BE is called once, when the code is requested. The frontend keeps the national IDs in the session and sends them with the verify call |
| D12 | Can one email belong to several modules? | Open. The agreed ADD BE response has no module information |
| D13 | How many national IDs per user? | **Decided:** about 30 at most. What ADD BE returns for a user above 30 is open |

## 9. Risks

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | Defra forms use their own slug as the first URL segment, so one module may span several prefixes | List all prefixes per module in the registry (as sketched), or check whether the forms engine can be mounted under one route prefix |
| R2 | The forms engine's `getLanguage(query, yar)` has no request, so it cannot see the module | Use the effective-language session key described in 5.2 |
| R3 | Welsh text missing on some Welsh-module pages shows English under `<html lang="cy">` | Translate every page of the module before enabling, add a test that fails when a page has no Welsh strings |
| R4 | Authentication state leaking between modules | Per-module session keys, tests that module A login does not open module B |
| R5 | OTP abuse (email flooding, guessing) | Cooldown, attempt limit, per-IP limit |
| R6 | A Defra form is served at `/{slug}/{path}`, so a form page called `sign-in` or `sign-out` would clash with the login pages when the slug equals the module prefix | Reserve those two page names, and add a test that fails if a form definition uses them |
| R7 | ADD BE does not exist yet, and data collection sign-in depends on it being up | Mock it behind one client in the submissions backend. Agree the interface early. Decide what users see if ADD BE is down |
| R8 | The address book module cannot be tested end to end until ADD BE exists | Agree the sign-in operations first, and use a local stand-in service until then |

## 10. Test plan summary

- Submissions backend: OTP send and verify, unrecognised email, expiry, attempts, reused code, facilities returned for a user, Notify failure. ADD BE and Notify are replaced by test doubles.
- Frontend: sign-in journey for each module against the right backend, error pages under each module, safe redirect, per-module auth, language policy per module (toggle shown or hidden, `lang` attribute, session preference).
- Forms: unauthenticated request redirects to the right module's login, Welsh renders only in module 3.