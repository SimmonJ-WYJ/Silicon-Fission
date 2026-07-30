# Admin quota adjustment design

## Goal
Add an admin action that lets a privileged user increase or decrease any user's usable balance/quota from the SiliconFission admin console.

This is distinct from the existing `/topup` page:
- `/topup` remains the user-facing recharge flow and is still a demo/mock payment surface in this repo.
- The new admin action is a direct quota adjustment tool for support and account operations.

## Problem statement
The admin console can currently promote/demote users, enable/disable accounts, and delete accounts, but it cannot adjust quota/balance for an existing user. That forces manual backend edits or workarounds when an account needs a balance correction or a one-off credit grant.

## Proposed UX
In the admin users table, add a new action button per row:
- label: `调整额度`
- opens a modal or drawer with:
  - target user display name / username
  - operation: `增加` / `扣减`
  - amount input in USD-equivalent units
  - optional reason/remark
  - submit / cancel

After a successful change, refresh the user list so the visible `balanceUsd` updates immediately.

## Behavior
### Input rules
- amount must be positive
- amount must be a finite decimal with sensible precision (same precision currently used in balance display, e.g. 4 decimals is sufficient)
- reason/remark is optional in the UI but should be preserved if the backend accepts it

### Demo mode
If the app is running in demo mode:
- accept the action
- return a success response
- do not persist anything
- still refresh the table so the interaction feels real in local testing

### Real mode
The frontend API route should proxy the adjustment request to the upstream admin API.

If the upstream API does not yet expose a dedicated balance/quota adjustment endpoint, the proxy route should fail closed with a clear message instead of silently pretending success.

## API shape
Add a new admin route in the web app, for example:
- `POST /api/admin/users/quota`

Request body:
```json
{
  "id": 123,
  "action": "increase" | "decrease",
  "amount": 10,
  "remark": "manual adjustment"
}
```

Response body:
```json
{
  "success": true,
  "message": "..."
}
```

The admin UI should call this route directly, not reuse the existing promote/demote/enable/disable/delete endpoint.

## Data model and source of truth
The app already treats upstream `quota` as the source of truth and converts it into `balanceUsd` with `QUOTA_PER_USD`.
This feature must continue to follow that rule:
- UI shows `balanceUsd`
- backend adjustment changes upstream quota
- client refreshes and re-derives `balanceUsd` from the updated quota

## Files likely to change
- `web/app/(console)/admin/admin-client.tsx`
- `web/app/api/admin/users/quota/route.ts` (new)
- `web/app/api/admin/users/route.ts` only if a helper type or shape needs to be reused
- `web/lib/api.ts` if a shared client helper is desirable
- docs:
  - `web/README.md`
  - `docs/FEATURES.md`

## Non-goals
- No changes to the user-facing `/topup` demo page in this task
- No payment gateway integration
- No bulk import/export tooling
- No per-model pricing changes

## Acceptance criteria
- Admin row actions include `调整额度`
- Admin can add or subtract a specific amount for any user
- The modal shows the target user and the amount being applied
- Successful adjustment updates the user table without manual refresh
- Demo mode works without touching real backend state
- Documentation clearly distinguishes:
  - user-facing top-up/recharge
  - admin quota adjustment
