# Army Page — The Forge (APG)

## Army Detail

**US-APG-01: View army unit roster** `P0`
As a player, I want to see all units in an army with name, model count, points, and role so that I can review my army composition at a glance.

**Acceptance Criteria:**
- [ ] Units are grouped by `UnitData.role` (Character, Battleline, Other)
- [ ] Total army points are displayed
- [ ] No horizontal scrollbar appears; on narrow viewports, unit details wrap below unit name

**Data References:** `Army.units: ArmyUnit[]`, `Army.totalPoints`, `ArmyUnit.modelCount`, `ArmyUnit.totalPoints`, `Unit.name`

---

**US-APG-02: View army validation status** `P0`
As a player, I want to see if my army is valid so that I can identify and fix any rule violations before playing.

**Acceptance Criteria:**
- [ ] Validation errors and warnings from all validation rules are displayed
- [ ] Invalid items are highlighted in the unit list

**Data References:** All validation rules (faction keyword, points limit, detachment, warlord, composition, enhancement, leader, wargear)

---

**US-APG-03: View detachment rules and stratagems** `P1`
As a player, I want to see the selected detachment's rules and available stratagems so that I can plan my tactics.

**Acceptance Criteria:**
- [ ] The detachment's rules are displayed
- [ ] The detachment's available stratagems are listed

**Data References:** `Army.detachmentId`, `FactionData.detachments: Detachment[]`, `Detachment.stratagems: Stratagem[]`

---

**US-APG-04: Share army list** `P2`
As a player, I want to export or share my army list as text or a link so that I can share it with opponents or discuss it online.

**Acceptance Criteria:**
- [ ] An export or share action is available on the Army Details page
- [ ] The army list can be shared as plain text or via a URL

**Data References:** `Army.id`, `Army.name`, army URL scheme

---

**US-APG-05: Duplicate an army** `P1`
As a player, I want to create a copy of an existing army so that I can try variations without losing the original.

**Acceptance Criteria:**
- [ ] A duplicate action is available on the Army Details page
- [ ] The duplicated army is a complete copy of the source army

**Data References:** `POST /armies` (with copied fields from source army), `Army` fields

---

**US-APG-06: Delete an army** `P1`
As a player, I want to delete an army so that I can remove armies I no longer need.

**Acceptance Criteria:**
- [ ] A delete action is available on the Army Details page
- [ ] A confirmation dialog is shown before deletion
- [ ] An army that is in an active match cannot be deleted

**Data References:** `DELETE /armies/{id}`, `Army.id`, `Match.outcome.status`

---

**US-APG-07: View army version history** `P2`
As a player, I want to see previous versions of my army so that I can review or restore an earlier configuration.

**Acceptance Criteria:**
- [ ] A version history list is accessible from the Army Details page
- [ ] Each version can be viewed and optionally restored

**Data References:** `Army.versions: ArmyVersion[]`

---

## Army Creation

**US-APG-08: Create a new army** `P0`
As a player, I want to create a new army by selecting faction, battle size, and army name so that I can start building my roster.

**Acceptance Criteria:**
- [ ] A create army action is available from The Forge list page
- [ ] The creation flow collects faction, battle size, and army name
- [ ] The new army is persisted via `POST /armies`

**Data References:** `POST /armies`, `Army.factionId`, `Army.battleSize`, `Army.pointsLimit`, `Army.name`

---

**US-APG-09: Select a detachment for the army** `P0`
As a player, I want to pick a detachment from the available options for my army's faction so that my army uses the correct rules.

**Acceptance Criteria:**
- [ ] The detachment selector shows all detachments available for the army's faction
- [ ] The selected detachment is saved to the army

**Data References:** `Army.detachmentId`, `FactionData.detachments`

---

**US-APG-10: Deploy button uses secondary styling** `P1`
As a player, I want the Deploy button to be visually distinct but not dominate the page so that it's findable without being distracting.

**Acceptance Criteria:**
- [ ] The Deploy button on the Army Details page uses secondary button styling (outlined or muted), not primary filled accent
- [ ] The button is clearly labeled "Deploy" and positioned in the header area

