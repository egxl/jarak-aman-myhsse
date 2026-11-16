(function (root) {
  'use strict';

  const NS = (root.JARAK_AMAN = root.JARAK_AMAN || {});
  NS.Views = NS.Views || {};

  let activeModal = null; // null | 'sar' | 'hsse'

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

  function toneColor(tone) {
    if (tone === 'safe') return 'var(--sig-safe)';
    if (tone === 'warn') return 'var(--sig-warn)';
    if (tone === 'crit') return 'var(--sig-crit)';
    if (tone === 'info') return 'var(--sig-info)';
    return 'var(--sig-muted)';
  }

  function pinColor(tone) {
    return toneColor(tone);
  }

  function renderModals(state, rows, compliance) {
    const portal = document.getElementById('modal-portal');
    if (!portal) return;

    if (state.confirmModalOpen) {
      const d = state.confirmDraft;
      const targetCount = d.zone === 'all'
        ? rows.filter((r) => !r.exited).length
        : rows.filter((r) => !r.exited && (r.zone === 'Dermaga A' || r.zone === 'Dermaga B')).length;
      const hazTitle = {
        tsunami: 'Evakuasi tsunami → Gedung Evakuasi B (tempat tinggi)',
        gempa: 'Evakuasi gempa → Area Terbuka Timur (jauh struktur & kontainer)',
        b3: 'Evakuasi kebakaran / B3 → Gedung Evakuasi B (melawan arah angin)'
      }[d.hazard];

      const pill = (attr, val, label, active) =>
        `<button ${attr}="${val}" style="padding:7px 12px;border-radius:999px;border:1.5px solid ${active ? 'var(--sig-crit)' : 'var(--border-strong)'};background:${active ? 'var(--sig-crit-solid)' : 'transparent'};color:${active ? '#fff' : 'var(--fg-primary)'};font-size:12.5px;font-weight:700">${label}</button>`;

      portal.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-card" role="dialog" aria-label="Konfirmasi Perintah Evakuasi">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="font-size:17px">Perintah Evakuasi · Langkah 2 dari 2</strong>
              <button data-modal-close class="btn-ghost" style="padding:5px 12px">Tutup</button>
            </div>
            <div style="font-size:12.5px;color:var(--fg-muted)">Hanya komandan insiden atau wakil shift yang dapat mengirim. Setiap perintah tercatat dalam log audit.</div>
            <div>
              <div style="font-size:12px;font-weight:800;color:var(--sig-crit);margin-bottom:6px">JENIS BAHAYA</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${pill('data-draft-hazard', 'tsunami', 'Tsunami', d.hazard === 'tsunami')}
                ${pill('data-draft-hazard', 'gempa', 'Gempa', d.hazard === 'gempa')}
                ${pill('data-draft-hazard', 'b3', 'Kebakaran / B3', d.hazard === 'b3')}
              </div>
            </div>
            <div>
              <div style="font-size:12px;font-weight:800;color:var(--sig-crit);margin-bottom:6px">ZONA TERDAMPAK</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${pill('data-draft-zone', 'all', 'Seluruh Terminal', d.zone === 'all')}
                ${pill('data-draft-zone', 'dermaga', 'Dermaga A dan B', d.zone === 'dermaga')}
              </div>
            </div>
            <div>
              <div style="font-size:12px;font-weight:800;color:var(--sig-crit);margin-bottom:6px">DASAR KEPUTUSAN</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${pill('data-draft-basis', 'bmkg', 'Info BMKG (dipantau petugas)', d.basis === 'bmkg')}
                ${pill('data-draft-basis', 'lapangan', 'Laporan lapangan', d.basis === 'lapangan')}
                ${pill('data-draft-basis', 'langsung', 'Pengamatan langsung', d.basis === 'langsung')}
              </div>
            </div>
            <div>
              <div style="font-size:12px;font-weight:800;color:var(--sig-crit);margin-bottom:6px">MODE</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${pill('data-draft-drill', 'false', 'Sungguhan', !d.drill)}
                ${pill('data-draft-drill', 'true', 'Latihan (LATIHAN)', !!d.drill)}
              </div>
            </div>
            <div style="padding:12px;border-radius:10px;background:var(--bg-surface-2);border:1px solid var(--border-subtle)">
              <strong style="display:block;font-size:13.5px">${d.drill ? 'LATIHAN · ' : ''}${hazTitle}</strong>
              <span style="font-size:12px;color:var(--fg-secondary)">Akan dikirim serentak ke <strong>${targetCount} orang</strong> di zona (data gate) via notifikasi HP, SMS cadangan, sirene, dan radio.</span>
            </div>
            <div style="display:flex;justify-content:flex-end;gap:8px">
              <button data-modal-close class="btn-ghost">Batal</button>
              <button data-ctrl-action="send-evac" class="btn-danger">${d.drill ? 'Kirim Perintah LATIHAN' : 'Kirim Perintah Evakuasi'}</button>
            </div>
          </div>
        </div>
      `;
    } else if (activeModal === 'sar') {
      const notSafe = rows.filter((r) => !r.exited && r.inEvacZone && r.status !== 'Aman');
      const jsonText = JSON.stringify({
        exportedAt: new Date().toISOString(),
        commandPost: state.cmdPost === 'cadangan' ? 'Pos Komando Cadangan' : 'Ruang Kendali Utama',
        hazard: state.evacHazard,
        drill: state.evacDrill,
        missingCount: notSafe.length,
        people: notSafe.map((r) => ({ name: r.name, role: r.role, zone: r.zone, status: r.status, lastKnown: r.posDesc }))
      }, null, 2);
      portal.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-card" role="dialog" aria-label="Ekspor Daftar SAR">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="font-size:17px">Ekspor Daftar SAR &amp; BPBD (${notSafe.length} orang belum Aman)</strong>
              <button data-modal-close class="btn-ghost" style="padding:5px 12px">Tutup</button>
            </div>
            <div style="font-size:12.5px;color:var(--fg-muted)">Data berikut disusun dari selisih transaksi gate dan titik kumpul untuk tim SAR/BPBD (FR-7.6).</div>
            <div style="max-height:190px;overflow-y:auto;border:1px solid var(--border-subtle);border-radius:10px">
              ${notSafe.length ? notSafe.map((r) => `
                <div style="display:flex;justify-content:space-between;padding:8px 10px;border-bottom:1px solid var(--border-subtle);font-size:12.5px">
                  <span><strong>${esc(r.name)}</strong> · ${esc(r.role)} (${esc(r.zone)})</span>
                  <span style="color:${toneColor(r.tone)};font-weight:700">${esc(r.status)}</span>
                </div>
              `).join('') : '<div style="padding:14px;font-size:13px;color:var(--sig-safe)">Seluruh pekerja di zona evakuasi telah tercatat Aman.</div>'}
            </div>
            <pre class="mono" style="margin:0;padding:10px;border-radius:10px;background:var(--bg-surface-2);font-size:12px;max-height:130px;overflow:auto">${esc(jsonText)}</pre>
            <div style="display:flex;justify-content:flex-end;gap:8px">
              <button data-modal-close class="btn-primary">Selesai</button>
            </div>
          </div>
        </div>
      `;
    } else if (activeModal === 'hsse') {
      const reportSummary = {
        tanggal: '2026-11-16',
        totalDiArea: compliance.total,
        inductionSelesai: compliance.inducted,
        terpantauHP: compliance.tracked,
        apdBermasalah: compliance.apdFail,
        tanpaAplikasi: compliance.noApp,
        perKelompok: compliance.groups,
        titikRawan: state.hotspots.map((h) => ({ zona: h.zone, jumlah: h.count, catatan: h.title }))
      };
      portal.innerHTML = `
        <div class="modal-backdrop">
          <div class="modal-card" role="dialog" aria-label="Ekspor Laporan HSSE">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="font-size:17px">Ekspor Laporan Kepatuhan MyHSSE (FR-7.12)</strong>
              <button data-modal-close class="btn-ghost" style="padding:5px 12px">Tutup</button>
            </div>
            <pre class="mono" style="margin:0;padding:12px;border-radius:10px;background:var(--bg-surface-2);font-size:12px;max-height:280px;overflow:auto">${esc(JSON.stringify(reportSummary, null, 2))}</pre>
            <div style="display:flex;justify-content:flex-end">
              <button data-modal-close class="btn-primary">Tutup</button>
            </div>
          </div>
        </div>
      `;
    } else {
      portal.innerHTML = '';
    }

    if (!portal.dataset.wired) {
      portal.dataset.wired = '1';
      portal.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        const store = NS.storeInstance;
        if (btn.hasAttribute('data-modal-close')) {
          activeModal = null;
          store.dispatch({ type: 'OPEN_CONFIRM_MODAL', open: false });
          return;
        }
        if (btn.dataset.draftHazard) store.dispatch({ type: 'UPDATE_CONFIRM_DRAFT', patch: { hazard: btn.dataset.draftHazard } });
        else if (btn.dataset.draftZone) store.dispatch({ type: 'UPDATE_CONFIRM_DRAFT', patch: { zone: btn.dataset.draftZone } });
        else if (btn.dataset.draftBasis) store.dispatch({ type: 'UPDATE_CONFIRM_DRAFT', patch: { basis: btn.dataset.draftBasis } });
        else if (btn.dataset.draftDrill) store.dispatch({ type: 'UPDATE_CONFIRM_DRAFT', patch: { drill: btn.dataset.draftDrill === 'true' } });
        else if (btn.dataset.ctrlAction === 'send-evac') {
          activeModal = null;
          store.dispatch({ type: 'START_EVAC', source: 'cmd' });
        }
      });
    }
  }

  function renderMapTab(state, rows, eq, alarms, dest) {
    const evac = state.phase === 'evac';
    const recovery = state.phase === 'recovery';
    const activeDots = rows.filter((r) => !r.exited && r.hasLivePos);
    const noLocCount = rows.filter((r) => !r.exited && !r.hasLivePos).length;
    const sosRow = rows.find((r) => r.status === 'Butuh bantuan');
    const notSafe = evac ? rows.filter((r) => !r.exited && r.inEvacZone && r.status !== 'Aman').sort((a, b) => a.rank - b.rank) : [];

    const gedungCount = rows.filter((r) => r.status === 'Aman' && r.pointId === 'gedung-b').length;
    const timurCount = rows.filter((r) => r.status === 'Aman' && r.pointId === 'area-timur').length;

    let inspectorHtml = '<span style="font-size:12px;color:var(--fg-muted)">Klik titik pekerja atau kotak alat di peta untuk inspeksi status &amp; koordinat.</span>';
    if (state.selectedEntity) {
      if (state.selectedEntity.kind === 'worker') {
        const w = rows.find((r) => r.id === state.selectedEntity.id);
        if (w) {
          inspectorHtml = `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px"><span><strong>${esc(w.name)}</strong> (${esc(w.role)}) · ${esc(w.zone)} · ${esc(w.posDesc)}</span><span style="font-weight:700;color:${toneColor(w.tone)}">${esc(w.status)}</span></div>`;
        }
      } else {
        const e = eq.find((x) => x.id === state.selectedEntity.id);
        if (e) {
          inspectorHtml = `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12.5px"><span><strong>${esc(e.id)}</strong> (${esc(e.type)}) · Operator: ${esc(e.op)} · ${esc(e.zone)}</span><span style="font-weight:700;color:${toneColor(e.tone)}">${esc(e.status)}</span></div>`;
        }
      }
    }

    const evacVectors = evac
      ? rows
          .filter((r) => !r.exited && r.inEvacZone && r.hasLivePos && r.status !== 'Aman' && r.status !== 'Butuh bantuan')
          .map((r) => {
            const x1 = (parseFloat(r.mapLeft) / 100) * 1200;
            const y1 = (parseFloat(r.mapTop) / 100) * 620;
            const tx = dest.mapX * 12 + 40;
            const ty = dest.mapY * 6.2 + 24;
            if (state.routeClosed && r.x > 48) {
              return `<path d="M ${x1.toFixed(1)},${y1.toFixed(1)} Q 535,340 ${tx.toFixed(1)},${ty.toFixed(1)}" fill="none" stroke="var(--sig-warn)" stroke-width="1.4" stroke-dasharray="5 5" opacity="0.7"/>`;
            }
            return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${tx.toFixed(1)}" y2="${ty.toFixed(1)}" stroke="var(--sig-warn)" stroke-width="1.4" stroke-dasharray="5 5" opacity="0.7"/>`;
          })
          .join('')
      : '';

    const yardBlocks = (startX, prefix, reeferEnd) => {
      const blocks = [];
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
          const idx = row * 4 + col + 1;
          const bx = startX + col * 102;
          const by = 248 + row * 68;
          const lbl = `${prefix}${String(idx).padStart(2, '0')}${reeferEnd && idx % 4 === 0 ? ' [RFR]' : ''}`;
          blocks.push(`<rect x="${bx}" y="${by}" width="88" height="48" rx="3" fill="var(--map-block-bg)" stroke="var(--map-block-stroke)" stroke-width="1"/>`);
          blocks.push(`<text x="${bx + 6}" y="${by + 16}" fill="var(--map-block-fg)" font-family="IBM Plex Mono, monospace" font-size="10" font-weight="600">${lbl}</text>`);
        }
      }
      return blocks.join('');
    };

    return `
      <div class="ctrl-grid-map">
        <div class="card" style="display:flex;flex-direction:column;gap:10px;min-height:0">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <strong style="font-size:14px">Peta Terminal Tanjung Priok · Orang &amp; Alat</strong>
            <div style="display:flex;gap:12px;font-size:12px;color:var(--fg-secondary);flex-wrap:wrap">
              <span>● Pekerja (GPS)</span>
              <span>■ Alat (TOS Fase 2)</span>
              <span>Tujuan: <strong style="color:var(--brand-gold)">${esc(dest.name)}</strong></span>
            </div>
          </div>

          <div class="terminal-map-box">
            <div class="terminal-map-stage">
              <svg viewBox="0 0 1200 620" style="width:100%;height:100%;display:block">
                <defs>
                  <pattern id="gridBlueprint" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="var(--map-grid)" stroke-width="0.9"/>
                    <circle cx="0" cy="0" r="1.4" fill="var(--map-grid-dot)"/>
                  </pattern>
                  <linearGradient id="seaGradPriok" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" style="stop-color:${evac && state.evacHazard === 'tsunami' ? '#7F1D1D' : 'var(--map-sea-top)'}"/>
                    <stop offset="100%" style="stop-color:${evac && state.evacHazard === 'tsunami' ? '#991B1B' : 'var(--map-sea-bot)'}"/>
                  </linearGradient>
                </defs>

                <!-- CAD Blueprint Grid -->
                <rect width="1200" height="620" fill="url(#gridBlueprint)"/>

                <!-- Java Sea Waterfront & Vessels (y: 0..102) -->
                <rect x="0" y="0" width="1200" height="102" fill="url(#seaGradPriok)" stroke="var(--map-yard-stroke)" stroke-width="1"/>
                <path d="M 0,24 Q 150,14 300,24 T 600,24 T 900,24 T 1200,24" fill="none" stroke="${evac && state.evacHazard === 'tsunami' ? '#FCA5A5' : 'var(--map-sea-wave)'}" stroke-width="1.2" stroke-dasharray="6 6"/>
                <text x="20" y="28" fill="${evac && state.evacHazard === 'tsunami' ? '#FECDD3' : 'var(--map-sea-fg)'}" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700">${evac && state.evacHazard === 'tsunami' ? 'LAUT JAWA // ZONA MERAH TSUNAMI' : 'LAUT JAWA // ALUR PELAYARAN TANJUNG PRIOK · DEPTH -14.5M LWS'}</text>

                <!-- Vessel 1: MV MERATUS BALI (Berth A) -->
                <g transform="translate(44, 46)">
                  <path d="M 0,28 L 24,4 L 350,4 L 385,28 L 350,48 L 24,48 Z" fill="var(--map-vessel-bg)" stroke="var(--map-vessel-stroke)" stroke-width="1.5"/>
                  <rect x="52" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="82" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="112" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="142" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="172" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="202" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="285" y="11" width="42" height="30" fill="var(--map-deck-bg)" stroke="var(--map-sea-fg)" stroke-width="1"/>
                  <text x="306" y="30" fill="var(--map-deck-fg)" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="700" text-anchor="middle">BRIDGE</text>
                  <text x="64" y="30" fill="var(--map-vessel-fg)" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="700">MV MERATUS BALI // BERTH A</text>
                </g>

                <!-- Vessel 2: MV SAMUDERA NUSANTARA (Berth B) -->
                <g transform="translate(520, 46)">
                  <path d="M 0,28 L 28,4 L 460,4 L 500,28 L 460,48 L 28,48 Z" fill="var(--map-vessel-bg)" stroke="var(--map-vessel-stroke)" stroke-width="1.5"/>
                  <rect x="58" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="88" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="118" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="148" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="178" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="208" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="238" y="10" width="22" height="32" fill="var(--map-vessel-hatch)" stroke="var(--map-block-stroke)" stroke-width="0.9"/>
                  <rect x="372" y="11" width="46" height="30" fill="var(--map-deck-bg)" stroke="var(--map-sea-fg)" stroke-width="1"/>
                  <text x="395" y="30" fill="var(--map-deck-fg)" font-family="IBM Plex Mono, monospace" font-size="9" font-weight="700" text-anchor="middle">BRIDGE</text>
                  <text x="72" y="30" fill="var(--map-vessel-fg)" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="700">MV SAMUDERA NUSANTARA // BERTH B</text>
                </g>

                <!-- Quay Apron & Crane Rail Strip (y: 102..204) -->
                <rect x="24" y="106" width="448" height="58" rx="4" fill="var(--map-deck-bg)" stroke="${recovery ? 'var(--sig-crit)' : 'var(--map-deck-stroke)'}" stroke-width="1.4"/>
                <text x="36" y="126" fill="${recovery ? 'var(--sig-crit)' : 'var(--map-deck-fg)'}" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700">${recovery ? 'DERMAGA A · DITUTUP SEMENTARA' : 'DERMAGA A // QUAY DECK'}</text>

                <rect x="492" y="106" width="580" height="58" rx="4" fill="var(--map-deck-bg)" stroke="${recovery ? 'var(--sig-crit)' : 'var(--map-deck-stroke)'}" stroke-width="1.4"/>
                <text x="506" y="126" fill="${recovery ? 'var(--sig-crit)' : 'var(--map-deck-fg)'}" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700">${recovery ? 'DERMAGA B · DITUTUP SEMENTARA' : 'DERMAGA B // QUAY DECK &amp; CRANE RAIL'}</text>

                <rect x="0" y="166" width="1200" height="40" fill="var(--map-road-bg)" stroke="var(--map-yard-stroke)" stroke-width="1"/>
                <line x1="0" y1="186" x2="1200" y2="186" stroke="var(--map-road-line)" stroke-width="1" stroke-dasharray="10 8"/>
                <text x="24" y="182" fill="var(--map-road-fg)" font-family="IBM Plex Mono, monospace" font-size="10.5">JALUR APRON DERMAGA // BATAS LAJU 20 KM/JAM</text>

                <!-- Lapangan C (Blocks C01 - C12) -->
                <rect x="52" y="216" width="456" height="248" rx="4" fill="var(--map-yard-bg)" stroke="var(--map-yard-stroke)" stroke-width="1.2"/>
                <text x="68" y="236" fill="var(--sig-info)" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700">LAPANGAN C // BLOK PETIKEMAS C01–C12</text>
                ${yardBlocks(68, 'C', false)}

                <!-- Central Haulage & Evac Corridor 02 -->
                <rect x="518" y="216" width="38" height="248" fill="var(--map-road-bg)" stroke="var(--map-yard-stroke)" stroke-width="1"/>
                <line x1="537" y1="216" x2="537" y2="464" stroke="var(--map-road-line)" stroke-width="1" stroke-dasharray="6 6"/>
                <text x="541" y="340" fill="var(--map-road-fg)" font-family="IBM Plex Mono, monospace" font-size="10" transform="rotate(90, 541, 340)">KORIDOR EVAK 02</text>

                <!-- Lapangan D (Blocks D01 - D12) -->
                <rect x="566" y="216" width="388" height="248" rx="4" fill="var(--map-yard-bg)" stroke="var(--map-yard-stroke)" stroke-width="1.2"/>
                <text x="582" y="236" fill="var(--sig-info)" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700">LAPANGAN D // BLOK EKSPOR &amp; REEFER</text>
                ${yardBlocks(582, 'D', true)}

                <!-- Gate 3 Pos Kiosk (x: 36..266, y: 492..600) -->
                <g transform="translate(36, 492)">
                  <rect x="0" y="0" width="230" height="108" rx="4" fill="var(--map-yard-bg)" stroke="var(--map-deck-stroke)" stroke-width="1.4"/>
                  <line x1="0" y1="36" x2="230" y2="36" stroke="var(--map-yard-stroke)" stroke-width="1"/>
                  <line x1="0" y1="72" x2="230" y2="72" stroke="var(--map-yard-stroke)" stroke-width="1"/>
                  <rect x="196" y="10" width="14" height="16" rx="2" fill="var(--brand-blue)"/>
                  <rect x="196" y="46" width="14" height="16" rx="2" fill="var(--brand-blue)"/>
                  <rect x="196" y="82" width="14" height="16" rx="2" fill="var(--brand-blue)"/>
                  <text x="14" y="24" fill="var(--map-sea-fg)" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700">GATE 3 · POS KIOSK</text>
                  <text x="14" y="59" fill="var(--map-block-fg)" font-family="IBM Plex Mono, monospace" font-size="11">STID &amp; TAP KARTU</text>
                  <text x="14" y="95" fill="var(--sig-safe)" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600">GEOFENCE PASIF AKTIF</text>
                </g>

                <!-- Area Terbuka Timur (Open Seismic Muster Zone, mapX:60, mapY:88) -->
                <g transform="translate(650, 504)">
                  <rect x="0" y="0" width="256" height="98" rx="6" fill="var(--map-safe-bg)" stroke="${dest.id === 'area-timur' ? 'var(--brand-gold)' : 'var(--sig-safe)'}" stroke-width="${dest.id === 'area-timur' ? '2.5' : '1.4'}" stroke-dasharray="6 4"/>
                  <text x="16" y="28" fill="var(--brand-gold-fg)" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="700">AREA TERBUKA TIMUR</text>
                  <text x="16" y="52" fill="var(--map-safe-sub)" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="600">Gempa / Overflow · ${timurCount}/60</text>
                  <text x="16" y="76" fill="var(--map-safe-fg)" font-family="IBM Plex Mono, monospace" font-size="10.5">Jauh struktur &amp; kontainer</text>
                </g>

                <!-- Gedung Evakuasi B (Vertical Shelter, mapX:83, mapY:72) -->
                <g transform="translate(966, 412)">
                  <circle cx="110" cy="78" r="56" fill="none" stroke="var(--sig-safe)" stroke-width="1" opacity="0.45"/>
                  <circle cx="110" cy="78" r="84" fill="none" stroke="var(--sig-safe)" stroke-width="0.9" stroke-dasharray="4 4" opacity="0.3"/>
                  <rect x="0" y="0" width="214" height="162" rx="6" fill="var(--map-safe-bg)" stroke="${dest.id === 'gedung-b' ? 'var(--brand-gold)' : 'var(--sig-safe)'}" stroke-width="${dest.id === 'gedung-b' ? '2.5' : '1.5'}"/>
                  <rect x="10" y="10" width="194" height="142" rx="4" fill="none" stroke="var(--map-safe-border)" stroke-width="1" stroke-dasharray="4 4"/>
                  <text x="107" y="38" fill="var(--map-safe-fg)" font-family="IBM Plex Mono, monospace" font-size="13" font-weight="700" text-anchor="middle">GEDUNG EVAKUASI B</text>
                  <text x="107" y="60" fill="var(--map-safe-sub)" font-family="IBM Plex Mono, monospace" font-size="11.5" text-anchor="middle">Tsunami / B3 · Shelter Vertikal</text>
                  <text x="107" y="94" fill="var(--sig-safe)" font-family="IBM Plex Mono, monospace" font-size="19" font-weight="800" text-anchor="middle">${gedungCount} / 40 AMAN</text>
                  <text x="107" y="124" fill="var(--map-safe-sub)" font-family="IBM Plex Mono, monospace" font-size="10.5" text-anchor="middle">Geofence + Petugas Titik Kumpul</text>
                </g>

                <!-- Roadblock Overlay -->
                ${state.routeClosed && evac ? `
                  <g transform="translate(566, 168)">
                    <line x1="0" y1="18" x2="490" y2="18" stroke="#EF4444" stroke-width="6" stroke-dasharray="12 8"/>
                    <rect x="85" y="4" width="320" height="28" rx="4" fill="#7F1D1D" stroke="#F87171" stroke-width="1.2"/>
                    <text x="245" y="23" text-anchor="middle" fill="#FEE2E2" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="700">JALAN DERMAGA B DITUTUP · RUTE CADANGAN</text>
                  </g>
                ` : ''}

                <!-- Dynamic Evacuation Vector Lines -->
                <g id="svg-evac-vectors">${evacVectors}</g>

                <!-- Heavy Equipment Labeled Markers (TOS Phase 2) -->
                <g id="svg-equipment-layer">
                  ${eq.map((e) => {
                    const cx = (e.x / 100) * 1200;
                    const cy = (e.y / 100) * 620;
                    const fill = pinColor(e.tone);
                    const selected = state.selectedEntity && state.selectedEntity.kind === 'equip' && state.selectedEntity.id === e.id;
                    return `
                      <g transform="translate(${cx.toFixed(1)}, ${cy.toFixed(1)})">
                        <rect x="-22" y="-11" width="44" height="22" rx="3" fill="var(--map-equip-bg)" stroke="${selected ? 'var(--brand-gold)' : fill}" stroke-width="${selected ? '2.2' : '1.6'}"/>
                        <text x="0" y="4" fill="var(--map-equip-fg)" font-family="IBM Plex Mono, monospace" font-size="10.5" font-weight="700" text-anchor="middle">${esc(e.id)}</text>
                      </g>
                    `;
                  }).join('')}
                </g>
              </svg>

              ${sosRow ? `<div class="sos-pulse-ring" style="left:${sosRow.mapLeft};top:${sosRow.mapTop}"></div>` : ''}
              ${eq.map((e) => `
                <button data-select-kind="equip" data-select-id="${esc(e.id)}" title="${esc(e.id + ' (' + e.type + ') · ' + e.status)}" aria-label="${esc(e.id)}" class="map-pin map-pin-equip" style="left:${e.mapLeft};top:${e.mapTop}"></button>
              `).join('')}
              ${activeDots.map((w) => `
                <button data-select-kind="worker" data-select-id="${esc(w.id)}" title="${esc(w.name + ' · ' + w.status)}" aria-label="${esc(w.name)}" class="map-pin map-pin-worker" style="left:${w.mapLeft};top:${w.mapTop};background:${pinColor(w.tone)}"></button>
              `).join('')}
            </div>
          </div>

          <div style="padding:8px 12px;border-radius:8px;background:var(--bg-surface-2);border:1px solid var(--border-subtle)">
            ${inspectorHtml}
          </div>
          <div style="font-size:12px;color:var(--fg-muted)">
            ${noLocCount} orang tidak tampil di peta (tanpa aplikasi, izin ditolak, atau heartbeat hilang), tetap terhitung lewat data gate &amp; petugas titik kumpul.
          </div>
        </div>

        <div class="scroll-col">
          <div class="card" style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:6px;border-bottom:1px solid var(--border-subtle)">
              <strong style="font-size:14px">Antrean Alarm</strong>
              <span class="badge badge-warn">${alarms.filter((a) => a.showAction).length} terbuka</span>
            </div>
            <div style="display:flex;flex-direction:column">
              ${alarms.map((a) => `
                <div class="ctrl-alarm-row" style="opacity:${a.showAction ? 1 : 0.55}">
                  <div style="display:flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:${toneColor(a.tone)}">
                    <span style="width:7px;height:7px;border-radius:50%;background:${toneColor(a.tone)};flex:none" aria-hidden="true"></span>
                    <span>${esc(a.sev)}</span>
                  </div>
                  <div style="font-size:13px;font-weight:700;line-height:1.35">${esc(a.title)}</div>
                  <div class="ctrl-alarm-foot">
                    <span style="font-size:12px;color:${a.escalated ? 'var(--sig-crit)' : 'var(--fg-muted)'};line-height:1.35">${esc(a.meta)} · ${esc(a.statusText)}</span>
                    ${a.showAction ? `<button data-handle-alarm="${esc(a.id)}" class="btn-ghost" style="padding:5px 10px;font-size:12px;white-space:nowrap;flex:none">${esc(a.actionLabel)}</button>` : ''}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card" style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding-bottom:6px;border-bottom:1px solid var(--border-subtle)">
              <strong style="font-size:14px">Daftar SAR · Belum Aman (${notSafe.length})</strong>
              <button data-ctrl-action="export-sar" class="btn-primary" style="padding:6px 12px;font-size:12px">Ekspor ke tim SAR</button>
            </div>
            ${!evac
              ? `<div style="font-size:12.5px;color:var(--fg-muted)">Daftar orang belum ditemukan muncul otomatis saat evakuasi aktif.</div>`
              : (notSafe.length === 0
                ? `<div style="font-size:13px;font-weight:700;color:var(--sig-safe)">Seluruh pekerja di zona evakuasi telah tercatat Aman.</div>`
                : `<div style="display:flex;flex-direction:column">
                    ${notSafe.map((r) => `
                      <div class="ctrl-list-row" style="font-size:12.5px">
                        <span><strong>${esc(r.name)}</strong> · ${esc(r.zone)}</span>
                        <span style="color:${toneColor(r.tone)};font-weight:700">${esc(r.status)}</span>
                      </div>
                    `).join('')}
                  </div>`)}
          </div>
        </div>
      </div>
    `;
  }

  function renderComplianceTab(state, rows, compliance, hotspots) {
    const f = state.complianceFilter;
    const filtered = rows.filter((r) => {
      if (r.exited) return false;
      if (f === 'pending') return r.indStatus === 'pending';
      if (f === 'apd') return r.indStatus === 'apd_helm' || r.indStatus === 'apd_vest';
      if (f === 'noapp') return !r.hasApp;
      return true;
    });

    const filterBtn = (key, label) =>
      `<button data-compliance-filter="${key}" class="${f === key ? 'btn-primary' : 'btn-ghost'}" style="padding:5px 11px;font-size:12px">${label}</button>`;

    return `
      <div class="ctrl-grid-split">
        <div class="scroll-col">
          <div class="card" style="display:flex;flex-direction:column;gap:12px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="font-size:14px">Kepatuhan Induction per Kelompok (FR-7.12)</strong>
              <button data-ctrl-action="export-hsse" class="btn-gold" style="padding:6px 12px;font-size:12px">Ekspor Laporan HSSE</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
              ${compliance.groups.map((g) => `
                <div style="padding:10px 12px;border-radius:10px;background:var(--bg-surface-2);border:1px solid var(--border-subtle)">
                  <div style="display:flex;justify-content:space-between;font-size:13px;font-weight:700">
                    <span>${esc(g.group)}</span>
                    <span class="mono">${g.inducted}/${g.total} (${g.pct}%)</span>
                  </div>
                  <div style="height:6px;border-radius:3px;background:var(--border-subtle);margin:7px 0;overflow:hidden">
                    <div style="height:100%;width:${g.pct}%;background:${g.pct >= 90 ? 'var(--sig-safe)' : 'var(--brand-gold)'}"></div>
                  </div>
                  <div style="font-size:12px;color:var(--fg-muted)">Terpantau HP: ${g.tracked}/${g.total} · APD bermasalah: ${g.apdFail}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card" style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;padding-bottom:6px;border-bottom:1px solid var(--border-subtle)">
              <strong style="font-size:14px">Peta Titik Rawan Mingguan (FR-7.7)</strong>
              <span class="badge badge-warn">Dari Laporan F12</span>
            </div>
            <div style="border-radius:8px;border:1px solid var(--border-strong);overflow:hidden;background:var(--map-bg)">
              <svg viewBox="0 0 800 210" style="width:100%;height:auto;display:block">
                <defs>
                  <radialGradient id="heatCriticalGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#EF4444" stop-opacity="0.85"/>
                    <stop offset="55%" stop-color="#EA580C" stop-opacity="0.35"/>
                    <stop offset="100%" stop-color="#EA580C" stop-opacity="0"/>
                  </radialGradient>
                  <radialGradient id="heatWarningGrad" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stop-color="#F59E0B" stop-opacity="0.85"/>
                    <stop offset="60%" stop-color="#D97706" stop-opacity="0.28"/>
                    <stop offset="100%" stop-color="#D97706" stop-opacity="0"/>
                  </radialGradient>
                </defs>
                <rect width="800" height="210" fill="var(--map-bg)"/>
                <rect x="0" y="0" width="800" height="26" fill="var(--map-sea-top)" stroke="var(--map-yard-stroke)"/>
                <text x="14" y="17" fill="var(--map-sea-fg)" font-family="IBM Plex Mono, monospace" font-size="10.5" font-weight="700">LAUT JAWA // ALUR PELAYARAN</text>
                <rect x="16" y="32" width="768" height="32" fill="var(--map-deck-bg)" stroke="var(--map-deck-stroke)"/>
                <text x="24" y="52" fill="var(--map-deck-fg)" font-family="IBM Plex Mono, monospace" font-size="10">DERMAGA A</text>
                <text x="680" y="52" fill="var(--map-deck-fg)" font-family="IBM Plex Mono, monospace" font-size="10">DERMAGA B</text>
                <rect x="44" y="74" width="600" height="90" rx="4" fill="var(--map-yard-bg)" stroke="var(--map-yard-stroke)"/>
                <text x="56" y="92" fill="var(--map-road-fg)" font-family="IBM Plex Mono, monospace" font-size="10">LAPANGAN PETIKEMAS C &amp; D</text>
                <rect x="16" y="170" width="120" height="32" rx="4" fill="var(--map-yard-bg)" stroke="var(--map-deck-stroke)"/>
                <text x="24" y="190" fill="var(--map-sea-fg)" font-family="IBM Plex Mono, monospace" font-size="10" font-weight="700">GATE 3</text>
                <rect x="664" y="140" width="120" height="60" rx="5" fill="var(--map-safe-bg)" stroke="var(--sig-safe)"/>
                <text x="724" y="174" fill="var(--map-safe-fg)" font-family="IBM Plex Mono, monospace" font-size="10" font-weight="700" text-anchor="middle">GEDUNG B</text>
                ${hotspots.map((h) => {
                  const hx = Math.round(h.x * 7.8);
                  const hy = Math.max(44, Math.min(184, Math.round(h.y * 2.02)));
                  const crit = h.count >= 10;
                  const r = crit ? 44 : 32;
                  const fillUrl = crit ? 'url(#heatCriticalGrad)' : 'url(#heatWarningGrad)';
                  const dotCol = crit ? 'var(--sig-crit)' : 'var(--sig-warn)';
                  const shortName = h.zone.split('·')[0].trim();
                  return `
                    <g>
                      <circle cx="${hx}" cy="${hy}" r="${r}" fill="${fillUrl}"/>
                      <circle cx="${hx}" cy="${hy}" r="6" fill="${dotCol}" stroke="var(--map-pin-ring)" stroke-width="1.5"/>
                      <text x="${hx + 12}" y="${hy - 2}" fill="var(--fg-primary)" font-family="IBM Plex Mono, monospace" font-size="10.5" font-weight="700">${h.count} LAPORAN</text>
                      <text x="${hx + 12}" y="${hy + 10}" fill="${crit ? 'var(--sig-crit)' : 'var(--sig-warn)'}" font-family="IBM Plex Mono, monospace" font-size="9.5" font-weight="700">${esc(shortName)}</text>
                    </g>
                  `;
                }).join('')}
              </svg>
            </div>
            <div style="display:flex;flex-direction:column">
              ${hotspots.map((h) => {
                const hsTone = h.count >= 10 ? 'var(--sig-crit)' : 'var(--sig-warn)';
                return `
                  <div class="ctrl-list-row">
                    <div>
                      <div style="display:flex;align-items:center;gap:6px;font-size:13px;font-weight:700">
                        <span style="width:7px;height:7px;border-radius:50%;background:${hsTone};flex:none" aria-hidden="true"></span>
                        <span>${esc(h.zone)} — ${esc(h.title)}</span>
                      </div>
                      <div style="font-size:12px;color:var(--fg-muted);margin-top:2px">Rekomendasi: ${esc(h.rec)}</div>
                    </div>
                    <span class="mono badge ${h.count >= 10 ? 'badge-crit' : 'badge-warn'}">${h.count} laporan</span>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div class="card" style="display:flex;flex-direction:column;gap:10px;min-height:0">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <strong style="font-size:14px">Daftar Orang di Area (${filtered.length})</strong>
            <div style="display:flex;gap:5px;flex-wrap:wrap">
              ${filterBtn('all', 'Semua')}
              ${filterBtn('pending', 'Belum Induction')}
              ${filterBtn('apd', 'APD Bermasalah')}
              ${filterBtn('noapp', 'Tanpa Aplikasi')}
            </div>
          </div>
          <div style="flex:1;min-height:0;overflow-y:auto;border:1px solid var(--border-subtle);border-radius:10px">
            ${filtered.map((r) => `
              <div style="display:grid;grid-template-columns:1.1fr 1fr 1.2fr 1fr;gap:8px;padding:9px 12px;border-bottom:1px solid var(--border-subtle);font-size:12.5px;align-items:center">
                <span><strong>${esc(r.name)}</strong><br><span style="font-size:12px;color:var(--fg-muted)">${esc(r.role)}</span></span>
                <span>${esc(r.zone)}<br><span style="font-size:12px;color:var(--fg-muted)">${esc(r.locLabel)}</span></span>
                <span style="color:${toneColor(r.indTone)};font-weight:700">${esc(r.indText)}</span>
                <span style="color:${toneColor(r.tone)};font-weight:700;text-align:right">${esc(r.status)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderInductionTab(state) {
    const D = NS.DATA;
    const ind = state.induction;
    const added = ind.candidates.filter((c) => ind.addedIds[c.id]).map((c) => ({ id: c.id, cat: c.cat, text: c.text, meta: `${c.src} · data contoh`, isNew: true }));
    const allItems = D.INDUCTION_BASE.concat(added);
    const stageBadge = ind.stage === 'published'
      ? `<span class="badge badge-safe">Terbit · Rev ${ind.rev} (${ind.pubAt} WIB)</span>`
      : (ind.stage === 'review' ? `<span class="badge badge-info">Menunggu Persetujuan HSSE</span>` : `<span class="badge badge-gold">Draf Belum Terbit</span>`);

    return `
      <div class="ctrl-grid-split">
        <div class="card scroll-col">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding-bottom:8px;border-bottom:1px solid var(--border-subtle)">
            <div>
              <strong style="font-size:14px">Editor Safety Induction Harian (Langkah 3)</strong>
              <div style="font-size:12px;color:var(--fg-muted)">Perubahan disusun operator, lalu disetujui HSSE sebelum terbit ke HP pekerja.</div>
            </div>
            ${stageBadge}
          </div>
          <div style="display:flex;flex-direction:column">
            ${allItems.map((it) => {
              const hidden = !!ind.hiddenIds[it.id];
              const isDraft = !!ind.draftIds[it.id];
              return `
                <div class="ctrl-list-row" style="opacity:${hidden ? 0.45 : 1}">
                  <div>
                    <div style="display:flex;gap:6px;align-items:center;margin-bottom:2px">
                      <span style="font-size:12px;font-weight:700;color:var(--brand-gold)">${esc(it.cat)}</span>
                      ${it.isNew ? '<span class="badge badge-gold">BARU</span>' : ''}
                      ${isDraft ? '<span class="badge badge-info">DRAF</span>' : ''}
                    </div>
                    <div style="font-size:13px;font-weight:600">${esc(it.text)}</div>
                    <div style="font-size:12px;color:var(--fg-muted)">${esc(it.meta)}</div>
                  </div>
                  ${it.locked
                    ? `<span style="font-size:12px;color:var(--fg-muted);white-space:nowrap">Terkunci</span>`
                    : `<button data-ind-toggle="${esc(it.id)}" class="btn-ghost" style="padding:5px 10px;font-size:12px;white-space:nowrap">${hidden ? 'Tampilkan' : 'Sembunyikan'}</button>`}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="card scroll-col">
          <strong style="font-size:14px">Usulan dari Data Kemarin &amp; Laporan Masuk (F12)</strong>
          <div style="display:flex;flex-direction:column;gap:10px">
            ${ind.candidates.map((c) => {
              const addedOn = !!ind.addedIds[c.id];
              return `
                <div style="padding:11px 12px;border-radius:10px;background:var(--bg-surface-2);border:1px solid ${c.fromMobile ? 'var(--brand-gold)' : 'var(--border-subtle)'};display:flex;flex-direction:column;gap:6px">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:12px;font-weight:700;color:var(--brand-gold)">${esc(c.src)}</span>
                    ${c.fromMobile ? '<span class="badge badge-gold">DARI HP PEKERJA</span>' : ''}
                  </div>
                  <div style="font-size:13px">${esc(c.text)}</div>
                  <button data-ind-add="${esc(c.id)}" class="${addedOn ? 'btn-ghost' : 'btn-primary'}" style="align-self:flex-start;padding:5px 11px;font-size:12px" ${addedOn ? 'disabled' : ''}>${addedOn ? 'Sudah di draf' : 'Tambahkan sebagai draf'}</button>
                </div>
              `;
            }).join('')}
          </div>

          <div style="margin-top:auto;padding-top:12px;border-top:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:8px">
            <button data-ctrl-action="toggle-reread" class="btn-ghost" style="text-align:left;border-color:${ind.rereadRequired ? 'var(--brand-gold)' : 'var(--border-strong)'};background:${ind.rereadRequired ? 'var(--brand-gold-bg)' : 'transparent'}">
              ${ind.rereadRequired ? '✓ Wajib baca ulang Langkah 3 aktif saat terbit (info darurat)' : 'Wajibkan pekerja baca ulang Langkah 3 setelah terbit (opsional)'}
            </button>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              <button data-ctrl-action="submit-ind" class="btn-primary" ${ind.stage === 'draft' ? '' : 'disabled'}>1. Kirim ke HSSE untuk disetujui</button>
              <button data-ctrl-action="approve-ind" class="btn-safe" ${ind.stage === 'review' ? '' : 'disabled'}>2. Setujui &amp; Terbitkan (HSSE)</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function renderControl(container, state, store) {
    const rows = NS.getWorkerRows(state);
    const eq = NS.getEquipmentRows(state);
    const alarms = NS.getAlarmQueue(state);
    const dest = NS.getEvacDestination(state);
    const compliance = NS.getComplianceStats(state);
    const hotspots = NS.getHotspots(state);

    const evac = state.phase === 'evac';
    const recovery = state.phase === 'recovery';
    const elapsed = evac ? state.evacTotal - state.evacLeft : 0;
    const min = 2 + Math.floor(elapsed / 60);
    const clock = evac ? `14.${pad(min)} WIB` : (recovery ? '14.40 WIB' : '13.59 WIB');
    const timerText = `${pad(Math.floor(state.evacLeft / 60))}:${pad(state.evacLeft % 60)}`;

    const noLoc = rows.filter((r) => !r.exited && !r.hasLivePos).length;
    const activeTotal = rows.filter((r) => !r.exited).length;
    const amanTotal = rows.filter((r) => r.status === 'Aman').length;
    const notSafeCount = rows.filter((r) => !r.exited && r.inEvacZone && r.status !== 'Aman').length;
    const eqStopped = eq.filter((e) => e.stopped).length;

    const kpis = evac ? [
      { label: 'Di area (gate)', val: activeTotal, sub: `${noLoc} tanpa HP`, color: 'var(--sig-info)' },
      { label: 'Aman (kumpul)', val: amanTotal, sub: `${dest.name} (${dest.cap})`, color: 'var(--sig-safe)' },
      { label: 'Menuju / tunggu', val: rows.filter((r) => r.status === 'Menuju titik aman' || r.status === 'Belum terkonfirmasi').length, sub: 'GPS + roll call', color: 'var(--sig-warn)' },
      { label: 'Belum keluar', val: notSafeCount - rows.filter((r) => r.status === 'Menuju titik aman' || r.status === 'Belum terkonfirmasi').length, sub: 'Siap ekspor SAR', color: 'var(--sig-crit)' },
      { label: 'Alat berhenti', val: `${eqStopped}/${eq.length}`, sub: 'Radio / TOS F8', color: 'var(--sig-muted)' }
    ] : [
      { label: 'Di area (gate)', val: activeTotal, sub: 'Pegawai, TKBM, sopir', color: 'var(--sig-info)' },
      { label: 'Terpantau HP', val: activeTotal - noLoc, sub: 'Aktif via Gate 3', color: 'var(--sig-safe)' },
      { label: 'Tanpa posisi', val: noLoc, sub: 'Tanpa HP / tolak izin', color: 'var(--sig-muted)' },
      { label: 'Alarm terbuka', val: alarms.filter((a) => a.showAction).length, sub: 'Near miss & F12', color: 'var(--sig-warn)' },
      { label: 'Induction', val: `${compliance.inducted}/${compliance.total}`, sub: `${compliance.apdFail} APD bermasalah`, color: compliance.apdFail ? 'var(--sig-crit)' : 'var(--sig-safe)' }
    ];

    const prevScrolls = Array.from(container.querySelectorAll('.scroll-col')).map((el) => el.scrollTop);

    container.innerHTML = `
      <div class="ctrl-shell">
        <div class="ctrl-top-strip">
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <strong style="font-size:16px">${state.cmdPost === 'cadangan' ? 'Pos Komando Cadangan (Tablet Gedung B)' : 'Ruang Kendali Utama'}</strong>
            <span class="mono" style="font-size:12.5px;color:var(--fg-muted)">${clock} · Data contoh</span>
            <span class="badge ${evac ? 'badge-crit' : (recovery ? 'badge-gold' : 'badge-safe')}">${evac ? (state.evacDrill ? 'LATIHAN · EVAKUASI' : 'EVAKUASI AKTIF') : (recovery ? 'PEMULIHAN' : 'Normal')}</span>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${state.phase === 'normal' ? `<button data-ctrl-action="open-confirm" class="btn-danger">Perintahkan evakuasi</button>` : ''}
            ${evac ? `
              <button data-ctrl-action="toggle-route" class="btn-ghost">${state.routeClosed ? 'Buka Jalan Dermaga B' : 'Tutup Jalan Dermaga B'}</button>
              <button data-ctrl-action="toggle-cmd" class="btn-ghost">${state.cmdPost === 'cadangan' ? 'Ke Ruang Kendali Utama' : 'Pindah Pos Cadangan'}</button>
              <button data-ctrl-action="cancel-evac" class="btn-ghost">Batalkan (salah kirim)</button>
              <button data-ctrl-action="end-evac" class="btn-safe">Cabut status evakuasi</button>
            ` : ''}
            ${recovery ? `<button data-ctrl-action="reopen-zones" class="btn-safe">Dermaga selesai diperiksa, buka zona</button>` : ''}
          </div>
        </div>

        ${evac ? `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;background:#5C1515;border:1px solid #F87171;color:#FEF2F2;flex-wrap:wrap">
            <div>
              <div style="font-size:12px;font-weight:700;letter-spacing:0.04em;color:#FECACA">${state.evacDrill ? 'LATIHAN · ' : ''}PERINTAH EVAKUASI · KOMANDAN INSIDEN</div>
              <div style="font-size:15px;font-weight:700">Tujuan: ${esc(dest.name)} · Zona: ${state.evacZone === 'all' ? 'Seluruh Terminal' : 'Dermaga A dan B'}${state.routeClosed ? ' · Rute Cadangan Aktif' : ''}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:12px;color:#FECACA">Sisa waktu evakuasi</div>
              <div class="mono" style="font-size:26px;font-weight:700;line-height:1">${timerText}</div>
            </div>
          </div>
        ` : ''}

        ${recovery ? `
          <div style="padding:9px 14px;border-radius:10px;background:var(--sig-safe-bg);border:1px solid var(--sig-safe);color:var(--sig-safe-fg);font-size:12.5px">
            <strong>Status evakuasi dicabut:</strong> Lapangan C, D, dan Gate 3 dibuka. Dermaga A &amp; B tetap ditutup menunggu pemeriksaan struktur rel crane.
          </div>
        ` : ''}

        <div class="ctrl-kpi-grid">
          ${kpis.map((k) => `
            <div class="ctrl-kpi-card">
              <span class="kpi-label">${esc(k.label)}</span>
              <span class="kpi-val mono" style="color:${k.color}">${esc(k.val)}</span>
              <span class="kpi-sub">${esc(k.sub)}</span>
            </div>
          `).join('')}
        </div>

        <div class="ctrl-tab-bar">
          <div class="ctrl-tabs" role="tablist">
            <button data-ctrl-tab="map" class="ctrl-tab-btn ${state.activeControlTab === 'map' ? 'active' : ''}">1. Peta &amp; Evakuasi</button>
            <button data-ctrl-tab="compliance" class="ctrl-tab-btn ${state.activeControlTab === 'compliance' ? 'active' : ''}">2. Kepatuhan &amp; Titik Rawan</button>
            <button data-ctrl-tab="induction" class="ctrl-tab-btn ${state.activeControlTab === 'induction' ? 'active' : ''}">3. Editor Induction</button>
          </div>
          <span style="font-size:12px;color:var(--fg-muted)">Induksi aktif: Rev ${state.induction.rev} (${state.induction.pubAt} WIB)</span>
        </div>

        <div class="ctrl-tab-body">
          ${state.activeControlTab === 'map'
            ? renderMapTab(state, rows, eq, alarms, dest)
            : (state.activeControlTab === 'compliance'
              ? renderComplianceTab(state, rows, compliance, hotspots)
              : renderInductionTab(state))}
        </div>
      </div>
    `;

    Array.from(container.querySelectorAll('.scroll-col')).forEach((el, idx) => {
      if (prevScrolls[idx]) el.scrollTop = prevScrolls[idx];
    });

    renderModals(state, rows, compliance);

    if (!container.dataset.wired) {
      container.dataset.wired = '1';
      container.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        if (btn.dataset.ctrlTab) {
          store.dispatch({ type: 'SET_VIEW_TAB', tab: btn.dataset.ctrlTab });
          return;
        }
        if (btn.dataset.complianceFilter) {
          store.dispatch({ type: 'SET_COMPLIANCE_FILTER', filter: btn.dataset.complianceFilter });
          return;
        }
        if (btn.dataset.selectKind) {
          store.dispatch({ type: 'SELECT_ENTITY', entity: { kind: btn.dataset.selectKind, id: btn.dataset.selectId } });
          return;
        }
        if (btn.dataset.handleAlarm) {
          store.dispatch({ type: 'HANDLE_ALARM', id: btn.dataset.handleAlarm });
          return;
        }
        if (btn.dataset.indToggle) {
          store.dispatch({ type: 'TOGGLE_INDUCTION_ITEM', id: btn.dataset.indToggle });
          return;
        }
        if (btn.dataset.indAdd) {
          store.dispatch({ type: 'ADD_INDUCTION_CANDIDATE', id: btn.dataset.indAdd });
          return;
        }

        const act = btn.dataset.ctrlAction;
        if (!act) return;
        if (act === 'open-confirm') store.dispatch({ type: 'OPEN_CONFIRM_MODAL', open: true });
        else if (act === 'toggle-route') store.dispatch({ type: 'TOGGLE_ROUTE_CLOSED' });
        else if (act === 'toggle-cmd') store.dispatch({ type: 'TOGGLE_CMD_POST' });
        else if (act === 'cancel-evac') store.dispatch({ type: 'CANCEL_EVAC' });
        else if (act === 'end-evac') store.dispatch({ type: 'END_EVAC' });
        else if (act === 'reopen-zones') store.dispatch({ type: 'REOPEN_ZONES' });
        else if (act === 'submit-ind') store.dispatch({ type: 'SUBMIT_INDUCTION_HSSE' });
        else if (act === 'approve-ind') store.dispatch({ type: 'APPROVE_INDUCTION' });
        else if (act === 'toggle-reread') store.dispatch({ type: 'TOGGLE_REREAD' });
        else if (act === 'export-sar') {
          activeModal = 'sar';
          store.dispatch({ type: 'EXPORT_SAR' });
        } else if (act === 'export-hsse') {
          activeModal = 'hsse';
          renderControl(container, store.getState(), store);
        }
      });
    }
  }

  NS.Views.renderControl = renderControl;
})(window);
