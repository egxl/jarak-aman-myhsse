(function (root) {
  'use strict';

  const NS = (root.JARAK_AMAN = root.JARAK_AMAN || {});
  NS.Views = NS.Views || {};

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function pad(n) {
    return String(n).padStart(2, '0');
  }

  const SCENARIOS = [
    { key: 'reg', short: 'Daftar Awal', title: '1. Pendaftaran pertama kali', desc: 'Sekali saja: izin lokasi, notifikasi darurat, baterai' },
    { key: 'enter', short: 'Masuk Gate 3', title: '2. Masuk area lewat Gate 3', desc: 'Aktif otomatis dari transaksi gate, tanpa pindai' },
    { key: 'induct', short: 'Induction', title: '3. Safety induction harian', desc: 'Selfie APD, panduan evakuasi, info bahaya hari ini' },
    { key: 'apdfail', short: 'APD Gagal', title: '4. Selfie APD tidak lengkap', desc: 'Helm tidak terdeteksi, induction tertahan' },
    { key: 'mandiri', short: 'Guncangan', title: '5. Guncangan kuat terasa', desc: 'Evakuasi mandiri di HP + kirim laporan ke Kendali' },
    { key: 'bmkg', short: 'Evak Kendali', title: '6. Perintah evakuasi ruang kendali', desc: 'Panah gerak GPS, peta rute, timer' },
    { key: 'island', short: 'Luar Aplikasi', title: '7. Panduan di luar aplikasi', desc: 'Panduan tetap aktif di iOS Dynamic Island & layar kunci' },
    { key: 'arrive', short: 'Titik Kumpul', title: '8. Tiba di titik kumpul', desc: 'Geofence + petugas mencatat Aman, sinkron ke SAR' },
    { key: 'report', short: 'Lapor F12', title: '9. Lapor pelanggaran / near miss', desc: '≤ 30 dtk, kategori CLSR, langsung masuk Ruang Kendali' },
    { key: 'out', short: 'Gate OUT', title: '10. Keluar lewat gate', desc: 'Tracking berhenti otomatis saat Gate OUT' }
  ];

  function computeNav(state) {
    const route = NS.getActiveRoute(state);
    const dest = NS.getEvacDestination(state);
    const segs = route.segments;
    const totalLen = segs.reduce((a, r) => a + r.len, 0);
    const elapsed = Math.max(0, state.evacTotal - state.evacLeft);
    const pos = Math.min(totalLen, elapsed * 1.5);

    let i = 0;
    let start = 0;
    while (i < segs.length - 1 && pos >= start + segs[i].len) {
      start += segs[i].len;
      i += 1;
    }
    const seg = segs[i];
    const toTurn = Math.max(0, Math.round(start + seg.len - pos));
    const remain = Math.max(0, Math.round(totalLen - pos));

    let deg = 0;
    let stepText = seg.straight;
    let stepSub = '';
    let islandShort = toTurn + ' m';
    let haptic = 'Getar 2× kanan · 3× kiri';

    if (state.mobile.wrong) {
      deg = 180;
      stepText = 'Putar balik';
      stepSub = 'Menjauh dari rute · getar panjang';
      islandShort = 'Putar balik';
      haptic = 'Getar panjang = putar balik';
    } else if (seg.turn && toTurn <= 30) {
      deg = seg.turn === 'kanan' ? 90 : -90;
      stepText = seg.turnText;
      stepSub = `dalam ${toTurn} m`;
      islandShort = `${seg.turn === 'kanan' ? 'Kanan' : 'Kiri'} ${toTurn} m`;
      haptic = seg.turn === 'kanan' ? 'Bergetar 2× = belok kanan' : 'Bergetar 3× = belok kiri';
    } else if (seg.turn) {
      stepSub = `${toTurn} m, lalu ${seg.turnText.charAt(0).toLowerCase()}${seg.turnText.slice(1)}`;
    } else {
      stepSub = `${toTurn} m lagi · pintu masuk aman`;
    }

    const P = route.svgPts;
    const allPts = P.map((p) => p.join(',')).join(' ');
    let totalPx = 0;
    for (let k = 0; k < P.length - 1; k++) {
      totalPx += Math.hypot(P[k + 1][0] - P[k][0], P[k + 1][1] - P[k][1]);
    }
    let remPx = (pos / Math.max(1, totalLen)) * totalPx;
    const done = [P[0]];
    let dot = P[0];
    for (let k = 0; k < P.length - 1; k++) {
      const a = P[k];
      const b = P[k + 1];
      const L = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (remPx >= L) {
        done.push(b);
        dot = b;
        remPx -= L;
      } else {
        const t = L ? remPx / L : 0;
        dot = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
        done.push(dot);
        break;
      }
    }

    return {
      route,
      dest,
      pos,
      totalLen,
      remain,
      deg,
      stepText,
      stepSub,
      islandShort,
      haptic,
      allPts,
      donePts: done.map((p) => `${Math.round(p[0])},${Math.round(p[1])}`).join(' '),
      dotX: Math.round(dot[0]),
      dotY: Math.round(dot[1]),
      pct: Math.min(100, Math.round((pos / Math.max(1, totalLen)) * 100)),
      timerText: `${pad(Math.floor(state.evacLeft / 60))}:${pad(state.evacLeft % 60)}`,
      stopped: elapsed >= 30
    };
  }

  function getPublishedInductionItems(state) {
    const D = NS.DATA;
    const added = state.induction.candidates
      .filter((c) => state.induction.addedIds[c.id])
      .map((c) => ({ id: c.id, cat: c.cat, text: c.text, meta: `${c.src} · baru ditambahkan`, isNew: true }));
    return D.INDUCTION_BASE.concat(added).filter((it) => !state.induction.hiddenIds[it.id]);
  }

  function renderMiniMapSvg(state) {
    const dest = NS.getEvacDestination(state);
    const toTimur = dest && dest.id === 'area-timur';
    const workerX = 114;
    const workerY = 38;
    const targetX = toTimur ? 222 : 254;
    const targetY = toTimur ? 92 : 66;
    const midX = Math.round((workerX + targetX) / 2);
    const midY = Math.round((workerY + targetY) / 2) - 8;
    return `
      <div style="padding:8px 10px 9px;border-radius:12px;background:var(--phone-card-alt);border:1px solid var(--phone-border)">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <span style="font-size:12px;font-weight:700;color:var(--phone-accent);letter-spacing:0.02em">Peta Posisi Terminal</span>
          <span style="font-size:12px;font-weight:600;color:var(--sig-safe)">Geofence: Terkunci</span>
        </div>
        <svg viewBox="0 0 340 108" style="width:100%;height:auto;display:block;border-radius:8px;background:var(--map-bg);border:1px solid var(--phone-border)">
          <defs>
            <pattern id="miniMapPortGrid" width="16" height="16" patternUnits="userSpaceOnUse">
              <path d="M 16 0 L 0 0 0 16" fill="none" stroke="var(--map-grid)" stroke-width="0.75"/>
            </pattern>
            <linearGradient id="miniMapSeaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" style="stop-color:var(--map-sea-top);stop-opacity:0.95"/>
              <stop offset="100%" style="stop-color:var(--map-sea-bot);stop-opacity:0.65"/>
            </linearGradient>
            <linearGradient id="miniMapPuckBeam" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" style="stop-color:var(--phone-accent);stop-opacity:0.45"/>
              <stop offset="100%" style="stop-color:var(--phone-accent);stop-opacity:0"/>
            </linearGradient>
          </defs>
          <rect width="340" height="108" fill="url(#miniMapPortGrid)"/>
          <rect x="0" y="0" width="340" height="24" fill="url(#miniMapSeaGrad)"/>
          <line x1="0" y1="24" x2="340" y2="24" stroke="var(--brand-blue)" stroke-width="1" stroke-dasharray="3 3" opacity="0.65"/>
          <text x="8" y="14" fill="var(--map-sea-fg)" font-size="8.5" font-weight="700">LAUT JAWA · DERMAGA A / B</text>

          <!-- Quay Cranes -->
          <rect x="20" y="18" width="28" height="12" rx="2.5" fill="var(--map-equip-bg)" stroke="var(--map-sea-fg)" stroke-width="1"/>
          <text x="34" y="27" fill="var(--map-equip-fg)" font-size="7.5" font-weight="700" text-anchor="middle">QC-01</text>
          <rect x="56" y="18" width="28" height="12" rx="2.5" fill="var(--map-equip-bg)" stroke="var(--sig-warn)" stroke-width="1"/>
          <text x="70" y="27" fill="var(--sig-warn)" font-size="7.5" font-weight="700" text-anchor="middle">QC-02</text>

          <!-- Container Blocks C01-C04 -->
          <rect x="16" y="42" width="32" height="14" rx="2.5" fill="var(--map-block-bg)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
          <text x="32" y="52" fill="var(--map-block-fg)" font-size="7.5" text-anchor="middle">C01</text>
          <rect x="54" y="42" width="32" height="14" rx="2.5" fill="var(--map-block-bg)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
          <text x="70" y="52" fill="var(--map-block-fg)" font-size="7.5" text-anchor="middle">C02</text>
          <rect x="92" y="42" width="32" height="14" rx="2.5" fill="var(--map-block-bg)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
          <text x="108" y="52" fill="var(--map-block-fg)" font-size="7.5" text-anchor="middle">C03</text>
          <rect x="130" y="42" width="34" height="14" rx="2.5" fill="var(--brand-blue-bg)" stroke="var(--phone-accent)" stroke-width="1"/>
          <text x="147" y="52" fill="var(--phone-accent)" font-size="7.5" font-weight="700" text-anchor="middle">C04</text>

          <!-- Haulage Lane -->
          <line x1="16" y1="68" x2="210" y2="68" stroke="var(--map-road-bg)" stroke-width="5"/>
          <line x1="16" y1="68" x2="210" y2="68" stroke="var(--map-road-line)" stroke-width="0.8" stroke-dasharray="4 4"/>
          <text x="16" y="79" fill="var(--map-road-fg)" font-size="7" font-weight="600">JALUR ALAT BERAT · RS-07 AKTIF</text>

          <!-- Gate 3 -->
          <rect x="16" y="85" width="76" height="17" rx="3.5" fill="var(--map-yard-bg)" stroke="var(--map-deck-stroke)" stroke-width="0.9"/>
          <text x="54" y="96.5" fill="var(--map-block-fg)" font-size="7.5" font-weight="700" text-anchor="middle">GATE 3 · IN/OUT</text>

          <!-- Assembly POIs -->
          <g transform="translate(246, 36)">
            <rect x="0" y="0" width="84" height="42" rx="6" fill="var(--map-safe-bg)" stroke="var(--sig-safe)" stroke-width="1.2"/>
            <circle cx="13" cy="14" r="6" fill="var(--sig-safe)"/>
            <path d="M10 14l2 2 4-4" stroke="var(--map-pin-ring)" stroke-width="1.4" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
            <text x="23" y="16" fill="var(--map-safe-sub)" font-size="8" font-weight="700">GEDUNG B</text>
            <text x="8" y="32" fill="var(--map-safe-fg)" font-size="7">Titik Kumpul · 0/40</text>
          </g>
          <rect x="180" y="82" width="60" height="20" rx="4" fill="var(--brand-gold-bg)" stroke="var(--brand-gold)" stroke-width="1" stroke-dasharray="3 2"/>
          <text x="210" y="94.5" fill="var(--brand-gold-fg)" font-size="7" font-weight="700" text-anchor="middle">AREA TIMUR</text>

          <!-- Preview Evac Path -->
          <path d="M ${workerX} ${workerY} Q ${midX + 6} ${targetY} ${targetX} ${targetY}" fill="none" stroke="var(--sig-safe)" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round"/>

          <!-- Distance Pill (placed cleanly along lower curve) -->
          <g transform="translate(${midX - 18}, ${targetY - 7})">
            <rect width="50" height="14" rx="7" fill="var(--map-pill-bg)" stroke="var(--map-pill-border)" stroke-width="0.7"/>
            <text x="25" y="9.5" fill="var(--map-pill-fg)" font-size="7" font-weight="600" text-anchor="middle">320m · ~3m</text>
          </g>

          <!-- Apple Maps Location Puck + Cone -->
          <g transform="translate(${workerX}, ${workerY})">
            <polygon points="0,0 24,-10 24,10" fill="url(#miniMapPuckBeam)"/>
            <circle cx="0" cy="0" r="11" fill="var(--phone-accent)" opacity="0.24"/>
            <circle cx="0" cy="0" r="5" fill="var(--brand-blue)" stroke="var(--map-pin-ring)" stroke-width="1.8"/>
            <rect x="8" y="-14" width="68" height="13" rx="6.5" fill="var(--map-pill-bg)" stroke="var(--map-pill-border)" stroke-width="0.6"/>
            <text x="13" y="-5" fill="var(--map-pill-fg)" font-size="7" font-weight="600">Andi · Dermaga A</text>
          </g>
        </svg>
      </div>
    `;
  }

  function renderTopBar(state, inside) {
    const chipBg = inside ? 'var(--sig-safe-bg)' : 'var(--sig-muted-bg)';
    const chipFg = inside ? 'var(--sig-safe)' : 'var(--sig-muted)';
    const chipLabel = inside ? 'Aktif otomatis' : 'Di luar area';
    return `
      <div class="phone-myhsse-bar">
        <span class="phone-breadcrumb">MyHSSE · Keselamatan Operasi</span>
        <span class="mono" style="font-size:12px;color:var(--phone-muted)">REV ${state.induction.rev}</span>
      </div>
      <div class="phone-title-row">
        <div style="display:flex;align-items:center;gap:7px">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--phone-accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"></path><path d="M8.5 12l2.5 2.5 4.5-5"></path></svg>
          <strong style="font-size:15px;letter-spacing:0.02em">JARAK AMAN</strong>
        </div>
        <span style="font-size:12px;font-weight:700;padding:3px 10px;border-radius:999px;background:${chipBg};color:${chipFg}">${chipLabel}</span>
      </div>
    `;
  }

  function renderScreen(state) {
    const m = state.mobile;
    const scr = m.screen;
    const D = NS.DATA;

    if (scr === 'outside' || scr === 'out') {
      const isExit = scr === 'out';
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:12px;padding:10px 16px 16px">
          <div style="height:152px;border-radius:16px;background:var(--phone-card-alt);border:1px solid var(--phone-border);display:flex;align-items:center;justify-content:center">
            <svg width="144" height="100" viewBox="0 0 160 120" fill="none" stroke="var(--phone-accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 110V30h16v80"></path><path d="M36 50h104"></path><path d="M36 50l12-12h92"></path>
              <path d="M124 110V50"></path><path d="M6 110h148"></path>
              <path d="M70 82h40" style="stroke-dasharray:6 6"></path><path d="M100 74l10 8-10 8"></path>
            </svg>
          </div>
          <h2 style="margin:0;font-size:20px;line-height:1.25">${isExit ? 'Anda keluar area pelabuhan' : 'Anda di luar area pelabuhan'}</h2>
          <p style="margin:0;font-size:13px;line-height:1.5;color:var(--phone-muted)">${isExit
            ? 'Transaksi Gate OUT tercatat. Pemantauan lokasi otomatis berhenti untuk menjaga privasi Anda.'
            : 'JARAK AMAN aktif sendiri saat Anda melewati gate seperti biasa. Tidak perlu check-in atau memindai QR.'}</p>
          <div style="padding:12px;border-radius:12px;background:var(--phone-card-alt);border:1px solid var(--phone-border);display:flex;flex-direction:column;gap:4px">
            <strong style="font-size:13.5px">Terdaftar · Andi (Checker · Pegawai)</strong>
            <span style="font-size:12px;color:var(--phone-muted)">Izin lokasi &amp; notifikasi darurat aktif · induction terakhir kemarin 07.15</span>
          </div>
          <div style="margin-top:auto;padding:12px;border-radius:12px;background:var(--brand-blue-bg);font-size:12px;line-height:1.45;color:var(--phone-fg)">
            Tanpa smartphone? Anda tetap terdata lewat transaksi gate dan Kiosk Pos Gate, serta dihitung saat evakuasi.
          </div>
        </div>
      `;
    }

    if (scr === 'perm') {
      const allOk = m.locPerm && m.notifPerm && m.batExempt;
      const permCard = (key, title, sub, on) => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:12px;border:1.5px solid ${on ? 'var(--sig-safe)' : 'var(--phone-accent)'};background:var(--phone-card)">
          <div style="flex:1;min-width:0">
            <div style="font-size:13.5px;font-weight:700">${title}</div>
            <div style="font-size:12px;color:var(--phone-muted)">${sub}</div>
          </div>
          ${on
            ? `<span style="font-size:12px;font-weight:700;color:var(--sig-safe);white-space:nowrap">Diizinkan</span>`
            : `<button data-mobile-action="grant-${key}" class="btn-primary" style="padding:6px 12px;font-size:12px;white-space:nowrap">Izinkan</button>`}
        </div>
      `;
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:10px;padding:10px 16px 16px">
          <div>
            <h2 style="margin:0 0 4px;font-size:20px;line-height:1.25">Izinkan tiga akses perangkat</h2>
            <p style="margin:0;font-size:12.5px;line-height:1.45;color:var(--phone-muted)">Pendaftaran cukup sekali. Modul MyHSSE bekerja otomatis hanya di dalam area pelabuhan.</p>
          </div>
          ${permCard('loc', 'Lokasi: selalu', 'Hanya direkam di dalam geofence saat shift', m.locPerm)}
          ${permCard('notif', 'Notifikasi darurat', 'Berbunyi menembus mode senyap saat bahaya', m.notifPerm)}
          ${permCard('bat', 'Bebas penghemat baterai', 'Mencegah sistem mematikan heartbeat', m.batExempt)}
          <div style="padding:10px 12px;border-radius:12px;background:var(--sig-warn-bg);color:var(--sig-warn-fg);font-size:12px;line-height:1.45">
            <strong>Penting:</strong> aplikasi tidak menggantikan SOP evakuasi mandiri. Bila guncangan kuat terasa di dekat pantai, segera menjauh ke tempat tinggi.
          </div>
          <button data-mobile-action="finish-reg" class="btn-primary" style="width:100%;height:44px;margin-top:auto" ${allOk ? '' : 'disabled'}>Selesai Pendaftaran</button>
        </div>
      `;
    }

    if (scr === 'home') {
      const rereadAlert = state.induction.rereadRequired && !state.induction.rereadAcked;
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:8px;padding:8px 16px 14px">
          ${m.toastLeft > 0 && m.toast ? `<div style="padding:8px 12px;border-radius:10px;background:var(--sig-safe-bg);color:var(--sig-safe-fg);font-size:12px;font-weight:600;border:1px solid var(--sig-safe)">${esc(m.toast)}</div>` : ''}
          ${rereadAlert ? `
            <button data-mobile-action="open-reread" style="text-align:left;padding:9px 12px;border-radius:12px;border:1.5px solid var(--brand-gold);background:var(--brand-gold-bg);color:var(--brand-gold-fg);display:flex;justify-content:space-between;align-items:center;gap:8px">
              <div>
                <div style="font-size:12px;font-weight:800">INFO DARURAT BARU · REV ${state.induction.rev}</div>
                <div style="font-size:12px">HSSE mewajibkan baca ulang Langkah 3.</div>
              </div>
              <span style="font-size:12px;font-weight:800;white-space:nowrap">Buka →</span>
            </button>
          ` : ''}
          ${m.indDone
            ? `<div style="padding:9px 12px;border-radius:10px;background:var(--sig-safe-bg);color:var(--sig-safe-fg);font-size:12px;font-weight:600">Safety induction selesai 07.15 WIB · berlaku sampai keluar gate</div>`
            : `<button data-mobile-action="start-ind" style="text-align:left;padding:10px 12px;border-radius:12px;border:1.5px solid var(--sig-warn);background:var(--sig-warn-bg);color:var(--sig-warn-fg);display:flex;justify-content:space-between;align-items:center;gap:10px">
                <div>
                  <div style="font-size:13.5px;font-weight:800">Safety induction · langkah ${m.indStep} dari 3</div>
                  <div style="font-size:12px">Selfie APD, panduan evakuasi, info bahaya</div>
                </div>
                <span style="font-size:18px;font-weight:800">›</span>
              </button>`}

          <div style="padding:10px 12px;border-radius:12px;background:var(--phone-card-alt);border:1px solid var(--phone-border)">
            <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700">
              <span style="width:8px;height:8px;border-radius:50%;background:var(--sig-safe);flex:none"></span>
              <span>Terminal Petikemas · Dermaga A</span>
            </div>
            <div style="font-size:12px;color:var(--phone-muted);margin-top:3px;line-height:1.4">
              Gate 3, 07.12 WIB · posisi zona aktif di Ruang Kendali.
            </div>
          </div>

          <button data-mobile-action="go-report" style="text-align:left;padding:10px 12px;border-radius:12px;border:1.5px solid var(--phone-accent);background:var(--phone-card);color:var(--phone-fg);display:flex;align-items:center;gap:10px">
            <span style="width:34px;height:34px;border-radius:9px;background:var(--brand-blue-bg);color:var(--phone-accent);display:grid;place-items:center;font-weight:800;flex:none">!</span>
            <span>
              <strong style="display:block;font-size:13.5px">Lapor pelanggaran / near miss</strong>
              <span style="font-size:12px;color:var(--phone-muted)">≤ 30 detik · lokasi otomatis · boleh anonim</span>
            </span>
          </button>

          ${renderMiniMapSvg(state)}

          <div style="display:flex;flex-direction:column;gap:8px;margin-top:auto">
            <button data-mobile-action="start-shake" style="text-align:left;padding:10px 12px;border-radius:12px;border:1.5px solid var(--sig-warn);background:var(--sig-warn-bg);color:var(--sig-warn-fg)">
              <strong style="display:block;font-size:13.5px">Saya merasakan guncangan kuat</strong>
              <span style="font-size:12px">Mulai panduan evakuasi mandiri sekarang</span>
            </button>
            <button data-mobile-action="go-sos" class="btn-danger" style="width:100%;height:42px;border-radius:12px">Butuh bantuan (SOS)</button>
          </div>
        </div>
      `;
    }

    if (scr === 'ind') {
      const step = m.indStep;
      const bars = [1, 2, 3].map((n) => `<span style="flex:1;height:4px;border-radius:2px;background:${n < step ? 'var(--sig-safe)' : (n === step ? 'var(--brand-gold)' : 'var(--phone-border)')}"></span>`).join('');

      if (step === 1) {
        const shot = m.indShot !== 'none';
        const fail = m.indShot === 'fail';
        let nextLabel = 'Ambil foto';
        let blocked = '';
        if (shot && fail) nextLabel = 'Foto ulang (sudah pakai helm)';
        else if (shot && !m.shoes) blocked = 'Konfirmasi sepatu safety untuk lanjut';
        else if (shot && m.shoes) nextLabel = 'Lanjut';

        return `
          <div style="flex:1;display:flex;flex-direction:column;gap:8px;padding:8px 16px 14px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="font-size:13px;color:var(--phone-muted)">Safety Induction · 1 dari 3</strong>
            </div>
            <div style="display:flex;gap:5px">${bars}</div>
            <h2 style="margin:0;font-size:18px;line-height:1.25">Selfie dengan APD lengkap</h2>
            <p style="margin:0;font-size:12px;color:var(--phone-muted);line-height:1.4">Helm dan rompi diperiksa otomatis di HP (tanpa pengenalan wajah).</p>
            <div style="position:relative;height:136px;border-radius:14px;background:#102235;display:flex;align-items:center;justify-content:center;overflow:hidden">
              <svg viewBox="0 0 220 160" style="width:176px;height:128px">
                <circle cx="110" cy="56" r="24" fill="#D1A684"/>
                <path d="M74 148c4-34 22-46 36-46s32 12 36 46z" fill="#EA580C"/>
                <rect x="90" y="114" width="40" height="7" rx="2" fill="#FACC15"/>
                <rect x="86" y="130" width="48" height="7" rx="2" fill="#FACC15"/>
                ${m.indFailMode && m.indShot !== 'ok' ? '' : '<path d="M84 48c0-16 12-26 26-26s26 10 26 26z" fill="#FACC15"/><rect x="78" y="45" width="64" height="6" rx="3" fill="#EAB308"/>'}
                ${shot ? `
                  <rect x="76" y="16" width="68" height="44" rx="5" fill="none" stroke="${fail ? '#F87171' : '#4ADE80'}" stroke-width="2.2"/>
                  <rect x="70" y="96" width="80" height="54" rx="5" fill="none" stroke="#4ADE80" stroke-width="2.2"/>
                ` : ''}
              </svg>
              ${shot ? `<span style="position:absolute;top:8px;left:8px;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:700;background:${fail ? '#F87171' : '#4ADE80'};color:#071629">${fail ? 'Helm tidak terdeteksi' : 'Helm terdeteksi'}</span>` : ''}
              ${shot ? `<span style="position:absolute;bottom:8px;right:8px;padding:3px 8px;border-radius:999px;font-size:12px;font-weight:700;background:#4ADE80;color:#071629">Rompi terdeteksi</span>` : ''}
            </div>
            ${fail ? `<div style="padding:7px 10px;border-radius:9px;background:var(--sig-crit-bg);color:var(--sig-crit);font-size:12px;font-weight:700;border:1px solid rgba(248,113,113,0.4)">Induction tertahan — Helm wajib dipakai.</div>` : ''}
            <div style="display:flex;flex-direction:column;gap:5px">
              <div style="display:flex;justify-content:space-between;padding:7px 10px;border-radius:9px;border:1px solid ${fail ? 'var(--sig-crit)' : 'var(--phone-border)'};font-size:12px">
                <span><strong>Helm</strong> · foto</span>
                <strong style="color:${shot ? (fail ? 'var(--sig-crit)' : 'var(--sig-safe)') : 'var(--phone-muted)'}">${shot ? (fail ? 'Tidak terdeteksi' : 'Terdeteksi') : 'Menunggu'}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:7px 10px;border-radius:9px;border:1px solid var(--phone-border);font-size:12px">
                <span><strong>Rompi reflektif</strong> · foto</span>
                <strong style="color:${shot ? 'var(--sig-safe)' : 'var(--phone-muted)'}">${shot ? 'Terdeteksi' : 'Menunggu'}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 10px;border-radius:9px;border:1.5px solid ${shot && !fail && !m.shoes ? 'var(--sig-warn)' : 'var(--phone-border)'};background:${shot && !fail && !m.shoes ? 'var(--sig-warn-bg)' : 'transparent'};font-size:12px">
                <span><strong>Sepatu safety</strong></span>
                <button data-mobile-action="toggle-shoes" style="padding:4px 10px;border-radius:7px;border:1px solid ${m.shoes ? 'var(--sig-safe)' : 'var(--phone-accent)'};background:${m.shoes ? 'var(--sig-safe-bg)' : 'var(--phone-card)'};color:${m.shoes ? 'var(--sig-safe)' : 'var(--phone-accent)'};font-size:12px;font-weight:700">${m.shoes ? 'Saya pakai' : 'Konfirmasi'}</button>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 10px;border-radius:9px;border:1px solid var(--phone-border);font-size:12px">
                <span><strong>Sarung tangan</strong></span>
                <button data-mobile-action="toggle-gloves" style="padding:4px 10px;border-radius:7px;border:1px solid ${m.gloves ? 'var(--sig-safe)' : 'var(--phone-border)'};background:${m.gloves ? 'var(--sig-safe-bg)' : 'transparent'};color:${m.gloves ? 'var(--sig-safe)' : 'var(--phone-muted)'};font-size:12px;font-weight:700">${m.gloves ? 'Saya pakai' : 'Tidak perlu'}</button>
              </div>
            </div>
            ${blocked ? `<div style="font-size:12px;font-weight:700;color:var(--sig-warn);text-align:center">${blocked}</div>` : ''}
            <button data-mobile-action="ind-next" class="btn-primary" style="width:100%;height:42px;margin-top:auto" ${blocked ? 'disabled' : ''}>${nextLabel}</button>
          </div>
        `;
      }

      if (step === 2) {
        const quizDefs = [
          ['a', 'Menunggu instruksi lewat radio'],
          ['b', 'Langsung jalan kaki ke titik kumpul aman tanpa menunggu sirene'],
          ['c', 'Kembali ke truk untuk keluar lewat gate']
        ];
        const quizRight = m.quiz === 'b';
        return `
          <div style="flex:1;display:flex;flex-direction:column;gap:10px;padding:8px 16px 14px">
            <strong style="font-size:13px;color:var(--phone-muted)">Safety Induction · 2 dari 3</strong>
            <div style="display:flex;gap:5px">${bars}</div>
            <h2 style="margin:0;font-size:18px;line-height:1.25">Panduan evakuasi zona Anda</h2>
            <div style="padding:10px 12px;border-radius:11px;background:var(--phone-card-alt);border:1px solid var(--phone-border);font-size:12px">
              <strong>Dermaga A / Lapangan C → Gedung Evakuasi B (Tsunami) · Area Terbuka Timur (Gempa)</strong>
              <ol style="margin:6px 0 0;padding-left:18px;line-height:1.45;color:var(--phone-muted)">
                <li>Guncangan kuat di pantai: langsung jalan kaki ke tempat tinggi/terbuka.</li>
                <li>Ikuti panah GPS &amp; rambu fisik; jangan naik truk atau alat.</li>
                <li>Jangan kembali sebelum komandan insiden mencabut status.</li>
              </ol>
            </div>
            <div style="font-size:13px;font-weight:700">Cek pemahaman: bila guncangan kuat terasa, apa tindakan pertama Anda?</div>
            <div style="display:flex;flex-direction:column;gap:6px">
              ${quizDefs.map((q) => {
                const picked = m.quiz === q[0];
                const ok = q[0] === 'b';
                const border = picked ? (ok ? 'var(--sig-safe)' : 'var(--sig-crit)') : 'var(--phone-border)';
                const bg = picked ? (ok ? 'var(--sig-safe-bg)' : 'var(--sig-crit-bg)') : 'var(--phone-card)';
                return `<button data-quiz-opt="${q[0]}" style="text-align:left;padding:9px 12px;border-radius:10px;border:1.5px solid ${border};background:${bg};color:var(--phone-fg);font-size:12.5px;font-weight:600">${q[1]}</button>`;
              }).join('')}
            </div>
            ${m.quiz ? `<div style="font-size:12px;font-weight:700;color:${quizRight ? 'var(--sig-safe)' : 'var(--sig-crit)'}">${quizRight ? 'Benar. Evakuasi mandiri tidak menunggu sirene.' : 'Belum tepat. Menunggu atau kembali ke kendaraan membuang waktu.'}</div>` : ''}
            <button data-mobile-action="ind-next" class="btn-primary" style="width:100%;height:42px;margin-top:auto" ${quizRight ? '' : 'disabled'}>Lanjut</button>
          </div>
        `;
      }

      const items = getPublishedInductionItems(state);
      return `
        <div style="flex:1;min-height:0;display:flex;flex-direction:column;gap:8px;padding:8px 16px 14px">
          <strong style="font-size:13px;color:var(--phone-muted)">Safety Induction · 3 dari 3</strong>
          <div style="display:flex;gap:5px">${bars}</div>
          <h2 style="margin:0;font-size:18px;line-height:1.25">Bahaya dan kelalaian hari ini</h2>
          <div style="font-size:12px;color:var(--phone-muted)">Diperbarui ${state.induction.pubAt} WIB oleh HSSE · Revisi ${state.induction.rev}</div>
          <div style="flex:1;min-height:0;overflow-y:auto;scrollbar-width:none;display:flex;flex-direction:column;gap:7px">
            ${items.map((it) => {
              const catTone = it.cat === 'KORBAN JIWA' ? 'var(--sig-crit)' : (it.cat === 'INFO ZONA' ? 'var(--phone-accent)' : 'var(--sig-warn)');
              return `
                <div style="padding:9px 11px;border-radius:10px;background:var(--phone-card-alt);border:1px solid var(--phone-border)">
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                    <span style="display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:800;color:${catTone}">
                      <span style="width:6px;height:6px;border-radius:50%;background:${catTone};flex:none" aria-hidden="true"></span>
                      ${esc(it.cat)}
                    </span>
                    ${it.isNew ? '<span class="badge badge-gold">BARU</span>' : ''}
                  </div>
                  <div style="font-size:12.5px;line-height:1.4;font-weight:600">${esc(it.text)}</div>
                  <div style="font-size:12px;color:var(--phone-muted);margin-top:2px">${esc(it.meta)}</div>
                </div>
              `;
            }).join('')}
          </div>
          <button data-mobile-action="ind-next" class="btn-primary" style="width:100%;height:42px;flex:none">Saya sudah membaca dan memahami</button>
        </div>
      `;
    }

    if (scr === 'indDone') {
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:14px;padding:18px 16px;justify-content:center;text-align:center">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--sig-safe-bg);color:var(--sig-safe);display:grid;place-items:center;margin:0 auto;font-size:28px;font-weight:800">✓</div>
          <h2 style="margin:0;font-size:22px">Safety induction selesai</h2>
          <p style="margin:0;font-size:13px;color:var(--phone-muted);line-height:1.5">Tercatat di MyHSSE · berlaku sampai Anda keluar gate hari ini (Revisi ${state.induction.rev}). Status Anda di Ruang Kendali langsung berubah menjadi Selesai.</p>
          <div style="padding:12px;border-radius:12px;background:var(--phone-card-alt);border:1px solid var(--phone-border);text-align:left;font-size:12px;color:var(--phone-fg);line-height:1.5">
            <strong>Status aktif:</strong> Terdaftar di Dermaga A · APD terverifikasi · Sinkron real-time ke Ruang Kendali.
          </div>
          <button data-mobile-action="go-home" class="btn-primary" style="width:100%;height:44px;margin-top:auto">Ke beranda</button>
        </div>
      `;
    }

    if (scr === 'report') {
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:8px;padding:8px 16px 14px">
          <h2 style="margin:0;font-size:19px">Apa yang Anda lihat?</h2>
          <div style="font-size:12px;color:var(--phone-muted)">Lapor cepat ≤ 30 detik · langsung ke Antrean Ruang Kendali</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px">
            ${D.CLSR_CATEGORIES.map((c) => {
              const on = m.rCat === c.id;
              return `<button data-report-cat="${c.id}" style="text-align:left;padding:9px 10px;border-radius:10px;border:1.5px solid ${on ? 'var(--phone-accent)' : 'var(--phone-border)'};background:${on ? 'var(--brand-blue-bg)' : 'var(--phone-card)'};color:var(--phone-fg)">
                <strong style="display:block;font-size:12.5px;line-height:1.25">${esc(c.title)}</strong>
                <span style="font-size:12px;color:var(--phone-muted);line-height:1.3">${esc(c.sub)}</span>
              </button>`;
            }).join('')}
          </div>
          <div style="padding:9px 11px;border-radius:10px;background:var(--phone-card-alt);border:1px solid var(--phone-border);font-size:12px">
            <strong>Terisi otomatis:</strong> Lapangan C · Blok C3 · 13.41 WIB · RS-07
          </div>
          <input id="mobile-report-note" type="text" value="${esc(m.rNote)}" placeholder="Catatan singkat (opsional, mis. jalur terhalang)" style="width:100%;padding:9px 11px;border-radius:10px;border:1px solid var(--phone-border);background:var(--phone-card);color:var(--phone-fg);font-size:12.5px">
          <button data-mobile-action="toggle-photo" style="padding:8px 12px;border-radius:10px;border:1.5px dashed ${m.rPhoto ? 'var(--sig-safe)' : 'var(--phone-border)'};background:${m.rPhoto ? 'var(--sig-safe-bg)' : 'transparent'};color:${m.rPhoto ? 'var(--sig-safe-fg)' : 'var(--phone-fg)'};font-size:12.5px;font-weight:600">
            ${m.rPhoto ? 'Foto terlampir · ketuk untuk hapus' : '+ Tambah foto bukti (opsional)'}
          </button>
          <button data-mobile-action="toggle-anon" style="text-align:left;padding:8px 11px;border-radius:10px;border:1px solid var(--phone-border);background:var(--phone-card);color:var(--phone-fg);display:flex;align-items:center;gap:10px">
            <span style="width:18px;height:18px;border-radius:5px;border:2px solid var(--phone-accent);background:${m.rAnon ? 'var(--phone-accent)' : 'transparent'};display:grid;place-items:center;color:#fff;font-size:12px;flex:none">${m.rAnon ? '✓' : ''}</span>
            <span><strong style="display:block;font-size:12.5px">Kirim tanpa nama (anonim)</strong><span style="font-size:12px;color:var(--phone-muted)">Tidak dipakai untuk sanksi pelapor</span></span>
          </button>
          <div style="display:flex;gap:8px;margin-top:auto">
            <button data-mobile-action="go-home" class="btn-ghost" style="flex:1">Batal</button>
            <button data-mobile-action="send-report" class="btn-primary" style="flex:1.6" ${m.rCat ? '' : 'disabled'}>Kirim laporan</button>
          </div>
        </div>
      `;
    }

    if (scr === 'alert') {
      const nav = computeNav(state);
      const isMandiri = state.evacSource === 'mandiri';
      const hazBanner = state.evacHazard === 'gempa'
        ? 'Segera ke Area Terbuka Timur'
        : (state.evacHazard === 'b3' ? 'Evakuasi melawan arah angin' : 'Segera ke tempat tinggi');

      if (m.evacView === 'other' || m.evacView === 'lock') {
        const osApps = [
          { name: 'Telepon', bg: '#16A34A', icon: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>' },
          { name: 'Pesan', bg: '#0284C7', icon: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>' },
          { name: 'Kamera', bg: '#334155', icon: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>' },
          { name: 'Peta', bg: '#2563EB', icon: '<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>' },
          { name: 'Kalender', bg: '#EA580C', icon: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>' },
          { name: 'Radio', bg: '#7C3AED', icon: '<circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/>' },
          { name: 'Catatan', bg: '#D97706', icon: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>' },
          { name: 'MyHSSE', bg: '#DC2626', icon: '<path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>' }
        ];

        return `
          <div style="flex:1;display:flex;flex-direction:column;background:var(--phone-os-bg);color:var(--phone-os-fg)">
            <div style="padding:10px 16px 2px;font-size:12px;color:var(--phone-os-muted);text-align:center">${m.evacView === 'lock' ? 'Layar terkunci · Live Activity aktif' : 'Membuka aplikasi lain · ketuk Dynamic Island di atas'}</div>
            <div style="flex:1;padding:12px 16px 16px;display:flex;flex-direction:column;gap:14px">
              ${m.evacView === 'lock' ? `
                <div style="text-align:center;padding:14px 0 6px">
                  <div class="mono" style="font-size:44px;font-weight:600;line-height:1">14:04</div>
                  <div style="font-size:12.5px;color:var(--phone-os-muted);margin-top:6px">Senin, 16 November 2026</div>
                </div>
                <div style="padding:14px;border-radius:16px;background:var(--phone-os-card);border:1px solid var(--phone-os-card-border);display:flex;flex-direction:column;gap:10px">
                  <div style="display:flex;justify-content:space-between;font-size:12px;font-weight:700;color:var(--phone-os-alert)">
                    <span>LIVE ACTIVITY · EVAKUASI</span>
                    <span class="mono">${nav.timerText}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:12px">
                    <div style="width:42px;height:42px;border-radius:50%;background:#EA580C;display:grid;place-items:center;flex:none">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" style="transform:rotate(${nav.deg}deg)"><path d="M12 20V5"></path><path d="M5 11l7-7 7 7"></path></svg>
                    </div>
                    <div style="min-width:0">
                      <div style="font-size:15px;font-weight:700">${esc(nav.stepText)}</div>
                      <div style="font-size:12.5px;color:var(--phone-os-subfg)">${esc(nav.stepSub)}</div>
                    </div>
                  </div>
                  <div style="font-size:12px;color:var(--phone-os-muted)">${nav.remain} m ke ${esc(nav.dest.name)} · ${esc(nav.haptic)}</div>
                </div>
              ` : `
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;padding-top:8px">
                  ${osApps.map((app) => `
                    <div style="display:flex;flex-direction:column;align-items:center;gap:6px">
                      <div style="width:48px;height:48px;border-radius:13px;background:${app.bg};display:grid;place-items:center;box-shadow:0 4px 12px rgba(0,0,0,0.22)">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${app.icon}</svg>
                      </div>
                      <span style="font-size:12px;color:var(--phone-os-subfg)">${app.name}</span>
                    </div>
                  `).join('')}
                </div>
                <div style="padding:12px;border-radius:12px;background:var(--phone-os-card);border:1px solid var(--phone-os-card-border);font-size:12.5px;color:var(--phone-os-subfg);line-height:1.45">
                  Panduan arah tetap muncul di luar aplikasi melalui <strong>iOS Dynamic Island</strong>. Ketuk kapsul hitam di atas untuk memperluas rute.
                </div>
              `}
              <button data-mobile-action="go-sos" class="btn-danger" style="width:100%;height:44px;margin-top:auto">Butuh bantuan (SOS)</button>
            </div>
          </div>
        `;
      }

      return `
        <div style="flex:1;min-height:0;display:flex;flex-direction:column">
          <div style="padding:10px 16px;background:${isMandiri ? '#9A3412' : '#B91C1C'};color:#FFFFFF">
            <div style="font-size:12px;font-weight:700;opacity:0.92">${state.evacDrill ? 'LATIHAN · ' : ''}${isMandiri ? 'EVAKUASI MANDIRI · GUNCANGAN' : 'PERINTAH EVAKUASI · RUANG KENDALI'}</div>
            <div style="font-size:18px;font-weight:800;margin-top:2px;line-height:1.2">${hazBanner}</div>
            <div style="font-size:12px;opacity:0.92">Tujuan: ${esc(nav.dest.name)}${nav.dest.overflowed ? ' (dialihkan: Gedung B penuh)' : ''}</div>
          </div>
          <div style="flex:1;padding:10px 16px 14px;display:flex;flex-direction:column;gap:8px">
            ${state.routeClosed ? `<div style="padding:7px 10px;border-radius:9px;background:var(--sig-crit-bg);color:var(--sig-crit);font-size:12px;font-weight:700">Jalan Dermaga B ditutup → Rute Cadangan</div>` : ''}
            <div style="padding:10px 12px;border-radius:12px;background:${m.wrong ? 'var(--sig-crit-bg)' : 'var(--sig-warn-bg)'};display:flex;align-items:center;gap:10px">
              <div style="width:44px;height:44px;border-radius:50%;background:${m.wrong ? '#DC2626' : '#EA580C'};display:grid;place-items:center;flex:none">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" style="transform:rotate(${nav.deg}deg)"><path d="M12 20V5"></path><path d="M5 11l7-7 7 7"></path></svg>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:14px;font-weight:800;color:var(--phone-fg)">${esc(nav.stepText)}</div>
                <div style="font-size:12px;color:var(--phone-muted)">${esc(nav.stepSub)}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:12px;color:var(--phone-muted)">Sisa</div>
                <div class="mono" style="font-size:17px;font-weight:700;color:${state.timedOut ? 'var(--sig-crit)' : 'var(--phone-fg)'}">${nav.timerText}</div>
              </div>
            </div>

            <div style="border-radius:12px;border:1px solid var(--phone-border);overflow:hidden;background:var(--map-bg)">
              <svg viewBox="0 0 330 112" style="width:100%;height:auto;display:block">
                <defs>
                  <pattern id="evacMiniGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                    <path d="M 16 0 L 0 0 0 16" fill="none" stroke="var(--map-grid)" stroke-width="0.75"/>
                  </pattern>
                </defs>
                <rect width="330" height="112" fill="url(#evacMiniGrid)"/>
                <rect x="0" y="0" width="330" height="20" fill="${state.evacHazard === 'tsunami' ? 'rgba(185,28,28,0.85)' : 'var(--map-sea-top)'}"/>
                <text x="10" y="13.5" fill="${state.evacHazard === 'tsunami' ? '#FECACA' : 'var(--map-sea-fg)'}" font-size="8" font-weight="700">LAUT · DERMAGA A / B</text>
                <rect x="20" y="46" width="44" height="14" rx="2" fill="var(--map-block-bg)" stroke="var(--map-block-stroke)" stroke-width="0.8"/>
                <rect x="74" y="46" width="44" height="14" rx="2" fill="var(--map-block-bg)" stroke="var(--map-block-stroke)" stroke-width="0.8"/>
                <rect x="252" y="50" width="70" height="34" rx="5" fill="var(--map-safe-bg)" stroke="${nav.dest.id === 'gedung-b' ? 'var(--brand-gold)' : 'var(--sig-safe)'}" stroke-width="${nav.dest.id === 'gedung-b' ? '1.8' : '1'}"/>
                <text x="287" y="71" text-anchor="middle" fill="var(--map-safe-fg)" font-size="9.5" font-weight="700">Gedung B</text>
                <rect x="192" y="88" width="56" height="21" rx="4" fill="var(--map-safe-bg)" stroke="${nav.dest.id === 'area-timur' ? 'var(--brand-gold)' : 'var(--sig-safe)'}" stroke-dasharray="3 2"/>
                <text x="220" y="101" text-anchor="middle" fill="var(--brand-gold-fg)" font-size="8" font-weight="700">Area Timur</text>
                <polyline points="${nav.allPts}" fill="none" stroke="var(--border-strong)" stroke-width="3" stroke-dasharray="5 5"/>
                <polyline points="${nav.donePts}" fill="none" stroke="var(--brand-gold)" stroke-width="3.5" stroke-linecap="round"/>
                <circle cx="${nav.dotX}" cy="${nav.dotY}" r="10" fill="var(--phone-accent)" opacity="0.25"/>
                <circle cx="${nav.dotX}" cy="${nav.dotY}" r="5.5" fill="var(--brand-blue)" stroke="var(--map-pin-ring)" stroke-width="2"/>
              </svg>
            </div>
            <div style="font-size:12px;color:var(--phone-muted);line-height:1.35">${nav.remain} m ke ${esc(nav.dest.name)} · ${esc(nav.haptic)}</div>
            <div style="padding:8px 10px;border-radius:9px;background:${nav.stopped ? 'var(--sig-safe-bg)' : 'var(--sig-warn-bg)'};color:${nav.stopped ? 'var(--sig-safe-fg)' : 'var(--sig-warn-fg)'};font-size:12px;font-weight:600">
              ${nav.stopped ? 'Operator alat sudah konfirmasi berhenti lewat radio' : 'Operator alat sedang diminta berhenti lewat radio'}
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 10px;border-radius:9px;border:1px solid var(--phone-border);font-size:12px">
              <span><strong>Sari · Checker</strong> (20 m · ajak ikut)</span>
              <span class="badge badge-warn">Searah</span>
            </div>
            <button data-mobile-action="go-sos" class="btn-danger" style="width:100%;height:42px;margin-top:auto">Butuh bantuan (SOS)</button>
          </div>
        </div>
      `;
    }

    if (scr === 'safe') {
      const dest = NS.getEvacDestination(state);
      const safeMin = 2 + Math.floor(m.safeAt / 60);
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:14px;padding:20px 16px 16px;justify-content:center;text-align:center">
          <div style="width:68px;height:68px;border-radius:50%;background:var(--sig-safe-bg);color:var(--sig-safe);display:grid;place-items:center;margin:0 auto;font-size:30px;font-weight:800">✓</div>
          <h2 style="margin:0;font-size:22px">Tercatat Aman otomatis</h2>
          <p style="margin:0;font-size:13px;color:var(--phone-muted);line-height:1.5">
            Geofence <strong>${esc(dest.name)}</strong> · 14.${pad(safeMin)} WIB · dicocokkan petugas titik kumpul. Tidak perlu memindai apa pun.
          </p>
          <div style="padding:12px;border-radius:12px;background:var(--phone-card-alt);border:1px solid var(--phone-border);text-align:left;font-size:12.5px;display:flex;flex-direction:column;gap:6px">
            <div style="display:flex;justify-content:space-between"><span style="color:var(--phone-muted)">Titik kumpul</span><strong>${esc(dest.name)}</strong></div>
            <div style="display:flex;justify-content:space-between"><span style="color:var(--phone-muted)">Waktu tiba</span><strong class="mono">14.${pad(safeMin)} WIB</strong></div>
            <div style="display:flex;justify-content:space-between"><span style="color:var(--phone-muted)">Status SAR</span><strong style="color:var(--sig-safe)">Aman · Terverifikasi</strong></div>
          </div>
          <div style="padding:11px 12px;border-radius:11px;background:var(--sig-warn-bg);color:var(--sig-warn-fg);font-size:12px;font-weight:600;line-height:1.45">
            Tetap di titik kumpul. Jangan kembali ke dermaga sebelum status evakuasi dicabut komandan insiden.
          </div>
          <button data-mobile-action="sim-clear" class="btn-safe" style="width:100%;height:44px;margin-top:auto">Simulasi: status evakuasi dicabut</button>
        </div>
      `;
    }

    if (scr === 'clear') {
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:14px;padding:18px 16px 16px">
          <span class="badge badge-safe" style="align-self:flex-start">STATUS EVAKUASI DICABUT</span>
          <h2 style="margin:0;font-size:22px">Status evakuasi dicabut</h2>
          <p style="margin:0;font-size:13px;color:var(--phone-muted);line-height:1.5">Lapangan C, D, dan Gate 3 dibuka kembali. <strong>Dermaga A dan B tetap ditutup</strong> menunggu pemeriksaan struktur rel crane &amp; trestle.</p>
          <div style="padding:12px;border-radius:12px;background:var(--phone-card-alt);border:1px solid var(--phone-border);display:flex;flex-direction:column;gap:8px;font-size:12.5px">
            <div style="display:flex;justify-content:space-between"><span>Lapangan C, D &amp; Gate 3</span><strong style="color:var(--sig-safe)">Dibuka</strong></div>
            <div style="display:flex;justify-content:space-between"><span>Dermaga A &amp; B</span><strong style="color:var(--sig-crit)">Ditutup sementara</strong></div>
          </div>
          <div style="padding:12px;border-radius:12px;background:var(--sig-warn-bg);color:var(--sig-warn-fg);font-size:12.5px;line-height:1.45">
            Aplikasi tidak menampilkan rute ke zona yang belum dibuka. Gempa susulan akan memicu ulang panduan evakuasi.
          </div>
          <button data-mobile-action="go-home" class="btn-primary" style="width:100%;height:44px;margin-top:auto">Kembali ke beranda</button>
        </div>
      `;
    }

    if (scr === 'sos') {
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:14px;padding:20px 16px 16px;background:#450A0A;color:#FEF2F2;text-align:center;justify-content:center">
          <span class="badge badge-crit" style="align-self:center;background:#DC2626;color:#fff">DARURAT · SLA 60 DETIK</span>
          <h2 style="margin:0;font-size:22px">Permintaan bantuan terkirim</h2>
          <p style="margin:0;font-size:13px;color:#FECACA;line-height:1.5">${esc(m.sosReason || 'Dikirim dari tombol Butuh bantuan.')} Detail koordinat Anda hanya terlihat oleh Ruang Kendali &amp; tim penyelamat.</p>
          <div style="padding:12px;border-radius:12px;background:rgba(0,0,0,0.28);border:1px solid rgba(254,202,202,0.25);font-size:12px;color:#FECACA;text-align:left;line-height:1.5">
            <strong>Protokol aktif:</strong> Ruang Kendali menerima koordinat terakhir dan akan mengirim tim rescue ke lokasi Anda.
          </div>
          <button data-mobile-action="cancel-sos" class="btn-ghost" style="width:100%;height:44px;color:#fff;border-color:rgba(255,255,255,0.45);margin-top:auto">Batalkan permintaan</button>
        </div>
      `;
    }

    return '';
  }

  function getHardwareColors(state) {
    const m = state.mobile;
    const scr = m.screen;
    if (scr === 'sos') return { bg: '#450A0A', fg: '#FEF2F2' };
    if (scr === 'alert' && (m.evacView === 'other' || m.evacView === 'lock')) {
      return { bg: 'var(--phone-os-bg)', fg: 'var(--phone-os-fg)' };
    }
    if (scr === 'alert') {
      return { bg: state.evacSource === 'mandiri' ? '#9A3412' : '#B91C1C', fg: '#FFFFFF' };
    }
    if (scr === 'safe' || scr === 'clear') {
      return { bg: 'var(--phone-bg)', fg: 'var(--phone-fg)' };
    }
    return { bg: 'var(--phone-card)', fg: 'var(--phone-fg)' };
  }

  function updateDynamicIsland(islandEl, state, nav) {
    const m = state.mobile;
    const evac = m.screen === 'alert';
    const islandOn = evac && m.evacView === 'other';

    if (!islandEl) return;
    islandEl.hidden = false;

    islandEl.classList.toggle('is-live', islandOn && !m.islandOpen);
    islandEl.classList.toggle('is-expanded', islandOn && !!m.islandOpen);

    const mode = islandOn ? (m.islandOpen ? 'expanded' : 'compact') : 'idle';
    if (mode === 'idle') {
      if (islandEl.dataset.mode !== 'idle') {
        islandEl.dataset.mode = 'idle';
        islandEl.innerHTML = '<span class="ja-camera-dot" aria-hidden="true"></span>';
      }
      return;
    }

    if (mode === 'compact') {
      if (islandEl.dataset.mode !== 'compact') {
        islandEl.dataset.mode = 'compact';
        islandEl.innerHTML = `
          <button data-mobile-action="toggle-island" style="width:100%;height:100%;border:none;background:transparent;color:#fff;display:flex;align-items:center;gap:8px;padding:0 12px 0 6px">
            <span style="width:22px;height:22px;border-radius:50%;background:#F97316;display:grid;place-items:center;flex:none">
              <svg class="ja-di-arrow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.8"><path d="M12 20V5"></path><path d="M5 11l7-7 7 7"></path></svg>
            </span>
            <span class="ja-di-short" style="font-size:12px;font-weight:700;white-space:nowrap"></span>
            <span style="flex:1"></span>
            <span class="mono ja-di-timer" style="font-size:12px;color:#FCA5A5"></span>
          </button>
        `;
      }
      const arrow = islandEl.querySelector('.ja-di-arrow');
      const shortEl = islandEl.querySelector('.ja-di-short');
      const timerEl = islandEl.querySelector('.ja-di-timer');
      if (arrow) arrow.style.transform = `rotate(${nav.deg}deg)`;
      if (shortEl) shortEl.textContent = nav.islandShort;
      if (timerEl) timerEl.textContent = nav.timerText;
      return;
    }

    if (islandEl.dataset.mode !== 'expanded') {
      islandEl.dataset.mode = 'expanded';
      islandEl.innerHTML = `
        <button data-mobile-action="toggle-island" style="width:100%;height:100%;border:none;background:transparent;color:#fff;display:flex;flex-direction:column;gap:8px;padding:14px;text-align:left">
          <div style="display:flex;align-items:center;gap:10px;width:100%">
            <span style="width:40px;height:40px;border-radius:50%;background:#F97316;display:grid;place-items:center;flex:none">
              <svg class="ja-di-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.8"><path d="M12 20V5"></path><path d="M5 11l7-7 7 7"></path></svg>
            </span>
            <div style="flex:1;min-width:0">
              <div class="ja-di-step" style="font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
              <div class="ja-di-sub" style="font-size:12px;color:#CBD5E1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
            </div>
            <span class="mono ja-di-timer" style="font-size:14px;color:#FCA5A5"></span>
          </div>
          <div style="width:100%;height:5px;border-radius:3px;background:#334155;overflow:hidden"><div class="ja-di-prog" style="height:100%;background:#F97316;transition:width 400ms ease"></div></div>
          <div class="ja-di-foot" style="font-size:12px;color:#CBD5E1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></div>
        </button>
      `;
    }
    const arrow = islandEl.querySelector('.ja-di-arrow');
    const stepEl = islandEl.querySelector('.ja-di-step');
    const subEl = islandEl.querySelector('.ja-di-sub');
    const timerEl = islandEl.querySelector('.ja-di-timer');
    const progEl = islandEl.querySelector('.ja-di-prog');
    const footEl = islandEl.querySelector('.ja-di-foot');
    if (arrow) arrow.style.transform = `rotate(${nav.deg}deg)`;
    if (stepEl) stepEl.textContent = nav.stepText;
    if (subEl) subEl.textContent = nav.stepSub;
    if (timerEl) timerEl.textContent = nav.timerText;
    if (progEl) progEl.style.width = `${nav.pct}%`;
    if (footEl) footEl.textContent = `${nav.remain} m ke ${nav.dest.name} · ${nav.haptic}`;
  }

  function renderMobile(container, state, store) {
    const m = state.mobile;
    const scr = m.screen;
    const evac = scr === 'alert';
    const nav = evac ? computeNav(state) : null;
    const inside = !(scr === 'outside' || scr === 'out' || scr === 'perm');

    if (!container.querySelector('.mobile-stage')) {
      container.innerHTML = `
        <div class="mobile-stage">
          <div class="phone-col">
            <div class="phone-meta-strip">
              <span class="phone-meta-user">Andi · Checker (Pegawai)</span>
              <span class="phone-meta-hw">iOS · Dynamic Island</span>
            </div>

            <div class="phone-hardware-shell">
              <div class="phone-frame">
                <div class="phone-hardware-bar">
                  <span class="phone-hw-time">14:04</span>
                  <div class="ja-island" data-mode="idle"><span class="ja-camera-dot" aria-hidden="true"></span></div>
                  <span class="phone-hw-icons" aria-hidden="true">
                    <svg width="14" height="10" viewBox="0 0 14 10" fill="currentColor"><rect x="0" y="6" width="2.2" height="4" rx="0.6"/><rect x="3.5" y="4" width="2.2" height="6" rx="0.6"/><rect x="7" y="2" width="2.2" height="8" rx="0.6"/><rect x="10.5" y="0" width="2.2" height="10" rx="0.6"/></svg>
                    <svg width="18" height="10" viewBox="0 0 18 10" fill="none" stroke="currentColor" stroke-width="1.2"><rect x="0.8" y="1" width="14" height="8" rx="2"/><rect x="2.2" y="2.4" width="10" height="5.2" rx="1" fill="currentColor" stroke="none"/><path d="M16 3.5v3" stroke-linecap="round"/></svg>
                  </span>
                </div>
                <div class="phone-topbar-slot"></div>
                <div class="phone-scroll"></div>
                <div class="phone-home-indicator" aria-hidden="true"></div>
              </div>
            </div>

            <div class="phone-haptic-bar" aria-live="polite">
              <span class="phone-haptic-label">HAPTIC: SIAGA</span>
              <div class="haptic-wave" aria-hidden="true">
                <span class="haptic-pip active"></span><span class="haptic-pip"></span><span class="haptic-pip"></span>
                <span class="haptic-pip"></span><span class="haptic-pip"></span><span class="haptic-pip"></span>
              </div>
              <span class="phone-geo-label">GATE 3 AKTIF</span>
            </div>
          </div>

          <aside class="mobile-controls-rail" aria-label="Kontrol Skenario & Simulasi HP">
            <div class="scenario-dock">
              <div class="scenario-dock-head">
                <strong>Coba Skenario (10 Alur PRD v0.7)</strong>
                <div class="scenario-nav-btns">
                  <button data-mobile-action="prev-scenario" class="scenario-step-btn" title="Skenario sebelumnya" aria-label="Skenario sebelumnya">‹</button>
                  <button data-mobile-action="next-scenario" class="scenario-step-btn" title="Skenario berikutnya" aria-label="Skenario berikutnya">›</button>
                  <span class="badge badge-gold">Live</span>
                </div>
              </div>
              <div class="scenario-grid">
                ${SCENARIOS.map((sc, idx) => `
                  <button data-scenario="${sc.key}" class="scenario-pill" title="${esc(sc.title)} — ${esc(sc.desc)}">
                    <span class="scenario-pill-num">${idx + 1}</span>
                    <span style="overflow:hidden;text-overflow:ellipsis">${esc(sc.short)}</span>
                  </button>
                `).join('')}
              </div>
              <div class="scenario-active-desc"></div>
            </div>

            <div class="sim-controls-bar" hidden>
              <div class="sim-controls-title">Simulasi Tampilan Evakuasi</div>
              <div class="sim-view-tabs" role="group" aria-label="Simulasi Tampilan Evakuasi">
                <button data-evac-view="app" class="sim-tab-btn">Di aplikasi</button>
                <button data-evac-view="other" class="sim-tab-btn">Aplikasi lain</button>
                <button data-evac-view="lock" class="sim-tab-btn">Layar kunci</button>
              </div>
              <button data-mobile-action="toggle-wrong" class="btn-ghost" style="width:100%;font-size:12px;padding:7px 10px">Simulasi salah arah</button>
            </div>

            <div class="rail-context-card">
              <strong>Kontrol Sinkronisasi HP ↔ Kendali</strong>
              <p>Pilih alur di atas untuk menguji perubahan status di HP pekerja dan dampaknya secara langsung pada Ruang Kendali &amp; Titik Kumpul.</p>
            </div>
          </aside>
        </div>
      `;
    }

    // 1. Update Scenario Dock active state & subtitle
    const activeSc = SCENARIOS.find((s) => s.key === m.activeScenario) || SCENARIOS[1];
    container.querySelectorAll('.scenario-pill').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.scenario === m.activeScenario);
    });
    const descEl = container.querySelector('.scenario-active-desc');
    if (descEl) descEl.textContent = `${activeSc.title} — ${activeSc.desc}`;

    // 2. Update Hardware Safe Area & Dynamic Island in place (preserves spring CSS animations)
    const hwBar = container.querySelector('.phone-hardware-bar');
    const hwColors = getHardwareColors(state);
    if (hwBar) {
      hwBar.style.background = hwColors.bg;
      hwBar.style.color = hwColors.fg;
    }
    updateDynamicIsland(
      container.querySelector('.ja-island'),
      state,
      nav
    );

    // 3. Update MyHSSE topbar slot
    const topSlot = container.querySelector('.phone-topbar-slot');
    if (topSlot) {
      topSlot.innerHTML = (!evac && scr !== 'safe' && scr !== 'clear' && scr !== 'sos')
        ? renderTopBar(state, inside)
        : '';
    }

    // 4. Update screen content (preserve scrollTop and avoid wiping active text input focus)
    const scrollEl = container.querySelector('.phone-scroll');
    const activeEl = document.activeElement;
    const isTypingInMobile = activeEl && scrollEl && scrollEl.contains(activeEl) &&
      (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
    if (scrollEl && !isTypingInMobile) {
      const savedScroll = scrollEl.scrollTop;
      scrollEl.innerHTML = renderScreen(state);
      scrollEl.scrollTop = savedScroll;
    }

    // 5. Update external simulator controls bar
    const simBar = container.querySelector('.sim-controls-bar');
    if (simBar) {
      simBar.hidden = !evac;
      simBar.querySelectorAll('[data-evac-view]').forEach((btn) => {
        btn.classList.toggle('active', btn.dataset.evacView === m.evacView);
      });
      const wrongBtn = simBar.querySelector('[data-mobile-action="toggle-wrong"]');
      if (wrongBtn) wrongBtn.textContent = m.wrong ? 'Kembali ke rute' : 'Simulasi salah arah';
    }

    // 6. Update Haptic & Geofence telemetry bar below phone
    const hapticLbl = container.querySelector('.phone-haptic-label');
    const geoLbl = container.querySelector('.phone-geo-label');
    const pips = container.querySelectorAll('.haptic-pip');
    if (hapticLbl && geoLbl) {
      let activeCount = 1;
      let isDanger = false;
      if (scr === 'sos') {
        hapticLbl.textContent = 'HAPTIC: DARURAT SOS';
        geoLbl.textContent = 'SLA 60 DTK';
        activeCount = 6;
        isDanger = true;
      } else if (evac) {
        hapticLbl.textContent = m.wrong ? 'GETAR PANJANG: BALIK' : 'GETAR 2× KANAN / 3× KIRI';
        geoLbl.textContent = 'GPS EVAKUASI';
        activeCount = m.wrong ? 6 : 5;
        isDanger = m.wrong;
      } else if (scr === 'out' || scr === 'outside') {
        hapticLbl.textContent = 'HAPTIC: NONAKTIF';
        geoLbl.textContent = 'DI LUAR AREA';
        activeCount = 0;
      } else if (scr === 'safe') {
        hapticLbl.textContent = 'HAPTIC: AMAN TERCATAT';
        geoLbl.textContent = 'TIKUM AMAN';
        activeCount = 2;
      } else {
        hapticLbl.textContent = 'HAPTIC: SIAGA';
        geoLbl.textContent = 'GATE 3 AKTIF';
        activeCount = 1;
      }
      pips.forEach((p, idx) => {
        p.classList.toggle('active', idx < activeCount);
        p.classList.toggle('is-danger', isDanger && idx < activeCount);
      });
    }

    if (!container.dataset.wired) {
      container.dataset.wired = '1';
      container.addEventListener('input', (ev) => {
        if (ev.target && ev.target.id === 'mobile-report-note') {
          store.state.mobile.rNote = ev.target.value;
        }
      });
      container.addEventListener('click', (ev) => {
        const target = ev.target.closest('button');
        if (!target) return;

        if (target.dataset.scenario) {
          store.dispatch({ type: 'JUMP_SCENARIO', key: target.dataset.scenario });
          return;
        }
        if (target.dataset.evacView) {
          store.dispatch({ type: 'SET_MOBILE_STATE', patch: { evacView: target.dataset.evacView, islandOpen: false } });
          return;
        }
        if (target.dataset.quizOpt) {
          store.dispatch({ type: 'SET_MOBILE_STATE', patch: { quiz: target.dataset.quizOpt } });
          return;
        }
        if (target.dataset.reportCat) {
          store.dispatch({ type: 'SET_MOBILE_STATE', patch: { rCat: target.dataset.reportCat } });
          return;
        }

        const act = target.dataset.mobileAction;
        if (!act) return;
        const st = store.getState().mobile;
        if (act === 'prev-scenario' || act === 'next-scenario') {
          const curIdx = SCENARIOS.findIndex((s) => s.key === st.activeScenario);
          const delta = act === 'next-scenario' ? 1 : -1;
          const nextIdx = (Math.max(0, curIdx) + delta + SCENARIOS.length) % SCENARIOS.length;
          store.dispatch({ type: 'JUMP_SCENARIO', key: SCENARIOS[nextIdx].key });
        }
        else if (act === 'grant-loc') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { locPerm: true } });
        else if (act === 'grant-notif') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { notifPerm: true } });
        else if (act === 'grant-bat') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { batExempt: true } });
        else if (act === 'finish-reg') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { screen: 'outside' } });
        else if (act === 'start-ind') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { screen: 'ind' } });
        else if (act === 'open-reread') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { screen: 'ind', indStep: 3 } });
        else if (act === 'toggle-shoes') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { shoes: !st.shoes } });
        else if (act === 'toggle-gloves') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { gloves: !st.gloves } });
        else if (act === 'ind-next') {
          if (st.indStep === 1) {
            if (st.indShot === 'none') {
              store.dispatch({ type: 'SET_MOBILE_STATE', patch: { indShot: st.indFailMode ? 'fail' : 'ok' } });
            } else if (st.indShot === 'fail') {
              store.dispatch({ type: 'SET_MOBILE_STATE', patch: { indShot: 'ok', indFailMode: false } });
            } else if (st.shoes) {
              store.dispatch({ type: 'SET_MOBILE_STATE', patch: { indStep: 2 } });
            }
          } else if (st.indStep === 2 && st.quiz === 'b') {
            store.dispatch({ type: 'SET_MOBILE_STATE', patch: { indStep: 3 } });
          } else if (st.indStep === 3) {
            if (store.getState().induction.rereadRequired && !store.getState().induction.rereadAcked) {
              store.dispatch({ type: 'ACK_REREAD' });
            }
            store.dispatch({ type: 'SET_MOBILE_STATE', patch: { screen: 'indDone', indDone: true } });
          }
        }
        else if (act === 'go-home') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { screen: 'home' } });
        else if (act === 'go-report') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { screen: 'report', rCat: null, rPhoto: false, rAnon: false, rNote: '' } });
        else if (act === 'toggle-photo') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { rPhoto: !st.rPhoto } });
        else if (act === 'toggle-anon') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { rAnon: !st.rAnon } });
        else if (act === 'send-report') {
          store.dispatch({
            type: 'SUBMIT_REPORT',
            category: st.rCat,
            hasPhoto: st.rPhoto,
            anonymous: st.rAnon,
            note: st.rNote
          });
        }
        else if (act === 'start-shake') store.dispatch({ type: 'SUBMIT_SHAKE' });
        else if (act === 'go-sos') store.dispatch({ type: 'TRIGGER_SOS' });
        else if (act === 'cancel-sos') store.dispatch({ type: 'CANCEL_SOS' });
        else if (act === 'toggle-wrong') store.dispatch({ type: 'TOGGLE_WRONG_WAY' });
        else if (act === 'toggle-island') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { islandOpen: !st.islandOpen } });
        else if (act === 'sim-clear') store.dispatch({ type: 'END_EVAC' });
      });
    }
  }

  NS.Views.renderMobile = renderMobile;
})(window);
