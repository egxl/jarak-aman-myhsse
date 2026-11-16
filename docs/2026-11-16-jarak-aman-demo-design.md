# Design Document: JARAK AMAN — Polished 4-Role Interactive HSSE Demo (MyHSSE v0.7)

**Date:** 2026-11-16  
**Project:** Action Learning Project (ALP) Kelompok 36 — PT Pelabuhan Indonesia (Persero)  
**Target Audience:** Tim K3 / HSSE Pelindo, Tim MyHSSE (Bli Putu), Mentor & Coach  
**Source Specs:**
- [PRD_JARAK_AMAN_MyHSSE_v0.7.md](file:///c:/GitHub/PELINDO/jarak-aman/PRD_JARAK_AMAN_MyHSSE_v0.7.md)
- [Handbook_Presentasi_ALP36_JARAK_AMAN_v3.md](file:///c:/GitHub/PELINDO/jarak-aman/Handbook_Presentasi_ALP36_JARAK_AMAN_v3.md)
- Existing prototype baseline: [JARAK AMAN — Prototipe UI UX.html](file:///c:/GitHub/PELINDO/jarak-aman/JARAK%20AMAN%20%E2%80%94%20Prototipe%20UI%20UX.html)

---

## 1. Intent & Why

Pelindo's Kelompok 36 ALP deliverables are a ready-to-build software recommendation for MyHSSE (not a live field pilot). The existing v0.7 prototype was exported from Claude Artifacts as a double-bundled `<x-dc>` page containing two disconnected, fixed-size iframes (`860×1000` Mobile, `1440×2500` Control Room) with an `Unpacking...` loader.

This project unpacks, unifies, and visually polishes the prototype into a **live-demo-ready 4-role Pelindo MyHSSE suite** tailored for an HSSE stakeholder walkthrough and live projector/QR demonstration.

---

## 2. Goals, Non-Goals, and Anti-Goals

### Goals
1. **Closed-loop interactive storytelling:** Actions in one role immediately reflect in the others (e.g., Mobile near-miss report → Control Room Alarm Queue & Induction Drafts; Control Room evacuation / route closure → Mobile alert & reroute; Gate Kiosk check-in → Control Room headcount; Titik Kumpul roll-call → SAR reconciliation).
2. **Projector & mobile readiness:** Fits a `1440×900` / `1280×720` laptop projector without a `2500px` vertical scroll, and remains usable on mobile phones when scanned via QR code.
3. **Zero-build portability:** Opens directly via `file://` double-click in Chrome/Edge on Windows (no Node server, no ES module CORS failures) and works identically on static web hosting.
4. **Full Phase 1 (P0) & Phase 1b (P1) PRD v0.7 coverage:** Adds the three missing Phase 1/1b operational views (`Kiosk Pos Gate`, `Tablet Titik Kumpul`, and Control Room `Kepatuhan & Titik Rawan`) plus Android persistent-notification parity (`F10`).
5. **Visual & UX polish:** Unified **Pelindo Corporate Blue/Gold** design system with a global **Light / Dark theme toggle**, clear MyHSSE module framing, crisp typography, smooth micro-transitions, and unambiguous emergency color semantics.

### Non-Goals (Strictly Excluded per PRD v0.7)
- No hardware sensors, UWB vests, BLE beacons, Cabin HUD, or automated BMKG API integration (those remain labeled as Roadmap Phase 2–3 in documentation/info badges only, never active Phase 1 controls).
- No real backend, real camera AI inference, or production MyHSSE API integration (all data is simulated client-side with realistic Pelindo Tanjung Priok sample data).

### Anti-Goals (Failure Modes Even If It Technically Works)
- **Cluttered/overwhelmed projector screen:** Control Room tabs must avoid cramming all 4 roles or 2500px of panels into one unreadable wall of cards.
- **Lost demo flow:** Preserving the 10 quick-jump Mobile scenarios (`Coba Skenario`) is mandatory so presenters can jump straight to any moment during HSSE Q&A without clicking through 6 prerequisites.
- **Broken `file://` execution:** Using `<script type="module">` or `fetch()` against local JSON files would fail when opened from Windows Explorer.

---

## 3. Approaches Considered

| Approach | Summary | Trade-offs | Decision |
| :--- | :--- | :--- | :--- |
| **A. Unpacked 2-Board Unified Demo** | Unpack Mobile + Control Room into clean HTML/JS with live sync and visual polish. | Preserves exact 2-screen deck parity, but omits Kiosk Gate (`FR-11.8`), Titik Kumpul tablet (`FR-3.3`), and full compliance heatmap (`FR-7.7`/`FR-7.12`). | Not chosen |
| **B. Minimal In-Place Visual Facelift** | Keep `<x-dc>` runtime and 2 independent boards; only adjust CSS and sizing. | Fastest, lowest refactor risk, but leaves boards disconnected and hard to extend. | Not chosen |
| **C. Full 4-Role Pelindo MyHSSE Suite** | Unpack into clean zero-build JS + build all 4 roles (`HP Pekerja`, `Ruang Kendali`, `Kiosk Pos Gate`, `Tablet Titik Kumpul`) + `Split View`, viewport-fit Control Room tabs, live sync, and unified Pelindo Blue/Gold Light/Dark theme. | Highest demo completeness across PRD Phase 1 & 1b; requires structured modular UI and disciplined tab layout so projector view stays uncluttered. | **Selected by user** |

---

## 4. Constraints & Deployment Model

- **Execution & deployment environment:** Must work zero-build via `file:///c:/GitHub/PELINDO/jarak-aman/app/index.html` on Windows **and** deploy cleanly as static files to free hosting (GitHub Pages / Cloudflare Pages / Netlify) from a dedicated git repository.
- **No backend / no WebSocket server:** Audience phones scanning a QR code load `?view=mobile` as an independent, self-contained interactive demo (with all 10 scenarios + simulated Control Room triggers inside the mobile view). Meanwhile, live 4-role synchronization (`HP Pekerja` ↔ `Ruang Kendali` ↔ `Kiosk Gate` ↔ `Petugas Titik Kumpul`) runs inside the presenter's single browser window (`Split View` and top-bar role tabs, plus `BroadcastChannel` for same-origin tabs on `http(s)://`).
- **No ES module CORS failures on `file://`:** Plain HTML5 + CSS3 + vanilla ES6 loaded via ordered `<script defer>` tags (optional Google Fonts `Plus Jakarta Sans` / `IBM Plex Sans` + `IBM Plex Mono` with clean system font fallbacks so offline demos still look sharp).
- **Language & copy accuracy:** Primary UI in Bahasa Indonesia matching PRD v0.7 & Handbook v3 terminology (`Safety induction`, `Titik kumpul`, `TKBM`, `Near miss`, `LATIHAN`, `Komandan insiden`), with **ID / EN toggle on Kiosk Pos Gate** (`FR-5.4` for guests/ABK).
- **Sample data integrity:** Retain the realistic 24-person Tanjung Priok manifest (`Andi` through `Zaenal`), 8 equipment units (`QC-02`..`TT-21`), and Sustainability Report 2025 citations (`31 korban 2023–2025`, `86% dermaga`, `57% benturan`) clearly marked as `Data contoh`.

---

## 5. Architecture & File Layout

```text
jarak-aman/
├── app/
│   ├── index.html          # Shell: top MyHSSE demo bar, role switcher, theme toggle, modal host
│   ├── css/
│   │   ├── tokens.css      # Pelindo Blue/Gold palette + [data-theme="dark" | "light"] tokens
│   │   ├── layout.css      # Shell bar, Split View, responsive mobile/tablet/kiosk frames
│   │   └── views.css       # Role-specific component styles (map, island, alarm queue, tables)
│   └── js/
│       ├── data.js         # Initial seed data (24 workers, 8 equipment, 10 induction items, CLSR cats, route)
│       ├── store.js        # Central reactive Store + BroadcastChannel('jarak-aman-v07') + 1s simulation tick
│       ├── views/
│       │   ├── mobile.js   # Role 1: MyHSSE Worker Phone + 10-scenario quick-jump + iOS/Android toggle
│       │   ├── control.js  # Role 2: Control Room 3-tab viewport-fit console + 2-step Evac modal
│       │   ├── kiosk.js    # Role 3: Gate Kiosk (Tanpa HP / TKBM / Sopir / Tamu ID-EN + APD check)
│       │   └── marshal.js  # Role 4: Petugas Titik Kumpul tablet (offline toggle, bulk roll-call, override)
│       └── app.js          # Top bar wiring, view router (split/mobile/control/kiosk/marshal), toast & reset
```

*Builder call:* Grouping into `app/index.html` + `css/` + `js/` using plain `window.JARAK_AMAN` namespace and `<script defer>` ensures clean code organization without breaking `file://` execution.

---

## 6. Visual Design System (Pelindo Blue/Gold + Unified Light/Dark Theme)

### Brand & Semantic Tokens (`tokens.css`)
- **Pelindo Maritime Blue (Primary):**
  - Deep Navy: `#071A33` (Dark bg base) / `#0A2E5C` (Primary brand headers, primary CTA in Light mode)
  - Pelindo Blue: `#00579B` / `#1D6FD6` (Interactive focus, active worker pins, links)
  - Ice Blue Tint: `#E8F1FB` (Light surfaces) / `#102847` (Dark elevated surfaces)
- **Pelindo Gold (Corporate Accent & Highlight):**
  - Gold Primary: `#EAB308` (Dark mode highlight badges, `BARU` / MyHSSE module badge)
  - Warm Amber Gold: `#D97706` (Light mode accent, active scenario highlight)
- **Safety Semantic Signals (Never overridden by brand colors):**
  - Safe / Aman / APD OK: `#16A34A` (Light) / `#4ADE80` (Dark)
  - Warning / Waspada / Menuju / Near-miss: `#EA580C` (Light) / `#FB923C` (Dark)
  - Critical / Evakuasi / SOS / Belum Keluar: `#DC2626` (Light) / `#F87171` (Dark)
  - Unmonitored / Tanpa Aplikasi: `#64748B` / `#94A3B8`
- **Theme Behavior (`[data-theme="dark"]` & `[data-theme="light"]`):**
  - Global toggle in top bar (`Tema: Terang / Gelap`). Default on load: **Light** on `Mobile Only` / `Kiosk Gate`, **Dark** on `Split` / `Control Room` (or user-toggled unified across the entire viewport so every role adapts cleanly to the chosen theme).
  - *Builder call:* Switching the global theme button applies the chosen theme uniformly across the entire app shell and all 4 role canvases, while initial load defaults to `dark` in desktop Split/Control view and `light` if opened on a narrow mobile viewport (`< 768px`) unless overridden.

---

## 7. Detailed Role & Feature Design

### Persistent Top Demo Bar (`app/index.html`)
- **Left:** Pelindo MyHSSE shield emblem + `MyHSSE · Modul JARAK AMAN v0.7` + active system phase pill (`Normal` / `EVAKUASI AKTIF` / `LATIHAN` / `PEMULIHAN`).
- **Center (View Switcher):**
  1. `Split: HP + Kendali` (Default on desktop `>= 1100px`: side-by-side interactive phone + viewport-fit Control Room)
  2. `HP Pekerja` (Phone + compact scenario strip)
  3. `Ruang Kendali` (Full-width 3-tab dashboard)
  4. `Kiosk Gate` (1024px tablet kiosk frame for workers without smartphone)
  5. `Petugas Titik Kumpul` (Tablet roll-call frame)
- **Right (Demo Controls):** `Timer ×10` toggle, `Tema: Gelap/Terang` toggle, `Reset Demo` button.

### Role 1: HP Pekerja (`mobile.js`)
- **MyHSSE Host Framing:** Subtle MyHSSE module sub-header (`MyHSSE › Keselamatan Operasi › JARAK AMAN`) inside the phone top bar so HSSE reviewers immediately see it lives inside MyHSSE rather than as a standalone app.
- **OS Notification Channel Toggle:** Pill above/beside phone to toggle **iOS (Dynamic Island + Live Activity)** vs **Android 16 (Persistent Progress Notification)** during evacuation & lock-screen views (`F10`), visibly addressing Android's ~79% field share.
- **Preserved & Enhanced 10 Scenarios (`Coba Skenario` drawer/rail):**
  1. Pendaftaran sekali (3 izin: Lokasi selalu, Notifikasi darurat, Bebas penghemat baterai)
  2. Masuk area lewat Gate 3 (auto-active toast)
  3. Safety induction harian (3 langkah: Selfie APD + konfirmasi sepatu/sarung tangan, Panduan evakuasi + 1 soal cek, Bahaya hari ini synced from Control Room)
  4. Selfie APD tidak lengkap (helm gagal → tertahan → foto ulang)
  5. Guncangan kuat terasa (evakuasi mandiri + sends live `Guncangan Kuat` alert to Control Room)
  6. Perintah evakuasi ruang kendali (live-triggered by Control Room too)
  7. Panduan di luar aplikasi (iOS Dynamic Island expand/collapse OR Android persistent progress bar)
  8. Tiba di titik kumpul (`Aman` otomatis + syncs worker `Andi` to `Aman` in Control Room & Marshal Tablet)
  9. Lapor pelanggaran / near miss ≤ 30 detik (4 kategori CLSR, foto opsional, anonim toggle, offline queue option → pushes live new alarm + induction candidate to Control Room)
  10. Keluar lewat gate (tracking berhenti otomatis)
- **Live Sync Reactions:**
  - Evacuation destination & turn-by-turn route dynamically match the active hazard & capacity: **Tsunami / Kebakaran B3** → `Gedung Evakuasi B` (vertical shelter, cap 40), **Gempa** or overflow `> 40` → `Area Terbuka Timur` (open muster area, cap 60, `FR-2.3` & `FR-2.5`).
  - When Control Room closes `Jalan Dermaga B`, Mobile's evacuation route switches visually to `Rute Cadangan via Jalan Timur` and updates turn-by-turn text.
  - When Control Room publishes a new Induction revision (`Rev N+1`) with `Wajib baca ulang`, Mobile shows a prompt banner to re-read Step 3.
  - Clicking `Butuh Bantuan (SOS)` on Mobile raises a live SOS alarm for `Andi` in Control Room & Marshal Tablet.

### Role 2: Ruang Kendali (`control.js`) — 3 Viewport-Fit Tabs
Fits comfortably inside `1440×900` / `1280×720` with an internal scrollable list only where needed (tables/alarm cards), eliminating the `2500px` full-page scroll.
- **Persistent Top Action & KPI Strip (always visible above tabs):**
  - Command center badge (`Ruang Kendali Utama` / `Pos Komando Cadangan`), clock, `Perintahkan Evakuasi` CTA (opens 2-step modal: Jenis Bahaya `Tsunami / Gempa / Kebakaran & B3`, Zona `Seluruh Terminal / Dermaga A & B`, Dasar Keputusan `Info BMKG / Laporan Lapangan / Pengamatan Langsung`, Mode `Sungguhan / LATIHAN`).
  - Active Evacuation / Recovery banner (only when `phase !== 'normal'`), with `Tutup Jalan Dermaga B`, `Pindah Pos Cadangan`, `Batalkan (Salah Kirim)`, `Cabut Status Evakuasi`, `Buka Zona Dermaga`.
  - Compact 5-card KPI strip (Gate total, Terpantau HP, Tanpa posisi/izin, Alarm terbuka, Kepatuhan Induction `x/n`).
- **Tab 1 — `Peta & Evakuasi`:**
  - Left (~60%): Interactive Terminal SVG/Canvas Map (`Laut`, `Dermaga A`, `Dermaga B`, `Lapangan C`, `Lapangan D`, `Gate 3`, `Gedung Evakuasi B x/40`, `Area Terbuka Timur x/60`), clickable worker pins & equipment markers with hover/click inspector card, closed-road hazard overlay, pulsing SOS ring, and phase-adaptive legend.
  - Right (~40%): Stacked **Antrean Alarm** (sorted by severity: `SOS 60s SLA` → `Alat Belum Berhenti` → `Belum Keluar` → `Guncangan Kuat` → `Near Miss / Pelanggaran`, with `Ambil alih` / `Tandai selesai`) + **Daftar SAR (`Orang Belum Aman`)** with working `Ekspor Daftar SAR (Preview + Download JSON/CSV)` modal.
- **Tab 2 — `Kepatuhan & Titik Rawan` (`FR-7.7`, `FR-7.12`):**
  - Top row: Induction & Tracking compliance breakdown by user group (`Pegawai Pelindo`, `TKBM`, `Sopir Truk`, `Tamu/ABK`) + `Ekspor Laporan HSSE` modal.
  - Bottom left: **Peta Titik Rawan Mingguan (Heatmap)** on the terminal grid showing aggregated near-miss/violation clusters (`Lapangan C · RS-07`, `Gate 3 · Parkir Truk`, `Dermaga B · Tepi Dermaga`), dynamically incremented when Mobile submits a new F12 report.
  - Bottom right: Filterable **Daftar Orang di Area** (`Semua` / `Belum Induction` / `APD Bermasalah` / `Tanpa Aplikasi`) showing live statuses updated from Mobile, Kiosk Gate, and Titik Kumpul.
- **Tab 3 — `Editor Induction` (`FR-11.5`, `FR-11.6`):**
  - Left: Active `Isi Langkah 3` editor (`KORBAN JIWA` locked, `KEJADIAN TERBARU`, `KELALAIAN`, `INFO ZONA`) with hide/show toggles and `Draf` / `BARU` tags.
  - Right: `Usulan dari Data Kemarin & Laporan Masuk` (pre-seeded + live Mobile F12 reports) with `Tambahkan sebagai draf`, plus **HSSE Approval Workflow** (`Kirim ke HSSE` → `Setujui & Terbitkan Rev N+1`) and `Wajibkan baca ulang setelah terbit` toggle.

### Role 3: Kiosk Pos Gate — Tanpa Smartphone (`kiosk.js`, `FR-11.8`, `FR-5.3`, `FR-5.4`)
- Styled as a clean touchscreen kiosk terminal (`Gate 3 · Pos Keamanan & K3`) with an **ID / EN language switcher** in the header.
- **3-Step Fast Gate Flow (~45–60 sec):**
  1. **Identitas & Peran:** Quick-pick role (`TKBM`, `Sopir Truk`, `Tamu / ABK / Instansi`) + presets or input (`Nama`, `No. Kartu / STID Truk`, `Jumlah Penumpang` per PRD A3 F5, `No. HP untuk SMS cadangan (opsional)`).
  2. **Ringkasan Bahaya & Aturan Wajib:** Visual 3-card safety briefing + 1-tap understanding check (`Saya Paham`).
  3. **Verifikasi APD oleh Petugas Gate:** Checklist (`Helm`, `Rompi Reflektif`, `Sepatu Safety`, toggle `Pinjam APD di Pos Gate`) + `Catat Masuk & Selesai Induction`.
- **Live Sync:** Submitting adds the worker (or updates `Made`) in Control Room's live headcount as `Di pos gate · tanpa aplikasi` and `Selesai Induction`, immediately incrementing the `Di area (data gate)` and `Induction hari ini` KPIs.

### Role 4: Tablet Petugas Titik Kumpul (`marshal.js`, `FR-3.3`)
- Styled as a rugged field tablet with an assembly-point switcher: `Gedung Evakuasi B (x / 40)` | `Area Terbuka Timur (x / 60)` (auto-highlights the active destination for the current hazard/overflow).
- **Offline-First Resilience Toggle:** `Online (Sinkron Real-time)` ↔ `Simulasi Tanpa Sinyal` (queues roll-call marks locally with an amber pending-sync counter, then flushes all updates to Control Room when switched back online!).
- **Roll-Call & Reconciliation Controls:**
  - Filter tabs: `Semua di Daftar Gate`, `Perlu Konfirmasi (Tanpa HP / Belum Tiba)`, `Sudah Aman`.
  - **Mode Hitung Massal** (quick checkboxes for wave arrivals) + per-row action (`Konfirmasi Aman`, `Batalkan / Override`, `Tandai Butuh Bantuan`).
  - Explicitly displays the PRD rule: *Catatan petugas titik kumpul menjadi sumber kebenaran jika berbeda dari geofence otomatis.*

---

## 8. Verification Plan (For Implementation)

1. **`file://` Smoke Check:** Open `jarak-aman/app/index.html` directly via `file://` in headless/real browser — zero console errors, zero blocked requests, fonts fall back cleanly offline.
2. **Closed-Loop Sync Checks:**
   - Mobile near-miss → Control Room Alarm Queue + Induction Drafts + Heatmap cluster count.
   - Control Room Evacuate (`Sungguhan` & `LATIHAN`) + Close `Jalan Dermaga B` → Mobile switches to alert & backup route; Marshal Tablet switches to active roll-call.
   - Kiosk Gate new TKBM check-in → Control Room KPI & worker table increase by 1 (`Tanpa aplikasi`).
   - Marshal Tablet offline toggle → mark 2 workers Aman → toggle Online → Control Room Aman count & capacity `x/40` sync.
3. **Viewport & Theme Checks:** Verify `1440×900` Control Room tabs fit without vertical page bloat, `390×844` phone view works cleanly on mobile widths, and both `Light` and `Dark` Pelindo themes maintain readable contrast across all 4 roles.

---

## 9. Decision-Making Process & Settled Architectural Calls

These decisions resolve all open questions before implementation planning:

1. **QR Code & Multi-Window Sync (`?view=mobile` standalone vs. single-window 4-role sync):**
   - *Options considered:* (a) Add a free cloud WebSocket/Firebase relay for cross-device sync, vs. (b) Keep static zero-backend hosting (`GitHub Pages` / `Netlify` / `file://`) where QR codes open `?view=mobile` independently on audience phones and live 4-role sync runs in the presenter's browser (`Split View` / role tabs + `BroadcastChannel` on `http(s)`).
   - *Decision:* **(b) Static zero-backend.** Prevents `file://` opaque-origin failures, avoids brittle third-party keys/rate limits during a live HSSE presentation, and makes free deployment trivial.
2. **Assembly Points: 1 (`Gedung Evakuasi B`) vs. 2 (`Gedung Evakuasi B` + `Area Terbuka Timur`) — Deep Analysis:**
   - *Options considered:* (a) Single assembly point `Gedung Evakuasi B` (cap 40) with changing text banners only, vs. (b) Two assembly points: `Gedung Evakuasi B` (vertical shelter, cap 40, default for **Tsunami** & **Kebakaran/B3** upwind) and `Area Terbuka Timur` (open muster area, cap 60, for **Gempa** & capacity overflow `> 40`).
   - *Why (b) wins on K3 domain credibility:* PRD `FR-2.3` explicitly requires routing *away from structures* during earthquakes (`Gempa: ke area terbuka, jauh dari tumpukan kontainer, crane, dan tepi dermaga`) and `FR-2.5` requires capacity-based overflow splitting. Sending workers *inside* a building (`Gedung Evakuasi B`) during a simulated **Gempa** would trigger an immediate K3 SOP objection from Pelindo HSSE reviewers. Adding a 2nd open-air zone at the eastern boundary costs ~40 lines of route/SVG data while demonstrating both `FR-2.3` and `FR-2.5` authentically.
   - *Builder rule:* `Pindah Pos Cadangan` changes only the command center header (`Pos Komando Cadangan` tablet) and does not alter worker routing.
3. **Mobile `Coba Skenario` Quick-Jump Sync Rule:**
   - *Decision:* Clicking a scenario button in `Coba Skenario` applies a **deterministic snapshot** to `Andi` and the shared evacuation phase (e.g., jumping to Scenario 4 marks `Andi` as `APD tidak lengkap · helm` in Control Room; Scenario 5/6/7 puts `Andi` in active evacuation; Scenario 8 marks `Andi` `Aman` at the active assembly point; Scenario 10 marks `Andi` exited/outside), while preserving Kiosk-added workers and other Marshal roll-call edits. `Reset Demo` restores the clean baseline.
4. **Zone-Scoped Evacuation & Recovery (`Dermaga A & B` vs. `Seluruh Terminal`):**
   - *Decision:* When `Perintahkan Evakuasi` targets `Dermaga A & B`, only workers assigned to `Dermaga A` or `Dermaga B` (including `Andi`) enter evacuation/SAR tracking; workers in `Lapangan C`, `Lapangan D`, and `Gate 3` remain `Aktif` (`Normal`). `Cabut Status Evakuasi` transitions to `PEMULIHAN` (keeping `Dermaga A & B` closed on the map and warning Mobile if entered), and `Buka Zona Dermaga` returns the terminal to `Normal`.
5. **Kiosk `Jumlah Penumpang` Modeling:**
   - *Decision:* When Kiosk Gate submits `Jumlah Penumpang > 0` (e.g. a truck with 1–2 helpers/kenek), `store.js` spawns linked individual worker rows (e.g. `Penumpang 1 · STID B-9123`) alongside the driver so `Di area (data gate)`, `Daftar SAR`, assembly capacity (`x/40`), and Marshal's per-person `Konfirmasi Aman` / `Mode Hitung Massal` reconcile 1-to-1 without hidden math.

## 10. Left to the Builder

- Exact CSS spacing, shadow/elevation tokens, and SVG coordinate tuning inside the shared `700×420`-ratio terminal map.
- Exact micro-copy on confirmation toasts and SAR export JSON/CSV preview formatting.
