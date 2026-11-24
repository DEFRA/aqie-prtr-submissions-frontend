# PRTR modules: architecture and delivery plan

Status: planning. Last updated 2026-11-24. Nothing in this document is implemented yet unless it says "already". Authentication is deferred (section 4.3).

## 1. Modules

| # | Module | URL prefix (proposed) | Purpose | Built with | Welsh |
|---|--------|-----------------------|---------|-----------|-------|
| 1 | Operator data collection | `operator-data-collection` | Collects pollutant and waste data from operators | Mostly Defra forms | **Yes (only module with Welsh)** |
| 2 | National Regulator data collection | `national-regulator-data-collection` | Collects data from national regulators | Mostly Defra forms (to confirm) | No |

More modules will be added later. The URL prefixes, the "No" for Welsh in module 2, and the detailed scope of module 2 are assumptions to confirm.

There is no shared login module for now. Authentication (including a possible magic link) is still in discussion and is deferred, but `GET/POST /<module>/sign-in` stays in scope for the future (section 4.3).

### Services

There is **one frontend**. It serves both modules.

| Service | Role |
|------|------|
| `aqie-prtr-submissions-frontend` | Hapi + Nunjucks frontend for **both** modules: language handling, Defra forms hosting |

## 2. Key decisions

1. **The module is identified by the first segment of the URL.** One registry maps URL prefixes to modules. Everything module-specific (language, content, landing page) is looked up from that registry.
2. **Authentication is deferred.** The sign-in flow is still in discussion (a magic link for every user is being considered) and is not designed now. `GET/POST /<module>/sign-in` stays in scope for the future, with the module as the first path segment.
3. **Language support is a per-module setting, not a global one.** Only module 1 (Operator data collection) supports Welsh. Module 2 (National Regulator data collection) is English-only, with no toggle.
4. **English code is `en-GB`** and Welsh is `cy`, matching the Defra forms engine. The query parameter and session key are both `language`.

## 3. Module registry (single source of truth)

One config object in the frontend. URL prefixes are proposals to confirm.

```js
// frontend: src/config/modules.js (sketch)
export const modules = {
  'operator-data-collection': {
    prefixes: ['operator-data-collection'],
    languages: ['en-GB', 'cy'],
    startPath: '/operator-data-collection/facilities'
  },
  'national-regulator-data-collection': {
    prefixes: ['national-regulator-data-collection'],
    languages: ['en-GB']
    // landing page to be decided
  }
}
```

- The Welsh switch is `languages: ['en-GB', 'cy']` on the module. It can also be driven by an environment variable (for example `WELSH_MODULES=operator-data-collection`) so Welsh can be turned on or off per environment without a code change.
- When sign-in is decided, an authentication setting can be added to each entry without changing the URL shape.

## 4. Module URLs, landing pages and deferred sign-in

### 4.1 URL structure

The module is always the **first** path segment, then the page.

| URL | What it is |
|-----|-----------|
| `/operator-data-collection/facilities` | Module 1 landing page |
| `/national-regulator-data-collection/...` | Module 2 pages (landing page to be decided) |
| `GET/POST /<module>/sign-in` | **Future scope.** Not built now (section 4.3) |
| `/<module>/<form or page>/...` | Module pages and Defra forms |
| `/cookies`, `/health`, `/public/...` | Shared pages and assets, outside any module |

Why the module comes first (`/{module}/sign-in`, not `/sign-in/{module}`):

- One rule everywhere: the first segment identifies the module. The language policy (section 5), the future session auth scope and the landing page all use the same rule and the same registry.
- A module can be moved, switched off or given its own rules by prefix.
- It matches how Defra form slugs already work (`/{slug}/...`).

Rules:

- Module names are reserved URL prefixes. They must not collide with shared paths (`cookies`, `health`, `public`, and so on).
- `sign-in` and `sign-out` are reserved page names inside a module. No Defra form page may use those paths (see risk R6).
- The language switch keeps the current path and adds `?language=...`, so it works the same under every prefix.

### 4.2 Landing pages

At first these pages are blank (heading and caption only).

| Module | Landing URL | Page title | Page caption |
|--------|-------------|-----------|--------------|
| 1 Operator data collection | `/operator-data-collection/facilities` | Facilities | Operator data collection |
| 2 National Regulator data collection | To be decided | | National Regulator data collection |

- Each page lives in `src/server/routes/<module>/<page>/` with its own `content.js`, so the text is `t('operator-data-collection.facilities.title')` and so on.
- Only module 1's page has an empty `cy: {}` block ready for Welsh. Module 2 has no Welsh block at all.
- The module registry's `startPath` is the landing URL.
- The bare module prefix (for example `/operator-data-collection`) redirects to the landing page.

### 4.3 Sign-in (deferred)

The sign-in flow is **not designed or built now**. It is still being discussed. The option under discussion is a **magic link**: every user receives a link that gives them access to the services.

**Kept in scope for the future**

- `GET/POST /<module>/sign-in` for every module, with the module as the first path segment.
- `sign-in` and `sign-out` stay reserved page names inside a module.
- The module registry can later get an authentication setting per module.

**Open questions**

- How the magic link is created, how long it is valid, and whether it is single-use.
- Who sends the email (likely GOV.UK Notify) and from which service.
- Whether a link works for one module or for all of a user's modules.
- How a user is linked to facilities.
- What the session holds after sign-in and how long it lasts.
- Whether `GET/POST /<module>/sign-in` is still the right shape for a magic link.

