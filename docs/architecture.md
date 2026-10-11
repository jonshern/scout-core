# Architecture

The living version of this design, with a diagram and comments, is the Claude Doc
"Shared layer across Compass, Bluecard and Emmett's Journey" in the Emmett Scouting project.
This file is the copy that travels with the code. Last updated 2026-10-11.

## Three sites on one core

| Site | For | Today |
| --- | --- | --- |
| **Compass** ([jonshern/Scouthosting](https://github.com/jonshern/Scouthosting)) | Troops running their unit: website, calendar, roster, messaging, treasury | Next.js + Prisma, 85 tables |
| **Bluecard** ([jonshern/bluecard](https://github.com/jonshern/bluecard)) | Merit badge counselors and events: kits, badge days, sign-ups | Expo app (web and phone), GCP pipeline, Compass backend being ported in |
| **Path to Eagle** | A scout and their family following ranks and badges to Eagle | Emmett's Journey (jonshern/emmett-scouting), offline on his device; to be generalized for any scout |

## The shape

**One backend, a few small packages.** Compass's code is the single API every site calls.
Server-side concerns (sign-in, events, messaging, storage, email, push, jobs) are shared by
being one service, not by being copied. scout-core holds only what the apps themselves must
agree on:

| Package | What it is | Status |
| --- | --- | --- |
| `@scout-core/catalog` | Rank and merit badge requirements, requirement IDs, validator, compiled `catalog.json` | Started |
| `@scout-core/safeguard` | Youth-protection rules: who must be copied, who may message whom; the same rules the database enforces | Planned |
| `@scout-core/api-client` | Typed client for the backend API, shared by the Expo apps | Planned |
| `@scout-core/tokens` | Slate & Sky design tokens and the small UI pieces the apps copy today | Planned |

Curriculum and idea lists stay with Bluecard; Emmett's own data stays in emmett-scouting.

## What is shared where

| Concern | Shared? | Where |
| --- | --- | --- |
| Sign-in and accounts | Yes: one account across sites (Better Auth) | Backend |
| People, guardians, roles | Yes: a real guardian table replaces Compass's parent-id list | Backend |
| Youth-protection messaging | Yes: parent copied on every message to a scout, plus two trained adults in any group with scouts | Backend + `safeguard` |
| Events, slots, waitlists, RSVPs, permission slips | Yes: Compass's models; a badge-day station is a slot | Backend |
| Requirement catalog and IDs | Yes | `catalog` |
| Storage, email, push, jobs | Yes | Backend |
| API types | Yes | `api-client` |
| Design tokens | Yes | `tokens` |
| Troop website, treasury, sales | No | Compass |
| Counselor kits, meeting runner, badge-day planner | No | Bluecard |
| A scout's trail screens | No | Path to Eagle |

## Requirement IDs

Every product joins on the same string:

```
badge:plumbing           item key
badge:plumbing#6b        requirement ID
rank:second-class#2a     rank requirement
badge:cycling#6a-optA    a requirement inside a "do ONE option" group
```

Kinds are `badge`, `rank` and `award`. The part after `#` starts with a digit and may contain
letters, digits, dots and dashes. Rank section headings ("Camping and Outdoor Ethics") are
groups, not requirements, and have no ID. See `packages/catalog/src/ids.ts`.

## Migration order

Each step starts only after the threads it touches have merged.

1. **Copy rule (now).** `bluecard/server/` tracks Scouthosting main; Bluecard additions go in new files and migrations.
2. **Catalog package.** In scout-core now. Bluecard and Emmett's app switch to it when Jon says go. Emmett's app needs an ID map for 83 changed items. Bluecard's `progress.requirement_id` check rejects 326 real IDs (for example `badge:cycling#6a-optA`) and must be widened to `REQUIREMENT_ID_PATTERN`.
3. **Sign-in.** After the Better Auth work merges in Scouthosting: sync it, drop Firebase Auth from Bluecard's Terraform, wire Bluecard's app to Better Auth.
4. **Cutover.** After the Compass mobile API and code-health work merges: one Compass codebase, the other frozen.
5. **Guardians and messaging.** Guardian table, combined rule in `safeguard` plus database triggers.
6. **Events.** Badge-day blocks and stations onto Compass events and slots.
7. **Tokens and UI.** `packages/tokens` for all the Expo apps.
8. **Path to Eagle.** Progress table in the backend; the scout site reads the catalog and progress; sign-offs from Bluecard and Compass tick the same IDs.

## Trade-offs

| Shape | Good | Costly |
| --- | --- | --- |
| One backend + small packages (chosen direction) | One account, one place to fix security holes, one deploy and bill | Bluecard inherits Compass's size; Compass's tenant model has to stretch to district-level events |
| Packages only, separate backends | Each product deploys alone | Two Compass copies drift; every fix made twice; two accounts per family |
| Separate shared service | Clean identity boundary | A third service to run, for one developer |

Open risks: repo visibility (Scouthosting, Bluecard and scout-core are public; youth data
must never be committed), Compass's per-org encryption of member details must cover guardians
who belong to no org, and the stricter messaging rule will change Compass chat for leaders.