**Data References:** ARM-061

---

**US-APG-11: Army page splash imagery** `P2`
As a player, I want the Army page to include faction splash art so that the page feels visually rich and thematic.

**Acceptance Criteria:**
- [ ] The Army Details page includes a faction splash image or banner in the header area
- [ ] The image is sourced from the faction's asset bundle (`FactionData.assets`)
- [ ] The image does not obscure any interactive elements

**Data References:** ARM-060, FactionData.assets

---

**US-APG-12: Conditional detachment selector** `P1`
As a player, I want the detachment selector to appear only when I have multiple detachment options so that a single-detachment faction is simpler.

**Acceptance Criteria:**
- [ ] If `FactionData.detachments.length === 1`, the detachment selector is hidden and the single detachment is auto-selected
- [ ] If the faction has multiple detachments, the selector is displayed showing detachment name and a brief description
- [ ] The selector state persists correctly when switching between armies

**Data References:** ARM-062, FactionData.detachments

---

**US-APG-13: Taller army banner** `P2`
As a player, I want the army banner/header to have more visual height so that it creates a strong first impression.

**Acceptance Criteria:**
- [ ] The army banner area is a minimum of 200px tall on desktop viewports
- [ ] The banner accommodates faction splash art, army name, and detachment label without cramping any element

**Data References:** ARM-060

---

**US-APG-14: Breadcrumb navigation on Army page** `P1`
As a player, I want breadcrumb navigation on the Army page so that I can navigate back to the army list easily.

**Acceptance Criteria:**
- [ ] The Army Details page shows breadcrumbs in the format: The Forge → [Army Name]
- [ ] Each breadcrumb segment is a clickable link
- [ ] On mobile, only the back arrow and army name are shown (compact breadcrumb)

**Data References:** ARM-060

---

**US-APG-15: Unit category labels above unit groups** `P1`
As a player, I want unit groups to have visible category labels so that I can find units by role (HQ, Troops, Elite, etc.).

**Acceptance Criteria:**
- [ ] Units in the army list are grouped under category headers matching `UnitData.role` (e.g., "Character", "Battleline", "Other")
- [ ] Each group header is visible and styled consistently
- [ ] Empty groups are hidden from the list

**Data References:** ARM-063, UnitData.role

---

**US-APG-16: Deploy from Army Details page** `P0`
As a player, I want to deploy an army directly from its details page so that I don't have to navigate elsewhere.

**Acceptance Criteria:**
- [ ] The Army Details page has a "Deploy" action that opens the match creation drawer or navigates to match creation
- [ ] The army is pre-selected in the match creation context when deployed this way
- [ ] The deploy action is accessible from the header area

**Data References:** ARM-061, MTH-021

---

**US-APG-17: Army points total in header** `P1`
As a player, I want to see my army's total points in the header so that I can quickly check if I'm at my target.

**Acceptance Criteria:**
- [ ] The Army Details header displays `Army.totalPoints` prominently
- [ ] The points display updates in real time as units are added or removed
- [ ] If a points limit is set, both current and limit are shown (e.g., "1450 / 2000 pts")

**Data References:** ARM-060, Army.totalPoints, Army.pointsLimit

---

**US-APG-18: Empty army zero-state with CTA** `P1`
As a player, I want a helpful empty state when my army has no units so that I know how to start building.

**Acceptance Criteria:**
- [ ] When an army has zero units, the unit list area shows a zero-state illustration and an "Add Your First Unit" CTA button
- [ ] The CTA opens the add-unit drawer
- [ ] The zero state does not show filters or sorting controls

**Data References:** ARM-063

---

**US-APG-19: Unit count badge on army list cards** `P2`
As a player, I want to see how many units are in each army from the army list so that I can gauge army completeness at a glance.

**Acceptance Criteria:**
- [ ] Each army card on The Forge list page displays a unit count badge showing `Army.units.length`
- [ ] The badge is positioned near the points display

**Data References:** ARM-040, Army.units.length

---
