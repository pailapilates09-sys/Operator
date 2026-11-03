# Staff pages and sheets

The old long directory is now a short category menu at `/workspace/`; the same menu is the website home. Existing entries in `workspace/links.json` remain preserved. Documents, tools and history are shown on separate resource pages.

The ten native staff inputs are mapped in `data-model/collection/sources.json`. Each task page opens its owning Sheet and provides a field guide. The older aggregate daily workbook remains under Files & tools / Documents and is not migrated or overwritten.

Edit navigation, source links and field definitions in `data-model/collection/`. Run `python3 tools/build_staff_site.py`. The Pages workflow runs this builder and validates generated local links. The older `tools/build_workspace.py` command delegates to it.

The source map's verified link state is separate from automatic reporting. Browser JavaScript reads Sheet URLs, not business rows. The private reader `tools/collect_studio_sheets.py` supports later authorized API reading or CSV imports, key validation and private JSON/CSV/SQL/JSONL outputs. The authenticated report service and scheduler are not connected.

Sheets include frozen headers, issued IDs, dropdowns, date/money formats, a Check formula and Help. Studio setup has three input tabs; the other nine files each have one. Input rows are blank apart from issued IDs. Name changes do not change IDs. Import observations record source changes rather than reconstructing business events.

The user authorized resource links and deferred privacy management. No operational rows or credentials are committed, and sharing permissions are unchanged. Customer navigation remains one-way.

Baseline: Operator `e2a050fd061e5c53eecdbf52089261fce1c5c086`. The live Drive profile is pailapilates09@gmail.com. The original Paila control returned provider 403; the recovered studio reference and 09 recovery closeout were read. No unavailable control text or central registrar state is reconstructed.
