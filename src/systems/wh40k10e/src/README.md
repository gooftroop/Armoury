# Warhammer 40K 10th Edition

Game system plugin for Warhammer 40,000 10th Edition.

> **Disclaimer:** This is an unofficial, fan-made tool. It is not affiliated with or endorsed by Games Workshop. All trademarks are property of their respective owners.

## Structure

```
wh40k10e/
├── public/       Downloadable content (localization, styling, config)
├── config/       Faction configuration and mappings
├── dao/          Data access objects for game entities
├── data/         Parsers and extractors for community data files
├── models/       Game-specific data models
├── types/        Game-specific type definitions
└── validation/   Army list validation rules
```

## Public vs Private

- **`public/`** — Contains downloadable content that can be distributed separately from the application binary. This includes localization files, CSS theme overrides, and configuration that does not contain copyrighted game rules or stats. This folder is zipped and published as a downloadable asset.

- **Everything else** — Source code that implements game logic, data parsing, and validation. This code is compiled into the application and is not distributed independently.

## Dependencies

This plugin depends on `@armoury/shared` for core infrastructure (adapters, DAOs, schema, validation engine). It does not depend on any frontend packages — all code here is platform-agnostic TypeScript.
