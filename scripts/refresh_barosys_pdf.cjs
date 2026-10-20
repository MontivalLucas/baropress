// Gera apenas PDFs de QA a partir do código real e de uma fixture sintética.
const fs=require('node:fs');
const {chromium}=require('C:/Users/Montival Nunes/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{const page=await browser.newPage();await page.goto('http://127.0.0.1:1431/scripts/barosys-preview.html',{timeout:60000});
 const files=await page.evaluate(async()=>{const {fixture,frames}=await import('/scripts/barosys-fixture.ts');const {generateExamReportPdf}=await import('/src/features/reports/reportPdfGenerator.ts');const result=[];for(const legacy of [false,true]){const doc=await generateExamReportPdf(legacy?{...fixture,analysis:null}:fixture,legacy?{}:{frames});result.push({legacy,base64:doc.output('datauristring').split(',')[1],pages:doc.getNumberOfPages()});}return result;});
 for(const file of files){fs.writeFileSync(`docs/barosys/report-${file.legacy?'legacy':'synthetic'}.pdf`,Buffer.from(file.base64,'base64'));console.log(`${file.legacy?'legacy':'synthetic'}: ${file.pages} páginas`);}
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
