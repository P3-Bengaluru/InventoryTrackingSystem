# Testing with `002_test_scenarios.js`

Run this after `001_bootstrap.js` on a scratch/test database:

```bash
npm install bcryptjs --save-dev   # only needed for this seed's password hashing
npx knex seed:run --specific=001_bootstrap.js
npx knex seed:run --specific=002_test_scenarios.js
```

It's idempotent — re-running `knex seed:run` (with no `--specific` flag,
which re-runs every seed file) skips itself once `admin@its.local` already
exists, so it won't duplicate rows on a database you've already seeded.

## Test logins

All ten seeded human users share the same password: **`Passw0rd!123`**

| Email | Role | Notes |
|---|---|---|
| `admin@its.local` | admin | Full access |
| `inv.manager@its.local` | inventory_manager | Approves 25,001–100,000 tier (L1); orders/receives procurement |
| `project.manager@its.local` | project_manager | Approves reallocations |
| `manager.one@its.local` | manager | Approves 5,001–25,000 tier; also L2 on the 25,001–100,000 tier |
| `manager.two@its.local` | manager | Second manager, for parallel approval scenarios |
| `engineer.one@its.local` | engineer | `self_approve_limit = 5000` |
| `engineer.two@its.local` | engineer | `self_approve_limit = 0` — everything routes to approval |
| `auditor@its.local` | auditor | Read/export only |
| `inactive.user@its.local` | engineer | `is_active = false` — **login should be rejected** |
| `locked.user@its.local` | engineer | `locked_until` 30 min in the future — **login should be rejected** |

Since IDs are UUIDs generated at insert time, look rows up by their
human-readable handle (`asset_tag`, `employee_id`, `item_name`, `sku`)
via the relevant list endpoint to get the actual ID for path params.

## Procurement scenarios (`item_name` → what to test)

| # | item_name | Status seeded at | What to test |
|---|---|---|---|
| R1 | Ergonomic Keyboard | `draft` | A request that hasn't been submitted yet |
| R2 | Spare Laptop Charger (65W) | `submitted` | Mid-flight, pre-inventory-check state |
| R3 | Standing Desk | `inventory_check` | Mid-flight, matching-in-progress state |
| R4 | USB-C Docking Station | `self_approved` | `PATCH /:id/order` directly — no approval needed |
| R5 | Ergonomic Office Chair | `pending_approval` (1 tier) | `PATCH /:id/approvals/:approvalId` as **manager.one** → `decision: "approved"` |
| R6 | 4K Gaming Monitor | `pending_approval` (1 tier) | Same endpoint as **manager.two** → `decision: "rejected"` |
| R7 | Rack Server for CI Pipeline | `pending_approval` (2 tiers) | Approve as **inv.manager** (level 1) first, then as **manager.one** (level 2) — confirms sequential gating |
| R8 | 24-Port Network Switch | `approved` | `PATCH /:id/order` directly |
| R9 | Conference Room Display 65" | `ordered`, `new_purchase` | `PATCH /:id/receive` — should create a **new** `assets` row |
| R10 | Spare Desktop from Inventory | `ordered`, `existing_asset` | `PATCH /:id/receive` — should **not** create a new asset (already matched to `AST-0003`) |
| R11 | Wireless Headset (from Procurement) | `received` | Read-only — `GET /:id/history` shows the full RAISED→APPROVED→ORDERED→RECEIVED trail; linked asset is `AST-0018` |
| R12 | Premium Office Sofa | `rejected` | Read-only final state — level 2 approval row shows `skipped` |
| R13 | Extra Monitor Arm | `cancelled` | Read-only final state — shows a cancel that happened mid-approval |

`GET /api/procurement/pending-approvals` as **manager.one**, **manager.two**,
or **inv.manager** will show the live pending rows from R5/R6/R7.

## Everything else seeded

- **Assets** — one of every `status` value (`available`, `assigned`,
  `maintenance`, `retired`, `lost`, `disposed`, `in_transit`), plus one
  with a warranty expiring in 20 days and one due for maintenance in 5
  days (both inside their alert windows from `system_settings`).
- **Assignments** — one of every status (`pending`, `assigned`,
  `rejected`, `returned`, `overdue`).
- **Reallocations** — one of every status (`pending`, `approved`,
  `rejected`, `completed`).
- **Software licenses** — one of every `license_type`
  (`subscription`, `perpetual`, `trial`, `open_source`) and every
  `status` (`active`, `expired`, `cancelled`), plus one expiring in 25
  days.
- **Consumables + stock ledger** — one low-stock item (`STN-PAPER-A4`,
  below its `min_threshold`), one near-expiry item, and one
  transaction of every `stock_transactions.type` (`add`, `issue`,
  `adjustment`, `return`, `disposal`).
- **Notifications** — one of every relevant `type`, a mix of read and
  unread, including a `user_id: null` broadcast.
- **Activity logs** — one of every `log_type` (`data`, `maintenance`,
  `audit`, `system`), enough to see `maintenance_log` and `audit_log`
  return non-empty results and to see a multi-entry timeline on
  `GET /api/procurement/:id/history` for R11 and R12.
