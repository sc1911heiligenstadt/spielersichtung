# 🔍 Spielersichtung

Der Scouting-Tracker: welche Spieler beobachtet wurden, aus welchem Verein sie
kommen und wie weit der Kontakt gediehen ist. Die App hält den Vorgang fest —
von der ersten Beobachtung über das Gespräch mit Verein und Eltern bis zum
Probetraining und der Rückmeldung danach.

**➡️ [Spielersichtung öffnen](https://sc1911heiligenstadt.github.io/spielersichtung/)**

## Was drin ist

| Reiter | Wofür |
|---|---|
| **Spieler** | Die beobachteten Spieler mit ihrem Stand |
| **Vereine** | Die Vereine, aus denen sie kommen — durchsuchbar nach Name und Ort |

## Was zu einem Spieler festgehalten wird

Name, **Geburtsdatum**, **Geschlecht**, **PLZ** und **Ort**, **Passnummer**,
**Position** und **Bemerkungen**. Dazu der Verlauf des Kontakts: **Kontakt durch
wen?**, **Kontakt mit Verein**, **Kontakt mit Eltern**, **Probetraining am** und
die **Rückinfo nach der Einladung**. Jeder Eintrag trägt, wann er zuletzt
bearbeitet wurde.

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

Die Rechte gelten in drei Stufen: **Sehen** (Einträge ansehen), **Bearbeiten**
(Spieler und Vereine pflegen) und **Administrieren**. Wer welche Stufe hat,
legt die Tools-Übersicht fest.

## Lokal starten

Über den Eintrag `spielersichtung` in `E:\.claude\launch.json` — der Server läuft dann auf `http://localhost:8779/`.

## Technik

Vanilla JavaScript ohne Build-Schritt — die Dateien werden so ausgeliefert, wie sie im Repo liegen. Veröffentlicht über GitHub Pages. Die Daten liegen in der Vereins-Nextcloud; der Zugriff läuft ausschließlich über den Login-Worker der Tools-Übersicht, nie mit Zugangsdaten im Browser.

---

Ein Werkzeug des 1. SC 1911 Heiligenstadt. Alle Werkzeuge auf einen Blick: [Tools-Übersicht](https://sc1911heiligenstadt.github.io/ToolsUebersicht/) · Erklärungen im [Toolbox Wiki](https://sc1911heiligenstadt.github.io/Vereinswiki/).
