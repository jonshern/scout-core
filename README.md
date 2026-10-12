# scout-core

Shared layer for three scouting sites built on one backend:

- **Compass**: troops running their unit
- **Waypoint**: merit badge counselors and events
- **Lantern**: a scout's own path to Eagle

Design: [docs/architecture.md](docs/architecture.md).

## Packages

| Package | What it does |
| --- | --- |
| [`@scout-core/safeguard`](packages/safeguard) | Youth-protection rules: parent always copied, scouts never start direct messages, two trained leaders in any group with scouts |
| [`@scout-core/catalog`](packages/catalog) | Scouts BSA rank and merit badge requirements with stable requirement IDs (`badge:plumbing#6b`), a validator and the compiled `catalog.json` every app reads |

## Working on it

Needs Node 22 (`.nvmrc`).

```sh
npm install
npm run check      # lint, typecheck, tests, build
npm test           # tests only
npm run build      # writes packages/*/dist
```

CI runs the same checks on every push and pull request.

No youth data belongs in this repo. It is public.
