# PRTR modules: architecture and delivery plan

Status: planning. Last updated 2026-10-30. Nothing in this document is implemented yet unless it says "already".

## 1. Modules

| # | Module | Purpose | Built with | Welsh |
|---|--------|---------|-----------|-------|
| 1 | Login | Email page, then OTP page. Shared by modules 2, 3 and 4 | Custom code | Follows the module it is placed in |
| 2 | PRTR address book | Collects contact details of the facilities/operators who will submit PRTR data | Mostly Defra forms | No |
| 3 | Operator pollutant and waste reporting | Collects pollutant data from operators. Operator records come from module 2 | Mostly Defra forms | **Yes (only module with Welsh)** |
| 4 | National regulator data upload | National regulators upload pollutant data as files | Mostly custom/file upload | No |

Module 1 is placed inside modules 2, 3 and 4. Each placement authenticates against its own backend collection and returns the user to that module's pages.

### Repositories

| Repo | Role |
|------|------|
| `aqie-prtr-submissions-frontend` | Hapi + Nunjucks frontend: login module, language handling, Defra forms hosting |
| `aqie-prtr-submissions-backend` | Hapi API + MongoDB: OTP, user lookup, GOV.UK Notify |

GOV.UK Notify is called directly from the backend (decision made; `aqie-notify-service` is not used for this flow).

## 2. Key decisions

1. **The module is identified by the first segment of the URL.** One registry maps URL prefixes to modules. Everything module-specific (language, content, collection, redirect target) is looked up from that registry.
2. **The login module is registered once per module** with a route prefix, for example `/<module>/sign-in` and `/<module>/sign-in/otp`. The module then comes from the URL and does not depend on a query parameter.
3. **Authentication is per module.** Signing in to one module does not sign you in to another. Admin and public users never share an authentication state.
4. **Language support is a per-module setting, not a global one.** Only module 3 supports Welsh. Modules 1 (when placed inside 2 or 4), 2 and 4 are English-only, with no toggle.
5. **The backend owns users, OTPs and Notify.** The frontend only calls the backend and stores "authenticated for module X" in the session.
6. **English code is `en-GB`** and Welsh is `cy`, matching the Defra forms engine. The query parameter and session key are both `language`.

## 3. Module registry (single source of truth)

One config object in the frontend, one in the backend. URL prefixes are confirmed. Collection names are not decided yet and are placeholders.

```js
// frontend: src/config/modules.js (sketch)
export const modules = {
  'address-book': {
    prefixes: ['address-book'],
    languages: ['en-GB'],
    startPath: '/address-book/about-you'
  },
  'pollutant-data-collection': {
    prefixes: ['pollutant-data-collection'],
    languages: ['en-GB', 'cy'],
    startPath: '/pollutant-data-collection/facilities'
  },
  nrdu: {
    prefixes: ['nrdu'],
    languages: ['en-GB'],
    startPath: '/nrdu/upload-pollutant-release-data'
  }
}
```

```js
// backend: src/config (sketch)
auth: {
  modules: {
    'address-book':              { collection: '<tbd>', otpTemplateId: '<shared id>' },
    'pollutant-data-collection': { collection: '<tbd>', otpTemplateId: '<shared id>' },
    nrdu:                        { collection: '<tbd>', otpTemplateId: '<shared id>' }
  }
}
```

- The Welsh switch is `languages: ['en-GB', 'cy']` on the module. It can also be driven by an environment variable (for example `WELSH_MODULES=pollutant-data-collection`) so Welsh can be turned on or off per environment without a code change.
- Backend collection names are not decided. They will be defined later and can change without touching the code that uses them, because they live only in this registry.

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
| `/nrdu/upload-pollutant-release-data` | Module 4 landing page after login (requires login) |
| `/nrdu/sign-in` | Module 4 email page |
| `/nrdu/sign-in/otp` | Module 4 OTP page |
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

1. User opens a protected page in a module and is not authenticated, so they are redirected to `/<module>/sign-in`.
2. User submits an email. The frontend calls the backend: `POST /<module>/auth/otp/send { email }`.
3. The backend checks the email exists in that module's collection.
   - If it exists: create a 6-digit code, store only a hash, email the code with GOV.UK Notify.
   - If it does not exist: **do nothing but return the same response** (see decision D1).
