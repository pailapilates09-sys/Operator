# Daily capture private export contract

The [Paila daily capture sheet](https://docs.google.com/spreadsheets/d/13um0MJkeGd3k_pRDQMu3L0FXJp1BErI8KpY7K8V9kZg/edit) is the source for three aggregate tables. The public Studio OS repository contains the exporter **code only**. Run the exporter in an approved private runner with Node 20+ and a private output directory outside any public repository.

```sh
node tools/export_daily_capture.mjs \
  --sheet-id 13um0MJkeGd3k_pRDQMu3L0FXJp1BErI8KpY7K8V9kZg \
  --out /private/paila-daily-capture
```

The service account must have read access to the sheet. A short-lived `GOOGLE_SHEETS_ACCESS_TOKEN` can be supplied instead. Store the credential in the private runner secret store; never in a command history, repo, or Pages asset. For offline reconciliation, export each input tab with row 4 as its CSV header to `daily_close.csv`, `class_sessions.csv`, `finance_daily.csv` and run `--source-dir PRIVATE_CSV_DIR --out PRIVATE_OUTPUT_DIR`.

Each run validates exact headers, unique stable keys, location/date, numeric and boolean types. It emits three UTF-8 CSV files, three JSON current snapshots, `daily_capture_postgres.sql`, `observations.jsonl`, and `state.json`. The SQL file is a transactionally replaced **current aggregate snapshot**, with `day_id` or `session_id` as primary key. `observations.jsonl` records first seen or changed *sheet rows* by content hash. These observation timestamps are ingestion times, not reconstructed booking, visit, payment, or customer events. Re-running unchanged input adds no observations. Never derive individual retention or cohort conversion from these daily totals.

Run from the private scheduler after the manager closes the day; treat a failed validation as a stopped export. The output directory is restricted to the private runner. Feed the SQL to an approved private PostgreSQL database only after its access policy and backup path are in place. Do not publish any output file to GitHub Pages.

The `data-model/private-adapter.js` module describes the future authenticated API client. Its server must implement `GET /modules/:module` and `GET /reports/:period` with session and role checks, coverage, source identity, `asOf`, and discriminated status. This module is **not activated** in the public Pages UI. An approved private backend and authenticated owner UI remain required for real operational views.
