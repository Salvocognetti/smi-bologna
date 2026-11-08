'use strict';

const JOIN = 'https://sindacatomedicitaliani.it/iscrizioni/';
const main = document.querySelector('#main');
const icons = {
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg>',
  ballot: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="m8 13-4 4v11h24V17l-4-4M4 17h24M12 8l6-5 8 10-6 5Z"/><path d="m16 10 2 2 3-3M11 23h10"/></svg>',
  map: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="m2 5 5-2 6 2 5-2v13l-5 2-6-2-5 2Zm5-2v13m6-11v13"/></svg>',
  list: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M6 5h12M6 10h12M6 15h12M2 5h1M2 10h1M2 15h1"/></svg>',
  book: '<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true"><path d="M6 4h18a2 2 0 0 1 2 2v23H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Zm0 20h20M10 9h10M10 13h7M4 26a2 2 0 0 1 2-2"/></svg>',
  people: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 5v2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="m8 12 3 3 5-6"/></svg>'
};
let geography, content, credits, aftGuide;
let selectedDistrict = 'bologna';
let mapView = 'map';
let previousRoute = '';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const photo = id => `./assets/photos/${id}.webp`;
const districtUrl = id => `#/distretto/${id}`;
const district = id => geography.districts.find(d => d.id === id);
const photoCredit = id => credits.find(p => p.id === id) || {};
const districtName = d => d.id === 'bologna' ? 'Città di Bologna' : d.name;
const joinSection = () => `<section class="join-section"><div class="container join-inner"><div><h2>Fai parte di SMI.</h2><p>Iscriviti al Sindacato Medici Italiani dal portale nazionale.</p></div><a class="button button-red" href="${JOIN}" target="_blank" rel="noopener noreferrer">UNISCITI A NOI! <span aria-hidden="true">↗</span></a></div></section>`;
const breadcrumb = label => `<div class="breadcrumb"><a href="#/">Home</a><span aria-hidden="true">/</span><span>${esc(label)}</span></div>`;


const coalitionName = () => content.coalition?.name || 'SMI–SNAMI';
const districtAfts = id => (content.afts||[]).filter(a=>a.district===id);
const districtCandidates = id => content.candidates.filter(p=>p.district===id&&String(p.name||'').trim());
const hasCoalitionSupport = p => p.endorsement?.status === 'confirmed' && p.endorsement?.coalition === 'SMI–SNAMI';
const aftCoverage = id => {
  const people = districtCandidates(id);
  return {total:districtAfts(id).length,published:people.length,covered:new Set(people.map(p=>p.aftId).filter(Boolean)).size,supported:people.filter(hasCoalitionSupport).length};
};
const coverageText = id => {
  const n=aftCoverage(id);
  return n.total?`${n.published} ${n.published===1?'candidatura pubblicata':'candidature pubblicate'} · ${n.covered} / ${n.total} AFT`:'Elenco AFT da integrare';
};
const guideCallout = () => `<aside class="guide-callout"><div><span class="mini-label">Prima del voto</span><h2>Che cosa fa il Referente AFT?</h2><p>Il ruolo, le regole, il calendario e le indicazioni per il tuo distretto.</p></div><div class="election-reading-links"><a class="text-link" href="#/guida-aft">Consulta la guida <span aria-hidden="true">↗</span></a><a class="text-link" href="#/impegno-bologna">Il progetto SMI–SNAMI <span aria-hidden="true">↗</span></a></div></aside>`;

function coalitionNotice(mode='page') {
  const c=content.coalition||{};
  const tag=mode==='district'?'h3':'h2';
  return `<aside class="coalition-notice coalition-notice--${mode}" aria-label="Alleanza elettorale ${esc(coalitionName())}"><p class="coalition-kicker">Elezioni dei referenti AFT · ${esc(coalitionName())}</p><${tag}>${esc(c.title||'Un candidato condiviso per ogni AFT.')}</${tag}><p class="coalition-description">${esc(c.description||'SMI e SNAMI coordinano le candidature per presentare un candidato condiviso per ogni AFT, coordinare il voto ed evitare la dispersione delle preferenze.')}</p></aside>`;
}

function registryDate(value) {
  if(!value)return '';
  if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return String(value);
  const parsed=new Date(`${value}T12:00:00Z`);
  return Number.isNaN(parsed.getTime())?String(value):new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Rome'}).format(parsed);
}

function registrySource() {
  const r=content.aftRegistry;
  if(!r?.sourceUrl)return '';
  const dates=[r.actDate?`Atto del ${registryDate(r.actDate)}`:'',r.publishedOn?`pubblicato il ${registryDate(r.publishedOn)}`:'',r.consultedOn?`consultato il ${registryDate(r.consultedOn)}`:''].filter(Boolean);
  return `<div class="aft-registry-source"><p>Fonte territoriale: <a href="${esc(r.sourceUrl)}" target="_blank" rel="noopener noreferrer">${esc(r.sourceTitle||'Programmazione regionale delle AFT')} <span aria-hidden="true">↗</span></a></p>${dates.length?`<p class="aft-registry-dates">${dates.map(esc).join(' · ')}</p>`:''}</div>`;
}