4. The frontend redirects to `/<module>/sign-in/otp`.
5. User enters the code. The frontend calls `POST /<module>/auth/otp/verify { email, otp }`.
6. On `{ valid: true }` the frontend marks the session authenticated for that module only, then redirects to the module's landing page (or the page the user originally asked for, if it is on the same module).

### 4.4 Backend API

| Endpoint | Behaviour |
|----------|-----------|
| `POST /{module}/auth/otp/send` | Validate email. Check the module's user collection. If found: generate code, store hash, send email. Always respond 204. 429 inside the resend cooldown. 502 if Notify fails. |
| `POST /{module}/auth/otp/verify` | Validate the code. Return `{ valid: true|false }`. 429 after too many wrong attempts. A correct code is single-use. |

The module is the first path segment, the same rule as the frontend. The backend registers these routes once per module from its registry (route prefix per module), so an unknown module has no route and gets a 404 without any extra validation. This also leaves room for each module's data APIs under the same prefix (`/address-book/...`, `/pollutant-data-collection/...`, `/nrdu/...`).

### 4.5 Security requirements

- Codes are generated with `crypto.randomInt`, stored as an HMAC hash (secret from the environment, required in production), expire after 10 minutes, are single-use, and are locked after 5 wrong attempts. Attempts are counted atomically.
- OTP records are keyed by **module + email**, so a code for one module can never verify for another.
- Resend cooldown (60 seconds) and additional per-IP rate limiting before production.
- Never log the code or the full email address.
- After a successful login, regenerate the session so the old session id cannot be reused.
- Do not allow the post-login redirect to leave the module (`returnUrl` must be a relative path inside the same module prefix).

### 4.6 Landing pages after login

After a successful login the user is sent to the module's landing page. For now these pages are blank (heading and caption only). They are already built as placeholders in the frontend.

| Module | Landing URL | Page title | Page caption |
|--------|-------------|-----------|--------------|
| 2 PRTR address book | `/address-book/about-you` | About you | PRTR address book |
| 3 Operator pollutant and waste reporting | `/pollutant-data-collection/facilities` | Facilities | Operator pollutant and waste reporting |
| 4 National regulator data upload | `/nrdu/upload-pollutant-release-data` | Upload pollutant release data | National regulator data upload |

- Each page lives in `src/server/routes/<module>/<page>/` with its own `content.js`, so the text is `t('address-book.about-you.title')` and so on.
- Only module 3's page has an empty `cy: {}` block ready for Welsh. Modules 2 and 4 have no Welsh block at all.
- The module registry's `startPath` is the landing URL, and it is the default target when a `returnUrl` is missing or not allowed.
- The pages do not check login yet, because the module-aware login is not built. Adding the "must be signed in to this module" check is part of Phase 2.
- The bare module prefix (`/address-book`, `/pollutant-data-collection`, `/nrdu`) is built: signed out it redirects to `/<module>/sign-in`, signed in it redirects to the landing page.

### 4.7 Implementation status

Built (Defra forms deliberately left out for now):

- Backend: `POST /{module}/auth/otp/send` and `/verify` for each module in `src/common/auth-modules.js`. Each module has its own user collection (placeholder names), unknown emails get the same answer as known ones, OTP records are keyed by module and email, and the code hash includes the module. GOV.UK Notify is called directly with one shared template.
- Frontend: module registry (`src/config/modules.js`), sign-in pages registered once per module by looping the registry, module text from `routes/login/*/content.js` (`default` plus per-module overrides through `loginText`), per-module session state, a new session on sign-in, a `module-auth` guard (`options.app = { module, requiresAuth: true }`), redirect to each module's landing page after sign-in, and a module-aware language plugin.
- Landing pages for the three modules (4.6), behind the guard.

Not built yet:

- `returnUrl` (users always go to the landing page).
- A `WELSH_MODULES` environment variable (Welsh is set per module in `modules.js` for now).
- Translator review of the Welsh text, and Welsh for any future pages in module 3.
- Real user collection names (placeholders in the backend).
- Rate limiting per IP, sign-out, and the Defra forms.

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

## 7. Module 4 (national regulator upload)

- English only, custom pages, file upload.
- Uses the login module under `/nrdu/...`, against the regulators' users collection (name to be defined).
- File handling (size, type, virus scan, storage, validation) is out of scope for this plan and needs its own design.

## 8. Delivery phases

### Phase 1: Foundations (done)
- [x] Module registry (frontend config and backend config), with the module lookup helper.
- [x] Backend: `POST /{module}/auth/otp/send` and `verify`, with per-module user collections and OTP records keyed by module and email.
- [x] Backend tests for each module (unknown email, wrong module, expiry, attempts, cooldown).

