# AGENTS.md — Smart Campus Room Availability Checker

## Project purpose

A read-only Smart Campus room availability checker. Visitors select a room and a
time interval and the app reports whether that slot is available, along with the
specific reasons it is unavailable. The app operates on a single room dataset and
fictional sample data. There is **no backend, no login, no database, and no saved
booking creation** — existing booking data is never modified. Time is either the
real clock or, in Test Mode, a fixed/configurable value used for deterministic
checks.

## Key project files and structure

```
src/
  App.tsx                      # Orchestrator: state, filters, form, result, timelines, test mode
  types.ts                     # Room, Booking, AvailabilityRequest, AvailabilityResult, TestConfig
  components/
    AvailabilityForm.tsx       # Room/time inputs; emits check requests to App
    ResultPanel.tsx            # Available/Unavailable feedback + reasons
    RoomFilterPanel.tsx        # Capacity + equipment filters (F1, F2)
    RoomTimeline.tsx           # Per-room timeline visualization (existing bookings + requested slot)
    TestCasesPanel.tsx         # Preset scenario buttons wired to TEST_CASES
    TestModePanel.tsx          # Toggle test mode; edit fixed time / bookings / room block status
  lib/
    checkAvailability.ts       # Booking-rule function: enforces AC1–AC4, returns AvailabilityResult
    roomFilter.ts              # filterByCapacity, filterByEquipment, filterRooms, getAvailableEquipment
    sampleData.ts              # SAMPLE_ROOMS, SAMPLE_BOOKINGS, DEFAULT_TEST_CONFIG (fixtures)
    testCases.ts               # TEST_CASES preset scenarios + TestCase type + testCaseSummary
    timeUtils.ts               # minutesToLabel, getCurrentMinutesFromMidnight, durationLabel
    checkAvailability.test.ts  # AC1–AC5 unit tests + preset-scenario coverage
  tests/
    roomChecker.test.ts        # AC1–AC4, filter F1–F5, boundary, and data-integrity tests
```

- **Booking-rule function:** `src/lib/checkAvailability.ts` — pure function
  `checkAvailability(request, rooms, bookings, currentTimeInMinutes)`.
- **Fixture data:** `src/lib/sampleData.ts`.
- **Preset scenarios:** `src/lib/testCases.ts` (dual-purpose: UI presets + test cases).
- **Tests:** `src/lib/checkAvailability.test.ts` and `src/tests/roomChecker.test.ts`.

## Accepted rules and constraints

- **AC1 — Valid time interval:** `0 <= start < end <= 1440`; `start` must be strictly
  after the current time. Endpoints outside the day, `start >= end`, and `start <= now`
  are rejected with a clear reason.
- **AC2 — Maximum duration:** `endTime - startTime` must be `<= 120` minutes. Exactly
  120 is allowed; 121+ is rejected.
- **AC3 — Blocked room:** a blocked room is always unavailable; `blockedReason`
  (when present) is included in the rejection message.
- **AC4 — Booking conflicts via half-open intervals:** a requested slot conflicts when
  `start < existingEnd && existingStart < end`. Touching endpoints
  (`requestedEnd === existingStart` or `requestedStart === existingEnd`) are allowed.
- **AC5 — Clear decision + data integrity:** returns `available: boolean` with
  non-empty `reasons`/`conflicts` when unavailable; **never mutates** the input
  `rooms` or `bookings` arrays.
- **AC6 — Responsive UI, clear labels, readable feedback:** preserve the existing UI
  layout, labels, and responsive behavior.
- **No mutation of booking/room fixtures:** `checkAvailability` and `filterRooms` are
  pure and must not mutate their inputs; tests assert this with `structuredClone`
  snapshots.
- **Preserve existing UI and behavior:** do not change visible layout, labels, or the
  AC1–AC6 semantics without an explicit request. No backend, login, database, or
  persisted bookings.

## Engineering boundaries

- **Prefer pure functions.** Domain logic (`checkAvailability`, `filterRooms`) stays
  pure and side-effect free; UI components stay presentational and delegate state to
  `App.tsx`.
- **Make minimal, surgical changes.** Do not refactor beyond what a task requires.
  Do not introduce abstractions, fallbacks, or validation for scenarios that cannot
  happen.
- **At most two justified design patterns.** Only introduce a pattern (e.g. Adapter,
  Strategy, extracting a pure resolver) when the code has concrete, repeated pain that
  the pattern directly addresses. Document the justification; do not pattern-fit
  speculatively.
- **No unnecessary libraries or global stores.** Do not add UI/theme/icon
  dependencies; use the existing stack (React + Tailwind + lucide-react). Do not
  introduce module-level mutable state or singletons to pass data between modules.
- **Match the codebase.** Follow existing naming, file layout, import style
  (`@/` path alias → `src/`), and error-handling conventions. Reuse existing
  utilities before adding new ones.

## Test / verification workflow

Commands available via `package.json` scripts:

- `npm run test` — run the Vitest suite once (`vitest run`).
- `npm run test:watch` — run Vitest in watch mode.
- `npm run typecheck` — `tsc --noEmit -p tsconfig.app.json`.
- `npm run lint` — `eslint .`.
- `npm run build` — `vite build` (production build verification).

Workflow when changing logic:

1. **Run the existing tests first** (`npm run test`) to confirm the baseline is green.
2. **Make the change**, keeping `checkAvailability` and `filterRooms` pure and
   non-mutating.
3. **Add focused regression tests** when any booking-rule or filter logic changes —
   cover the affected AC/edge case (e.g. boundary durations, touching vs. overlapping
   intervals, blocked rooms, mutation guards).
4. **Verify:** run `npm run test` (and `npm run typecheck` / `npm run lint` if types
   or imports changed). If a build script exists and files were modified, run
   `npm run build` before reporting done.
5. **Report:** list the files changed and summarize the test results. If any check
   failed and was not fixed, say so plainly rather than claiming success.

Test fixtures use a fixed current time of `600` (10:00) and the sample
rooms/bookings from `src/lib/sampleData.ts`. Tests `structuredClone` the fixtures in
`beforeEach` so module-level data is never mutated.
