# Feature Specification: Forge Create Army Flow

**Feature ID**: 001-forge-create-army-flow
**Status**: Implemented (T1–T7 complete, T8 in progress)
**Game System**: Warhammer 40,000 10th Edition (`wh40k10e`)

---

## Goal

Let authenticated users create a new WH40K army from The Forge using the documented UX, the existing data model, and the existing local persistence architecture. The flow covers navigation to a dedicated creation page, filling a validated form, and redirecting to the new army's detail page on success.

---

## User Stories

### US-1: Navigate to the create army form

**As** an authenticated Forge user,
**I want** a clearly visible "Create Army" action on the Forge page,
**so that** I can start building a new army without hunting for a hidden link.

**Acceptance Criteria**:

- AC-1.1: The Forge page header contains a "Create Army" button that navigates to `/wh40k10e/armies/new`.
- AC-1.2: When the user has zero armies, the empty state includes an accessible "Create Army" CTA that navigates to the same route.
- AC-1.3: The create link does not produce a double-segment URL such as `/wh40k10e/armies/armies/new`.
- AC-1.4: Existing Forge card list, filters, duplicate, deploy, and delete behavior is unchanged.

---

### US-2: Fill and submit the create army form

**As** an authenticated user on the `/wh40k10e/armies/new` page,
**I want** a form with army name, faction, detachment, and battle size fields,
**so that** I can configure a minimal valid army before saving it.

**Acceptance Criteria**:

- AC-2.1: The form renders four controls: Army Name (text input), Faction (select), Detachment (select), Battle Size (select).
- AC-2.2: The Submit button is disabled until all required fields are valid.
- AC-2.3: Army name must be between 3 and 60 characters (trimmed). Shorter names show a localized inline error.
- AC-2.4: Faction is required. An unselected faction shows a localized inline error.
- AC-2.5: Detachment is required only when detachment options are available for the selected faction.
- AC-2.6: Battle size is required. An unselected battle size shows a localized inline error.
- AC-2.7: All user-facing strings come from the `armyCreation` i18n namespace; no hard-coded English text.
- AC-2.8: Faction options are sourced from the `wh40k10e` plugin's `FACTION_MAP`, not hard-coded in the UI.

---

### US-3: Save the army and navigate to the detail page

**As** an authenticated user who has filled a valid create army form,
**I want** clicking "Create Army" to persist my army and take me to its detail page,
**so that** I can immediately start adding units.

**Acceptance Criteria**:

- AC-3.1: Submitting a valid form saves an `Army` record via `dataContext.armies.save`.
- AC-3.2: On success, the forge army query cache is invalidated and the user is redirected to `/{locale}/wh40k10e/armies/{armyId}`.
- AC-3.3: While saving, the submit button shows "Creating…" and is disabled.
- AC-3.4: On save failure, a localized error message appears in a `role="alert"` region; form values are preserved and the submit button is re-enabled.
- AC-3.5: Clicking Cancel navigates back to `/{locale}/wh40k10e/armies` without saving.
- AC-3.6: The saved army has `totalPoints: 0`, `units: []`, `warlordUnitId: null`, and `pointsLimit` derived from the selected battle size (1000 / 2000 / 3000).

---

### US-4: Accessible and keyboard-navigable flow

**As** a keyboard-only or assistive-technology user,
**I want** the create army form to be fully operable without a mouse,
**so that** the feature meets WCAG 2.1 AA requirements.

**Acceptance Criteria**:

- AC-4.1: All form controls have visible labels associated via `htmlFor` / `id`.
- AC-4.2: Inline validation errors are associated with their fields via `aria-describedby` and `aria-invalid`.
- AC-4.3: The save error region uses `role="alert"` so screen readers announce it automatically.
- AC-4.4: A keyboard-only user can Tab through all controls, select options, and submit the form.

---

## Out of Scope

The following items are explicitly excluded from this feature increment:

- Unit selection or configuration (adding units to the army roster).
- Image upload or army artwork.
- Custom points input or free-form points limits.
- A new HTTP API endpoint for army creation (persistence uses the existing local DataContext/DAO path).
- Hard-coding faction or detachment options in the UI when plugin data exists.
- Detachment options wired to live plugin data (current implementation stubs `detachmentOptions` to `[]`; wiring is deferred).

---

## Requirements References

- `docs/design/REQUIREMENTS.md` — ARM-003, ARM-006, ARM-020 through ARM-027
- `docs/design/FLOWS.md:70-95` — Journey 2: Forge → Create Army
- `docs/design/INFORMATION_ARCHITECTURE.md:24-31, 62-67` — canonical `/wh40k10e/armies/new` route
- `docs/design/DECISIONS.md:195-215` — DD-007: desktop header action + mobile FAB, empty-state CTA
