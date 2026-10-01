# Paila Studio Operating System — v0.5.0

The existing Client Portal is the owner / management console. This release provides a live, read-only management framework with explicit disconnected states. It is not a live operational database, authentication service or active automation system.

## Production and preservation

- Production: https://pailapilates10-cmd.github.io/Paila-Pilates-SOP/
- GitHub Pages: existing `main` branch, repository root. No build dependencies.
- Before-release main: `213dd4cd33e5b93a4783099170ee8a664d5d0129`.
- Rollback branch: `milestone/client-before-studio-os-v0.5.0` (a branch, not a tag or GitHub Release).
- Preserve the existing `/sop/` handbook and its Draft / Planned procedures. The additional `/sop/register.html` is a taxonomy and discovery view, not approval of procedures.
- Preserve all `/studio/` files and user-approved spatial preview v0.1.1. Its geometric limitations and component version remain unchanged.
- The console links outward to the existing Customer Portal. This release does not alter that repository or introduce a customer-to-management link.

## Routes and public contracts

| Route | Purpose |
| --- | --- |
| `/` | Today: attention, activity, this week and source readiness |
| `/customers/` | Customer lifecycle from discovery to advocacy |
| `/classes/` | Sessions, bookings, waitlist, attendance and utilization |
| `/memberships/` | Trial, pass, membership and payment-exception lifecycle |
| `/sales/` | Lead funnel and next-contact model |
| `/staff/` | Instructor credentials, availability, coverage and development |
| `/operations/` | Opening, inspection, cleaning, maintenance, incident and handover |
| `/retention/` | Feedback, recovery, milestones, lapse and re-engagement |
| `/reports/` | Daily / weekly / monthly definitions and management actions |
| `/sop/register.html` | Existing procedures and 26 proposed operating areas |
| `/automations/` | Four candidate classes, all inactive |
| `/system/` | Source readiness, integration boundaries and public benchmarks |
| `/data-model/` | Searchable 19-entity dictionary and event registry |

Each page has an explicit route and static fallback. Shared `os.js` renders safe definition text using DOM text nodes; there is no HTML injection from private records. `os.css` uses the existing green / cream Paila visual vocabulary without changing the existing handbook or viewer assets. No browser persistence, record-entry forms, credentials or operational sample datasets are included.

`data-model/console.json` contains management definitions. `dictionary.json` classifies fields by type, requirement, privacy, sensitivity and authority. Nineteen JSON Schemas define private source contracts. `event.schema.json` defines the common envelope and conditional required references; `events.json` defines supported event families. Schema validity does not establish authority or permission to publish a record.

## Event semantics

Common fields: `event_id`, `event_type`, `timestamp`, `location_id`, `source_system`, `actor_reference`, `schema_version`, `status`; applicable customer, instructor, class, session, booking, membership and other IDs are required by event type. `class_id` refers to `ClassType.class_type_id`; the session reference is `ClassSession.session_id`. `value` and ISO currency in `metadata` are required for completed payments and refunds. No card, bank, health or narrative incident payload belongs in the public contract.

All event **instances** and operational records live only in an approved private backend. Metadata is deliberately limited to correlation, evidence and policy references, currency and a reason code. References themselves may be sensitive and remain private. Detailed feedback, credential, incident and personnel evidence are restricted references, not public content fields.

A future event store must authenticate actors, enforce location and role permissions server-side, deduplicate `event_id` and source transaction references, validate foreign keys, and check permitted state transitions. Source corrections must append auditable corrections; they must not silently erase history. Schemas provide shape validation, not access control, scheduling concurrency or safety approval.

Book places and promote waitlists transactionally against approved capacity and entitlement. Reconcile bookings and actual visits separately. Payment failures are not revenue; payments, refunds and recognised revenue are distinct. Keep currencies separate. Apply approved reporting cohorts / windows, use `Asia/Kathmandu` for studio date boundaries, and preserve explicit-offset timestamps. Missing or partial coverage renders unavailable; an empty disconnected array is never proof of zero activity.

## Private adapter boundary

`data-model/adapter.js` exports `createDisconnectedSource()` with `connection`, `readModule(module, {signal})` and `readReport(period, {signal})`. The current implementation always returns `status: not_connected`, `authoritative: false`, `asOf: null`, `coverage: null`, `metrics: null`; empty `records` do not represent an empty business. It makes no external data calls. Registers and report definitions remain usable offline from downloaded definitions.

Before private integration, provide an approved server boundary, datastore and source owners. The future adapter should return a documented discriminated result:

- `status`: `ready`, `not_connected`, `unavailable`, `unauthorised`, `stale` or `partial`;
- `authoritative`, `asOf`, source identity and coverage for the requested period;
- only the records / aggregates permitted for the authenticated owner;
- validated metrics with denominator, currency, period and definition version;
- traceable exceptions with evidence references, review gate and responsible owner.

The UI must gate future values on authorised, authoritative and sufficiently complete results; simply replacing the adapter is not enough to enable private records. Add an authenticated UI boundary and approved presentation rules in that integration release. Public GitHub Pages cannot enforce private backend access by itself. Never place credentials in repository files, query strings or local/session storage. Server-side role checks must protect every endpoint; hiding navigation is not security. Use approved consent, retention, deletion, access logging and recovery policies in the private system.

## Outstanding authority decisions

No timetable, capacity, price, cancellation window, refund threshold or membership term is invented. Authoritative owners must approve those values, product definitions, consent / retention rules, credential requirements, inactivity / churn / conversion / milestone definitions, maintenance intervals, safety and incident escalation, and review ownership. Performance inputs require contextual human review and never produce a public staff ranking.

All automation candidates are inactive. “Automatable now” covers public schema / framework checks only. Data-driven messaging requires sources, consent, routing and policy approval. Complaint handling, refunds, equipment safety, incident response and personnel decisions retain human accountability.

## Benchmark evidence

Public pages were checked on 2026-10-01. Observations and Paila design **inferences** are separate in the Systems page. No internal SOPs, confidential manuals or comparative performance rankings were accessed. Local prices and terms are not copied into Paila.

| Reference | Public basis | Inference used |
| --- | --- | --- |
| [Reform Body](https://reformbody.com.np/) | Class formats, private sessions, booking / membership presentation | Separate first visit, scheduling and entitlement |
| [AFit / Align](https://afitstudios.com/align) | Official search snapshot: mat / reformer, guided instruction, account booking; direct page verification wall | Coverage and onboarding with booking |
| [Strong & Lean by Rosetta](https://np.linkedin.com/showcase/strong-lean-by-rosetta/) | Public company profile; structured fitness and community, limited operating detail | Participation continuity; adjacent fitness reference |
| [Club Pilates](https://www.clubpilates.com/education-faq) | Public instructor education | Credential and continuing-development model |
| [KX Pilates](https://kxpilates.com/au/faqs) | Public bookings, passes and memberships | Separate entitlement, booking and attendance states |
| [BODYROK](https://bodyrok.com/terms/) | Public booking, package and cancellation terms | Explicit booking states; local policy still required |

## Minimal release verification

Run `python tools/validate_studio_os.py` and `node --check os.js`. Check the changed-file tree, provider commit / branch / merge readback, Pages run at the final main SHA, live version and critical route / file responses. Visual / UX QA is reserved for the owner this run. No visual approval is claimed.

To roll back, create a reviewed revert or restore the pre-release tree in a new main commit, retaining history. The fallback branch points to the pre-change SHA. Do not force-reset production history.