function registryNotice(d) {
  const complete=content.aftRegistry?.complete&&districtAfts(d.id).length>0;
  return `<div class="aft-list-notice"><p>${complete?'L’elenco territoriale delle AFT di questo distretto è tratto dalla programmazione regionale ufficiale.':'L’elenco delle AFT di questo territorio è in aggiornamento.'} I nominativi e i profili dei candidati sono aggiornati progressivamente.</p>${complete?registrySource():''}</div>`;
}

function districtCoverage(d) {
  const n=aftCoverage(d.id);
  if(!n.total)return '<p class="aft-coverage-pending">Elenco AFT da integrare per questo territorio.</p>';
  return `<div class="aft-coverage" aria-label="${n.covered} AFT con candidature pubblicate su ${n.total}"><strong>${n.covered}<span aria-hidden="true"> / </span>${n.total}</strong><p><span>AFT con candidature pubblicate</span>${n.published} ${n.published===1?'candidatura disponibile':'candidature disponibili'}${n.supported?` · ${n.supported} ${n.supported===1?'sostenuta':'sostenute'} da SMI–SNAMI`:''}</p></div>`;
}

function photoTag(id, cls='', eager=false) {
  const p=photoCredit(id);
  return `<img src="${photo(id)}" alt="${esc(p.location || p.title || 'Paesaggio del territorio bolognese')}" ${cls?`class="${cls}"`:''} ${eager?'fetchpriority="high"':'loading="lazy"'} decoding="async">`;
}

function homePage() {
  document.title = 'SMI Bologna — Il tuo territorio. I tuoi riferimenti.';
  main.innerHTML = `<section class="hero">
    ${photoTag('hero','hero-image',true)}
    <div class="container hero-content"><p class="eyebrow">Sindacato Medici Italiani · Bologna</p>
      <h1>Il tuo territorio.<br><em>I tuoi riferimenti.</em></h1>
      <p class="hero-copy">Dalla città all’Appennino, dalla pianura alle valli.<br>SMI Bologna, a partire dai medici e dai luoghi.</p>
      <div class="hero-actions"><a class="button button-red" href="#/guida-aft">Referente AFT: la guida <span aria-hidden="true">↗</span></a><a class="text-link" href="#/#territorio">Esplora il territorio <span aria-hidden="true">→</span></a></div>
    </div>
    <div class="hero-bottom"><span class="hero-location">${icons.pin} Bologna, uno sguardo sulla città</span><a class="hero-scroll" href="#/#territorio">IL TERRITORIO, DA VICINO <i aria-hidden="true">↓</i></a></div>
  </section>
  <div class="container intro-band"><div class="band-heading">${icons.ballot}<div><strong>Elezioni dei referenti AFT</strong><span>Informazioni, candidature e sostegno SMI–SNAMI.</span></div></div><p>Conosci il ruolo. Consulta le regole.<br>Trova i candidati della tua AFT.</p><a href="#/elezioni" class="text-link">Vai alle candidature <span aria-hidden="true">↗</span></a></div>
  <section class="container coalition-home">${coalitionNotice('home')}</section>
  <section class="container territory" id="territorio"><div class="section-heading"><div><p class="eyebrow">Una mappa, tanti territori</p><h2>Trova il tuo distretto.</h2></div><p>Esplora la mappa per trovare i rappresentanti sindacali e le candidature AFT del tuo territorio.</p></div>
    <div class="map-toolbar"><p class="map-hint">${icons.pin} Seleziona un distretto per conoscerlo</p><div class="view-toggle" aria-label="Visualizzazione del territorio"><button data-view="map" aria-pressed="true">${icons.map} Mappa</button><button data-view="list" aria-pressed="false">${icons.list} Elenco</button></div></div>
    <div class="map-experience"><div class="map-stage" id="map-stage"><div class="map-compass"><span aria-hidden="true">↑</span> N</div>${mapSvg()}<div class="map-legend"><span><i></i> AUSL di Bologna</span><span><i></i> AUSL di Imola</span></div></div><div class="district-preview" id="district-preview" aria-live="polite"></div><div class="district-list" id="district-list" hidden>${geography.districts.map(listItem).join('')}</div></div>
    <p class="map-source">Sei distretti dell’AUSL di Bologna e il territorio dell’AUSL di Imola. I distretti comprendono più AFT. <a href="#/crediti">Fonti della mappa ↗</a></p>
  </section>
  <section class="election-section"><div class="container election-inner"><div><p class="eyebrow">Il nostro impegno</p><h2>Vota la squadra.<br>Vota le idee.</h2></div><div class="election-copy"><p>Tutela del reddito, carichi sostenibili e solidarietà tra territorio, ospedale ed emergenza. Conosci il progetto che unisce i candidati sostenuti da SMI–SNAMI.</p><a href="#/impegno-bologna" class="text-link">Il nostro impegno per Bologna <span aria-hidden="true">↗</span></a><a href="#/elezioni" class="text-link">Conosci i candidati <span aria-hidden="true">↗</span></a></div></div></section>
  <section class="container archive-teaser"><div class="archive-icon">${icons.book}</div><div><p class="eyebrow">Archivio SMI</p><h2>La norma giusta,<br><em>quando serve.</em></h2></div><div><p>Lo spazio dedicato ad accordi, normativa e giurisprudenza è in preparazione.</p><a href="#/archivio" class="text-link">Scopri l’archivio <span aria-hidden="true">→</span></a></div></section>${joinSection()}`;
  renderDistrictPreview();
  wireMap();
}

