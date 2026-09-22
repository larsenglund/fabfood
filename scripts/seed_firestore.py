#!/usr/bin/env python3
"""Lägger in middagarna från data/middagar.json i Firestore.

Körs en gång när databasen är ny. Använder Firestores REST-API med den
publika API-nyckeln, vilket fungerar så länge firestore.rules tillåter
skrivningar — samma väg som webbsidan går.

    python3 scripts/seed_firestore.py                 # mot riktiga projektet
    python3 scripts/seed_firestore.py --emulator 127.0.0.1:8080
"""
import argparse, json, pathlib, sys, urllib.error, urllib.request

ROT = pathlib.Path(__file__).resolve().parent.parent


def varde(v):
    """Ett Python-värde som Firestores REST-API vill ha det."""
    if v is None:
        return {"nullValue": None}
    if isinstance(v, bool):
        return {"booleanValue": v}
    if isinstance(v, int):
        return {"integerValue": str(v)}
    if isinstance(v, float):
        return {"doubleValue": v}
    if isinstance(v, list):
        return {"arrayValue": {"values": [varde(x) for x in v]}}
    if isinstance(v, dict):
        return {"mapValue": {"fields": {k: varde(x) for k, x in v.items()}}}
    return {"stringValue": str(v)}


def skriv(bas, samling, doc_id, data, nyckel):
    url = f"{bas}/{samling}?documentId={doc_id}"
    if nyckel:
        url += f"&key={nyckel}"
    kropp = json.dumps({"fields": {k: varde(v) for k, v in data.items()}}).encode()
    begaran = urllib.request.Request(url, data=kropp, method="POST",
                                     headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(begaran, timeout=30) as svar:
        return svar.status


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--emulator", help="värd:port till en lokal Firestore")
    args = p.parse_args()

    cfg = json.loads((ROT / "data" / "config.json").read_text()).get("firebase") or {}
    projekt = cfg.get("projectId")
    if args.emulator:
        projekt = projekt or "middagsbanken-test"
        vard = f"http://{args.emulator}"
        nyckel = None
    else:
        if not projekt:
            print("data/config.json saknar firebase.projectId", file=sys.stderr)
            return 1
        vard = "https://firestore.googleapis.com"
        nyckel = cfg.get("apiKey")  # behövs inte, men skadar inte om den finns

    bas = f"{vard}/v1/projects/{projekt}/databases/(default)/documents"
    middagar = json.loads((ROT / "data" / "middagar.json").read_text())

    lagt = 0
    for m in middagar:
        doc = {k: m[k] for k in ("namn", "tid", "veg", "lank", "anteckning", "kalla", "taggar", "nr", "skapad")}
        try:
            skriv(bas, "middagar", m["id"], doc, nyckel)
            lagt += 1
        except urllib.error.HTTPError as fel:
            detalj = fel.read().decode()[:300]
            if fel.code == 409:
                print(f"  {m['id']} fanns redan, hoppar över")
                continue
            print(f"  {m['id']} misslyckades: {fel.code} {detalj}", file=sys.stderr)
            return 1

    print(f"{lagt} middagar inlagda i {projekt}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
