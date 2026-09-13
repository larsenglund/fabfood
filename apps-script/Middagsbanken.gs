/**
 * Middagsbanken – databas i Google Sheets.
 *
 * Det här skriptet gör kalkylarket "Middagsbanken – databas" till ett litet
 * API som webbsidan läser och skriver till. Alla som använder sidan delar
 * samma data, och du kan lika gärna redigera direkt i kalkylarket.
 *
 * Så här kopplar du in det (engångsjobb, ca 3 minuter):
 *
 *   1. Öppna kalkylarket "Middagsbanken – databas" i Google Drive
 *   2. Tillägg  →  Apps Script
 *   3. Radera exempelkoden, klistra in hela den här filen, spara
 *   4. Distribuera  →  Ny distribution  →  kugghjulet  →  Webbapp
 *        Kör som:            Jag (din adress)
 *        Vem har åtkomst:    Alla
 *      →  Distribuera
 *   5. Godkänn behörigheterna. Google varnar för en "overifierad app" —
 *      det är ditt eget skript. Välj Avancerat → Fortsätt till projektet.
 *   6. Kopiera webbadressen som slutar på /exec och lägg in den i
 *      data/config.json i fabfood-repot
 *
 * Behöver du någon gång en ny adress: Distribuera → Hantera distributioner
 * → pennan → Ny version. Adressen är densamma efter en ny version.
 */

var BLAD_MIDDAGAR = 'Middagar';
var BLAD_VECKOR = 'Veckomatsedel';
var MIDDAGSKOLUMNER = ['id', 'namn', 'tid', 'veg', 'lank', 'anteckning', 'kalla', 'taggar', 'nr', 'skapad'];
var VECKOKOLUMNER = ['vecka', 'mandag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lordag', 'sondag', 'uppdaterad'];

/* ---------------------------------------------------------------- ingångar */

function doGet() {
  try {
    return svar({ ok: true, middagar: lasMiddagar(), veckor: lasVeckor(), tid: Date.now() });
  } catch (e) {
    return svar({ ok: false, fel: String(e) });
  }
}

/**
 * Sidan skickar POST med Content-Type text/plain. Det är med flit: då
 * slipper webbläsaren göra en OPTIONS-förfrågan först, och Apps Script kan
 * inte svara på OPTIONS. Kroppen är JSON ändå.
 */
function doPost(e) {
  var las = LockService.getScriptLock();
  try {
    las.waitLock(20000);
  } catch (fel) {
    return svar({ ok: false, fel: 'Databasen är upptagen, försök igen.' });
  }
  try {
    var begaran = JSON.parse(e.postData.contents);
    var resultat;
    switch (begaran.action) {
      case 'nyMiddag':      resultat = nyMiddag(begaran.middag); break;
      case 'andraMiddag':   resultat = andraMiddag(begaran.id, begaran.middag); break;
      case 'taBortMiddag':  resultat = taBortMiddag(begaran.id); break;
      case 'sparaVecka':    resultat = sparaVecka(begaran.vecka, begaran.dagar); break;
      default: throw new Error('Okänd åtgärd: ' + begaran.action);
    }
    resultat.ok = true;
    resultat.middagar = lasMiddagar();
    resultat.veckor = lasVeckor();
    return svar(resultat);
  } catch (fel) {
    return svar({ ok: false, fel: String(fel) });
  } finally {
    las.releaseLock();
  }
}

