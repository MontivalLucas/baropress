'use strict';

// This prototype keeps all state in memory. No API, persistence or device access.
const paths = {
  grid:'<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m20 0v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/><circle cx="9" cy="7" r="4"/>',
  activity:'<path d="M3 12h4l3-8 4 16 3-8h4"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18m-13 4h.01m4 0h.01m4 0h.01m-8 3h.01m4 0h.01"/>',
  chart:'<path d="M4 4v16h16M8 15l4-5 4 2 4-7"/>',
  file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M8 13h8M8 17h5"/>',
  settings:'<path d="m9.6 3-.6 2.2-2 .9-2-.7-1.5 2.5 1.5 1.6-.1 2.3L3 13l1.4 2.5 2.2-.3 1.9 1.3.1 2.3 2.9.7 1.2-1.9 2.3-.3 1.6 1.4 2.5-1.6-.7-2.1.9-2 2.2-.5v-2.9l-2.2-.5-.9-2 .7-2.1-2.5-1.6L15 4.8l-2.3-.3L11.5 3z"/><circle cx="12" cy="11" r="3"/>',
  search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/>',
  moon:'<path d="M20.9 13A9 9 0 0 1 11 3.1a9 9 0 1 0 9.9 9.9Z"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  arrow:'<path d="M5 12h14m-5-5 5 5-5 5"/>',
  arrowUp:'<path d="M7 14 17 4M7 4h10v10"/>',
  trend:'<path d="m3 17 6-6 4 4 8-10m-6 0h6v6"/>',
  chip:'<rect x="6" y="6" width="12" height="12" rx="3"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 2v4m6-4v4M9 18v4m6-4v4M2 9h4m-4 6h4m12-6h4m-4 6h4"/>',
  expand:'<path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5"/>',
  layers:'<path d="m12 3 10 6-10 6L2 9zM2 13l10 6 10-6M2 17l10 6 10-6"/>',
  close:'<path d="m6 6 12 12M6 18 18 6"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',
  chevrons:'<path d="m8 9 4-4 4 4m-8 6 4 4 4-4"/>',
  chevronLeft:'<path d="m14 6-6 6 6 6"/>',
  chevronRight:'<path d="m10 6 6 6-6 6"/>',
  download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z"/><path d="m8 12 3 3 5-6"/>',
  sparkles:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5ZM20 2v4m-2-2h4"/>',
  filter:'<path d="M4 7h16M7 12h10M10 17h4"/>',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.grid}</svg>`;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const navItems = [
  {id:'overview',label:'Visão geral',icon:'grid'},
  {id:'patients',label:'Pacientes',icon:'users'},
  {id:'exams',label:'Exames',icon:'activity'},
  {id:'agenda',label:'Agenda',icon:'calendar'},
  {id:'analysis',label:'Análises',icon:'chart'},
  {id:'reports',label:'Relatórios',icon:'file'},
];
const patients = [
  {id:'P001',name:'Marina Costa',initials:'MC',age:34,exams:4,color:'#e3eaf9'},
  {id:'P002',name:'Lucas Oliveira',initials:'LO',age:42,exams:3,color:'#e8e3f8'},
  {id:'P003',name:'Beatriz Santos',initials:'BS',age:28,exams:2,color:'#deeeed'},
  {id:'P004',name:'Rafael Mendes',initials:'RM',age:51,exams:5,color:'#f2e7dd'},
  {id:'P005',name:'Camila Rocha',initials:'CR',age:37,exams:2,color:'#e4e8fa'},
  {id:'P006',name:'Pedro Almeida',initials:'PA',age:46,exams:3,color:'#e4ecdf'},
];
const exams = [
  {id:'EX-0384',patient:0,date:'07 out, 2026',dateShort:'07 out · 10:42',type:'Estático',status:'Concluído',group:'today'},
  {id:'EX-0383',patient:1,date:'07 out, 2026',dateShort:'07 out · 09:30',type:'Estático',status:'Concluído',group:'today'},
  {id:'EX-0382',patient:2,date:'07 out, 2026',dateShort:'07 out · 08:15',type:'Comparativo',status:'Em revisão',group:'today'},
  {id:'EX-0381',patient:3,date:'06 out, 2026',dateShort:'06 out · 15:20',type:'Estático',status:'Concluído',group:'week'},
  {id:'EX-0380',patient:4,date:'05 out, 2026',dateShort:'05 out · 14:10',type:'Comparativo',status:'Em revisão',group:'week'},
  {id:'EX-0379',patient:5,date:'29 set, 2026',dateShort:'29 set · 11:00',type:'Estático',status:'Concluído',group:'month'},
];
const state = {page:'overview',day:7,period:'today',examQuery:'',patientQuery:'',examStatus:'all',map:'static',theme:'light',opaque:false,labels:true};
const main = document.getElementById('main-content');
const dialog = document.getElementById('modal');
let toastTimer;
let returnFocus;
let newExamPatient = 'P001';

function hydrate(root = document) {
  root.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = icon(el.dataset.icon); });
}
function pageIntro(eyebrow, title, subtitle, action = 'exam') {
  const actions = action === 'exam' ? `<button class="primary-button" data-action="new-exam">${icon('plus')} Novo exame</button>` : action === 'patient' ? `<button class="primary-button" data-action="new-patient">${icon('plus')} Novo paciente</button>` : action === 'agenda' ? `<button class="primary-button" data-action="new-appointment">${icon('plus')} Agendar atendimento</button>` : '';
  return `<section class="page-intro"><div><div class="eyebrow">${eyebrow}</div><h1>${title}</h1><p>${subtitle}</p></div><div class="intro-actions"><span class="date-caption">${icon('calendar')} Quarta-feira, 07 de outubro de 2026</span>${actions}</div></section>`;
}
function stats() {
  const cards = [
    ['Pacientes cadastrados','128','users','12,3%','no espaço de demonstração'],
    ['Exames realizados','384','activity','8,2%','ao longo do período ilustrativo'],
    ['Atendimentos hoje','08','calendar','','3 atendimentos pela manhã'],
    ['Relatórios disponíveis','36','file','','organizados em um só lugar'],
  ];
  return `<section class="stats-grid" aria-label="Indicadores fictícios">${cards.map(([label,value,ic,trend,note],i) => `<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon">${icon(ic)}</span></div><div class="stat-value-row"><strong class="stat-value">${value}</strong>${trend ? `<span class="stat-change">${icon('trend')} ${trend}</span>` : ''}</div><span class="stat-note">${note}</span><svg class="stat-spark" viewBox="0 0 80 35" fill="none" aria-hidden="true"><path d="${i % 2 ? 'M1 31 10 25 18 27 25 19 35 22 44 14 54 17 65 6 78 3' : 'M1 31 12 25 21 28 31 16 43 20 53 10 64 14 78 3'}" stroke="${i===2?'#ad9cce':'#7c9fe0'}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></article>`).join('')}</section>`;
}
function mapVisual(large = false) {
  return `<div class="pressure-visual ${state.map==='compare'?'comparison':''}"><span class="map-caption">MAPA PLANTAR ${state.map==='compare'?'· COMPARAÇÃO':'· VISÃO SUPERIOR'}</span><div class="map-controls"><button class="icon-button" data-action="labels" aria-label="${state.labels?'Ocultar':'Exibir'} legenda do mapa" aria-pressed="${state.labels}">${icon('layers')}</button>${large?'':`<button class="icon-button" data-action="map-expand" aria-label="Ampliar mapa ilustrativo">${icon('expand')}</button>`}</div><img src="assets/pressure-map.svg" alt="Ilustração de pressão plantar de dois pés, em azul, verde, amarelo e laranja. Não representa um exame real." width="700" height="360">${state.labels?'<div class="foot-labels"><span>E</span><span>D</span></div><div class="pressure-legend"><div></div><span><b>Baixa</b><b>Alta</b></span></div><span class="map-scale-note">Intensidade relativa<br>ilustrativa</span>':''}</div>`;
}
function pressureCard() {
  return `<section class="panel pressure-card" aria-labelledby="pressure-title"><div class="panel-heading"><div><h2 id="pressure-title">Cada passo conta.</h2><p>Um olhar sobre a distribuição plantar.</p></div><button class="subtle-link" data-page="analysis">Explorar análise ${icon('arrowUp')}</button></div><div class="pressure-toolbar"><div class="segmented" aria-label="Modo de visualização"><button data-map="static" aria-pressed="${state.map==='static'}">Estático</button><button data-map="compare" aria-pressed="${state.map==='compare'}">Comparativo</button></div><span class="sample-tag"><i></i> Ilustração</span></div><div id="map-region">${mapVisual()}</div><div class="load-distribution"><div class="load-label">Pé esquerdo<strong>${state.map==='compare'?'49,2':'48,6'}<span class="stat-unit">%</span></strong></div><div><div class="distribution-bar"><i></i><i></i></div><p class="distribution-center">Distribuição ilustrativa</p></div><div class="load-label">Pé direito<strong>${state.map==='compare'?'50,8':'51,4'}<span class="stat-unit">%</span></strong></div></div></section>`;
}
function appointmentsForDay(day) {
  if ([10,11,17,18,24,25,31].includes(day)) return [];
  const offset = Math.abs(day - 7) % 4;
  return [
    {time:'09:00',patient:patients[offset],type:'Avaliação baropodométrica',status:'Confirmado'},
    {time:'10:30',patient:patients[(offset+1)%6],type:'Acompanhamento',status:'Confirmado'},
    {time:'14:00',patient:patients[(offset+2)%6],type:'Avaliação inicial',status:'A confirmar'},
  ];
}
function appointmentList(full = false) {
  const entries = appointmentsForDay(state.day);
  if(!entries.length) return `<div class="empty-state">${icon('calendar')}<h3>Um dia livre.</h3><p>Sem atendimentos fictícios nesta data.</p></div>`;
  return entries.slice(0, full ? 3 : 2).map(a => `<div class="appointment"><span class="appointment-time">${a.time}</span><i class="appointment-dot" aria-hidden="true"></i><div><strong>${a.patient.name}</strong><small>${a.type}</small></div><span class="status ${a.status==='A confirmar'?'pending':''}">${a.status}</span></div>`).join('');
}
function weekStrip() {
  return `<div class="week-strip" aria-label="Selecionar dia de outubro">${['SEG','TER','QUA','QUI','SEX'].map((d,i) => `<button class="day-button" data-day="${i+5}" aria-label="${i+5} de outubro" aria-pressed="${state.day===i+5}"><span>${d}</span><strong>${String(i+5).padStart(2,'0')}</strong></button>`).join('')}</div>`;
}
function agendaPanel() {
  return `<section class="panel agenda-panel" aria-labelledby="agenda-title"><div class="panel-heading"><div><h2 class="heading-icon" id="agenda-title">${icon('calendar')} Sua agenda</h2><p>${String(state.day).padStart(2,'0')} de outubro · próximos atendimentos</p></div><button class="subtle-link" data-page="agenda" aria-label="Ver agenda completa">${icon('arrowUp')}</button></div>${weekStrip()}<div class="appointment-list">${appointmentList()}</div></section>`;
}
function periodControl() {
  return `<div class="segmented" aria-label="Filtrar período dos exames">${[['today','Hoje'],['week','Semana'],['month','Mês']].map(([key,label])=>`<button data-period="${key}" aria-pressed="${state.period===key}">${label}</button>`).join('')}</div>`;
}
function filteredExams() {
  const q=state.examQuery.toLocaleLowerCase('pt-BR');
  return exams.filter(e => (state.period==='month'||e.group==='today'||state.period==='week'&&e.group==='week')&&(state.page==='overview'||(state.examStatus==='all'||e.status===state.examStatus)&&`${patients[e.patient].name} ${e.id} ${e.type}`.toLocaleLowerCase('pt-BR').includes(q)));
}
function examRows(limit) {
  const list = filteredExams().slice(0, limit);
  if(!list.length) return '<tr><td colspan="5"><div class="empty-state"><h3>Nenhum exame neste filtro.</h3><p>Experimente outro período ou termo de busca.</p></div></td></tr>';
  return list.map(e => { const p = patients[e.patient]; return `<tr><td><div class="patient-cell"><span class="avatar">${p.initials}</span><span><strong>${p.name}</strong><small>${e.id} · paciente fictício</small></span></div></td><td>${e.type}</td><td>${e.dateShort}</td><td><span class="status ${e.status==='Em revisão'?'pending':''}">${e.status}</span></td><td><button class="row-button" data-exam="${e.id}" aria-label="Abrir exame fictício de ${p.name}">Ver exame ${icon('arrow')}</button></td></tr>`;}).join('');
}
function examsTable(limit) {
  return `<div class="table-wrap"><table class="data-table"><caption class="sr-only">Exames fictícios para demonstrar o layout</caption><thead><tr><th scope="col">Paciente</th><th scope="col">Tipo de exame</th><th scope="col">Data e horário</th><th scope="col">Status</th><th scope="col">Detalhes</th></tr></thead><tbody id="exam-rows">${examRows(limit)}</tbody></table></div>`;
}
function overviewPage() {
  return pageIntro('UM NOVO OLHAR SOBRE O MOVIMENTO','Seu dia, em equilíbrio.','Uma visão clara dos seus pacientes, exames e próximos atendimentos.') + stats() + `<div class="dashboard-grid">${pressureCard()}<div class="right-stack"><div id="agenda-region">${agendaPanel()}</div><section class="panel device-card"><div class="device-orb">${icon('chip')}</div><div><h3>Espaço para a tecnologia.</h3><p>Uma nova experiência para acompanhar cada avaliação.</p></div><button class="icon-button" data-action="device" aria-label="Ver conceito da plataforma">${icon('arrowUp')}</button></section></div></div><section class="panel recent-panel"><div class="panel-heading"><div><h2>Exames recentes</h2><p>O cuidado continua, a cada avaliação.</p></div><div class="recent-actions">${periodControl()}<button class="subtle-link" data-page="exams">Ver todos ${icon('arrow')}</button></div></div>${examsTable(4)}</section>`;
}
function patientsPage() {
  return pageIntro('PESSOAS EM PRIMEIRO LUGAR','Cada pessoa. Uma história.','Organização e proximidade para acompanhar cada jornada de cuidado.','patient')+`<section class="panel"><div class="toolbar"><label class="inline-search">${icon('search')}<input id="patient-search" type="search" aria-label="Buscar paciente fictício" placeholder="Buscar por nome ou código..." value="${esc(state.patientQuery)}"></label><span class="sample-tag"><i></i> 6 perfis fictícios</span></div></section><div class="patients-grid" id="patient-cards">${patientCards()}</div>`;
}
function patientCards() {
  const found=patients.filter(p=>`${p.name} ${p.id}`.toLocaleLowerCase('pt-BR').includes(state.patientQuery.toLocaleLowerCase('pt-BR')));
  return found.length ? found.map(p=>`<article class="panel patient-card"><span class="avatar">${p.initials}</span><h3>${p.name}</h3><p>${p.age} anos · ${p.id} · perfil fictício</p><div class="patient-card-bottom"><span>${p.exams} exames ilustrativos</span><button class="text-button" data-patient="${p.id}">Ver perfil ${icon('arrow')}</button></div></article>`).join('') : '<div class="panel empty-state"><h3>Nenhum perfil encontrado.</h3><p>Busque outro nome ou código fictício.</p></div>';
}
function examsPage() {
  return pageIntro('CUIDADO EM PERSPECTIVA','Avaliações bem organizadas.','Uma linha do tempo clara, do primeiro exame ao acompanhamento.')+`<section class="panel"><div class="toolbar"><label class="inline-search">${icon('search')}<input type="search" id="exam-search" aria-label="Buscar exame fictício" placeholder="Buscar paciente ou exame..." value="${esc(state.examQuery)}"></label>${periodControl()}<select class="field compact-field" id="status-filter" aria-label="Filtrar status"><option value="all">Todos os status</option><option ${state.examStatus==='Concluído'?'selected':''}>Concluído</option><option ${state.examStatus==='Em revisão'?'selected':''}>Em revisão</option></select></div>${examsTable(20)}</section>`;
}
function agendaPage() {
  const blanks = '<i aria-hidden="true"></i>'.repeat(4);
  return pageIntro('TEMPO PARA CUIDAR','Seu próximo encontro.','Planeje o dia com leveza e mantenha os atendimentos em perspectiva.','agenda')+`<div class="full-agenda"><section class="panel calendar-panel"><div class="calendar-heading"><h2>Outubro 2026</h2><span class="sample-tag">Demo</span></div><div class="calendar-grid" aria-label="Calendário de outubro de 2026">${['D','S','T','Q','Q','S','S'].map(d=>`<span aria-hidden="true">${d}</span>`).join('')}${blanks}${Array.from({length:31},(_,i)=>`<button data-day="${i+1}" aria-label="${i+1} de outubro de 2026" aria-pressed="${state.day===i+1}">${i+1}</button>`).join('')}</div><p class="calendar-note">Selecione um dia para explorar a organização dos atendimentos fictícios.</p></section><section class="panel"><div class="panel-heading"><div><h2>${String(state.day).padStart(2,'0')} de outubro</h2><p>${appointmentsForDay(state.day).length} atendimentos ilustrativos</p></div><span class="sample-tag"><i></i> Agenda demonstrativa</span></div><div class="agenda-full-list">${appointmentList(true)}</div></section></div>`;
}
function analysisPage() {
  return pageIntro('CLAREZA EM CADA PASSO','O movimento, em detalhe.','Uma nova forma de visualizar e comparar informações plantares.','none')+`<div class="analysis-grid">${pressureCard()}<section class="panel analysis-info"><h2>Um olhar mais próximo</h2><p class="panel-subtitle">Indicadores demonstrativos</p><div class="metric-row"><span>Distribuição esquerda</span><strong>${state.map==='compare'?'49,2':'48,6'}%</strong></div><div class="metric-row"><span>Distribuição direita</span><strong>${state.map==='compare'?'50,8':'51,4'}%</strong></div><div class="metric-row"><span>Matriz de referência visual</span><strong>15 × 15</strong></div><div class="metric-row"><span>Tempo ilustrativo de coleta</span><strong>10 s</strong></div><div class="info-note">Este mapa é uma ilustração de interface. Os valores são fictícios e não representam uma avaliação clínica.</div><button class="secondary-button" data-action="report-preview">${icon('file')} Prévia de relatório</button></section></div>`;
}
function reportsPage() {
  return pageIntro('INFORMAÇÃO COM PROPÓSITO','O cuidado, documentado.','Relatórios claros, organizados e fáceis de encontrar.','none')+`<section class="report-grid" aria-label="Relatórios fictícios">${exams.slice(0,3).map((e,i)=>`<article class="panel report-card"><div class="report-cover"><div class="report-sheet">${icon('activity')}<i></i><i></i><i></i><i></i></div></div><h3>${patients[e.patient].name}</h3><p>Relatório ${String(i+1).padStart(2,'0')} · ${e.date}</p><p>${e.type} · documento demonstrativo</p><button class="secondary-button" data-report="${e.id}">${icon('eye')} Visualizar prévia</button></article>`).join('')}</section>`;
}
function settingsPage() {
  return pageIntro('DO SEU JEITO','Uma experiência que se adapta.','Personalize a aparência deste conceito e explore outras perspectivas.','none')+`<section class="panel settings-panel"><h2>Aparência e conforto</h2><p>Preferências visuais válidas apenas enquanto esta página estiver aberta.</p><div class="setting-row"><div><strong>Tema escuro</strong><p>Uma atmosfera mais suave para ambientes com pouca luz.</p></div><button class="toggle" role="switch" aria-checked="${state.theme==='dark'}" aria-label="Tema escuro" data-action="theme"><span></span></button></div><div class="setting-row"><div><strong>Reduzir transparência</strong><p>Superfícies mais sólidas para maior contraste e legibilidade.</p></div><button class="toggle" role="switch" aria-checked="${state.opaque}" aria-label="Reduzir transparência" data-action="opaque"><span></span></button></div><div class="setting-row"><div><strong>Legendas no mapa</strong><p>Exibir identificação dos pés e escala de intensidade ilustrativa.</p></div><button class="toggle" role="switch" aria-checked="${state.labels}" aria-label="Legendas no mapa" data-action="labels"><span></span></button></div><div class="info-note">Protótipo visual independente. Nenhum cadastro, exame ou preferência do Baropress original é acessado ou alterado.</div></section>`;
}
const pages = {overview:overviewPage,patients:patientsPage,exams:examsPage,agenda:agendaPage,analysis:analysisPage,reports:reportsPage,settings:settingsPage};
function renderPage(focusSelector) {
  const navLabel=navItems.find(n=>n.id===state.page)?.label||'Preferências';
  document.getElementById('breadcrumb-current').textContent=navLabel;
  document.title=`${navLabel} · Baropress Liquid Glass`;
  main.innerHTML=pages[state.page]();
  document.querySelectorAll('[data-page]').forEach(b=>{if(b.dataset.page===state.page)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
  hydrate(main);
  if(focusSelector) document.querySelector(focusSelector)?.focus({preventScroll:true});
}
function navigate(page) {
  if(!pages[page]) return;
  state.page=page;
  history.replaceState(null,'',`#${page}`);
  renderPage();
  closeSidebar();
  window.scrollTo({top:0,behavior:'instant'});
  main.focus({preventScroll:true});
}
function toast(message) {
  const el=document.getElementById('toast');
  clearTimeout(toastTimer);el.textContent=message;el.classList.add('show');
  toastTimer=setTimeout(()=>el.classList.remove('show'),4200);
}
function modal(title,subtitle,body,footer='') {
  if(!dialog.open) returnFocus=document.activeElement;
  document.getElementById('modal-content').innerHTML=`<div class="modal-header"><div><h2 id="modal-title" tabindex="-1">${title}</h2><p>${subtitle}</p></div><button class="icon-button" data-action="close-modal" aria-label="Fechar janela">${icon('close')}</button></div><div class="modal-body">${body}</div>${footer?`<div class="modal-footer">${footer}</div>`:''}`;
  if(!dialog.open)dialog.showModal();
  document.getElementById('modal-title').focus({preventScroll:true});
}
function examModal(id) {
  const e=exams.find(e=>e.id===id)||exams[0];const p=patients[e.patient];
  modal('Um passo mais perto.',`${e.id} · exame fictício`, `<div class="detail-summary"><div><small>Paciente de demonstração</small><strong>${p.name}</strong></div><div><small>Data do exemplo</small><strong>${e.date}</strong></div></div>${mapVisual(true)}<div class="detail-summary"><div><small>Distribuição esquerda</small><strong>48,6%</strong></div><div><small>Distribuição direita</small><strong>51,4%</strong></div></div><p class="modal-copy">Mapa e indicadores ilustrativos para explorar a nova experiência de visualização.</p>`, `<span>Dados fictícios · sem avaliação real</span><button class="primary-button" data-report="${e.id}">${icon('file')} Ver relatório</button>`);
}
function newExam(step=1) {
  const patient=patients.find(p=>p.id===newExamPatient)||patients[0];
  const steps=`<div class="stepper" aria-label="Etapa ${step} de 3">${['Paciente','Preparação','Prévia'].map((s,i)=>`<div class="${step===i+1?'active':''}">${String(i+1).padStart(2,'0')} · ${s}</div>`).join('')}</div>`;
  let body;let footer;
  if(step===1){body=`${steps}<p class="modal-copy">Explore como um novo exame poderia começar, em uma experiência mais simples e acolhedora.</p><label for="demo-patient">Paciente de demonstração</label><select class="field" id="demo-patient">${patients.map(p=>`<option value="${p.id}" ${p.id===newExamPatient?'selected':''}>${p.name} · perfil fictício</option>`).join('')}</select><label for="demo-type">Tipo de avaliação ilustrativa</label><select class="field" id="demo-type"><option>Baropodometria estática</option></select><div class="info-note">Este fluxo demonstra o layout. Nenhum exame será realizado ou salvo.</div>`;footer='<span>01 / 03 · Apenas visualização</span><button class="primary-button" data-action="exam-step-2">Continuar '+icon('arrow')+'</button>';}
  else if(step===2){body=`${steps}<div class="preview-platform">${icon('chip')}</div><h3 class="demo-step-title">Tudo no seu tempo.</h3><p class="modal-copy">Um espaço claro para orientar a preparação de ${patient.name}. Aqui, a plataforma e a coleta são apenas elementos da demonstração visual.</p><div class="info-note">Plataforma ilustrativa · sem conexão com dispositivos</div>`;footer=`<button class="secondary-button" data-action="exam-step-1">Voltar</button><button class="primary-button" data-action="exam-step-3">Ver prévia ${icon('arrow')}</button>`;}
  else{body=`${steps}${mapVisual(true)}<h3 class="demo-step-title">Clareza para o próximo passo.</h3><p class="modal-copy">Esta é a prévia visual do conceito para ${patient.name}. Nenhum dado foi coletado, nenhum exame foi criado.</p>`;footer='<span>03 / 03 · Prévia ilustrativa</span><button class="primary-button" data-action="finish-preview">Concluir visualização '+icon('check')+'</button>';}
  modal('Uma nova avaliação.','Prévia do fluxo · nenhum exame real',body,footer);
  dialog.querySelector('[data-action^="exam-step"], [data-action="finish-preview"]')?.focus();
}
function reportPreview(id) {
  const e=exams.find(e=>e.id===id)||exams[0];const p=patients[e.patient];
  modal('Informação com clareza.','Prévia visual de relatório',`<div class="report-preview-head"><span class="eyebrow">BAROPRESS / RELATÓRIO DEMONSTRATIVO</span><h3>${p.name}</h3><p>${e.date} · ${e.id}</p></div>${mapVisual(true)}<div class="detail-summary"><div><small>Distribuição esquerda</small><strong>48,6%</strong></div><div><small>Distribuição direita</small><strong>51,4%</strong></div></div><p class="modal-copy">Este documento é uma composição ilustrativa. Não contém resultados de pacientes reais.</p>`,`<span>Documento de demonstração</span><button class="primary-button" data-action="export-preview">${icon('download')} Exportar PDF</button>`);
}
function patientModal(id) {
  const p=patients.find(p=>p.id===id);if(!p)return;
  modal('Uma história de cuidado.','Perfil inteiramente fictício',`<div class="profile-large"><span class="avatar">${p.initials}</span><div><strong>${p.name}</strong><p>${p.age} anos · ${p.id}</p></div></div><div class="detail-summary"><div><small>Exames ilustrativos</small><strong>${p.exams} avaliações</strong></div><div><small>Última visita fictícia</small><strong>07 de outubro de 2026</strong></div></div><p class="modal-copy">Uma prévia do prontuário com navegação simples, histórico em perspectiva e informações organizadas.</p>`,`<span>Perfil de demonstração</span><button class="primary-button" data-patient-exams="${p.id}">Ver exames ${icon('arrow')}</button>`);
}
function openSearch() {
  modal('Encontre seu próximo passo.','Busca no espaço de demonstração',`<div class="search-modal"><label for="global-search" class="sr-only">Buscar pacientes e páginas</label><input class="field" type="search" id="global-search" placeholder="Busque pacientes, exames ou páginas..." autocomplete="off"><div class="search-results" id="search-results"></div></div>`);
  updateSearch('');document.getElementById('global-search').focus();
}
function updateSearch(value) {
  const q=value.toLocaleLowerCase('pt-BR');
  const destinations=navItems.filter(n=>n.label.toLocaleLowerCase('pt-BR').includes(q));
  const people=q ? patients.filter(p=>p.name.toLocaleLowerCase('pt-BR').includes(q)) : [];
  document.getElementById('search-results').innerHTML=destinations.map(n=>`<button class="search-result" data-search-page="${n.id}">${icon(n.icon)}<span><strong>${n.label}</strong><small>Página do conceito</small></span><span class="arrow">${icon('arrow')}</span></button>`).join('')+people.map(p=>`<button class="search-result" data-patient="${p.id}">${icon('users')}<span><strong>${p.name}</strong><small>Paciente fictício · ${p.id}</small></span><span class="arrow">${icon('arrow')}</span></button>`).join('')||'<div class="empty-state"><h3>Nenhum resultado.</h3><p>Experimente outro termo.</p></div>';
}
function setTheme() {
  state.theme=state.theme==='light'?'dark':'light';document.body.dataset.theme=state.theme;
  const themeButton=document.getElementById('theme-button');themeButton.innerHTML=icon(state.theme==='dark'?'sun':'moon');themeButton.setAttribute('aria-label',state.theme==='dark'?'Ativar tema claro':'Ativar tema escuro');
  if(state.page==='settings')renderPage('[data-action="theme"][role="switch"]');
}
function closeSidebar() {
  document.body.classList.remove('sidebar-open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false');
  if(window.matchMedia('(max-width: 760px)').matches)document.getElementById('sidebar').inert=true;
}
function openSidebar() {
  document.getElementById('sidebar').inert=false;document.body.classList.add('sidebar-open');document.getElementById('menu-toggle').setAttribute('aria-expanded','true');document.querySelector('#navigation [aria-current="page"], #navigation button').focus();
}
const actions={
  'theme':setTheme,
  'opaque':()=>{state.opaque=!state.opaque;document.body.dataset.opaque=String(state.opaque);renderPage('[data-action="opaque"]');},
  'labels':()=>{state.labels=!state.labels;if(dialog.open){dialog.querySelectorAll('.pressure-visual').forEach(el=>el.outerHTML=mapVisual(true));dialog.querySelector('[data-action="labels"]')?.focus();}else if(state.page==='settings')renderPage('[data-action="labels"]');else {document.getElementById('map-region').innerHTML=mapVisual();document.querySelector('[data-action="labels"]')?.focus();}},
  'new-exam':()=>newExam(),
  'exam-step-1':()=>newExam(1),
  'exam-step-2':()=>{newExamPatient=document.getElementById('demo-patient').value;newExam(2);},
  'exam-step-3':()=>newExam(3),
  'finish-preview':()=>{dialog.close();toast('Visualização concluída. Nenhum exame foi criado.');},
  'close-modal':()=>dialog.close(),
  'search':openSearch,
  'map-expand':()=>modal('Uma nova perspectiva.','Mapa plantar ilustrativo · nenhum exame real',mapVisual(true)+`<p class="modal-copy">Explore o conceito de visualização. Esta imagem é uma ilustração, com intensidade relativa fictícia.</p>`),
  'report-preview':()=>reportPreview(),
  'export-preview':()=>toast('Exportação apenas demonstrativa. Nenhum PDF foi gerado.'),
  'profile':()=>modal('Seu espaço de cuidado.','Perfil de demonstração',`<div class="profile-large"><span class="avatar">AC</span><div><strong>Ana Carvalho</strong><p>Profissional de demonstração</p></div></div><p class="modal-copy">Este perfil faz parte do conceito visual. As informações são fictícias e servem para apresentar a nova experiência.</p>`),
  'device':()=>modal('Tecnologia, com leveza.','Conceito visual da plataforma',`<div class="preview-platform">${icon('chip')}</div><div class="detail-summary"><div><small>Matriz de referência</small><strong>15 × 15 posições</strong></div><div><small>Modo desta página</small><strong>Visualização</strong></div></div><p class="modal-copy">Uma proposta de interface para organizar informações da plataforma. Este protótipo não se conecta a dispositivos.</p>`),
  'notifications':()=>modal('Tudo em perspectiva.','Notificações ilustrativas',`<div class="notification-item">${icon('calendar')}<div><strong>Seu próximo encontro</strong><p>Exemplo de lembrete para a consulta de Marina Costa, às 09:00.</p></div></div><div class="notification-item">${icon('file')}<div><strong>Um relatório para revisar</strong><p>Exemplo de aviso sobre a organização dos relatórios.</p></div></div>`),
  'about':()=>modal('Um novo olhar.','BAROPRESS / LIQUID GLASS CONCEPT',`<p class="modal-copy">Uma interface pensada para dar espaço ao que importa: as pessoas, seus passos e a continuidade do cuidado.</p><div class="about-features"><div class="about-feature">${icon('layers')}<strong>Profundidade sutil</strong><p>Vidro, luz e superfícies que respiram.</p></div><div class="about-feature">${icon('grid')}<strong>Organização clara</strong><p>Uma hierarquia simples e intuitiva.</p></div><div class="about-feature">${icon('eye')}<strong>Leitura confortável</strong><p>Contraste e conteúdo em primeiro plano.</p></div><div class="about-feature">${icon('shield')}<strong>Independente</strong><p>Dados fictícios, interações locais.</p></div></div><p class="modal-copy">Conceito original inspirado nos materiais e na navegação Liquid Glass apresentados pela Apple.</p>`),
  'new-patient':()=>modal('Uma nova história.','Prévia visual do cadastro',`<label for="mock-name">Nome completo</label><input class="field" id="mock-name" placeholder="Nome do paciente fictício" autocomplete="off"><label for="mock-note">Observação</label><input class="field" id="mock-note" placeholder="Informação ilustrativa" autocomplete="off"><div class="info-note">Campos livres para visualizar o formulário. Nenhuma informação será armazenada.</div>`,`<span>Prévia de formulário</span><button class="primary-button" data-action="finish-form">Concluir prévia ${icon('check')}</button>`),
  'new-appointment':()=>modal('Tempo para um encontro.','Prévia visual do agendamento',`<label for="appointment-patient">Paciente fictício</label><select class="field" id="appointment-patient">${patients.map(p=>`<option>${p.name}</option>`).join('')}</select><label for="appointment-time">Horário ilustrativo</label><input class="field" id="appointment-time" type="time" value="09:00"><div class="info-note">Nenhuma consulta será agendada. Este formulário demonstra a organização visual.</div>`,`<span>${state.day} de outubro · demonstração</span><button class="primary-button" data-action="finish-form">Concluir prévia ${icon('check')}</button>`),
  'finish-form':()=>{dialog.close();toast('Prévia concluída. Nenhuma informação foi salva.');},
};
document.addEventListener('click',event=>{
  const button=event.target.closest('button');if(!button)return;
  if(button.dataset.action){actions[button.dataset.action]?.();return;}
  if(button.dataset.page){navigate(button.dataset.page);return;}
  if(button.dataset.searchPage){dialog.close();navigate(button.dataset.searchPage);return;}
  if(button.dataset.exam){examModal(button.dataset.exam);return;}
  if(button.dataset.report){reportPreview(button.dataset.report);return;}
  if(button.dataset.patient){patientModal(button.dataset.patient);return;}
  if(button.dataset.patientExams){const p=patients.find(p=>p.id===button.dataset.patientExams);if(p){dialog.close();state.period='month';state.examStatus='all';state.examQuery=p.name;navigate('exams');}return;}
  if(button.dataset.day){state.day=Number(button.dataset.day);if(state.page==='overview'){document.getElementById('agenda-region').innerHTML=agendaPanel();document.querySelector(`[data-day="${state.day}"]`)?.focus();}else renderPage(`[data-day="${state.day}"]`);return;}
  if(button.dataset.period){state.period=button.dataset.period;document.querySelectorAll('[data-period]').forEach(el=>el.setAttribute('aria-pressed',String(el.dataset.period===state.period)));document.getElementById('exam-rows').innerHTML=examRows(state.page==='overview'?4:20);return;}
  if(button.dataset.map){state.map=button.dataset.map;renderPage(`[data-map="${state.map}"]`);}
});
document.addEventListener('input',event=>{
  const target=event.target;
  if(target.id==='patient-search'){state.patientQuery=target.value;document.getElementById('patient-cards').innerHTML=patientCards();}
  if(target.id==='exam-search'){state.examQuery=target.value;document.getElementById('exam-rows').innerHTML=examRows(20);}
  if(target.id==='global-search')updateSearch(target.value);
});
document.addEventListener('change',event=>{if(event.target.id==='status-filter'){state.examStatus=event.target.value;document.getElementById('exam-rows').innerHTML=examRows(20);}});
dialog.addEventListener('close',()=>{if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});});
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();if(!dialog.open)openSearch();}
  if(event.key==='Escape'&&document.body.classList.contains('sidebar-open')){closeSidebar();document.getElementById('menu-toggle').focus();}
  if(event.key==='Tab'&&document.body.classList.contains('sidebar-open')){const focusable=[...document.querySelectorAll('#sidebar a,#sidebar button')];const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}
});
document.getElementById('menu-toggle').addEventListener('click',()=>document.body.classList.contains('sidebar-open')?closeSidebar():openSidebar());
document.getElementById('sidebar-scrim').addEventListener('click',()=>{closeSidebar();document.getElementById('menu-toggle').focus();});
const mobileMedia=window.matchMedia('(max-width: 760px)');
function syncSidebar(){if(mobileMedia.matches){closeSidebar();}else{document.getElementById('sidebar').inert=false;document.body.classList.remove('sidebar-open');document.getElementById('menu-toggle').setAttribute('aria-expanded','false');}}
mobileMedia.addEventListener('change',syncSidebar);
window.addEventListener('hashchange',()=>{const key=location.hash.slice(1);if(pages[key])navigate(key);});
document.getElementById('navigation').innerHTML=navItems.map((n,i)=>`${i===0?'<span class="nav-caption">PRINCIPAL</span>':i===4?'<span class="nav-caption">ACOMPANHAMENTO</span>':''}<button class="nav-button" data-page="${n.id}">${icon(n.icon)}<span>${n.label}</span></button>`).join('');
state.page=pages[location.hash.slice(1)]?location.hash.slice(1):'overview';
hydrate();renderPage();syncSidebar();
