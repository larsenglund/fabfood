# Middagsbanken

Enkel webbsida för att bläddra bland middagsförslag, sätta ihop en veckomatsedel och
lägga in nya middagar. Publicerad som en Claude Artifact:

https://claude.ai/code/artifact/1b021e0c-0821-408a-9e89-b0186d61e306

## Innehåll

| Fil | Vad |
| --- | --- |
| `index.html` | Hela sidan — markup, stil och logik i en fil, inga beroenden utöver Google Fonts |
| `data/middagar.json` | De 76 middagarna från kalkylbladet, använda som startdata i databasen |

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

## Datamodell

Sidan använder artifact-databasen (`capabilities: {db: {}}`), som är realtidsuppdaterad
och delad mellan alla som öppnar sidan.

- `meals/<id>` — en middag: `namn`, `tid`, `veg`, `lank`, `anteckning`, `kalla`, `taggar`, `nr`, `skapad`
- `plans/<år>-v<vecka>` — en veckas matsedel: `vecka`, `uppdaterad` och `dagar` med nycklarna
  `"0"`–`"6"` (måndag–söndag) som pekar på ett `meals`-id

## Uppdatera sidan

Ändra `index.html` och publicera om till samma URL med Artifact-verktyget. Startdatan i
`data/middagar.json` behöver bara laddas in en gång — den ligger redan i databasen.
