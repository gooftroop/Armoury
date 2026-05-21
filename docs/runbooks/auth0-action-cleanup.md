# Auth0 Action Cleanup Runbook

**Migration Phase**: Wave 3 — Auth0 Tenant Cleanup  
**Prerequisite**: All application code changes from Waves 1–2 must be deployed and verified before executing this runbook.  
**Estimated time**: 15–20 minutes  
**Risk**: Low — these actions are no longer called by any deployed code after the migration.

---

## Overview

During the `internal_id` → `sub` migration, three Auth0 Actions were responsible for:

1. Generating a UUID `internal_id` for each user and storing it in `app_metadata`
2. Injecting that UUID as a custom JWT claim (`https://armoury.app/internal_id`) into every access token and ID token

After the migration, the application reads the user's identity directly from the standard `sub` claim (the Auth0 user ID, e.g. `auth0|abc123`). The `internal_id` claim is no longer read by any service. These three actions are therefore safe to delete.

> ⚠️ **Do not delete these actions until Waves 1 and 2 are fully deployed and verified in production.** Deleting them while old code is still running will break authentication for all users.

---

## Actions to Delete

### Action 1 — User Registration

| Field | Value |
|-------|-------|
| **Name** | `User Registration` |
| **ID** | `57dc6f06-f2bf-41b0-ba11-9cec06f3de83` |
| **Trigger** | `post-login` (v3) — runs on every login |
| **Status** | Deployed (built, version 12) |
| **Runtime** | Node 22 |
| **Last updated** | 2026-05-18 |

**What it does:**

This is the primary action. On every user login it:

1. Reads `app_metadata.internal_id` from the Auth0 user profile.
2. If no `internal_id` exists, generates a new UUID using `crypto.randomUUID()` and attempts to persist it back to `app_metadata` via the Auth0 Management API.
3. Sets `https://armoury.app/internal_id` as a custom claim on both the **access token** and the **ID token**.
4. Also sets `https://armoury.app/email` and `https://armoury.app/name` claims.
5. After setting claims, calls the Armoury `/users/upsert` endpoint via an M2M token to create or update the user record in the database.

**Why it is safe to delete after migration:**

- The upsert logic has been moved into the application layer (Wave 1 tasks).
- All services now read user identity from the standard `sub` claim, not `https://armoury.app/internal_id`.
- The `https://armoury.app/email` and `https://armoury.app/name` claims are also no longer consumed by any service.
- Deleting this action means new logins will no longer have the `internal_id` claim in their tokens — which is the desired end state.

**Secrets configured on this action** (will be deleted with the action):

- `USER_UPSERT_API_URL`
- `AUTH0_DOMAIN`
- `AUTH0_TENANT_DOMAIN`
- `M2M_CLIENT_ID`
- `M2M_CLIENT_SECRET`
- `AUTH0_AUDIENCE`
- `SENTRY_DSN`

---

### Action 2 — User Registration - PreUserReg

| Field | Value |
|-------|-------|
| **Name** | `User Registration - PreUserReg` |
| **ID** | `45a12d0b-bff7-4f59-9c6f-dc8f2df435eb` |
| **Trigger** | `pre-user-registration` (v2) — runs when a new user signs up |
| **Status** | Deployed (built, version 1) |
| **Runtime** | Node 22 |
| **Last updated** | 2026-05-18 |

**What it does:**

This action fires once per new user, at the moment of account creation (before the user record is written to Auth0). It:

1. Generates a UUID using `crypto.randomUUID()`.
2. Calls `api.user.setAppMetadata("internal_id", internalId)` to pre-populate `app_metadata.internal_id` on the new user record.

This was an optimisation to ensure new users already have an `internal_id` in `app_metadata` before their first login, so the post-login action (Action 1) does not need to call the Management API on first login.

**Why it is safe to delete after migration:**

- New users no longer need an `internal_id` in `app_metadata`. Their identity is their Auth0 `sub`.
- The post-login action (Action 1) is also being deleted, so there is nothing left to consume the pre-populated value.
- Deleting this action has no effect on existing users.

