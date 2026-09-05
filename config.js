const APP_VERSION = "1.0";

// Konfigurierbarer CSV-Export der Spieler-Liste (siehe initExportPanel/exportSpielerCsv
// in app.js): jedes Feld einzeln per Checkbox an-/abwählbar, gruppiert wie das Spieler-
// Formular (gleiche Sektionstitel). "type" steuert nur die Formatierung des Zellwerts
// (exportFieldValue in app.js) — ohne "type" wird der Rohwert unverändert exportiert.
// Bewusst ohne "id" (interne UUID, keine Tabellenaussage).
const EXPORT_FIELD_GROUPS = [
  {
    title: "Person",
    fields: [
      { key: "nachname", label: "Nachname" },
      { key: "vorname", label: "Vorname" },
      { key: "geschlecht", label: "Geschlecht", type: "geschlecht" },
      { key: "geburtsdatum", label: "Geburtsdatum" },
      { key: "verein", label: "Verein" },
      { key: "position", label: "Position" },
      { key: "trikotnummer", label: "Trikotnummer" },
      { key: "passnummer", label: "Passnummer" }
    ]
  },
  {
    title: "Stützpunkt",
    fields: [
      { key: "stuetzpunktSpieler", label: "Ist Stützpunktspieler", type: "bool" },
      { key: "stuetzpunkt", label: "Stützpunkt" }
    ]
  },
  {
    title: "Scouting",
    fields: [
      { key: "sichtungDurch", label: "Sichtung durch" },
      { key: "bemerkungen", label: "Bemerkungen" }
    ]
  },
  {
    title: "Kontaktverlauf",
    fields: [
      { key: "zustaendigkeit", label: "Zuständigkeit" },
      { key: "kontaktDurchWen", label: "Kontakt durch wen?" },
      { key: "kontaktMitVerein", label: "Kontakt mit Verein" },
      { key: "kontaktMitEltern", label: "Kontakt mit Eltern" },
      { key: "rueckinfoNachEinladung", label: "Rückinfo nach der Einladung" }
    ]
  },
  {
    title: "Probetraining & Entscheidung",
    fields: [
      { key: "probetrainingAm", label: "Probetraining am" },
      { key: "zusageProbetraining", label: "Zusage Probetraining" },
      { key: "wechsel", label: "Wechsel" },
      { key: "letzteBearbeitung", label: "Letzte Bearbeitung", type: "dateonly" }
    ]
  }
];

