# @scout-core/catalog

Every Scouts BSA rank and merit badge requirement, one YAML file per item, with the
requirement IDs that Compass, Waypoint and Lantern all join on.

```
data/ranks/<slug>.yaml     7 ranks, Scout to Eagle
data/badges/<slug>.yaml    141 badges (140 current, Citizenship in Society kept as discontinued)
data/REVIEW.md             what was checked by hand and what still needs a word-for-word check
```

## Using it

```ts
import catalog from '@scout-core/catalog/catalog.json' with { type: 'json' };
import { checkableIds, findItem, eagleRequiredBadges, parseRequirementId } from '@scout-core/catalog';

checkableIds(findItem(catalog, 'badge:plumbing')!); // ['badge:plumbing#1a', ... 'badge:plumbing#7']
parseRequirementId('badge:cycling#6a-optA');        // { kind: 'badge', slug: 'cycling', item: 'badge:cycling', n: '6a-optA' }
```

`catalog.json` has the same shape Waypoint and Emmett's Journey already read
(`{ ranks: Item[], badges: Item[] }`), so either app can switch without code changes.

In Node, `@scout-core/catalog/node` reads and validates the YAML directly (`loadCatalog()`).

## Editing requirements

Edit the YAML, then run `npm test` from the repo root. The tests load every file, so a
duplicate number, a bad ID, a `choose` larger than its list or an unknown `option` fails CI.

File format:

```yaml
id: badge:plumbing
name: Plumbing
edition: 2026
eagle_required: false
official_url: https://www.scouting.org/merit-badges/plumbing/
requirements:
  - n: "6"
    text: "Do FOUR of the following:"
    choose: 4
    children:
      - n: 6a
        text: ...
```

Optional fields: `worksheet_url`, `summary`, `discontinued` (date), `formerly`, `notes`,
and on requirements `options` with children marked `option: A`.