**Secrets configured on this action**: None (uses `event.secrets.SENTRY_DSN` but no secrets were registered at the time of last update).

---

### Action 3 — User Registration - PostUserReg

| Field | Value |
|-------|-------|
| **Name** | `User Registration - PostUserReg` |
| **ID** | `bcf828c7-cf08-46d2-9135-34cd669b27dc` |
| **Trigger** | `post-user-registration` (v2) — runs after a new user is created |
| **Status** | Deployed (built, version 1) |
| **Runtime** | Node 22 |
| **Last updated** | 2026-05-18 |

**What it does:**

This action fires once per new user, immediately after the user record is written to Auth0. It:

1. Reads `app_metadata.internal_id` (set by Action 2 above).
2. Calls the Armoury `/users/upsert` endpoint via an M2M token to create the user record in the database immediately at signup, rather than waiting for the first login.

This was a belt-and-suspenders approach: Action 2 pre-populates `internal_id`, Action 3 immediately upserts the user to the DB, and Action 1 handles subsequent logins.

**Why it is safe to delete after migration:**

- The upsert-on-registration logic has been moved into the application layer.
- There is no longer a need to call the upsert endpoint from Auth0 Actions.
- Deleting this action has no effect on existing users.

**Secrets configured on this action** (check the dashboard — may include M2M credentials and `USER_UPSERT_API_URL`).

---

## Pre-Deletion Checklist

Complete **all** of the following before deleting any action:

- [ ] Wave 1 (database schema changes) is deployed to production
- [ ] Wave 2 (application code changes — services reading `sub` instead of `internal_id`) is deployed to production
- [ ] At least one successful login has been observed in production logs after Wave 2 deployment
- [ ] No errors related to missing `internal_id` claim appear in Sentry or CloudWatch logs
- [ ] You have confirmed with the engineering team that the migration is complete

---

## Step-by-Step Deletion Instructions

You will delete each action individually. The order does not matter, but deleting all three in the same session is recommended to avoid a partial state.

### How to navigate to Actions in the Auth0 Dashboard