function mapSvg() {
  const labels={bologna:['Città di','Bologna'],'reno-lavino-samoggia':['Reno, Lavino','e Samoggia'],'savena-idice':['Savena','Idice'],appennino:['Appennino','bolognese'],'pianura-est':['Pianura Est'],'pianura-ovest':['Pianura','Ovest'],imola:['Imola']};
  return `<svg class="district-map" viewBox="${geography.viewBox}" role="group" aria-label="Mappa interattiva dei distretti dell’area metropolitana di Bologna">${geography.districts.map(d=>`<path class="district-shape ${d.id===selectedDistrict?'is-selected':''}" data-id="${d.id}" d="${d.path}" tabindex="0" role="button" aria-label="${esc(d.name)}, ${esc(d.ausl)}: mostra informazioni" aria-pressed="${d.id===selectedDistrict}"><title>${esc(d.name)} · ${esc(d.ausl)}</title></path>`).join('')}${geography.districts.map(d=>`<text class="map-label ${d.id===selectedDistrict?'is-selected':''}" data-label="${d.id}" x="${d.label.x}" y="${d.label.y}" aria-hidden="true">${labels[d.id].map((t,i)=>`<tspan x="${d.label.x}" dy="${i?'1.3em':labels[d.id].length>1?'-.3em':'0'}">${esc(t)}</tspan>`).join('')}</text>`).join('')}</svg>`;
}

function listItem(d) {
  return `<a href="${districtUrl(d.id)}" class="district-list-item">${photoTag(d.id)}<div class="list-info"><span class="mini-label">${esc(d.ausl)}</span><h3>${esc(d.name)}</h3><p>${d.communeCount} ${d.communeCount===1?'comune':'comuni'} · Rappresentanti e candidature</p></div><span aria-hidden="true">↗</span></a>`;
}

function renderDistrictPreview() {
  const d=district(selectedDistrict), p=photoCredit(d.id);
  const repCount=content.representatives.filter(c=>c.district===d.id).length;
  const el=document.querySelector('#district-preview');
  if(!el)return;
  el.classList.remove('changing');
  el.innerHTML=`<div class="preview-photo">${photoTag(d.id)}<span class="photo-caption">${esc(p.location||'')}</span></div><div class="preview-content"><p class="mini-label">${esc(d.ausl)} · ${d.communeCount} ${d.communeCount===1?'comune':'comuni'}</p><h3>${esc(d.name)}</h3><p class="preview-status"><span class="status-dot"></span>${repCount?`${repCount} rappresentanti sindacali`:'Rappresentanti · in aggiornamento'}</p><p class="preview-status"><span class="status-dot"></span>${esc(coverageText(d.id))}</p><a class="text-link" href="${districtUrl(d.id)}">Esplora il distretto <span aria-hidden="true">↗</span></a></div>`;
  void el.offsetWidth;el.classList.add('changing');
}

function wireMap() {
  document.querySelectorAll('.district-shape').forEach(el=>{
    const select=()=>{
      selectedDistrict=el.dataset.id;
      document.querySelectorAll('.district-shape').forEach(p=>{p.classList.toggle('is-selected',p.dataset.id===selectedDistrict);p.setAttribute('aria-pressed',p.dataset.id===selectedDistrict)});
      document.querySelectorAll('.map-label').forEach(p=>p.classList.toggle('is-selected',p.dataset.label===selectedDistrict));
      renderDistrictPreview();
    };
    el.addEventListener('click',select);
    el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select()}});
  });
  document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',()=>{
    mapView=b.dataset.view;
    document.querySelectorAll('[data-view]').forEach(x=>x.setAttribute('aria-pressed',x===b));
    document.querySelector('#map-stage').hidden=mapView==='list';
    document.querySelector('#district-preview').hidden=mapView==='list';
    document.querySelector('#district-list').hidden=mapView==='map';
  }));
  if(mapView==='list')document.querySelector('[data-view="list"]').click();
}

