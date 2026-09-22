# Middagsbanken

Webbsida för att bläddra bland middagsförslag, sätta ihop veckans matsedel och lägga in nya
middagar. Alla som öppnar sidan delar samma databas.

**Sidan:** https://larsenglund.github.io/fabfood/
**Databasen:** Firestore i Firebase-projektet `fabfood`

## Så hänger det ihop

Sidan är en enda statisk HTML-fil på GitHub Pages. Den har ingen egen server — i stället
pratar den direkt med Firestore, som sköter både lagringen och utskicket av ändringar. Den
som besöker sidan behöver inget konto.

```
  webbläsare  ◀──realtid──▶  Firestore
 (GitHub Pages)              middagar/
                             veckor/
```

Firestore skickar ändringar vidare till alla öppna sidor direkt, så det någon annan gör dyker
upp med en gång utan omladdning. En skrivning tar omkring 200 ms.

Projekt-id:t i `data/config.json` är avsett att vara publikt — det pekar bara ut projektet.
Vad som får läsas och skrivas bestäms av `firestore.rules`.

## Innehåll

| Fil | Vad |
| --- | --- |
| `src/app.html` | Sidan — markup, stil och logik i en fil, inga beroenden utöver Google Fonts. Källan att redigera. |
| `index.html` | Byggd av `build.py`. Det är den här filen GitHub Pages serverar. |
| `build.py` | Bygger `index.html`. Kör `python3 build.py` efter varje ändring i `src/app.html`. |
| `firestore.rules` | Säkerhetsreglerna: vilka samlingar som finns och hur ett giltigt dokument ser ut. |
| `firebase.json` | Pekar ut reglerna, och portar för den lokala emulatorn. |
| `scripts/seed_firestore.py` | Lägger in de 76 middagarna i en ny databas. Körs en gång. |
| `data/config.json` | Firebase-projektets id. Inget mer behövs. |
| `data/middagar.json` | De 76 middagarna från matplaneringskalkylbladet. Startdata och referenskopia. |
| `.github/workflows/pages.yml` | Bygger och publicerar till GitHub Pages vid varje push |

## Sätta upp databasen (engångsjobb)

1. **Skapa databasen.** Firebase-konsolen → projektet `fabfood` → vänsterpanelen
   **Databases & Storage → Firestore** → **Create database** → välj plats (`eur3` eller
   `europe-north1`) → **Test mode** → **Create**.
2. **Lägg in reglerna.** Klistra in hela `firestore.rules` → **Publish**. Regelsidan ligger på
   https://console.firebase.google.com/u/0/project/fabfood-794ec/firestore/databases/-default-/security/rules
   Viktigt: test mode slutar gälla efter 30 dagar, reglerna i filen gäller tills vidare.
3. **Fyll på med middagarna.** `python3 scripts/seed_firestore.py`

Ingen API-nyckel och ingen app-registrering behövs. Firestore når man med enbart projektets
id, så `data/config.json` innehåller bara det.

GitHub Pages slås på under Settings → Pages → Source: **GitHub Actions**. Workflowen sköter
resten vid varje push.

## Utveckla mot en lokal databas

```
npx firebase emulators:start --only firestore --project fabfood
python3 scripts/seed_firestore.py --emulator 127.0.0.1:8080
```

Öppna sedan sidan med `?emulator=127.0.0.1:8080` så går den mot emulatorn i stället för mot
det riktiga projektet.

## Använda sidan

**Veckomatsedeln** till vänster visar vald vecka med ISO-veckonummer och datum. Klicka på en
tom dag för att sikta den och välj sedan en middag i listan, eller tryck *Planera* på ett kort
och peka ut dagen. `Slumpa resten` fyller tomma dagar, `Förra veckan` hämtar hem föregående
veckas matsedel och `Kopiera text` lägger matsedeln i urklipp. Pilarna bläddrar mellan veckor.

**Middagsförslagen** till höger har fritextsök på namn, anteckning och tagg, sortering på namn,
tid eller senast tillagd, och filter för vegetariskt, under 45 minuter, har recept samt de
taggar som härletts ur kolumnen *Källa* i det ursprungliga kalkylbladet.

**Nytt förslag** lägger in en middag med namn, tid, veg, receptlänk och anteckning. *Ändra* på
ett kort öppnar samma formulär för att redigera eller ta bort.

**Betyg.** Varje middag har fem stjärnor. Klicka på en stjärna för att sätta betyget, klicka på
samma stjärna igen för att ta bort det. Betyget sparas direkt och delas av alla — det finns
ingen inloggning, så det är hushållets gemensamma omdöme, inte ett betyg per person. Betyget
går också att sätta i formuläret, syns i veckovyn, går att sortera på och har ett eget filter
för favoriter med fyra eller fem stjärnor.

## Datamodell

Två samlingar.

**`middagar/{id}`** — ett middagsförslag:

| fält | typ | |
|------|-----|--|
| `namn` | sträng | krävs, 1–200 tecken |
| `tid` | tal eller null | minuter |
| `veg` | boolesk | |
| `lank` | sträng | receptlänk, kan vara tom |
| `anteckning` | sträng | max 1000 tecken |
| `kalla` | sträng | var förslaget kommer ifrån |
| `taggar` | lista | max 10 |
| `nr` | tal eller null | ordningsnummer i det ursprungliga kalkylbladet |
| `skapad` | sträng | ISO-tid |
| `betyg` | heltal 1–5 eller null | saknas på middagar som aldrig betygsatts |

**`veckor/{år}-v{vecka}`** — en veckas matsedel, t.ex. `veckor/2026-v38`:

| fält | typ | |
|------|-----|--|
| `vecka` | sträng | samma som dokument-id |
| `dagar` | map | nycklarna `"0"`–`"6"` (måndag–söndag) med id från `middagar` |
| `uppdaterad` | sträng | ISO-tid |

En tom vecka tas bort helt.

## Att känna till

Sidan har ingen inloggning, så reglerna begränsar inte vem som skriver utan vad som skrivs:
bara de två samlingarna, och bara dokument som håller sig till formen. Kända fält kontrolleras
när de finns, medan okända fält tillåts upp till 25 nycklar — det gör att nya funktioner kan
läggas till utan att reglerna behöver publiceras om i konsolen. Det
hindrar att databasen används till något annat, men den som hittar sidan kan ändra
middagslistan. För en familjs middagar är det rimligt. Behövs mer går det att slå på anonym
inloggning i Firebase och kräva `request.auth != null` i reglerna — det stoppar automatiserat
klotter utan att någon behöver logga in.

## Uppdatera sidan

1. Ändra `src/app.html`
2. Kör `python3 build.py`
3. Commit och push — GitHub Pages byggs om automatiskt
