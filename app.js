// ---------- Helpers ----------
function uuid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0, v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Lokales Datum (nicht toISOString/UTC), sonst verschiebt sich das Datum
// zwischen Mitternacht und ~02:00 deutscher Zeit auf den Vortag.
function todayIso() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function isoToDisplay(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso || "";
  const [y, m, d] = iso.split("-");
  return `${d}.${m}.${y}`;
}

function todayDisplay() { return isoToDisplay(todayIso()); }

function distinctValues(list, field) {
  return [...new Set(list.map((x) => (x[field] || "").trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de"));
}

// ---------- State ----------
let appData = { players: [], clubs: [] };
let currentUser = null;
function canEdit() { return !!(currentUser && (currentUser.isAdmin || currentUser.canEdit)); }
let editingPlayerId = null;
let editingClubId = null;
// True, sobald eine Änderung noch nicht bestätigt in Nextcloud liegt — egal ob der
// Schreibvorgang noch aussteht, gerade läuft oder fehlgeschlagen ist. Steuert die
// Rückfrage beim Verlassen der Seite (beforeunload in setupListeners).
let ungespeicherteAenderungen = false;
let letzterSaveFehlgeschlagen = false;

const PLAYER_FIELDS = [
  "nachname", "vorname", "geschlecht", "geburtsdatum", "verein", "position", "trikotnummer", "passnummer",
  "stuetzpunktSpieler", "stuetzpunkt", "sichtungDurch", "bemerkungen", "zustaendigkeit", "kontaktDurchWen",
  "kontaktMitVerein", "kontaktMitEltern", "rueckinfoNachEinladung", "probetrainingAm", "zusageProbetraining", "wechsel"
];

// ---------- Status ----------
function computeStatus(p) {
  const wechsel = (p.wechsel || "").trim().toLowerCase();
  const zusage = (p.zusageProbetraining || "").trim().toLowerCase();
  // ⚠️ Beide Zweige gleich tolerant (Bugfix 2026-09-05). Vorher war die
  // Nein-Seite tolerant (startsWith) und die Ja-Seite exakt (===) -- pf-wechsel
  // ist aber ein Freitextfeld mit bloßer Vorschlagsliste, kein <select>. Ein
  // Eintrag "Ja, zum 01.07.2027" fiel dadurch durch BEIDE Zweige und landete
  // wieder bei "Probetraining bestätigt"/"Kontakt läuft": der Spieler sah aus
  // wie ein laufender Vorgang, obwohl er längst gewechselt war, fehlte im
  // Filter "Gewechselt" und verfälschte die Zählung "N von M".
  // Reihenfolge beibehalten: "ja" zuerst, sonst schlägt bei einem Text wie
  // "ja, nein doch nicht" der falsche Zweig zu.
  if (wechsel.startsWith("ja")) return { key: "gewechselt", label: "✅ Gewechselt" };
  if (wechsel.startsWith("nein")) return { key: "abgesagt", label: "❌ Kein Wechsel" };
  if (zusage === "ja") return { key: "probetraining", label: "🏃 Probetraining bestätigt" };
  const hatKontakt = [p.kontaktMitVerein, p.kontaktMitEltern, p.kontaktDurchWen].some((v) => (v || "").trim() !== "");
  if (hatKontakt) return { key: "kontakt", label: "📞 Kontakt läuft" };
  return { key: "neu", label: "🆕 Neu gesichtet" };
}

// ---------- Datalisten & Filter-Optionen ----------
function fillSelectOptions(selectId, values, allLabel) {
  const el = document.getElementById(selectId);
  const current = el.value;
  el.innerHTML = `<option value="">${allLabel}</option>` + values.map((v) => `<option value="${escapeHtml(v)}">${escapeHtml(v)}</option>`).join("");
  if (values.includes(current)) el.value = current;
}

function fillDatalist(id, values) {
  document.getElementById(id).innerHTML = values.map((v) => `<option value="${escapeHtml(v)}"></option>`).join("");
}

function populateSpielerFilterOptions() {
  fillSelectOptions("filter-zustaendigkeit", distinctValues(appData.players, "zustaendigkeit"), "Alle Zuständigen");
  fillSelectOptions("filter-position", distinctValues(appData.players, "position"), "Alle Positionen");
}

function populateDatalists() {
  const vereine = new Set([...appData.clubs.map((c) => c.name), ...appData.players.map((p) => p.verein)].map((v) => (v || "").trim()).filter(Boolean));
  fillDatalist("dl-vereine", [...vereine].sort((a, b) => a.localeCompare(b, "de")));
  fillDatalist("dl-positionen", distinctValues(appData.players, "position"));
  fillDatalist("dl-stuetzpunkte", distinctValues(appData.players, "stuetzpunkt"));
  fillDatalist("dl-personen", distinctValues(appData.players, "sichtungDurch"));
  fillDatalist("dl-zustaendigkeit", distinctValues(appData.players, "zustaendigkeit"));
}

// ---------- Spieler-Liste ----------
function playerRowHtml(p) {
  const status = computeStatus(p);
  const flag = p.stuetzpunktSpieler ? `<span class="stuetzpunkt-flag" title="Stützpunktspieler">★ ${escapeHtml(p.stuetzpunkt || "")}</span>` : "";
  return `
    <div class="list-row" data-id="${escapeHtml(p.id)}">
      <div>
        <div class="lr-name">${escapeHtml(p.nachname)}${p.vorname ? ", " + escapeHtml(p.vorname) : ""}</div>
        <div class="lr-sub">${escapeHtml(p.geburtsdatum || "")}</div>
      </div>
      <div>
        <div>${escapeHtml(p.verein || "—")}</div>
        ${flag ? `<div class="lr-sub">${flag}</div>` : ""}
      </div>
      <div>${escapeHtml(p.position || "—")}</div>
      <div><span class="status-badge status-${status.key}">${status.label}</span></div>
      <div>${escapeHtml(p.zustaendigkeit || "—")}</div>
      <div class="lr-sub">${escapeHtml(isoToDisplay(p.letzteBearbeitung))}</div>
    </div>`;
}

function filteredSpieler() {
  const q = (document.getElementById("spieler-search").value || "").trim().toLowerCase();
  const statusF = document.getElementById("filter-status").value;
  const zustF = document.getElementById("filter-zustaendigkeit").value;
  const posF = document.getElementById("filter-position").value;
  let list = appData.players.filter((p) => {
    if (q && !`${p.nachname} ${p.vorname} ${p.verein}`.toLowerCase().includes(q)) return false;
    if (statusF && computeStatus(p).key !== statusF) return false;
    if (zustF && (p.zustaendigkeit || "") !== zustF) return false;
    if (posF && (p.position || "") !== posF) return false;
    return true;
  });
  list.sort((a, b) => {
    const da = a.letzteBearbeitung || "", db = b.letzteBearbeitung || "";
    if (da !== db) return da < db ? 1 : -1; // neueste Bearbeitung zuerst
    return a.nachname.localeCompare(b.nachname, "de");
  });
  return list;
}

function renderSpielerListe() {
  populateSpielerFilterOptions();
  const list = filteredSpieler();
  document.getElementById("spieler-list").innerHTML = list.map(playerRowHtml).join("");
  document.getElementById("spieler-count").textContent = `${list.length} von ${appData.players.length}`;
  document.getElementById("spieler-empty").classList.toggle("hidden", list.length > 0);
  document.getElementById("import-banner").classList.toggle("hidden", appData.players.length > 0);
  updateExportInfoLine();
}

// ---------- CSV-Export (konfigurierbar) ----------
// Jedes Feld einzeln per Checkbox wählbar (EXPORT_FIELD_GROUPS in config.js).
// Exportiert immer genau die aktuell gefilterte/gesuchte Liste (filteredSpieler()).
function initExportPanel() {
  renderExportFieldCheckboxes();
  document.getElementById("btn-export-toggle").addEventListener("click", () => {
    const panel = document.getElementById("export-panel");
    const willOpen = panel.style.display === "none";
    panel.style.display = willOpen ? "" : "none";
    if (willOpen) updateExportInfoLine();
  });
  document.getElementById("btn-export-felder-alle").addEventListener("click", () => setAllExportCheckboxes(true));
  document.getElementById("btn-export-felder-keine").addEventListener("click", () => setAllExportCheckboxes(false));
  document.getElementById("btn-export-csv").addEventListener("click", exportSpielerCsv);
}
function renderExportFieldCheckboxes() {
  const wrap = document.getElementById("export-field-groups");
  wrap.innerHTML = EXPORT_FIELD_GROUPS.map((group) => `
    <div class="form-section-title">${escapeHtml(group.title)}</div>
    <div class="form-grid">
      ${group.fields.map((f) => `
        <label class="checkbox-label"><input type="checkbox" class="export-field-cb" data-field="${escapeHtml(f.key)}" checked /> ${escapeHtml(f.label)}</label>
      `).join("")}
    </div>
  `).join("");
  wrap.querySelectorAll(".export-field-cb").forEach((cb) => cb.addEventListener("change", updateExportInfoLine));
}
function setAllExportCheckboxes(checked) {
  document.querySelectorAll(".export-field-cb").forEach((cb) => { cb.checked = checked; });
  updateExportInfoLine();
}
function updateExportInfoLine() {
  const el = document.getElementById("export-info-line");
  if (!el) return;
  const total = document.querySelectorAll(".export-field-cb").length;
  const checked = document.querySelectorAll(".export-field-cb:checked").length;
  const rowCount = appData.players ? filteredSpieler().length : 0;
  el.textContent = `${checked} von ${total} Feldern ausgewählt · exportiert ${rowCount} Spieler (aktuelle Filterung/Suche).`;
}
function csvCell(value) {
  const s = value == null ? "" : String(value);
  return /[;"\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
function exportFieldValue(f, p) {
  const v = p[f.key];
  switch (f.type) {
    case "dateonly": return v ? isoToDisplay(v) : "";
    case "bool": return v ? "Ja" : "Nein";
    case "geschlecht": return v === "m" ? "männlich" : v === "w" ? "weiblich" : "";
    default: return v == null ? "" : v;
  }
}
function exportSpielerCsv() {
  const selectedKeys = Array.from(document.querySelectorAll(".export-field-cb:checked")).map((cb) => cb.dataset.field);
  if (!selectedKeys.length) { alert("Bitte mindestens ein Feld für den Export auswählen."); return; }
  const rows = filteredSpieler();
  if (!rows.length) { alert("Die aktuelle Filterung/Suche ergibt keine Treffer zum Exportieren."); return; }

  const fieldLookup = new Map(EXPORT_FIELD_GROUPS.flatMap((g) => g.fields).map((f) => [f.key, f]));
  const cols = selectedKeys.map((key) => fieldLookup.get(key)).filter(Boolean);
  const lines = [cols.map((f) => f.label), ...rows.map((p) => cols.map((c) => exportFieldValue(c, p)))];
  // Semikolon statt Komma + UTF-8-BOM: deutsches Excel erkennt das Trennzeichen
  // damit automatisch beim Doppelklick und zeigt Umlaute korrekt.
  const csv = String.fromCharCode(0xFEFF) + lines.map((line) => line.map(csvCell).join(";")).join("\r\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "spielersichtung_export_" + new Date().toISOString().slice(0, 10) + ".csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

// ---------- Vereins-Liste ----------
function clubRowHtml(c) {
  const primary = c.kontakte && c.kontakte[0];
  const primaryLabel = primary ? (primary.name || primary.email || primary.telefon || "") : "";
  return `
    <div class="club-list-row" data-id="${escapeHtml(c.id)}">
      <div class="lr-name">${escapeHtml(c.name)}</div>
      <div class="lr-sub">${escapeHtml(c.ort || "—")}</div>
      <div class="lr-sub">${escapeHtml(primaryLabel || "—")}</div>
      <div class="lr-sub">${(c.kontakte || []).length} Ansprechpartner</div>
    </div>`;
}

function filteredVereine() {
  const q = (document.getElementById("verein-search").value || "").trim().toLowerCase();
  let list = appData.clubs.filter((c) => !q || `${c.name} ${c.ort || ""}`.toLowerCase().includes(q));
  list.sort((a, b) => a.name.localeCompare(b.name, "de"));
  return list;
}

function renderVereinListe() {
  const list = filteredVereine();
  document.getElementById("verein-list").innerHTML = list.map(clubRowHtml).join("");
  document.getElementById("verein-count").textContent = `${list.length} von ${appData.clubs.length}`;
  document.getElementById("verein-empty").classList.toggle("hidden", list.length > 0);
}

// ---------- Version / Changelog / Nutzer ----------
function renderVersionInfo() {
  document.querySelectorAll("#version-badge, #version-badge-2").forEach((el) => { if (el) el.textContent = "v" + APP_VERSION; });
  const list = document.getElementById("changelog-list");
  if (!list) return;
  list.innerHTML = APP_CHANGELOG.map((entry) => `
    <div class="changelog-entry">
      <div class="cv">Version ${escapeHtml(entry.version)}</div>
      ${entry.groups.map((g) => `
        <div class="changelog-group">
          <div class="cg-title">${escapeHtml(g.title)}</div>
          <ul class="cg-items">${g.items.map((i) => `<li>${escapeHtml(i)}</li>`).join("")}</ul>
        </div>`).join("")}
    </div>`).join("");
}

function renderHeaderUser() {
  const el = document.getElementById("header-user");
  const el2 = document.getElementById("einstellungen-user");
  if (!currentUser) { if (el) el.textContent = ""; if (el2) el2.textContent = ""; return; }
  const name = (currentUser.vorname || currentUser.nachname)
    ? `${currentUser.vorname || ""} ${currentUser.nachname || ""}`.trim()
    : currentUser.username;
  if (el) el.textContent = "👤 " + name;
  if (el2) el2.textContent = "Angemeldet als " + name;
}

function renderAll() {
  if (bildschirmGeraeumt) return;
  populateDatalists();
  renderSpielerListe();
  renderVereinListe();
  renderVersionInfo();
}

// ---------- Spieler-Formular ----------
// Sperrt/entsperrt das Spieler-Formular für die Nur-Sehen-Rolle.
// ⚠️ "Sehen" heißt schreibgeschützt, nicht "reagiert gar nicht" (Bugfix
// 2026-09-05): openSpielerModal stieg für Nur-Seher in der ersten Zeile aus.
// Die Liste wurde trotzdem für alle gerendert, jede Zeile blieb anklickbar --
// ein Nur-Seher tippte auf einen Spieler und es passierte NICHTS: kein Dialog,
// keine Meldung, kein Grund. Der Info-Reiter versprach dieser Rolle aber
// ausdrücklich "Spielerliste, Detailansicht und Vereinsverzeichnis,
// schreibgeschützt". Muster übernommen aus abwesenheitskalender/app.js
// (openTerminModalReadOnly + setFormDisabled).
function setSpielerFormDisabled(disabled) {
  PLAYER_FIELDS.forEach((f) => {
    const el = document.getElementById("pf-" + f);
    if (el) el.disabled = disabled;
  });
  // Die "+ Eintrag"-Knöpfe schreiben direkt in die Textfelder — sie müssen mit
  // weg, sonst wäre der Save-Knopf zwar fort, das Feld aber weiter befüllbar.
  document.querySelectorAll("#spieler-form [data-append]").forEach((b) => b.classList.toggle("hidden", disabled));
  document.getElementById("btn-save-spieler").classList.toggle("hidden", disabled);
  document.getElementById("btn-cancel-spieler").textContent = disabled ? "Schließen" : "Abbrechen";
}

function openSpielerModal(id) {
  // Neu anlegen bleibt Bearbeitern vorbehalten (der Knopf ist für Nur-Seher
  // ohnehin ausgeblendet) -- ein leeres, gesperrtes Formular wäre sinnlos.
  if (!id && !canEdit()) return;
  const nurLesen = !canEdit();
  editingPlayerId = id || null;
  const isNew = !id;
  const player = isNew ? null : appData.players.find((p) => p.id === id);
  document.getElementById("spieler-modal-title").textContent = isNew ? "Neuer Spieler" : `${player.nachname}${player.vorname ? ", " + player.vorname : ""}`;
  document.getElementById("btn-delete-spieler").classList.toggle("hidden", isNew || nurLesen);
  // Bei einem neuen Eintrag "Sichtung durch"/"Zuständigkeit" mit dem eingeloggten
  // Nutzer vorbelegen (wer die Sichtung tatsächlich einträgt), statt leer zu lassen —
  // bleibt editierbar, falls im Namen einer anderen Person erfasst wird.
  const eigenerName = currentUser ? `${currentUser.vorname || ""} ${currentUser.nachname || ""}`.trim() || currentUser.username : "";
  PLAYER_FIELDS.forEach((f) => {
    const el = document.getElementById("pf-" + f);
    if (!el) return;
    if (el.type === "checkbox") el.checked = player ? !!player[f] : false;
    else if (isNew && (f === "sichtungDurch" || f === "zustaendigkeit") && eigenerName) el.value = eigenerName;
    else el.value = player ? (player[f] || "") : (f === "geschlecht" ? "m" : "");
  });
  document.getElementById("pf-letzteBearbeitung").value = player && player.letzteBearbeitung ? isoToDisplay(player.letzteBearbeitung) : "(wird beim Speichern gesetzt)";
  setSpielerFormDisabled(nurLesen);
  document.getElementById("spieler-modal").classList.remove("hidden");
  if (!nurLesen) document.getElementById("pf-nachname").focus();
}

function closeSpielerModal() {
  document.getElementById("spieler-modal").classList.add("hidden");
  setSpielerFormDisabled(false);
  editingPlayerId = null;
}

function saveSpieler() {
  if (!canEdit()) return;
  const nachname = document.getElementById("pf-nachname").value.trim();
  if (!nachname) { alert("Bitte einen Nachnamen eingeben."); return; }
  let player = editingPlayerId ? appData.players.find((p) => p.id === editingPlayerId) : null;
  const isNew = !player;
  if (isNew) player = { id: uuid() };
  PLAYER_FIELDS.forEach((f) => {
    const el = document.getElementById("pf-" + f);
    if (!el) return;
    player[f] = el.type === "checkbox" ? el.checked : el.value.trim();
  });
  player.letzteBearbeitung = todayIso();
  if (isNew) appData.players.push(player);
  persist();
  renderAll();
  closeSpielerModal();
}

function deleteSpieler() {
  if (!canEdit()) return;
  if (!editingPlayerId) return;
  if (!confirm("Diesen Spieler wirklich löschen?")) return;
  appData.players = appData.players.filter((p) => p.id !== editingPlayerId);
  persist();
  renderAll();
  closeSpielerModal();
}

function appendEntry(fieldId) {
  const el = document.getElementById(fieldId);
  const text = prompt("Neuer Eintrag:");
  if (!text || !text.trim()) return;
  const stamped = `${todayDisplay()}: ${text.trim()}`;
  el.value = el.value.trim() ? `${el.value.trim()} // ${stamped}` : stamped;
}

// ---------- Vereins-Formular ----------
function buildKontaktRow(k) {
  const row = document.createElement("div");
  row.className = "kontakt-row";
  row.innerHTML = `
    <input type="text" placeholder="Name" class="kf-name" value="${escapeHtml(k.name || "")}" />
    <input type="text" placeholder="Funktion" class="kf-funktion" value="${escapeHtml(k.funktion || "")}" />
    <input type="email" placeholder="E-Mail" class="kf-email" value="${escapeHtml(k.email || "")}" />
    <input type="text" placeholder="Telefon" class="kf-telefon" value="${escapeHtml(k.telefon || "")}" />
    <button type="button" class="btn secondary small" data-remove-kontakt title="Ansprechpartner entfernen">✕</button>`;
  row.querySelector("[data-remove-kontakt]").addEventListener("click", () => row.remove());
  return row;
}

function renderKontakteRows(kontakte) {
  const container = document.getElementById("kontakte-list");
  container.innerHTML = "";
  const list = kontakte && kontakte.length ? kontakte : [{ name: "", funktion: "", email: "", telefon: "" }];
  list.forEach((k) => container.appendChild(buildKontaktRow(k)));
}

const CLUB_FIELD_IDS = ["cf-name", "cf-strasse", "cf-plz", "cf-ort", "cf-website"];

// Gegenstück zu setSpielerFormDisabled für das Vereins-Formular. ⚠️ Muss NACH
// renderKontakteRows laufen: die Ansprechpartner-Zeilen werden dort frisch
// gebaut, ein vorher gesetztes disabled wäre wieder weg.
function setVereinFormDisabled(disabled) {
  CLUB_FIELD_IDS.forEach((id) => { const el = document.getElementById(id); if (el) el.disabled = disabled; });
  document.querySelectorAll("#kontakte-list input").forEach((el) => { el.disabled = disabled; });
  document.querySelectorAll("#kontakte-list [data-remove-kontakt]").forEach((b) => b.classList.toggle("hidden", disabled));
  document.getElementById("btn-add-kontakt").classList.toggle("hidden", disabled);
  document.getElementById("btn-save-verein").classList.toggle("hidden", disabled);
  document.getElementById("btn-cancel-verein").textContent = disabled ? "Schließen" : "Abbrechen";
}

function openVereinModal(id) {
  if (!id && !canEdit()) return;
  const nurLesen = !canEdit();
  editingClubId = id || null;
  const isNew = !id;
  const club = isNew ? null : appData.clubs.find((c) => c.id === id);
  document.getElementById("verein-modal-title").textContent = isNew ? "Neuer Verein" : club.name;
  document.getElementById("btn-delete-verein").classList.toggle("hidden", isNew || nurLesen);
  document.getElementById("cf-name").value = club ? club.name : "";
  document.getElementById("cf-strasse").value = club ? club.strasse || "" : "";
  document.getElementById("cf-plz").value = club ? club.plz || "" : "";
  document.getElementById("cf-ort").value = club ? club.ort || "" : "";
  document.getElementById("cf-website").value = club ? club.website || "" : "";
  renderKontakteRows(club ? club.kontakte : []);
  setVereinFormDisabled(nurLesen);
  document.getElementById("verein-modal").classList.remove("hidden");
  if (!nurLesen) document.getElementById("cf-name").focus();
}

function closeVereinModal() {
  document.getElementById("verein-modal").classList.add("hidden");
  setVereinFormDisabled(false);
  editingClubId = null;
}

function saveVerein() {
  if (!canEdit()) return;
  const name = document.getElementById("cf-name").value.trim();
  if (!name) { alert("Bitte einen Vereinsnamen eingeben."); return; }
  let club = editingClubId ? appData.clubs.find((c) => c.id === editingClubId) : null;
  const isNew = !club;
  if (isNew) club = { id: uuid() };
  club.name = name;
  club.strasse = document.getElementById("cf-strasse").value.trim();
  club.plz = document.getElementById("cf-plz").value.trim();
  club.ort = document.getElementById("cf-ort").value.trim();
  club.website = document.getElementById("cf-website").value.trim();
  club.kontakte = [...document.querySelectorAll("#kontakte-list .kontakt-row")]
    .map((row) => ({
      name: row.querySelector(".kf-name").value.trim(),
      funktion: row.querySelector(".kf-funktion").value.trim(),
      email: row.querySelector(".kf-email").value.trim(),
      telefon: row.querySelector(".kf-telefon").value.trim()
    }))
    .filter((k) => k.name || k.funktion || k.email || k.telefon);
  if (isNew) appData.clubs.push(club);
  persist();
  renderAll();
  closeVereinModal();
}

function deleteVerein() {
  if (!canEdit()) return;
  if (!editingClubId) return;
  if (!confirm("Diesen Verein wirklich löschen?")) return;
  appData.clubs = appData.clubs.filter((c) => c.id !== editingClubId);
  persist();
  renderAll();
  closeVereinModal();
}

// ---------- Datenimport (lokale Datei, nie ins Repo/GitHub Pages) ----------
function handleImportFile(file) {
  if (!file || appData.players.length > 0) return;
  const reader = new FileReader();
  reader.onload = async () => {
    let parsed;
    try {
      parsed = JSON.parse(reader.result);
    } catch (e) {
      alert("Die Datei ist kein gültiges JSON.");
      return;
    }
    const players = Array.isArray(parsed.players) ? parsed.players : null;
    const clubs = Array.isArray(parsed.clubs) ? parsed.clubs : null;
    if (!players || !clubs) {
      alert("Die Datei enthält nicht das erwartete Format ({ players: [...], clubs: [...] }).");
      return;
    }
    if (!confirm(`Wirklich ${players.length} Spieler und ${clubs.length} Vereine importieren?`)) return;
    appData.players = players;
    appData.clubs = clubs;
    renderAll();
    const ok = await persist();
    if (ok) alert(`Import erfolgreich gespeichert: ${players.length} Spieler und ${clubs.length} Vereine.`);
  };
  reader.readAsText(file, "utf-8");
}

// ---------- Tabs ----------
function switchTab(tab) {
  document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document.querySelectorAll(".tab-section").forEach((s) => s.classList.toggle("active", s.id === "tab-" + tab));
  if (tab === "spieler") renderSpielerListe();
  if (tab === "vereine") renderVereinListe();
  if (tab === "info") renderVersionInfo();
}

// ---------- Gateway: Laden / Speichern / Konflikte ----------
function setSaveStatus(text, kind) {
  const el = document.getElementById("save-status");
  if (!el) return;
  el.textContent = text;
  el.className = "header-status" + (kind ? " is-" + kind : "");
}

// Schreibt sofort, ohne Debounce. Alle Aufrufer sind diskrete Klicks (Speichern bzw.
// Löschen im Modal), niemand tippt hier in ein automatisch gesichertes Feld — es gibt
// also nichts zu entprellen. Schnell aufeinanderfolgende Änderungen fasst ohnehin der
// In-Flight-Guard unten zusammen, nicht ein Timer. Die frühere Wartezeit von 300 ms
// hat nur den Zeitraum verlängert, in dem eine Änderung bereits gespeichert AUSSAH
// (Modal zu, Liste zeigt sie) und trotzdem noch nirgends lag.
// Gibt das Save-Promise zurück, damit der Import auf die Bestätigung warten kann.
function persist() {
  ungespeicherteAenderungen = true;
  return doPersist();
}

// Es darf immer nur EIN dav-save unterwegs sein. gatewayRev (das ETag, mit dem der
// Worker Konflikte erkennt) wird erst aktualisiert, wenn ein Save zurückkommt —
// ein zweiter Save, der währenddessen startet, schickt also dasselbe, inzwischen
// veraltete ETag und wird zwangsläufig mit 409 abgelehnt. Für die bearbeitende
// Person sah das aus wie "ein anderes Gerät hat geändert", obwohl sie allein war,
// und reloadAfterConflict() verwarf dabei ihre letzte Eingabe.
// Deshalb: Änderungen, die während eines laufenden Saves anfallen, nur vormerken
// und danach in einem Rutsch nachschreiben. appData wird ohnehin immer komplett
// geschrieben, es geht also nichts verloren, wenn mehrere Änderungen zusammenfallen.
let saveRunner = null;
let saveDirty = false;
function doPersist() {
  saveDirty = true;
  if (!saveRunner) saveRunner = runSaveLoop().finally(() => { saveRunner = null; });
  return saveRunner;
}

async function runSaveLoop() {
  let ok = true;
  while (saveDirty) {
    saveDirty = false;
    ok = await writeToGateway();
    // Bei Konflikt/Fehler wurde der Stand neu geladen bzw. der Login-Screen
    // gezeigt — dann NICHT blind nachschreiben, das würde den fremden Stand
    // wieder überbügeln.
    if (!ok) { saveDirty = false; break; }
  }
  return ok;
}

async function writeToGateway() {
  setSaveStatus("Speichern…", "pending");
  try {
    await gatewaySave(appData);
    const t = new Date().toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    setSaveStatus("Gespeichert " + t, "ok");
    letzterSaveFehlgeschlagen = false;
    // Nur entwarnen, wenn seit dem Start dieses Schreibvorgangs nichts Neues
    // dazugekommen ist — sonst dreht die Schleife gleich noch eine Runde und es
    // liegt weiterhin etwas Unbestätigtes an.
    if (!saveDirty) ungespeicherteAenderungen = false;
    return true;
  } catch (e) {
    if (e instanceof ConflictError) {
      // Nach dem Neuladen ist der lokale Stand der Server-Stand: es gibt nichts mehr
      // zu schreiben und damit auch nichts, wovor beim Verlassen zu warnen wäre.
      // Scheitert das Neuladen, bleibt die eigene Änderung liegen — dann Warnung an.
      const neuGeladen = await reloadAfterConflict();
      setSaveStatus("Von anderem Gerät aktualisiert", "");
      if (neuGeladen) { ungespeicherteAenderungen = false; letzterSaveFehlgeschlagen = false; }
      else letzterSaveFehlgeschlagen = true;
      return false;
    }
    if (e instanceof NotLoggedInError) {
      showConnectScreen("Sitzung abgelaufen — bitte neu anmelden.");
      letzterSaveFehlgeschlagen = true;
      return false;
    }
    console.error("Speichern fehlgeschlagen", e);
    setSaveStatus("Nicht gespeichert", "error");
    letzterSaveFehlgeschlagen = true;
    alert("Speichern fehlgeschlagen: " + e.message);
    return false;
  }
}

async function reloadAfterConflict() {
  try {
    const data = await gatewayLoad();
    appData = (data && Array.isArray(data.players) && Array.isArray(data.clubs)) ? data : { players: [], clubs: [] };
    renderAll();
    alert("Die Daten wurden zwischenzeitlich auf einem anderen Gerät geändert — die aktuelle Version wurde neu geladen. Bitte die letzte Änderung bei Bedarf erneut vornehmen.");
    return true;
  } catch (e) {
    console.error("Neuladen nach Konflikt fehlgeschlagen", e);
    return false;
  }
}

// ---------- Start ----------
// ---------- Sitzungsverlust: räumen, nicht nur verstecken ----------

// ⚠️ Verstecken ist nicht Räumen. Fällt die Sitzung weg, WÄHREND die App
// offen ist, steht bereits alles auf dem Bildschirm. display:none macht das
// unsichtbar, nicht weg -- Namen, Nummern und ausgefüllte Formularfelder sind
// im Seitenquelltext weiter lesbar.
//
// ⚠️ Über die CONTAINER räumen, nie über eine Id-Liste. Eine Liste veraltet
// lautlos: wer später ein Feld ergänzt, müsste daran denken, und genau das eine
// bliebe stehen.
//
// ⚠️ Dialoge, Druckbereich und Bild-Lightbox stehen NEBEN der Hülle, nicht
// darin -- ihr innerHTML erwischt sie nicht. Ein offener Dialog ist dabei der
// schlimmste Fall: er steht nicht nur gespeichert, sondern SICHTBAR da.
//
// ⚠️ #header-user steht in einigen Apps im Seitenkopf und damit ebenfalls
// außerhalb. Der Rest des Kopfes (Titel, Logo, Zurück-Link) bleibt absichtlich:
// ohne ihn stünde man vor einer weißen Seite ohne Weg zurück.
//
// Wegwerfen ist gefahrlos: zurück in die App geht es ausschließlich über ein
// Neuladen der Seite. Wer sich neu anmeldet, bekommt sie ohnehin frisch.
let bildschirmGeraeumt = false;

// Vor dem ersten Aufbau gibt es nichts zu räumen -- und wer gar nicht angemeldet
// ist, soll nicht "Sitzung abgelaufen" lesen. Gesetzt wird das erst, wenn die
// Hülle wirklich sichtbar wird.
let appLaeuft = false;

function raeumeBildschirm() {
  bildschirmGeraeumt = true;
  const huelle = document.getElementById("app-shell");
  if (huelle) huelle.innerHTML = "";
  document.querySelectorAll(".modal-overlay, .overlay, #print-area, .foto-lightbox, #header-user").forEach((el) => {
    el.innerHTML = "";
    el.classList.add("hidden");
    el.style.display = "none";
  });
}

// ⚠️ Gerufen aus db.js -- an der EINEN Stelle, an der die 401 ankommt. Sonst
// müsste jeder einzelne Fehlerweg daran denken, und einer vergisst es.
function raeumeBeiSitzungsverlust() {
  if (!appLaeuft) return;
  showConnectScreen("Die Sitzung ist abgelaufen. Bitte über die Tools-Übersicht neu anmelden.");
}

function showConnectScreen(errorMsg) {
  raeumeBildschirm();
  document.getElementById("connect-screen").style.display = "";
  document.getElementById("app-shell").style.display = "none";
  document.getElementById("cloud-error").textContent = errorMsg ? "Fehler: " + errorMsg : "";
}

async function startApp() {
  appLaeuft = true;
  document.getElementById("connect-screen").style.display = "none";
  document.getElementById("app-shell").style.display = "";
  renderAll();
  try {
    currentUser = await fetchMe();
    renderHeaderUser();
  } catch (_) {
    // Name im Header ist best-effort, App funktioniert auch ohne
  }
  document.getElementById("btn-new-spieler").classList.toggle("hidden", !canEdit());
  document.getElementById("btn-new-verein").classList.toggle("hidden", !canEdit());
  // Export erst ab Bearbeiten (User-Entscheidung 2026-07-24, kehrt den früheren
  // Grundsatz "Export ist keine Änderung" um): Nur-Seher bekommen den
  // CSV-Export nicht angeboten — PII Minderjähriger soll nicht als Datei
  // abfließen. Das Panel selbst bleibt display:none, solange der Button fehlt.
  document.getElementById("btn-export-toggle").classList.toggle("hidden", !canEdit());
}

async function init() {
  setupListeners();
  if (!getSessionToken()) { showConnectScreen(); return; }
  try {
    const data = await gatewayLoad();
    appData = (data && Array.isArray(data.players) && Array.isArray(data.clubs)) ? data : { players: [], clubs: [] };
    await startApp();
  } catch (e) {
    if (e instanceof NotLoggedInError) { showConnectScreen(); return; }
    console.error("Nextcloud-Zugriff über Login fehlgeschlagen", e);
    showConnectScreen(e.message);
  }
}

function setupListeners() {
  document.querySelectorAll("nav button").forEach((b) => b.addEventListener("click", () => switchTab(b.dataset.tab)));

  document.getElementById("spieler-search").addEventListener("input", renderSpielerListe);
  document.getElementById("filter-status").addEventListener("change", renderSpielerListe);
  document.getElementById("filter-zustaendigkeit").addEventListener("change", renderSpielerListe);
  document.getElementById("filter-position").addEventListener("change", renderSpielerListe);
  document.getElementById("spieler-list").addEventListener("click", (e) => {
    const row = e.target.closest(".list-row");
    if (row) openSpielerModal(row.dataset.id);
  });
  document.getElementById("btn-new-spieler").addEventListener("click", () => openSpielerModal(null));
  initExportPanel();
  document.getElementById("spieler-modal-close").addEventListener("click", closeSpielerModal);
  document.getElementById("btn-cancel-spieler").addEventListener("click", closeSpielerModal);
  document.getElementById("btn-save-spieler").addEventListener("click", saveSpieler);
  document.getElementById("btn-delete-spieler").addEventListener("click", deleteSpieler);
  document.getElementById("spieler-modal").addEventListener("click", (e) => { if (e.target.id === "spieler-modal") closeSpielerModal(); });
  document.getElementById("spieler-form").addEventListener("submit", (e) => e.preventDefault());
  document.querySelectorAll("[data-append]").forEach((btn) => btn.addEventListener("click", () => appendEntry(btn.dataset.append)));

  document.getElementById("verein-search").addEventListener("input", renderVereinListe);
  document.getElementById("verein-list").addEventListener("click", (e) => {
    const row = e.target.closest(".club-list-row");
    if (row) openVereinModal(row.dataset.id);
  });
  document.getElementById("btn-new-verein").addEventListener("click", () => openVereinModal(null));
  document.getElementById("verein-modal-close").addEventListener("click", closeVereinModal);
  document.getElementById("btn-cancel-verein").addEventListener("click", closeVereinModal);
  document.getElementById("btn-save-verein").addEventListener("click", saveVerein);
  document.getElementById("btn-delete-verein").addEventListener("click", deleteVerein);
  document.getElementById("verein-modal").addEventListener("click", (e) => { if (e.target.id === "verein-modal") closeVereinModal(); });
  document.getElementById("verein-form").addEventListener("submit", (e) => e.preventDefault());
  document.getElementById("btn-add-kontakt").addEventListener("click", () => document.getElementById("kontakte-list").appendChild(buildKontaktRow({})));

  document.getElementById("btn-import-seed").addEventListener("click", () => document.getElementById("import-file-input").click());
  document.getElementById("import-file-input").addEventListener("change", (e) => {
    handleImportFile(e.target.files[0]);
    e.target.value = "";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!document.getElementById("spieler-modal").classList.contains("hidden")) closeSpielerModal();
    if (!document.getElementById("verein-modal").classList.contains("hidden")) closeVereinModal();
  });

  // Sicherheitsnetz für die Sekunde zwischen Klick und bestätigtem Schreiben: der
  // laufende fetch wird beim Entladen der Seite abgebrochen, deshalb geht der aktuelle
  // Stand hier noch einmal per keepalive raus — der überlebt das Schließen des Tabs.
  //
  // Nachgefragt wird NUR, wenn dieser Weg nicht trägt: wenn der Rettungsversuch gar
  // nicht erst rausging (Datenbestand über der 64-KB-Grenze für keepalive, siehe
  // gatewaySaveBeacon) oder der letzte reguläre Versuch schon scheiterte. Sonst käme
  // die Rückfrage bei JEDEM Schließen kurz nach einer Änderung — also ständig — und
  // würde reflexhaft weggeklickt, gerade dann wenn sie einmal wirklich zählt.
  window.addEventListener("beforeunload", (e) => {
    if (!ungespeicherteAenderungen) return;
    const abgeschickt = gatewaySaveBeacon(appData);
    if (abgeschickt && !letzterSaveFehlgeschlagen) return;
    e.preventDefault();
    e.returnValue = "";
  });
}

document.addEventListener("DOMContentLoaded", init);
