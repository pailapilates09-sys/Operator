# Changelog

## 0.5.0 — 2026-10-01

- Promote the Client Portal into the Paila Studio OS owner / management framework.
- Add Today, customer lifecycle, classes, memberships, sales, staff, studio operations, retention, reports, SOP master register, inactive automation candidates, source readiness and data dictionary.
- Add 19 entity schemas, shared event envelope and event-specific reference contracts; no private records or operational sample data.
- Add daily / weekly / monthly review definitions and explicit disconnected states.
- Preserve the existing SOP handbook, 2D/3D studio preview and outward Customer Portal link.
- Before-release main: `213dd4cd33e5b93a4783099170ee8a664d5d0129`; fallback branch `milestone/client-before-studio-os-v0.5.0`.
- Private backend, real sources, policy approval and automation activation remain future work. Owner performs visual / UX QA.

# Paila Pilates Client Portal — Change Log

## v0.3.0 — 2026-09-26

- Split the handbook into a searchable directory, four procedure records and eleven topic pages.
- Preserved existing draft/planned content; recorded missing approval metadata explicitly.
- Added stable presentation-source references, keyboard/mobile navigation and legacy section redirects.
- Corrected the unverified Business Systems source claim.
- Rollback: commit `7875b3540051bb3671b97f5ebabd1f01d601898f`. No change to Customer Portal or Drive hierarchy.

## v0.2.0 — 2026-09-26

- Converted the repository root into the Paila Pilates Client Portal.
- Preserved the existing SOP Handbook as a subpage at `/sop/` instead of replacing it.
- Added direct one-way access to the public Customer Portal.
- Added owner-facing system cards for Business Systems, Reports, and Future Systems without inventing or publishing systems that do not yet have an approved presentation layer.
- Added explicit privacy and one-way navigation boundaries.
- Added `version.json` so the current portal version is visible from the live interface.
- Preserved the full pre-portal state at commit `b22cf439a3d3457b66c8174f27a97744ab283f99` and fallback branch `milestone/sop-handbook-v0.1.0`.

## v0.1.0 — 2026-09-25

Standalone SOP Handbook framework with responsive layout, search, navigation, SOP sections, public-content guardrails and change history.

### Milestone preservation

- Commit: `b22cf439a3d3457b66c8174f27a97744ab283f99`
- Fallback branch: `milestone/sop-handbook-v0.1.0`
- GitHub tag / Release object: pending manual creation because the connected repository tool does not expose tag or release creation.

## Deployment model

GitHub Pages should remain configured to deploy from `main` and `/(root)`. Branches are used for development and fallback snapshots, not for visitor navigation. Public sections are implemented as folders/subpages under the same deployed site.

