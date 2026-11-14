# CollabU polish plan

This file covers what I found reading the repo, the starting point I measured, and what I plan to do in each phase. I will stop after writing this and wait for your OK before every phase.

Questions I need answered are marked **[ASK]**. The list at the bottom collects them in one place.

---

## 0. Starting point (measured 2026-10-29)

| Check | Result |
|---|---|
| Backend tests | **0 tests.** `tests/test_auth.py` and `tests/test_projects.py` are empty files. The `*.sh` scripts are manual curl scripts, not tests. |
| Frontend tests | None, and no test runner is installed. |
| Frontend lint | 9 errors, 2 warnings (unused variables, hook dependency warnings). |
| Frontend bundle | **One JS file: 556.57 kB (175.89 kB gzipped).** CSS 38.56 kB (7.23 kB gzipped). Vite warns it is over 500 kB. |
| `console.*` calls | 14 (Dashboard 5, ProjectDetail 6, Calendar 2, calendarService 1). |
| Unused packages | `react-hook-form` (never imported). `@tanstack/react-query` is installed and the provider is set up, but no page uses it. Backend: `Flask-Mail`, `bcrypt`, `pytz` are unused or nearly unused. |

I ran the main API flow against a throwaway in-memory database (your `collabu_dev.db` was not touched). Things that are **broken right now**, not just unpolished:

1. **Creating a project from a template crashes (500).** The frontend sends the deadline as `...Z` (UTC). The task generator then subtracts a timezone-aware date from a plain one and Python throws. Blank projects work, template projects do not.
2. **The "Calculate schedule" button 404s.** The frontend calls `/api/deadline/projects/:id/calculate-schedule`, but `deadline_controller.py` is never registered. A copy of the same route lives in `task_controller.py` at a different URL, and that one works.
3. **Notifications and files endpoints 404.** Their blueprints exist but are never registered. Their database tables also have no migration, so they would fail on Render even if registered.
4. **Overlapping calendar blocks are silently dropped.** The API returns 200 with a warning and does not save the block, but the frontend shows "Busy time added!".
5. **Times shift by your UTC offset.** The backend stores UTC but sends it back without a `Z`, so the browser reads it as local time. A class at 10:00 can show at 3:00 or 17:00 depending on where you are. Each page also formats dates its own way.
6. **The kanban board hides tasks.** It only has To Do, In Progress and Completed columns. Tasks in `review` or `blocked` exist in the database but never show up.
7. **"My tasks" returns every task in every project you are in,** not the ones assigned to you. The dashboard "Upcoming Tasks" list therefore shows your teammates' work too. It also always shows "Project" as the project name because the API never sends it.

Security and privacy problems:

- `GET /api/users` returns every user's name and email to anyone logged in. The add-member modal uses it. The invite-by-email flow in phase 2 replaces this.
- Files list has no membership check (any logged-in user could list any project's files once it is registered).
- A task can be assigned to someone who is not in the project.
- `project_members` has no unique constraint, so the same person can be added twice by a race.
- `create_app()` has hard-coded fallback secrets (`jwt-secret-key-change-in-production`). Render generates real ones so it is fine today, but if the env var is ever missing the app silently runs with a public secret. `config.py` has the right idea (refuses to run without secrets) but `create_app()` never uses it.

Other things worth knowing:

- **Duplicated code.** `auth_controller` repeats `auth_service`; `calendar_controller` repeats `calendar_service` (and the service is never used); the schedule route exists twice; `utils/decorators.py` and `commands.py` are never wired up. `ProjectSchema` exists twice.
- **The scheduling algorithm** (details in phase 1) has several logic bugs on top of the slow queries: it schedules every task back to back as if only one person were working, it overwrites assignments and dates on tasks that are already completed, it ignores blocks that partly overlap the date range, and two of its three warnings can never or always fire.
- **The "AI" task generator is keyword matching** against hard-coded templates. That is fine and it works, but the UI calls it "AI Task Generation". I suggest the UI just say "Suggested tasks" so nobody is misled. **[ASK]**
- `docker-compose.yml` points at Dockerfiles that do not exist, so `docker-compose up` fails.
- `database/schema.sql` is a hand-written copy of the schema that has already drifted from the migrations. Migrations should be the only source of truth.
- The `backend/*.sh` scripts hard-code a login password and 2025 dates. Pytest tests and the phase 4 seed script replace all of them.
- Python: your venv is 3.14, `render.yaml` says 3.11.0. They should match. I suggest pinning both to 3.12 (stable, supported by every package here). **[ASK]**
- Tailwind v3.4 is installed.

---

## How I will work (applies to every phase)

- A git branch per phase (`phase-1-audit`, etc.) so `main` keeps working. Small commits inside it. You merge when happy.
- Tests first for new or changed behavior, then code, then run the full suite.
- Backend: pytest with an in-memory SQLite DB and fixtures for "a user", "a project with members", etc.
- Frontend: vitest + React Testing Library + jsdom. I will test logic (date helper, hooks, optimistic update, components with behavior), not snapshot every pixel.
- At the end of each phase: plain English summary of what I did and why, test results, anything I need from you.

---

## Phase 1: audit fixes + speed

Split into two halves so each lands as its own set of commits. Backend first, because the frontend changes depend on the new error format and date format.

### 1A. Backend

**Test setup and safety net (first)**
- Add pytest, a `conftest.py` with an app factory using in-memory SQLite, and helpers to create users/projects/tasks.
- Write tests for what works **today** (register, login, project CRUD, members, task CRUD, status changes, calendar CRUD) before changing anything, so I can prove I did not break them.

**Fix the broken things listed in section 0** (each with a test that fails first)
- Template project creation with a `Z` deadline.
- One schedule route, registered, at the URL the frontend calls.
- Overlapping blocks: save the block and return the overlap as a warning (I think you want both your class and your lab saved; the scheduler handles overlap fine). **[ASK]** if you would rather reject overlaps with an error.
- "My tasks" returns tasks assigned to me, and includes the project title.
- Assignee must be a project member.
- Unique constraint on (project, user) in `project_members`.

**One app config**
- `create_app()` uses `config.py` (dev / test / prod classes). Production refuses to start without real secrets. No more hard-coded fallback secrets.

**One JSON error format**
Every error, everywhere, looks like:
```json
{ "error": { "code": "NOT_FOUND", "message": "Task not found", "details": {} } }
```
- Services raise small exception classes (`NotFound`, `Forbidden`, `Conflict`, `ValidationFailed`) instead of returning `(result, error)` tuples. One error handler turns them into the JSON above. Marshmallow errors, 404s for unknown URLs, 405s, JWT errors and unexpected 500s all go through it too.
- Why: right now every controller has its own `if error: status_code = 404 if ... else 403` block, and they disagree (the same error is a 403 in one place and a 500 in another).

**Permission decorator**
- `@project_access(role="member")` / `@project_access(role="admin")` looks up the project (or the task's project), checks membership, and hands the project to the route. Replaces about 12 copies of the same `ProjectMember.query.filter_by(...)` block.

**Remove duplicates and dead code**
- Delete `deadline_controller.py` (or the copy in tasks, whichever ends up as the one route), the unused `decorators.py`, duplicate `ProjectSchema`, controller code that repeats services. Controllers become thin: parse input, call service, return JSON.
- Wire up `commands.py` (or delete it if you never use those commands). **[ASK]**
- Remove unused packages from `requirements.txt`.
- Delete `database/schema.sql`, the `*.sh` scripts, and the broken `docker-compose.yml` (phase 4 gives you one command to run everything). **[ASK]** if you want to keep Docker.

**Queries**
- Project list currently loads owner, every member's user, every task and every task's assignee one query at a time (for 5 projects with 10 tasks each that is roughly 60+ queries). Fix with `selectinload`, and have the list return task counts per status instead of every task, since the dashboard only shows progress and the next task.
- Project tasks: `selectinload` assignees.
- I will add a test helper that counts queries so tests can assert "project list uses at most N queries no matter how many projects".

**Indexes** (one migration)
- `tasks(project_id, status)`, `tasks(assigned_to)`, `tasks(due_date)`
- `project_members(user_id)` plus the unique `(project_id, user_id)`
- `calendar_blocks(user_id, start_time)`
- `projects(created_by)`
- Honest note: at student-project scale (hundreds of rows) indexes barely change speed. They are cheap and correct, so I will add them, but the real speed win in this phase is the N+1 fix and the bundle split.

**Pagination**
- I do **not** think every list should be paginated. The kanban board needs all of a project's tasks at once, and a student has maybe 3 to 15 projects. Paginating those adds code and makes the UI worse.
- Paginate the lists that grow forever: notifications and the activity feed (phase 2), comments if needed. Same shape everywhere: `?limit=&before=` (cursor style, newest first), response includes `next_cursor`.
- Calendar blocks already filter by date range; I will make the range required so the calendar only fetches what it shows.

**Dates**
- Store UTC everywhere (naive UTC in the DB, as now). Parse any incoming time with a timezone and convert to UTC. Always send times back with a `Z`. One helper module (`app/utils/time.py`) does this; models and schemas use it.

**Scheduling algorithm** (the main feature, so it gets the most tests)

What it does today, and what is wrong:
| Today | Problem |
|---|---|
| 1 query per member for the user, 1 per member for blocks | N+1. Replace with 2 queries total. |
| Schedules all tasks one after another on one timeline | With 4 people, task 5 waits for tasks 1 to 4 even if 3 people are idle. Each person should get their own timeline. |
| Reassigns and redates **every** task | Completed tasks get new dates. Tasks you assigned by hand get taken away. |
| Blocks only count if fully inside the range | A block that started yesterday and runs into today is ignored. |
| Subtracts all blocked hours from an 8h/day budget | A 10-hour "sleep" block wipes out a whole work day even though sleep is outside 9 to 5. Only the part of a block that overlaps work hours should count. |
| Due date is clamped to the deadline | So the "extends beyond deadline" warning can never fire, and the schedule looks achievable when it is not. |
| Unbalanced-workload warning uses `max > min * 2` | If anyone has 0 hours this is always true. |
| `days = hours / 8` in calendar days | Ignores that someone with 2 free hours on Tuesday cannot do 8 hours of work on Tuesday. |

Plan:
- Split into small pure functions that take plain data (no database): `free_hours_per_day(blocks, start, end)`, `pick_assignee(...)`, `place_task(...)`, `build_warnings(...)`. The service just loads data (2 or 3 queries), calls them, and saves. Pure functions are easy to test and fast.
- Only schedule tasks that are not completed. Keep existing assignees, only fill in unassigned tasks. **[ASK]** Is that what you want, or should "Calculate schedule" reassign everything?
- Each member has their own timeline built from their real free hours per day (work window minus the part of their blocks inside it). A task is placed in the earliest free hours of its assignee.
- Recurring blocks plug into this in phase 2 through one "expand blocks into occurrences" function.
- Weekends: **[ASK]** Should the default work window include Saturday and Sunday? Students do work weekends. I would default to 7 days a week, 9:00 to 17:00, in one constant so it is easy to change. (Per-user work hours would be a new feature, so I am not adding that unless you ask.)
- Warnings in plain text, no emojis.
- Tests: no tasks, no members, one person, uneven availability, blocks that partly overlap, completed tasks untouched, manual assignment kept, impossible deadline produces the right warning, query count stays flat as tasks grow.

### 1B. Frontend

- **Test setup:** vitest, React Testing Library, jsdom.
- **Lazy load pages** with `React.lazy` + `Suspense`. `react-big-calendar` is the heaviest dependency and only Calendar uses it, so it moves out of the first download.
- **React Query for real:** right now every page uses `useState` + `useEffect` + manual reloads. I will move data fetching into small hooks per resource (`useProjects`, `useProject(id)`, `useProjectTasks(id)`, `useMyTasks`, `useCalendarBlocks(range)`) with a shared query key file so invalidation is not guesswork.
  - `staleTime` 30 seconds by default (data feels instant when you switch pages, and it still refreshes often), retry once, no refetch on every window focus for heavy lists.
  - Each mutation invalidates exactly the queries it affects (for example creating a task invalidates that project's tasks, the project list counts, and my tasks).
  - Optimistic update for moving a task between columns: the card moves immediately, rolls back with a toast if the server says no.
- **Kanban shows all five statuses** (To Do, In Progress, Review, Blocked, Completed). Needed anyway for "moved to review" notifications.
- **One date helper** (`src/lib/dates.js`): parse API times, format date / time / relative ("in 2 days"), convert `datetime-local` input values to UTC and back. Every page uses it. Tested with fixed timezones.
- **API errors:** one `getErrorMessage(error)` that reads the new error format. On 401 it logs out cleanly through the auth context instead of a hard `window.location` reload.
- Remove dead code (`App.css` is Vite boilerplate and unused, `assets/react.svg`, empty `utils/constants.js`), `react-hook-form`, all `console.*`, and fix all lint errors.
- **Bundle size:** I will report before vs after from `vite build` output (first load JS and total). Baseline: 556.57 kB / 175.89 kB gzipped in one file.

Not touching the look in phase 1. Pages keep their current design until phase 3.

### Phase 1 results (done, branch `phase-1-audit`)

| Measure | Before | After |
|---|---|---|
| Backend tests | 0 | 82 |
| Frontend tests | 0 | 21 |
| Lint problems | 11 | 0 |
| JS to open login (gzipped) | 175.9 kB | 101.8 kB |
| JS to open dashboard (gzipped) | 175.9 kB | 117.1 kB |
| JS to open calendar (gzipped) | 175.9 kB | 171.4 kB (calendar library now only loads here) |
| Queries for project list, 5 projects | 10 and growing | 6, flat |

Answers used: keep existing assignees, 9:00 to 17:00 every day in the user's timezone, save overlapping blocks with a warning, delete the stale files, Python 3.12, "Suggested tasks" wording.

---

## Phase 2: missing features

Too much for one phase, so I split it. Each part ends with a stop for your OK.

**What the stubs are and what I will do with them**
| Stub | State | Plan |
|---|---|---|
| `Notification` model + controller + service | Model is fine. Controller not registered, no migration, no "mark all read". | Keep and finish. |
| `Activity` model | Model only. | Keep and finish. |
| `File` model + controller | Model is fine. No upload, list has no permission check, delete compares the wrong types. | Keep model (small tweak: store a storage key instead of a URL), rewrite controller. |
| `email_service.py` | Three functions that raise `NotImplementedError`. | Rewrite small, behind an interface. |
| `google_drive_service.py` | Three functions that raise `NotImplementedError`. Nothing else exists (no OAuth, no frontend). | **Not almost done. It is 0% done.** I suggest deleting it and the `source='google_drive'` option so nobody thinks it works. Easy to add later. |
| `CalendarBlock.is_recurring` / `recurrence_pattern` | Columns exist, nothing uses them. | Replace with the weekly rule below. |
| `DeadlineService.suggest_reallocation` | Empty `pass`. | Delete. |

### 2A. Collaboration core

1. **Activity feed** (first, because notifications and other features log through it)
   - `ActivityService.log(project, actor, action, target)` called from services only (task created, status moved, assigned, file added, member joined, comment added).
   - `GET /api/projects/:id/activity` with cursor pagination.
   - Feed panel on the project page (replaces the current "recent activity" which just sorts tasks by `updated_at`).

2. **In-app notifications**
   - Triggers: assigned a task, a task assigned to me is due within 24 hours, someone joins my project (sent to the project owner), a task I created moves to review.
   - The model has no "created by" on tasks, so I will add `tasks.created_by` (one migration). Existing tasks get the project owner.
   - "Due in 24 hours" needs something to check the clock. Render's free plan has no background workers. Simplest option that needs nothing extra: when you fetch your notifications, the backend creates any missing "due soon" notifications for you (each task only once, enforced by the database). Since the bell polls, this behaves like a background job without one. The trade-off is that you only get it while the app is open, which is fine for in-app notifications.
   - Endpoints: list (paginated), unread count, mark one read, mark all read.
   - Bell with unread count, polling every 60 seconds with React Query (and paused when the tab is hidden).

3. **Email (console locally)**
   - `EmailSender` interface with one method `send(to, subject, text, html=None)`. Local dev uses `ConsoleEmailSender` that prints the email to the backend terminal. Tests use one that stores emails in a list.
   - Project invite emails (part of 4) and a daily "due soon" digest.
   - The digest needs a daily trigger. I will build it as a CLI command (`flask send-digest`) so it is easy to test and run by hand. For production there are two options, both outside the app code: a Render Cron Job (paid, cheap) or a free GitHub Actions schedule that runs once a day. **[ASK]** before production, along with which email provider (I would suggest Resend or Postmark, both have free tiers and simple APIs; SMTP through Gmail works but is fragile).
   - Respects the "email on/off" preference from the settings page.

4. **Invite by email**
   - Admin enters an email. Backend creates an `Invite` (project, email, role, random token, expiry 7 days) and emails a link `/invite/:token`.
   - Logged in and the email matches: accept page joins the project.
   - Not logged in: link goes to login or register with the invite remembered; after register/login it joins automatically.
   - Invited email belongs to someone else's account: shows a clear error instead of joining the wrong person.
   - Remove the "list all users" add-member flow and the `GET /api/users` list (privacy fix).
   - Admins can see pending invites and cancel them.

5. **Task comments**
   - Comment model, list (oldest first, newest at the bottom), add, delete own. Project admins can also delete? **[ASK]** You said "owner can delete their own". I will do only that unless you say otherwise.
   - Shows in a task detail panel (which also gives the kanban card somewhere to open to).

### Phase 2A results (done, branch `phase-2a-collab`, built on `phase-1-audit`)

- Backend tests 82 to 130, frontend tests 21 to 43, lint clean.
- Checked by hand in the browser: invite email printed in the terminal, new person registered from the link and joined, comment posted, owner's bell showed "joined" and "ready for review", mark all read cleared it.
- Pulled forward from 2B: the browser timezone is saved on the user at login, because the digest email needs local times.
- "A task I own is due in 24 hours" means a task assigned to me.
- Not logged or notified on purpose: tasks created from a template, and assignments made by Calculate schedule (they would flood the feed and the bell).

### 2B. Planning tools

6. **File attachments**
   - Upload (to a project, optionally a task), list, download, delete (uploader or project owner).
   - Limits: 10 MB per file, allowed types: pdf, images (png, jpg, gif, webp), office docs (docx, xlsx, pptx), txt, csv, md, zip. Type checked by extension and by sniffing the file's first bytes, not just trusting the browser. Filenames are sanitized and stored under a random key.
   - `Storage` interface with `save`, `open`, `delete`. `LocalStorage` writes to `backend/uploads/` (gitignored).
   - Downloads go through the API with a permission check, not a public URL.
   - **Production storage [ASK]**: Render's disk is wiped on every deploy, so production needs one of these. I would add exactly one:
     | Option | Cost | Notes |
     |---|---|---|
     | Cloudflare R2 | 10 GB free, no download fees | S3 compatible, my pick for a student project. |
     | AWS S3 | Free tier for 12 months, then cheap | The standard, more setup (IAM). |
     | Supabase Storage | 1 GB free | Easy, but adds another account. |
     | Render persistent disk | Paid plans only | Keeps it simple, but ties you to one server. |
     R2 and S3 use the same code (`boto3`), so picking R2 now means S3 later is a config change.

7. **Recurring calendar blocks**
   - Replace the unused `is_recurring` / `recurrence_pattern` with `repeat_days` (for example `MO,WE,FR`) and `repeat_until` (a date). The block's own start/end is the first occurrence's time.
   - One function `expand_occurrences(blocks, range_start, range_end)` turns stored blocks into actual time slots. Both the calendar API and the scheduler use it, so they cannot disagree.
   - Edit or delete applies to the whole series. Editing a single occurrence ("skip this Monday") is a lot more work; I am leaving it out unless you want it. **[ASK]**
   - Daylight saving: classes stay at the same local clock time across DST changes. To do this right the backend needs the user's timezone, so I will save the browser's timezone name on the user (sent on login). Without it, a 10:00 class would show at 9:00 or 11:00 after the clocks change.

8. **Workload view**
   - A tab on the project page: for each member, hours of open tasks due this week vs free hours this week (from the same availability function as the scheduler). A simple bar per person, with "over capacity" highlighted.
   - "This week" is Monday to Sunday in the viewer's timezone.

9. **Profile / settings page**
   - Change first/last name, change password (needs current password), email notifications on/off.

### Phase 2B results (done, branch `phase-2b-planning`, built on `phase-2a-collab`)

- Backend tests 130 to 179, frontend tests 43 to 67, lint clean.
- Answers used: Google Drive stub deleted, repeats edit or delete the whole series, files stored on local disk behind a small storage interface (cloud provider picked in phase 4).
- Checked by hand in the browser: uploaded and downloaded a PDF, Workload tab flagged an over capacity member, a Tue/Thu class showed on this week, next week (same local time after daylight saving ended) and in month view. Found and fixed a bug where moving to another week showed it empty.
- Not clicked through by hand: saving the settings page (covered by frontend and backend tests).
- GET /api/calendar/blocks now requires start and end and returns one entry per repeat.
- Deleting a task keeps its files on the project instead of deleting them.

---

## Phase 3: the planner look

**Stopping point:** I build the tokens, fonts, base components, and the **dashboard only**, then stop for your feedback before touching any other page.

**Design tokens in one place**
- CSS variables in `src/styles/tokens.css` for colors, fonts, radius, shadows, spacing scale; Tailwind theme maps to those variables so classes like `bg-paper text-ink` work and dark mode only swaps variables.
- Light ("desk"): warm off-white paper, ink navy text, tomato red accent used only for urgent, overdue and due today. Muted secondary colors for statuses (pencil gray, faded blue, sage) so the red stands out.
- Dark ("chalkboard"): dark green-black board, chalky off-white text, the accent becomes a chalk-friendly coral so it still passes contrast.
- One note on highlighter yellow: it is great as a background mark (like highlighting today's date) but fails contrast as text color on paper. If you want it, I would use it only as a highlight behind ink-colored text. I would pick tomato red as the one accent. **[ASK]**

**Fonts** (fontsource, loaded locally)
- I agree with your combo with one pick: **Young Serif** for headings rather than Gloock. Gloock is very high contrast and only comes in one weight, so it looks like a magazine cover; Young Serif is chunkier and friendlier, closer to a notebook label. **Hanken Grotesk** for body, **IBM Plex Mono** for dates and times (with tabular numbers so they line up).

**Libraries** (all fine choices, none overkill)
- Base UI for dialog, menu, popover, select, tabs, tooltip. Phosphor duotone icons replace lucide. sonner replaces react-hot-toast. motion for the subtle animations with `prefers-reduced-motion` respected. dnd-kit with keyboard sensor for the board. cmdk for Ctrl/Cmd+K.
- I will check the exact current Base UI package name and API when I install it, since it changed names during its beta.
- `react-big-calendar`: I plan to keep it and restyle it with CSS (notebook rule lines, mono times). Writing our own week view would look nicer but is a big job. If after the dashboard review you want a custom calendar, we can decide then.

**Tailwind v4 [ASK]**
- v3.4 is installed. Since phase 3 rewrites nearly every class anyway, this is the cheapest moment to upgrade. v4 is built around CSS variables (`@theme`), which is exactly how the tokens above work, and it is faster to build. The cost is about an hour of config migration. I recommend upgrading at the start of phase 3, but only if you say yes.

**Every page gets**
- Skeleton loading states, empty states that say what to do next, error states with a retry button.
- Mobile layouts (kanban scrolls column by column on a phone, bottom-friendly buttons), keyboard navigation, visible focus rings, contrast checked in both themes.

**Dashboard checkpoint (branch `phase-3-design`, waiting for feedback):** Tailwind v4, tokens with a contrast test for both themes, fonts, sonner, Base UI header (menu, popover) and dialog, and the redesigned dashboard. 125 frontend tests. Dashboard first load is 193.7 kB gzipped (phase 1 ended at 117.1 kB); most of the difference is Base UI and its positioning library. motion's full build is kept off the dashboard and saved for the kanban board.

**Dashboard round 2 (after your "still looks AI" feedback):** rebuilt after researching Atlassian's and Google's redesigns. App frame with a project sidebar (collapsible), search and Create in the top bar, Ctrl/Cmd+K command menu, phone bottom bar with a projects drawer. Home is now My work (grouped Late, Today, Next 7 days, Later, check off in place with Undo) beside a compact project list. 14px body text, flat surfaces, serif only for the wordmark and page titles, status labels. 132 frontend tests.

**Phase 3 results (all pages restyled, branch `phase-3-design`):** login, register and invite on one quiet card; project page with header, Base UI tabs (Board, Workload, Activity, Files, Team), a dnd-kit kanban (mouse, touch and keyboard, plus a Move to menu), index-card tasks that tilt while lifted and glide between columns, a task side panel with delete after confirming, and admin member removal; calendar with its own toolbar, mono times, notebook rules and hatched busy time; settings in the app frame; a Reload screen instead of a blank page when a page fails to load. Old styles, the v3 compatibility rule and lucide-react are gone. 159 frontend tests, 180 backend tests.

First load (gzipped): login 115.2 kB, Home 199.7 kB, project page 251.4 kB (+33.1 kB animation after), calendar 267.5 kB, settings 192.6 kB. The calendar is mostly react-big-calendar.

Not done in phase 3: a dark mode toggle (dark follows the system), reordering cards inside a column (needs a saved position on tasks), editing a single repeat of busy time.

**Order after your dashboard feedback:** login/register, project detail (kanban, task panel, activity, files, workload), calendar, notifications, settings, invite pages, command menu.

---

## Phase 3.5: finishing a project (your request on 2026-11-13)

Already done: creating a project now opens it right away (commit `6078c19`).

**How finishing works**
- A "Complete project" button in the project header. The creator can press it at any time. Everyone else sees it once every task is done.
- If the creator presses it with tasks still open, it asks first ("3 tasks are still open. Complete anyway?").
- When the last task gets checked off, the project does not finish by itself. Instead a strip appears for everyone: "All tasks are done. Complete the project?" Finishing by itself would surprise people who were about to add one more task.
- Completing sets the status to Completed and saves when and who. The creator or an admin can Reopen it.
- I am skipping the "Pending review" approval step. For a student group it adds a second click and a waiting state for little gain. Easy to add later if a teacher needs to sign off.

**Locked while completed**
- A completed project is read only: no new or edited tasks, no moving cards, no uploads or deleting files, no invites. The backend refuses these with a clear message ("This project is completed. Reopen it to make changes.") and the page hides those buttons.
- Comments and file downloads still work.
- I suggest this replaces a separate "Lock" switch. Two switches (completed and locked) can disagree and confuse people. Completed simply means locked; Reopen unlocks it.

**Archive**
- The creator or an admin can archive any project. It leaves the sidebar and Home but still shows in search (marked Archived) and in an "Archived" list on Home. Unarchive brings it back.
- Archive is its own flag, so a project can be completed and archived, or just completed.
- The old unused status values (`archived`, `on_hold`) get folded into the new fields by the migration.

**The moment it finishes**
- A short animation: a circle draws itself, a check mark strokes in, and a ring of small ink marks bursts out once, in the accent color. About 1.2 seconds. With reduced motion it just shows the check.
- Right after, a box: "Send the team a final note" (optional, skip is fine). It goes to every member as a notification, and by email to those who want email. The note is also shown on the summary.

**The summary banner** (on the completed project page)
- Time taken (created to completed), tasks completed with who did each one, who contributed and how many tasks each, and the attached files with download links, plus the final note.

**Updates that matter (not every task)**
- Notify the team when a member finishes all of their tasks in a project ("Leo finished all their tasks in History of Jazz").
- Notify the team when the project is completed, and when the final note is sent.
- Per project "Email me big updates" toggle for each member (on by default, and the existing global email switch in Settings still wins). Emails use the console locally like everything else.

**Mobile notifications**: see question 14 below.

**Order**: backend first with tests (fields and migration, complete/reopen/archive, the lock, the summary, the notifications), then the frontend (button, animation, final note, banner, read-only board, archive list, email toggle), then a browser check.

---

## Phase 4: local dev + ready to publish

**Local**
- One command from the repo root: `npm run dev` starts Flask and Vite together (using the small `concurrently` package; no Docker needed).
- `.env.example` for backend and frontend, every variable with a comment.
- `flask seed` creates a demo user (plus two teammates), 2 projects, tasks in every status, recurring classes, comments, notifications, and activity. Safe to rerun (it resets the demo data only).
- README setup section rewritten for "clone to clicking around in under 5 minutes".

**Production**
- `build.sh` installs and runs `flask db upgrade` (already does); `render.yaml` start command uses gunicorn with sensible worker count. I will check whether Render's free plan wants migrations in a pre-deploy command instead of the build step.
- Rate limit login and register with Flask-Limiter (for example 10 per minute per IP). Free Render has one instance, so in-memory limits are fine; I will note that it needs Redis if you ever scale up.
- Security headers (HSTS, `X-Content-Type-Options`, `Referrer-Policy`, frame protection, a basic CSP on Vercel for the frontend).
- CORS only allows `FRONTEND_URL` in production; app refuses to start in production without it.
- JWT: today there is only an access token and any 401 kicks you to login. I will add refresh tokens (short access token, longer refresh token, the frontend refreshes once and retries the request), and test expiry with a fake clock. I will keep tokens in `localStorage` rather than cookies, because your frontend and backend are on different domains (vercel.app and onrender.com) and cross-site cookies get blocked by many browsers. The trade-off is explained in DEPLOY.md.
- `DEPLOY.md`: exactly what to click and set on Render and Vercel, in order.
- Heads up for later: Render's free Postgres expires after a limited time and the free web service sleeps when idle (first request can take 30+ seconds). Worth checking their current limits before a demo.
- I will not deploy anything.

---

## Final summary (after phase 4)

What changed, before/after bundle size and query counts, what I skipped, decisions to double check.

---

## All questions in one place

Phase 1 (needed before I start):
1. "Calculate schedule": keep existing assignees and only fill in unassigned tasks (my suggestion), or reassign everything like today?
2. Should the scheduler count weekends as work days by default? (I suggest yes, 9:00 to 17:00, 7 days.)
3. Overlapping calendar blocks: save them with a warning (my suggestion), or reject with an error?
4. OK to delete `database/schema.sql`, the `backend/*.sh` scripts, the broken `docker-compose.yml`, and `commands.py` (or do you use `flask list-users` etc.)?
5. Pin Python to 3.12 locally and on Render?
6. Rename "AI Task Generation" in the UI to "Suggested tasks"?

Later (I will ask again when we get there):
7. Email provider for production (Resend, Postmark, or something else) and how to trigger the daily digest (Render cron or GitHub Actions).
8. File storage for production (Cloudflare R2 suggested).
9. Delete the Google Drive stub?
10. Recurring blocks: whole-series edits only, or also "skip one occurrence"?
11. Comments: only the author can delete, or project admins too?
12. Accent color: tomato red only, or also highlighter yellow as a background mark?
13. Upgrade to Tailwind v4 at the start of phase 3?

Phase 3.5 (finishing a project):
14. Phone notifications: real push notifications need Web Push (a service worker, keys stored on the server, and a permission prompt). It works on Android; on iPhone only after "Add to Home Screen". Do it now, or keep the in-app bell plus email for now (my suggestion)?
15. Completion animation: build our own (my suggestion: no new library, matches the paper look, about 2 kB), or use the actual LottieFiles animation (adds the Lottie player, about 60 kB, and its own look)?
16. Is "completed means locked" OK, instead of a separate Lock switch?