### Phase 2: Login module in the frontend (done, except `returnUrl`)
- [x] Sign-in routes for each module (`/address-book`, `/pollutant-data-collection`, `/nrdu`), as in the URL table in 4.1.
- [x] Module-aware content (`default` plus per-module overrides) with the `loginText` helper.
- [x] Per-module session auth state, session regeneration, redirect to the landing page after login.
- [ ] Safe `returnUrl` back to the page the user first asked for.
- [x] Frontend tests: each module's sign-in, wrong module redirect, redirect after login.

### Phase 3: Language per module (done, except Welsh text)
- [x] Module-aware language plugin and context (`languageOptions` per request).
- [x] Welsh switch per module through the registry, with tests for a Welsh module, an English-only module, and shared pages. (A `WELSH_MODULES` environment variable is not added yet.)
- [x] Welsh text for the login pages, the facilities landing page, the sign-out button and the error summary title (module 3).
- [ ] Translator sign-off on the Welsh text (it was written for development and is not reviewed).

### Phase 4: Modules 2, 3 and 4 (not started; Defra forms deferred)
- [x] Landing pages for each module, behind the module login (blank placeholders).
- [ ] Module 2 (address book) as Defra forms behind module 2 login.
- [ ] Module 3 (operator reporting) as Defra forms behind module 3 login, with Welsh.
- [ ] Module 4 (regulator upload) behind module 4 login.
- [ ] Forms engine language hook (section 5.2, step 4).

### Phase 5: Hardening and deployment
- [ ] Rate limiting, production secrets (`NOTIFY` key, template IDs, `OTP_HASH_SECRET`), CDP proxy for Notify calls, separate Notify keys per environment.
- [ ] Accessibility review of the sign-in pages (error summary, focus, `lang` attributes).
- [ ] Monitoring and logging review (no PII in logs).

## 9. Decisions

| ID | Question | Status |
|----|----------|--------|
| D1 | For an email that is not in the collection: show "not recognised", or respond exactly as for a valid email? | Open. Suggested: respond the same way, to avoid revealing who has an account, and rely on the "my email is not recognised" help text |
| D2 | Language for shared pages (cookies, errors)? | Open. Suggested: English only |
| D3 | URL prefixes | **Decided:** module 2 `address-book`, module 3 `pollutant-data-collection`, module 4 `nrdu` |
| D4 | Real collection names and fields for each module's users | Open. Not defined yet. Placeholders in the registry, to be defined later |
| D5 | Shared login between modules? | **Decided:** no. Users must sign in separately for each module |
| D6 | Notify templates | **Decided:** one shared OTP template for all modules |
| D7 | Backend URL shape | **Decided:** `/{module}/auth/otp/send` and `/{module}/auth/otp/verify` (module first, same as the frontend) |
| D8 | Frontend URL shape | **Decided:** `/{module}/sign-in` and `/{module}/sign-in/otp` (module first, page second). See 4.1 |

## 10. Risks

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | Defra forms use their own slug as the first URL segment, so one module may span several prefixes | List all prefixes per module in the registry (as sketched), or check whether the forms engine can be mounted under one route prefix |
| R2 | The forms engine's `getLanguage(query, yar)` has no request, so it cannot see the module | Use the effective-language session key described in 5.2 |
| R3 | Welsh text missing on some Welsh-module pages shows English under `<html lang="cy">` | Translate every page of the module before enabling, add a test that fails when a page has no Welsh strings |
| R4 | Authentication state leaking between modules | Per-module session keys, tests that module A login does not open module B |
| R5 | OTP abuse (email flooding, guessing) | Cooldown, attempt limit, per-IP limit, uniform responses |
| R6 | A Defra form is served at `/{slug}/{path}`, so a form page called `sign-in` or `sign-out` would clash with the login pages when the slug equals the module prefix | Reserve those two page names, and add a test that fails if a form definition uses them |

## 11. Test plan summary

- Backend: per-module OTP send/verify, collection isolation, expiry, attempts, cooldown, Notify failure.
- Frontend: sign-in journey for each module, error pages under each module, safe redirect, per-module auth, language policy per module (toggle shown or hidden, `lang` attribute, session preference).
- Forms: unauthenticated request redirects to the right module's login, Welsh renders only in module 3.
