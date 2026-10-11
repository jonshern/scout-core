/**
 * Building a safe recipient list for an email to families (Waypoint's counselor messages,
 * Compass event notices). Works on addresses, so it runs on a device before anything is sent.
 */

export interface Family {
  youthId: string;
  youthName: string;
  youthEmail?: string;
  guardianEmails: readonly string[];
}

export interface Plan {
  /** One entry per youth reached: the addresses that carry the message to that family. */
  recipients: { youthId: string; youthName: string; to: string[] }[];
  /** Youth left off because no guardian can be copied. Never sent alone. */
  held: { youthId: string; youthName: string; reason: string }[];
  /** A second adult copied on everything, when the sender has one. */
  cc: string[];
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isEmail = (e?: string | null): e is string => !!e && EMAIL.test(e.trim());
const clean = (list: readonly string[]) => list.map((e) => e.trim()).filter(isEmail);

export function planFamilyMessage(families: readonly Family[], opts: { includeYouth: boolean; secondAdultEmail?: string | null }): Plan {
  const recipients: Plan['recipients'] = [];
  const held: Plan['held'] = [];
  for (const f of families) {
    const parents = clean(f.guardianEmails);
    if (!parents.length) {
      held.push({ youthId: f.youthId, youthName: f.youthName, reason: 'No parent email yet' });
      continue;
    }
    const to = [...parents];
    if (opts.includeYouth && isEmail(f.youthEmail)) to.push(f.youthEmail.trim());
    recipients.push({ youthId: f.youthId, youthName: f.youthName, to });
  }
  const cc = isEmail(opts.secondAdultEmail) ? [opts.secondAdultEmail.trim()] : [];
  return { recipients, held, cc };
}

/** Throws if any youth on the plan has no guardian address alongside. The last check before sending. */
export function assertPlanSafe(plan: Pick<Plan, 'recipients'>, families: readonly Family[]): void {
  const byId = new Map(families.map((f) => [f.youthId, f]));
  for (const r of plan.recipients) {
    const parents = clean(byId.get(r.youthId)?.guardianEmails ?? []);
    if (!parents.some((p) => r.to.includes(p))) throw new Error(`${r.youthName} has no parent on this message`);
  }
}

/**
 * How to address the plan. With several families everyone is blind-copied so no family sees
 * another's address, and the sender is the visible recipient. One family is addressed directly.
 */
export function addressing(plan: Pick<Plan, 'recipients' | 'cc'>, senderEmail: string | null | undefined) {
  const all = [...new Set(plan.recipients.flatMap((r) => r.to))];
  const single = plan.recipients.length === 1;
  return {
    to: single ? all : isEmail(senderEmail) ? [senderEmail.trim()] : [],
    cc: [...plan.cc],
    bcc: single ? [] : all,
  };
}
