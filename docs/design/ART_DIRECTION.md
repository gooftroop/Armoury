# Armoury Art Direction Brief

**Purpose:** Define the visual identity, AI-generated imagery strategy, legal guardrails, faction archetype system, asset catalog, prompt engineering patterns, placeholder strategy, and tool recommendations for all imagery in the Armoury app.

**Scope:** Web (Next.js 15) and Mobile (Expo 53 + React Native 0.79). All game systems supported via plugins.

**Authority:** This document is the single source of truth for imagery decisions. All generated assets must comply with the legal framework defined here.

**Related Documents:**
- `STYLE_GUIDE.md` (visual language, component catalog)
- `DESIGN_TOKENS.md` (color values, faction archetype palette)
- `DECISIONS.md` (naming decisions)
- `REQUIREMENTS.md` (GLB-014: no trademark violations)
- `INFORMATION_ARCHITECTURE.md` (page inventory for asset mapping)

---

## 1. Legal Framework

### 1.1 Trademark and IP Rules

Armoury is an unofficial, fan-made tool. All imagery must be **original, AI-generated content** with zero use of copyrighted or trademarked material.

**NEVER include in prompts or assets:**
- Games Workshop trademarks: "Warhammer", "Space Marine", "Adeptus Astartes", "Necron", "Ork", "Tyranid", "Aeldari", "T'au", "Chaos", or any faction/unit name from any GW game system
- Copyrighted symbols: the Aquila (double-headed eagle), Chaos Star (eight-pointed star), faction-specific iconography (Tau symbol, Eldar rune, etc.)
- Direct reproductions or close imitations of official artwork, cover art, or codex illustrations
- Miniature photography or renders that depict identifiable GW products
- Any other publisher's copyrighted game content (for future AOS, HH plugins)

**ALWAYS use instead:**
- Generic archetypes: "armored warrior", "alien swarm creature", "skeletal machine soldier", "zealot knight"
- Original faction-agnostic imagery that evokes a mood without referencing specific IP
- Plugin-defined archetype mappings (Section 3) that translate game factions to safe visual categories
- Atmospheric and environmental art that has no IP-specific elements

### 1.2 Safe Zones

| Safe | Unsafe |
|------|--------|
| Generic sci-fi power armor | Space Marine armor (specific proportions, heraldry) |
| Alien insectoid swarm | Tyranid-specific bioforms |
| Skeletal robots | Necron-specific glyphs and gauss weapons |
| Demonic entities | Chaos-specific marks, eight-pointed star |
| Ethereal alien technology | T'au-specific weapon/armor shapes |
| Fantasy knights in ornate armor | Specific Stormcast or Custodes designs |
| War-torn battlefield | Specific named 40K locations |
| Dark gothic cathedral interior | Specific Imperium iconography |

### 1.3 Fan Tool Precedent

Fan tools (BattleScribe, Wahapedia, etc.) have operated in a gray zone by providing utility without reproducing art. Armoury follows this precedent:
- **Utility over art:** imagery serves the UI, not as a product in itself
- **No reproduction:** every image is generated fresh, never copied
- **Attribution:** disclaimer in app footer and About page — "This is an unofficial fan tool. Not affiliated with any game publisher."
- **Removal policy:** if a publisher requests removal, comply immediately

### 1.4 Licensing for AI-Generated Art

