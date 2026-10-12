# @scout-core/safeguard

The youth-protection rules Compass, Waypoint and Lantern all follow, as plain functions with
no database or framework. The API and database enforce them; apps call them to show a sender
who will be copied before anything is sent.

1. A parent or guardian is copied on every message that reaches a scout.
2. A scout never starts a direct message or email; they can only post in a group.
3. Any group with scouts has at least two registered leaders with current youth protection
   training. Parents don't count toward the two.
4. In a group, every scout has a guardian in the group too.

Rules 1, 2 and the address helpers come from Waypoint (`app/src/lib/safeguard.ts` and its
database triggers). Rule 3 comes from Compass's two-deep check (`src/lib/chat/index.ts`).
Rule 4 is new for Compass chat.

```ts
import { checkMessage, checkGroup, planFamilyMessage, addressing } from '@scout-core/safeguard';

checkMessage({ sender, recipients, guardiansOf });   // { ok: true } or { ok: false, violations }
checkGroup({ members, guardiansOf, now: new Date() });
const plan = planFamilyMessage(families, { includeYouth: true, secondAdultEmail });
addressing(plan, senderEmail);                        // { to, cc, bcc }, families blind-copied
```
