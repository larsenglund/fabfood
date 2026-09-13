# Middagsbanken

Enkel webbsida för att bläddra bland middagsförslag, sätta ihop en veckomatsedel och
lägga in nya middagar.

- **Publikt på GitHub Pages:** https://larsenglund.github.io/fabfood/ — öppen för alla, inget konto
- **Som Claude Artifact:** https://claude.ai/code/artifact/1b021e0c-0821-408a-9e89-b0186d61e306

Samma sida i båda fallen. Den känner själv av var den kör: som artifact använder den den
delade artifact-databasen, i övrigt sparar den i besökarens egen webbläsare.

## Innehåll

| Fil | Vad |
| --- | --- |
| `src/app.html` | Sidan — markup, stil och logik i en fil, inga beroenden utöver Google Fonts. Källan att redigera. |
| `index.html` | Byggd av `build.py`: `src/app.html` i ett komplett HTML-dokument. Det är den här filen GitHub Pages serverar. |
| `build.py` | Bygger `index.html`. Kör `python3 build.py` efter varje ändring i `src/app.html`. |
| `data/middagar.json` | De 76 middagarna från kalkylbladet. Startdata både för artifact-databasen och för webbläsarversionen. |
| `.github/workflows/pages.yml` | Bygger och publicerar till GitHub Pages vid varje push |

## Så funkar den

**Veckomatsedel.** Vänsterspalten är den valda veckan, måndag till söndag, med ISO-veckonummer
och datum. Klicka på en tom dag för att "sikta" den och välj sedan en middag i listan, eller
använd *Planera* på ett kort och peka ut dagen. `Slumpa resten` fyller tomma dagar,
`Förra veckan` hämtar hem föregående veckas matsedel och `Kopiera` lägger matsedeln som text
i urklipp.

**Middagsförslag.** Högerspalten är hela listan med fritextsök (namn, anteckning, tagg),
sortering på namn, tid eller senast tillagd, och filter för vegetariskt, under 45 minuter,
har recept samt de taggar som härletts ur kolumnen *Källa* i kalkylbladet.

**Nya och ändrade middagar.** `Nytt förslag` öppnar formuläret för namn, tid, veg, receptlänk
och anteckning. Samma formulär används för att ändra eller ta bort en befintlig middag.

**Dela veckan.** `Kopiera text` lägger matsedeln som text i urklipp. `Dela länk` packar veckan
i själva länken — den som öppnar den får en ruta högst upp med veckans middagar och kan lägga
in dem i sin egen matsedel. Middagar matchas på namn, och de som saknas läggs till i listan.

## Var datan hamnar

Sidan har två lägen och väljer själv vid start:

**Som Claude Artifact** används artifact-databasen (`capabilities: {db: {}}`), delad i realtid
mellan alla som öppnar sidan:

- `meals/<id>` — en middag: `namn`, `tid`, `veg`, `lank`, `anteckning`, `kalla`, `taggar`, `nr`, `skapad`
- `plans/<år>-v<vecka>` — en veckas matsedel: `vecka`, `uppdaterad` och `dagar` med nycklarna
  `"0"`–`"6"` (måndag–söndag) som pekar på ett `meals`-id

**På GitHub Pages** finns ingen server. Startlistan hämtas från `data/middagar.json` och
ändringar sparas i besökarens egen webbläsare under nycklarna `middagsbanken.middagar` och
`middagsbanken.veckor`. Varje besökare har alltså sin egen kopia — det är därför veckan delas
via länk i stället. Vill man ha en gemensam lista för hela hushållet krävs en riktig databas,
till exempel Supabase eller Firebase, vilket i sin tur kräver ett konto och API-nycklar.

## Uppdatera sidan

1. Ändra `src/app.html`
2. Kör `python3 build.py`
3. Commit och push — GitHub Pages byggs om automatiskt

Artifact-versionen publiceras om separat från `src/app.html` till samma URL. Startdatan i
`data/middagar.json` behöver bara laddas in i artifact-databasen en gång; den ligger redan där.