1. Open your browser and go to [https://manage.auth0.com](https://manage.auth0.com).
2. Log in with your Auth0 administrator account.
3. In the left sidebar, click **Actions**.
4. Click **Library** (this shows all actions, not just those in a flow).

You should see a list of all actions. Locate each action by name as listed below.

---

### Delete Action 1: "User Registration"

> This action is attached to the **Login** flow. You must **remove it from the flow first**, then delete it.

**Step 1 — Remove from the Login flow:**

1. In the left sidebar, click **Actions** → **Flows**.
2. Click **Login**.
3. You will see a visual pipeline. Find the **"User Registration"** action block in the pipeline.
4. Click the action block to select it.
5. Click the **trash / remove** icon (or right-click and choose **Remove**) to detach it from the flow.
6. Click **Apply** (top right) to save the flow.

**Step 2 — Delete the action from the Library:**

1. In the left sidebar, click **Actions** → **Library**.
2. Find **"User Registration"** in the list.
3. Click the **⋮** (three-dot menu) on the right side of the row.
4. Click **Delete**.
5. A confirmation dialog will appear. Type the action name or click **Confirm** to proceed.
6. The action is now deleted.

**Verify**: Refresh the Library page. "User Registration" should no longer appear.

---

### Delete Action 2: "User Registration - PreUserReg"

> This action is attached to the **Pre User Registration** flow.

**Step 1 — Remove from the Pre User Registration flow:**

1. In the left sidebar, click **Actions** → **Flows**.
2. Click **Pre User Registration**.
3. Find the **"User Registration - PreUserReg"** action block in the pipeline.
4. Click the action block, then click the **trash / remove** icon.
5. Click **Apply** to save the flow.

**Step 2 — Delete the action from the Library:**

1. In the left sidebar, click **Actions** → **Library**.
2. Find **"User Registration - PreUserReg"** in the list.
3. Click the **⋮** (three-dot menu) → **Delete**.
4. Confirm the deletion.

**Verify**: Refresh the Library page. "User Registration - PreUserReg" should no longer appear.

---

### Delete Action 3: "User Registration - PostUserReg"

> This action is attached to the **Post User Registration** flow.

**Step 1 — Remove from the Post User Registration flow:**

1. In the left sidebar, click **Actions** → **Flows**.
2. Click **Post User Registration**.
3. Find the **"User Registration - PostUserReg"** action block in the pipeline.
4. Click the action block, then click the **trash / remove** icon.
5. Click **Apply** to save the flow.

**Step 2 — Delete the action from the Library:**

1. In the left sidebar, click **Actions** → **Library**.
2. Find **"User Registration - PostUserReg"** in the list.
3. Click the **⋮** (three-dot menu) → **Delete**.
4. Confirm the deletion.

**Verify**: Refresh the Library page. "User Registration - PostUserReg" should no longer appear.

---

## Post-Deletion Verification

After deleting all three actions, verify that login still works correctly.

### 1. Test login in production

1. Open the Armoury web application in an **incognito / private browser window**.
2. Click **Log In**.
3. Complete the login flow with a real user account.
4. Confirm you are redirected to the application and can see your account data.

### 2. Verify the JWT no longer contains `internal_id`

After logging in, inspect the access token to confirm the old claim is gone:

1. Open browser DevTools → **Application** tab → **Local Storage** or **Session Storage**.
2. Find the stored access token (or use the Auth0 debug tool at [https://jwt.io](https://jwt.io)).
3. Paste the access token into [https://jwt.io](https://jwt.io).
4. In the **Payload** section, confirm:
   - `https://armoury.app/internal_id` is **absent** ✅
   - `sub` is present and contains the Auth0 user ID (e.g. `auth0|abc123`) ✅

### 3. Check Sentry for errors

1. Open [Sentry](https://sentry.io) and navigate to the Armoury project.
2. Filter to the last 30 minutes.
3. Confirm there are no new errors related to:
   - `internal_id` claim missing
   - Authentication failures
   - 401 / 403 responses from any Armoury service

### 4. Check Auth0 logs

1. In the Auth0 dashboard, go to **Monitoring** → **Logs**.
2. Filter to the last 30 minutes.
3. Confirm there are no `f` (failed login) events.
4. Confirm there are `s` (success) events for recent logins.

### 5. Test new user registration (optional but recommended)

1. Create a new test account using a fresh email address.
2. Confirm the registration completes successfully.
3. Confirm the new user can log in and access the application.
4. Confirm the new user's JWT does **not** contain `https://armoury.app/internal_id`.

---

## Rollback Plan

If login breaks after deleting the actions:

> **Note**: Deleted Auth0 Actions cannot be restored from the dashboard. You must recreate them manually.

1. **Immediate mitigation**: The application code (after Wave 2) does not depend on `internal_id`. If login is broken, the root cause is likely elsewhere (e.g. a misconfigured flow, not the deleted actions).
2. **Check Auth0 logs** first — look for the specific error code in the failed login event.
3. **If the actions must be recreated**: The source code for all three actions is preserved in git history. Retrieve it from the commit that introduced the migration and recreate the actions manually via the Auth0 dashboard or CLI.

---

## Reference

| Action Name | Action ID | Trigger |
|-------------|-----------|---------|
| User Registration | `57dc6f06-f2bf-41b0-ba11-9cec06f3de83` | post-login |
| User Registration - PreUserReg | `45a12d0b-bff7-4f59-9c6f-dc8f2df435eb` | pre-user-registration |
| User Registration - PostUserReg | `bcf828c7-cf08-46d2-9135-34cd669b27dc` | post-user-registration |

Custom claim being removed: `https://armoury.app/internal_id`  
Replacement: standard `sub` claim (Auth0 user ID)
