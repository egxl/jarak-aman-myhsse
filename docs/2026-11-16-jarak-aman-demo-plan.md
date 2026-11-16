# JARAK AMAN 4-Role Interactive HSSE Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a zero-build, polished 4-role interactive MyHSSE demo (`HP Pekerja`, `Ruang Kendali`, `Kiosk Pos Gate`, `Petugas Titik Kumpul`, plus `Split View`) in `jarak-aman/app/` aligned with PRD v0.7 and the Pelindo Blue/Gold Light/Dark design spec.

**Architecture:** Unpack the double-bundled Claude artifact into modular vanilla ES6 files loaded via ordered `<script defer>` tags inside `app/index.html` under a single `window.JARAK_AMAN` namespace. A central reactive store (`app/js/store.js`) drives all four role views simultaneously in one browser window (avoiding `file://` CORS issues) and optionally broadcasts state across same-origin `http(s)` tabs via `BroadcastChannel`.

**Tech Stack:** HTML5, CSS3 (Custom Properties with Pelindo Blue/Gold `[data-theme="dark" | "light"]`), Vanilla JavaScript (ES6, `<script defer>`), Node.js `node:test` for unit tests, Python Playwright for `file://` E2E and visual checks.

**Spec:** [2026-11-16-jarak-aman-demo-design.md](file:///c:/GitHub/PELINDO/jarak-aman/docs/2026-11-16-jarak-aman-demo-design.md)

## Global Constraints

- Zero build step and zero ES module `<script type="module">` imports; must execute cleanly via `file:///.../jarak-aman/app/index.html` and static hosting (`GitHub Pages` / `Netlify` / `Cloudflare Pages`).
- Strictly software-only Phase 1 (P0) & Phase 1b (P1) scope per PRD v0.7: no UWB vest controls, no BLE beacons, no Cabin HUD, no automated BMKG API integration.
- Primary UI language is Bahasa Indonesia matching PRD v0.7 terms (`Safety induction`, `Titik kumpul`, `TKBM`, `Near miss`, `LATIHAN`, `Komandan insiden`), with an `ID / EN` switcher in `Kiosk Pos Gate`.
- Preserve all 10 `Coba Skenario` quick-jump flows on `HP Pekerja` and baseline 24 Tanjung Priok workers + 8 equipment units marked as `Data contoh`.
- Audience phones scanning a QR code load `?view=mobile` independently without requiring a backend relay.

## Review Focus

1. `file://` origin guard: `BroadcastChannel` or `localStorage` access throwing `SecurityError` on opaque `file://` origins must never crash `Store` initialization or state updates (pinned in Task 1 `store.test.js` & Task 2 `file://` smoke test).
2. Non-linear `Coba Skenario` jumps (e.g., Scenario 8 `Aman` → Scenario 4 `Selfie APD fail` → Scenario 3 `Induction`): stale `timedOut`, `wrong`, or `evac` flags must reset deterministically while preserving Kiosk-added workers (pinned in Task 1 `store.test.js`).
3. Zone-scoped evacuation (`Dermaga A & B`): workers in `Lapangan C`, `Lapangan D`, and `Gate 3` must remain `Aktif` and be excluded from `Daftar SAR` and `Belum Keluar` alarms (pinned in Task 1 `store.test.js`).
4. Dual assembly capacity overflow & hazard routing: `Gempa` or `Gedung Evakuasi B` reaching `40` occupants must route evacuees to `Area Terbuka Timur` (`cap 60`) with updated Mobile turn-by-turn route (pinned in Task 1 `store.test.js` & Task 5 E2E).
5. Marshal offline queue reconciliation: marking workers `Aman` while `Simulasi Tanpa Sinyal` is active must queue locally without mutating Control Room until `Sinkronkan / Online` flushes them (pinned in Task 1 `store.test.js` & Task 5 E2E).

---

### Task 1: Seed Data & Central Reactive Store (`data.js`, `store.js`)

**Files:**
- Create: `jarak-aman/app/js/data.js`
- Create: `jarak-aman/app/js/store.js`
- Test: `jarak-aman/tests/store.test.js`

**Interfaces:**
- Produces in `window.JARAK_AMAN.DATA`:
  - `WORKERS` (24 baseline workers `Andi`..`Zaenal`), `EQUIPMENT` (8 units `QC-02`..`TT-21`)
  - `ASSEMBLY_POINTS` (`{ 'gedung-b': { id, name, cap: 40 }, 'area-timur': { id, name, cap: 60 } }`)
  - `ROUTES` (`tsunami`, `tsunamiBackup`, `gempa`, `b3`), `CLSR_CATEGORIES`, `INDUCTION_BASE`, `INDUCTION_CANDIDATES`, `HOTSPOT_CLUSTERS`
- Produces in `window.JARAK_AMAN.Store`:
  - `new Store(opts?)` with `.getState()`, `.subscribe(fn)`, `.dispatch(action)`, `.tick()`, `.reset()`
  - Derived selectors: `getWorkerRows(state)`, `getEquipmentRows(state)`, `getAlarmQueue(state)`, `getEvacDestination(state)`, `getActiveRoute(state)`, `getComplianceStats(state)`, `getHotspots(state)`

- [ ] **Step 1: Write the failing Node unit tests**

Create `jarak-aman/tests/store.test.js` covering:
```javascript
const test = require('node:test');
const assert = require('node:assert/strict');

global.window = {};
require('../app/js/data.js');
require('../app/js/store.js');

const { Store, getWorkerRows, getEvacDestination, getAlarmQueue } = global.window.JARAK_AMAN;

test('zone-scoped evacuation only evacuates Dermaga A and B workers', () => {
  const store = new Store({ disableBroadcast: false });
  store.dispatch({ type: 'START_EVAC', hazard: 'tsunami', zone: 'dermaga', basis: 'bmkg', drill: false });
  const rows = getWorkerRows(store.getState());
  const andi = rows.find((r) => r.name === 'Andi'); // Dermaga A
  const joko = rows.find((r) => r.name === 'Joko'); // Lapangan C
  assert.equal(andi.inEvacZone, true);
  assert.equal(joko.inEvacZone, false);
  assert.equal(joko.status, 'Aktif');
});

test('gempa routes to area-timur and overflow > 40 at gedung-b routes to area-timur', () => {
  const store = new Store();
  store.dispatch({ type: 'START_EVAC', hazard: 'gempa', zone: 'all', basis: 'lapangan', drill: false });
  assert.equal(getEvacDestination(store.getState()).id, 'area-timur');

  store.reset();
  for (let i = 0; i < 20; i++) {
    store.dispatch({ type: 'KIOSK_CHECKIN', name: `TKBM-${i}`, role: 'TKBM', cardId: `K-${i}`, passengers: 1, borrowedApd: false });
  }
  store.dispatch({ type: 'START_EVAC', hazard: 'tsunami', zone: 'all', basis: 'bmkg', drill: false });
  store.dispatch({ type: 'SET_FAST', fast: true });
  for (let t = 0; t < 35; t++) store.tick();
  const dest = getEvacDestination(store.getState());
  assert.equal(dest.overflowed ? 'area-timur' : 'gedung-b', 'area-timur');
});

test('kiosk check-in with passengers spawns linked rows and increments gate headcount', () => {
  const store = new Store();
  const before = store.getState().workers.length;
  store.dispatch({ type: 'KIOSK_CHECKIN', name: 'Slamet', role: 'Sopir truk', cardId: 'STID-9981', passengers: 2, borrowedApd: true });
  const workers = store.getState().workers;
  assert.equal(workers.length, before + 3);
  assert.equal(workers.some((w) => w.name === 'Penumpang 1 · STID-9981' && w.indStatus === 'pos_gate'), true);
});

test('non-linear mobile scenario jumps reset stale evac flags while preserving kiosk workers', () => {
  const store = new Store();
  store.dispatch({ type: 'KIOSK_CHECKIN', name: 'Bambang', role: 'TKBM', cardId: 'T-77', passengers: 0, borrowedApd: false });
  store.dispatch({ type: 'JUMP_SCENARIO', key: 'bmkg' });
  store.dispatch({ type: 'TOGGLE_WRONG_WAY' });
  assert.equal(store.getState().mobile.wrong, true);
  store.dispatch({ type: 'JUMP_SCENARIO', key: 'apdfail' });
  assert.equal(store.getState().phase, 'normal');
  assert.equal(store.getState().mobile.wrong, false);
  assert.equal(store.getState().workers.some((w) => w.name === 'Bambang'), true);
});

test('marshal offline mode queues confirmations and flushes to control room when online', () => {
  const store = new Store();
  store.dispatch({ type: 'START_EVAC', hazard: 'tsunami', zone: 'all', basis: 'bmkg', drill: false });
  store.dispatch({ type: 'MARSHAL_SET_OFFLINE', offline: true });
  store.dispatch({ type: 'MARSHAL_MARK_SAFE', workerId: 'Oki', pointId: 'gedung-b' });
  assert.equal(store.getState().marshal.pendingQueue.length, 1);
  assert.notEqual(getWorkerRows(store.getState()).find((r) => r.name === 'Oki').status, 'Aman');
  store.dispatch({ type: 'MARSHAL_SET_OFFLINE', offline: false });
  assert.equal(store.getState().marshal.pendingQueue.length, 0);
  assert.equal(getWorkerRows(store.getState()).find((r) => r.name === 'Oki').status, 'Aman');
});

test('mobile near-miss report pushes live alarm and induction draft candidate', () => {
  const store = new Store();
  store.dispatch({ type: 'SUBMIT_REPORT', category: 'nm', hasPhoto: true, anonymous: false, note: 'Nyaris terserempet di Lajur 4' });
  const alarms = getAlarmQueue(store.getState());
  assert.equal(alarms.some((a) => a.title.includes('Nyaris terserempet') || a.id.startsWith('live-nm')), true);
  assert.equal(store.getState().induction.candidates.some((c) => c.fromMobile === true), true);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test jarak-aman/tests/store.test.js`
Expected: FAIL with `Cannot find module '../app/js/data.js'`.

- [ ] **Step 3: Implement `jarak-aman/app/js/data.js` and `jarak-aman/app/js/store.js`**

Write `data.js` defining all seed collections (`WORKERS`, `EQUIPMENT`, `ASSEMBLY_POINTS`, `ROUTES`, `CLSR_CATEGORIES`, `INDUCTION_BASE`, `INDUCTION_CANDIDATES`, `HOTSPOT_CLUSTERS`) attached to `window.JARAK_AMAN.DATA`.
Write `store.js` implementing `Store` and selector functions attached to `window.JARAK_AMAN`:
- Guard `BroadcastChannel` initialization and `.postMessage()` inside `try { ... } catch (_) {}` so `file://` opaque origins never throw.
- Support `START_EVAC`, `CANCEL_EVAC`, `END_EVAC`, `REOPEN_ZONES`, `TOGGLE_ROUTE_CLOSED`, `TOGGLE_CMD_POST`, `TOGGLE_FAST`, `HANDLE_ALARM`, `SUBMIT_REPORT`, `SUBMIT_SHAKE`, `TRIGGER_SOS`, `CANCEL_SOS`, `JUMP_SCENARIO`, `TOGGLE_WRONG_WAY`, `SET_MOBILE_STATE`, `UPDATE_INDUCTION_DRAFT`, `SUBMIT_INDUCTION_HSSE`, `APPROVE_INDUCTION`, `TOGGLE_REREAD`, `KIOSK_CHECKIN`, `MARSHAL_SET_OFFLINE`, `MARSHAL_MARK_SAFE`, `MARSHAL_BULK_SAFE`, `MARSHAL_OVERRIDE_UNCONFIRMED`, `MARSHAL_MARK_SOS`.
- When `gedung-b` reaches `40` `Aman` workers during an active `tsunami`/`b3` evacuation, `getEvacDestination(state)` returns `area-timur` with `overflowed: true`.

- [ ] **Step 4: Run tests to verify all pass**

Run: `node --test jarak-aman/tests/store.test.js`
Expected: PASS (all 6 test suites green).

- [ ] **Step 5: Commit**

```bash
git add jarak-aman/app/js/data.js jarak-aman/app/js/store.js jarak-aman/tests/store.test.js
git commit -m "feat(jarak-aman): add seed data and reactive 4-role state store"
```

---

### Task 2: Pelindo Blue/Gold Theme System, Shell Layout & View Router

**Files:**
- Create: `jarak-aman/app/css/tokens.css`
- Create: `jarak-aman/app/css/layout.css`
- Create: `jarak-aman/app/css/views.css`
- Create: `jarak-aman/app/index.html`
- Create: `jarak-aman/app/js/app.js`
- Test: `jarak-aman/tests/e2e_smoke.py`

**Interfaces:**
- Consumes `window.JARAK_AMAN.Store`
- Produces in `window.JARAK_AMAN.App`:
  - `initApp()`, `setView(viewId)` (`split | mobile | control | kiosk | marshal`), `setTheme(theme)` (`dark | light`), `showToast(msg)`
  - Placeholder mount containers `#mount-mobile`, `#mount-control`, `#mount-kiosk`, `#mount-marshal`

- [ ] **Step 1: Write the failing Playwright smoke test**

Create `jarak-aman/tests/e2e_smoke.py` verifying via `file://` URL:
- Zero console errors and zero `pageerror` exceptions.
- Top bar renders `MyHSSE · Modul JARAK AMAN v0.7` and all 5 view buttons (`split`, `mobile`, `control`, `kiosk`, `marshal`).
- Clicking theme toggle switches `document.documentElement.dataset.theme` between `dark` and `light`.
- Opening `?view=mobile` activates standalone Mobile view and hides Control Room / Kiosk / Marshal mounts.

- [ ] **Step 2: Run smoke test to verify it fails**

Run: `py jarak-aman/tests/e2e_smoke.py`
Expected: FAIL (`ERR_FILE_NOT_FOUND` for `index.html`).

- [ ] **Step 3: Implement `tokens.css`, `layout.css`, `views.css`, `index.html`, and `app.js`**

- `tokens.css`: Define Pelindo Corporate Maritime Navy/Blue (`--brand-navy: #0A2E5C`, `--brand-blue: #00579B`, `--brand-gold: #EAB308` / `#D97706`) and strict semantic safety tokens (`--sig-safe`, `--sig-warn`, `--sig-crit`, `--sig-muted`) across `[data-theme="dark"]` and `[data-theme="light"]`.
- `layout.css`: Top sticky demo header (`56px`), responsive Split View grid (`396px 1fr` on `>= 1100px`, single active pane on smaller widths), centered device frames for Kiosk (`max-width: 1024px`) and Marshal (`max-width: 980px`), and `100vh - 56px` viewport-fit rules for Control Room.
- `views.css`: Shared typography, pill/badge, card, table, modal, SVG map, and smooth `160ms` transition classes.
- `index.html`: Load CSS files, mount containers, modal/toast portals, and `<script defer>` tags (`data.js`, `store.js`, view scripts guarded cleanly if loaded progressively, `app.js`).
- `app.js`: Parse `?view=` query param (`window.location.search`), initialize `Store`, default theme (`light` if `< 768px` or `?view=mobile|kiosk`, `dark` otherwise), wire top-bar buttons (`Split`, `HP Pekerja`, `Ruang Kendali`, `Kiosk Gate`, `Titik Kumpul`, `Timer ×10`, `Tema`, `Reset`), and run `1000ms` tick interval.

- [ ] **Step 4: Run smoke test to verify it passes**

Run: `py jarak-aman/tests/e2e_smoke.py`
Expected: PASS (0 console errors, query route & theme toggle verified).

- [ ] **Step 5: Commit**

```bash
git add jarak-aman/app/index.html jarak-aman/app/css/ jarak-aman/app/js/app.js jarak-aman/tests/e2e_smoke.py
git commit -m "feat(jarak-aman): add Pelindo Blue/Gold theme shell and view router"
```

---

### Task 3: Role 1 — HP Pekerja (`mobile.js`)

**Files:**
- Create: `jarak-aman/app/js/views/mobile.js`
- Modify: `jarak-aman/tests/e2e_smoke.py` (or create `jarak-aman/tests/e2e_mobile.py`)

**Interfaces:**
- Consumes `window.JARAK_AMAN.Store`, `window.JARAK_AMAN.DATA`, `getActiveRoute`, `getEvacDestination`
- Produces `window.JARAK_AMAN.Views.renderMobile(container, state, store)`

- [ ] **Step 1: Write the failing Playwright test for Mobile flows**

Create `jarak-aman/tests/e2e_mobile.py` testing:
- Clicking `Coba Skenario` item `Selfie APD tidak lengkap` (`apdfail`) blocks advancing until `Foto ulang` + `Sepatu safety: Saya pakai` are clicked.
- Answering Step 2 quiz (`b`) advances to Step 3 (`Bahaya dan kelalaian hari ini`) and completing reaches `Safety induction selesai`.
- Submitting a 30s CLSR report (`Near miss orang–alat`) triggers toast `LP-` and updates `store` alarm queue.
- Switching OS preview toggle between `iOS Dynamic Island` and `Android 16 Notif` during `Panduan di luar aplikasi` updates the rendered outer notification UI.

- [ ] **Step 2: Run test to verify it fails**

Run: `py jarak-aman/tests/e2e_mobile.py`
Expected: FAIL (`renderMobile` not implemented).

- [ ] **Step 3: Implement `jarak-aman/app/js/views/mobile.js`**

Implement full `renderMobile(container, state, store)` with event delegation (preserving scroll & focus cleanly):
- Phone frame (`390×844` on desktop, fluid `100%` on `< 460px`) with **MyHSSE module header** (`MyHSSE › Keselamatan Operasi › JARAK AMAN`) and **OS channel toggle (`iOS` / `Android 16`)**.
- All 11 screens: `outside`, `perm` (3 permissions), `home` (zone card, induction status, `Wajib baca ulang` emergency banner when triggered by Control Room, `Lapor`, `Guncangan kuat`, `Butuh bantuan`), `ind` (3 steps), `indDone`, `report` (4 CLSR categories, optional photo, anonymous checkbox, offline-queue toggle), `alert` (in-app turn-by-turn GPS SVG map + iOS Dynamic Island expandable overlay + Android 16 progress notification card + Lock screen view + nearby workers), `safe` (displays active destination `Gedung Evakuasi B` or `Area Terbuka Timur`), `clear` (closed-zone warning for Dermaga A/B), `sos`, `out`.
- Companion `Coba Skenario` panel (collapsible drawer on narrow phones, side rail on desktop `Mobile Only` / bottom pill strip in `Split View`) with the 10 quick-jump scenarios + `Simulasi salah arah` / `Percepat ×10` contextual demo toggles.

- [ ] **Step 4: Run test to verify it passes**

Run: `py jarak-aman/tests/e2e_mobile.py`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add jarak-aman/app/js/views/mobile.js jarak-aman/tests/e2e_mobile.py
git commit -m "feat(jarak-aman): implement HP Pekerja MyHSSE view with iOS/Android F10 toggle"
```

---

### Task 4: Role 2 — Ruang Kendali 3-Tab Console (`control.js`)

**Files:**
- Create: `jarak-aman/app/js/views/control.js`
- Create: `jarak-aman/tests/e2e_control.py`

**Interfaces:**
- Consumes `window.JARAK_AMAN.Store`, `getWorkerRows`, `getEquipmentRows`, `getAlarmQueue`, `getEvacDestination`, `getComplianceStats`, `getHotspots`
- Produces `window.JARAK_AMAN.Views.renderControl(container, state, store)`

- [ ] **Step 1: Write the failing Playwright test for Control Room**

Create `jarak-aman/tests/e2e_control.py` at `1440×900` viewport testing:
- Control Room fits inside the `1440×900` viewport without page-level vertical overflow (`scrollHeight <= 960` for the shell container).
- Opening `Perintahkan evakuasi`, choosing `Gempa` + `Dermaga A dan B` + `LATIHAN`, and sending switches phase to `evac`, prefixes alarms with `LATIHAN ·`, and highlights `Area Terbuka Timur` on the map.
- Switching tabs to `Kepatuhan & Titik Rawan` renders group compliance bars, worker filter pills (`Tanpa Aplikasi`), and hotspot clusters; switching to `Editor Induction` allows adding a draft, submitting to HSSE, approving `Rev 2`, and toggling `Wajibkan baca ulang`.
- Clicking `Ekspor ke tim SAR` opens the SAR preview modal with non-empty missing worker rows.

- [ ] **Step 2: Run test to verify it fails**

Run: `py jarak-aman/tests/e2e_control.py`
Expected: FAIL (`renderControl` not implemented).

- [ ] **Step 3: Implement `jarak-aman/app/js/views/control.js`**

Implement `renderControl(container, state, store)`:
- Persistent header strip (`Ruang Kendali Utama` / `Pos Komando Cadangan`, clock, `Perintahkan evakuasi` button, active evac/recovery controls) + 2-step Evacuation Command Modal (`Jenis Bahaya`, `Zona`, `Dasar Keputusan`, `Mode Sungguhan/LATIHAN`, live target count preview).
- Compact 5-card KPI bar above the 3 tabs.
- **Tab 1 (`Peta & Evakuasi`):** Left `60%` interactive Terminal Map (`Laut`, `Dermaga A/B`, `Lapangan C/D`, `Gate 3`, `Gedung Evakuasi B x/40`, `Area Terbuka Timur x/60`, closed `Jalan Dermaga B` hazard strip, pulsing SOS, clickable worker/equipment inspector); Right `40%` scrollable **Antrean Alarm** (`Ambil alih` → `Tandai selesai`, 60s SOS escalation badge) + **Daftar SAR** + `Ekspor Daftar SAR` modal (preview + JSON/CSV download).
- **Tab 2 (`Kepatuhan & Titik Rawan`):** Top compliance summary by group (`Pegawai`, `TKBM`, `Sopir`, `Tamu`) + `Ekspor Laporan HSSE` modal; bottom split **Peta Titik Rawan Mingguan (Heatmap)** + filterable 24+ **Daftar Orang di Area** table.
- **Tab 3 (`Editor Induction`):** Left active Step 3 items (`KORBAN JIWA` locked, hide/show toggles, `Draf` / `BARU` badges); Right `Usulan Data Kemarin & Laporan Masuk` + HSSE 2-step approval (`Kirim ke HSSE` → `Setujui & Terbitkan Rev N+1`) + `Wajibkan baca ulang` toggle.

- [ ] **Step 4: Run test to verify it passes**

Run: `py jarak-aman/tests/e2e_control.py`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add jarak-aman/app/js/views/control.js jarak-aman/tests/e2e_control.py
git commit -m "feat(jarak-aman): implement 3-tab viewport-fit Ruang Kendali console"
```

---

### Task 5: Role 3 (Kiosk Gate) & Role 4 (Petugas Titik Kumpul) + Full Closed-Loop E2E

**Files:**
- Create: `jarak-aman/app/js/views/kiosk.js`
- Create: `jarak-aman/app/js/views/marshal.js`
- Create: `jarak-aman/tests/e2e_closed_loop.py`

**Interfaces:**
- Consumes `window.JARAK_AMAN.Store`, `getWorkerRows`, `getEvacDestination`
- Produces:
  - `window.JARAK_AMAN.Views.renderKiosk(container, state, store)`
  - `window.JARAK_AMAN.Views.renderMarshal(container, state, store)`

- [ ] **Step 1: Write the failing Playwright closed-loop E2E test**

Create `jarak-aman/tests/e2e_closed_loop.py` verifying end-to-end sync across all 4 roles:
1. Open `Kiosk Gate`, toggle `EN` and back to `ID`, enter `TKBM` `"Suherman"` + `1` passenger + `Pinjam APD`, submit → switch to `Ruang Kendali` and assert `Di area (data gate)` increased by `2` and `Suherman` shows `Di pos gate (tanpa aplikasi)`.
2. In `Split View`, submit Mobile CLSR near-miss → assert Control Room Alarm Queue & `Titik Rawan` heatmap update immediately; approve `Rev 2` + `Wajibkan baca ulang` in `Editor Induction` → assert Mobile shows emergency re-read banner.
3. Trigger `Gempa` evacuation in Control Room → assert Mobile routes to `Area Terbuka Timur`, close `Jalan Dermaga B` → assert Mobile shows backup route notice.
4. Switch to `Petugas Titik Kumpul`, toggle `Simulasi Tanpa Sinyal`, bulk-confirm `Suherman` & `Oki` as `Aman` → assert Control Room `Aman` count does not change until toggling back `Online`, then assert Control Room `Aman` count increments by `2` and `Oki` disappears from `Daftar SAR`.

- [ ] **Step 2: Run test to verify it fails**

Run: `py jarak-aman/tests/e2e_closed_loop.py`
Expected: FAIL (`renderKiosk` / `renderMarshal` not implemented).

- [ ] **Step 3: Implement `kiosk.js` and `marshal.js`**

- `kiosk.js`: Touch-friendly Gate 3 Kiosk terminal (`1024px` max-width) with `ID / EN` dictionary switch, 3-step fast flow (1. Role + Nama + Kartu/STID + `Jumlah Penumpang` + optional SMS phone; 2. 3-card hazard briefing + 1-tap `Saya Paham` / `I Understand`; 3. Gate Officer APD verification + `Pinjam APD` toggle + `Catat Masuk & Selesai Induction`), plus quick-preset chips (`TKBM Koperasi`, `Sopir Truk + Kenek`, `Tamu / ABK EN`) for effortless live demoing.
- `marshal.js`: Field tablet roll-call UI with assembly point selector (`Gedung Evakuasi B x/40` | `Area Terbuka Timur x/60`), `Online` ↔ `Simulasi Tanpa Sinyal` toggle showing pending queue badge, filter tabs (`Semua`, `Perlu Konfirmasi`, `Sudah Aman`), `Mode Hitung Massal` checkboxes + `Konfirmasi Terpilih`, per-row `Konfirmasi Aman` / `Override Belum Tiba` / `Butuh Bantuan`, and clear banner citing FR-3.3 (`Catatan petugas titik kumpul menjadi sumber kebenaran`).

- [ ] **Step 4: Run closed-loop E2E test to verify it passes**

Run: `py jarak-aman/tests/e2e_closed_loop.py`
Expected: PASS across all 4 steps.

- [ ] **Step 5: Commit**

```bash
git add jarak-aman/app/js/views/kiosk.js jarak-aman/app/js/views/marshal.js jarak-aman/tests/e2e_closed_loop.py
git commit -m "feat(jarak-aman): implement Kiosk Gate and Titik Kumpul tablet with full 4-role sync"
```

---

### Task 6: Visual Polish Pass, Deploy Docs (`README.md`) & Screenshot QA

**Files:**
- Create: `jarak-aman/index.html` (root redirect to `./app/index.html`, preserving `?view=` query params)
- Create: `jarak-aman/README.md`
- Create: `jarak-aman/.gitignore`
- Modify: `jarak-aman/app/css/tokens.css`, `layout.css`, `views.css` (any spacing/contrast/overflow fixes found during screenshot QA)

- [ ] **Step 1: Write `jarak-aman/README.md` and `jarak-aman/.gitignore`**

Document in `README.md`:
- Local launch (`app/index.html` via `file://` or `py -m http.server`).
- Free static hosting instructions (GitHub Pages / Cloudflare Pages / Netlify) and QR code URL (`https://<user>.github.io/jarak-aman-myhsse/app/?view=mobile` or root redirect).
- Demo walkthrough script mapping each role to PRD v0.7 requirements.
Include a root `jarak-aman/index.html` meta-refresh/JS redirect to `./app/index.html` (preserving `?view=` query string) so `https://<user>.github.io/<repo>/?view=mobile` works cleanly!

- [ ] **Step 2: Run full Node + Playwright verification suite and capture visual QA screenshots**

Run:
```powershell
node --test jarak-aman/tests/store.test.js
py jarak-aman/tests/e2e_smoke.py
py jarak-aman/tests/e2e_mobile.py
py jarak-aman/tests/e2e_control.py
py jarak-aman/tests/e2e_closed_loop.py
```
Capture screenshots via Playwright at `1440×900` (Split Dark, Control Light, Kiosk, Marshal) and `390×844` (`?view=mobile` Light), inspect with `read_file`, fix any clipping/contrast/spacing issues, and re-run all tests after the final CSS/JS edit.

- [ ] **Step 3: Commit**

```bash
git add jarak-aman/README.md jarak-aman/.gitignore jarak-aman/index.html jarak-aman/app/
git commit -m "docs(jarak-aman): add static deploy README, root redirect, and visual QA polish"
```