function svar(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/* ------------------------------------------------------------------- blad */

/** Hämtar ett blad och skapar det med rubrikrad om det saknas. */
function blad(namn, kolumner) {
  var ark = SpreadsheetApp.getActiveSpreadsheet();
  var b = ark.getSheetByName(namn);
  if (b) return b;

  // Middagsbladet kommer från CSV-importen och heter något annat från början
  if (namn === BLAD_MIDDAGAR) {
    var forsta = ark.getSheets()[0];
    if (forsta.getRange(1, 1).getValue() === 'id') {
      forsta.setName(namn);
      forsta.setFrozenRows(1);
      return forsta;
    }
  }
  b = ark.insertSheet(namn);
  b.getRange(1, 1, 1, kolumner.length).setValues([kolumner]).setFontWeight('bold');
  b.setFrozenRows(1);
  return b;
}

function rader(b) {
  var sista = b.getLastRow();
  if (sista < 2) return [];
  return b.getRange(2, 1, sista - 1, b.getLastColumn()).getValues();
}

/* --------------------------------------------------------------- middagar */

function lasMiddagar() {
  return rader(blad(BLAD_MIDDAGAR, MIDDAGSKOLUMNER))
    .filter(function (r) { return String(r[0]).trim(); })
    .map(function (r) {
      var tid = parseInt(r[2], 10);
      return {
        id: String(r[0]).trim(),
        namn: String(r[1]).trim(),
        tid: isNaN(tid) ? null : tid,
        veg: /^(ja|sant|true|x|1)$/i.test(String(r[3]).trim()),
        lank: String(r[4]).trim(),
        anteckning: String(r[5]).trim(),
        kalla: String(r[6]).trim(),
        taggar: String(r[7]).split(',').map(function (t) { return t.trim(); }).filter(Boolean),
        nr: parseInt(r[8], 10) || null,
        skapad: r[9] instanceof Date ? r[9].toISOString() : String(r[9]).trim()
      };
    });
}

function radFor(m, id) {
  return [id, m.namn || '', m.tid || '', m.veg ? 'ja' : '', m.lank || '', m.anteckning || '',
          m.kalla || '', (m.taggar || []).join(', '), m.nr || '', m.skapad || new Date().toISOString()];
}

function nyMiddag(m) {
  var b = blad(BLAD_MIDDAGAR, MIDDAGSKOLUMNER);
  var id = 'u' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  b.appendRow(radFor(m, id));
  return { id: id };
}

function radnummer(b, id) {
  var lista = rader(b);
  for (var i = 0; i < lista.length; i++) if (String(lista[i][0]).trim() === id) return i + 2;
  return 0;
}

function andraMiddag(id, m) {
  var b = blad(BLAD_MIDDAGAR, MIDDAGSKOLUMNER);
  var rad = radnummer(b, id);
  if (!rad) throw new Error('Hittade ingen middag med id ' + id);
  b.getRange(rad, 1, 1, MIDDAGSKOLUMNER.length).setValues([radFor(m, id)]);
  return { id: id };
}

function taBortMiddag(id) {
  var b = blad(BLAD_MIDDAGAR, MIDDAGSKOLUMNER);
  var rad = radnummer(b, id);
  if (rad) b.deleteRow(rad);
  return { id: id };
}

/* ---------------------------------------------------------------- veckor */

function lasVeckor() {
  var ut = {};
  rader(blad(BLAD_VECKOR, VECKOKOLUMNER)).forEach(function (r) {
    var vecka = String(r[0]).trim();
    if (!vecka) return;
    var dagar = {};
    for (var i = 0; i < 7; i++) {
      var id = String(r[i + 1]).trim();
      if (id) dagar[String(i)] = id;
    }
    ut[vecka] = dagar;
  });
  return ut;
}

function sparaVecka(vecka, dagar) {
  var b = blad(BLAD_VECKOR, VECKOKOLUMNER);
  var rad = radnummer(b, vecka);
  var tom = !dagar || !Object.keys(dagar).length;

  if (tom) {
    if (rad) b.deleteRow(rad);
    return { vecka: vecka };
  }
  var v = [vecka];
  for (var i = 0; i < 7; i++) v.push(dagar[String(i)] || '');
  v.push(new Date().toISOString());

  if (rad) b.getRange(rad, 1, 1, VECKOKOLUMNER.length).setValues([v]);
  else b.appendRow(v);
  return { vecka: vecka };
}
