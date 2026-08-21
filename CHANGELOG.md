# Changelog

All notable changes to the CraftMatch Verification Portal (`CraftMatch_Verification_Portal`).

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
This project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

> **Note on reconstruction.** Versions below were reconstructed on 2026-08-21 from git
> history (62 commits, 2026-06-05 → 2026-08-16). No git tags existed and `package.json`
> still reads `"version": "0.0.0"` — the Vite scaffold default, never initialized. Each
> entry is anchored to a real commit SHA.
>
> This portal serves three distinct audiences — admin operators, artisan applicants, and
> public password-reset/download visitors — so a user-visible regression here is a
> production incident even though it is "just the admin portal."

---

## [Unreleased]

### Fixed
- Verification tier taxonomy aligned to the database CHECK constraint: the outlier `master`
  tier was replaced with the canonical `premium` across all type unions, the runtime array
  and the `<option>` value in `AccountsPage.tsx`. Previously a tier update to `master` was
  rejected by the database while the UI reported success. The cosmetic
  "👑 Master Artisan" label is retained.

---

## [0.9.0] — 2026-08-14 — Trust & safety command centre
Anchor: `047d692`

### Added
- Deep-linking, multipart uploads and backend score authority (`42dc04e`).
- Instant account suspension and reactivation (`1b69ea6`).
- Operational summary banner with escrow revenue and job-pipeline counts (`21b5e7f`).
- System push broadcaster tab with target selectors, a live mobile lockscreen preview and
  market templates (`f96f025`).
- Interactive verification tier override and revoke controls (`9ec37ff`).
- Search, action filters and active tier synchronization (`7e1f545`).
- Sidebar navigation organized into sections (`047d692`).

### Fixed
- Missing `Users` icon import in `SettingsPage` (`cc612bf`).

---

## [0.8.0] — 2026-08-13 — Sandbox gateway polish
Anchor: `59e3c00`

### Added
- `platform` parameter handling and dynamic web redirects in the sandbox payment
  gateway (`24b4c5c`).

### Changed
- Sandbox payment gateway themed to app branding (`5f2f951`); portal favicon aligned to the
  app favicon (`59e3c00`).
- Unused imports and string replacements cleaned up in admin reports and settings (`b5ee0c0`).

### Fixed
- Close-tab script and button label aligned to "Close / Return" (`76907c6`).

---

## [0.7.1] — 2026-08-09 — Checkout error-surfacing patches
Anchor: `48c3e1b`

### Fixed
- Real `authorization_url` used from the backend instead of a hardcoded placeholder
  (`0f875ef`).
- Paystack init retried when `authorization_url` is missing (`2e6b939`).
- Detailed error messages surfaced in `apiPost` (`48c3e1b`).

---

## [0.7.0] — 2026-08-07 — Disputes & reports administration
Anchor: `ed153c0`

### Added
- Admin reports page with layout update (`091a1c5`).
- Admin dispute resolution page (`ed153c0`).

---

## [0.6.0] — 2026-08-06 — Payment gateway
Anchor: `2899062`

### Added
- `PaymentGateway` page with countdown auto-redirect and a detailed invoice summary
  (`730c3b2`).
- Sandbox checkout simulation mode and checkout-session lookup (`2899062`).

### Fixed
- Payment-gateway routing resolves path-based URLs from the backend redirect (`a566948`).

---

## [0.5.0] — 2026-08-03 — Service catalog pricing
Anchor: `c9623b1`

### Added
- Base-price editing in the service catalog (`f8a1632`).

### Changed
- `ServiceCatalogPage` and catalog types updated for the new taxonomy (`c9623b1`).

### Fixed
- `showInactive` defaults to false in the service catalog (`b4d2ae9`).

---

## [0.4.0] — 2026-07-30 — App distribution
Anchor: `76b8b86`

### Added
- Mobile app download page with a lucide icon compatibility shim (`12a7473`).
- Web PWA link enabled (`f28bf3c`).
- PWA and APK installation guide page with navigation routes (`76b8b86`).
- Password strength meter and policy on `UpdatePasswordPage` (`d878772`).

### Changed
- Password page logo updated; tsconfig module resolution configured (`661715a`).
- "Return to Sign In" shown conditionally with dynamic `redirect_to` support (`6222a51`).

---

## [0.3.0] — 2026-06-29 — Legal & support hub
Anchor: `b471254`

### Added
- Legal policies and support hub pages (`b6b8543`).
- Legal and support hub made database-driven via a configuration file (`b471254`).
- Custom trade review options with standard category loading (`2f1fdc1`).

### Changed
- Sidebar mobile responsiveness and admin page responsiveness (`4173061`, `ddde838`).

---

## [0.2.0] — 2026-06-22 — Password reset flow
Anchor: `d9592e6`

> This release absorbed the frontend's move away from deep links for password reset
> (`artisansApp_frontend@1ee3a99`, committed the same day) — a cross-repo contract change
> shipped with no version number on either side.

### Added
- Password reset page (`f67e3bf`).
- "Open app" button on the password reset success page (`bcfa0f0`).
- CraftMatch header and session error handling (`0e02460`).
- Admin accounts and service catalog pages (`3c4f8e4`).
- Email verified page and app routing (`b4ab89a`).

### Fixed
- Tailwind `brand-` classes corrected to `primary-` so the reset button renders (`b29b672`).
- Session explicitly set from the URL hash to fix missing auth session on Vercel (`172e15a`).
- TypeScript strict-mode `any` errors and TS config errors (`d9592e6`, `f67e3bf`).

---

## [0.1.0] — 2026-06-05 — Initial verification portal
Anchor: `9e825ed`

### Added
- App-aligned verification portal (`0e727ef`).
- `ApplyPage` with file upload and validation (`9e825ed`).

---

[Unreleased]: https://github.com/Artisans-Connect/CraftMatch_Verification_Portal/compare/v0.9.0...HEAD
