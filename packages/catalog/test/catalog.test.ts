import { describe, expect, it } from 'vitest';
import { checkableIds, eagleRequiredBadges, findItem, nextRank, RANK_ORDER, allNumbers } from '../src/compile.js';
import { isRequirementId } from '../src/ids.js';
import { loadCatalog, readSources } from '../src/node.js';

// These run against the real data folder, so a bad edit to any YAML file fails CI.
const catalog = loadCatalog();

describe('the shipped catalog', () => {
  it('has all seven ranks in order and every current badge', () => {
    expect(catalog.ranks.map((r) => r.key)).toEqual(RANK_ORDER.map((s) => `rank:${s}`));
    expect(catalog.badges.length).toBe(141);
    expect(catalog.badges.filter((b) => !b.retired).length).toBe(140);
  });

  it('gives every checkable requirement a valid, unique ID', () => {
    const all = [...catalog.ranks, ...catalog.badges].flatMap(checkableIds);
    expect(all.every(isRequirementId)).toBe(true);
    expect(new Set(all).size).toBe(all.length);
  });

  it('keeps the IDs counselors and the trail already use for Plumbing', () => {
    const plumbing = findItem(catalog, 'badge:plumbing')!;
    expect(checkableIds(plumbing)).toEqual(
      ['1a', '1b', '1c', '2a', '2b', '3', '4', '5', '6a', '6b', '6c', '6d', '6e', '6f', '6g', '7'].map((n) => `badge:plumbing#${n}`),
    );
    expect(plumbing.reqs.find((r) => r.n === '6')?.choose).toBe(4);
  });

  it('skips rank section headings', () => {
    const ids = checkableIds(findItem(catalog, 'rank:second-class')!);
    expect(ids).toContain('rank:second-class#2a');
    expect(ids.some((id) => id.includes('Camping'))).toBe(false);
  });

  it('knows the path to Eagle', () => {
    const eagle = eagleRequiredBadges(catalog).map((b) => b.key);
    expect(eagle).toContain('badge:first-aid');
    expect(eagle).not.toContain('badge:citizenship-in-society');
    expect(nextRank('life')).toBe('eagle');
    expect(nextRank('eagle')).toBeUndefined();
  });

  it('lists every number in a source file, nested ones too', () => {
    const plumbing = readSources().find((s) => s.file === 'plumbing.yaml')!;
    expect(allNumbers(plumbing.doc)).toContain('6a3');
  });
});
