# 🔍 Spielersichtung

Der Scouting-Tracker: welche Spieler beobachtet wurden, aus welchem Verein sie
kommen und wie weit der Kontakt gediehen ist. Die App hält den Vorgang fest —
von der ersten Beobachtung über das Gespräch mit Verein und Eltern bis zum
Probetraining und der Rückmeldung danach.

**➡️ [Spielersichtung öffnen](https://sc1911heiligenstadt.github.io/spielersichtung/)**

## Was drin ist

| Reiter | Wofür |
|---|---|
| **Spieler** | Die beobachteten Spieler mit ihrem Stand — Suche über Name und Verein, Filter nach Status, Zuständigkeit und Position, dazu der CSV-Export |
| **Vereine** | Die Vereine, aus denen sie kommen — durchsuchbar nach Name und Ort |
| **Info** | Was die App tut, die Änderungen und der Datenschutz-Hinweis |

## Was zu einem Spieler festgehalten wird

Name, **Geburtsdatum**, **Geschlecht**, **Verein**, **Position**,
**Trikotnummer** und **Passnummer**, dazu ob der Spieler **Stützpunktspieler**
ist und an welchem Stützpunkt. Für das Scouting: **Sichtung durch** und
**Bemerkungen**. Dazu der Verlauf des Kontakts: **Zuständigkeit**, **Kontakt
durch wen?**, **Kontakt mit Verein**, **Kontakt mit Eltern** und die **Rückinfo
nach der Einladung** — und schließlich **Probetraining am**, **Zusage
Probetraining** und **Wechsel**. Jeder Eintrag trägt, wann er zuletzt bearbeitet
wurde; dieses Datum setzt die App selbst.

Der **Status** ergibt sich daraus von allein: neu gesichtet, Kontakt läuft,
Probetraining bestätigt, gewechselt oder kein Wechsel.

Die Anschrift — Straße, PLZ und Ort — steht beim **Verein**, nicht beim Spieler.

## CSV-Export

Die Spielerliste lässt sich als CSV herausgeben, frei zusammenstellbar: jedes
Feld ist einzeln an- und abwählbar. Der Export übernimmt die gerade eingestellte
Suche und Filterung — was auf dem Bildschirm steht, steht auch in der Datei.

## Sensible Daten

Hier stehen personenbezogene Daten von Spielern, oft **Minderjährigen**, die
noch bei einem anderen Verein spielen. Entsprechend gilt:

- Die Sichtbarkeit dieses Werkzeugs ist eng gesteckt und wird in der
  Tools-Übersicht einzeln vergeben.
- Im Repo stehen **keine** dieser Daten — sie liegen ausschließlich in der
  Vereins-Nextcloud.
- Ein Eintrag ist ein Arbeitsstand, kein Archiv: was nicht mehr gebraucht wird,
  gehört gelöscht.

## Zugang

Die Anmeldung läuft über die [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) — dort einmal anmelden, danach ist dieses Werkzeug offen.

Die Rechte gelten in zwei Stufen: **Sehen** (Spielerliste, Detailansicht und
Vereinsverzeichnis, schreibgeschützt) und **Bearbeiten** (Spieler und Vereine
anlegen, ändern und löschen — dazu der CSV-Export). Wer welche Stufe hat, legt
die Tools-Übersicht fest. Der Reiter *Info* ist für alle sichtbar.

Fällt die Anmeldung weg, während die App offen ist, wird der Bildschirm geräumt
— die Seite und auch die Dialoge daneben. Es bleibt kein Name im Browser
zurück.

## Lokal starten

Über den Eintrag `spielersichtung` in `E:\.claude\launch.json` — der Server läuft dann auf `http://localhost:8779/`.

## Technik

Vanilla JavaScript ohne Build-Schritt — die Dateien werden so ausgeliefert, wie sie im Repo liegen. Veröffentlicht über GitHub Pages. Die Daten liegen in der Vereins-Nextcloud; der Zugriff läuft ausschließlich über den Login-Worker der Tools-Übersicht, nie mit Zugangsdaten im Browser.

---

Ein Werkzeug des 1. SC 1911 Heiligenstadt. Alle Werkzeuge auf einen Blick: [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) · Erklärungen im [Toolbox Wiki](https://sc1911heiligenstadt.github.io/Vereinswiki/).
