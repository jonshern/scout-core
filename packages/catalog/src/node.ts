import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';
import type { SourceItem } from './types.js';
import { compileCatalog } from './compile.js';
import { validateCatalog } from './validate.js';

/** The package's own data/ folder (works from src/ in tests and from dist/ when installed). */
export const DATA_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'data');

export interface SourceFile {
  file: string;
  dir: 'badges' | 'ranks';
  doc: SourceItem;
}

/** Reads every requirements file under data/badges and data/ranks. */
export function readSources(dataDir: string = DATA_DIR): SourceFile[] {
  const out: SourceFile[] = [];
  for (const dir of ['ranks', 'badges'] as const) {
    const full = path.join(dataDir, dir);
    for (const file of fs.readdirSync(full).filter((f) => f.endsWith('.yaml')).sort()) {
      out.push({ file, dir, doc: YAML.parse(fs.readFileSync(path.join(full, file), 'utf8')) as SourceItem });
    }
  }
  return out;
}

/** Reads, validates and compiles the data folder. Throws with every problem listed if anything is wrong. */
export function loadCatalog(dataDir: string = DATA_DIR) {
  const sources = readSources(dataDir);
  const errors = validateCatalog(sources.map(({ dir, file, doc }) => ({ file: `${dir}/${file}`, doc })));
  if (errors.length) throw new Error(`Requirements have ${errors.length} problem(s):\n  ${errors.join('\n  ')}`);
  return compileCatalog(sources.map((s) => s.doc));
}
