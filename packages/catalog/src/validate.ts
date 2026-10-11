import { isItemKey, isRequirementNumber, parseItemKey } from './ids.js';
import type { SourceItem, SourceRequirement } from './types.js';

/**
 * Checks one source file. Returns problems as readable lines; an empty list means it's good.
 * `file` is the file's base name, used to check the slug matches.
 */
export function validateItem(doc: SourceItem, file?: string): string[] {
  const where = file ?? doc?.id ?? '(unknown file)';
  const errors: string[] = [];
  const err = (msg: string) => errors.push(`${where}: ${msg}`);

  if (!doc || typeof doc !== 'object') return [`${where}: not a YAML mapping`];
  if (typeof doc.id !== 'string' || !isItemKey(doc.id)) {
    err(`id "${doc.id}" must look like badge:<slug> or rank:<slug>`);
  } else if (file) {
    const { slug } = parseItemKey(doc.id);
    if (file.split('/').pop()?.replace(/\.ya?ml$/, '') !== slug) err(`id "${doc.id}" doesn't match the file name`);
  }
  if (!doc.name) err('needs a name');
  if (!Number.isInteger(doc.edition)) err('needs an edition year');
  if (!Array.isArray(doc.requirements) || doc.requirements.length === 0) {
    err('needs at least one requirement');
    return errors;
  }

  const seen = new Set<string>();
  const walk = (rs: SourceRequirement[], parent?: SourceRequirement) => {
    for (const r of rs) {
      const n = String(r.n ?? '');
      if (!n) err(`a requirement under "${parent?.n ?? 'top level'}" has no number`);
      if (!r.text) err(`requirement ${n} has no text`);
      if (seen.has(n)) err(`requirement number ${n} is used twice`);
      seen.add(n);
      // Only rank section headings may be words; everything below the top level must be a real number.
      if (parent && !isRequirementNumber(n)) err(`requirement number "${n}" under ${parent.n} isn't a valid number`);
      if (!parent && !isRequirementNumber(n) && !doc.id?.startsWith('rank:')) {
        err(`requirement number "${n}" isn't a valid number`);
      }
      const kids = r.children ?? [];
      if (r.choose !== undefined) {
        const pool = r.options?.length ?? kids.length;
        if (!Number.isInteger(r.choose) || r.choose < 1) err(`requirement ${n}: choose must be a positive whole number`);
        else if (r.choose > pool) err(`requirement ${n}: choose ${r.choose} but only ${pool} to pick from`);
      }
      if (r.option !== undefined) {
        const keys = parent?.options?.map((o) => o.key) ?? [];
        if (!keys.includes(r.option)) err(`requirement ${n}: option "${r.option}" isn't one of ${parent?.n ?? 'its parent'}'s options`);
      }
      walk(kids, r);
    }
  };
  walk(doc.requirements);
  return errors;
}

/** Checks a whole set: each file, plus keys that must be unique across files. */
export function validateCatalog(files: { file: string; doc: SourceItem }[]): string[] {
  const errors = files.flatMap(({ file, doc }) => validateItem(doc, file));
  const keys = new Map<string, string>();
  for (const { file, doc } of files) {
    const prev = keys.get(doc?.id);
    if (prev) errors.push(`${file}: id "${doc.id}" is also used by ${prev}`);
    else if (doc?.id) keys.set(doc.id, file);
  }
  return errors;
}