const APP_CHANGELOG = [
  {
    version: "1.2",
    groups: [
      {
        title: "Nur-Sehen: die Detailansicht geht jetzt wirklich auf",
        items: [
          "Wer nur sehen darf, tippte bisher auf eine Zeile und es passierte nichts. Kein Fenster, keine Meldung, kein Grund. Dabei stand im Info-Reiter, dass diese Rolle die Detailansicht schreibgeschützt sehen darf.",
          "Jetzt öffnet sich das Fenster, alle Felder sind gesperrt, und Speichern, Löschen und die „+ Eintrag“-Knöpfe sind weg. Aus „Abbrechen“ wird „Schließen“.",
          "Dasselbe gilt für das Vereinsverzeichnis samt Ansprechpartnern.",
          "Neu anlegen bleibt Bearbeitern vorbehalten — ein leeres, gesperrtes Formular hilft niemandem.",
          "Am CSV-Export ändert sich nichts: der bleibt bewusst hinter dem Bearbeiten-Recht."
        ]
      }
    ]
  },
  {
    version: "1.1",
    groups: [
      {
        title: "„Ja, zum 01.07.“ zählt jetzt als Wechsel",
        items: [
          "Das Feld „Wechsel“ ist ein Freitextfeld — die Liste „Ja / Nein / Nein (vorerst)“ ist nur ein Vorschlag. Ein Zusatz hinter dem Wort war also immer möglich und üblich.",
          "Die Nein-Seite kam damit klar, die Ja-Seite nicht: „Nein (vorerst)“ galt als Absage, „Ja, zum 01.07.2027“ dagegen zählte gar nicht. Der Spieler stand weiter als laufender Vorgang in der Liste, fehlte im Filter „Gewechselt“ und wurde bei „Probetraining bestätigt“ mitgezählt — die Zeile „N von M“ stimmte dann nicht mehr.",
          "Auffallen konnte das kaum: Die Liste zeigt den Wechsel-Text gar nicht, nur das abgeleitete Abzeichen.",
          "Jetzt zählt jeder Text, der mit „ja“ beginnt, als Wechsel — genauso wie „nein“ schon immer als Absage zählte."
        ]
      }
    ]
  },
  {
    version: "1.0",
    groups: [
      {
        title: "Spieler-Sichtungen",
        items: [
          "Liste aller gesichteten Nachwuchsspieler mit einer Suche über Name und Verein sowie Filtern nach Status, Zuständigkeit und Position.",
          "Detailformular je Spieler: Person, Stützpunkt, Scouting-Einschätzung, Kontaktverlauf, Probetraining und Wechsel-Entscheidung.",
          "„Sichtung durch“ und „Zuständigkeit“ sind bei einem neuen Spieler mit dem eigenen Namen vorbelegt und bleiben änderbar.",
          "Der Status ergibt sich von selbst aus dem Stand des Vorgangs: neu gesichtet, Kontakt läuft, Probetraining bestätigt, gewechselt oder kein Wechsel.",
          "Das Datum der letzten Bearbeitung setzt die App selbst — es muss nichts nachgetragen werden."
        ]
      },
      {
        title: "Vereinsverzeichnis",
        items: [
          "Kontaktdaten der gescouteten Vereine mit Anschrift, Website und mehreren Ansprechpartnern je Verein.",
          "Suche über Vereinsname und Ort."
        ]
      },
      {
        title: "Export",
        items: [
          "CSV-Export der Spielerliste, frei zusammenstellbar: jedes Feld aus Person, Stützpunkt, Scouting, Kontaktverlauf und Entscheidung ist einzeln wählbar.",
          "Der Export übernimmt die gerade eingestellte Suche und Filterung."
        ]
      },
      {
        title: "Wer darf was",
        items: [
          "Sehen: Spielerliste, Detailansicht und Vereinsverzeichnis, schreibgeschützt.",
          "Bearbeiten: Spieler und Vereine anlegen, ändern und löschen. Dazu der CSV-Export.",
          "Der Reiter „Info“ ist für alle sichtbar."
        ]
      },
      {
        title: "Bedienung am Handy",
        items: [
          "Die Ansicht ist für das Handy gebaut und funktioniert dort vollständig.",
          "Die Reiterleiste bricht am Handy um, statt seitlich aus dem Bild zu laufen.",
          "Eingabefelder sind mindestens 16 Pixel groß, damit der iPhone-Browser beim Antippen nicht ungefragt in die Seite hineinzoomt und verschoben stehen bleibt."
        ]
      },
      {
        title: "Daten & Speicherung",
        items: [
          "Gespeichert wird in der Vereins-Nextcloud über die zentrale Anmeldung der Tools-Übersicht — ein eigenes Passwort braucht es nicht.",
          "Im Kopfbereich steht sichtbar, ob der letzte Stand gespeichert wurde.",
          "Das Speichern startet ohne Verzögerung. Wird die Seite geschlossen, bevor die Bestätigung da ist, geht der Stand trotzdem noch raus — und es kommt eine Rückfrage, falls das einmal nicht mehr möglich ist.",
          "Ist noch kein Spieler erfasst, lässt sich ein vorhandener Bestand einmalig aus einer JSON-Datei einlesen.",
          "Fällt die Anmeldung weg, während die App offen ist, wird der Bildschirm geräumt — die Seite selbst und auch der Spieler- und der Verein-Dialog daneben. Es bleibt kein Name und keine Notiz im Browser zurück, und jeder Weg führt auf den Hinweis, sich neu anzumelden.",
          "Ändern zwei Geräte gleichzeitig denselben Stand, erkennt die App das und meldet es."
        ]
      }
    ]
  }
];
