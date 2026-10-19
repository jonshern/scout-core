import type { GuardiansOf, Person, Verdict, Violation } from './types.js';

/**
 * The rules every product follows, combining Waypoint's and Compass's:
 *
 * 1. A parent or guardian is copied on every message that reaches a youth.
 * 2. A youth never starts a direct message or email; they can only post in a group.
 * 3. Any group with youth in it has at least two registered leaders with current
 *    youth protection training. Parents don't count toward the two.
 * 4. In a group, every youth member has a guardian in the group too.
 *
 * These functions decide; the API and the database enforce. Apps call them to show a
 * sender who will be copied before anything is sent.
 */

export function yptCurrent(p: Person, now: Date): boolean {
  if (p.kind !== 'adult' || !p.yptCurrentUntil) return false;
  return new Date(p.yptCurrentUntil).getTime() > now.getTime();
}

// Fail closed: anyone not plainly marked adult (a missing or misspelled
// kind from JSON or a database row) is treated as a youth.
const isYouth = (p: Person) => p.kind !== 'adult';

const verdict = (violations: Violation[]): Verdict => (violations.length ? { ok: false, violations } : { ok: true });

/** Rule 1 and 2 for a direct message or email. `recipients` is everyone on it besides the sender (To, CC and BCC). */
export function checkMessage(args: { sender: Person; recipients: readonly Person[]; guardiansOf: GuardiansOf }): Verdict {
  const { sender, recipients, guardiansOf } = args;
  const violations: Violation[] = [];
  if (isYouth(sender)) {
    violations.push({ code: 'youth-sender', message: 'Scouts can post in a group but cannot start a direct message or email.' });
  }
  const onMessage = new Set([sender.id, ...recipients.map((r) => r.id)]);
  for (const r of recipients) {
    if (!isYouth(r)) continue;
    if (!guardiansOf(r.id).some((g) => g !== r.id && onMessage.has(g))) {
      violations.push({ code: 'guardian-missing', youthId: r.id, message: `No parent or guardian of ${r.id} is on this message.` });
    }
  }
  return verdict(violations);
}

/** Rules 3 and 4 for a group (a chat channel, an event's message list, a patrol). */
export function checkGroup(args: { members: readonly Person[]; guardiansOf: GuardiansOf; now: Date }): Verdict {
  const { members, guardiansOf, now } = args;
  const youth = members.filter(isYouth);
  if (!youth.length) return { ok: true };
  const violations: Violation[] = [];
  // Count people, not entries: the same leader listed twice (a channel roster merged
  // with an event roster) is still one adult.
  const leaders = new Set(members.filter((m) => m.isLeader && yptCurrent(m, now)).map((m) => m.id)).size;
  if (leaders < 2) {
    violations.push({
      code: 'two-deep',
      leaders,
      message: `A group with scouts needs two leaders with current youth protection training; it has ${leaders}.`,
    });
  }
  const ids = new Set(members.map((m) => m.id));
  for (const y of youth) {
    if (!guardiansOf(y.id).some((g) => g !== y.id && ids.has(g))) {
      violations.push({ code: 'guardian-missing', youthId: y.id, message: `No parent or guardian of ${y.id} is in this group.` });
    }
  }
  return verdict(violations);
}
