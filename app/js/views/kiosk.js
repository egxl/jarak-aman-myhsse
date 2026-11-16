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

  const COPY = {
    id: {
      eyebrow: 'KIOSK POS GATE 3 · MODUL MYHSSE JARAK AMAN',
      title: 'Safety Induction Tanpa Smartphone (FR-11.8)',
      sub: 'Khusus TKBM, sopir truk eksternal, tamu, & ABK tanpa aplikasi HP.',
      step1: '1. Identitas & Data Gate',
      step2: '2. Ringkasan Bahaya Hari Ini',
      step3: '3. Verifikasi APD Petugas Gate',
      roleLbl: 'Kelompok Pekerja / Tamu',
      nameLbl: 'Nama Lengkap',
      cardLbl: 'No. Kartu TKBM / STID Truk / ID Tamu',
      passLbl: 'Jumlah Penumpang / Kenek di Kendaraan',
      phoneLbl: 'No. HP untuk SMS Darurat Cadangan (opsional)',
      nextBtn: 'Lanjut ke Ringkasan Bahaya →',
      briefTitle: 'Tiga Aturan Keselamatan Wajib Hari Ini',
      briefCards: [
        ['1. Jalur Alat Berat', 'Dilarang berjalan di lajur reach stacker / RTG (Lapangan C & D). Gunakan jalur pejalan kaki sisi timur.'],
        ['2. Turun dari Kabin Truk', 'Sopir wajib memakai helm & rompi reflektif sebelum turun memeriksa segel kontainer.'],
        ['3. Evakuasi Mandiri', 'Bila gempa kuat atau sirine berbunyi, tinggalkan truk tanpa menghalangi jalur dan ikuti rambu ke Titik Kumpul.']
      ],
      ackBtn: 'Saya Paham & Lanjut Cek APD →',
      apdTitle: 'Pemeriksaan Fisik oleh Petugas Gate',
      borrowLbl: 'Pinjam APD dari Pos Gate (Helm / Rompi cadangan)',
      submitBtn: 'Catat Masuk & Selesai Induction ✓',
      doneTitle: 'Check-In & Induction Tercatat',
      doneSub: 'Data otomatis masuk ke daftar headcount Ruang Kendali & Tablet Titik Kumpul sebagai Di pos gate (tanpa aplikasi).',
      newBtn: 'Daftarkan Pekerja Berikutnya'
    },
    en: {
      eyebrow: 'GATE 3 KIOSK · MYHSSE JARAK AMAN MODULE',
      title: 'No-Smartphone Gate Induction (FR-11.8)',
      sub: 'For external truck drivers, port stevedores (TKBM), crew (ABK), and visitors without the mobile app.',
      step1: '1. Identity & Gate Record',
      step2: '2. Today’s Port Hazard Briefing',
      step3: '3. Gate Officer PPE Verification',
      roleLbl: 'Visitor / Worker Group',
      nameLbl: 'Full Name',
      cardLbl: 'TKBM Card / Truck STID / Visitor Pass ID',
      passLbl: 'Extra Passengers / Helpers in Vehicle',
      phoneLbl: 'Mobile Number for Emergency SMS Fallback (optional)',
      nextBtn: 'Continue to Hazard Briefing →',
      briefTitle: 'Three Mandatory Port Safety Rules Today',
      briefCards: [
        ['1. Heavy Equipment Lanes', 'Never walk inside active reach stacker / RTG lanes (Yard C & D). Use the marked east pedestrian walkway.'],
        ['2. Exiting Truck Cabins', 'Drivers must wear a safety helmet and reflective vest before stepping out to check container seals.'],
        ['3. Self-Evacuation', 'On strong shaking or siren alert, leave vehicles clear of emergency lanes and follow signs to the Assembly Point.']
      ],
      ackBtn: 'I Understand & Proceed to PPE Check →',
      apdTitle: 'Physical Inspection by Gate Officer',
      borrowLbl: 'Issue Loaner PPE at Gate Post (Helmet / Reflective Vest)',
      submitBtn: 'Log Entry & Complete Induction ✓',
      doneTitle: 'Gate Entry & Induction Recorded',
      doneSub: 'Synced directly to Control Room headcount and Muster Tablet as Gate Kiosk (no app).',
      newBtn: 'Register Next Visitor / Worker'
    }
  };

  function renderKiosk(container, state, store) {
    const k = state.kiosk;
    const t = COPY[k.lang] || COPY.id;

    let bodyHtml = '';
    if (k.step === 1) {
      bodyHtml = `
        <div style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <span style="font-size:12px;font-weight:700;color:var(--fg-muted)">Preset Demo Cepat:</span>
            <button data-kiosk-preset="tkbm" class="btn-ghost" style="padding:5px 10px;font-size:12px">TKBM Koperasi</button>
            <button data-kiosk-preset="sopir" class="btn-ghost" style="padding:5px 10px;font-size:12px">Sopir Truk + 1 Kenek</button>
            <button data-kiosk-preset="abk" class="btn-ghost" style="padding:5px 10px;font-size:12px">ABK / Tamu (EN)</button>
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:700;margin-bottom:6px">${t.roleLbl}</label>
            <div style="display:flex;gap:8px;flex-wrap:wrap">
              ${['TKBM', 'Sopir truk', 'Tamu / ABK'].map((r) => `
                <button data-kiosk-role="${r}" class="${k.role === r ? 'btn-primary' : 'btn-ghost'}">${r}</button>
              `).join('')}
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label for="kiosk-name" style="display:block;font-size:12px;font-weight:700;margin-bottom:5px">${t.nameLbl}</label>
              <input id="kiosk-name" type="text" value="${esc(k.name)}" placeholder="Mis. Suherman" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border-strong);background:var(--bg-surface-2);color:var(--fg-primary);font-size:14px">
            </div>
            <div>
              <label for="kiosk-card" style="display:block;font-size:12px;font-weight:700;margin-bottom:5px">${t.cardLbl}</label>
              <input id="kiosk-card" type="text" value="${esc(k.cardId)}" placeholder="Mis. TKBM-881 / STID-9123" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border-strong);background:var(--bg-surface-2);color:var(--fg-primary);font-size:14px">
            </div>
            <div>
              <label for="kiosk-passengers" style="display:block;font-size:12px;font-weight:700;margin-bottom:5px">${t.passLbl}</label>
              <select id="kiosk-passengers" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border-strong);background:var(--bg-surface-2);color:var(--fg-primary);font-size:14px">
                ${[0, 1, 2, 3].map((n) => `<option value="${n}" ${Number(k.passengers) === n ? 'selected' : ''}>${n} penumpang</option>`).join('')}
              </select>
            </div>
            <div>
              <label for="kiosk-phone" style="display:block;font-size:12px;font-weight:700;margin-bottom:5px">${t.phoneLbl}</label>
              <input id="kiosk-phone" type="text" value="${esc(k.phone)}" placeholder="0812-xxxx-xxxx" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border-strong);background:var(--bg-surface-2);color:var(--fg-primary);font-size:14px">
            </div>
          </div>

          <div style="display:flex;justify-content:flex-end">
            <button data-kiosk-action="next-step" class="btn-primary" style="padding:12px 20px;font-size:14.5px">${t.nextBtn}</button>
          </div>
        </div>
      `;
    } else if (k.step === 2) {
      bodyHtml = `
        <div style="display:flex;flex-direction:column;gap:14px">
          <strong style="font-size:16px">${t.briefTitle}</strong>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
            ${t.briefCards.map((c) => `
              <div style="padding:14px;border-radius:12px;background:var(--bg-surface-2);border-top:4px solid var(--brand-gold)">
                <strong style="display:block;font-size:14px;margin-bottom:6px">${esc(c[0])}</strong>
                <p style="margin:0;font-size:13px;line-height:1.5;color:var(--fg-secondary)">${esc(c[1])}</p>
              </div>
            `).join('')}
          </div>
          <div style="display:flex;justify-content:space-between">
            <button data-kiosk-action="prev-step" class="btn-ghost">← Kembali</button>
            <button data-kiosk-action="next-step" class="btn-primary" style="padding:12px 20px;font-size:14.5px">${t.ackBtn}</button>
          </div>
        </div>
      `;
    } else if (k.step === 3) {
      bodyHtml = `
        <div style="display:flex;flex-direction:column;gap:14px">
          <strong style="font-size:16px">${t.apdTitle}</strong>
          <div style="padding:10px 12px;border-radius:10px;background:var(--bg-surface-2);font-size:13px">
            Pendaftar: <strong>${esc(k.name || 'Pekerja Gate')}</strong> (${esc(k.role)}) · ID: <strong>${esc(k.cardId || 'G-AUTO')}</strong> · Penumpang: <strong>${k.passengers}</strong>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px">
            ${[['apdHelm', 'Helm Keselamatan'], ['apdVest', 'Rompi Reflektif'], ['apdShoes', 'Sepatu Safety']].map((item) => `
              <button data-kiosk-apd="${item[0]}" style="padding:14px;border-radius:12px;border:2px solid ${k[item[0]] ? 'var(--sig-safe)' : 'var(--border-strong)'};background:${k[item[0]] ? 'var(--sig-safe-bg)' : 'var(--bg-surface-2)'};color:var(--fg-primary);font-size:13.5px;font-weight:700">
                ${k[item[0]] ? '✓ ' : ''}${item[1]}
              </button>
            `).join('')}
          </div>
          <button data-kiosk-action="toggle-borrow" style="text-align:left;padding:12px 14px;border-radius:12px;border:1.5px solid ${k.borrowedApd ? 'var(--brand-gold)' : 'var(--border-strong)'};background:${k.borrowedApd ? 'var(--brand-gold-bg)' : 'transparent'};color:var(--fg-primary);font-size:13.5px;font-weight:700">
            ${k.borrowedApd ? '✓ ' : '+ '}${t.borrowLbl}
          </button>
          <div style="display:flex;justify-content:space-between">
            <button data-kiosk-action="prev-step" class="btn-ghost">← Kembali</button>
            <button data-kiosk-action="submit-checkin" class="btn-safe" style="padding:12px 22px;font-size:14.5px">${t.submitBtn}</button>
          </div>
        </div>
      `;
    } else {
      const lc = k.lastCheckin || {};
      bodyHtml = `
        <div style="padding:20px;text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--sig-safe-bg);color:var(--sig-safe);display:grid;place-items:center;font-size:30px;font-weight:800">✓</div>
          <h2 style="margin:0;font-size:22px">${t.doneTitle}</h2>
          <p style="margin:0;max-width:560px;font-size:14px;color:var(--fg-secondary);line-height:1.5">${t.doneSub}</p>
          <div style="padding:12px 16px;border-radius:12px;background:var(--bg-surface-2);border:1px solid var(--border-subtle);font-size:13.5px">
            <strong>${esc(lc.name)}</strong> (${esc(lc.role)}) · Kartu <strong>${esc(lc.cardId)}</strong> · +${lc.passengers || 0} penumpang · ${lc.borrowedApd ? 'APD Pinjaman Pos Gate' : 'APD Pribadi Lengkap'}
          </div>
          <button data-kiosk-action="reset-flow" class="btn-primary" style="margin-top:6px">${t.newBtn}</button>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="kiosk-shell">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--border-subtle);padding-bottom:14px">
          <div>
            <span style="font-size:11px;font-weight:800;letter-spacing:0.06em;color:var(--brand-gold)">${t.eyebrow}</span>
            <h1 style="margin:4px 0 4px;font-size:22px">${t.title}</h1>
            <div style="font-size:13px;color:var(--fg-muted)">${t.sub}</div>
          </div>
          <div class="os-switch" role="group" aria-label="Language">
            <button data-kiosk-lang="id" class="${k.lang === 'id' ? 'active' : ''}">ID</button>
            <button data-kiosk-lang="en" class="${k.lang === 'en' ? 'active' : ''}">EN</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${[t.step1, t.step2, t.step3].map((lbl, idx) => {
            const active = k.step === idx + 1;
            const done = k.step > idx + 1;
            return `<div style="padding:8px 12px;border-radius:10px;font-size:12.5px;font-weight:700;background:${done ? 'var(--sig-safe-bg)' : (active ? 'var(--brand-blue-bg)' : 'var(--bg-surface-2)')};color:${done ? 'var(--sig-safe)' : (active ? 'var(--brand-blue)' : 'var(--fg-muted)')};border:1px solid ${active ? 'var(--brand-blue)' : 'var(--border-subtle)'}">${lbl}</div>`;
          }).join('')}
        </div>

        ${bodyHtml}
      </div>
    `;

    if (!container.dataset.wired) {
      container.dataset.wired = '1';
      container.addEventListener('input', (ev) => {
        const id = ev.target.id;
        if (id === 'kiosk-name') store.state.kiosk.name = ev.target.value;
        else if (id === 'kiosk-card') store.state.kiosk.cardId = ev.target.value;
        else if (id === 'kiosk-phone') store.state.kiosk.phone = ev.target.value;
      });
      container.addEventListener('change', (ev) => {
        if (ev.target.id === 'kiosk-passengers') {
          store.state.kiosk.passengers = Number(ev.target.value) || 0;
        }
      });
      container.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        if (btn.dataset.kioskLang) {
          store.dispatch({ type: 'KIOSK_SET', patch: { lang: btn.dataset.kioskLang } });
          return;
        }
        if (btn.dataset.kioskRole) {
          store.dispatch({ type: 'KIOSK_SET', patch: { role: btn.dataset.kioskRole } });
          return;
        }
        if (btn.dataset.kioskApd) {
          const key = btn.dataset.kioskApd;
          store.dispatch({ type: 'KIOSK_SET', patch: { [key]: !store.getState().kiosk[key] } });
          return;
        }
        if (btn.dataset.kioskPreset) {
          const p = btn.dataset.kioskPreset;
          if (p === 'tkbm') store.dispatch({ type: 'KIOSK_SET', patch: { role: 'TKBM', name: 'Suherman', cardId: 'TKBM-881', passengers: 0, lang: 'id' } });
          else if (p === 'sopir') store.dispatch({ type: 'KIOSK_SET', patch: { role: 'Sopir truk', name: 'Slamet', cardId: 'STID-9981', passengers: 1, lang: 'id' } });
          else if (p === 'abk') store.dispatch({ type: 'KIOSK_SET', patch: { role: 'Tamu / ABK', name: 'Capt. Mateo', cardId: 'ABK-042', passengers: 0, lang: 'en' } });
          return;
        }

        const act = btn.dataset.kioskAction;
        if (!act) return;
        const curStep = store.getState().kiosk.step;
        if (act === 'next-step') store.dispatch({ type: 'KIOSK_SET', patch: { step: Math.min(3, curStep + 1) } });
        else if (act === 'prev-step') store.dispatch({ type: 'KIOSK_SET', patch: { step: Math.max(1, curStep - 1) } });
        else if (act === 'toggle-borrow') store.dispatch({ type: 'KIOSK_SET', patch: { borrowedApd: !store.getState().kiosk.borrowedApd } });
        else if (act === 'submit-checkin') store.dispatch({ type: 'KIOSK_CHECKIN' });
        else if (act === 'reset-flow') store.dispatch({ type: 'KIOSK_RESET_FLOW' });
      });
    }
  }

  NS.Views.renderKiosk = renderKiosk;
})(window);
