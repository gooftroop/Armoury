# Landing Page (LP)

**US-LP-01: View the landing page** `P0`
As a player, I want to see a landing page that explains the app and encourages sign-up so that I understand what the app offers before committing.

**Acceptance Criteria:**
- [ ] The landing page displays the app name, tagline, and a brief value proposition
- [ ] Available game systems are shown as `GameSystem` tiles
- [ ] A call-to-action for registration/login via Auth0 is present and prominent

**Data References:** Auth0 login flow, `GameSystem`

---

**US-LP-02: Select a game system** `P0`
As a player, I want to select a game system so that I can enter the app context for that system.

**Acceptance Criteria:**
- [ ] Game system tiles are clickable
- [ ] Selecting a system navigates to the army page for that system: `/[locale]/wh40k10e/armies`
- [ ] Only systems where `GameSystem.status === 'available'` are selectable

**Data References:** `GameSystem.status`, route: `/[locale]/wh40k10e/armies`

---

**US-LP-03: View unauthenticated landing page** `P0`
As an unauthenticated visitor, I want to understand what the app offers before signing up so that I can decide whether to register.

**Acceptance Criteria:**
- [ ] A feature overview is shown (army building, match tracking, campaigns)
- [ ] Auth0 login/register buttons are prominent
- [ ] No access to app features is available without authentication

**Data References:** Auth0 authentication flow

---

**US-LP-04: Scene illustrations on landing page** `P2`
As a player, I want evocative scene illustrations on the landing page so that the app feels immersive from the first visit.

**Acceptance Criteria:**
- [ ] The landing page includes at least one hero illustration or scene image above the fold
- [ ] The illustration is thematically appropriate for tabletop wargaming
- [ ] The image is served in WebP format, lazy-loaded below the fold, and responsive across breakpoints

**Data References:** LP-001

---

**US-LP-05: Hide unavailable game systems** `P1`
As a player, I want to only see game systems that are available so that I'm not confused by options I can't use.

**Acceptance Criteria:**
- [ ] The game system selection only displays systems where `GameSystem.status === 'available'`
- [ ] Systems where `GameSystem.status === 'coming_soon'` are hidden or shown in a clearly disabled "Coming Soon" state
- [ ] No clickable action is available for unavailable systems

**Data References:** LP-002, GameSystem.status

---

**US-LP-06: Clear registration call-to-action** `P1`
As a player, I want clear and compelling copy on the registration CTA so that I understand the value of signing up.

**Acceptance Criteria:**
- [ ] The registration CTA button has descriptive text (not just "Sign Up")
- [ ] Supporting copy explains what the player gets by registering
- [ ] The CTA uses the primary accent color and a large size, making it visually prominent

**Data References:** LP-003

---
