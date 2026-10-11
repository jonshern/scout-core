import { describe, expect, it } from 'vitest';
import { checkGroup, checkMessage, yptCurrent } from '../src/rules.js';
import type { Person } from '../src/types.js';

const now = new Date('2026-10-11T12:00:00Z');
const future = '2027-01-01';
const past = '2026-01-01';

const scout: Person = { id: 'emmett', kind: 'youth' };
const scout2: Person = { id: 'ava', kind: 'youth' };
const mom: Person = { id: 'mom', kind: 'adult' };
const avaDad: Person = { id: 'ava-dad', kind: 'adult' };
const counselor: Person = { id: 'jon', kind: 'adult', isLeader: true, yptCurrentUntil: future };
const leader2: Person = { id: 'sam', kind: 'adult', isLeader: true, yptCurrentUntil: future };
const lapsed: Person = { id: 'pat', kind: 'adult', isLeader: true, yptCurrentUntil: past };
const guardiansOf = (id: string) => ({ emmett: ['mom'], ava: ['ava-dad'] })[id] ?? [];

describe('checkMessage', () => {
  it('allows a counselor writing to a scout with a parent copied', () => {
    expect(checkMessage({ sender: counselor, recipients: [scout, mom], guardiansOf })).toEqual({ ok: true });
  });

  it('blocks a one-on-one message from an adult to a scout', () => {
    const v = checkMessage({ sender: counselor, recipients: [scout], guardiansOf });
    expect(v.ok).toBe(false);
    expect(!v.ok && v.violations.map((x) => x.code)).toEqual(['guardian-missing']);
  });

  it('counts a parent who is the sender as copied', () => {
    expect(checkMessage({ sender: mom, recipients: [scout, counselor], guardiansOf }).ok).toBe(true);
  });

  it("does not accept another family's parent", () => {
    expect(checkMessage({ sender: counselor, recipients: [scout, avaDad], guardiansOf }).ok).toBe(false);
  });

  it('blocks a scout starting a direct message, even with a parent on it', () => {
    const v = checkMessage({ sender: scout, recipients: [counselor, mom], guardiansOf });
    expect(!v.ok && v.violations.map((x) => x.code)).toEqual(['youth-sender']);
  });

  it('lets adults write to adults freely', () => {
    expect(checkMessage({ sender: counselor, recipients: [mom, avaDad], guardiansOf }).ok).toBe(true);
  });
});

describe('checkGroup', () => {
  it('passes a group with two current leaders and each scout’s parent', () => {
    expect(checkGroup({ members: [counselor, leader2, scout, mom, scout2, avaDad], guardiansOf, now }).ok).toBe(true);
  });

  it('needs two leaders with current training; parents and lapsed leaders do not count', () => {
    const v = checkGroup({ members: [counselor, lapsed, mom, scout], guardiansOf, now });
    expect(!v.ok && v.violations).toEqual([expect.objectContaining({ code: 'two-deep', leaders: 1 })]);
  });

  it('needs a guardian for every scout in the group', () => {
    const v = checkGroup({ members: [counselor, leader2, scout, mom, scout2], guardiansOf, now });
    expect(!v.ok && v.violations).toEqual([expect.objectContaining({ code: 'guardian-missing', youthId: 'ava' })]);
  });

  it('places no limits on adult-only groups', () => {
    expect(checkGroup({ members: [mom, avaDad], guardiansOf, now }).ok).toBe(true);
  });
});

describe('yptCurrent', () => {
  it('is false for youth, missing dates and expired training', () => {
    expect(yptCurrent(scout, now)).toBe(false);
    expect(yptCurrent(mom, now)).toBe(false);
    expect(yptCurrent(lapsed, now)).toBe(false);
    expect(yptCurrent({ ...counselor, yptCurrentUntil: new Date('2026-12-01') }, now)).toBe(true);
  });
});
