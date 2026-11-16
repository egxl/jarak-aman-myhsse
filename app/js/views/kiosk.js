(function (root) {
  'use strict';

  const NS = (root.JARAK_AMAN = root.JARAK_AMAN || {});
  NS.Views = NS.Views || {};

  let validationMsg = '';

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  const ROLES = [
    { id: 'TKBM', idLabel: 'TKBM', enLabel: 'Stevedore (TKBM)', idSub: 'Bongkar muat & dermaga', enSub: 'Quayside & cargo crew' },
    { id: 'Sopir truk', idLabel: 'Sopir Truk', enLabel: 'Truck Driver', idSub: 'Bawa kontainer & STID', enSub: 'Container haulage & STID' },
    { id: 'Tamu / ABK', idLabel: 'Tamu / ABK', enLabel: 'Visitor / Crew', idSub: 'Mitra, instansi, kru kapal', enSub: 'Guests, contractors, vessel crew' }
  ];

  const COPY = {
    id: {
      eyebrow: 'KIOSK POS GATE 3',
      title: 'Check-In & Safety Induction Pos Gate 3',
      sub: 'Untuk TKBM, sopir truk eksternal, tamu, & ABK tanpa aplikasi MyHSSE.',
      presetLbl: 'Isi Cepat Demo:',
      preset1: 'TKBM · Suherman',
      preset2: 'Sopir + 1 Kenek',
      preset3: 'ABK / Guest (EN)',
      step1: '1. Identitas (Pengunjung)',
      step2: '2. Aturan Bahaya (Pengunjung)',
      step3: '3. Cek APD (Petugas Gate)',
      personaVisitor: 'DIISI PENGUNJUNG / PEKERJA',
      personaOfficer: 'SERAHKAN KE PETUGAS POS GATE 3',
      roleLbl: 'Pilih Kelompok Anda',
      nameLbl: 'Nama Lengkap *',
      namePh: 'Mis. Suherman',
      cardLbl: 'No. Kartu TKBM / STID Truk / ID Tamu *',
      cardPh: 'Mis. TKBM-881 / STID-9123',
      autoIdBtn: 'Pakai ID Sementara',
      passLbl: 'Penumpang / Kenek di Kendaraan',
      passUnit: 'orang',
      phoneLbl: 'No. HP SMS Darurat Cadangan (opsional)',
      phonePh: '0812-xxxx-xxxx',
      errRequired: 'Lengkapi Nama Lengkap dan No. Kartu / STID terlebih dahulu.',
      nextBtn: 'Lanjut ke Aturan Keselamatan →',
      backBtn: '← Kembali',
      briefTitle: 'Tiga Aturan Keselamatan Wajib Hari Ini',
      briefCards: [
        ['1. Jalur Alat Berat', 'Dilarang berjalan di lajur reach stacker / RTG (Lapangan C & D). Gunakan jalur pejalan kaki sisi timur.'],
        ['2. Turun dari Kabin Truk', 'Sopir wajib memakai helm & rompi reflektif sebelum turun memeriksa segel kontainer.'],
        ['3. Evakuasi Mandiri', 'Bila gempa kuat atau sirine berbunyi, tinggalkan truk tanpa menghalangi jalur dan ikuti rambu ke Titik Kumpul.']
      ],
      ackBtn: 'Saya Paham · Serahkan ke Petugas Gate →',
      handoffTitle: 'Verifikasi Fisik APD oleh Petugas Gate',
      handoffSub: 'Periksa langsung perlengkapan keselamatan sebelum membuka palang gate.',
      applicantLbl: 'Pendaftar',
      extraPassLbl: 'pendamping',
      ppeItems: [
        ['apdHelm', 'Helm Keselamatan', 'Wajib'],
        ['apdVest', 'Rompi Reflektif', 'Wajib'],
        ['apdShoes', 'Sepatu Safety', 'Wajib']
      ],
      ppeOk: 'Dipakai / Ada',
      ppeMiss: 'Tidak Ada',
      borrowLbl: 'Pinjamkan APD Cadangan Pos Gate (Helm / Rompi)',
      borrowSub: 'Aktifkan bila helm atau rompi belum dibawa pengunjung.',
      ppeBlockWarn: 'Helm & Rompi wajib lengkap atau pinjam APD Pos Gate sebelum masuk.',
      shoeBlockWarn: 'Sepatu safety wajib dipakai untuk memasuki area terminal.',
      submitBtn: 'Catat Masuk & Selesai Induction ✓',
      doneTitle: 'Gate Pass Tercatat & Sinkron',
      doneSub: 'Data langsung masuk ke headcount Ruang Kendali & Tablet Titik Kumpul sebagai Di pos gate (tanpa aplikasi).',
      passCardId: 'Kartu / STID',
      passHeadcount: 'Total Tercatat',
      passPpe: 'Status APD',
      ppePersonal: 'APD Pribadi Lengkap',
      ppeLoaned: 'APD Pinjaman Pos Gate',
      newBtn: 'Daftarkan Pekerja Berikutnya'
    },
    en: {
      eyebrow: 'GATE 3 KIOSK · MYHSSE JARAK AMAN MODULE',
      title: 'Gate Check-In & Safety Induction',
      sub: 'For stevedores (TKBM), external truck drivers, visitors, and crew without the mobile app.',
      presetLbl: 'Demo Quick Fill:',
      preset1: 'TKBM · Suherman',
      preset2: 'Driver + 1 Helper',
      preset3: 'Crew / Guest (EN)',
      step1: '1. Identity (Visitor)',
      step2: '2. Hazard Rules (Visitor)',
      step3: '3. PPE Check (Gate Officer)',
      personaVisitor: 'VISITOR / WORKER INPUT',
      personaOfficer: 'HAND OVER TO GATE 3 OFFICER',
      roleLbl: 'Select Your Group',
      nameLbl: 'Full Name *',
      namePh: 'e.g. Capt. Mateo',
      cardLbl: 'TKBM Card / Truck STID / Pass ID *',
      cardPh: 'e.g. ABK-042 / STID-9123',
      autoIdBtn: 'Use Temp Pass ID',
      passLbl: 'Extra Passengers / Helpers in Vehicle',
      passUnit: 'person(s)',
      phoneLbl: 'Mobile Number for Emergency SMS Fallback (optional)',
      phonePh: '+62 812-xxxx-xxxx',
      errRequired: 'Please enter both Full Name and Card / STID number before continuing.',
      nextBtn: 'Continue to Safety Rules →',
      backBtn: '← Back',
      briefTitle: 'Three Mandatory Port Safety Rules Today',
      briefCards: [
        ['1. Heavy Equipment Lanes', 'Never walk inside active reach stacker / RTG lanes (Yard C & D). Use the marked east pedestrian walkway.'],
        ['2. Exiting Truck Cabins', 'Drivers must wear a safety helmet and reflective vest before stepping out to check container seals.'],
        ['3. Self-Evacuation', 'On strong shaking or siren alert, leave vehicles clear of emergency lanes and follow signs to the Assembly Point.']
      ],
      ackBtn: 'I Understand · Hand Over to Gate Officer →',
      handoffTitle: 'Physical PPE Inspection by Gate Officer',
      handoffSub: 'Verify physical safety gear before clearing gate entry.',
      applicantLbl: 'Applicant',
      extraPassLbl: 'companion(s)',
      ppeItems: [
        ['apdHelm', 'Safety Helmet', 'Mandatory'],
        ['apdVest', 'Reflective Vest', 'Mandatory'],
        ['apdShoes', 'Safety Shoes', 'Mandatory']
      ],
      ppeOk: 'Worn / Present',
      ppeMiss: 'Missing',
      borrowLbl: 'Issue Loaner PPE at Gate Post (Helmet / Vest)',
      borrowSub: 'Enable when visitor is missing a personal helmet or vest.',
      ppeBlockWarn: 'Helmet & Vest must be worn or borrowed from Gate Post before entry.',
      shoeBlockWarn: 'Safety shoes are mandatory to enter terminal operational zones.',
      submitBtn: 'Log Entry & Complete Induction ✓',
      doneTitle: 'Gate Pass Recorded & Synced',
      doneSub: 'Synced live to Control Room headcount and Muster Tablet as Gate Kiosk (no app).',
      passCardId: 'Card / STID',
      passHeadcount: 'Headcount Logged',
      passPpe: 'PPE Status',
      ppePersonal: 'Own PPE Complete',
      ppeLoaned: 'Gate Loaner PPE Issued',
      newBtn: 'Register Next Visitor / Worker'
    }
  };

  function renderKiosk(container, state, store) {
    const k = state.kiosk;
    const lang = k.lang === 'en' ? 'en' : 'id';
    const t = COPY[lang];

    // Skip rebuilding while user is typing in a Kiosk input field
    const activeEl = document.activeElement;
    if (activeEl && container.contains(activeEl) && activeEl.tagName === 'INPUT') {
      return;
    }

    let bodyHtml = '';
    if (k.step === 1) {
      bodyHtml = `
        <div style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <span class="kiosk-persona-tag kiosk-persona-visitor">${t.personaVisitor}</span>
            <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
              <span style="font-size:12px;font-weight:700;color:var(--fg-muted)">${t.presetLbl}</span>
              <button data-kiosk-preset="tkbm" class="btn-ghost" style="padding:5px 10px;font-size:12px">${t.preset1}</button>
              <button data-kiosk-preset="sopir" class="btn-ghost" style="padding:5px 10px;font-size:12px">${t.preset2}</button>
              <button data-kiosk-preset="abk" class="btn-ghost" style="padding:5px 10px;font-size:12px">${t.preset3}</button>
            </div>
          </div>

          <div>
            <label style="display:block;font-size:12px;font-weight:700;margin-bottom:7px">${t.roleLbl}</label>
            <div class="kiosk-role-grid">
              ${ROLES.map((r) => `
                <button data-kiosk-role="${r.id}" class="kiosk-role-card ${k.role === r.id ? 'active' : ''}">
                  <strong style="font-size:14.5px">${lang === 'en' ? r.enLabel : r.idLabel}</strong>
                  <span style="font-size:12px;color:var(--fg-muted)">${lang === 'en' ? r.enSub : r.idSub}</span>
                </button>
              `).join('')}
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div>
              <label for="kiosk-name" style="display:block;font-size:12px;font-weight:700;margin-bottom:5px">${t.nameLbl}</label>
              <input id="kiosk-name" type="text" value="${esc(k.name)}" placeholder="${t.namePh}" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid ${validationMsg && !k.name.trim() ? 'var(--sig-crit)' : 'var(--border-strong)'};background:var(--bg-surface-2);color:var(--fg-primary);font-size:14px">
            </div>
            <div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
                <label for="kiosk-card" style="font-size:12px;font-weight:700">${t.cardLbl}</label>
                <button data-kiosk-action="auto-id" type="button" style="border:none;background:transparent;color:var(--brand-blue);font-size:12px;font-weight:700;padding:0">${t.autoIdBtn}</button>
              </div>
              <input id="kiosk-card" type="text" value="${esc(k.cardId)}" placeholder="${t.cardPh}" style="width:100%;padding:10px 12px;border-radius:10px;border:1.5px solid ${validationMsg && !k.cardId.trim() ? 'var(--sig-crit)' : 'var(--border-strong)'};background:var(--bg-surface-2);color:var(--fg-primary);font-size:14px">
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:700;margin-bottom:5px">${t.passLbl}</label>
              <div class="kiosk-stepper-ctrl">
                <button data-kiosk-action="pass-dec" class="kiosk-stepper-btn" type="button" ${k.passengers <= 0 ? 'disabled' : ''}>−</button>
                <span class="mono" style="flex:1;text-align:center;font-size:15px;font-weight:700">${k.passengers} ${t.passUnit}</span>
                <button data-kiosk-action="pass-inc" class="kiosk-stepper-btn" type="button" ${k.passengers >= 4 ? 'disabled' : ''}>+</button>
              </div>
            </div>
            <div>
              <label for="kiosk-phone" style="display:block;font-size:12px;font-weight:700;margin-bottom:5px">${t.phoneLbl}</label>
              <input id="kiosk-phone" type="text" value="${esc(k.phone)}" placeholder="${t.phonePh}" style="width:100%;padding:10px 12px;border-radius:10px;border:1px solid var(--border-strong);background:var(--bg-surface-2);color:var(--fg-primary);font-size:14px">
            </div>
          </div>

          ${validationMsg ? `<div style="padding:9px 12px;border-radius:10px;background:var(--sig-crit-bg);color:var(--sig-crit);font-size:12.5px;font-weight:700">${esc(validationMsg)}</div>` : ''}

          <div style="display:flex;justify-content:flex-end">
            <button data-kiosk-action="next-step" class="btn-primary" style="padding:12px 22px;font-size:14.5px">${t.nextBtn}</button>
          </div>
        </div>
      `;
    } else if (k.step === 2) {
      bodyHtml = `
        <div style="display:flex;flex-direction:column;gap:14px">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
            <span class="kiosk-persona-tag kiosk-persona-visitor">${t.personaVisitor}</span>
            <strong style="font-size:15px">${t.briefTitle}</strong>
          </div>
          <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px">
            ${t.briefCards.map((c) => `
              <div style="padding:15px;border-radius:14px;background:var(--bg-surface-2);border:1px solid var(--border-subtle)">
                <strong style="display:block;font-size:14px;margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid var(--border-subtle)">${esc(c[0])}</strong>
                <p style="margin:0;font-size:13px;line-height:1.5;color:var(--fg-secondary)">${esc(c[1])}</p>
              </div>
            `).join('')}
          </div>
          <div style="display:flex;justify-content:space-between;gap:10px">
            <button data-kiosk-action="prev-step" class="btn-ghost">${t.backBtn}</button>
            <button data-kiosk-action="next-step" class="btn-primary" style="padding:12px 22px;font-size:14.5px">${t.ackBtn}</button>
          </div>
        </div>
      `;
    } else if (k.step === 3) {
      const missingMandatoryUpper = !k.apdHelm || !k.apdVest;
      const missingShoes = !k.apdShoes;
      const blockedByUpper = missingMandatoryUpper && !k.borrowedApd;
      const blocked = blockedByUpper || missingShoes;
      const roleObj = ROLES.find((r) => r.id === k.role);
      const roleDisp = roleObj ? (lang === 'en' ? roleObj.enLabel : roleObj.idLabel) : k.role;

      bodyHtml = `
        <div style="display:flex;flex-direction:column;gap:14px">
          <div class="kiosk-handoff-banner">
            <div>
              <span class="kiosk-persona-tag kiosk-persona-officer">${t.personaOfficer}</span>
              <div style="font-size:15px;font-weight:800;margin-top:6px">${t.handoffTitle}</div>
              <div style="font-size:12.5px;color:var(--fg-secondary)">${t.handoffSub}</div>
            </div>
            <div style="padding:8px 12px;border-radius:10px;background:var(--bg-surface);border:1px solid var(--border-subtle);font-size:12.5px">
              <strong>${esc(k.name)}</strong> (${esc(roleDisp)})<br>
              <span class="mono">${esc(k.cardId)}</span> · +${k.passengers} ${t.extraPassLbl}
            </div>
          </div>

          <div class="kiosk-ppe-grid">
            ${t.ppeItems.map((item) => {
              const ok = !!k[item[0]];
              return `
                <button data-kiosk-apd="${item[0]}" style="text-align:left;padding:14px;border-radius:14px;border:2px solid ${ok ? 'var(--sig-safe)' : 'var(--sig-crit)'};background:${ok ? 'var(--sig-safe-bg)' : 'var(--sig-crit-bg)'};color:var(--fg-primary);display:flex;flex-direction:column;gap:4px">
                  <div style="display:flex;justify-content:space-between;align-items:center">
                    <strong style="font-size:14px">${item[1]}</strong>
                    <span class="badge ${ok ? 'badge-safe' : 'badge-crit'}">${ok ? '✓ ' + t.ppeOk : '✕ ' + t.ppeMiss}</span>
                  </div>
                  <span style="font-size:12px;color:var(--fg-muted)">${item[2]}</span>
                </button>
              `;
            }).join('')}
          </div>

          <button data-kiosk-action="toggle-borrow" style="text-align:left;padding:12px 14px;border-radius:12px;border:2px solid ${k.borrowedApd ? 'var(--brand-gold)' : (blockedByUpper ? 'var(--sig-warn)' : 'var(--border-strong)')};background:${k.borrowedApd ? 'var(--brand-gold-bg)' : (blockedByUpper ? 'var(--sig-warn-bg)' : 'transparent')};color:var(--fg-primary);display:flex;justify-content:space-between;align-items:center;gap:10px">
            <div>
              <strong style="display:block;font-size:13.5px">${k.borrowedApd ? '✓ ' : '+ '}${t.borrowLbl}</strong>
              <span style="font-size:12px;color:var(--fg-secondary)">${t.borrowSub}</span>
            </div>
            <span class="badge ${k.borrowedApd ? 'badge-gold' : 'badge-muted'}">${k.borrowedApd ? 'ON' : 'OFF'}</span>
          </button>

          ${missingShoes ? `<div style="padding:9px 12px;border-radius:10px;background:var(--sig-crit-bg);color:var(--sig-crit);font-size:12.5px;font-weight:700">${t.shoeBlockWarn}</div>` : ''}
          ${!missingShoes && blockedByUpper ? `<div style="padding:9px 12px;border-radius:10px;background:var(--sig-warn-bg);color:var(--sig-warn-fg);font-size:12.5px;font-weight:700">${t.ppeBlockWarn}</div>` : ''}

          <div style="display:flex;justify-content:space-between;gap:10px">
            <button data-kiosk-action="prev-step" class="btn-ghost">${t.backBtn}</button>
            <button data-kiosk-action="submit-checkin" class="btn-safe" style="padding:12px 24px;font-size:14.5px" ${blocked ? 'disabled' : ''}>${t.submitBtn}</button>
          </div>
        </div>
      `;
    } else {
      const lc = k.lastCheckin || {};
      const roleObj = ROLES.find((r) => r.id === lc.role);
      const roleDisp = roleObj ? (lang === 'en' ? roleObj.enLabel : roleObj.idLabel) : lc.role;
      bodyHtml = `
        <div style="padding:18px;text-align:center;display:flex;flex-direction:column;gap:14px;align-items:center">
          <div style="width:66px;height:66px;border-radius:50%;background:var(--sig-safe-bg);color:var(--sig-safe);display:grid;place-items:center;font-size:32px;font-weight:800">✓</div>
          <h2 style="margin:0;font-size:23px">${t.doneTitle}</h2>
          <p style="margin:0;max-width:560px;font-size:14px;color:var(--fg-secondary);line-height:1.5">${t.doneSub}</p>
          <div style="width:100%;max-width:620px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;text-align:left">
            <div style="padding:12px;border-radius:12px;background:var(--bg-surface-2);border:1px solid var(--border-subtle)">
              <div style="font-size:12px;color:var(--fg-muted);font-weight:700">${t.passCardId}</div>
              <strong style="font-size:14px">${esc(lc.name)}</strong>
              <div class="mono" style="font-size:12px;color:var(--fg-secondary)">${esc(lc.cardId)} · ${esc(roleDisp)}</div>
            </div>
            <div style="padding:12px;border-radius:12px;background:var(--bg-surface-2);border:1px solid var(--border-subtle)">
              <div style="font-size:12px;color:var(--fg-muted);font-weight:700">${t.passHeadcount}</div>
              <strong class="mono" style="font-size:18px">${1 + (lc.passengers || 0)} ${t.passUnit}</strong>
              <div style="font-size:12px;color:var(--fg-secondary)">+${lc.passengers || 0} ${t.extraPassLbl}</div>
            </div>
            <div style="padding:12px;border-radius:12px;background:var(--bg-surface-2);border:1px solid var(--border-subtle)">
              <div style="font-size:12px;color:var(--fg-muted);font-weight:700">${t.passPpe}</div>
              <strong style="font-size:13.5px;color:${lc.borrowedApd ? 'var(--brand-gold)' : 'var(--sig-safe)'}">${lc.borrowedApd ? t.ppeLoaned : t.ppePersonal}</strong>
            </div>
          </div>
          <button data-kiosk-action="reset-flow" class="btn-primary" style="margin-top:4px;padding:11px 22px">${t.newBtn}</button>
        </div>
      `;
    }

    container.innerHTML = `
      <div class="kiosk-shell">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;flex-wrap:wrap;border-bottom:1px solid var(--border-subtle);padding-bottom:14px">
          <div>
            <h1 style="margin:0 0 4px;font-size:22px">${t.title}</h1>
            <div style="font-size:13px;color:var(--fg-muted)">${t.sub}</div>
          </div>
          <div class="os-switch" role="group" aria-label="Language">
            <button data-kiosk-lang="id" class="${lang === 'id' ? 'active' : ''}">ID</button>
            <button data-kiosk-lang="en" class="${lang === 'en' ? 'active' : ''}">EN</button>
          </div>
        </div>

        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${[t.step1, t.step2, t.step3].map((lbl, idx) => {
            const active = k.step === idx + 1;
            const done = k.step > idx + 1;
            return `<div style="padding:9px 12px;border-radius:10px;font-size:12.5px;font-weight:700;background:${done ? 'var(--sig-safe-bg)' : (active ? 'var(--brand-blue-bg)' : 'var(--bg-surface-2)')};color:${done ? 'var(--sig-safe)' : (active ? 'var(--brand-blue)' : 'var(--fg-muted)')};border:1px solid ${active ? 'var(--brand-blue)' : 'var(--border-subtle)'}">${lbl}</div>`;
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
        if (validationMsg && store.state.kiosk.name.trim() && store.state.kiosk.cardId.trim()) {
          validationMsg = '';
        }
      });
      container.addEventListener('click', (ev) => {
        const btn = ev.target.closest('button');
        if (!btn) return;
        const cur = store.getState().kiosk;
        if (btn.dataset.kioskLang) {
          validationMsg = '';
          store.dispatch({ type: 'KIOSK_SET', patch: { lang: btn.dataset.kioskLang } });
          return;
        }
        if (btn.dataset.kioskRole) {
          store.dispatch({ type: 'KIOSK_SET', patch: { role: btn.dataset.kioskRole } });
          return;
        }
        if (btn.dataset.kioskApd) {
          const key = btn.dataset.kioskApd;
          store.dispatch({ type: 'KIOSK_SET', patch: { [key]: !cur[key] } });
          return;
        }
        if (btn.dataset.kioskPreset) {
          validationMsg = '';
          const p = btn.dataset.kioskPreset;
          if (p === 'tkbm') store.dispatch({ type: 'KIOSK_SET', patch: { role: 'TKBM', name: 'Suherman', cardId: 'TKBM-881', passengers: 0, lang: 'id' } });
          else if (p === 'sopir') store.dispatch({ type: 'KIOSK_SET', patch: { role: 'Sopir truk', name: 'Slamet', cardId: 'STID-9981', passengers: 1, lang: 'id' } });
          else if (p === 'abk') store.dispatch({ type: 'KIOSK_SET', patch: { role: 'Tamu / ABK', name: 'Capt. Mateo', cardId: 'ABK-042', passengers: 0, lang: 'en' } });
          return;
        }

        const act = btn.dataset.kioskAction;
        if (!act) return;
        const activeCopy = COPY[cur.lang === 'en' ? 'en' : 'id'];
        if (act === 'auto-id') {
          const prefix = cur.role === 'Sopir truk' ? 'STID' : (cur.role === 'TKBM' ? 'TKBM' : 'PASS');
          const rnd = 100 + (store.getState().workers.length % 900);
          store.dispatch({ type: 'KIOSK_SET', patch: { cardId: `${prefix}-${rnd}` } });
        } else if (act === 'pass-inc') {
          store.dispatch({ type: 'KIOSK_SET', patch: { passengers: Math.min(4, Number(cur.passengers || 0) + 1) } });
        } else if (act === 'pass-dec') {
          store.dispatch({ type: 'KIOSK_SET', patch: { passengers: Math.max(0, Number(cur.passengers || 0) - 1) } });
        } else if (act === 'next-step') {
          if (cur.step === 1 && (!cur.name.trim() || !cur.cardId.trim())) {
            validationMsg = activeCopy.errRequired;
            renderKiosk(container, store.getState(), store);
            return;
          }
          validationMsg = '';
          store.dispatch({ type: 'KIOSK_SET', patch: { step: Math.min(3, cur.step + 1) } });
        } else if (act === 'prev-step') {
          validationMsg = '';
          store.dispatch({ type: 'KIOSK_SET', patch: { step: Math.max(1, cur.step - 1) } });
        } else if (act === 'toggle-borrow') {
          store.dispatch({ type: 'KIOSK_SET', patch: { borrowedApd: !cur.borrowedApd } });
        } else if (act === 'submit-checkin') {
          store.dispatch({ type: 'KIOSK_CHECKIN' });
        } else if (act === 'reset-flow') {
          validationMsg = '';
          store.dispatch({ type: 'KIOSK_RESET_FLOW' });
        }
      });
    }
  }

  NS.Views.renderKiosk = renderKiosk;
})(window);
