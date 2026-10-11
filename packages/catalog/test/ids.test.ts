import { describe, expect, it } from 'vitest';
import {
  isItemKey,
  isRequirementId,
  isRequirementNumber,
  itemKey,
  parseItemKey,
  parseRequirementId,
  requirementId,
} from '../src/ids.js';

describe('requirement IDs', () => {
  it.each(['badge:plumbing#6b', 'rank:second-class#2a', 'badge:cycling#6a-optA', 'badge:plumbing#6a1', 'award:eagle-palm#1'])(
    'accepts %s',
    (id) => expect(isRequirementId(id)).toBe(true),
  );

  it.each(['plumbing#6b', 'badge:Plumbing#6b', 'badge:plumbing', 'badge:plumbing#', 'badge:plumbing#b6', 'patch:x#1', 'badge:-x#1', 'badge:plumbing#6b-'])(
    'rejects %s',
    (id) => expect(isRequirementId(id)).toBe(false),
  );

  it('round-trips through parse and format', () => {
    const id = requirementId(itemKey('badge', 'cycling'), '6a-optA');
    expect(id).toBe('badge:cycling#6a-optA');
    expect(parseRequirementId(id)).toEqual({ kind: 'badge', slug: 'cycling', item: 'badge:cycling', n: '6a-optA' });
  });

  it('throws on bad input', () => {
    expect(() => parseRequirementId('badge:plumbing')).toThrow(/Not a valid requirement ID/);
    expect(() => itemKey('badge', 'Has Spaces')).toThrow(/Not a valid item key/);
    expect(() => requirementId('badge:plumbing', 'Camping')).toThrow();
    expect(() => parseItemKey('nope')).toThrow();
  });

  it('tells requirement numbers from rank section headings', () => {
    expect(isRequirementNumber('1a')).toBe(true);
    expect(isRequirementNumber('Camping and Outdoor Ethics')).toBe(false);
  });

  it('checks item keys', () => {
    expect(isItemKey('rank:eagle')).toBe(true);
    expect(isItemKey('rank:eagle#1')).toBe(false);
    expect(parseItemKey('rank:first-class')).toEqual({ kind: 'rank', slug: 'first-class' });
  });
});
