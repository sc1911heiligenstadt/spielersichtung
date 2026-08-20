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
    version: "1.1",
    groups: [
      {
        title: "Am Handy",
        items: [
          "Die Reiterleiste bricht am Handy jetzt um, statt seitlich aus dem Bild zu laufen. Sichtbar wird das nur, wenn genug Reiter nebeneinanderstehen — dann rutscht die rechte Gruppe in eine zweite Zeile, statt den letzten Reiter hinter den Bildschirmrand zu schieben."
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
          "Liste aller gesichteten Nachwuchsspieler mit Suche und Filtern nach Verein, Position, Status und Zuständigkeit.",
          "Detailformular je Spieler: Person, Stützpunkt, Scouting-Einschätzung, Kontaktverlauf, Probetraining und Wechsel-Entscheidung.",
          "„Sichtung durch“ und „Zuständigkeit“ sind bei einem neuen Spieler mit dem eigenen Namen vorbelegt und bleiben änderbar.",
          "Der Status ergibt sich von selbst aus dem Stand des Vorgangs: neu gesichtet, Kontakt läuft, Probetraining bestätigt, gewechselt oder kein Wechsel.",
          "Das Datum der letzten Bearbeitung setzt die App selbst — es muss nichts nachgetragen werden."
        ]
      },
      {
        title: "Vereinsverzeichnis",
        items: [
          "Kontaktdaten der gescouteten Vereine mit Adresse, Website und mehreren Ansprechpartnern je Verein."
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
          "Eingabefelder sind mindestens 16 Pixel groß, damit der iPhone-Browser beim Antippen nicht ungefragt in die Seite hineinzoomt und verschoben stehen bleibt."
        ]
      },
      {
        title: "Daten & Speicherung",
        items: [
          "Gespeichert wird in der Vereins-Nextcloud über die zentrale Anmeldung der Tools-Übersicht — ein eigenes Passwort braucht es nicht.",
          "Im Kopfbereich steht sichtbar, ob der letzte Stand gespeichert wurde.",
          "Das Speichern startet ohne Verzögerung. Wird die Seite geschlossen, bevor die Bestätigung da ist, geht der Stand trotzdem noch raus — und es kommt eine Rückfrage, falls das einmal nicht mehr möglich ist.",
          "Ändern zwei Geräte gleichzeitig denselben Stand, erkennt die App das und meldet es."
        ]
      }
    ]
  }
];
