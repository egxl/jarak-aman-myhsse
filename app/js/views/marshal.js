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

  function toneColor(tone) {
    if (tone === 'safe') return 'var(--sig-safe)';
    if (tone === 'warn') return 'var(--sig-warn)';
    if (tone === 'crit') return 'var(--sig-crit)';
    if (tone === 'info') return 'var(--sig-info)';
    return 'var(--sig-muted)';
  }

  function renderMarshal(container, state, store) {
    const D = NS.DATA;
    const m = state.marshal;
    const rows = NS.getWorkerRows(state).filter((r) => !r.exited);
    const dest = NS.getEvacDestination(state);
    const evac = state.phase === 'evac';

    const pendingMap = {};
    m.pendingQueue.forEach((item) => { pendingMap[item.workerId] = item; });

    const displayRows = rows.map((r) => {
      const queued = pendingMap[r.id];
      return Object.assign({}, r, {
        queuedStatus: queued ? queued.status : null
      });
    });

    const filtered = displayRows.filter((r) => {
      const effectiveSafe = r.queuedStatus === 'Aman' || r.status === 'Aman';
      if (m.filter === 'pending') return !effectiveSafe;
      if (m.filter === 'safe') return effectiveSafe;
      return true;
    });

    const gedungCount = displayRows.filter((r) => r.status === 'Aman' && r.pointId === 'gedung-b').length;
    const timurCount = displayRows.filter((r) => r.status === 'Aman' && r.pointId === 'area-timur').length;
    const bulkCount = Object.keys(m.bulkSelected).filter((id) => m.bulkSelected[id]).length;

    container.innerHTML = `
      <div class="marshal-shell">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--border-subtle);padding-bottom:14px">
          <div>
            <span style="font-size:11px;font-weight:800;letter-spacing:0.06em;color:var(--brand-gold)">TABLET PETUGAS TITIK KUMPUL (FR-3.3)</span>
            <h1 style="margin:4px 0 4px;font-size:22px">Pencocokan Headcount &amp; Roll-Call Evakuasi</h1>
            <div style="font-size:12.5px;color:var(--fg-muted)">Catatan petugas titik kumpul menjadi sumber kebenaran jika berbeda dengan deteksi geofence otomatis.</div>
          </div>
          <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
            <button data-marshal-action="toggle-offline" class="${m.offline ? 'btn-danger' : 'btn-safe'}" style="font-size:12.5px">
              ${m.offline ? `Mode Tanpa Sinyal (${m.pendingQueue.length} antrean offline)` : 'Sinkron Real-time · Online (0 antrean)'}
            </button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${['gedung-b', 'area-timur'].map((pid) => {
            const pt = D.ASSEMBLY_POINTS[pid];
            const cnt = pid === 'gedung-b' ? gedungCount : timurCount;
            const active = m.selectedPoint === pid;
            const isPrimaryDest = dest.id === pid;
            return `
              <button data-marshal-point="${pid}" style="text-align:left;padding:12px 14px;border-radius:12px;border:2px solid ${active ? 'var(--brand-gold)' : 'var(--border-subtle)'};background:${active ? 'var(--brand-gold-bg)' : 'var(--bg-surface-2)'};color:var(--fg-primary);display:flex;justify-content:space-between;align-items:center">
                <div>
                  <strong style="font-size:14px">${esc(pt.name)}</strong>
                  <div style="font-size:11.5px;color:var(--fg-muted)">${esc(pt.typeLabel)}${isPrimaryDest && evac ? ' · Tujuan Aktif' : ''}</div>
                </div>
                <span class="mono" style="font-size:18px;font-weight:800">${cnt}/${pt.cap}</span>
              </button>
            `;
          }).join('')}
        </div>

        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            ${[['all', `Semua (${displayRows.length})`], ['pending', 'Perlu Konfirmasi / Tanpa HP'], ['safe', 'Sudah Aman']].map((f) => `
              <button data-marshal-filter="${f[0]}" class="${m.filter === f[0] ? 'btn-primary' : 'btn-ghost'}" style="padding:6px 12px;font-size:12px">${f[1]}</button>
            `).join('')}
          </div>
          <div style="display:flex;gap:8px;align-items:center">
            <button data-marshal-action="bulk-confirm" class="btn-gold" ${bulkCount ? '' : 'disabled'}>Konfirmasi Terpilih Aman (${bulkCount})</button>
          </div>
        </div>

        <div style="max-height:460px;overflow-y:auto;border:1px solid var(--border-subtle);border-radius:12px">
          ${filtered.map((r) => {
            const checked = !!m.bulkSelected[r.id];
            const statusLbl = r.queuedStatus ? `${r.queuedStatus} (antre offline)` : r.status;
            const statusTone = r.queuedStatus === 'Aman' ? 'safe' : r.tone;
            return `
              <div style="display:grid;grid-template-columns:36px 1.2fr 1fr 1.1fr auto;gap:10px;padding:10px 12px;border-bottom:1px solid var(--border-subtle);align-items:center;font-size:13px">
                <input type="checkbox" data-marshal-bulk="${esc(r.name)}" data-worker-id="${esc(r.id)}" ${checked ? 'checked' : ''} style="width:18px;height:18px;cursor:pointer">
                <div>
                  <strong>${esc(r.name)}</strong> ${!r.hasApp ? '<span class="badge badge-muted">Tanpa HP</span>' : ''}
                  <div style="font-size:11.5px;color:var(--fg-muted)">${esc(r.role)} · ${esc(r.zone)}</div>
                </div>
                <div style="font-size:12px;color:var(--fg-secondary)">${esc(r.posDesc)}</div>
                <div style="font-weight:700;color:${toneColor(statusTone)}">${esc(statusLbl)}</div>
                <div style="display:flex;gap:5px">
                  <button data-marshal-safe="${esc(r.id)}" class="btn-safe" style="padding:5px 10px;font-size:11.5px">Aman</button>
                  <button data-marshal-override="${esc(r.id)}" class="btn-ghost" style="padding:5px 9px;font-size:11.5px">Override</button>
                  <button data-marshal-sos="${esc(r.id)}" class="btn-danger" style="padding:5px 9px;font-size:11.5px">SOS</button>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    if (!container.dataset.wired) {
      container.dataset.wired = '1';
      container.addEventListener('change', (ev) => {
        const cb = ev.target;
        if (cb && cb.dataset && cb.dataset.workerId) {
          store.dispatch({ type: 'MARSHAL_TOGGLE_BULK', workerId: cb.dataset.workerId });
        }
      });
      container.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        if (btn.dataset.marshalPoint) store.dispatch({ type: 'MARSHAL_SET_POINT', pointId: btn.dataset.marshalPoint });
        else if (btn.dataset.marshalFilter) store.dispatch({ type: 'MARSHAL_SET_FILTER', filter: btn.dataset.marshalFilter });
        else if (btn.dataset.marshalSafe) store.dispatch({ type: 'MARSHAL_MARK_SAFE', workerId: btn.dataset.marshalSafe });
        else if (btn.dataset.marshalOverride) store.dispatch({ type: 'MARSHAL_OVERRIDE_UNCONFIRMED', workerId: btn.dataset.marshalOverride });
        else if (btn.dataset.marshalSos) store.dispatch({ type: 'MARSHAL_MARK_SOS', workerId: btn.dataset.marshalSos });
        else if (btn.dataset.marshalAction === 'toggle-offline') {
          store.dispatch({ type: 'MARSHAL_SET_OFFLINE', offline: !store.getState().marshal.offline });
        } else if (btn.dataset.marshalAction === 'bulk-confirm') {
          store.dispatch({ type: 'MARSHAL_BULK_SAFE' });
        }
      });
    }
  }

  NS.Views.renderMarshal = renderMarshal;
})(window);
