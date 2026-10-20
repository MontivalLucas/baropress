// Dependency-free source and interaction checks. This is not a browser/layout test.
import { readFile, access } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const dir = dirname(fileURLToPath(import.meta.url));
const js = await readFile(resolve(dir, 'app.js'), 'utf8');
const html = await readFile(resolve(dir, 'index.html'), 'utf8');
const css = await readFile(resolve(dir, 'styles.css'), 'utf8');
let passed = 0;
function check(label, fn) { fn(); passed++; console.log(`OK ${label}`); }

// Minimal DOM doubles exercise the actual application state/filter/action code.
// Layout, CSS rendering and native dialog behavior require a real browser.
class Element {
  constructor(id='') { this.id=id; this.innerHTML=''; this.value=''; this.dataset={}; this.open=false; this.isConnected=true; this.attributes={}; this.inert=false; this.listeners={}; this.classList={add(){},remove(){},contains(){return false;}}; }
  setAttribute(key,value){this.attributes[key]=value;}
  removeAttribute(key){delete this.attributes[key];}
  querySelectorAll(){return [];}
  querySelector(){return new Element();}
  focus(){document.activeElement=this;}
  showModal(){this.open=true;}
  close(){this.open=false;}
  addEventListener(name,fn){this.listeners[name]=fn;}
  getBoundingClientRect(){return {left:0,top:0,right:500,bottom:500};}
}
const elements = new Map();
const listeners = {};
const classNames = new Set();
const document = {
  activeElement:new Element('initial-focus'),
  getElementById(id){if(!elements.has(id))elements.set(id,new Element(id));return elements.get(id);},
  querySelectorAll(){return [];},
  querySelector(){return new Element();},
  addEventListener(name,fn){(listeners[name]??=[]).push(fn);},
  body:{dataset:{},classList:{add:name=>classNames.add(name),remove:name=>classNames.delete(name),contains:name=>classNames.has(name)}},
};
const sandbox = {
  document,console,location:{hash:''},
  history:{replaceState(){}},
  window:{matchMedia:()=>({matches:false,addEventListener(){}}),scrollTo(){},addEventListener(){}},
  setTimeout:()=>1,clearTimeout(){},
};
const context = vm.createContext(sandbox);
vm.runInContext(js, context, { filename: 'app.js' });
const run = code => vm.runInContext(code, context);
const content = () => document.getElementById('main-content').innerHTML;
function click(dataset) {
  const element=new Element();element.dataset=dataset;
  listeners.click.forEach(fn=>fn({target:{closest:()=>element}}));
}

check('CSP blocks application connections and form submissions',()=>{assert.match(html,/connect-src 'none'/);assert.match(html,/form-action 'none'/);});
check('No backend, device or persistent storage code',()=>assert.doesNotMatch(js, /fetch\s*\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|document\.cookie|navigator\.(serial|usb|bluetooth)|@tauri|__TAURI__|https?:\/\//));
check('Search keeps its accessible label on narrow screens',()=>assert.match(html, /class="search-trigger[^>]*aria-label="[^"]+"/));
check('Compact search keeps its visible icon',()=>{assert.match(css,/\.search-trigger span:not\(\[data-icon\]\)/);assert.doesNotMatch(css,/\.search-trigger span,/);});
check('Short sidebar heights remain navigable',()=>{assert.match(css,/\.sidebar nav\{[^}]*overflow-y:auto/);assert.match(css,/@media\(max-height:850px\)/);});
check('Reduced motion and opaque surfaces are supported',()=>{assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/body\[data-opaque=true\]/);});
for(const page of ['overview','patients','exams','agenda','analysis','reports','settings']){
  click({page});
  check(`Page renders: ${page}`,()=>{assert.equal(run('state.page'),page);assert.match(content(),/<h1>/);assert.doesNotMatch(content(),/undefined|NaN/);});
}

run("state.page='exams'; state.period='month'; state.examQuery='Lucas'; state.examStatus='all'");
check('Exam search filters the actual example data',()=>{assert.equal(run('filteredExams().length'),1);assert.equal(run('filteredExams()[0].id'),'EX-0383');});
run("state.examStatus='Em revisão'");
check('Search and status filters work together',()=>assert.equal(run('filteredExams().length'),0));
run("state.page='overview'; state.period='today'");
check('Hidden exam search/status never empty the overview',()=>assert.equal(run('filteredExams().length'),3));
run("state.period='week'");
check('Week includes five illustrative exams',()=>assert.equal(run('filteredExams().length'),5));
run("state.period='month'");
check('Month includes all six illustrative exams',()=>assert.equal(run('filteredExams().length'),6));

click({exam:'EX-0383'});
check('Lucas exam links to its own report',()=>assert.match(document.getElementById('modal-content').innerHTML,/data-report="EX-0383"/));
click({report:'EX-0383'});
check('Report retains the selected example patient',()=>{assert.match(document.getElementById('modal-content').innerHTML,/Lucas Oliveira/);assert.doesNotMatch(document.getElementById('modal-content').innerHTML,/Marina Costa/);});
click({patientExams:'P003'});
check('Profile opens only that patient’s examples',()=>{assert.equal(run('state.examQuery'),'Beatriz Santos');assert.equal(run('filteredExams().length'),1);});

document.getElementById('modal').close();
click({action:'new-exam'});
document.getElementById('demo-patient').value='P002';
click({action:'exam-step-2'});
check('Visual flow retains patient selection',()=>assert.match(document.getElementById('modal-content').innerHTML,/Lucas Oliveira/));
click({action:'exam-step-3'});
check('Final preview remains explicitly illustrative',()=>assert.match(document.getElementById('modal-content').innerHTML,/Nenhum dado foi coletado/));
click({action:'finish-preview'});
check('Finishing the flow creates no exam',()=>{assert.equal(run('exams.length'),6);assert.equal(document.getElementById('modal').open,false);});
click({action:'theme'});
check('Theme changes only page appearance',()=>assert.equal(document.body.dataset.theme,'dark'));
click({page:'settings'});click({action:'opaque'});
check('Transparency option changes local appearance',()=>assert.equal(document.body.dataset.opaque,'true'));
check('Weekend agenda has a meaningful empty state',()=>assert.equal(run('appointmentsForDay(10).length'),0));

for(const relative of ['index.html','app.js','styles.css','assets/favicon.svg','assets/pressure-map.svg'])await access(resolve(dir,relative));
console.log(`\n${passed} source/logic checks passed. No browser or visual rendering was used.`);
