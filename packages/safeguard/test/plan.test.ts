import { describe, expect, it } from 'vitest';
import { addressing, assertPlanSafe, planFamilyMessage, type Family } from '../src/plan.js';

const families: Family[] = [
  { youthId: 'emmett', youthName: 'Emmett S.', youthEmail: 'emmett@example.com', guardianEmails: ['mom@example.com', ' dad@example.com '] },
  { youthId: 'ava', youthName: 'Ava R.', guardianEmails: ['ava.dad@example.com'] },
  { youthId: 'leo', youthName: 'Leo K.', youthEmail: 'leo@example.com', guardianEmails: ['not-an-email'] },
];

describe('planFamilyMessage', () => {
  it('copies parents, holds back scouts with no parent email, and adds the second adult', () => {
    const plan = planFamilyMessage(families, { includeYouth: true, secondAdultEmail: 'sam@example.com' });
    expect(plan.recipients).toEqual([
      { youthId: 'emmett', youthName: 'Emmett S.', to: ['mom@example.com', 'dad@example.com', 'emmett@example.com'] },
      { youthId: 'ava', youthName: 'Ava R.', to: ['ava.dad@example.com'] },
    ]);
    expect(plan.held).toEqual([{ youthId: 'leo', youthName: 'Leo K.', reason: 'No parent email yet' }]);
    expect(plan.cc).toEqual(['sam@example.com']);
  });

  it('leaves scouts off when asked to write to parents only', () => {
    const plan = planFamilyMessage(families, { includeYouth: false });
    expect(plan.recipients[0]?.to).not.toContain('emmett@example.com');
    expect(plan.cc).toEqual([]);
  });
});

describe('assertPlanSafe', () => {
  it('passes a plan it built', () => {
    expect(() => assertPlanSafe(planFamilyMessage(families, { includeYouth: true }), families)).not.toThrow();
  });

  it('throws when a scout is on a message without a parent', () => {
    const tampered = { recipients: [{ youthId: 'emmett', youthName: 'Emmett S.', to: ['emmett@example.com'] }] };
    expect(() => assertPlanSafe(tampered, families)).toThrow('Emmett S. has no parent on this message');
  });
});

describe('addressing', () => {
  it('blind-copies families when there are several', () => {
    const plan = planFamilyMessage(families, { includeYouth: false, secondAdultEmail: 'sam@example.com' });
    expect(addressing(plan, 'jon@example.com')).toEqual({
      to: ['jon@example.com'],
      cc: ['sam@example.com'],
      bcc: ['mom@example.com', 'dad@example.com', 'ava.dad@example.com'],
    });
  });

  it('addresses a single family directly', () => {
    const plan = planFamilyMessage(families.slice(1, 2), { includeYouth: false });
    expect(addressing(plan, 'jon@example.com')).toEqual({ to: ['ava.dad@example.com'], cc: [], bcc: [] });
  });

  it('sends to nobody visible when the sender has no valid email and there are several families', () => {
    const plan = planFamilyMessage(families, { includeYouth: false });
    expect(addressing(plan, null).to).toEqual([]);
  });
});
