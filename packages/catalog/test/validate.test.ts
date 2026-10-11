import { describe, expect, it } from 'vitest';
import type { SourceItem } from '../src/types.js';
import { validateCatalog, validateItem } from '../src/validate.js';

const good = (): SourceItem => ({
  id: 'badge:plumbing',
  name: 'Plumbing',
  edition: 2026,
  requirements: [
    { n: '1', text: 'Do the following:', children: [{ n: '1a', text: 'a' }, { n: '1b', text: 'b' }] },
    { n: '2', text: 'Do ONE option:', choose: 1, options: [{ key: 'A', name: 'Road' }, { key: 'B', name: 'Trail' }], children: [
      { n: '2a-optA', option: 'A', text: 'road' },
      { n: '2a-optB', option: 'B', text: 'trail' },
    ] },
  ],
});

describe('validateItem', () => {
  it('passes a good file', () => expect(validateItem(good(), 'plumbing.yaml')).toEqual([]));

  it('catches a file name that does not match the id', () => {
    expect(validateItem(good(), 'woodwork.yaml')).toEqual(['woodwork.yaml: id "badge:plumbing" doesn\'t match the file name']);
  });

  it('catches duplicate numbers at any depth', () => {
    const doc = good();
    doc.requirements[1]!.children![1]!.n = '1a';
    expect(validateItem(doc).join()).toMatch(/1a is used twice/);
  });

  it('catches choose larger than the pool', () => {
    const doc = good();
    doc.requirements[0]!.choose = 3;
    expect(validateItem(doc).join()).toMatch(/choose 3 but only 2/);
  });

  it('catches an option the parent does not offer', () => {
    const doc = good();
    doc.requirements[1]!.children![0]!.option = 'C';
    expect(validateItem(doc).join()).toMatch(/option "C"/);
  });

  it('allows word headings only at the top of ranks', () => {
    const rank: SourceItem = { id: 'rank:scout', name: 'Scout', edition: 2026, requirements: [{ n: 'Knots', text: 'Knots', children: [{ n: '1a', text: 'x' }] }] };
    expect(validateItem(rank, 'scout.yaml')).toEqual([]);
    const badge = { ...good(), requirements: [{ n: 'Knots', text: 'Knots' }] };
    expect(validateItem(badge).join()).toMatch(/isn't a valid number/);
  });

  it('catches missing basics', () => {
    const errs = validateItem({ id: 'plumbing', name: '', edition: NaN, requirements: [] } as unknown as SourceItem);
    expect(errs.join('\n')).toMatch(/must look like badge/);
    expect(errs.join('\n')).toMatch(/needs a name/);
    expect(errs.join('\n')).toMatch(/needs at least one requirement/);
  });
});

describe('validateCatalog', () => {
  it('catches the same id in two files', () => {
    expect(validateCatalog([{ file: 'a.yaml', doc: good() }, { file: 'b.yaml', doc: good() }]).join()).toMatch(/also used by a.yaml/);
  });
});
