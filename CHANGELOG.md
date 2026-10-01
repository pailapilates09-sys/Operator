# Changelog

## 0.6.0 — 2026-10-01 — SHAREHOLDER BENCHMARK PROTOTYPE

- Replace blank operational tables with a clearly labelled fictional sample dataset so shareholders can judge the proposed operating model before real private integrations exist.
- Select Club Pilates as the primary operating-system benchmark based on publicly documented operations/GM manuals, intranet/POS/training resources, recurring memberships, sales/recruitment/site support and multi-site standardization.
- Use Reform Body as the Kathmandu local-market base; use KX Pilates for instructor readiness, BODYROK for owner/scale discipline, AFit / Align for consultation/facilities context, and Strong & Lean by Rosetta for structured-program/retention cues.
- Add a populated Today dashboard, anonymous customer lifecycle, sample class timetable, illustrative memberships/pricing, lead funnel, staff readiness, studio operations, retention examples and sample daily/weekly/monthly management reports.
- Add concrete draft policies for shareholder review, including capacities, first-visit orientation, cancellation/window values, waitlist handling and instructor shadow-teaching readiness. Every such value is marked PROTOTYPE / NOT APPROVED.
- Add `/benchmark/` and `data-model/shareholder-prototype.json` so the evidence-to-prototype mapping is inspectable.
- Preserve the production truth boundary: the real private backend and operational sources remain disconnected; no real customer/staff/payment/health records are published and no automations are activated.
- Preserve pre-change production at `c49ddd3a62d8b3d933460611bbf940162ecaf511` on `rollback/before-shareholder-benchmark-prototype-v0.6.0`.
- Release branch/tag/milestone must not be created until A9 Seq13 closeout reaches FINAL_CLOSED_PASS.

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

GitHub Pages remains configured to deploy from `main` and `/(root)`. Branches are development/fallback/release references, not visitor navigation. Public sections are folders/subpages under the same deployed site.
