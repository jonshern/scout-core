/**
 * Requirement IDs are the join key across every product: a counselor's sign-off in
 * Bluecard, a step on a scout's trail, a station at a badge day and an idea's `covers`
 * all point at the same string.
 *
 *   item key:        badge:plumbing      rank:second-class
 *   requirement ID:  badge:plumbing#6b   rank:second-class#2a   badge:cycling#6a-optA
 */

export const ITEM_KINDS = ['badge', 'rank', 'award'] as const;
export type ItemKind = (typeof ITEM_KINDS)[number];

/** `badge:plumbing` */
export type ItemKey = `${ItemKind}:${string}`;
/** `badge:plumbing#6b` */
export type RequirementId = `${ItemKey}#${string}`;

const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*';
/** A requirement's own number: starts with a digit, then letters, digits, dots or dashes ("6b", "6a-optA", "6a1"). */
const REQ = '[0-9][0-9A-Za-z.]*(?:-[0-9A-Za-z.]+)*';

export const ITEM_KEY_PATTERN = new RegExp(`^(${ITEM_KINDS.join('|')}):(${SLUG})$`);
export const REQUIREMENT_ID_PATTERN = new RegExp(`^(${ITEM_KINDS.join('|')}):(${SLUG})#(${REQ})$`);
const REQ_NUMBER_PATTERN = new RegExp(`^${REQ}$`);

export function isItemKey(value: string): value is ItemKey {
  return ITEM_KEY_PATTERN.test(value);
}

export function isRequirementId(value: string): value is RequirementId {
  return REQUIREMENT_ID_PATTERN.test(value);
}

/** True for numbers that name a requirement a scout can complete ("6b"), false for rank section headings ("Camping and Outdoor Ethics"). */
export function isRequirementNumber(n: string): boolean {
  return REQ_NUMBER_PATTERN.test(n);
}

export function itemKey(kind: ItemKind, slug: string): ItemKey {
  const key = `${kind}:${slug}`;
  if (!isItemKey(key)) throw new Error(`Not a valid item key: "${key}"`);
  return key;
}

export function requirementId(item: ItemKey, n: string): RequirementId {
  const id = `${item}#${n}`;
  if (!isRequirementId(id)) throw new Error(`Not a valid requirement ID: "${id}"`);
  return id;
}

export interface ParsedRequirementId {
  kind: ItemKind;
  slug: string;
  item: ItemKey;
  n: string;
}

export function parseRequirementId(id: string): ParsedRequirementId {
  const m = REQUIREMENT_ID_PATTERN.exec(id);
  if (!m) throw new Error(`Not a valid requirement ID: "${id}"`);
  const [, kind, slug, n] = m as unknown as [string, ItemKind, string, string];
  return { kind, slug, item: `${kind}:${slug}`, n };
}

export function parseItemKey(key: string): { kind: ItemKind; slug: string } {
  const m = ITEM_KEY_PATTERN.exec(key);
  if (!m) throw new Error(`Not a valid item key: "${key}"`);
  const [, kind, slug] = m as unknown as [string, ItemKind, string];
  return { kind, slug };
}