function districtPage(id, tab='rappresentanti') {
  const d=district(id);
  if(!d)return notFound();
  const p=photoCredit(d.id);
  document.title=`${d.name} — SMI Bologna`;
  main.innerHTML=`<section class="district-hero">${photoTag(d.id,'',true)}<div class="container district-hero-inner"><div class="breadcrumb"><a href="#/">Home</a><span aria-hidden="true">/</span><a href="#/#territorio">Il territorio</a><span aria-hidden="true">/</span><span>${esc(d.name)}</span></div><p class="eyebrow">Distretto · ${esc(d.ausl)}</p><h1>${esc(d.name)}</h1><p class="district-location">${icons.pin.replace('<svg','<svg width="13" height="13"')} ${esc(p.location||'')}</p></div></section>
  <div class="container district-body"><div><div class="district-tabs" role="tablist" aria-label="Informazioni del distretto"><button id="tab-reps" role="tab" data-tab="rappresentanti" aria-controls="district-panel" aria-selected="${tab==='rappresentanti'}">Rappresentanti sindacali</button><button id="tab-candidates" role="tab" data-tab="candidature" aria-controls="district-panel" aria-selected="${tab==='candidature'}">Candidature AFT</button></div><div id="district-panel" class="district-tab-panel" role="tabpanel"></div></div><aside class="district-sidebar"><h3>Il distretto, da vicino.</h3><span class="mini-label">Azienda sanitaria</span><p>${esc(d.ausl)}${d.id==='imola'?'<br>Distinta dall’AUSL di Bologna.':''}</p><span class="mini-label">${d.communeCount===1?'Il comune':'I '+d.communeCount+' comuni'}</span><div class="communes">${d.communes.map(esc).join(' · ')}</div><a href="#/#territorio" class="text-link">Torna alla mappa <span aria-hidden="true">↗</span></a></aside></div>
  <section class="container all-districts"><h2>Esplora gli altri distretti.</h2><div class="district-pills">${geography.districts.filter(x=>x.id!==id).map(x=>`<a href="${districtUrl(x.id)}">${esc(x.name)} ↗</a>`).join('')}</div></section>${joinSection()}`;
  const buttons=[...document.querySelectorAll('[data-tab]')];
  const showTab=(value)=>{
    buttons.forEach(b=>{b.setAttribute('aria-selected',b.dataset.tab===value);b.tabIndex=b.dataset.tab===value?0:-1});
    renderDistrictPanel(d,value);
  };
  buttons.forEach((b,i)=>{
    b.addEventListener('click',()=>showTab(b.dataset.tab));
    b.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const next=(e.key==='Home'?0:e.key==='End'?buttons.length-1:(i+(e.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length);buttons[next].focus();showTab(buttons[next].dataset.tab)}});
  });
  showTab(tab);
}

function renderDistrictPanel(d, tab) {
  const isCandidates=tab==='candidature';
  const records=isCandidates?districtCandidates(d.id):content.representatives.filter(p=>p.district===d.id);
  const el=document.querySelector('#district-panel');
  el.setAttribute('aria-labelledby',isCandidates?'tab-candidates':'tab-reps');
  const cards=isCandidates?aftCandidateGroups(d,records):records.map(p=>personCard(p,false)).join('');
  el.innerHTML=`<h2>${isCandidates?'Le candidature, AFT per AFT.':'I tuoi riferimenti SMI.'}</h2><p>${isCandidates?'I nominativi pubblicati per questo distretto. Il contrassegno SMI–SNAMI identifica soltanto le candidature con sostegno confermato.':'I riferimenti sindacali SMI per i medici del distretto.'}</p>${isCandidates?guideCallout()+coalitionNotice('district')+districtCoverage(d):''}${cards||`<div class="empty-state"><div class="empty-icon">${isCandidates?icons.check:icons.people}</div><div><h3>${isCandidates?'Le candidature stanno arrivando.':'I riferimenti saranno disponibili qui.'}</h3><p>${isCandidates?'Le candidature per questo distretto saranno disponibili qui, con l’AFT di riferimento e la presentazione di ciascun medico.':'Questa sezione accoglierà i nominativi, gli incarichi e i contatti dei rappresentanti sindacali, dopo la loro conferma.'}</p><span class="status-label"><i class="status-dot"></i> Contenuti in aggiornamento</span></div></div>`}${isCandidates?registryNotice(d):''}`;
}

