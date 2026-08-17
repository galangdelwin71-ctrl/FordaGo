# Coach Dashboard — Implementation Plan

Status: **DONE (frontend) — final architecture differs from the original
plan below; see §3.1a for what was actually built.** Only §5 item 15
(Propose Workout Plan modal upgrade) remains open.

## Locked decisions (2026-08-16)
1. **Requests are approval-gated.** New client-initiated conversations start as `pending`; coach must Accept (→ `active`) or Decline (→ `declined`) before it's a real client thread. Coach-initiated conversations stay `active` immediately (a coach doesn't need to approve their own outreach).
2. **Coach self-service profile editing is ON.** Admin still creates the coach account/profile (`AdminCoachController` unchanged). Once created, the coach can edit their own `bio`, `specialty`, `rate`, `photo_url` via a new `PUT /api/coaches/profile/me`. `is_active`, `user_id`, and account credentials stay admin/self-account-managed respectively — not touched by this endpoint.
3. **Availability + Programs are built now, merged into Phase 1 — nothing left as "Coming soon".** §5 below reflects the merged single-phase delivery order actually used.

> Execution status: backend (migrations → models → controllers → routes) is
> complete as of this pass. Frontend (guard, nav, dashboard page, proposal
> modal upgrade) is the next pass — see §7.

Scope: rebuild the coach-side experience (dashboard, clients, workout proposal
builder) to match the reference screenshots, and align the backend/database
so every number shown is real data — nothing hardcoded or fake.

---

## 1. What exists today (verified against the actual codebase)

