// Inventory from the actual TypeScript AST. Counts are definitions, not runtime instances.
const fs=require('node:fs'),path=require('node:path'),ts=require('typescript');
const root=path.resolve(__dirname,'..'), out=path.join(root,'docs','audit');fs.mkdirSync(out,{recursive:true});
const controls=[],views=[],dependencies=[];
const tags=new Set(['button','Button','input','Field','PasswordField','select','textarea','a','summary','TooltipTrigger','MiniTooltip']);
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
const clean=s=>s.replace(/\s+/g,' ').trim();
for(const file of files(path.join(root,'src')).filter(f=>f.endsWith('.tsx'))){
 const relative=path.relative(root,file).replaceAll('\\','/'),text=fs.readFileSync(file,'utf8'),source=ts.createSourceFile(file,text,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 function visit(n){
  if(ts.isImportDeclaration(n))dependencies.push({file:relative,source:n.moduleSpecifier.text});
  if(ts.isJsxElement(n)||ts.isJsxSelfClosingElement(n)){
   const opening=ts.isJsxElement(n)?n.openingElement:n, tag=opening.tagName.getText(source);
   const attributes=Object.fromEntries(opening.attributes.properties.filter(ts.isJsxAttribute).map(a=>[a.name.getText(source),a.initializer?clean(a.initializer.getText(source)):'true']));
   const line=source.getLineAndCharacterOfPosition(n.getStart(source)).line+1;
   const descendants=ts.isJsxElement(n)?n.children.map(c=>ts.isJsxText(c)?clean(c.text):ts.isJsxExpression(c)&&c.expression?'{'+clean(c.expression.getText(source))+'}':ts.isJsxElement(c)?clean(c.getText(source).replace(/<[^>]*>/g,'')):'').filter(Boolean).join(' '):'';
   if(['form','section','fieldset','details'].includes(tag)||['dialog','tablist','tab'].includes((attributes.role||'').replaceAll('"','')))views.push({file:relative,line,tag,role:attributes.role||'',title:attributes['aria-label']||attributes['aria-labelledby']||''});
   if(tags.has(tag)){
    const label=attributes.label||attributes['aria-label']||attributes.title||attributes.placeholder||descendants||attributes.name||attributes.id||tag;
    controls.push({id:'C'+String(controls.length+1).padStart(3,'0'),file:relative,line,tag,label:clean(label).slice(0,220),type:attributes.type||'',handler:attributes.onClick||attributes.onChange||attributes.onToggle||attributes.onSubmit||attributes.href||'',disabled:attributes.disabled||'',attributes});
   }
  }
  ts.forEachChild(n,visit);
 }
 visit(source);
}
const sidebar=fs.readFileSync(path.join(root,'src/components/Sidebar.tsx'),'utf8');
const routes=Array.from(sidebar.matchAll(/id: "([^"]+)", label: "([^"]+)"/g)).map(m=>({id:m[1],label:m[2]}));
const backend=files(path.join(root,'src-tauri','src')).filter(f=>f.endsWith('.rs')).flatMap(f=>Array.from(fs.readFileSync(f,'utf8').matchAll(/#\[tauri::command\]\s*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/g)).map(m=>({file:path.relative(root,f).replaceAll('\\','/'),command:m[1]})));
const data={date:'2026-10-07',version:require('../package.json').version,routes,controls,views,backend,dependencies};
fs.writeFileSync(path.join(out,'inventario.json'),JSON.stringify(data,null,2));
const esc=s=>String(s).replaceAll('|','\\|').replaceAll('\n',' ');
let md='# Inventário funcional por controle\n\nGerado da AST em 07/10/2026. '+routes.length+' rotas autenticadas + login; '+controls.length+' definições estáticas de controles; '+views.filter(v=>v.role==='"tablist"').length+' conjunto de abas; '+views.filter(v=>v.role==='"dialog"').length+' definições de painéis/diálogos; '+backend.length+' comandos Tauri. Componentes genéricos e expressões em listas são contados uma vez; não são contagens de botões simultaneamente visíveis.\n\nMétodo por linha: INSPECIONADO NO CÓDIGO (AST + revisão de fluxo). Nenhuma linha desta tabela afirma que houve clique de UI. Testes dos serviços e stores estão separados em RESULTADOS_TESTES.md; roteiro de execução em CHECKLIST_MANUAL.md.\n\n| ID | Módulo / tela e linha | Controle / rótulo | Ação / dependência direta | Estado bloqueado | Método e resultado |\n|---|---|---|---|---|---|\n';
for(const c of controls)md+='| '+[c.id,c.file+':'+c.line,c.tag+' '+c.label,c.handler.slice(0,400)||'Controle nativo ou delegação via componente; conferir contexto',c.disabled||'Sem disabled declarado','INSPECIONADO NO CÓDIGO; UI pendente'].map(esc).join(' | ')+' |\n';
md+='\n## Comandos e fronteira de autenticação\n\nTodos os comandos da aplicação passam por auth::authorize no invoke_handler. APIs core/plugin do Tauri usam o ACL próprio. Apenas has_users, register_first, login, recover, current e logout são públicos; registro inicial verifica que não há contas. Backups e cadastro de equipe exigem administrador.\n\n';
for(const c of backend)md+='- '+c.command+' — '+c.file+'\n';
md+='\n## Navegação encontrada na sidebar\n\n'+routes.map(r=>'- '+r.label+' ('+r.id+')').join('\n')+'\n\nVer AUDITORIA_FINAL.md para telas indiretas, estados, testes, evidências e pendências.\n';
fs.writeFileSync(path.join(out,'INVENTARIO_FUNCIONAL.md'),md);
console.log(JSON.stringify({routes:routes.length,controls:controls.length,tabs:views.filter(v=>v.role==='"tablist"').length,dialogs:views.filter(v=>v.role==='"dialog"').length,commands:backend.length,files:[...new Set(controls.map(c=>c.file))].length}));
