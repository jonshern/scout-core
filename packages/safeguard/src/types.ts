/** Anyone who can be on a message or in a group. Plain data so the rules run anywhere: API, database job, or app. */
export interface Person {
  id: string;
  /** Youth members are scouts under 18; everyone else is an adult. */
  kind: 'youth' | 'adult';
  email?: string;
  /** Adults only: when their youth protection training expires. Missing or past means not current. */
  yptCurrentUntil?: Date | string | null;
  /** Adults only: a registered leader (unit leader, counselor, organizer or admin), as opposed to a parent. */
  isLeader?: boolean;
}

/** Who may be copied for a youth: the youth's parents or legal guardians, by person id. */
export type GuardiansOf = (youthId: string) => readonly string[];

export type Violation =
  | { code: 'youth-sender'; message: string }
  | { code: 'guardian-missing'; youthId: string; message: string }
  | { code: 'two-deep'; leaders: number; message: string };

export type Verdict = { ok: true } | { ok: false; violations: Violation[] };
