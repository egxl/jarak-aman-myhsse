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
    if (tone === 'safe') return '#4ADE80';
    if (tone === 'warn') return '#FB923C';
    if (tone === 'crit') return '#F87171';
    if (tone === 'info') return '#38BDF8';
    return '#94A3B8';
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
              <button data-modal-close class="btn-ghost" style="padding:4px 10px">Tutup</button>
            </div>
            <div style="font-size:12.5px;color:var(--fg-muted)">Hanya komandan insiden atau wakil shift yang dapat mengirim. Setiap perintah tercatat dalam log audit.</div>
            <div>
              <div style="font-size:11px;font-weight:800;color:var(--sig-crit);margin-bottom:6px">JENIS BAHAYA</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${pill('data-draft-hazard', 'tsunami', 'Tsunami', d.hazard === 'tsunami')}
                ${pill('data-draft-hazard', 'gempa', 'Gempa', d.hazard === 'gempa')}
                ${pill('data-draft-hazard', 'b3', 'Kebakaran / B3', d.hazard === 'b3')}
              </div>
            </div>
            <div>
              <div style="font-size:11px;font-weight:800;color:var(--sig-crit);margin-bottom:6px">ZONA TERDAMPAK</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${pill('data-draft-zone', 'all', 'Seluruh Terminal', d.zone === 'all')}
                ${pill('data-draft-zone', 'dermaga', 'Dermaga A dan B', d.zone === 'dermaga')}
              </div>
            </div>
            <div>
              <div style="font-size:11px;font-weight:800;color:var(--sig-crit);margin-bottom:6px">DASAR KEPUTUSAN</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${pill('data-draft-basis', 'bmkg', 'Info BMKG (dipantau petugas)', d.basis === 'bmkg')}
                ${pill('data-draft-basis', 'lapangan', 'Laporan lapangan', d.basis === 'lapangan')}
                ${pill('data-draft-basis', 'langsung', 'Pengamatan langsung', d.basis === 'langsung')}
              </div>
            </div>
            <div>
              <div style="font-size:11px;font-weight:800;color:var(--sig-crit);margin-bottom:6px">MODE</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px">
                ${pill('data-draft-drill', 'false', 'Sungguhan', !d.drill)}
                ${pill('data-draft-drill', 'true', 'Latihan (LATIHAN)', !!d.drill)}
              </div>
            </div>
            <div style="padding:11px 13px;border-radius:11px;background:var(--bg-surface-2);border:1px solid var(--border-subtle)">
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
              <button data-modal-close class="btn-ghost" style="padding:4px 10px">Tutup</button>
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
            <pre class="mono" style="margin:0;padding:10px;border-radius:10px;background:var(--bg-surface-2);font-size:11px;max-height:130px;overflow:auto">${esc(jsonText)}</pre>
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
              <button data-modal-close class="btn-ghost" style="padding:4px 10px">Tutup</button>
            </div>
            <pre class="mono" style="margin:0;padding:12px;border-radius:10px;background:var(--bg-surface-2);font-size:11.5px;max-height:280px;overflow:auto">${esc(JSON.stringify(reportSummary, null, 2))}</pre>
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
          inspectorHtml = `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px"><span><strong>${esc(w.name)}</strong> (${esc(w.role)}) · ${esc(w.zone)} · ${esc(w.posDesc)}</span><span style="font-weight:700;color:${toneColor(w.tone)}">${esc(w.status)}</span></div>`;
        }
      } else {
        const e = eq.find((x) => x.id === state.selectedEntity.id);
        if (e) {
          inspectorHtml = `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px"><span><strong>${esc(e.id)}</strong> (${esc(e.type)}) · Operator: ${esc(e.op)} · ${esc(e.zone)}</span><span style="font-weight:700;color:${toneColor(e.tone)}">${esc(e.status)}</span></div>`;
        }
      }
    }

    return `
      <div class="ctrl-grid-map">
        <div class="card" style="display:flex;flex-direction:column;gap:8px;min-height:0">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <strong style="font-size:13.5px">Peta Terminal · Orang &amp; Alat</strong>
            <div style="display:flex;gap:10px;font-size:11px;color:var(--fg-secondary);flex-wrap:wrap">
              <span>● Aktif / Aman</span>
              <span>■ Alat (posisi TOS Fase 2)</span>
              <span>Tujuan aktif: <strong style="color:var(--brand-gold)">${esc(dest.name)}</strong></span>
            </div>
          </div>

          <div class="terminal-map-box">
            <svg viewBox="0 0 700 410" style="width:100%;height:100%;display:block">
              <rect x="0" y="0" width="700" height="58" fill="${evac && state.evacHazard === 'tsunami' ? '#581C24' : '#123A5C'}"/>
              <text x="16" y="34" fill="#DBEAFE" font-size="12" font-weight="700">${evac && state.evacHazard === 'tsunami' ? 'LAUT · ZONA MERAH TSUNAMI' : 'LAUT · ALUR PELAYARAN TANJUNG PRIOK'}</text>

              <rect x="14" y="64" width="236" height="44" rx="5" fill="#173858" stroke="${recovery ? '#F87171' : '#35608A'}"/>
              <text x="26" y="90" fill="${recovery ? '#FCA5A5' : '#E2EEF9'}" font-size="12" font-weight="700">${recovery ? 'Dermaga A · DITUTUP' : 'Dermaga A'}</text>

              <rect x="266" y="64" width="278" height="44" rx="5" fill="#173858" stroke="${recovery ? '#F87171' : '#35608A'}"/>
              <text x="278" y="90" fill="${recovery ? '#FCA5A5' : '#E2EEF9'}" font-size="12" font-weight="700">${recovery ? 'Dermaga B · DITUTUP' : 'Dermaga B'}</text>

              <rect x="14" y="126" width="250" height="170" rx="6" fill="#0F2A44" stroke="#244B70"/>
              <text x="26" y="146" fill="#93C5FD" font-size="11" font-weight="700">Lapangan C (Blok Petikemas)</text>
              <rect x="28" y="160" width="60" height="22" rx="3" fill="#1D446B"/><rect x="98" y="160" width="60" height="22" rx="3" fill="#1D446B"/>
              <rect x="28" y="196" width="60" height="22" rx="3" fill="#1D446B"/><rect x="98" y="196" width="60" height="22" rx="3" fill="#1D446B"/>
              <rect x="28" y="232" width="60" height="22" rx="3" fill="#1D446B"/><rect x="98" y="232" width="60" height="22" rx="3" fill="#1D446B"/>

              <rect x="280" y="126" width="244" height="170" rx="6" fill="#0F2A44" stroke="#244B70"/>
              <text x="292" y="146" fill="#93C5FD" font-size="11" font-weight="700">Lapangan D</text>
              <rect x="296" y="160" width="66" height="22" rx="3" fill="#1D446B"/><rect x="376" y="160" width="66" height="22" rx="3" fill="#1D446B"/>
              <rect x="296" y="196" width="66" height="22" rx="3" fill="#1D446B"/><rect x="376" y="196" width="66" height="22" rx="3" fill="#1D446B"/>

              <rect x="14" y="314" width="166" height="76" rx="6" fill="#133352" stroke="#2E5B85"/>
              <text x="26" y="340" fill="#E2EEF9" font-size="11.5" font-weight="700">Gate 3 · Pos Kiosk</text>
              <text x="26" y="358" fill="#94A3B8" font-size="10">STID &amp; Tap Kartu</text>

              <rect x="336" y="314" width="188" height="76" rx="8" fill="#113726" stroke="${dest.id === 'area-timur' ? '#FACC15' : '#4ADE80'}" stroke-width="${dest.id === 'area-timur' ? '2.5' : '1.4'}" stroke-dasharray="5 3"/>
              <text x="348" y="340" fill="#FEF08A" font-size="12" font-weight="700">Area Terbuka Timur</text>
              <text x="348" y="358" fill="#BBF7D0" font-size="11">Gempa / Overflow · ${timurCount}/60</text>

              <rect x="542" y="250" width="144" height="140" rx="8" fill="#113726" stroke="${dest.id === 'gedung-b' ? '#FACC15' : '#4ADE80'}" stroke-width="${dest.id === 'gedung-b' ? '2.5' : '1.4'}"/>
              <text x="554" y="276" fill="#86EFAC" font-size="12" font-weight="700">Gedung Evakuasi B</text>
              <text x="554" y="294" fill="#BBF7D0" font-size="11">Tsunami / B3 · ${gedungCount}/40</text>

              ${state.routeClosed && evac ? `
                <line x1="270" y1="112" x2="540" y2="112" stroke="#F87171" stroke-width="5" stroke-dasharray="8 5"/>
                <rect x="315" y="98" width="186" height="22" rx="4" fill="#7F1D1D"/>
                <text x="408" y="113" text-anchor="middle" fill="#FEE2E2" font-size="10.5" font-weight="700">Jalan Dermaga B Ditutup</text>
              ` : ''}
            </svg>

            ${sosRow ? `<div class="sos-pulse-ring" style="left:${sosRow.mapLeft};top:${sosRow.mapTop}"></div>` : ''}
            ${eq.map((e) => `
              <button data-select-kind="equip" data-select-id="${esc(e.id)}" title="${esc(e.id + ' · ' + e.status)}" class="map-pin map-pin-equip" style="left:${e.mapLeft};top:${e.mapTop};background:${pinColor(e.tone)}"></button>
            `).join('')}
            ${activeDots.map((w) => `
              <button data-select-kind="worker" data-select-id="${esc(w.id)}" title="${esc(w.name + ' · ' + w.status)}" class="map-pin map-pin-worker" style="left:${w.mapLeft};top:${w.mapTop};background:${pinColor(w.tone)}"></button>
            `).join('')}
          </div>

          <div style="padding:7px 10px;border-radius:9px;background:var(--bg-surface-2);border:1px solid var(--border-subtle)">
            ${inspectorHtml}
          </div>
          <div style="font-size:11px;color:var(--fg-muted)">
            ${noLocCount} orang tidak tampil di peta (tanpa aplikasi, izin ditolak, atau heartbeat hilang), tetap terhitung lewat data gate &amp; petugas titik kumpul.
          </div>
        </div>

        <div class="scroll-col">
          <div class="card" style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="font-size:13.5px">Antrean Alarm</strong>
              <span class="badge badge-warn">${alarms.filter((a) => a.showAction).length} terbuka</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:7px">
              ${alarms.map((a) => `
                <div style="padding:9px 11px;border-radius:10px;background:var(--bg-surface-2);border-left:3.5px solid ${toneColor(a.tone)};opacity:${a.showAction ? 1 : 0.55};display:flex;justify-content:space-between;align-items:center;gap:8px">
                  <div style="min-width:0">
                    <div style="font-size:10px;font-weight:800;color:${toneColor(a.tone)}">${esc(a.sev)}</div>
                    <div style="font-size:12.5px;font-weight:700">${esc(a.title)}</div>
                    <div style="font-size:11px;color:${a.escalated ? 'var(--sig-crit)' : 'var(--fg-muted)'}">${esc(a.meta)} · ${esc(a.statusText)}</div>
                  </div>
                  ${a.showAction ? `<button data-handle-alarm="${esc(a.id)}" class="btn-ghost" style="padding:5px 9px;font-size:11.5px;white-space:nowrap">${esc(a.actionLabel)}</button>` : ''}
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card" style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px">
              <strong style="font-size:13.5px">Daftar SAR · Belum Aman (${notSafe.length})</strong>
              <button data-ctrl-action="export-sar" class="btn-primary" style="padding:5px 10px;font-size:11.5px">Ekspor ke tim SAR</button>
            </div>
            ${!evac
              ? `<div style="font-size:12px;color:var(--fg-muted)">Daftar orang belum ditemukan muncul otomatis saat evakuasi aktif.</div>`
              : (notSafe.length === 0
                ? `<div style="font-size:12.5px;font-weight:700;color:var(--sig-safe)">Seluruh pekerja di zona evakuasi telah tercatat Aman.</div>`
                : `<div style="display:flex;flex-direction:column;gap:5px">
                    ${notSafe.map((r) => `
                      <div style="display:flex;justify-content:space-between;padding:6px 8px;border-radius:8px;background:var(--bg-surface-2);font-size:12px">
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
      `<button data-compliance-filter="${key}" class="${f === key ? 'btn-primary' : 'btn-ghost'}" style="padding:5px 10px;font-size:11.5px">${label}</button>`;

    return `
      <div class="ctrl-grid-split">
        <div class="scroll-col">
          <div class="card" style="display:flex;flex-direction:column;gap:10px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="font-size:14px">Kepatuhan Induction per Kelompok (FR-7.12)</strong>
              <button data-ctrl-action="export-hsse" class="btn-gold" style="padding:5px 11px;font-size:11.5px">Ekspor Laporan HSSE</button>
            </div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
              ${compliance.groups.map((g) => `
                <div style="padding:10px;border-radius:10px;background:var(--bg-surface-2);border:1px solid var(--border-subtle)">
                  <div style="display:flex;justify-content:space-between;font-size:12.5px;font-weight:700">
                    <span>${esc(g.group)}</span>
                    <span class="mono">${g.inducted}/${g.total} (${g.pct}%)</span>
                  </div>
                  <div style="height:6px;border-radius:3px;background:var(--border-subtle);margin:6px 0;overflow:hidden">
                    <div style="height:100%;width:${g.pct}%;background:${g.pct >= 90 ? 'var(--sig-safe)' : 'var(--brand-gold)'}"></div>
                  </div>
                  <div style="font-size:11px;color:var(--fg-muted)">Terpantau HP: ${g.tracked}/${g.total} · APD bermasalah: ${g.apdFail}</div>
                </div>
              `).join('')}
            </div>
          </div>

          <div class="card" style="display:flex;flex-direction:column;gap:8px">
            <div style="display:flex;justify-content:space-between;align-items:center">
              <strong style="font-size:14px">Peta Titik Rawan Mingguan (FR-7.7)</strong>
              <span class="badge badge-warn">Dari Laporan F12</span>
            </div>
            <div style="display:flex;flex-direction:column;gap:7px">
              ${hotspots.map((h) => `
                <div style="padding:9px 11px;border-radius:10px;background:var(--bg-surface-2);border-left:3.5px solid ${h.count >= 10 ? 'var(--sig-crit)' : 'var(--sig-warn)'};display:flex;justify-content:space-between;align-items:center;gap:10px">
                  <div>
                    <div style="font-size:12.5px;font-weight:700">${esc(h.zone)} — ${esc(h.title)}</div>
                    <div style="font-size:11px;color:var(--fg-muted)">Rekomendasi: ${esc(h.rec)}</div>
                  </div>
                  <span class="mono badge ${h.count >= 10 ? 'badge-crit' : 'badge-warn'}">${h.count} laporan</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="card" style="display:flex;flex-direction:column;gap:8px;min-height:0">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <strong style="font-size:14px">Daftar Orang di Area (${filtered.length})</strong>
            <div style="display:flex;gap:4px;flex-wrap:wrap">
              ${filterBtn('all', 'Semua')}
              ${filterBtn('pending', 'Belum Induction')}
              ${filterBtn('apd', 'APD Bermasalah')}
              ${filterBtn('noapp', 'Tanpa Aplikasi')}
            </div>
          </div>
          <div style="flex:1;min-height:0;overflow-y:auto;border:1px solid var(--border-subtle);border-radius:10px">
            ${filtered.map((r) => `
              <div style="display:grid;grid-template-columns:1.1fr 1fr 1.2fr 1fr;gap:8px;padding:8px 10px;border-bottom:1px solid var(--border-subtle);font-size:12px;align-items:center">
                <span><strong>${esc(r.name)}</strong><br><span style="font-size:11px;color:var(--fg-muted)">${esc(r.role)}</span></span>
                <span>${esc(r.zone)}<br><span style="font-size:11px;color:var(--fg-muted)">${esc(r.locLabel)}</span></span>
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
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
            <div>
              <strong style="font-size:14px">Editor Safety Induction Harian (Langkah 3)</strong>
              <div style="font-size:11.5px;color:var(--fg-muted)">Perubahan disusun operator, lalu disetujui HSSE sebelum terbit ke HP pekerja.</div>
            </div>
            ${stageBadge}
          </div>
          <div style="display:flex;flex-direction:column;gap:7px">
            ${allItems.map((it) => {
              const hidden = !!ind.hiddenIds[it.id];
              const isDraft = !!ind.draftIds[it.id];
              return `
                <div style="padding:9px 11px;border-radius:10px;background:var(--bg-surface-2);opacity:${hidden ? 0.45 : 1};display:flex;justify-content:space-between;align-items:center;gap:10px">
                  <div>
                    <div style="display:flex;gap:6px;align-items:center;margin-bottom:2px">
                      <span style="font-size:10px;font-weight:800;color:var(--brand-gold)">${esc(it.cat)}</span>
                      ${it.isNew ? '<span class="badge badge-gold">BARU</span>' : ''}
                      ${isDraft ? '<span class="badge badge-info">DRAF</span>' : ''}
                    </div>
                    <div style="font-size:12.5px;font-weight:600">${esc(it.text)}</div>
                    <div style="font-size:11px;color:var(--fg-muted)">${esc(it.meta)}</div>
                  </div>
                  ${it.locked
                    ? `<span style="font-size:11px;color:var(--fg-muted);white-space:nowrap">Terkunci</span>`
                    : `<button data-ind-toggle="${esc(it.id)}" class="btn-ghost" style="padding:4px 9px;font-size:11.5px;white-space:nowrap">${hidden ? 'Tampilkan' : 'Sembunyikan'}</button>`}
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="card scroll-col">
          <strong style="font-size:14px">Usulan dari Data Kemarin &amp; Laporan Masuk (F12)</strong>
          <div style="display:flex;flex-direction:column;gap:8px">
            ${ind.candidates.map((c) => {
              const addedOn = !!ind.addedIds[c.id];
              return `
                <div style="padding:10px 12px;border-radius:10px;background:var(--bg-surface-2);border:1px solid ${c.fromMobile ? 'var(--brand-gold)' : 'var(--border-subtle)'};display:flex;flex-direction:column;gap:6px">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <span style="font-size:10.5px;font-weight:800;color:var(--brand-gold)">${esc(c.src)}</span>
                    ${c.fromMobile ? '<span class="badge badge-gold">DARI HP PEKERJA</span>' : ''}
                  </div>
                  <div style="font-size:12.5px">${esc(c.text)}</div>
                  <button data-ind-add="${esc(c.id)}" class="${addedOn ? 'btn-ghost' : 'btn-primary'}" style="align-self:flex-start;padding:5px 10px;font-size:11.5px" ${addedOn ? 'disabled' : ''}>${addedOn ? 'Sudah di draf' : 'Tambahkan sebagai draf'}</button>
                </div>
              `;
            }).join('')}
          </div>

          <div style="margin-top:auto;padding-top:10px;border-top:1px solid var(--border-subtle);display:flex;flex-direction:column;gap:8px">
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
      { label: 'Di area (data gate)', val: activeTotal, sub: `${noLoc} tanpa posisi HP`, color: 'var(--sig-info)' },
      { label: 'Aman (titik kumpul)', val: amanTotal, sub: `${dest.name} (kap ${dest.cap})`, color: 'var(--sig-safe)' },
      { label: 'Menuju / belum konfirmasi', val: rows.filter((r) => r.status === 'Menuju titik aman' || r.status === 'Belum terkonfirmasi').length, sub: 'Arah gerak GPS + roll call', color: 'var(--sig-warn)' },
      { label: 'Belum keluar / bantuan', val: notSafeCount - rows.filter((r) => r.status === 'Menuju titik aman' || r.status === 'Belum terkonfirmasi').length, sub: 'Siap ekspor ke tim SAR', color: 'var(--sig-crit)' },
      { label: 'Alat berhenti', val: `${eqStopped}/${eq.length}`, sub: 'Konfirmasi radio / TOS F8', color: 'var(--sig-muted)' }
    ] : [
      { label: 'Di area (data gate)', val: activeTotal, sub: 'Pegawai, TKBM, sopir, tamu', color: 'var(--sig-info)' },
      { label: 'Terpantau aplikasi', val: activeTotal - noLoc, sub: 'Aktif otomatis lewat gate', color: 'var(--sig-safe)' },
      { label: 'Tanpa posisi', val: noLoc, sub: 'Tanpa HP, tolak izin, heartbeat', color: 'var(--sig-muted)' },
      { label: 'Alarm terbuka', val: alarms.filter((a) => a.showAction).length, sub: 'F12 near miss & pelanggaran', color: 'var(--sig-warn)' },
      { label: 'Induction hari ini', val: `${compliance.inducted}/${compliance.total}`, sub: `${compliance.apdFail} APD bermasalah`, color: compliance.apdFail ? 'var(--sig-crit)' : 'var(--sig-safe)' }
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
          <div style="display:flex;gap:7px;flex-wrap:wrap">
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
          <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;padding:10px 14px;border-radius:12px;background:#5C1515;border:1px solid #F87171;color:#FEF2F2;flex-wrap:wrap">
            <div>
              <div style="font-size:11px;font-weight:800;letter-spacing:0.06em;color:#FECACA">${state.evacDrill ? 'LATIHAN · ' : ''}PERINTAH EVAKUASI · KOMANDAN INSIDEN</div>
              <div style="font-size:15px;font-weight:700">Tujuan: ${esc(dest.name)} · Zona: ${state.evacZone === 'all' ? 'Seluruh Terminal' : 'Dermaga A dan B'}${state.routeClosed ? ' · Rute Cadangan Aktif' : ''}</div>
            </div>
            <div style="text-align:right">
              <div style="font-size:10.5px;color:#FECACA">Sisa waktu evakuasi</div>
              <div class="mono" style="font-size:28px;font-weight:700;line-height:1">${timerText}</div>
            </div>
          </div>
        ` : ''}

        ${recovery ? `
          <div style="padding:9px 14px;border-radius:11px;background:var(--sig-safe-bg);border:1px solid var(--sig-safe);color:var(--sig-safe-fg);font-size:12.5px">
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
          <span style="font-size:11.5px;color:var(--fg-muted)">Induksi aktif: Rev ${state.induction.rev} (${state.induction.pubAt} WIB)</span>
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
