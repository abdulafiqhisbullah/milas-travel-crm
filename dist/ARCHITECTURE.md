# Milas Travel Unified CRM + Booking Engine — Milestone 1

## Current repository assessment

The supplied workspace was empty: no framework, package manifest, frontend routes, backend, database, authentication, or existing components were present. Milestone 1 is therefore delivered as a dependency-free responsive application shell so it can be opened directly and later ported into the chosen production stack without losing the domain model.

## Proposed architecture

- **One application**: internal staff dashboard and future public booking interface share one backend, authentication boundary, relational database, customer records and pricing service.
- **Frontend**: staff dashboard routes such as `/dashboard`, `/leads`, `/customers`, `/quotations`, `/bookings`, `/payments`, `/operations`, `/suppliers`, `/reports`, and `/settings`. The supplied prototype represents these routes as a navigable shell; the next milestone can migrate the views into React/Next.js or the team’s selected TypeScript stack.
- **Backend**: modular monolith first. Domain modules own their services, validators and repository queries, while a shared `pricing-engine`, `identity`, `audit`, `search` and `sequence` layer prevents duplicated business rules.
- **Database**: PostgreSQL recommended for transactional integrity, UUID internal keys, human-readable booking/quotation numbers, snapshots and indexed search fields.
- **Authentication**: secure session or short-lived access/refresh tokens, password hashing (Argon2id), server-side permission checks and least-privilege access to passport/ID fields.
- **API boundary**: `/api/v1/staff/*` for dashboard actions and `/api/v1/public/*` for website-safe package, price, availability and booking calls. Both invoke the same domain services.

## Main modules

Foundation, CRM, Sales, Products & Pricing, Bookings, Payments, Operations, Suppliers, Reports and Settings. The first screen distinguishes **Booking Value**, **Cash Collected** and **Outstanding** as separate metrics.

## Core relationship and workflow

`Customer 1—N Lead 1—N Quotation 1—0..1 Booking 1—N Payment`.

Each booking has travellers, items, add-ons, one operations record and many tasks. On conversion, customer and lead references are carried forward rather than copied. A confirmed booking creates or activates its operations record. Payment writes recalculate paid and outstanding balances. A completed booking remains in customer history.

## Snapshot strategy

Quotation and booking items store the package/add-on name, unit price, quantity, discount and tax/fee values used at the time. A product price update only affects new calculations; it never updates existing commercial snapshots.

## Routes and milestones

| Milestone | Scope | Status |
|---|---|---|
| 1 | Application shell, dashboard, sidebar, settings/RBAC foundation | Delivered in this output |
| 2 | Leads, customers, activities, duplicate detection | Next |
| 3 | Packages, categories, pricing, add-ons | Planned |
| 4 | Quotations and convert-to-booking | Planned |
| 5 | Booking engine, travellers, calendar, public API | Planned |
| 6 | Payment records, balance and refund structure | Planned |
| 7 | Operations and suppliers | Planned |
| 8 | Reporting and management KPIs | Planned |
| 9 | Workflow, permission, integrity, responsive and performance hardening | Planned |

## Critical risks and assumptions

1. A production database, hosting target, identity provider and payment gateway have not been specified; this foundation deliberately avoids inventing credentials or provider lock-in.
2. Traveller passport data is sensitive. Encrypt at rest, restrict field-level access, redact in logs and define retention/deletion policy before production use.
3. Booking and quotation number sequences must be transactional and never reused; do not derive customer-facing IDs from UUIDs.
4. Public website booking must use idempotency keys to prevent duplicate bookings on retry.
5. Source-of-truth ownership is central: website, staff and future OTA adapters must call the same pricing and booking services.
