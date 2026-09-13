# Middagsbanken

Webbsida för att bläddra bland middagsförslag, sätta ihop veckans matsedel och lägga in nya
middagar. Alla som öppnar sidan delar samma databas.

**Sidan:** https://larsenglund.github.io/fabfood/
**Databasen:** kalkylarket [Middagsbanken – databas](https://docs.google.com/spreadsheets/d/1pXNF4ee0qg4XlfP6owbHUOEhPAhTh_Aj-ABdiqba_BE/edit) i Google Drive

## Så hänger det ihop

Sidan är en enda statisk HTML-fil på GitHub Pages. Den har ingen egen server — i stället
pratar den med ett Apps Script som ligger på kalkylarket och som fungerar som databas. Det
betyder att middagarna och veckomatsedlarna ligger i kalkylarket, och att du kan redigera dem
antingen på sidan eller direkt i kalkylen. Allt är gratis och kräver inget konto av den som
besöker sidan.

```
  webbläsare  ──fetch──▶  Apps Script (/exec)  ──▶  Google Sheets
 (GitHub Pages)                                     Middagar
                                                    Veckomatsedel
```

Sidan hämtar om databasen var 20:e sekund och när fliken får fokus igen, så andras ändringar
dyker upp av sig själva.

## Innehåll

| Fil | Vad |
| --- | --- |
| `src/app.html` | Sidan — markup, stil och logik i en fil, inga beroenden utöver Google Fonts. Källan att redigera. |
| `index.html` | Byggd av `build.py`. Det är den här filen GitHub Pages serverar. |
| `build.py` | Bygger `index.html`. Kör `python3 build.py` efter varje ändring i `src/app.html`. |
| `apps-script/Middagsbanken.gs` | Databasen: Apps Script som ger kalkylarket ett litet JSON-API. Installationsanvisning finns högst upp i filen. |
| `data/config.json` | Webbadressen till Apps Script-distributionen. |
| `data/middagar.json` | De 76 middagarna från matplaneringskalkylbladet, som de såg ut när databasen sattes upp. Referenskopia. |
| `.github/workflows/pages.yml` | Bygger och publicerar till GitHub Pages vid varje push |

## Komma igång (engångsjobb)

1. **Koppla in databasen.** Öppna `apps-script/Middagsbanken.gs` och följ anvisningen högst
   upp: klistra in skriptet i kalkylarkets Apps Script, distribuera som webbapp med åtkomst
   `Alla`, och kopiera adressen som slutar på `/exec`.
2. **Lägg in adressen.** Skriv in den som `api` i `data/config.json`, committa och pusha.
3. **Slå på GitHub Pages.** Settings → Pages → Source: **GitHub Actions**. Workflowen sköter
   resten vid varje push.

Adressen till Apps Script går också att skicka med i länken för test, utan att röra
`config.json`: `…/fabfood/?api=https://script.google.com/…/exec`.

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

## Datamodell

Kalkylarket har två blad. Skapas automatiskt av skriptet om de saknas.

**Middagar** — en rad per middag:

| id | namn | tid | veg | lank | anteckning | kalla | taggar | nr | skapad |
|----|------|-----|-----|------|------------|-------|--------|----|--------|

`veg` är `ja` eller tomt, `taggar` är kommaseparerade, `tid` är minuter.

**Veckomatsedel** — en rad per vecka:

| vecka | mandag | tisdag | onsdag | torsdag | fredag | lordag | sondag | uppdaterad |
|-------|--------|--------|--------|---------|--------|--------|--------|------------|

`vecka` är på formen `2026-v38` (ISO-år och ISO-veckonummer) och dagkolumnerna innehåller
id:n från Middagar-bladet. En tom vecka tas bort helt.

## Att känna till

Apps Script-adressen ligger i en publik fil på en publik sida. Den som har adressen kan skriva
till kalkylarket. För en middagslista i en familj är det rimligt, men det är värt att veta.
Behövs ett skydd är det enklaste att lägga till en delad kod som skickas med varje anrop och
kontrolleras i skriptet.

## Uppdatera sidan

1. Ändra `src/app.html`
2. Kör `python3 build.py`
3. Commit och push — GitHub Pages byggs om automatiskt
