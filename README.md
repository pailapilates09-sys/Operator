# Paila Studio OS / Client Portal

Live owner / management framework: https://pailapilates10-cmd.github.io/Paila-Pilates-SOP/

Live build: **review-2026-10-03 — PRE-RELEASE / SHAREHOLDER REVIEW**. Approved frozen release: **v0.6.0**. Real operational sources are **not connected**. No private customer, payment, staff or incident records belong in this public repository. All automation candidates are inactive.

See [architecture and integration contract](docs/studio-os.md), [version and rollback](version.json), [public data dictionary](data-model/dictionary.json) and [changelog](CHANGELOG.md). Existing `/sop/` and `/studio/` are preserved. GitHub Pages continues to publish from `main` at the repository root.


The working review adds a client conversion board (`/journey/`), accountable decision board (`/management/`), optional launch lens (`/readiness/`) and connected fictional management views. All demo records, amounts and operating assumptions are **FICTIONAL / PROTOTYPE / NOT APPROVED**. Demo interactions use only known synthetic identifiers and allowlisted status values in browser-session storage. The reset control clears that demo state. No real messaging, payment, equipment release, policy approval or private record writing occurs.

The research application map is `data-model/research-model.json`. Shared event projections in `data-model/prototype-engine.js` reconcile metrics across pages. The seed schema is a demonstration model, separate from the future private production entity/event contracts. Rollback is `ade69b1073468c913e25b1a486cb417e54016adb` on `rollback/before-shareholder-review-2026-10-03`. No v0.7.0 formal release is authorised.

Minimum verification: `python tools/validate_studio_os.py` (requires `jsonschema[format]`), `node tools/verify_review.mjs`, ES module syntax checks and provider-read Pages success for the exact published main SHA. Owner visual review follows publication.

## Earlier portal documentation (preserved history)

# Paila Pilates — Client Portal & SOP Handbook

This repository is the public-safe presentation layer for the Paila Pilates owner/client-facing digital gateway.

## Live architecture

- `/` — Client Portal home
- `/sop/` — SOP / Operations Handbook
- Customer Portal — linked externally to the separate `pailapilates10-cmd/Paila-Pilates.com` repository and GitHub Pages site
- Business Systems — operational source reconciliation pending; no public owner-facing presentation is published here yet
- Reports — no approved portal published yet
- Future Systems — added only when a real, approved system exists

## Repository files

- `index.html` — Client Portal home
- `portal.css` — Client Portal visual system
- `portal.js` — Client Portal lightweight runtime
- `version.json` — current visible version and fallback lineage
- `CHANGELOG.md` — milestone and version history
- `sop/index.html` — searchable SOP directory; individual SOP and topic pages live alongside it
- `styles.css` — SOP Handbook styling
- `sop/handbook.js` — search, filters, navigation and legacy fragment handling
- `sop/handbook.css` — responsive handbook layout
- `sop/catalog.json` — public procedure metadata and preserved presentation-source reference

## Versioning and rollback

GitHub Pages stays on `main` → `/(root)`.

Branches are **not** used as website navigation. They are behind-the-scenes development or fallback references. The pre-portal SOP milestone is preserved at:

- commit `b22cf439a3d3457b66c8174f27a97744ab283f99`
- branch `milestone/sop-handbook-v0.1.0`

Every commit remains part of Git history, so individual changes can be inspected or restored. Named milestones provide an easier rollback pointer.

## Authority model

- Google Drive / approved business sources: business and operational source authority
- GitHub: version-controlled public/client-safe presentation code
- GitHub Pages: public-safe presentation layer
- Restricted operational material remains in approved private systems

## Public repository rule

Never commit passwords, API keys, private customer/member information, health information, payment records, staff personal information, confidential security procedures, private operational workbooks, or internal credentials.

## Current version

See `version.json` and `CHANGELOG.md`.


## Review boundary

The four SOP records retain their existing Draft/Planned status. Missing owners, approvers, scope and effective/review dates are explicit. Publishing this interface does not approve its procedures.

## Studio layout preview

`/studio/` contains the interactive 2D plan and lazy-loaded 3D cutaway. Both portals consume the same geometry version and canonical SHA-256, recorded in `studio/manifest.json`. The view remains a source-derived preview; height is illustrative and dimensional conflicts remain unresolved. Original plan/video and private lineage stay in restricted project storage. Three.js 0.170.0 is vendored with its MIT license. No build or runtime CDN is needed.
