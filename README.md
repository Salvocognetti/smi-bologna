# SMI Bologna

Sito ufficiale SMI Bologna: prototipo per il territorio, gli organigrammi e le elezioni dei referenti AFT.

## Pubblicazione

GitHub Pages: Settings → Pages → Deploy from a branch → main → /(root).

Configurare il dominio personalizzato smibologna.it nelle impostazioni Pages prima di modificare i DNS. Il sito usa percorsi relativi per funzionare anche come sito di progetto GitHub Pages.

## Contenuti

Dati in content.json. Candidati e rappresentanti provinciali devono essere confermati prima della pubblicazione. La pagina «Il nostro impegno per Bologna» attende i testi approvati.

Fonte organigramma regionale e attribuzioni fotografiche sono esposte nel sito. Le fotografie conservano le licenze indicate in assets/photo-credits.json; caratteri con licenza SIL OFL. Il marchio SMI proviene dal sito nazionale.

## Guida al Referente AFT

La pagina `#/guida-aft` è richiamata dalla fascia informativa comune a tutte le pagine, dalla navigazione, dall’apertura della home e dalle candidature. Testi, calendario, fonti e dati dei seggi sono in `aft-guide.json`; il rendering è in `aft-guide.js`.

Le regole regionali sono tratte dall’AIR sottoscritto il 17 febbraio 2026, art. 7 e Allegato 2, art. 5. Il calendario 4/8/18–19/20/30 novembre 2026 e la priorità RUAP TI/TD provengono dall’estratto della comunicazione NCP fornito per il sito: devono essere confrontati con la documentazione aziendale. Il calendario di Bologna non viene attribuito all’AUSL di Imola. Non sono stati reperiti avvisi pubblici che confermino sedi e orari dei seggi; la guida non riutilizza gli indirizzi degli ambulatori AFT come seggi.

L’AIR contiene formulazioni diverse sui rinnovi tra art. 7, comma 6, e Allegato 2, art. 5, lettera c. La guida indica il mandato triennale e rimanda al regolamento aziendale per il rinnovo. La formula regionale «a maggioranza» non viene trasformata in un quorum o in una soglia numerica non verificata.

Per completare i seggi, aggiornare ciascuna voce in `voting.districts`: `status: "confirmed"`, `venue`, `address`, `dates` (se diverse dal calendario generale), `sessions` (elenco delle fasce di voto) e `sourceUrl` dell’avviso ufficiale. Una sede priva di fonte non viene mostrata come confermata. Date diverse da quelle comunicate per Bologna richiedono anche l’aggiornamento del relativo calendario.

## Candidature aziendali e sostegno sindacale

L’elenco può contenere più candidati per AFT. `aftId` collega il candidato alla programmazione territoriale. I conteggi distinguono il numero dei candidati dal numero delle AFT coperte.

Il contrassegno di sostegno richiede `endorsement: { "status": "confirmed", "coalition": "SMI–SNAMI" }`. In assenza di conferma il candidato resta pubblicato senza contrassegno. Eventuali sostituti sono inseriti in `substitute: { "name": "…" }`; il riferimento all’elenco aziendale può essere inserito in `officialSource: { "title": "…", "url": "…" }`. Il campo `profilePending` riguarda solo il completamento della presentazione, non l’ufficialità della candidatura o il sostegno sindacale.

Il sostegno SMI–SNAMI a Nicoletta Giulietti e Salvatore Cognetti è stato confermato esplicitamente il 7 novembre 2026. Entrambi i profili riportano il relativo contrassegno; il completamento della presentazione di Cognetti resta distinto dal sostegno confermato. L’elenco completo della PEC non è ancora stato importato. Quando arriveranno gli allegati, verificare anno, ambito aziendale, AFT, coppia Referente/sostituto, sedi, orari, metodo di voto e rinnovi prima dell’aggiornamento. Non pubblicare recapiti personali o metadati PEC non destinati al sito.

Verifiche senza dipendenze: `node --check app.js`, `node --check aft-guide.js`, `node --test tests/aft-guide.test.mjs`. Dopo modifiche a JS/CSS/dati, aggiornare insieme le versioni nelle URL di `index.html` e nei caricamenti di `app.js`.