function aftCandidateGroups(d, records) {
  const known=districtAfts(d.id);
  const groups=new Map(known.map(a=>[a.id,{...a,candidates:[]}]));
  records.forEach(p=>{
    const key=p.aftId||p.aft||'aft-in-aggiornamento';
    if(!groups.has(key))groups.set(key,{id:key,name:p.aft||'AFT in aggiornamento',label:'AFT',candidates:[]});
    groups.get(key).candidates.push(p);
  });
  return [...groups.values()].map(a=>`<section class="aft-candidate-group" aria-labelledby="aft-${esc(a.id)}"><header class="aft-group-heading"><span class="mini-label">${esc(a.label||'AFT')}</span><h3 id="aft-${esc(a.id)}">${esc(a.name)}</h3>${a.communes?.length?`<p>${a.communes.map(esc).join(' · ')}</p>`:''}${a.areas?.length?`<p class="aft-areas"><span>Ambito territoriale:</span> ${a.areas.map(esc).join(' · ')}</p>`:''}</header><div class="candidate-list">${a.candidates.length?a.candidates.map(p=>personCard(p,true)).join(''):candidateSlot(a)}</div></section>`).join('');
}


function candidateSlot(a) {
  return `<article class="candidate-slot" aria-label="Candidature in aggiornamento per ${esc(a.name)}"><div class="candidate-slot-icon">${icons.people}</div><div><p class="candidate-slot-kicker">Elezioni del Referente AFT</p><h4>Elenco in aggiornamento</h4><p>I nominativi comunicati dall’AUSL saranno riportati in questa sezione.</p></div></article>`;
}

function personCard(p,candidate) {
  if(!candidate)return `<article class="empty-state">${p.photo?`<img src="${esc(p.photo)}" alt="${esc(p.name)}" width="64" height="64" loading="lazy">`:`<div class="empty-icon">${icons.people}</div>`}<div><span class="mini-label">${esc(p.role)}</span><h3>${esc(p.name)}</h3><p>${esc(p.bio||'')}</p>${p.email?`<a class="text-link" href="mailto:${esc(p.email)}">${esc(p.email)}</a>`:''}</div></article>`;
  const paragraphs=String(p.bio||'').split(/\n\s*\n/).filter(t=>t.trim());
  const portrait=p.photo?`<img class="candidate-portrait" src="${esc(p.photo)}" alt="${esc(p.name)}" width="180" height="225" loading="lazy" decoding="async">`:`<div class="candidate-photo-placeholder">${icons.people}<span>Foto in arrivo</span></div>`;
  const supported=hasCoalitionSupport(p);
  return `<article class="candidate-card${supported?' is-supported':''}"><div class="candidate-overview"><div class="candidate-photo">${portrait}</div><div class="candidate-identity"><span class="candidate-label">Candidato Referente AFT</span>${supported?'<span class="candidate-support-badge">Sostenuto da SMI–SNAMI</span>':''}<h4>${esc(p.name)}</h4><p class="candidate-profession">${esc(p.role||'Medico di medicina generale')}</p>${p.practiceLocation?`<p class="candidate-location">${icons.pin}<span>${esc(p.practiceLocation)}</span></p>`:''}${p.substitute?.name?`<p class="candidate-substitute"><strong>Candidato sostituto</strong><br>${esc(p.substitute.name)}</p>`:''}${p.profilePending?'<span class="candidate-profile-status">Profilo in aggiornamento</span>':''}</div></div>${paragraphs.length?`<div class="candidate-statement">${paragraphs.map(t=>`<p>${esc(t.trim())}</p>`).join('')}</div>`:p.profilePending?'<p class="candidate-pending">La presentazione del candidato sarà disponibile prossimamente.</p>':''}${p.officialSource?.url?`<p class="candidate-source"><a href="${esc(p.officialSource.url)}" target="_blank" rel="noopener noreferrer">${esc(p.officialSource.title||'Elenco candidature AUSL')} ↗</a></p>`:''}${p.email?`<a class="text-link candidate-contact" href="mailto:${esc(p.email)}">${esc(p.email)}</a>`:''}</article>`;
}

