import { isRequirementNumber, requirementId, type ItemKey, type RequirementId } from './ids.js';
import type { Catalog, Item, Req, SourceItem, SourceRequirement } from './types.js';

export const RANK_ORDER = ['scout', 'tenderfoot', 'second-class', 'first-class', 'star', 'life', 'eagle'] as const;
export type RankSlug = (typeof RANK_ORDER)[number];

function leafText(r: SourceRequirement): string {
  const opt = r.option ? `[Option ${r.option}] ` : '';
  const kids = (r.children ?? []).map((k) => `• (${k.n.slice(r.n.length)}) ${k.text}`);
  return [opt + r.text, ...kids].join('\n');
}

function kindOf(id: string): Item['kind'] {
  const kind = id.split(':')[0];
  if (kind === 'rank' || kind === 'badge' || kind === 'award') return kind;
  throw new Error(`Unknown item kind in "${id}"`);
}

/** One source file -> one catalog item, flattened to requirement -> checkable sub-requirement. */
export function compileItem(doc: SourceItem): Item {
  return {
    key: doc.id as ItemKey,
    name: doc.name,
    kind: kindOf(doc.id),
    ...(doc.eagle_required ? { eagle: true as const } : {}),
    ...(doc.summary ? { summary: true as const } : {}),
    ...(doc.discontinued ? { retired: String(doc.discontinued) } : {}),
    ...(doc.formerly ? { formerly: doc.formerly } : {}),
    ...(doc.official_url ? { official: doc.official_url } : {}),
    ...(doc.worksheet_url ? { worksheet: doc.worksheet_url } : {}),
    edition: doc.edition,
    ...(doc.notes?.length ? { notes: doc.notes } : {}),
    reqs: doc.requirements.map(
      (r): Req => ({
        n: r.n,
        t: r.text,
        ...(r.choose ? { choose: r.choose } : {}),
        subs: (r.children ?? []).map((c) => ({ id: c.n, t: leafText(c) })),
      }),
    ),
  };
}

const rankIndex = (key: string) => RANK_ORDER.indexOf(key.split(':')[1] as RankSlug);

export function compileCatalog(docs: SourceItem[]): Catalog {
  const items = docs.map(compileItem);
  return {
    ranks: items.filter((i) => i.kind === 'rank').sort((a, b) => rankIndex(a.key) - rankIndex(b.key)),
    badges: items.filter((i) => i.kind === 'badge').sort((a, b) => a.name.localeCompare(b.name)),
  };
}

/**
 * Every requirement ID a scout can be signed off on for an item, in order: subs when a
 * requirement has them, otherwise the requirement itself. Rank section headings are skipped.
 */
export function checkableIds(item: Item): RequirementId[] {
  const ids: RequirementId[] = [];
  for (const r of item.reqs) {
    if (r.subs.length) for (const s of r.subs) ids.push(requirementId(item.key, s.id));
    else if (isRequirementNumber(r.n)) ids.push(requirementId(item.key, r.n));
  }
  return ids;
}

/** Every requirement number in a source file, at any depth (what `covers` lists may point at). */
export function allNumbers(doc: SourceItem): string[] {
  const out: string[] = [];
  const walk = (rs: SourceRequirement[] | undefined) =>
    (rs ?? []).forEach((r) => {
      out.push(String(r.n));
      walk(r.children);
    });
  walk(doc.requirements);
  return out;
}

export function findItem(catalog: Catalog, key: string): Item | undefined {
  return catalog.ranks.find((i) => i.key === key) ?? catalog.badges.find((i) => i.key === key);
}

/** The Eagle-required badges a scout's path has to include. Discontinued ones are left out. */
export function eagleRequiredBadges(catalog: Catalog): Item[] {
  return catalog.badges.filter((b) => b.eagle && !b.retired);
}

/** The rank after `slug`, or undefined at Eagle. */
export function nextRank(slug: RankSlug): RankSlug | undefined {
  return RANK_ORDER[RANK_ORDER.indexOf(slug) + 1];
}
