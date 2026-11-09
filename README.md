# Paila studio work

[Open the website](https://pailapilates09-sys.github.io/Operator/) · [Find a sheet](https://pailapilates09-sys.github.io/Operator/work/sheets/) · [Entry guide](https://pailapilates09-sys.github.io/Operator/work/help/entry/)

Choose Daily work, Classes, Clients, Money, Setup or Help. Each area opens a small page with its owning Google Sheet and short instructions. Ten native files contain twelve related input tables. The old management screens are labelled examples; the former Today home is preserved at `/today/`.

## Maintain

- `data-model/collection/navigation.json`: categories and examples.
- `data-model/collection/sources.json`: verified Sheet IDs and tab links.
- `data-model/collection/contract.json`: fields, stable IDs and relationships.
- `data-model/construction-progress.json`: reviewed construction updates and evidence counts used by the Construction progress report.
- `tools/build_staff_site.py`: generated staff pages.
- `tools/build_collection_contract.py`: SQL DDL and CSV field map.
- `work/work.js`: Sheet-link refresh, sharing and search.

The Pages workflow rebuilds and validates the staff pages. Existing SOP and spatial-viewer assets are preserved. The Customer website remains a separate outward link.

To refresh Construction progress, reconcile the Progress and Summary tabs with the dated Drive notes, then update the reviewed snapshot. Keep the issued Progress IDs and use `null` for an unmeasured installed quantity. The Pages workflow renders the snapshot on each deploy.

## Data collection

Staff edit the native Sheets. Keep column A's issued ID, reuse related IDs, and keep completed rows. Unused ID-only rows are not records. Add another unique ID batch when needed; do not copy a file to create a competing input source.

The private reader validates required fields, primary and foreign keys, dates, refunds, cross-client memberships, attendance capacity and source deletions. It writes private JSON/CSV/SQL and append-only JSONL observations.

```sh
python3 tools/collect_studio_sheets.py --csv-dir /private/studio-csv --out /private/studio-data
python3 tools/collect_studio_sheets.py --live --out /private/studio-data
```

Live reading requires a short-lived `GOOGLE_SHEETS_ACCESS_TOKEN` in the private runner environment. Keep credentials out of source and chat. Public pages fetch the directory of Sheet links; they do not fetch private business rows.

**Automatic reports are INCOMPLETE.** No private scheduler, authenticated reporting endpoint or live website data feed is configured. Existing dashboard numbers remain fictional. The new collection staging model does not replace the older nineteen private entity/event schemas. No live SQL migration or formal Studio OS v0.7 release is claimed; the frozen v0.6.0 reference is preserved.

## Checks

```sh
python3 tools/build_collection_contract.py
python3 tools/build_staff_site.py
python3 tools/validate_staff_site.py
python3 tools/verify_collection.py
node tools/verify_review.mjs
node --check os.js
node --check review.js
node --check work/work.js
```

Rollback: `rollback/before-simple-staff-site-20261103` at `e2a050fd061e5c53eecdbf52089261fce1c5c086`. Preserve history and use a reviewed revert or fix-forward commit. Candidate: `publication/simple-staff-site-20261103`.

The [09 recovery record](docs/DRIVE_RECOVERY_09.md) retains earlier lineage. Original private control/registrar contents are unavailable to the 09 connection. This bounded update uses live 09 Drive/repository sources; no central sequence or Main ACK is invented. Owner visual review remains with the owner.
