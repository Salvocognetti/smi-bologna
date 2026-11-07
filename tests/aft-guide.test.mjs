import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import vm from 'node:vm';

const root = fileURLToPath(new URL('../', import.meta.url));
const readJson = path => JSON.parse(readFileSync(resolve(root, path), 'utf8'));

function fixture() {
  const elements = new Map();
  const element = selector => {
    if (!elements.has(selector)) elements.set(selector, { innerHTML: '', addEventListener() {} });
    return elements.get(selector);
  };
  const context = vm.createContext({
    document: { querySelector: element, title: '' },
    console, Intl, Date,
    testData: {
      geography: readJson('assets/district-map.json'),
      content: readJson('content.json'),
      credits: readJson('assets/photo-credits.json'),
      guide: readJson('aft-guide.json')
    }
  });
  vm.runInContext(readFileSync(resolve(root, 'app.js'), 'utf8').replace(/\binit\(\);\s*$/, ''), context);
  vm.runInContext(readFileSync(resolve(root, 'aft-guide.js'), 'utf8'), context);
  vm.runInContext('geography=testData.geography; content=testData.content; credits=testData.credits; aftGuide=testData.guide;', context);
  return { run: code => vm.runInContext(code, context), element, data: context.testData };
}

test('multiple candidates in one AFT do not inflate territorial coverage', () => {
  const { run } = fixture();
  run("content.candidates = [{id:'one',name:'Uno',district:'bologna',aftId:'bologna-reno'},{id:'two',name:'Due',district:'bologna',aftId:'bologna-reno'}]");
  assert.equal(run("aftCoverage('bologna').published"), 2);
  assert.equal(run("aftCoverage('bologna').covered"), 1);
  assert.equal(run("aftCoverage('bologna').supported"), 0);
});

test('support requires explicit confirmation for the named coalition', () => {
  const { run } = fixture();
  assert.equal(run("hasCoalitionSupport({endorsement:{status:'pending',coalition:'SMI–SNAMI'}})"), false);
  assert.equal(run("hasCoalitionSupport({endorsement:{status:'confirmed',coalition:'Other'}})"), false);
  assert.equal(run("hasCoalitionSupport({endorsement:{status:'confirmed',coalition:'SMI–SNAMI'}})"), true);
  const ordinary = run("personCard({name:'Candidato',endorsement:{status:'pending',coalition:'SMI–SNAMI'}},true)");
  assert.doesNotMatch(ordinary, /candidate-support-badge|is-supported/);
  const supported = run("personCard({name:'Candidato',endorsement:{status:'confirmed',coalition:'SMI–SNAMI'}},true)");
  assert.match(supported, /candidate-support-badge/);
});

test('candidate and substitute names are escaped in rendered cards', () => {
  const { run } = fixture();
  const card = run("personCard({name:'<script>candidate</script>',substitute:{name:'<img onerror=alert(1)>'}},true)");
  assert.doesNotMatch(card, /<script>|<img onerror/);
  assert.match(card, /&lt;script&gt;candidate/);
  assert.match(card, /Candidato sostituto/);
});

test('unverified polling venues are never displayed as confirmed', () => {
  const { run, element } = fixture();
  run("aftGuide.voting.districts.find(d=>d.district==='bologna').venue='Unverified address'; aftGuide.voting.districts.find(d=>d.district==='bologna').status='confirmed'; renderVotingLocation('bologna')");
  assert.doesNotMatch(element('#voting-location').innerHTML, /Unverified address/);
  assert.match(element('#voting-location').innerHTML, /In attesa di conferma aziendale/);
});

test('Imola does not inherit the Bologna election calendar', () => {
  const { run, element } = fixture();
  run("renderVotingLocation('imola')");
  assert.match(element('#voting-location').innerHTML, /Da confermare con l’AUSL di Imola/);
  assert.doesNotMatch(element('#voting-location').innerHTML, /18–19 novembre/);
});

test('guide sources, voting districts, and rendered section anchors are consistent', () => {
  const { run, data, element } = fixture();
  const sourceIds = new Set(data.guide.sources.map(s => s.id));
  for (const rule of data.guide.rules) assert.ok(sourceIds.has(rule.source));
  assert.ok(sourceIds.has(data.guide.calendar.source));
  for (const d of data.guide.voting.districts) assert.ok(data.geography.districts.some(known => known.id === d.district));
  run('aftGuidePage()');
  const html = element('#main').innerHTML;
  for (const id of ['ruolo', 'regole', 'calendario', 'dove-si-vota', 'domande', 'fonti']) {
    assert.ok(html.includes(`id="${id}"`));
    assert.ok(html.includes(`href="#/guida-aft#${id}"`));
  }
  for (const source of data.guide.sources) assert.ok(html.includes(`id="fonte-${source.id}"`));
});
