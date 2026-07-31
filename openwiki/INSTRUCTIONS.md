# OpenWiki instructions for CraftMatch_Verification_Portal

This wiki documents only the `CraftMatch_Verification_Portal` repository.

Treat this repository as the verification/admin portal surface of CraftMatch. Focus on checked-in source, Vite/React app structure, routes, screens, authorization assumptions visible in source, Supabase usage, verification workflows, build configuration, and type/lint/test commands.

Do not document the full CraftMatch platform as if this repo owns it. When mentioning the backend, web frontend, mobile app, Supabase, or deployment systems, describe them only as integration boundaries unless the behavior is directly proven by this repository.

Prefer source-backed claims. If a product flow depends on another repository, label that dependency clearly and point readers to the shared `CraftMatch_Docs` repository for platform-wide architecture.

Never reproduce secrets or values from ignored files such as `.env`, build outputs, dependency folders, Supabase local temp state, or generated OpenWiki pages.

Every overview page should make the scope explicit: this is the verification portal repository wiki, not the whole-system documentation.