function electionsPage() {
  document.title='Elezioni dei referenti AFT — SMI Bologna';
  main.innerHTML=`<section class="container page-header">${breadcrumb('Elezioni AFT')}<p class="eyebrow">Elezioni dei referenti AFT</p><h1>Conosci i candidati.<br><em>AFT per AFT.</em></h1><p class="lead">Un punto di riferimento per le candidature del tuo territorio e per il sostegno confermato da SMI–SNAMI.</p></section><section class="container elections-content">${guideCallout()}${coalitionNotice()}<div class="election-note">${esc(content.electionNotice)}</div><div class="filter-bar"><label for="district-search">Cerca territorio o candidato<input id="district-search" type="search" placeholder="Distretto, comune, AFT o candidato…" autocomplete="off"></label><label for="ausl-filter">Azienda sanitaria<select id="ausl-filter"><option value="all">Tutte le aziende sanitarie</option><option value="AUSL di Bologna">AUSL di Bologna</option><option value="AUSL di Imola">AUSL di Imola</option></select></label></div><div class="election-grid" id="election-grid" aria-live="polite"></div><p class="notice-small">L’elenco completo delle candidature e dei sostituti è in aggiornamento. La presenza di un nome non implica il sostegno sindacale: il contrassegno SMI–SNAMI appare solo dopo la conferma.</p>${registrySource()}</section>${joinSection()}`;
  const draw=()=>{
    const q=document.querySelector('#district-search').value.trim().toLocaleLowerCase('it');
    const ausl=document.querySelector('#ausl-filter').value;
    const ds=geography.districts.filter(d=>{
      const people=content.candidates.filter(c=>c.district===d.id);
      const afts=(content.afts||[]).filter(a=>a.district===d.id);
      const searchable=[d.name,...d.communes,...afts.flatMap(a=>[a.name,...(a.aliases||[]),...(a.communes||[]),...(a.areas||[])]),...people.flatMap(c=>[c.name,c.aft,c.practiceLocation])].filter(Boolean).join(' ').toLocaleLowerCase('it');
      return (ausl==='all'||d.ausl===ausl)&&searchable.includes(q);
    });
    document.querySelector('#election-grid').innerHTML=ds.length?ds.map(d=>{
      const n=aftCoverage(d.id);
       return `<a href="${districtUrl(d.id)}/candidature" class="election-card">${photoTag(d.id)}<div class="election-card-body"><span class="mini-label">${esc(d.ausl)}</span><h2>${esc(d.name)}</h2><p class="election-card-coverage">${n.total?`<strong>${n.covered} / ${n.total}</strong><span>AFT con candidature · ${n.published} ${n.published===1?'candidatura pubblicata':'candidature pubblicate'}</span>${n.supported?`<span class="election-supported">${n.supported} ${n.supported===1?'sostenuta':'sostenute'} da SMI–SNAMI</span>`:''}`:'Elenco AFT da integrare.'}</p><span class="text-link">Vai alle candidature <span aria-hidden="true">↗</span></span></div></a>`;
    }).join(''):'<p class="no-results">Nessun distretto trovato. Prova con un altro comune o modifica il filtro.</p>';
  };
  document.querySelector('#district-search').addEventListener('input',draw);
  document.querySelector('#ausl-filter').addEventListener('change',draw);
  draw();
}

function archivePage() {
  document.title='Archivio SMI — SMI Bologna';
  main.innerHTML=`<section class="container page-header">${breadcrumb('Archivio SMI')}<p class="eyebrow">Memoria istituzionale SMI</p><h1>La norma giusta,<br><em>quando serve.</em></h1><p class="lead">Lo spazio dedicato alle fonti della professione medica: accordi, normativa e giurisprudenza.</p></section><section class="container archive-page"><div><div class="archive-icon">${icons.book}</div><h2>Un archivio,<br>in preparazione.</h2><p>Il progetto Archivio SMI è in lavorazione. I documenti e gli strumenti di consultazione saranno disponibili in questa sezione.</p><span class="status-label"><i class="status-dot"></i> Prossimamente</span></div><div><div class="archive-category"><span>01</span><div><h3>Accordi e contratti</h3><p>Accordi nazionali e regionali.</p></div></div><div class="archive-category"><span>02</span><div><h3>Normativa e atti</h3><p>Fonti nazionali, regionali e aziendali.</p></div></div><div class="archive-category"><span>03</span><div><h3>Giurisprudenza</h3><p>Pronunce e riferimenti per la professione.</p></div></div></div></section>${joinSection()}`;
}

function representativesNav(active) {
  return `<nav class="representatives-nav" aria-label="Livelli di rappresentanza"><a href="#/rappresentanti" ${active==='provincia'?'aria-current="page"':''}>Bologna e provincia</a><a href="#/organigramma-regionale" ${active==='regione'?'aria-current="page"':''}>Emilia-Romagna</a><a href="https://sindacatomedicitaliani.it/organigramma-nazionale/" target="_blank" rel="noopener noreferrer">Organigramma nazionale <span aria-hidden="true">↗</span></a></nav>`;
}

function provincialRepresentativesPage() {
  document.title='Rappresentanti provinciali — SMI Bologna';
  const people=content.provincialRepresentatives||[];
  main.innerHTML=`<section class="container page-header">${breadcrumb('Rappresentanti provinciali')}<p class="eyebrow">Il sindacato · Bologna e provincia</p><h1>Rappresentanti<br><em>provinciali.</em></h1></section><section class="container union-content">${representativesNav('provincia')}<div class="provincial-content">${people.length?people.map(p=>personCard(p,false)).join(''):`<div class="empty-state union-empty"><div class="empty-icon">${icons.people}</div><div><h2>Pagina in preparazione.</h2><p>Qui saranno disponibili i nominativi e gli incarichi dei rappresentanti provinciali di SMI Bologna.</p><span class="status-label"><i class="status-dot"></i> Contenuti in aggiornamento</span></div></div>`}</div></section>${joinSection()}`;
}

