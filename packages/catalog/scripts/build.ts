// Validates data/ and writes dist/catalog.json, the file every app bundles.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadCatalog } from '../src/node.js';

const pkg = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
try {
  const catalog = loadCatalog(path.join(pkg, 'data'));
  fs.mkdirSync(path.join(pkg, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(pkg, 'dist', 'catalog.json'), JSON.stringify(catalog));
  console.log(`catalog.json: ${catalog.ranks.length} ranks, ${catalog.badges.length} badges`);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
