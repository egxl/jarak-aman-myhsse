(function (root) {
  'use strict';

  const NS = (root.JARAK_AMAN = root.JARAK_AMAN || {});

  let tourIndex = -1;
  let tourBackup = null;
  let listenersBound = false;

  function esc(str) {
    return String(str == null ? '' : str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function submitSampleNearMiss(store) {
    store.dispatch({
      type: 'SUBMIT_REPORT',
      category: 'nm',
      hasPhoto: true,
      anonymous: false,
      note: 'Forklift nyaris menyenggol pekerja di Blok C3'
    });
  }

  const TOUR_STOPS = [
    {
      target: 'split-header',
      preferSide: 'below',
      setup: function () {},
      title: '1. Gambaran Layar Split (HP + Ruang Kendali)',
      body: 'Layar ini mempertemukan dua sisi sekaligus: HP pekerja di lapangan (kolom kiri) dan konsol operator HSSE di Ruang Kendali (kolom tengah), ditambah panel skenario uji di kanan.',
      why: 'Inti fitur: Pekerja tidak butuh sensor atau perangkat baru—cukup aplikasi MyHSSE di HP yang terhubung langsung ke Ruang Kendali.'
    },
    {
      target: 'split-phone',
      preferSide: 'right',
      setup: function (store) {
        store.dispatch({ type: 'JUMP_SCENARIO', key: 'apdfail' });
      },
      title: '2. HP Pekerja: Safety Induction & Cek APD Otomatis',
      body: 'Begitu pekerja (Andi) melewati Gate 3, aplikasi aktif otomatis. Pada contoh ini selfie mendeteksi helm belum terpasang, sehingga induction tertahan dan KPI Ruang Kendali langsung menambah hitungan APD bermasalah.',
      why: 'Dampak HSSE: Pengawas tahu lebih awal siapa yang belum lengkap APD atau belum selesai briefing sebelum bekerja di zona alat berat.'
    },
    {
      target: 'split-scenarios',
      preferSide: 'left',
      setup: function (store) {
        store.dispatch({ type: 'JUMP_SCENARIO', key: 'enter' });
      },
      title: '3. Panel Kanan: 10 Skenario Uji Cepat',
      body: 'Di luar tur ini, Anda bisa mengklik 10 tombol skenario ini kapan saja untuk langsung mencoba alur dari daftar awal, lapor bahaya, evakuasi, sampai keluar Gate OUT.',
      why: 'Catatan demo: Setiap skenario langsung menyinkronkan status Andi di HP ke peta dan tabel Ruang Kendali.'
    },
    {
      target: 'split-alarms',
      preferSide: 'right',
      setup: function (store) {
        submitSampleNearMiss(store);
        store.dispatch({ type: 'SET_VIEW_TAB', tab: 'map' });
      },
      title: '4. Lapor Near Miss ≤30 Detik → Masuk Antrean Alarm',
      body: 'Andi baru saja mengirim laporan nyaris celaka (F12) dari HP. Laporan langsung muncul di puncak Antrean Alarm ini agar operator HSSE bisa langsung mengambil alih dan menindaklanjuti.',
      why: 'Dampak HSSE: Pekerja lapangan dapat melapor cepat (termasuk secara anonim) sebelum insiden kecil berkembang menjadi kecelakaan fatal.'
    },
    {
      target: 'split-hotspots',
      preferSide: 'right',
      setup: function (store) {
        submitSampleNearMiss(store);
        store.dispatch({ type: 'SET_VIEW_TAB', tab: 'compliance' });
      },
      title: '5. Tab 2: Peta Titik Rawan & Kepatuhan Pekerja',
      body: 'Laporan dari HP tadi otomatis menaikkan angka Titik Rawan Lapangan C menjadi 15 laporan. Di tab ini HSSE juga memantau kepatuhan Pegawai, TKBM, Sopir, hingga pekerja tanpa HP dari pos gate.',
      why: 'Dampak HSSE: Menunjukkan zona paling rawan kecelakaan alat berat–pejalan kaki serta kelompok pekerja yang belum patuh.'
    },
    {
      target: 'split-induction',
      preferSide: 'right',
      setup: function (store) {
        submitSampleNearMiss(store);
        store.dispatch({ type: 'SET_VIEW_TAB', tab: 'induction' });
        const cand = store.getState().induction.candidates[0];
        if (cand) store.dispatch({ type: 'ADD_INDUCTION_CANDIDATE', id: cand.id });
        store.dispatch({ type: 'TOGGLE_REREAD' });
        store.dispatch({ type: 'SUBMIT_INDUCTION_HSSE' });
        store.dispatch({ type: 'APPROVE_INDUCTION' });
      },
      title: '6. Tab 3: Ubah Materi Briefing → Wajib Baca di HP',
      body: 'Temuan dari HP tadi otomatis masuk sebagai usulan materi Safety Induction. Setelah HSSE menyetujui Revisi 2 dengan opsi wajib baca ulang, lihat HP di kiri: banner kuning INFO DARURAT BARU langsung muncul.',
      why: 'Dampak HSSE: Aturan keselamatan harian tidak lagi statis—bahaya baru pagi ini bisa langsung dipaksa terbaca oleh pekerja di lapangan.'
    },
    {
      target: 'split-map',
      preferSide: 'right',
      setup: function (store) {
        store.dispatch({ type: 'SET_VIEW_TAB', tab: 'map' });
        store.dispatch({ type: 'START_EVAC', hazard: 'tsunami', zone: 'all', basis: 'bmkg', drill: false });
      },
      title: '7. Perintah Evakuasi Serentak: Peta Kendali ↔ Kompas HP',
      body: 'Saat komandan insiden menekan Perintahkan Evakuasi Tsunami, peta terminal menandai zona bahaya dan jalur evakuasi pekerja ke Gedung Evakuasi B. Bersamaan, HP pekerja di kiri otomatis menampilkan panah arah dan peta rute.',
      why: 'Dampak HSSE: Operator melihat alat berat yang belum berhenti dan pekerja yang belum aman (siap ekspor ke tim SAR/BPBD), sementara pekerja dipandu lewat visual, suara, dan getaran.'
    },
    {
      target: 'split-phone',
      preferSide: 'right',
      setup: function (store) {
        store.dispatch({ type: 'SET_VIEW_TAB', tab: 'map' });
        store.dispatch({ type: 'START_EVAC', hazard: 'tsunami', zone: 'all', basis: 'bmkg', drill: false });
        store.dispatch({ type: 'TOGGLE_ROUTE_CLOSED' });
      },
      title: '8. Jalan Terhalang? Tutup Rute & Panduan Luar Aplikasi',
      body: 'Jika Jalan Dermaga B ditutup dari Ruang Kendali (garis merah di peta tengah), rute dan panah di HP pekerja langsung dialihkan ke jalur cadangan secara real-time.',
      why: 'Tips lanjut: Tutup tur ini lalu coba tombol "Aplikasi lain" / "Layar kunci" di panel kanan saat evakuasi, atau buka tab "Kiosk Gate" & "Petugas Titik Kumpul" untuk melihat alur pekerja tanpa HP.'
    }
  ];

  function getTourRoot() {
    return document.getElementById('split-tour-root');
  }

  function isSplitActive() {
    const ws = document.getElementById('workspace-root');
    return !!(ws && ws.classList.contains('mode-split'));
  }

  function clamp(val, min, max) {
    return Math.max(min, Math.min(max, val));
  }

  function positionTour() {
    if (tourIndex < 0) return;
    const tourRoot = getTourRoot();
    if (!tourRoot || tourRoot.hidden) return;
    const stop = TOUR_STOPS[tourIndex];
    const targetEl = document.querySelector('[data-tour-target="' + stop.target + '"]');
    const spotlightEl = tourRoot.querySelector('.kiosk-tour-spotlight');
    const cardEl = tourRoot.querySelector('.kiosk-tour-card');
    if (!targetEl || !spotlightEl || !cardEl) return;

    targetEl.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    const r = targetEl.getBoundingClientRect();
    const pad = 6;
    const vw = root.innerWidth;
    const vh = root.innerHeight;
    spotlightEl.style.top = Math.max(4, r.top - pad) + 'px';
    spotlightEl.style.left = Math.max(4, r.left - pad) + 'px';
    spotlightEl.style.width = Math.min(vw - 8, r.width + pad * 2) + 'px';
    spotlightEl.style.height = Math.min(vh - 8, r.height + pad * 2) + 'px';

    const cw = cardEl.offsetWidth || 380;
    const ch = cardEl.offsetHeight || 220;
    const gap = 14;
    const margin = 16;

    const fitsRight = r.right + pad + gap + cw <= vw - margin;
    const fitsLeft = r.left - pad - gap - cw >= margin;
    const fitsBelow = r.bottom + pad + gap + ch <= vh - 12;
    const fitsAbove = r.top - pad - gap - ch >= 12;

    const order = stop.preferSide === 'below'
      ? ['below', 'above', 'right', 'left']
      : (stop.preferSide === 'left'
        ? ['left', 'right', 'below', 'above']
        : ['right', 'left', 'below', 'above']);

    let placed = null;
    for (let i = 0; i < order.length; i++) {
      const side = order[i];
      if (side === 'right' && fitsRight) {
        placed = { left: r.right + pad + gap, top: clamp(r.top, 12, vh - ch - 12) };
        break;
      }
      if (side === 'left' && fitsLeft) {
        placed = { left: r.left - pad - gap - cw, top: clamp(r.top, 12, vh - ch - 12) };
        break;
      }
      if (side === 'below' && fitsBelow) {
        placed = { left: clamp(r.left, margin, vw - cw - margin), top: r.bottom + pad + gap };
        break;
      }
      if (side === 'above' && fitsAbove) {
        placed = { left: clamp(r.left, margin, vw - cw - margin), top: r.top - pad - gap - ch };
        break;
      }
    }

    if (!placed) {
      placed = {
        left: clamp(r.left, margin, vw - cw - margin),
        top: clamp(vh - ch - 16, 12, vh - ch - 12)
      };
    }

    cardEl.style.left = Math.round(placed.left) + 'px';
    cardEl.style.top = Math.round(placed.top) + 'px';
  }

  function renderTourCard() {
    const tourRoot = getTourRoot();
    if (!tourRoot) return;
    if (tourIndex < 0) {
      tourRoot.hidden = true;
      tourRoot.innerHTML = '';
      return;
    }

    const stop = TOUR_STOPS[tourIndex];
    tourRoot.hidden = false;
    tourRoot.innerHTML = `
      <div class="kiosk-tour-backdrop split-tour-backdrop" data-split-tour="close" aria-hidden="true"></div>
      <div class="kiosk-tour-spotlight split-tour-spotlight" aria-hidden="true"></div>
      <div class="kiosk-tour-card split-tour-card" role="dialog" aria-modal="true" aria-label="${esc(stop.title)}">
        <div class="kiosk-tour-meta">
          <span class="badge badge-gold">${tourIndex + 1} / ${TOUR_STOPS.length}</span>
          <button data-split-tour="close" type="button" class="btn-ghost" style="padding:4px 10px;font-size:12px">Tutup</button>
        </div>
        <h3>${esc(stop.title)}</h3>
        <p>${esc(stop.body)}</p>
        <div class="kiosk-tour-why">${esc(stop.why)}</div>
        <div class="kiosk-tour-footer">
          <button data-split-tour="prev" type="button" class="btn-ghost" ${tourIndex === 0 ? 'disabled' : ''}>← Kembali</button>
          <button data-split-tour="${tourIndex === TOUR_STOPS.length - 1 ? 'close' : 'next'}" type="button" class="btn-primary">
            ${tourIndex === TOUR_STOPS.length - 1 ? 'Selesai ✓' : 'Lanjut →'}
          </button>
        </div>
      </div>
    `;

    if (!tourRoot.dataset.wired) {
      tourRoot.dataset.wired = '1';
      tourRoot.addEventListener('click', (ev) => {
        const actEl = ev.target.closest('[data-split-tour]');
        if (!actEl) return;
        const act = actEl.dataset.splitTour;
        if (act === 'close') close(true);
        else if (act === 'prev') applyStep(tourIndex - 1);
        else if (act === 'next') applyStep(tourIndex + 1);
      });
    }

    if (typeof root.requestAnimationFrame === 'function') {
      root.requestAnimationFrame(positionTour);
    } else {
      positionTour();
    }
  }

  function applyStep(idx) {
    const store = NS.storeInstance;
    if (!store) return;
    tourIndex = clamp(idx, 0, TOUR_STOPS.length - 1);
    store.restoreState(null, false);
    TOUR_STOPS[tourIndex].setup(store);
    const phoneScroll = document.querySelector('#mount-mobile .phone-scroll');
    if (phoneScroll) phoneScroll.scrollTop = 0;
    renderTourCard();
  }

  function start() {
    const store = NS.storeInstance;
    if (!store || !isSplitActive()) return;
    if (!listenersBound) {
      listenersBound = true;
      root.addEventListener('resize', () => {
        if (tourIndex >= 0) positionTour();
      });
      document.addEventListener('keydown', (ev) => {
        if (ev.key === 'Escape' && tourIndex >= 0) close(true);
      });
    }
    if (tourIndex < 0) {
      tourBackup = JSON.parse(JSON.stringify(store.getState()));
    }
    applyStep(0);
  }

  function close(restore) {
    if (tourIndex < 0) return;
    const backup = tourBackup;
    tourIndex = -1;
    tourBackup = null;
    renderTourCard();
    if (restore !== false && backup && NS.storeInstance) {
      NS.storeInstance.restoreState(backup, false);
    }
  }

  function isOpen() {
    return tourIndex >= 0;
  }

  NS.SplitTour = { start, close, isOpen, reposition: positionTour };
})(window);
