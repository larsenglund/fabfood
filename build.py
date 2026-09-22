#!/usr/bin/env python3
"""Bygger index.html för GitHub Pages från src/app.html.

src/app.html innehåller sidans titel, stil, markup och skript, men inget
<!doctype>, <html>, <head> eller <body>. Den här filen lägger på det skalet
och skriver resultatet till index.html, som är det Pages serverar.

Uppdelningen kommer från att sidan en gång också publicerades som en Claude
Artifact, där skalet lades på automatiskt. Den versionen är borttagen, så
uppdelningen fyller numera bara funktionen att hålla den byggda filen skild
från källan. Vill man förenkla går det att flytta skalet in i src/app.html,
döpa om den till index.html och ta bort den här filen och byggsteget i
.github/workflows/pages.yml.
"""
import pathlib

ROT = pathlib.Path(__file__).parent
SKAL = """<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="description" content="Middagsförslag och veckomatsedel för hemmabruk.">
<meta name="color-scheme" content="light dark">
<style>
  body {{ margin:0; font:14px/1.5 system-ui, sans-serif; }}
  img {{ max-width:100%; }}
  [hidden] {{ display:none !important; }}
</style>
{innehall}</html>
"""

def main() -> None:
    app = (ROT / "src" / "app.html").read_text(encoding="utf-8")
    # <title> och <link> hör hemma i <head>, resten i <body>
    brytpunkt = app.index("<style>")
    huvud, kropp = app[:brytpunkt], app[brytpunkt:]
    ut = SKAL.format(innehall=huvud + "</head>\n<body>\n" + kropp + "</body>\n")
    (ROT / "index.html").write_text(ut, encoding="utf-8")
    print(f"index.html byggd: {len(ut)} tecken")

if __name__ == "__main__":
    main()
