// UI regression using only the isolated Mock acquisition preview, without SQLite.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
let chromium;
try {
  // Use a local installation or an explicit module path, never a developer's home directory.
  ({chromium} = require(process.env.BAROPRESS_PLAYWRIGHT_MODULE || 'playwright'));
} catch (error) {
  throw new Error('Playwright indisponível. Instale-o localmente ou defina BAROPRESS_PLAYWRIGHT_MODULE para o módulo Playwright.', {cause: error});
}

const output = path.resolve('docs/corrections/paired-exam');
const base = process.env.BAROPRESS_PREVIEW_URL || 'http://127.0.0.1:1434/scripts/acquisition-preview.html';
let browser;
async function finishMockWindow(page) {
  await page.evaluate(async () => {
    const {useNewExamStore} = await import('/src/features/exams/examStore.ts');
    window.pairedExamTestStore = useNewExamStore;
  });
  await page.waitForFunction(() => {
    const state = window.pairedExamTestStore.getState();
    return state.step === 'ACQUIRING' && state.framesCollected.length >= 10;
  });
  // The timer boundary is exercised without waiting a full window per foot. The runtime
  // timing itself is covered by the device integration tests in exams.test.ts.
  const completed = await page.evaluate(async () => {
    const {useNewExamStore} = await import('/src/features/exams/examStore.ts');
    useNewExamStore.getState().tickAcquisition(useNewExamStore.getState().durationSeconds * 1000);
    const state = useNewExamStore.getState();
    return {step: state.step, foot: state.foot, separateFeet: state.separateFeet, error: state.error, stages: state.completedStages.length};
  });
  console.log('Mock window completed:', JSON.stringify(completed));
}
async function checkOrder(first, width) {
  const page = await browser.newPage({viewport: {width, height: 800}, deviceScaleFactor: 1});
  page.setDefaultTimeout(30_000);
  page.setDefaultNavigationTimeout(120_000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  console.log('Checking order:', first, width);
  // Vite HMR and module loading can keep the load event pending during development.
  await page.goto(base, {waitUntil: 'domcontentloaded'});
  await page.getByRole('button', {name: 'Selecionar', exact: true}).click();
  const firstLabel = first === 'left' ? 'esquerdo' : 'direito';
  const secondLabel = first === 'left' ? 'direito' : 'esquerdo';
  await page.getByRole('button', {name: `Começar pelo pé ${firstLabel}`, exact: true}).click();
  await page.getByRole('button', {name: 'Iniciar Exame', exact: true}).click();
  await finishMockWindow(page);
  await page.screenshot({path: path.join(output, `${first}-after-first-window.png`), fullPage: true});
  await page.getByRole('heading', {name: `Troque para o pé ${secondLabel}`, exact: true}).waitFor();
  await page.screenshot({path: path.join(output, `${first}-troca.png`), fullPage: true});
  const firstCount = await page.evaluate(async () => {
    const {useNewExamStore} = await import('/src/features/exams/examStore.ts');
    const state = useNewExamStore.getState();
    if (state.framesCollected.length !== 0) throw new Error('Coleta não pausou para a troca.');
    return state.completedStages[0].examInput.frameCount;
  });
  await page.getByRole('button', {name: `Iniciar pé ${secondLabel}`, exact: true}).click();
  await finishMockWindow(page);
  await page.getByRole('button', {name: 'Salvar exame com os dois pés', exact: true}).waitFor();
  assert.equal(await page.getByText('Qualidade descritiva:', {exact: false}).isVisible(), false);
  await page.screenshot({path: path.join(output, `${first}-resultado.png`), fullPage: true});
  await page.getByRole('button', {name: 'Salvar exame com os dois pés', exact: true}).click();
  await page.getByRole('heading', {name: 'Exame Salvo com Sucesso!', exact: true}).waitFor();
  const state = await page.evaluate(async () => {
    const {useNewExamStore} = await import('/src/features/exams/examStore.ts');
    const current = useNewExamStore.getState();
    return {id: current.savedExam.id, feet: current.savedExams.map(exam => exam.analysis.acquisition.foot), firstCount: current.savedExams[0].frameCount};
  });
  assert.equal(state.id, 1);
  assert.deepEqual(state.feet, [first, first === 'left' ? 'right' : 'left']);
  assert.equal(state.firstCount, firstCount);
  await page.getByRole('button', {name: 'Visualizar Exame Salvo', exact: true}).click();
  await page.getByRole('heading', {name: 'Dois pés · exame único', exact: true}).waitFor();
  await page.screenshot({path: path.join(output, `${first}-exame-unico.png`), fullPage: true});
  await page.getByTitle('Fechar', {exact: true}).click();
  await page.evaluate(async () => {
    const {useSession} = await import('/src/stores/session.ts');
    useSession.getState().openReport(1);
  });
  await page.getByRole('heading', {name: 'Dois pés · exame único', exact: true}).waitFor();
  await page.screenshot({path: path.join(output, `${first}-relatorio.png`), fullPage: true});
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', {name: 'Exportar PDF', exact: true}).click();
  const pdf = await downloading;
  await pdf.saveAs(path.join(output, `${first}-dois-pes.pdf`));
  assert.deepEqual(errors, []);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  await page.close();
  return {...state, width, errors};
}
(async () => {
  fs.mkdirSync(output, {recursive: true});
  browser = await chromium.launch({channel: 'msedge', headless: true});
  const results = [];
  for (const [first, width] of [['left', 1366], ['right', 768]]) results.push(await checkOrder(first, width));
  fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
})().catch(error => {console.error(error); process.exitCode = 1;}).finally(async () => {await browser?.close();});
