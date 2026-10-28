import {readFile, writeFile} from 'node:fs/promises';
import {PRODUCTS, TYPES} from '../webhook/inquiry-contract.js';
const file = new URL('../support/index.html', import.meta.url);
let html = await readFile(file, 'utf8');
let expected = html;
for (const [id, values] of [['product', PRODUCTS], ['type', TYPES]]) {
  const pattern = new RegExp(`(<select id="${id}"[^>]*>)[\\s\\S]*?(</select>)`);
  if (!pattern.test(expected)) throw new Error(`Missing inquiry select: ${id}`);
  expected = expected.replace(pattern, (_, open, close) => `${open}<option value="">Select a ${id}</option>${values.map(v => `<option>${v}</option>`).join('')}${close}`);
}
if (process.argv.includes('--write')) await writeFile(file, expected);
else if (html !== expected) throw new Error('Inquiry contract drift: run node scripts/build_inquiry_contract.mjs --write');
console.log('Inquiry form contract PASS');
