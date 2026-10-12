# Architecture

The living version of this design, with a diagram and comments, is the Claude Doc
"Shared layer across Compass, Waypoint and Northstar" in the Emmett Scouting project.
This file is the copy that travels with the code. Last updated 2026-10-11.

## Is the core an API or components?

Both, split by what each part is for. Anything that holds data or enforces a rule runs as
one **API**: Compass's backend, deployed once. Anything an app needs at build time ships as
**packages** from this repo.

| Part | Form | Why |
| --- | --- | --- |
| Accounts, roles, guardians, scouts, progress, events, sign-ups, messaging | One API | Data and safety rules live in one place; one account per family; a Waypoint sign-off shows on the scout's trail |
| Requirement catalog and IDs | Package | Static data every app bundles; works offline |
| Youth-protection rules (client side) | Package | Apps preview who gets copied; the API enforces the same rules |
| Typed API client | Package | The three apps call the API the same way |
| Design tokens and shared UI | Package | One Slate & Sky look |

An API alone would make apps fetch data they can bundle and leave the UI copied three times.
Packages alone would leave each product with its own accounts and its own copy of Compass.

## Three sites on one core

Product names: **Compass** (troops), **Waypoint** (merit badges and events), **Northstar** (a scout's path to Eagle; renamed from Summit on 2026-10-12 because Scouting America owns THE SUMMIT mark). Repo names stay as they are.

| Site | For | Today |
| --- | --- | --- |
| **Compass** ([jonshern/Scouthosting](https://github.com/jonshern/Scouthosting)) | Troops running their unit: website, calendar, roster, messaging, treasury | Next.js + Prisma, 85 tables |
| **Waypoint** ([jonshern/bluecard](https://github.com/jonshern/bluecard)) | Merit badge counselors and events: kits, badge days, sign-ups | Expo app (web and phone), GCP pipeline, Compass backend being ported in |
| **Northstar** | A scout and their family following ranks and badges to Eagle | First version is Emmett's Journey (jonshern/emmett-scouting), offline on his device |

## The shape

**One backend, a few small packages.** Compass's code is the single API every site calls.
Server-side concerns (sign-in, events, messaging, storage, email, push, jobs) are shared by
being one service, not by being copied. scout-core holds only what the apps themselves must
agree on:

| Package | What it is | Status |
| --- | --- | --- |
| `@scout-core/catalog` | Rank and merit badge requirements, requirement IDs, validator, compiled `catalog.json` | Started |
| `@scout-core/safeguard` | Youth-protection rules: who must be copied, who may message whom; the same rules the database enforces | Started |
| `@scout-core/api-client` | Typed client for the backend API, shared by the Expo apps | Planned |
| `@scout-core/tokens` | Slate & Sky design tokens and the small UI pieces the apps copy today | Planned |

Curriculum and idea lists stay with Waypoint; Emmett's own data stays in emmett-scouting.

## Where each piece lives (decided 2026-10-11)

| Repo | Holds | Deploys |
| --- | --- | --- |
| jonshern/Scouthosting | The core service: Compass's Next.js app, which is both the troop site and the API every product calls (Better Auth sign-in, `/api/v1`), plus the family Terraform | One core Cloud Run service and Cloud SQL |
| jonshern/scout-core | Shared packages only | Packages, published for the other repos to install |
| jonshern/bluecard | Waypoint's Expo app | Waypoint web on Firebase Hosting (`/api/**` to the core), phone app via EAS |
| jonshern/emmett-scouting | Emmett's Journey, Northstar's first version | Later: Northstar web the same way as Waypoint |

The core stays in Scouthosting because the API and the troop site are one Next.js app; splitting
them is a large refactor with no payoff yet, and three threads are working there now. The
`bluecard/server/` copy of Compass is retired rather than kept in step. If the API is ever
split from the troop UI, the API can move here as `apps/core`.

## Sign-in

Sign-in is part of the one API, not a scout-core package. After Scouthosting PR #120,
Compass's auth is Better Auth in `src/lib/auth/`: `auth.ts` (config), `session.ts`,
`mfa-plugin.ts` (Compass's own two-step), `providers.ts` (Google, Apple), `social-routes.ts`
and `claim-orgs.ts`. Waypoint and Northstar sign in with Better Auth's client against the same
API, through `@scout-core/api-client`. If a second server ever needs it, `auth.ts`,
`mfa-plugin.ts` and `providers.ts` can lift into `@scout-core/auth`, since Better Auth runs
outside Next.js.

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
| Counselor kits, meeting runner, badge-day planner | No | Waypoint |
| A scout's trail screens | No | Northstar |

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

1. **One source (now).** Scouthosting is the only Compass; the core image builds from it and `bluecard/server/` is dropped. Waypoint-only tables go in as new Scouthosting migrations.
2. **Catalog package.** In scout-core now. Waypoint and Emmett's app switch to it when Jon says go. Emmett's app needs an ID map for 83 changed items. Waypoint's `progress.requirement_id` check rejects 326 real IDs (for example `badge:cycling#6a-optA`) and must be widened to `REQUIREMENT_ID_PATTERN`.
3. **Sign-in.** After the Better Auth work merges in Scouthosting: drop Firebase Auth from Waypoint's Terraform, wire Waypoint's app to Better Auth.
4. **Family deploy.** After the Compass mobile API and code-health work merges: family Terraform and deploy next to the core in Scouthosting, Waypoint and Northstar on Firebase Hosting with `/api/**` sent to the core, Compass off fly.io.
5. **Guardians and messaging.** Guardian table, combined rule in `safeguard` plus database triggers.
6. **Events.** Badge-day blocks and stations onto Compass events and slots.
7. **Tokens and UI.** `packages/tokens` for all the Expo apps.
8. **Northstar.** Progress table in the backend; the scout site reads the catalog and progress; sign-offs from Waypoint and Compass tick the same IDs.

## Trade-offs

| Shape | Good | Costly |
| --- | --- | --- |
| One backend + small packages (chosen direction) | One account, one place to fix security holes, one deploy and bill | Waypoint inherits Compass's size; Compass's tenant model has to stretch to district-level events |
| Packages only, separate backends | Each product deploys alone | Two Compass copies drift; every fix made twice; two accounts per family |
| Separate shared service | Clean identity boundary | A third service to run, for one developer |

Open risks: repo visibility (Scouthosting, bluecard and scout-core are public; youth data
must never be committed), Compass's per-org encryption of member details must cover guardians
who belong to no org, and the stricter messaging rule will change Compass chat for leaders.
