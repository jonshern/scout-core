import type { ItemKey } from './ids.js';

/** One requirements file as written in data/{badges,ranks}/<slug>.yaml. */
export interface SourceItem {
  id: string;
  name: string;
  edition: number;
  eagle_required?: boolean;
  official_url?: string;
  worksheet_url?: string;
  summary?: boolean;
  /** Date the item was retired, e.g. 2026-02-27. Kept so scouts can finish old records. */
  discontinued?: string;
  /** Earlier names, e.g. Indian Lore for American Indian Culture. */
  formerly?: string | string[];
  notes?: string[];
  requirements: SourceRequirement[];
}

export interface SourceRequirement {
  /** "1", "6b", "6a-optA", or a section heading on ranks ("Camping and Outdoor Ethics"). */
  n: string;
  text: string;
  /** "Do N of the following": how many children must be completed. */
  choose?: number;
  /** Named options for "do ONE of these options" groups; children name theirs with `option`. */
  options?: { key: string; name: string }[];
  /** Which of the parent's options this child belongs to. */
  option?: string;
  children?: SourceRequirement[];
}

/**
 * The compiled catalog every app reads. This is the same shape as the catalog.json
 * Bluecard and Emmett's Journey already read, so either can switch without code changes.
 */
export interface Catalog {
  ranks: Item[];
  badges: Item[];
}

export interface Item {
  key: ItemKey;
  name: string;
  kind: 'rank' | 'badge' | 'award';
  eagle?: true;
  summary?: true;
  /** Date it was discontinued. */
  retired?: string;
  formerly?: string | string[];
  official?: string;
  worksheet?: string;
  edition: number;
  notes?: string[];
  reqs: Req[];
}

/** A top-level requirement (or rank section). */
export interface Req {
  n: string;
  t: string;
  choose?: number;
  /** Checkable sub-requirements; deeper levels are folded into `t` as bullets. */
  subs: Sub[];
}

export interface Sub {
  id: string;
  t: string;
}
