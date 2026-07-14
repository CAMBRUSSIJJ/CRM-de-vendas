import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {buildSync} from 'esbuild';
const root=process.cwd();
let html=readFileSync(resolve(root,'index.html'),'utf8');
html=html.replace(/<link\s+([^>]*?)href="(\.\/src\/[^"]+\.css)"([^>]*)>/g,(full,before,href,after)=>{
  const css=readFileSync(resolve(root,href),'utf8').replace(/<\/style/gi,'<\\/style');
  return `<style data-source="${href}">\n${css}\n</style>`;
});
const moduleEntry='./src/v99/main.js';
const bundle=buildSync({entryPoints:[resolve(root,moduleEntry)],bundle:true,write:false,format:'iife',platform:'browser',target:['es2020'],minify:false,legalComments:'none'}).outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
html=html.replace(`<script type="module" src="${moduleEntry}"></script>`,`<script data-source="${moduleEntry}" data-bundled="true">\n${bundle}\n</script>`);
html=html.replace(/<script\s+([^>]*?)src="(\.\/src\/[^"]+\.js)"([^>]*)><\/script>/g,(full,before,src,after)=>{
  const js=readFileSync(resolve(root,src),'utf8').replace(/<\/script/gi,'<\\/script');
  return `<script data-source="${src}">\n${js}\n</script>`;
});
const out=resolve(root,'standalone','CRM-v99-0-nucleo-modular-supabase-ready-standalone.html');
mkdirSync(dirname(out),{recursive:true});writeFileSync(out,html,'utf8');console.log(out);