function regionalBoardPage() {
  document.title='Organigramma Emilia-Romagna — SMI Bologna';
  const board=content.regionalBoard;
  const consulted=new Intl.DateTimeFormat('it-IT',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Rome'}).format(new Date(`${board.consultedOn}T12:00:00Z`));
  main.innerHTML=`<section class="container page-header">${breadcrumb('Organigramma Emilia-Romagna')}<p class="eyebrow">Il sindacato · SMI Emilia-Romagna</p><h1>Organigramma<br><em>regionale.</em></h1><p class="lead">Le cariche SMI in Emilia-Romagna, come riportate dal sito nazionale.</p></section><section class="container union-content">${representativesNav('regione')}<div class="regional-board" aria-label="Cariche regionali">${board.members.map((p,i)=>`<article class="board-person"><span class="board-person-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span><p class="mini-label">${esc(p.role)}</p><h2>${esc(p.name)}</h2></article>`).join('')}</div><div class="board-source"><div><p>Fonte: Segreteria Nazionale SMI.</p><p>Fonte consultata il ${esc(consulted)}. Per eventuali aggiornamenti, consulta la pagina ufficiale.</p></div><a class="text-link" href="${esc(board.source)}" target="_blank" rel="noopener noreferrer">Organigramma regionale ufficiale <span aria-hidden="true">↗</span></a></div></section>${joinSection()}`;
}

function bolognaCommitmentPage() {
  renderBolognaCommitment();
}

function creditsPage() {
  document.title='Fonti e crediti — SMI Bologna';
  main.innerHTML=`<section class="container page-header">${breadcrumb('Fonti e crediti')}<p class="eyebrow">Fonti e crediti</p><h1>I luoghi, le fonti,<br><em>le immagini.</em></h1></section><section class="container credits-content"><h2>La mappa del territorio</h2><p>Confini © ISTAT, da <a href="https://github.com/guglielmo/geojson-italy" target="_blank" rel="noopener noreferrer">geojson-italy</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>). Confini comunali 2026 aggregati e semplificati per la visualizzazione. La mappa è uno strumento di navigazione del sito.</p><p>Composizione dei distretti: <a href="https://www.ausl.bologna.it/servt/distr" target="_blank" rel="noopener noreferrer">AUSL di Bologna — Distretti</a>; <a href="https://www.nuovocircondarioimolese.it/siti-tematici/usep/governance" target="_blank" rel="noopener noreferrer">Nuovo Circondario Imolese</a>. Imola è rappresentata come territorio di un’azienda sanitaria distinta.</p><h2>Programmazione territoriale delle AFT</h2><p>${content.aftRegistry?.complete?'L’elenco delle AFT è tratto dall’atto di programmazione regionale indicato di seguito.':'L’elenco territoriale delle AFT è in aggiornamento.'} Questa fonte descrive l’organizzazione territoriale; i nominativi dei candidati sono comunicati separatamente e vengono aggiornati progressivamente.</p>${registrySource()}<h2>Fotografie</h2><p>Fotografie dei luoghi reali del territorio. Le immagini sono state ridimensionate e convertite in WebP; la visualizzazione può prevedere ritagli.</p>${credits.map(p=>`<div class="credit-photo">${photoTag(p.id)}<div><strong>${esc(p.location||p.title)}</strong><p>${esc(p.author)} · <a href="${esc(p.licenseUrl)}" target="_blank" rel="noopener noreferrer">${esc(p.license)}</a><br><a href="${esc(p.source)}" target="_blank" rel="noopener noreferrer">${esc(p.title)}</a></p></div></div>`).join('')}<h2>Identità visiva</h2><p>Il marchio SMI — Sindacato Medici Italiani proviene dal <a href="https://sindacatomedicitaliani.it/" target="_blank" rel="noopener noreferrer">sito nazionale ufficiale</a>. I caratteri Manrope, DM Sans e Playfair Display sono distribuiti con licenza SIL Open Font License.</p><h2>Stato dei contenuti</h2><p>Questa è un’anteprima del sito. Le candidature sono organizzate per distretto e AFT. Il sostegno SMI–SNAMI è segnalato separatamente, solo dopo conferma. I nominativi e i profili dei candidati sono aggiornati progressivamente; gli incarichi e i contatti dei rappresentanti saranno inseriti dopo la loro conferma. L’archivio documentale non è ancora consultabile.</p></section>`;
}

function notFound() {
  document.title='Pagina non trovata — SMI Bologna';
  main.innerHTML=`<section class="container page-header">${breadcrumb('Pagina non trovata')}<p class="eyebrow">404</p><h1>Ritroviamo la strada.</h1><p class="lead">Questa pagina non è disponibile. Riparti dalla mappa del territorio.</p><p style="margin:28px 0"><a href="#/#territorio" class="button button-red">Vai alla mappa <span aria-hidden="true">→</span></a></p></section>`;
}

function closeMenu() {
  document.querySelector('.menu-toggle').setAttribute('aria-expanded','false');
  document.querySelector('.menu-toggle').setAttribute('aria-label','Apri menu');
  document.querySelector('#mobile-nav').hidden=true;
  document.body.classList.remove('menu-open');
  closeUnionMenu();
}

function closeUnionMenu(returnFocus=false) {
  const toggle=document.querySelector('.nav-disclosure-toggle');
  if(toggle.getAttribute('aria-expanded')==='true') {
    toggle.setAttribute('aria-expanded','false');
    document.querySelector('#union-nav').hidden=true;
    if(returnFocus)toggle.focus();
  }
}

function route() {
  const raw=location.hash.slice(1)||'/';
  const [path,anchor]=raw.split('#');
  const parts=path.split('/').filter(Boolean);
  const sameHome=previousRoute==='/'&&path==='/';
  closeMenu();
  if(!sameHome){
    if(!parts.length)homePage();
    else if(parts[0]==='distretto')districtPage(parts[1],parts[2]==='candidature'?'candidature':'rappresentanti');
    else if(parts[0]==='elezioni')electionsPage();
    else if(parts[0]==='guida-aft')aftGuidePage();
    else if(parts[0]==='archivio')archivePage();
    else if(parts[0]==='rappresentanti')provincialRepresentativesPage();
    else if(parts[0]==='organigramma-regionale')regionalBoardPage();
    else if(parts[0]==='impegno-bologna')bolognaCommitmentPage();
    else if(parts[0]==='crediti')creditsPage();
    else notFound();
    main.classList.remove('route-enter');void main.offsetWidth;main.classList.add('route-enter');
    window.scrollTo({top:0,behavior:'instant'});
    if(previousRoute)main.focus({preventScroll:true});
  }
  document.querySelectorAll('[data-nav]').forEach(a=>{const active=parts[0]===a.dataset.nav||(a.dataset.nav==='territorio'&&(!parts.length&&anchor==='territorio'||parts[0]==='distretto'))||(a.dataset.nav==='sindacato'&&['rappresentanti','organigramma-regionale','impegno-bologna'].includes(parts[0]));a.classList.toggle('active',active);if(a.tagName==='A'){active?a.setAttribute('aria-current','page'):a.removeAttribute('aria-current')}});
  previousRoute=path;
  if(sameHome&&!anchor)window.scrollTo({top:0,behavior:'smooth'});
  if(anchor)requestAnimationFrame(()=>document.getElementById(anchor)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'}));
}

async function init() {
  try {
    [geography,content,credits,aftGuide]=await Promise.all(['./assets/district-map.json','./content.json?v=20261107-sostegno-confermato','./assets/photo-credits.json','./aft-guide.json?v=20261107-guida-aft'].map(async url=>{const r=await fetch(url);if(!r.ok)throw Error(url);return r.json()}));
    document.querySelector('#year').textContent=new Date().getFullYear();
    route();
    window.addEventListener('hashchange',route);
    document.querySelector('.skip-link').addEventListener('click',e=>{e.preventDefault();main.focus();main.scrollIntoView({behavior:'instant'})});
    document.addEventListener('click',e=>{const link=e.target.closest('a[href^="#/"]');if(link&&link.getAttribute('href')===location.hash){e.preventDefault();route()}});
    document.querySelector('.menu-toggle').addEventListener('click',()=>{const button=document.querySelector('.menu-toggle');const open=button.getAttribute('aria-expanded')!=='true';button.setAttribute('aria-expanded',open);button.setAttribute('aria-label',open?'Chiudi menu':'Apri menu');document.querySelector('#mobile-nav').hidden=!open;document.body.classList.toggle('menu-open',open)});
    document.querySelector('.nav-disclosure-toggle').addEventListener('click',()=>{const toggle=document.querySelector('.nav-disclosure-toggle');const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',open);document.querySelector('#union-nav').hidden=!open});
    document.addEventListener('click',e=>{if(!e.target.closest('.nav-disclosure')||e.target.closest('#union-nav a'))closeUnionMenu()});
    document.querySelector('.nav-disclosure').addEventListener('focusout',e=>{if(!e.currentTarget.contains(e.relatedTarget))closeUnionMenu()});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeUnionMenu(true);closeMenu()}});
  } catch(error) {
    main.innerHTML='<section class="container page-header"><h1>Un momento, stiamo aggiornando il sito.</h1><p class="lead">Ricarica la pagina per riprovare. Le iscrizioni sono disponibili sul sito nazionale.</p><p style="margin:25px 0"><a class="button button-red" href="https://sindacatomedicitaliani.it/iscrizioni/">UNISCITI A NOI! ↗</a></p></section>';
    console.error('Caricamento contenuti non riuscito',error);
  }
}
init();