- Images generated via Midjourney, DALL-E, or Stable Diffusion-based tools are owned by the account holder (check each tool's current ToS)
- All generated images should be stored in the project's asset repository with metadata: tool, prompt, date, archetype mapping
- No images from third-party asset libraries unless license explicitly permits commercial fan tools

---

## 2. Visual Identity

### 2.1 Core Aesthetic

**Grimdark Tactical** — The visual tone sits between painterly concept art and digital matte painting. Dark, atmospheric, cinematic. Not photorealistic, not cartoonish.

| Attribute | Target | Avoid |
|-----------|--------|-------|
| Tone | Dark, moody, cinematic | Bright, cheerful, saturated |
| Style | Painterly, concept art, matte painting | Photorealistic, cartoon, anime, pixel art |
| Palette | Desaturated with selective accent pops | Neon, rainbow, pastel |
| Composition | Atmospheric, depth-of-field, dramatic lighting | Flat, clipart-like, stock photo feel |
| Detail | Weathered, textured, lived-in | Clean, pristine, factory-new |
| Mood | Imposing, tactical, purposeful | Whimsical, cute, humorous |

### 2.2 Color Direction for Art

All art must harmonize with the app's dark tactical theme (see `DESIGN_TOKENS.md`).

- **Backgrounds in art:** deep blues, grays, near-blacks (oklch lightness 0.08–0.20)
- **Atmospheric elements:** fog, smoke, particle effects in muted tones
- **Accent lighting:** cold steel blue highlights consistent with `--accent-primary` (oklch 0.72 0.12 235)
- **Faction-specific color:** use archetype palette (Section 3) for hero images and faction art
- **Text overlay safety:** all art used behind text must have sufficient dark overlay or gradient falloff

### 2.3 Composition Guidelines

- **Hero images:** subject occupies 40–60% of frame, remainder is atmosphere
- **Card backgrounds:** subject at 30% with heavy vignette or gradient to dark edges
- **Icons/thumbnails:** centered subject, minimal background, strong silhouette
- **Empty states:** environmental/atmospheric, no characters (avoids IP risk)
- **Aspect ratios:** always match asset catalog specs (Section 4)

---

## 3. Faction Archetype System

### 3.1 Architecture

Game-specific factions map to generic visual archetypes. Plugins define this mapping. The shell and art pipeline only know archetypes — never game-specific names.

```
Plugin (e.g., wh40k10e)
  └── factionArchetypeMap: Record<FactionId, ArchetypeId>
        e.g., "space-marines" → "super_soldier"
             "tyranids" → "alien_swarm"
             "necrons" → "machine_undead"
```

The app shell renders imagery based on archetype ID, pulling from the asset catalog by archetype.

### 3.2 Archetype Definitions

Each archetype has a **visual brief** (what to depict), **color palette reference** (from `DESIGN_TOKENS.md`), and **mood keywords** for prompt engineering.

| Archetype ID | Visual Brief | Token Palette | Mood Keywords |
|---|---|---|---|
| `super_soldier` | Heavily armored elite warriors, bulky power armor, squad formations | Iron Legion | Disciplined, imposing, fortress, steel, brotherhood |
| `alien_swarm` | Organic alien horde, chitinous, multi-limbed, biological weapons | Crimson Pact | Relentless, predatory, evolution, hunger, overwhelming |
| `machine_undead` | Skeletal metallic constructs, glowing energy cores, ancient technology | Obsidian Coil | Ancient, inexorable, cold, silent, entropy |
| `zealot_order` | Religious warriors, ornate armor, icons of faith, righteous fury | Sunforged | Fanatical, radiant, gold, fire, judgment |
| `brutalist` | Massive, crude warriors, scrap armor, heavy melee weapons, feral | Ember Cult | Savage, loud, destruction, primal, horde |
| `eldritch` | Ethereal aliens, psychic energy, graceful yet alien, crystalline | Voidborn | Mysterious, ancient, otherworldly, fate, sorrow |
| `ethereal_tech` | Clean alien technology, hover vehicles, advanced ranged weapons | Frost Warden | Precise, tactical, unity, progress, cold |
| `noble_knight` | Medieval-meets-sci-fi, heraldic, mounted or towering, chivalric | Storm Guard | Honorable, majestic, lance, shield, banner |
| `daemon_host` | Twisted demonic entities, warp energy, mutation, dark rituals | Crimson Pact | Corruption, dread, flame, mutation, madness |
| `forest_spirit` | Nature-bonded warriors, living wood, ancient groves, primal spirits | Verdant Order | Ancient, wild, growth, wrath, verdant |
| `death_lord` | Undead legions, spectral, necromantic, bone and shadow | Ashen Dominion | Death, command, inevitability, dust, cold |
| `void_pirate` | Raider aesthetic, fast and vicious, spiky silhouettes, darklight | Voidborn | Speed, cruelty, shadows, raids, pain |

### 3.3 Archetype-to-Faction Mapping (40K Plugin Example)

This mapping lives in `src/shared/systems/wh40k10e/config/` — not in art direction docs. Example for reference:

| 40K Faction | Archetype |
|---|---|
| Space Marines (all chapters) | `super_soldier` |
| Tyranids | `alien_swarm` |
| Necrons | `machine_undead` |
| Adepta Sororitas | `zealot_order` |
| Orks | `brutalist` |
| Aeldari / Drukhari (Craftworlds) | `eldritch` |
| T'au Empire | `ethereal_tech` |
| Imperial Knights | `noble_knight` |
| Chaos Daemons | `daemon_host` |
| Sylvaneth (AOS crossover) | `forest_spirit` |
| Death Guard / Nighthaunt | `death_lord` |
| Drukhari | `void_pirate` |

**Note:** Plugins may assign the same archetype to multiple factions, or split a faction across archetypes for sub-factions.

### 3.4 Extending Archetypes

New archetypes can be added by:
1. Adding the archetype ID and visual brief to this document
2. Adding a corresponding color palette to `DESIGN_TOKENS.md` (faction archetype colors)
3. Generating the required asset catalog entries (Section 4)
4. Updating plugin mappings

---

## 4. Asset Catalog

### 4.1 Asset Types

Every asset type has a defined purpose, dimensions, format, and where it appears in the app.

| Asset Type | Purpose | Dimensions (px) | Aspect Ratio | Format | Used On |
|---|---|---|---|---|---|
| **Login Splash** | Full-screen atmospheric background for login/landing | 1920×1080 (web), 1170×2532 (mobile) | 16:9, 9:19.5 | WebP | Login, Landing page |
| **Game System Banner** | Wide banner for game system selection cards | 1200×400 | 3:1 | WebP | Landing page |
| **Faction Hero** | Large faction identity image for army creation and headers | 800×600 | 4:3 | WebP | Army Creation, Army page header |
| **Faction Icon** | Small square icon for navigation chips, list items | 64×64, 128×128 (@2x) | 1:1 | WebP (with transparency) or SVG | Nav, filters, list items |
| **Unit Thumbnail** | Small representative image for unit list items | 96×96, 192×192 (@2x) | 1:1 | WebP | Unit list, Add Unit modal |
| **Army Card Splash** | Background image for army list cards | 600×300 | 2:1 | WebP | The Forge |
| **Battle Scene** | Environmental battlefield image for match pages | 1200×600 | 2:1 | WebP | Match page header, Match cards |
| **Campaign Banner** | Wide atmospheric banner for campaign pages | 1200×400 | 3:1 | WebP | Campaign page header |
| **Empty State** | Atmospheric illustration for empty/zero-data states | 400×300 | 4:3 | WebP or SVG | All empty state components |
| **Match Result** | Celebration/defeat mood imagery for post-match | 800×400 | 2:1 | WebP | Post-match summary |

### 4.2 Asset Naming Convention

```
/assets/images/{gameSystem}/{assetType}/{archetypeOrName}_{variant}.webp

Examples:
/assets/images/shared/empty-state/no-armies_default.webp
/assets/images/shared/login-splash/tactical-atmosphere_01.webp
/assets/images/wh40k10e/faction-hero/super_soldier_01.webp
/assets/images/wh40k10e/faction-icon/super_soldier.svg
/assets/images/wh40k10e/battle-scene/warzone_urban_01.webp
```

### 4.3 Asset Requirements Per Page

| Page | Required Assets |
|------|----------------|
| Landing / Game System Selector | Login Splash (1), Game System Banner (per game system) |
| The Forge | Army Card Splash (per faction archetype), Empty State (1) |
| Army Creation Page | Faction Hero (per faction archetype) |
| Army Detail Page | Faction Hero (header background, dimmed) |
| Unit Add Modal | Unit Thumbnails (per archetype, generic), Empty State (1 for search no-results) |
| War Ledger / Match Detail | Battle Scene (3–5 variants), Match Result (win/loss/draw) |
| Campaign Page | Campaign Banner (3–5 generic variants) |
| Allies | Empty State (1 for no friends) |
| References | Empty State (1 for no results) |
| Tournaments (Placeholder) | Empty State (1 themed "coming soon") |

### 4.4 Minimum Viable Asset Set (V1)

For V1 launch with the 40K plugin, generate at minimum:

| Asset Type | Count | Notes |
|---|---|---|
| Login Splash | 2 | 1 web (16:9), 1 mobile (9:19.5) |
| Game System Banner | 1 | Generic sci-fi for 40K |
| Faction Hero | 12 | 1 per archetype |
| Faction Icon | 12 | 1 per archetype (SVG preferred) |
| Unit Thumbnail | 12 | 1 per archetype (generic silhouette) |
| Army Card Splash | 12 | 1 per archetype |
| Battle Scene | 5 | Generic sci-fi battlefields |
| Campaign Banner | 3 | Generic campaign atmospherics |
| Empty State | 5 | No armies, no matches, no campaigns, no friends, no results |
| Match Result | 3 | Victory, defeat, draw |
| **Total** | **~67** | |

---

## 5. Prompt Engineering

### 5.1 Base Prompt Structure

All prompts follow a consistent structure for quality and style consistency:

```
[Subject description], [composition], [lighting], [mood], [style modifiers], [technical params]
```

### 5.2 Global Style Modifiers

Append to all prompts for visual consistency:

```
dark atmospheric scene, painterly concept art style, cinematic lighting, 
desaturated palette with selective warm highlights, weathered textures, 
high detail, matte painting quality, no text, no watermarks, no logos
```

### 5.3 Global Negative Prompt

Always include as negative prompt:

```
text, watermark, logo, signature, trademark, copyrighted material, 
bright colors, neon, cartoon, anime, pixel art, photorealistic photograph, 
cheerful, cute, humorous, stock photo, clean pristine surfaces, 
eight-pointed star, double-headed eagle, specific faction symbols,
real miniatures, tabletop models, painted figurines
```

### 5.4 Example Prompts by Asset Type

#### Login Splash (Web)
```
A vast, dark battlefield stretching to the horizon under a smoke-filled sky, 
scattered wreckage of war machines and broken fortifications, 
cold blue light breaking through storm clouds, 
volumetric fog, depth of field, ultra-wide composition,
dark atmospheric scene, painterly concept art style, cinematic lighting,
desaturated palette with selective cool blue highlights, 16:9 aspect ratio
```

#### Faction Hero — `super_soldier` Archetype
```
A towering armored warrior in heavy power armor standing on a ruined battlement,
glowing blue eye lenses, weathered steel-blue armor plates, 
mist rising from the battlefield below,
portrait composition centered, dramatic low-angle,
dark atmospheric scene, painterly concept art style, cinematic lighting,
color palette: steel blue primary with cold highlights, 4:3 aspect ratio
```

#### Faction Hero — `alien_swarm` Archetype
```
A massive chitinous alien creature emerging from organic terrain,
multiple limbs, bioluminescent markings in crimson and dark red,
swarm of smaller creatures in the background, organic mist,
portrait composition, menacing forward-facing pose,
dark atmospheric scene, painterly concept art style, cinematic lighting,
color palette: deep crimson primary with dark organic tones, 4:3 aspect ratio
```

#### Faction Hero — `machine_undead` Archetype
```
An ancient skeletal metallic construct rising from a dark tomb,
glowing green energy emanating from joints and eye sockets,
obsidian-black metal frame with tarnished silver accents,
geometric tomb architecture in background, dust particles in air,
dark atmospheric scene, painterly concept art style, cinematic lighting,
color palette: obsidian and dark steel with faint green energy, 4:3 aspect ratio
```

#### Faction Hero — `zealot_order` Archetype
```
A zealous warrior in ornate golden armor holding a flaming sword aloft,
religious iconography (generic, non-specific), flowing battle robes,
cathedral interior with stained glass casting amber light,
dramatic upward-angle composition, divine radiance from above,
dark atmospheric scene, painterly concept art style, cinematic lighting,
color palette: gold and amber primary with warm highlights, 4:3 aspect ratio
```

#### Battle Scene
```
An urban battlefield at twilight, crumbling buildings and burning vehicles,
two opposing forces clashing in the middle distance,
tracer fire and explosions lighting the scene in blue and cyan,
wide establishing shot, deep perspective,
dark atmospheric scene, painterly concept art style, cinematic lighting,
desaturated with selective warm and cool accent lighting, 2:1 aspect ratio
```

#### Empty State — No Armies
```
An empty weapon rack in a dimly lit armory chamber,
dust motes floating in a single beam of cold blue light from above,
stone walls with empty hooks and bare shelves,
centered composition, sense of potential and anticipation,
dark atmospheric scene, painterly concept art style, cinematic lighting,
minimal palette: dark grays with single steel blue accent, 4:3 aspect ratio
```

#### Campaign Banner
```
A strategic war map laid out on a dark wooden table,
pins and markers scattered across territories, candlelight illumination,
scrolls and documents at the edges, atmospheric smoke,
wide overhead-angle composition, shallow depth of field,
dark atmospheric scene, painterly concept art style, cinematic lighting,
cool blue tones, tactical planning mood, 3:1 aspect ratio
```

### 5.5 Archetype Color Mapping for Prompts

When generating faction-specific assets, use these color descriptions derived from `DESIGN_TOKENS.md`:

| Archetype | Prompt Color Description |
|---|---|
| `super_soldier` / Iron Legion | "steel blue armor, cold blue-gray metallics, faint blue glow" |
| `zealot_order` / Sunforged | "ornate golden armor, warm amber highlights, divine golden radiance" |
| `forest_spirit` / Verdant Order | "deep emerald green, living wood textures, verdant glow" |
| `eldritch` / Voidborn | "deep purple energy, ethereal violet, alien crystalline shimmer" |
| `alien_swarm` + `daemon_host` / Crimson Pact | "deep crimson, dark red organic surfaces, blood-red bioluminescence" |
| `noble_knight` / Storm Guard | "heraldic blue armor, noble blue-steel, banner blue highlights" |
| `death_lord` / Ashen Dominion | "bone and ash tones, dull bronze, dusty parchment whites" |
| `ethereal_tech` / Frost Warden | "clean pale blue, white-blue energy, cold crystalline surfaces" |
| `brutalist` / Ember Cult | "rusty orange metal, crude red-hot iron, ember glow, molten edges" |
| `machine_undead` / Obsidian Coil | "obsidian black metal, faint dark green glow, tarnished dark silver" |

---

## 6. Placeholder Strategy

Before final AI-generated assets are available, the app uses programmatic placeholders that maintain the dark tactical aesthetic.

### 6.1 CSS Gradient Placeholders

For backgrounds and hero areas:

```css
/* Generic dark tactical gradient (login, empty states) */
.placeholder-hero {
  background: linear-gradient(
    135deg,
    oklch(0.10 0.005 260) 0%,
    oklch(0.16 0.008 260) 40%,
    oklch(0.12 0.006 240) 100%
  );
}

/* Faction archetype gradient — use archetype muted color */
.placeholder-faction-hero {
  background: linear-gradient(
    180deg,
    oklch(0.14 0.005 260) 0%,
    var(--faction-{archetype}-muted) 50%,
    oklch(0.10 0.003 260) 100%
  );
}

/* Card splash gradient */
.placeholder-card {
  background: linear-gradient(
    90deg,
    oklch(0.19 0.006 260) 0%,
    oklch(0.14 0.005 260) 100%
  );
}
```

### 6.2 Geometric Pattern Placeholders

For thumbnails and icons when no image is available:

- **Unit thumbnails:** Archetype-colored circle with centered Lucide icon (Sword for melee, Crosshair for ranged, Shield for defensive)
- **Faction icons:** Archetype-colored square with first letter of archetype name, uppercase, monospace bold
- **Army cards:** Subtle repeating diagonal hash pattern using `--border-subtle` on `--bg-surface`

### 6.3 Lucide Icon Mapping for Placeholder States

| Empty State Context | Lucide Icon | Subtext |
|---|---|---|
| No armies | `Swords` | "Forge your first army" |
| No matches | `Target` | "Start your first battle" |
| No campaigns | `Map` | "Begin a campaign" |
| No friends | `Users` | "Find your allies" |
| No search results | `SearchX` | "No results found" |
| Coming soon (Tournaments) | `Trophy` | "Coming soon" |
| Error state | `AlertTriangle` | "Something went wrong" |
| Offline | `WifiOff` | "You're offline" |

### 6.4 Placeholder → Final Asset Migration

1. Placeholders are implemented as React components wrapping a `<div>` with CSS gradients or Lucide icons
2. Final assets are loaded via `<Image>` with `loading="lazy"` and `onError` fallback to placeholder
3. The placeholder component remains as the permanent fallback for failed image loads
4. Migration is incremental — replace one asset type at a time, starting with Login Splash and Faction Heroes

---

## 7. Tool Recommendations

### 7.1 Recommended AI Image Generators

| Tool | Best For | Strengths | Limitations | Cost |
|---|---|---|---|---|
| **Midjourney v6+** | Faction Heroes, Battle Scenes, Splash Art | Best painterly/concept art quality, excellent dark moody scenes | No API (Discord-only), less precise control | $10–60/mo |
| **DALL-E 3** (via ChatGPT/API) | Quick iterations, Empty States, Card Splashes | Good prompt adherence, API access, fast | Less painterly, can be too clean/digital | API pricing |
| **SDXL / Flux** (local/cloud) | Batch generation, consistent style via LoRA | Full control, customizable, no content policy issues | Requires setup, lower quality without fine-tuning | Self-hosted or cloud GPU |
| **Leonardo.ai** | Unit Thumbnails, Icons, Consistent Series | Style consistency via fine-tuned models, batch-friendly | Quality ceiling below Midjourney | $12–48/mo |

### 7.2 Recommended Workflow

1. **Concepting phase:** Use Midjourney for hero/splash assets — iterate on style and mood
2. **Production phase:** Use SDXL/Flux with LoRA trained on approved Midjourney outputs for batch consistency
3. **Icons and thumbnails:** Use Leonardo.ai or SDXL for consistent small-format assets
4. **Quick iteration:** Use DALL-E 3 for rapid placeholder replacement and A/B testing
5. **Post-processing:** All assets pass through:
   - Color grade to match oklch palette (adjust in Figma, Photoshop, or programmatically)
   - Crop to exact dimensions per asset catalog
   - Export as WebP with quality 80 (hero/splash) or 75 (thumbnails/cards)
   - Generate @2x variants for mobile retina

### 7.3 Style Reference Library

Maintain a folder of approved reference images (not for use, only for style guidance):
- `/docs/design/references/style-targets/` — 10–15 images that define the target aesthetic
- These are visual benchmarks, not assets to ship
- Tag each with: mood, composition, color profile, what makes it a good reference

---

## 8. Implementation Notes

### 8.1 Image Delivery

| Concern | Approach |
|---|---|
| **Format** | WebP primary (95%+ browser support). SVG for icons where possible. PNG fallback not needed for V1 browsers. |
| **Lazy loading** | `loading="lazy"` on all below-fold images. `loading="eager"` on Login Splash and above-fold hero images. |
| **CDN** | Serve all static assets via CDN (CloudFront or Vercel Edge). Cache-Control: `public, max-age=31536000, immutable` for versioned assets. |
| **Responsive images** | Use `srcSet` with 1x and 2x variants for mobile. Use `<picture>` for art-directed cropping at breakpoints. |
| **Blur placeholder** | Generate base64 blur hash (10×10 px) for each image. Display as placeholder during load (Next.js `blurDataURL`). |
| **Mobile (React Native)** | Use `expo-image` (or `react-native-fast-image`) for caching. Bundle critical images (login splash, empty states). Lazy fetch faction-specific assets. |

### 8.2 Plugin Integration

Plugins provide the archetype mapping. The image loading system works as follows:

```typescript
// Plugin provides:
interface GameSystemPlugin {
  factionArchetypeMap: Record<string, ArchetypeId>;
  // ... other plugin methods
}

// Image resolver (in shared or UI layer):
function getFactionHeroImage(factionId: string, plugin: GameSystemPlugin): string {
  const archetype = plugin.factionArchetypeMap[factionId];
  return `/assets/images/${plugin.id}/faction-hero/${archetype}_01.webp`;
}

// Fallback chain:
// 1. Game-system-specific asset: /assets/images/wh40k10e/faction-hero/super_soldier_01.webp
// 2. Shared archetype asset:    /assets/images/shared/faction-hero/super_soldier_01.webp
// 3. CSS gradient placeholder:  PlaceholderHero component with archetype color
```

### 8.3 Asset Metadata

Every generated image should be tracked with metadata for reproducibility:

```json
{
  "assetId": "faction-hero-super_soldier-01",
  "type": "faction-hero",
  "archetype": "super_soldier",
  "gameSystem": "wh40k10e",
  "tool": "midjourney-v6",
  "prompt": "...",
  "negativePrompt": "...",
  "seed": 123456,
  "dimensions": "800x600",
  "format": "webp",
  "quality": 80,
  "generatedDate": "2026-02-08",
  "approved": true,
  "approvedBy": "owner"
}
```

Store metadata in `/assets/images/manifest.json` or alongside each image as `{filename}.meta.json`.

### 8.4 Accessibility for Images

- All decorative images: `alt=""` (empty alt) + `role="presentation"`
- All informational images (faction icons in filters): descriptive `alt` text using archetype name — e.g., `alt="Iron Legion faction icon"`
- All hero/splash images used as backgrounds: CSS `background-image`, no `<img>` tag, no alt needed
- Empty state illustrations: `alt` describes the state — e.g., `alt="No armies yet"`
- Ensure sufficient contrast between text and any image used as a text background (use overlay)

---

## 9. Quality Checklist

Before any AI-generated image is approved for use in the app:

- [ ] **Legal compliance:** No trademarked elements, symbols, or identifiable IP
- [ ] **Style consistency:** Matches the grimdark painterly aesthetic defined in Section 2
- [ ] **Color harmony:** Integrates with the app's oklch color system (Section 2.2)
- [ ] **Correct dimensions:** Matches the asset catalog spec (Section 4.1)
- [ ] **Format compliance:** WebP at specified quality, with @2x variant where needed
- [ ] **Text overlay safety:** If used behind text, sufficient dark area or overlay for readability
- [ ] **No text in image:** Generated images must not contain any text, watermarks, or signatures
- [ ] **Placeholder fallback tested:** Image failure gracefully falls back to CSS placeholder
- [ ] **Metadata recorded:** Prompt, tool, seed, and approval status logged
- [ ] **Accessibility:** Correct `alt` attribute or `role="presentation"` applied

---

**End of Art Direction Brief**