**Likely requirements once designed** (from the earlier design, to be reviewed)

- The post-login redirect must stay inside the module (a relative path that starts with `/<module>/`).
- Regenerate the session after sign-in so the old session id cannot be reused.
- Never log a link, a token or a full email address.
- Rate limiting before production.

Until sign-in exists the module pages are **not protected**. This is for development only (risk R4).

### 4.4 Implementation status

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

## 6. Defra forms modules (1 and 2)

- Forms are hosted by `@defra/forms-engine-plugin`. Once sign-in exists, an `onRequest` hook can send unauthenticated users to the module's sign-in page. The hook must check authentication **for that module** and redirect to `/<module>/sign-in`. Until then there is no guard.
- Form definitions for module 1 carry Welsh text in `metadata.translations.cy` (title, pages, components, list items), as in `aqie-prtr-frontend`. Module 2 definitions need no `cy` block.
- Custom form controllers (for example dynamic radios) must use the shared language value and the shared `translate()` helper. Do not add a second `en`/`cy` mechanism.
- A form's URL starts with its slug. If module 1 has several forms (for example `operator-data-collection` and `wastewater-transfers`), the first path segment is not one module name. See risk R1.

## 7. Delivery phases

### Phase 1: Module structure
- [ ] Module registry in the frontend for the two modules.
- [ ] Landing page for each module (blank placeholders), and the bare module prefix redirect.
- [ ] Tests for each landing page.

### Phase 2: Language per module
- [ ] Module-aware language plugin and context (`languageOptions` per request).
- [ ] Welsh switch per module through the registry, with tests for the Welsh module, an English-only module, and shared pages.
- [ ] Welsh text for the Operator data collection landing page.
- [ ] Translator sign-off on the Welsh text.

### Phase 3: Modules 1 and 2 forms (Defra forms deferred)
- [ ] Module 1 (Operator data collection) as Defra forms, with Welsh.
- [ ] Module 2 (National Regulator data collection) as Defra forms.
- [ ] Forms engine language hook (section 5.2, step 4).

### Phase 4: Authentication (deferred)
- [ ] Decide the sign-in flow (magic link under discussion).
- [ ] `GET/POST /<module>/sign-in` for each module, per-module session auth state, session regeneration, safe `returnUrl`.
- [ ] Guard on module pages and the Defra forms `onRequest` hook.
- [ ] Tests: each module's sign-in, wrong module redirect, redirect after sign-in.

### Phase 5: Hardening and deployment
- [ ] Production secrets, CDP proxy, separate keys per environment.
- [ ] Rate limiting once sign-in exists.
- [ ] Accessibility review (error summary, focus, `lang` attributes).
- [ ] Monitoring and logging review (no PII in logs).

## 8. Decisions

| ID | Question | Status |
|----|----------|--------|
| D1 | Which modules does the service have? | **Decided:** two for now: Operator data collection and National Regulator data collection. More modules will be added later |
| D2 | Language for shared pages (cookies, errors)? | Open. Suggested: English only |
| D3 | URL prefixes | **Proposed:** `operator-data-collection`, `national-regulator-data-collection`. Need confirming |
| D4 | Authentication flow | **Deferred.** Magic link under discussion. Not designed or built now |
| D5 | Sign-in routes | **Decided:** `GET/POST /<module>/sign-in` stays in scope for the future (module first, page second) |
| D6 | Which modules have Welsh? | Module 1 only. Module 2 is assumed English only. To confirm |
| D7 | Data design | **To be decided later** |
| D8 | Notify | Open. Only needed if the sign-in flow sends email |
| D9 | How users are linked to facilities | Open. Depends on the authentication decision |
| D10 | Scope of module 2 | Open. Users, pages and data are not defined yet |

## 9. Risks

| ID | Risk | Mitigation |
|----|------|------------|
| R1 | Defra forms use their own slug as the first URL segment, so one module may span several prefixes | List all prefixes per module in the registry (as sketched), or check whether the forms engine can be mounted under one route prefix |
| R2 | The forms engine's `getLanguage(query, yar)` has no request, so it cannot see the module | Use the effective-language session key described in 5.2 |
| R3 | Welsh text missing on some Welsh-module pages shows English under `<html lang="cy">` | Translate every page of the module before enabling, add a test that fails when a page has no Welsh strings |
| R4 | No authentication while sign-in is deferred, so module pages are open | Development only. Do not release before sign-in is built |
| R5 | Scope of module 2 is not defined, so structure and data may change | Keep the registry and landing pages minimal until the scope is agreed |
| R6 | A Defra form is served at `/{slug}/{path}`, so a form page called `sign-in` or `sign-out` would clash with the future sign-in routes when the slug equals the module prefix | Reserve those two page names, and add a test that fails if a form definition uses them |
| R7 | The sign-in decision (magic link) may change the URL shape or how users link to facilities | Keep modules independent of the sign-in design, and keep the registry open for an authentication setting |

## 10. Test plan summary

- Frontend: landing page for each module, language policy per module (toggle shown or hidden, `lang` attribute, session preference).
- Forms: Welsh renders only in module 1.
- Authentication tests are added with the sign-in flow (Phase 4).