| Area | Status |
|---|---|
| `coach_profiles` table | ✅ exists — `bio`, `specialty`, `photo_url`, `rate`, `is_active`, `created_by` |
| `conversations` table | ✅ exists — `coach_id`, `client_id`, unique pair. **No status column** (every conversation is instantly "active", there's no request/approval step) |
| `messages` table | ✅ exists — text + proposal types |
| `workout_plan_proposals` table | ✅ exists — session date/time/duration/price/location/status(pending/accepted/expired), linked to a conversation + message |
| `workout_plan_items` table | ✅ exists — exercises per proposal |
| `workout_sessions` table | ✅ exists, but **personal-only**: `user_id`, free-text `coach` name string. **No `coach_id` FK, no `proposal_id` FK.** Can't reliably query "today's sessions for coach X" by joining — only by going through `workout_plan_proposals` (coach_id + session_date), since `accept()` always creates exactly one session per accepted proposal. |
| Coach self-service profile editing | ❌ Not implemented — bio/specialty/rate/photo can only be set by an admin (`AdminCoachController`), by design (comment in code confirms this is intentional). |
| "Requests" (pending, needing response) | ❌ Doesn't exist as a concept — `startConversation()` creates an active conversation immediately, no approval gate. |
| Coach availability | ❌ Not implemented anywhere. |
| Coach "Programs" (reusable templates) | ❌ Not implemented — proposals are one-off, built from scratch each time. |
| Earnings | ❌ No ledger table, but **derivable** without one: `SUM(price)` of this coach's `workout_plan_proposals` where `status = 'accepted'` and `accepted_at` falls in the current month. |
| Coach-specific routing/navigation | ❌ Doesn't exist — coach and member accounts currently share the exact same routes (`/dashboard`, `/schedule`, etc.) and bottom nav. The only place I already made role-aware is the coaching panel (previous fix). |
| "Propose Workout Plan" modal (chat page) | ✅ Already exists and is close to your reference image — flat quick-add exercise chips + manual sets/reps builder. **Missing the "Workout Type → Specific Target → recommended exercises" flow** that `Add Workout` (Schedule page) already has via `workout-templates.ts`. |

---

## 2. Decisions I need your sign-off on

These are the ambiguous parts of the mockups that touch the database. I've
picked the option that needs the **least new schema** and is the most
standard pattern, but flagging them so you can override before I build:

1. **"Requests" tab** (Image 3, "3 Requests · Needs response") — I'll treat
   this as: *a client started a conversation with the coach, but the coach
   hasn't sent a reply yet.* This needs **one new column**:
   `conversations.status` (`pending` | `active` | `declined`), defaulting to
   `pending` when a client starts it, flipping to `active` the moment the
   coach sends any message or explicitly accepts. This gives you a real
   Accept/Decline action in the Requests tab.
   - *Alternative if you don't want an approval gate at all:* every new
     conversation is auto-"active" (today's behavior) and "Requests" instead
     just means *unread conversations* — zero schema change, but no
     accept/decline action. Let me know which you want.

2. **"Sessions Today" / "Active Clients" / "Earnings"** stat cards — computed
   live from existing tables (see §4), no new tables needed:
   - Active Clients = distinct `client_id` count in `conversations` where
     `coach_id = me` (and `status = 'active'` if we add #1).
   - Sessions Today = `workout_plan_proposals` where `coach_id = me`,
     `status = 'accepted'`, `session_date = today`.
   - Earnings this month = `SUM(price)` of accepted proposals this month.

3. **"Set Availability"** (Quick Action in Image 3) — genuinely new feature,
   not in scope of "align backend to what exists" — it needs a new table
   (`coach_availability`: day-of-week + time ranges, or date-specific
   blocks). Recommend **Phase 2**, not required to make the dashboard honest
   — I'll show the button but can wire it to a "Coming soon" state or fully
   build it, your call.

4. **"Create Program"** (reusable workout templates to send faster) — also
   genuinely new (`coach_programs` + `coach_program_items` tables, basically
   a saved/reusable version of a proposal). Recommend **Phase 2**.

5. **Coach self-editing their own profile** ("Manage Profile" quick action)
   — today only an admin can edit bio/specialty/rate/photo. Do you want
   coaches to self-edit? If yes, this needs one new endpoint
   (`PUT /api/coaches/profile/me`) — small, no schema change, but is a
   deliberate policy change from the existing "admin-only" comment in the
   code, so I want your explicit go-ahead before removing that restriction.

**My recommendation:** ship Phase 1 (below) first — it makes the dashboard
100% real using only additive, low-risk changes (#1 and #2, plus #5 if you
want self-editing). Treat Availability and Programs (#3, #4) as Phase 2
once the core dashboard is live and you've confirmed you actually want
those features before I spend schema/backend effort on them.

---

## 3. Frontend architecture

### 3.1 Role-aware shell — SUPERSEDED, see §3.1a
The plan below (separate `/coach-dashboard` route, `CoachGuard`,
`CoachBottomNav`) was the original direction but was overridden by a later
product decision: a coach account must look and feel like a completely
normal member account — same login destination, same bottom nav, same
shell — with coaching management reachable only through the existing
header button. §3.1a documents what was actually built.

### 3.1a Role-aware shell (ACTUAL — final architecture)
- `AuthService.isCoachAccount()` reads `has_coach_profile` off the stored
  user object (`/auth/login` / `/users/me` include it) — used only by the
  (now-removed) `CoachGuard`; the panel itself resolves role independently
  via `GET /coaches/profile/me` → `has_profile`, so it never depends on
  this flag being fresh.
- **No separate route, no separate guard, no separate bottom nav.** Every
  member page (`dashboard`, `schedule`, `profile`, `equipment`,
  `inventory`, `qr-scanner`) keeps its normal `fordago-bottom-nav` (Home /
  Schedule / Scan / Shop / Profile) unconditionally, coach or not.
- Login (`login.page.ts`) and `guestGuard` (`app.routes.ts`) both send
  every non-admin account to `/dashboard` — no coach branch.
- The header's existing coaching button (`app-header`'s `coachingClick`
  output, the person/dumbbell icon) toggles `<app-coaching-panel>` in as an
  **in-flow replacement for `<ion-content>`** on whichever page it was
  tapped from — header and footer stay mounted the whole time, only the
  content pane swaps. Implemented identically on all 5 pages via a shared
  `coachingPanelOpen` flag + `onCoachingClick()`.
- `shared/coaching-panel/coaching-panel.component.ts` resolves `isCoach`
  on every open (via `getMyCoachProfile()`) and renders one of two bodies:
  the member Explore/Messages tabs (`isCoach === false`) or the full coach
  dashboard content — profile card, 4 stats, Quick Actions, My
  Clients/Requests/Messages tabs, Today's Sessions, Manage
  Profile/Availability/Program modals (`isCoach === true`, `cd-`-prefixed
  markup/styles). This is the account's single entry point into coaching
  management.
- The old standalone `coach-dashboard.page.ts/.html/.scss` and
  `coach.guard.ts` are archived (not deleted — no delete tool was
  available) under `fordaGo/_deprecated/coach/`, fully outside
  `frontend/src`, so they're excluded from the Angular build graph.

### 3.2 New pages — SUPERSEDED
No new pages/routes were added. Everything coach-specific lives inside
`shared/coaching-panel/coaching-panel.component.ts` (see §3.1a). The
`coach/coach-clients/` sub-page and a `profile.page.ts` coach-mode branch
described below were never built — the panel's own My Clients tab and
Manage Profile modal cover that ground instead.
- Reuse existing `chat.page.ts` for messaging + proposal builder (already
  role-aware via `isCoach` getter) — just upgraded per §3.3.

### 3.3 "Propose Workout Plan" modal upgrade (chat page)
Bring it to parity with `Add Workout` (Schedule page) by reusing the
**same shared data source** (`data/workout-templates.ts` —
`buildExercisesFromTemplate`, and the `workoutTypes`/`suggestedTargetsMap`
that currently live duplicated inside `schedule.page.ts`):

- Add **Workout Type** dropdown (Upper Body, Lower Body, Cardio & Core,
  etc. — same list `Add Workout` uses).
- Add **Specific Target** input + suggestion chips (Back & Bicep, etc.),
  same as `Add Workout`.
- Selecting a type/target auto-fills **Recommended Exercises** into
  `proposalForm.items` (coach can still edit sets/reps/notes per exercise
  or add more manually) — replaces today's flat 10-item "Quick Add" chip
  list, which has no category structure.
- Keep Session Date/Time/Duration/Price/Location as-is (already matches
  your reference image); add the Min/Hrs duration toggle from `Add
  Workout` for consistency.
- **Refactor first**: move `workoutTypes`, `suggestedTargetsMap`, and the
  `getSuggestedTargets`/`getTargetPlaceholder` helpers out of
  `schedule.page.ts` into a shared service (or extend
  `workout-templates.ts`) so both `Add Workout` and `Propose Workout Plan`
  read from one source — avoids the exact kind of drift that caused the
  coaching-panel bug I just fixed.

---

## 4. Backend changes

### 4.1 New/changed endpoints
| Method & Path | Purpose |
|---|---|
| `GET /api/coaches/dashboard-stats` | Returns `{ active_clients, sessions_today, pending_requests, earnings_this_month }` — one call for the whole stats row, computed live (see §2.2). |
| `GET /api/coaches/requests` | Conversations with `status = 'pending'` where `coach_id = me` (only if decision #1 = approval-gated). |
| `POST /api/conversations/{id}/accept` | Coach accepts a pending request → `status = 'active'`. |
| `POST /api/conversations/{id}/decline` | Coach declines → `status = 'declined'` (hidden from both sides' active lists, kept for audit). |
| `PUT /api/coaches/profile/me` | Self-service profile edit (only if decision #5 = yes). Validates same fields `AdminCoachController::update` already validates. |
| `GET /api/coaches/clients` | Already exists — extend response to include each client's **next upcoming session** (from `workout_plan_proposals`) for the dashboard's "Today's Sessions" list. |

### 4.2 Database migrations (additive, non-breaking)
```
2026_xx_xx_add_status_to_conversations_table.php
    conversations.status ENUM('pending','active','declined') DEFAULT 'active'
    -- defaults to 'active' so every EXISTING row keeps working unchanged;
    -- only newly-created conversations from the updated ConversationController
    -- get created with 'pending' when started by a client.

2026_xx_xx_add_coach_id_and_proposal_id_to_workout_sessions_table.php
    workout_sessions.coach_id   INT NULL, FK -> users.id, nullOnDelete
    workout_sessions.proposal_id UNSIGNED INT NULL, FK -> workout_plan_proposals.id, nullOnDelete
    -- backfilled for existing accepted-proposal sessions where possible;
    -- makes "sessions today for this coach" a direct indexed query instead
    -- of going through proposals, and is needed for any future feature
    -- that lets a coach edit/cancel a session they created.
```
No columns are removed or renamed — fully backward compatible with existing
data and the member-side Schedule page, which never has to know these
columns exist.

### 4.3 Models to update
`Conversation` (add `status` to `$fillable`), `WorkoutSession` (add
`coach_id`, `proposal_id` to `$fillable` + relations), `CoachProfile`
(no change unless #5 approved, then confirm `$fillable` already covers
`bio/specialty/photo_url/rate`).

---

## 5. Delivery order (single merged phase, all items in scope)

**Backend — DONE this pass**
1. ✅ DB: `conversations.status` (default `active`, backward compatible).
2. ✅ DB: `coach_availability` table (weekly recurring slots).
3. ✅ DB: `coach_programs` + `coach_program_items` tables (reusable templates).
4. ✅ DB: `workout_sessions.coach_id` / `proposal_id` FKs, with a read-only
   backfill migration that recovers both from the existing
   `coach-plan-{proposalId}-{ts}` `client_session_id` pattern.
5. ✅ Models: `Conversation` (status + helpers), `WorkoutSession` (coach/
   proposal relations), new `CoachAvailability`, `CoachProgram`,
   `CoachProgramItem`; `User` gains `coachAvailability()`/`coachPrograms()`.
6. ✅ `ConversationController::start()` now creates client-initiated threads
   as `pending`; new `accept()`/`decline()` actions.
7. ✅ `MessageController::store()` implicitly activates a pending thread the
   moment the coach replies, and blocks messages on a declined thread.
8. ✅ `CoachController`: `dashboardStats()`, `requests()`,
   `updateMyProfile()` (bio/specialty/photo_url/rate only — `is_active`/
   `user_id`/credentials stay out of reach), `clients()` upgraded to only
   list `active` conversations plus each client's next accepted session.
9. ✅ New `CoachAvailabilityController` and `CoachProgramController`, both
   scoped to `$request->user()->id` and gated by `isCoach()`.
10. ✅ Routes wired in `routes/api.php` (static segments ordered before the
    `/{id}` wildcard so they can never be shadowed).

**Before this backend work is live, run the new migrations:**
```
cd backend
php artisan migrate
```
All four new migrations are additive/nullable — nothing existing breaks if
you run this against your current database, and `down()` is implemented for
every one if you ever need to roll back.

**Frontend — DONE, final architecture (see §3.1a)**
11. ~~`CoachGuard`, coach routing redirect after login, `CoachBottomNav`~~ —
    superseded. No coach guard, no coach-specific redirect, no separate
    bottom nav: a coach account uses the exact same shell as a member.
12. `CoachingPanelComponent` wired to the real endpoints above (via
    `CoachingService`) — no fake counts, no placeholder clients, full
    parity with the reference screenshot, rendered inside the shared panel
    instead of a standalone `CoachDashboardPage`.
13. Coach "Manage Profile" self-edit modal calling `PUT /coaches/profile/me`
    — done, lives inside the panel.
14. "Set Availability" and "Create Program" modals calling the new
    endpoints — done, lives inside the panel.
15. Refactor workout-type/target data (currently duplicated inside
    `schedule.page.ts`) into a shared source; upgrade the Propose Workout
    Plan modal to use it (Workout Type + Specific Target + recommended
    exercises), matching what "Add Workout" already does. — **still open,
    not yet done.**

---

## 6. Locked decisions recap (already confirmed, no longer open)

- Decision **#1**: approval-gated Requests — confirmed.
- Decision **#5**: coach self-edits own profile — confirmed.
- Availability + Programs: build now, not "Coming soon" — confirmed.

## 7. Next step

Only one item from this plan is still open: §5 item 15, the Propose
Workout Plan modal upgrade (Workout Type + Specific Target + recommended
exercises, sourced from a shared `data/workout-templates.ts` instead of
the duplicated lists currently inside `schedule.page.ts`). Everything else
in §5 is done, on the shell described in §3.1a rather than the original
guard/route/CoachBottomNav plan in §3.1/§3.2 (kept above for history, not
as current instructions).
