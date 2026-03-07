# Global (GLB)

**US-GLB-01: Responsive layout system** `P0`
As a player, I want all pages to adapt to my device's screen size so that the app is usable on mobile, tablet, and desktop.

**Acceptance Criteria:**
- [ ] All pages use a responsive grid system with breakpoints: mobile (<640px), tablet (640–1024px), desktop (>1024px)
- [ ] No horizontal scrolling occurs at any breakpoint
- [ ] Touch targets are minimum 44×44px on mobile viewports

**Data References:** ARM-001

---

**US-GLB-02: Skeleton loading states** `P1`
As a player, I want skeleton placeholders while content loads so that I see the page layout immediately and know data is coming.

**Acceptance Criteria:**
- [ ] Every page that fetches async data renders skeleton placeholders matching the final layout shape
- [ ] Skeletons are shown until the first data paint completes
- [ ] No blank white screens appear during loading

**Data References:** ARM-001

---

**US-GLB-03: Design token system** `P0`
As a player, I want consistent visual styling across the app so that the experience feels cohesive.

**Acceptance Criteria:**
- [ ] All colors, typography, spacing, border-radius, and shadows are defined via design tokens
- [ ] Tokens are consumed by both CSS (web) and React Native StyleSheet (mobile)
- [ ] No hardcoded color values exist outside the token system

**Data References:** ARM-001

---

**US-GLB-04: Reduced section header prominence** `P1`
As a player, I want section headers to be visually subtle so that the content itself is the focus.

**Acceptance Criteria:**
- [ ] Section headers use a smaller font size and reduced visual weight compared to page titles
- [ ] Headers do not dominate the visual hierarchy over content

**Data References:** ARM-001

---

**US-GLB-05: Color hierarchy for interactive vs. static elements** `P0`
As a player, I want interactive elements to be visually distinct from static content so that I know what I can tap.

**Acceptance Criteria:**
- [ ] Interactive elements (buttons, links, toggles) use the accent color from the design token system
- [ ] Static/read-only text does not use the accent color
- [ ] The distinction is consistent across all pages

**Data References:** ARM-001, GLB-003

---

**US-GLB-06: Modern dark UI aesthetic** `P0`
As a player, I want a modern, clean dark-themed interface so that the app looks professional and is comfortable during long sessions.

**Acceptance Criteria:**
- [ ] The app uses a dark theme as the default and only theme
- [ ] Surfaces use dark grays, not pure black
- [ ] Text uses high-contrast off-white
- [ ] The overall aesthetic targets a modern SaaS look (reference: Linear, Vercel dashboard)

**Data References:** ARM-001

---

**US-GLB-07: Faction-themed color accents** `P1`
As a player, I want the app to use faction-specific accent colors when viewing faction content so that the experience feels personalized to my army.

**Acceptance Criteria:**
- [ ] When viewing army or faction content, the accent color changes to `FactionData.themeColor`
- [ ] The faction color is applied to accent elements only (buttons, highlights, active states)
- [ ] Non-faction pages use the default accent color

**Data References:** ARM-001, FactionData.themeColor

---

**US-GLB-08: Consistent page header layout** `P1`
As a player, I want all pages to share a consistent header layout so that navigation is predictable.

**Acceptance Criteria:**
- [ ] All main pages use a shared header component
- [ ] The header includes page title/breadcrumb on the left and action buttons on the right
- [ ] The header layout is identical across The Forge, War Ledger, Campaigns, Allies, and References pages

**Data References:** ARM-001

---

**US-GLB-09: Bottom navigation bar for mobile** `P0`
As a player, I want a bottom navigation bar on mobile so that primary sections are always accessible with one thumb tap.

**Acceptance Criteria:**
- [ ] On mobile viewports (<640px), a persistent bottom navigation bar is displayed
- [ ] The bar contains icons for: The Forge, War Ledger, Campaigns, Allies, References
- [ ] The active page is visually indicated in the bar
- [ ] The bar does not appear on desktop viewports (>1024px), where sidebar navigation is used instead

**Data References:** ARM-001

---

**US-GLB-10: Sidebar navigation for desktop** `P0`
As a player, I want a sidebar navigation on desktop so that all sections are visible and accessible.

**Acceptance Criteria:**
- [ ] On desktop viewports (>1024px), a persistent sidebar navigation is displayed
- [ ] The sidebar contains links to: The Forge, War Ledger, Campaigns, Allies, References, and Profile
- [ ] The active page is highlighted in the sidebar
- [ ] The sidebar collapses to icons only on tablet viewports (640–1024px)

**Data References:** ARM-001

---

**US-GLB-11: Drawer and modal stacking system** `P0`
As a player, I want drawers and modals to stack properly so that I can navigate between overlays without confusion.

**Acceptance Criteria:**
- [ ] Multiple drawers can stack (e.g., unit list drawer stacking on top of army drawer)
- [ ] Each new overlay pushes on top of the previous one
- [ ] A "close all" action dismisses the entire stack
- [ ] The background dims progressively with each additional stacked overlay
- [ ] Only the topmost overlay is interactive

**Data References:** ARM-001

---

**US-GLB-12: Toast notification system** `P1`
As a player, I want brief feedback notifications for actions so that I know my actions succeeded or failed.

**Acceptance Criteria:**
- [ ] Actions that modify data (save, delete, create, invite) trigger a toast notification
- [ ] Toasts auto-dismiss after 4 seconds
- [ ] Error toasts persist until manually dismissed
- [ ] Toasts stack vertically if multiple appear simultaneously
- [ ] Toast position is bottom-center on mobile and bottom-right on desktop

**Data References:** ARM-001

---
