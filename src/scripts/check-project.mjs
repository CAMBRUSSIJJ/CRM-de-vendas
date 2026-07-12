import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
const html=readFileSync(resolve('index.html'),'utf8');
const refs=[...html.matchAll(/(?:href|src)="(\.\/src\/[^"]+)"/g)].map(m=>m[1]);
const missing=refs.filter(r=>!existsSync(resolve(r)));
if(missing.length){console.error('Arquivos ausentes:',missing);process.exit(1)}
const inlineStyles=(html.match(/<style\b/gi)||[]).length;
const inlineScripts=[...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>/gi)].length;
if(inlineStyles||inlineScripts){console.error({inlineStyles,inlineScripts});process.exit(1)}
console.log(`OK: ${refs.length} referências modulares; nenhum CSS/JS inline.`);
