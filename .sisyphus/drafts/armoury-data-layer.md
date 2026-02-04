# Draft: Armoury Data Layer

## Requirements (confirmed)
- **Purpose**: Shared TypeScript data layer for Warhammer 40k army management app
- **Data Source**: BSData/wh40k-10e GitHub repo (XML .cat/.gst files)
- **Platforms**: React Native (SQLite) + Web (IndexedDB)
- **Pattern**: Strategy Pattern for database adapters
- **Sync Strategy**: Check GitHub SHA on app load to detect updates
- **Scope**: Data layer ONLY - no UI

## Folder Structure (confirmed)
```
src/shared/
├── clients/           # GitHub API client
├── data/
│   ├── sqlite/        # SQLite adapter
│   └── indexdb/       # IndexedDB adapter
├── lib/               # Common utilities
└── util/              # Helper functions
```

## Technical Decisions
- **XML parsing**: fast-xml-parser (cross-platform, proven performance, TypeScript support)
- **Error handling**: Fail fast - stop on first error, surface to app
- **Offline support**: Full offline - cache all data locally after first sync
- **Test strategy**: TDD - write tests first for data integrity
- **Data entities**: ALL (Units, Weapons, Abilities, Stratagems, Detachments, Points, Keywords)

## Research Findings

### BSData XML Structure (from explore agent)
- **Game System file** (.gst): Defines core rules, profile types, cost types, categories
- **Catalogue files** (.cat): Faction-specific units, weapons, abilities
- **Key elements**: `selectionEntry` (units), `profile` (stats), `characteristics` (values)
- **Relationships**: UUID-based references via `id` and `targetId` attributes
- **Two-phase parsing needed**: Parse .gst first (schema), then .cat files
- **Typical sizes**: 5KB to 3.4MB per faction file

### Strategy Pattern Best Practices (from librarian agent)
- Use abstract base class with async methods returning Promise
- Include type discriminator: `readonly dbType: 'sqlite' | 'indexeddb'`
- Transaction pattern: `beginTransaction()`, `commit()`, `rollback()`
- Platform detection via `Platform.OS === 'web'`
- Lazy loading for platform-specific modules
- Repository pattern for type-safe data access

### XML Parsing (from librarian agent)
- **Recommended**: fast-xml-parser - 20KB bundle, handles 100MB+, React Native verified
- **Configuration**: Use `isArray` callback for consistent array handling
- **Type safety**: Configure `attributeNamePrefix: '@_'` for attribute separation
- **Validation**: Layer Zod schemas on top for runtime type checking
- **Mobile performance**: DOM parsing fine for 1-5MB files (BattleScribe typical size)

### Database Libraries (from librarian agent - 2026-02-04)
**SQLite (React Native):**
- **expo-sqlite** (RECOMMENDED): Async/await API, built-in React hooks, TypeScript-first, web support (alpha)
- **react-native-sqlite-storage**: Callback/Promise API, less active maintenance

**IndexedDB (Web):**
- **Dexie** (RECOMMENDED): Rich query API, built-in migrations `.upgrade()`, React hooks, ~13KB
- **idb**: Tiny (~1KB), low-level control, no built-in migrations

### GitHub API (from librarian agent - 2026-02-04)
- **Conditional requests**: ETag/If-Modified-Since for SHA comparison (free, doesn't count against rate limit)
- **Rate limits**: 60/hour unauthenticated, 5000/hour authenticated
- **Caching**: axios-cache-interceptor with ETag support
- **File limits**: ≤1MB all features, 1-100MB raw only, >100MB use Git Data API
- **Error handling**: Typed error hierarchy (GitHubApiError, XmlParseError, RateLimitError)

## Open Questions (ALL RESOLVED)
1. ✅ Data entities: All (units, weapons, abilities, stratagems, detachments, points, keywords)
2. ✅ Error handling: Fail fast
3. ✅ Offline support: Full offline
4. ✅ Test strategy: TDD
5. ✅ Database libraries: expo-sqlite (RN) + Dexie (web)
6. ✅ Sync strategy: Full file sync with SHA comparison
7. ✅ API consumption: Factory/DI pattern (`createDataManager(config)`)

## Scope Boundaries
- INCLUDE: GitHub client, XML parser, database adapters, sync logic, TypeScript interfaces
- EXCLUDE: UI components, army builder logic, point calculations, list validation
