const fs=require('node:fs');const path=require('node:path');
const version=process.argv[2];if(!/^\d+\.\d+\.\d+$/.test(version??''))throw new Error('Informe a versão: node scripts/set_version.cjs 0.2.0');
const root=path.resolve(__dirname,'..');
for(const file of ['package.json','package-lock.json','src-tauri/tauri.conf.json']){const target=path.join(root,file);const data=JSON.parse(fs.readFileSync(target,'utf8'));data.version=version;if(data.packages?.[''])data.packages[''].version=version;fs.writeFileSync(target,JSON.stringify(data,null,2)+'\n','utf8');}
const cargo=path.join(root,'src-tauri/Cargo.toml');fs.writeFileSync(cargo,fs.readFileSync(cargo,'utf8').replace(/(\[package\][\s\S]*?version\s*=\s*")[^"]+("\s*)/,(_,prefix,suffix)=>prefix+version+suffix),'utf8');
