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
    { key: 'reg', title: '1. Pendaftaran pertama kali', desc: 'Sekali saja: izin lokasi, notifikasi darurat, baterai' },
    { key: 'enter', title: '2. Masuk area lewat Gate 3', desc: 'Aktif otomatis dari transaksi gate, tanpa pindai' },
    { key: 'induct', title: '3. Safety induction harian', desc: 'Selfie APD, panduan evakuasi, info bahaya hari ini' },
    { key: 'apdfail', title: '4. Selfie APD tidak lengkap', desc: 'Helm tidak terdeteksi, induction tertahan' },
    { key: 'mandiri', title: '5. Guncangan kuat terasa', desc: 'Evakuasi mandiri di HP + kirim laporan ke Kendali' },
    { key: 'bmkg', title: '6. Perintah evakuasi ruang kendali', desc: 'Panah gerak GPS, peta rute, timer' },
    { key: 'island', title: '7. Panduan di luar aplikasi', desc: 'iOS Dynamic Island ↔ Android 16 notifikasi progres' },
    { key: 'arrive', title: '8. Tiba di titik kumpul', desc: 'Geofence + petugas mencatat Aman, sinkron ke SAR' },
    { key: 'report', title: '9. Lapor pelanggaran / near miss', desc: '≤ 30 dtk, kategori CLSR, langsung masuk Ruang Kendali' },
    { key: 'out', title: '10. Keluar lewat gate', desc: 'Tracking berhenti otomatis saat Gate OUT' }
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

  function renderTopBar(state, inside) {
    const chipBg = inside ? 'var(--sig-safe-bg)' : 'var(--sig-muted-bg)';
    const chipFg = inside ? 'var(--sig-safe)' : 'var(--sig-muted)';
    const chipLabel = inside ? 'Aktif otomatis' : 'Di luar area';
    return `
      <div class="phone-myhsse-bar">
        <span class="phone-breadcrumb">MyHSSE › Keselamatan Operasi › JARAK AMAN</span>
        <span class="mono" style="font-size:10px;color:var(--phone-muted)">REV ${state.induction.rev}</span>
      </div>
      <div class="phone-title-row">
        <div style="display:flex;align-items:center;gap:7px">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--phone-accent)" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z"></path><path d="M8.5 12l2.5 2.5 4.5-5"></path></svg>
          <strong style="font-size:15px;letter-spacing:0.03em">JARAK AMAN</strong>
        </div>
        <span style="font-size:11px;font-weight:700;padding:4px 9px;border-radius:999px;background:${chipBg};color:${chipFg}">${chipLabel}</span>
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
        <div style="flex:1;display:flex;flex-direction:column;gap:14px;padding:8px 18px 20px">
          <div style="height:176px;border-radius:18px;background:var(--phone-card-alt);border:1px solid var(--phone-border);display:flex;align-items:center;justify-content:center">
            <svg width="150" height="106" viewBox="0 0 160 120" fill="none" stroke="var(--phone-accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 110V30h16v80"></path><path d="M36 50h104"></path><path d="M36 50l12-12h92"></path>
              <path d="M124 110V50"></path><path d="M6 110h148"></path>
              <path d="M70 82h40" style="stroke-dasharray:6 6"></path><path d="M100 74l10 8-10 8"></path>
            </svg>
          </div>
          <h2 style="margin:0;font-size:22px;line-height:1.2">${isExit ? 'Anda keluar area pelabuhan' : 'Anda di luar area pelabuhan'}</h2>
          <p style="margin:0;font-size:13.5px;line-height:1.5;color:var(--phone-muted)">${isExit
            ? 'Transaksi Gate OUT tercatat. Pemantauan lokasi otomatis berhenti untuk menjaga privasi Anda.'
            : 'JARAK AMAN aktif sendiri saat Anda melewati gate seperti biasa. Tidak perlu check-in atau memindai QR.'}</p>
          <div style="padding:12px 14px;border-radius:14px;background:var(--phone-card-alt);border:1px solid var(--phone-border);display:flex;flex-direction:column;gap:3px">
            <strong style="font-size:14px">Terdaftar · Andi (Checker · Pegawai)</strong>
            <span style="font-size:12px;color:var(--phone-muted)">Izin lokasi &amp; notifikasi darurat aktif · induction terakhir kemarin 07.15</span>
          </div>
          <div style="flex:1"></div>
          <div style="padding:11px 13px;border-radius:12px;background:var(--brand-blue-bg);font-size:12px;line-height:1.45;color:var(--phone-fg)">
            Tanpa smartphone? Anda tetap terdata lewat transaksi gate dan Kiosk Pos Gate, serta dihitung saat evakuasi.
          </div>
        </div>
      `;
    }

    if (scr === 'perm') {
      const allOk = m.locPerm && m.notifPerm && m.batExempt;
      const permCard = (key, title, sub, on) => `
        <div style="display:flex;align-items:center;gap:10px;padding:12px;border-radius:14px;border:1.5px solid ${on ? 'var(--sig-safe)' : 'var(--phone-accent)'};background:var(--phone-card)">
          <div style="flex:1">
            <div style="font-size:14px;font-weight:700">${title}</div>
            <div style="font-size:12px;color:var(--phone-muted)">${sub}</div>
          </div>
          ${on
            ? `<span style="font-size:12.5px;font-weight:700;color:var(--sig-safe)">Diizinkan</span>`
            : `<button data-mobile-action="grant-${key}" class="btn-primary" style="padding:7px 12px;font-size:12px">Izinkan</button>`}
        </div>
      `;
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:12px;padding:8px 18px 20px">
          <span style="font-size:11px;font-weight:800;letter-spacing:0.06em;color:var(--phone-muted)">PENDAFTARAN SEKALI</span>
          <h2 style="margin:0;font-size:22px;line-height:1.2">Izinkan tiga hal ini</h2>
          <p style="margin:0;font-size:13px;line-height:1.45;color:var(--phone-muted)">Setelah ini, modul MyHSSE bekerja otomatis hanya di dalam area pelabuhan.</p>
          ${permCard('loc', 'Lokasi: selalu', 'Hanya direkam di dalam geofence saat shift', m.locPerm)}
          ${permCard('notif', 'Notifikasi darurat', 'Berbunyi menembus mode senyap saat bahaya', m.notifPerm)}
          ${permCard('bat', 'Bebas penghemat baterai', 'Mencegah Android mematikan heartbeat', m.batExempt)}
          <div style="padding:10px 12px;border-radius:12px;background:var(--sig-warn-bg);color:var(--sig-warn-fg);font-size:12px;line-height:1.45">
            <strong>Penting:</strong> aplikasi tidak menggantikan SOP evakuasi mandiri. Bila guncangan kuat terasa di dekat pantai, segera menjauh ke tempat tinggi.
          </div>
          <div style="flex:1"></div>
          <button data-mobile-action="finish-reg" class="btn-primary" style="width:100%;height:46px" ${allOk ? '' : 'disabled'}>Selesai Pendaftaran</button>
        </div>
      `;
    }

    if (scr === 'home') {
      const rereadAlert = state.induction.rereadRequired && !state.induction.rereadAcked;
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:10px;padding:6px 16px 18px">
          ${m.toastLeft > 0 && m.toast ? `<div style="padding:9px 12px;border-radius:11px;background:var(--sig-safe-bg);color:var(--sig-safe-fg);font-size:12px;font-weight:600;border:1px solid var(--sig-safe)">${esc(m.toast)}</div>` : ''}
          ${rereadAlert ? `
            <button data-mobile-action="open-reread" style="text-align:left;padding:11px 13px;border-radius:13px;border:1.5px solid var(--brand-gold);background:var(--brand-gold-bg);color:var(--brand-gold-fg);display:flex;justify-content:space-between;align-items:center;gap:8px">
              <div>
                <div style="font-size:12px;font-weight:800">INFO DARURAT BARU · REV ${state.induction.rev}</div>
                <div style="font-size:12px">HSSE mewajibkan baca ulang Langkah 3 sekarang.</div>
              </div>
              <span style="font-size:12px;font-weight:800">Buka →</span>
            </button>
          ` : ''}
          ${m.indDone
            ? `<div style="padding:10px 12px;border-radius:12px;background:var(--sig-safe-bg);color:var(--sig-safe-fg);font-size:12.5px;font-weight:600">Safety induction selesai 07.15 WIB · berlaku sampai Anda keluar gate hari ini</div>`
            : `<button data-mobile-action="start-ind" style="text-align:left;padding:12px 14px;border-radius:14px;border:1.5px solid var(--sig-warn);background:var(--sig-warn-bg);color:var(--sig-warn-fg);display:flex;justify-content:space-between;align-items:center;gap:10px">
                <div>
                  <div style="font-size:14px;font-weight:800">Safety induction hari ini · langkah ${m.indStep} dari 3</div>
                  <div style="font-size:12px">Selfie APD, panduan evakuasi, info bahaya · ±2 menit</div>
                </div>
                <span style="font-size:18px;font-weight:800">›</span>
              </button>`}

          <div style="padding:12px 14px;border-radius:14px;background:var(--phone-card-alt);border:1px solid var(--phone-border)">
            <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700">
              <span style="width:8px;height:8px;border-radius:50%;background:var(--sig-safe)"></span>
              Terminal Petikemas · Dermaga A · Zona Alat Berat
            </div>
            <div style="font-size:11.5px;color:var(--phone-muted);margin-top:4px;line-height:1.4">
              Cocok dengan transaksi Gate 3, 07.12 WIB · posisi tingkat zona terkirim ke Ruang Kendali.
            </div>
          </div>

          <button data-mobile-action="go-report" style="text-align:left;padding:12px 14px;border-radius:14px;border:1.5px solid var(--phone-accent);background:var(--phone-card);color:var(--phone-fg);display:flex;align-items:center;gap:12px">
            <span style="width:36px;height:36px;border-radius:10px;background:var(--brand-blue-bg);color:var(--phone-accent);display:grid;place-items:center;font-weight:800;flex:none">!</span>
            <span>
              <strong style="display:block;font-size:14px">Lapor pelanggaran atau near miss</strong>
              <span style="font-size:11.5px;color:var(--phone-muted)">≤ 30 detik · lokasi otomatis · boleh tanpa nama</span>
            </span>
          </button>

          <div style="border-radius:14px;border:1px solid var(--phone-border);overflow:hidden;background:#0F2944">
            <svg viewBox="0 0 330 128" style="width:100%;height:auto;display:block">
              <rect width="330" height="24" fill="#12395B"/>
              <text x="12" y="16" fill="#93C5FD" font-size="9.5" font-weight="700">LAUT · DERMAGA A / B</text>
              <rect x="0" y="24" width="330" height="104" fill="#0B2239"/>
              <rect x="18" y="42" width="42" height="14" rx="2" fill="#1E4068"/>
              <rect x="68" y="42" width="42" height="14" rx="2" fill="#1E4068"/>
              <rect x="18" y="68" width="42" height="14" rx="2" fill="#1E4068"/>
              <rect x="68" y="68" width="42" height="14" rx="2" fill="#1E4068"/>
              <text x="18" y="98" fill="#94A3B8" font-size="9">Lapangan C · RS-07 aktif</text>
              <rect x="242" y="76" width="76" height="34" rx="6" fill="#123A26" stroke="#4ADE80" stroke-width="1.2"/>
              <text x="280" y="92" text-anchor="middle" fill="#86EFAC" font-size="8.5" font-weight="700">Gedung Evak B</text>
              <text x="280" y="103" text-anchor="middle" fill="#86EFAC" font-size="8">Titik kumpul</text>
              <circle cx="48" cy="34" r="6" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2"/>
            </svg>
          </div>

          <div style="display:flex;flex-direction:column;gap:8px;margin-top:auto">
            <button data-mobile-action="start-shake" style="text-align:left;padding:11px 14px;border-radius:13px;border:1.5px solid var(--sig-warn);background:var(--sig-warn-bg);color:var(--sig-warn-fg)">
              <strong style="display:block;font-size:14px">Saya merasakan guncangan kuat</strong>
              <span style="font-size:11.5px">Mulai panduan evakuasi mandiri sekarang</span>
            </button>
            <button data-mobile-action="go-sos" class="btn-danger" style="width:100%;height:44px;border-radius:13px">Butuh bantuan (SOS)</button>
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
          <div style="flex:1;display:flex;flex-direction:column;gap:10px;padding:6px 16px 16px">
            <div style="font-size:11px;font-weight:800;color:var(--phone-muted);letter-spacing:0.05em">SAFETY INDUCTION HARIAN · 1 DARI 3</div>
            <div style="display:flex;gap:5px">${bars}</div>
            <h2 style="margin:0;font-size:20px">Selfie dengan APD lengkap</h2>
            <p style="margin:0;font-size:12.5px;color:var(--phone-muted)">Helm dan rompi diperiksa otomatis di HP (tanpa pengenalan wajah). Sepatu dikonfirmasi sendiri.</p>
            <div style="position:relative;height:178px;border-radius:16px;background:#102235;display:flex;align-items:center;justify-content:center;overflow:hidden">
              <svg viewBox="0 0 220 160" style="width:200px;height:150px">
                <circle cx="110" cy="56" r="24" fill="#D1A684"/>
                <path d="M74 148c4-34 22-46 36-46s32 12 36 46z" fill="#EA580C"/>
                <rect x="90" y="114" width="40" height="7" rx="2" fill="#FACC15"/>
                <rect x="86" y="130" width="48" height="7" rx="2" fill="#FACC15"/>
                ${m.indFailMode && fail ? '' : '<path d="M84 48c0-16 12-26 26-26s26 10 26 26z" fill="#FACC15"/><rect x="78" y="45" width="64" height="6" rx="3" fill="#EAB308"/>'}
                ${shot ? `
                  <rect x="76" y="16" width="68" height="44" rx="5" fill="none" stroke="${fail ? '#F87171' : '#4ADE80'}" stroke-width="2.2"/>
                  <rect x="70" y="96" width="80" height="54" rx="5" fill="none" stroke="#4ADE80" stroke-width="2.2"/>
                ` : ''}
              </svg>
              ${shot ? `<span style="position:absolute;top:10px;left:10px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;background:${fail ? '#F87171' : '#4ADE80'};color:#071629">${fail ? 'Helm tidak terdeteksi' : 'Helm terdeteksi'}</span>` : ''}
              ${shot ? `<span style="position:absolute;bottom:10px;right:10px;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:700;background:#4ADE80;color:#071629">Rompi terdeteksi</span>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;gap:6px">
              <div style="display:flex;justify-content:space-between;padding:8px 11px;border-radius:10px;border:1px solid var(--phone-border);font-size:12.5px">
                <span><strong>Helm</strong> · diperiksa dari foto</span>
                <strong style="color:${shot ? (fail ? 'var(--sig-crit)' : 'var(--sig-safe)') : 'var(--phone-muted)'}">${shot ? (fail ? 'Tidak terdeteksi' : 'Terdeteksi') : 'Menunggu'}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;padding:8px 11px;border-radius:10px;border:1px solid var(--phone-border);font-size:12.5px">
                <span><strong>Rompi reflektif</strong> · diperiksa dari foto</span>
                <strong style="color:${shot ? 'var(--sig-safe)' : 'var(--phone-muted)'}">${shot ? 'Terdeteksi' : 'Menunggu'}</strong>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 11px;border-radius:10px;border:1px solid var(--phone-border);font-size:12.5px">
                <span><strong>Sepatu safety</strong> · konfirmasi sendiri</span>
                <button data-mobile-action="toggle-shoes" style="padding:4px 10px;border-radius:8px;border:1px solid ${m.shoes ? 'var(--sig-safe)' : 'var(--phone-accent)'};background:${m.shoes ? 'var(--sig-safe-bg)' : 'transparent'};color:${m.shoes ? 'var(--sig-safe)' : 'var(--phone-accent)'};font-size:12px;font-weight:700">${m.shoes ? 'Saya pakai' : 'Konfirmasi'}</button>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;padding:7px 11px;border-radius:10px;border:1px solid var(--phone-border);font-size:12.5px">
                <span><strong>Sarung tangan</strong> · bila tugas perlu</span>
                <button data-mobile-action="toggle-gloves" style="padding:4px 10px;border-radius:8px;border:1px solid ${m.gloves ? 'var(--sig-safe)' : 'var(--phone-border)'};background:${m.gloves ? 'var(--sig-safe-bg)' : 'transparent'};color:${m.gloves ? 'var(--sig-safe)' : 'var(--phone-muted)'};font-size:12px;font-weight:700">${m.gloves ? 'Saya pakai' : 'Tidak perlu'}</button>
              </div>
            </div>
            ${blocked ? `<div style="font-size:12px;font-weight:700;color:var(--sig-warn);text-align:center">${blocked}</div>` : ''}
            <button data-mobile-action="ind-next" class="btn-primary" style="width:100%;height:44px;margin-top:auto" ${blocked ? 'disabled' : ''}>${nextLabel}</button>
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
          <div style="flex:1;display:flex;flex-direction:column;gap:10px;padding:6px 16px 16px">
            <div style="font-size:11px;font-weight:800;color:var(--phone-muted);letter-spacing:0.05em">SAFETY INDUCTION HARIAN · 2 DARI 3</div>
            <div style="display:flex;gap:5px">${bars}</div>
            <h2 style="margin:0;font-size:20px">Panduan evakuasi zona Anda</h2>
            <div style="padding:10px 12px;border-radius:12px;background:var(--phone-card-alt);border:1px solid var(--phone-border);font-size:12.5px">
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
                return `<button data-quiz-opt="${q[0]}" style="text-align:left;padding:10px 12px;border-radius:11px;border:1.5px solid ${border};background:${bg};color:var(--phone-fg);font-size:12.5px;font-weight:600">${q[1]}</button>`;
              }).join('')}
            </div>
            ${m.quiz ? `<div style="font-size:12px;font-weight:700;color:${quizRight ? 'var(--sig-safe)' : 'var(--sig-crit)'}">${quizRight ? 'Benar. Evakuasi mandiri tidak menunggu sirene.' : 'Belum tepat. Menunggu atau kembali ke kendaraan membuang waktu. Coba lagi.'}</div>` : ''}
            <button data-mobile-action="ind-next" class="btn-primary" style="width:100%;height:44px;margin-top:auto" ${quizRight ? '' : 'disabled'}>Lanjut</button>
          </div>
        `;
      }

      const items = getPublishedInductionItems(state);
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:10px;padding:6px 16px 16px">
          <div style="font-size:11px;font-weight:800;color:var(--phone-muted);letter-spacing:0.05em">SAFETY INDUCTION HARIAN · 3 DARI 3</div>
          <div style="display:flex;gap:5px">${bars}</div>
          <h2 style="margin:0;font-size:20px">Bahaya dan kelalaian hari ini</h2>
          <div style="font-size:11.5px;color:var(--phone-muted)">Diperbarui ${state.induction.pubAt} WIB oleh HSSE · Revisi ${state.induction.rev}</div>
          <div style="flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:7px;padding-right:2px">
            ${items.map((it) => `
              <div style="padding:9px 11px;border-radius:11px;background:var(--phone-card-alt);border-left:3.5px solid ${it.cat === 'KORBAN JIWA' ? 'var(--sig-crit)' : (it.cat === 'INFO ZONA' ? 'var(--phone-accent)' : 'var(--sig-warn)')}">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                  <span style="font-size:10px;font-weight:800;letter-spacing:0.04em;color:var(--phone-muted)">${esc(it.cat)}</span>
                  ${it.isNew ? '<span class="badge badge-gold">BARU</span>' : ''}
                </div>
                <div style="font-size:12.5px;line-height:1.4;font-weight:600">${esc(it.text)}</div>
                <div style="font-size:10.5px;color:var(--phone-muted);margin-top:2px">${esc(it.meta)}</div>
              </div>
            `).join('')}
          </div>
          <button data-mobile-action="ind-next" class="btn-primary" style="width:100%;height:44px">Saya sudah membaca dan memahami</button>
        </div>
      `;
    }

    if (scr === 'indDone') {
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:14px;padding:18px;justify-content:center;text-align:center">
          <div style="width:68px;height:68px;border-radius:50%;background:var(--sig-safe-bg);color:var(--sig-safe);display:grid;place-items:center;margin:0 auto;font-size:30px;font-weight:800">✓</div>
          <h2 style="margin:0;font-size:24px">Safety induction selesai</h2>
          <p style="margin:0;font-size:13.5px;color:var(--phone-muted);line-height:1.5">Tercatat di MyHSSE · berlaku sampai Anda keluar gate hari ini (Revisi ${state.induction.rev}). Status Anda di Ruang Kendali langsung berubah menjadi Selesai.</p>
          <button data-mobile-action="go-home" class="btn-primary" style="width:100%;height:46px;margin-top:12px">Ke beranda</button>
        </div>
      `;
    }

    if (scr === 'report') {
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:10px;padding:6px 16px 16px">
          <span style="font-size:11px;font-weight:800;letter-spacing:0.05em;color:var(--phone-muted)">LAPOR · KURANG DARI 30 DETIK</span>
          <h2 style="margin:0;font-size:21px">Apa yang Anda lihat?</h2>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
            ${D.CLSR_CATEGORIES.map((c) => {
              const on = m.rCat === c.id;
              return `<button data-report-cat="${c.id}" style="text-align:left;padding:10px;border-radius:12px;border:1.5px solid ${on ? 'var(--phone-accent)' : 'var(--phone-border)'};background:${on ? 'var(--brand-blue-bg)' : 'var(--phone-card)'};color:var(--phone-fg)">
                <strong style="display:block;font-size:12.5px">${esc(c.title)}</strong>
                <span style="font-size:11px;color:var(--phone-muted)">${esc(c.sub)}</span>
              </button>`;
            }).join('')}
          </div>
          <div style="padding:10px 12px;border-radius:11px;background:var(--phone-card-alt);border:1px solid var(--phone-border);font-size:12px">
            <strong style="display:block;font-size:10.5px;color:var(--phone-muted)">TERISI OTOMATIS</strong>
            Lapangan C · Blok C3 · 13.41 WIB · alat terdekat: RS-07
          </div>
          <input id="mobile-report-note" type="text" value="${esc(m.rNote)}" placeholder="Catatan singkat (opsional, mis. jalur terhalang)" style="width:100%;padding:9px 11px;border-radius:10px;border:1px solid var(--phone-border);background:var(--phone-card);color:var(--phone-fg);font-size:12.5px">
          <button data-mobile-action="toggle-photo" style="padding:9px 12px;border-radius:10px;border:1.5px dashed ${m.rPhoto ? 'var(--sig-safe)' : 'var(--phone-border)'};background:${m.rPhoto ? 'var(--sig-safe-bg)' : 'transparent'};color:${m.rPhoto ? 'var(--sig-safe-fg)' : 'var(--phone-fg)'};font-size:12.5px;font-weight:600">
            ${m.rPhoto ? 'Foto terlampir · ketuk untuk hapus' : '+ Tambah foto bukti (opsional)'}
          </button>
          <button data-mobile-action="toggle-anon" style="text-align:left;padding:9px 12px;border-radius:10px;border:1px solid var(--phone-border);background:var(--phone-card);color:var(--phone-fg);display:flex;align-items:center;gap:10px">
            <span style="width:18px;height:18px;border-radius:5px;border:2px solid var(--phone-accent);background:${m.rAnon ? 'var(--phone-accent)' : 'transparent'};display:grid;place-items:center;color:#fff;font-size:12px">${m.rAnon ? '✓' : ''}</span>
            <span><strong style="display:block;font-size:12.5px">Kirim tanpa nama (anonim)</strong><span style="font-size:11px;color:var(--phone-muted)">Laporan near miss tidak dipakai untuk sanksi pelapor</span></span>
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
      const viewTabs = `
        <div style="display:flex;gap:4px;padding:6px 12px;background:var(--phone-card-alt);border-bottom:1px solid var(--phone-border)">
          ${[['app', 'Di aplikasi'], ['other', 'Aplikasi lain'], ['lock', 'Layar kunci']].map((v) => `
            <button data-evac-view="${v[0]}" style="flex:1;padding:6px;border-radius:8px;border:1px solid ${m.evacView === v[0] ? 'var(--sig-warn)' : 'var(--phone-border)'};background:${m.evacView === v[0] ? 'var(--sig-warn-bg)' : 'var(--phone-card)'};color:var(--phone-fg);font-size:11px;font-weight:700">${v[1]}</button>
          `).join('')}
        </div>
      `;

      if (m.evacView === 'other' || m.evacView === 'lock') {
        const isAndroid = m.os === 'android';
        const outerCard = isAndroid
          ? `
            <div class="android-notif-banner">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
                <span style="font-size:10.5px;font-weight:800;color:#FACC15;letter-spacing:0.05em">ANDROID 16 · NOTIFIKASI PROGRES EVAKUASI</span>
                <span class="mono" style="font-size:13px;font-weight:700;color:#FCA5A5">${nav.timerText}</span>
              </div>
              <div style="display:flex;align-items:center;gap:12px">
                <div style="width:42px;height:42px;border-radius:12px;background:#EA580C;display:grid;place-items:center;flex:none">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" style="transform:rotate(${nav.deg}deg)"><path d="M12 20V5"></path><path d="M5 11l7-7 7 7"></path></svg>
                </div>
                <div style="flex:1;min-width:0">
                  <div style="font-size:14px;font-weight:700">${esc(nav.stepText)}</div>
                  <div style="font-size:11.5px;color:#CBD5E1">${esc(nav.stepSub)} · ke ${esc(nav.dest.name)}</div>
                </div>
              </div>
              <div style="margin-top:8px;height:6px;border-radius:3px;background:#334155;overflow:hidden">
                <div style="height:100%;width:${nav.pct}%;background:#FACC15"></div>
              </div>
              <div style="margin-top:5px;font-size:11px;color:#94A3B8">Tampil tetap di bilah status &amp; layar kunci Android · ${esc(nav.haptic)}</div>
            </div>
          `
          : `<div style="padding:52px 16px 6px;font-size:11.5px;color:#CBD5E1;text-align:center">${m.evacView === 'lock' ? 'Layar terkunci (Live Activity aktif)' : 'Pengguna sedang membuka aplikasi lain · ketuk Dynamic Island di atas'}</div>`;

        return `
          <div style="flex:1;display:flex;flex-direction:column;background:#091727;color:#F8FAFC">
            ${outerCard}
            ${viewTabs}
            <div style="flex:1;padding:14px 16px;display:flex;flex-direction:column;gap:12px">
              ${m.evacView === 'lock' ? `
                <div style="text-align:center;padding:12px 0">
                  <div class="mono" style="font-size:46px;font-weight:600;line-height:1">14:04</div>
                  <div style="font-size:12px;color:#94A3B8;margin-top:4px">Senin, 16 November 2026</div>
                </div>
                <div style="padding:14px;border-radius:16px;background:#13263E;border:1px solid #334E6E;display:flex;flex-direction:column;gap:8px">
                  <div style="display:flex;justify-content:space-between;font-size:11px;font-weight:700;color:#FCA5A5">
                    <span>LIVE ACTIVITY · EVAKUASI</span>
                    <span class="mono">${nav.timerText}</span>
                  </div>
                  <div style="display:flex;align-items:center;gap:12px">
                    <div style="width:42px;height:42px;border-radius:50%;background:#EA580C;display:grid;place-items:center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" style="transform:rotate(${nav.deg}deg)"><path d="M12 20V5"></path><path d="M5 11l7-7 7 7"></path></svg>
                    </div>
                    <div>
                      <div style="font-size:15px;font-weight:700">${esc(nav.stepText)}</div>
                      <div style="font-size:12px;color:#CBD5E1">${esc(nav.stepSub)}</div>
                    </div>
                  </div>
                  <div style="font-size:11px;color:#94A3B8">${nav.remain} m ke ${esc(nav.dest.name)} · ${esc(nav.haptic)}</div>
                </div>
              ` : `
                <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding-top:12px">
                  ${['Telepon', 'Pesan', 'Kamera', 'Galeri', 'Kalender', 'Peta', 'Catatan', 'JARAK AMAN'].map((lbl) => `
                    <div style="display:flex;flex-direction:column;align-items:center;gap:4px">
                      <div style="width:48px;height:48px;border-radius:12px;background:${lbl === 'JARAK AMAN' ? '#DC2626' : '#1E3A5F'};display:grid;place-items:center;font-weight:800;font-size:13px">${lbl.slice(0, 2).toUpperCase()}</div>
                      <span style="font-size:10px;color:#CBD5E1">${lbl}</span>
                    </div>
                  `).join('')}
                </div>
                <div style="padding:12px;border-radius:12px;background:#13263E;font-size:12px;color:#CBD5E1;line-height:1.45">
                  Panduan arah tetap muncul di luar aplikasi (${isAndroid ? 'Android 16 progress notification' : 'iOS Dynamic Island — ketuk kapsul hitam di atas'}).
                </div>
              `}
              <button data-mobile-action="go-sos" class="btn-danger" style="width:100%;margin-top:auto">Butuh bantuan (SOS)</button>
            </div>
          </div>
        `;
      }

      return `
        <div style="flex:1;display:flex;flex-direction:column">
          <div style="padding:44px 16px 12px;background:${isMandiri ? '#9A3412' : '#B91C1C'};color:#FFFFFF">
            <div style="font-size:10.5px;font-weight:800;letter-spacing:0.06em;opacity:0.9">${state.evacDrill ? 'LATIHAN · ' : ''}${isMandiri ? 'EVAKUASI MANDIRI · GUNCANGAN KUAT' : 'PERINTAH EVAKUASI · RUANG KENDALI'}</div>
            <div style="font-size:20px;font-weight:800;margin-top:2px">${hazBanner}</div>
            <div style="font-size:11.5px;opacity:0.9">Tujuan: ${esc(nav.dest.name)}${nav.dest.overflowed ? ' (dialihkan: Gedung B penuh ≥40)' : ''}</div>
          </div>
          ${viewTabs}
          <div style="flex:1;overflow-y:auto;padding:10px 16px 16px;display:flex;flex-direction:column;gap:9px">
            ${state.routeClosed ? `<div style="padding:8px 10px;border-radius:10px;background:var(--sig-crit-bg);color:var(--sig-crit);font-size:11.5px;font-weight:700">Jalan Dermaga B ditutup Ruang Kendali → dialihkan ke Rute Cadangan</div>` : ''}
            <div style="padding:12px;border-radius:14px;background:${m.wrong ? 'var(--sig-crit-bg)' : 'var(--sig-warn-bg)'};display:flex;align-items:center;gap:12px">
              <div style="width:48px;height:48px;border-radius:50%;background:${m.wrong ? '#DC2626' : '#EA580C'};display:grid;place-items:center;flex:none">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.8" style="transform:rotate(${nav.deg}deg)"><path d="M12 20V5"></path><path d="M5 11l7-7 7 7"></path></svg>
              </div>
              <div style="flex:1;min-width:0">
                <div style="font-size:15px;font-weight:800;color:var(--phone-fg)">${esc(nav.stepText)}</div>
                <div style="font-size:12px;color:var(--phone-muted)">${esc(nav.stepSub)}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:10px;color:var(--phone-muted)">Sisa</div>
                <div class="mono" style="font-size:18px;font-weight:700;color:${state.timedOut ? 'var(--sig-crit)' : 'var(--phone-fg)'}">${nav.timerText}</div>
              </div>
            </div>

            <div style="border-radius:12px;border:1px solid var(--phone-border);overflow:hidden;background:#0B2239">
              <svg viewBox="0 0 330 128" style="width:100%;height:auto;display:block">
                <rect width="330" height="128" fill="#0B2239"/>
                <rect x="20" y="54" width="44" height="16" rx="2" fill="#1E4068"/>
                <rect x="74" y="54" width="44" height="16" rx="2" fill="#1E4068"/>
                <rect x="256" y="72" width="66" height="36" rx="5" fill="#123A26" stroke="#4ADE80"/>
                <text x="289" y="93" text-anchor="middle" fill="#86EFAC" font-size="8.5" font-weight="700">Gedung B</text>
                <rect x="196" y="94" width="54" height="28" rx="5" fill="#123A26" stroke="#FACC15" stroke-dasharray="3 2"/>
                <text x="223" y="111" text-anchor="middle" fill="#FEF08A" font-size="8" font-weight="700">Area Timur</text>
                <polyline points="${nav.allPts}" fill="none" stroke="#94A3B8" stroke-width="3" stroke-dasharray="5 5"/>
                <polyline points="${nav.donePts}" fill="none" stroke="#FACC15" stroke-width="3.5"/>
                <circle cx="${nav.dotX}" cy="${nav.dotY}" r="6.5" fill="#38BDF8" stroke="#FFFFFF" stroke-width="2"/>
              </svg>
            </div>
            <div style="font-size:11px;color:var(--phone-muted)">${nav.remain} m ke ${esc(nav.dest.name)} · arah dari gerak GPS, bukan kompas · ${esc(nav.haptic)}</div>
            <div style="padding:8px 10px;border-radius:10px;background:${nav.stopped ? 'var(--sig-safe-bg)' : 'var(--sig-warn-bg)'};color:${nav.stopped ? 'var(--sig-safe-fg)' : 'var(--sig-warn-fg)'};font-size:11.5px;font-weight:600">
              ${nav.stopped ? 'Operator alat di zona Anda sudah konfirmasi berhenti lewat radio' : 'Operator alat sedang diminta berhenti lewat radio, waspada di jalur alat'}
            </div>
            <div style="font-size:11.5px;font-weight:700;color:var(--phone-muted)">Rekan sekitar (≤ 100 m · ajak ikut, jangan berbalik arah)</div>
            <div style="display:flex;justify-content:space-between;padding:7px 10px;border-radius:9px;border:1px solid var(--phone-border);font-size:12px">
              <span><strong>Sari · Checker</strong> (20 m)</span>
              <span class="badge badge-warn">Searah</span>
            </div>
            <button data-mobile-action="go-sos" class="btn-danger" style="width:100%;margin-top:auto">Butuh bantuan (SOS)</button>
          </div>
        </div>
      `;
    }

    if (scr === 'safe') {
      const dest = NS.getEvacDestination(state);
      const safeMin = 2 + Math.floor(m.safeAt / 60);
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:12px;padding:44px 18px 20px;justify-content:center;text-align:center">
          <div style="width:70px;height:70px;border-radius:50%;background:var(--sig-safe-bg);color:var(--sig-safe);display:grid;place-items:center;margin:0 auto;font-size:32px;font-weight:800">✓</div>
          <h2 style="margin:0;font-size:24px">Tercatat Aman otomatis</h2>
          <p style="margin:0;font-size:13.5px;color:var(--phone-muted);line-height:1.5">
            Geofence <strong>${esc(dest.name)}</strong> · 14.${pad(safeMin)} WIB · dicocokkan petugas titik kumpul. Tidak perlu memindai apa pun.
          </p>
          <div style="padding:10px 12px;border-radius:11px;background:var(--sig-warn-bg);color:var(--sig-warn-fg);font-size:12px;font-weight:600">
            Tetap di titik kumpul. Jangan kembali ke dermaga sebelum status evakuasi dicabut komandan insiden.
          </div>
          <button data-mobile-action="sim-clear" class="btn-safe" style="width:100%;height:44px;margin-top:8px">Simulasi: status evakuasi dicabut</button>
        </div>
      `;
    }

    if (scr === 'clear') {
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:12px;padding:44px 18px 20px">
          <span class="badge badge-safe" style="align-self:flex-start">STATUS EVAKUASI DICABUT</span>
          <h2 style="margin:0;font-size:23px">Status evakuasi dicabut</h2>
          <p style="margin:0;font-size:13px;color:var(--phone-muted);line-height:1.5">Lapangan C, D, dan Gate 3 dibuka kembali. <strong>Dermaga A dan B tetap ditutup</strong> menunggu pemeriksaan struktur rel crane &amp; trestle.</p>
          <div style="padding:11px 13px;border-radius:12px;background:var(--sig-warn-bg);color:var(--sig-warn-fg);font-size:12.5px;line-height:1.45">
            Aplikasi tidak menampilkan rute ke zona yang belum dibuka. Gempa susulan akan memicu ulang panduan evakuasi.
          </div>
          <button data-mobile-action="go-home" class="btn-primary" style="width:100%;height:44px;margin-top:auto">Kembali ke beranda</button>
        </div>
      `;
    }

    if (scr === 'sos') {
      return `
        <div style="flex:1;display:flex;flex-direction:column;gap:12px;padding:44px 18px 20px;background:#450A0A;color:#FEF2F2;text-align:center;justify-content:center">
          <span class="badge badge-crit" style="align-self:center;background:#DC2626;color:#fff">DARURAT · SLA 60 DETIK</span>
          <h2 style="margin:0;font-size:24px">Permintaan bantuan terkirim</h2>
          <p style="margin:0;font-size:13px;color:#FECACA;line-height:1.5">${esc(m.sosReason || 'Dikirim dari tombol Butuh bantuan.')} Detail koordinat Anda hanya terlihat oleh Ruang Kendali &amp; tim penyelamat.</p>
          <button data-mobile-action="cancel-sos" class="btn-ghost" style="width:100%;color:#fff;border-color:rgba(255,255,255,0.4);margin-top:14px">Batalkan permintaan</button>
        </div>
      `;
    }

    return '';
  }

  function renderMobile(container, state, store) {
    const m = state.mobile;
    const scr = m.screen;
    const evac = scr === 'alert';
    const nav = evac ? computeNav(state) : null;
    const inside = !(scr === 'outside' || scr === 'out' || scr === 'perm');
    const islandOn = evac && m.evacView === 'other' && m.os === 'ios';
    const iw = islandOn ? (m.islandOpen ? 354 : 290) : 114;
    const ih = islandOn ? (m.islandOpen ? 162 : 38) : 30;
    const ir = islandOn ? (m.islandOpen ? 32 : 20) : 18;

    const prevScrollEl = container.querySelector('.phone-scroll');
    const savedScroll = prevScrollEl ? prevScrollEl.scrollTop : 0;

    container.innerHTML = `
      <div class="mobile-stage">
        <div class="phone-col">
          <div class="phone-meta-strip">
            <span style="font-size:11.5px;font-weight:700;color:var(--fg-muted)">Andi · Checker (Pegawai)</span>
            <div class="os-switch" role="group" aria-label="Pilih OS Notifikasi Luar Aplikasi">
              <button data-os-toggle="ios" class="${m.os === 'ios' ? 'active' : ''}">iOS Island</button>
              <button data-os-toggle="android" class="${m.os === 'android' ? 'active' : ''}">Android 16</button>
            </div>
          </div>

          <div class="phone-frame">
            ${m.os === 'ios' || !evac || m.evacView === 'app' ? `
              <div class="ja-island" style="width:${iw}px;height:${ih}px;border-radius:${ir}px">
                ${islandOn && !m.islandOpen ? `
                  <button data-mobile-action="toggle-island" style="width:100%;height:100%;border:none;background:#000;color:#fff;display:flex;align-items:center;gap:8px;padding:0 12px 0 6px">
                    <span style="width:26px;height:26px;border-radius:50%;background:#F97316;display:grid;place-items:center;flex:none">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.8" style="transform:rotate(${nav.deg}deg)"><path d="M12 20V5"></path><path d="M5 11l7-7 7 7"></path></svg>
                    </span>
                    <span style="font-size:13px;font-weight:700">${esc(nav.islandShort)}</span>
                    <span style="flex:1"></span>
                    <span class="mono" style="font-size:13px;color:#FCA5A5">${nav.timerText}</span>
                  </button>
                ` : (islandOn && m.islandOpen ? `
                  <button data-mobile-action="toggle-island" style="width:100%;height:100%;border:none;background:#000;color:#fff;display:flex;flex-direction:column;gap:8px;padding:16px;text-align:left">
                    <div style="display:flex;align-items:center;gap:12px;width:100%">
                      <span style="width:46px;height:46px;border-radius:50%;background:#F97316;display:grid;place-items:center;flex:none">
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#000" stroke-width="2.8" style="transform:rotate(${nav.deg}deg)"><path d="M12 20V5"></path><path d="M5 11l7-7 7 7"></path></svg>
                      </span>
                      <div style="flex:1;min-width:0">
                        <div style="font-size:15px;font-weight:700">${esc(nav.stepText)}</div>
                        <div style="font-size:12px;color:#CBD5E1">${esc(nav.stepSub)}</div>
                      </div>
                      <span class="mono" style="font-size:16px;color:#FCA5A5">${nav.timerText}</span>
                    </div>
                    <div style="width:100%;height:5px;border-radius:3px;background:#334155;overflow:hidden"><div style="height:100%;width:${nav.pct}%;background:#F97316"></div></div>
                    <div style="font-size:11px;color:#CBD5E1">${nav.remain} m ke ${esc(nav.dest.name)} · ${esc(nav.haptic)}</div>
                  </button>
                ` : '')}
              </div>
            ` : ''}

            ${!evac && scr !== 'safe' && scr !== 'clear' && scr !== 'sos' ? renderTopBar(state, inside) : ''}
            <div class="phone-scroll">
              ${renderScreen(state)}
            </div>
          </div>

          ${evac ? `
            <div style="display:flex;gap:8px;width:382px;max-width:100%">
              <button data-mobile-action="toggle-wrong" class="btn-ghost" style="flex:1;font-size:12px">${m.wrong ? 'Kembali ke rute' : 'Simulasi salah arah'}</button>
            </div>
          ` : ''}
        </div>

        <aside class="scenario-rail">
          <div class="card" style="padding:12px">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
              <strong style="font-size:13px">Coba Skenario (10 Alur PRD v0.7)</strong>
              <span class="badge badge-gold">Sinkron Live</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:5px">
              ${SCENARIOS.map((sc) => `
                <button data-scenario="${sc.key}" class="scenario-btn ${m.activeScenario === sc.key ? 'active' : ''}">
                  <strong>${esc(sc.title)}</strong>
                  <span>${esc(sc.desc)}</span>
                </button>
              `).join('')}
            </div>
          </div>
        </aside>
      </div>
    `;

    const nextScrollEl = container.querySelector('.phone-scroll');
    if (nextScrollEl && savedScroll) nextScrollEl.scrollTop = savedScroll;

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
        if (target.dataset.osToggle) {
          store.dispatch({ type: 'SET_MOBILE_STATE', patch: { os: target.dataset.osToggle } });
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
        if (act === 'grant-loc') store.dispatch({ type: 'SET_MOBILE_STATE', patch: { locPerm: true } });
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
