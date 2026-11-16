(function (root) {
  'use strict';

  const NS = (root.JARAK_AMAN = root.JARAK_AMAN || {});

  const WORKERS = [
    { id: 'Andi', name: 'Andi', role: 'Checker', group: 'Pegawai', zone: 'Dermaga A', x: 18, y: 21, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.08', arrive: 120 },
    { id: 'Budi', name: 'Budi', role: 'Operator RS', group: 'Pegawai', zone: 'Lapangan C', x: 30, y: 45, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.11', arrive: 150 },
    { id: 'Citra', name: 'Citra', role: 'Tally', group: 'Pegawai', zone: 'Dermaga A', x: 28, y: 22, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.14', arrive: 90 },
    { id: 'Dedi', name: 'Dedi', role: 'TKBM', group: 'TKBM', zone: 'Dermaga B', x: 55, y: 21, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.17', arrive: 140 },
    { id: 'Eka', name: 'Eka', role: 'Foreman', group: 'Pegawai', zone: 'Lapangan D', x: 52, y: 60, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.20', arrive: 70 },
    { id: 'Fajar', name: 'Fajar', role: 'Sopir truk', group: 'Sopir', zone: 'Lapangan C', x: 38, y: 52, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.23', arrive: 60 },
    { id: 'Gita', name: 'Gita', role: 'Checker', group: 'Pegawai', zone: 'Lapangan D', x: 60, y: 66, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.26', arrive: 80 },
    { id: 'Hadi', name: 'Hadi', role: 'Lasher (di kapal)', group: 'TKBM', zone: 'Dermaga B', x: 64, y: 12, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'pending', indTime: null, arrive: 240 },
    { id: 'Indra', name: 'Indra', role: 'Sopir truk', group: 'Sopir', zone: 'Gate 3', x: 12, y: 86, locPerm: 'denied', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.29', arrive: 200, why: 'Izin lokasi ditolak · data gate' },
    { id: 'Joko', name: 'Joko', role: 'TKBM', group: 'TKBM', zone: 'Lapangan C', x: 26, y: 58, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.32', arrive: 130 },
    { id: 'Kurnia', name: 'Kurnia', role: 'Tally', group: 'Pegawai', zone: 'Dermaga B', x: 72, y: 23, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.35', arrive: 110 },
    { id: 'Lukman', name: 'Lukman', role: 'Operator RTG', group: 'Pegawai', zone: 'Lapangan D', x: 46, y: 70, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'pending', indTime: null, arrive: 190 },
    { id: 'Made', name: 'Made', role: 'Sopir truk', group: 'Sopir', zone: 'Lapangan D', x: 58, y: 50, locPerm: 'none', hasApp: false, heartbeatLost: false, indStatus: 'pos_gate', indTime: '07.38', arrive: 9999, why: 'Tanpa aplikasi · data gate' },
    { id: 'Nanda', name: 'Nanda', role: 'Checker', group: 'Pegawai', zone: 'Lapangan C', x: 34, y: 38, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.41', arrive: 100 },
    { id: 'Oki', name: 'Oki', role: 'TKBM', group: 'TKBM', zone: 'Dermaga A', x: 10, y: 22, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'pending', indTime: null, arrive: 9999 },
    { id: 'Putu', name: 'Putu', role: 'Operator QC (ketinggian)', group: 'Pegawai', zone: 'Dermaga B', x: 44, y: 18, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.44', arrive: 270 },
    { id: 'Rudi', name: 'Rudi', role: 'TKBM', group: 'TKBM', zone: 'Dermaga B', x: 68, y: 20, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.47', arrive: 9999, baseSos: true },
    { id: 'Sari', name: 'Sari', role: 'Checker', group: 'Pegawai', zone: 'Lapangan D', x: 64, y: 42, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.50', arrive: 85 },
    { id: 'Tono', name: 'Tono', role: 'Sopir truk', group: 'Sopir', zone: 'Gate 3', x: 16, y: 90, locPerm: 'always', hasApp: true, heartbeatLost: true, indStatus: 'done', indTime: '07.52', arrive: 230, why: 'Heartbeat hilang 7 menit · posisi terakhir Gate 3' },
    { id: 'Umar', name: 'Umar', role: 'TKBM', group: 'TKBM', zone: 'Lapangan C', x: 22, y: 66, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.54', arrive: 140 },
    { id: 'Vina', name: 'Vina', role: 'Tally', group: 'Pegawai', zone: 'Lapangan D', x: 50, y: 44, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.56', arrive: 75 },
    { id: 'Wahyu', name: 'Wahyu', role: 'TKBM', group: 'TKBM', zone: 'Gate 3', x: 8, y: 84, locPerm: 'denied', hasApp: true, heartbeatLost: false, indStatus: 'apd_helm', indTime: null, why: 'Izin lokasi ditolak · data gate' },
    { id: 'Yusuf', name: 'Yusuf', role: 'Operator RS', group: 'Pegawai', zone: 'Lapangan C', x: 40, y: 62, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.58', arrive: 120 },
    { id: 'Zaenal', name: 'Zaenal', role: 'Sopir truk', group: 'Sopir', zone: 'Lapangan D', x: 56, y: 74, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'apd_vest', indTime: null, arrive: 50 }
  ];

  const EQUIPMENT = [
    { id: 'QC-02', type: 'Quay crane', op: 'Putu', zone: 'Dermaga B', x: 44, y: 22, stop: 60 },
    { id: 'QC-04', type: 'Quay crane', op: 'Ari', zone: 'Dermaga B', x: 62, y: 22, stop: 70 },
    { id: 'RS-07', type: 'Reach stacker', op: 'Budi', zone: 'Lapangan C', x: 33, y: 48, stop: 20 },
    { id: 'RS-11', type: 'Reach stacker', op: 'Yusuf', zone: 'Lapangan C', x: 42, y: 64, stop: 35 },
    { id: 'RTG-03', type: 'RTG', op: 'Lukman', zone: 'Lapangan D', x: 48, y: 72, stop: 150 },
    { id: 'RTG-05', type: 'RTG', op: 'Bayu', zone: 'Lapangan C', x: 24, y: 40, stop: 25 },
    { id: 'TT-14', type: 'Truk terminal', op: 'Dani', zone: 'Dermaga B', x: 55, y: 30, stop: 15 },
    { id: 'TT-21', type: 'Truk terminal', op: 'Eko', zone: 'Dermaga A', x: 30, y: 28, stop: 30 }
  ];

  const ASSEMBLY_POINTS = {
    'gedung-b': {
      id: 'gedung-b',
      name: 'Gedung Evakuasi B',
      typeLabel: 'Gedung Evakuasi Vertikal',
      cap: 40,
      mapX: 83,
      mapY: 72
    },
    'area-timur': {
      id: 'area-timur',
      name: 'Area Terbuka Timur',
      typeLabel: 'Lapangan Terbuka Aman Struktur',
      cap: 60,
      mapX: 60,
      mapY: 88
    }
  };

  const ROUTES = {
    tsunami: {
      id: 'tsunami-main',
      destId: 'gedung-b',
      destName: 'Gedung Evakuasi B',
      isBackup: false,
      segments: [
        { len: 50, turn: 'kanan', turnText: 'Belok kanan ke Jalan Utama', straight: 'Lurus menuju Jalan Utama' },
        { len: 130, turn: 'kanan', turnText: 'Belok kanan di Gate 2', straight: 'Lurus di Jalan Utama' },
        { len: 40, turn: 'kiri', turnText: 'Belok kiri ke Gedung Evakuasi B', straight: 'Lurus melewati Gate 2' },
        { len: 100, turn: null, turnText: 'Tiba di Gedung Evakuasi B', straight: 'Lurus ke Gedung Evakuasi B' }
      ],
      svgPts: [[30, 104], [30, 44], [186, 44], [186, 92], [306, 92]]
    },
    tsunamiBackup: {
      id: 'tsunami-backup',
      destId: 'gedung-b',
      destName: 'Gedung Evakuasi B (Rute Cadangan)',
      isBackup: true,
      segments: [
        { len: 80, turn: 'kiri', turnText: 'Belok kiri ke Koridor Selatan', straight: 'Hindari Jalan Dermaga B · ke selatan' },
        { len: 160, turn: 'kanan', turnText: 'Belok kanan menuju Jalan Timur', straight: 'Lurus di Koridor Selatan' },
        { len: 80, turn: null, turnText: 'Tiba di Gedung Evakuasi B', straight: 'Masuk sisi selatan Gedung B' }
      ],
      svgPts: [[30, 104], [30, 114], [240, 114], [306, 92]]
    },
    gempa: {
      id: 'gempa-open',
      destId: 'area-timur',
      destName: 'Area Terbuka Timur',
      isBackup: false,
      segments: [
        { len: 90, turn: 'kanan', turnText: 'Belok kanan menjauhi tumpukan', straight: 'Jauhi crane & tumpukan kontainer' },
        { len: 140, turn: 'kanan', turnText: 'Belok kanan ke Lapangan Parkir Timur', straight: 'Lurus di jalur bebas bangunan' },
        { len: 70, turn: null, turnText: 'Tiba di Area Terbuka Timur', straight: 'Masuk Area Terbuka Timur' }
      ],
      svgPts: [[30, 104], [30, 86], [210, 86], [244, 112]]
    },
    b3: {
      id: 'b3-upwind',
      destId: 'gedung-b',
      destName: 'Gedung Evakuasi B (Melawan Angin)',
      isBackup: false,
      segments: [
        { len: 70, turn: 'kanan', turnText: 'Belok kanan melawan arah angin', straight: 'Bergerak ke timur melawan asap' },
        { len: 150, turn: 'kiri', turnText: 'Masuk Pos Aman Gedung B', straight: 'Lurus di luar radius B3' },
        { len: 80, turn: null, turnText: 'Tiba di Gedung Evakuasi B', straight: 'Tiba di area aman tertutup' }
      ],
      svgPts: [[30, 104], [112, 104], [186, 62], [306, 92]]
    }
  };

  const CLSR_CATEGORIES = [
    { id: 'nm', title: 'Near miss orang–alat', sub: 'Hampir tertabrak atau terjepit', hotspotId: 'hs-lapangan-c' },
    { id: 'lajur', title: 'Orang di lajur alat', sub: 'Berjalan di jalur atau titik buta', hotspotId: 'hs-dermaga-b' },
    { id: 'apd', title: 'APD tidak lengkap', sub: 'Tanpa helm, rompi, atau sepatu', hotspotId: 'hs-gate-3' },
    { id: 'kondisi', title: 'Kondisi tidak aman', sub: 'Rambu rusak, gelap, licin', hotspotId: 'hs-dermaga-a' }
  ];

  const INDUCTION_BASE = [
    { id: 'k1', cat: 'KORBAN JIWA', text: '31 orang meninggal 2023–2025; 29 di antaranya pihak eksternal (TKBM, sopir, mitra).', meta: 'Sustainability Report Pelindo 2025, hlm. 125 · terkunci', locked: true },
    { id: 'k2', cat: 'KORBAN JIWA', text: 'Pada 2025: 86% korban jatuh di area dermaga dan 57% akibat benturan alat berat.', meta: 'Sustainability Report Pelindo 2025, hlm. 126 · terkunci', locked: true },
    { id: 'b1', cat: 'KEJADIAN TERBARU', text: 'Kemarin 13.41 · Lapangan C: RS-07 mundur ±4 m dari TKBM yang berjalan di lajur alat.', meta: 'Laporan near miss (F12) · data contoh', isNew: true },
    { id: 'b2', cat: 'KEJADIAN TERBARU', text: 'Jul 2026 · Pelabuhan Sikka, Maumere: karyawan tewas terlindas alat berat.', meta: 'Liputan6, 12 Jul 2026' },
    { id: 'l1', cat: 'KELALAIAN', text: 'Berjalan di lajur alat berat atau memotong jalan di antara tumpukan kontainer.', meta: 'HSSE Terminal · contoh' },
    { id: 'l2', cat: 'KELALAIAN', text: 'Berdiri di titik buta reach stacker dan truk terminal saat alat mundur.', meta: 'HSSE Terminal · contoh' },
    { id: 'l3', cat: 'KELALAIAN', text: 'Turun dari kabin truk di zona alat berat tanpa rompi reflektif dan helm.', meta: 'HSSE Terminal · contoh' },
    { id: 'l4', cat: 'KELALAIAN', text: 'Memakai HP sambil berjalan di lapangan penumpukan.', meta: 'HSSE Terminal · contoh' },
    { id: 'z1', cat: 'INFO ZONA', text: 'Dermaga B: bongkar kapal sampai 16.00, jalur pejalan kaki lewat sisi timur.', meta: 'HSSE Terminal · data contoh', isNew: true },
    { id: 'z2', cat: 'INFO ZONA', text: 'Lapangan D: pekerjaan las 10.00–14.00, radius 10 m ditutup.', meta: 'HSSE Terminal · data contoh' }
  ];

  const INDUCTION_CANDIDATES = [
    { id: 'c1', src: 'LAPORAN PELANGGARAN (F12)', cat: 'KELALAIAN', text: 'Kemarin 4 laporan TKBM berjalan di lajur alat Lapangan C saat RS-07 beroperasi. Pakai jalur pejalan kaki sisi timur.' },
    { id: 'c2', src: 'LAPORAN PETUGAS GATE', cat: 'KELALAIAN', text: 'Truk parkir di lajur darurat Gate 3 saat antre. Lajur darurat harus selalu kosong.' },
    { id: 'c3', src: 'JADWAL OPERASI', cat: 'INFO ZONA', text: 'Lapangan C: pemindahan kontainer kosong 08.00–12.00, reach stacker lebih sering mundur.' }
  ];

  const HOTSPOT_CLUSTERS = [
    { id: 'hs-lapangan-c', zone: 'Lapangan C · Blok C3', title: 'Titik buta RS-07 & checker periksa segel', x: 33, y: 50, count: 14, severity: 'high', rec: 'Pisahkan lajur pejalan kaki sisi timur + pengingat harian F11' },
    { id: 'hs-dermaga-b', zone: 'Dermaga B · QC-02', title: 'Lasher & TKBM di bawah bentang quay crane', x: 58, y: 20, count: 11, severity: 'high', rec: 'Larangan melintas di bawah beban + patroli HSSE jam sibuk' },
    { id: 'hs-gate-3', zone: 'Gate 3 · Antrean Truk', title: 'Sopir turun tanpa APD & parkir di lajur darurat', x: 14, y: 84, count: 5, severity: 'med', rec: 'Kiosk induksi Gate 3 + rompi pinjaman di pos jaga' },
    { id: 'hs-dermaga-a', zone: 'Dermaga A · Tepi Dermaga', title: 'Risiko terpeleset & jarak aman tepi dermaga', x: 20, y: 18, count: 3, severity: 'low', rec: 'Periksa pencahayaan malam & pagar pelindung tambat' }
  ];

  NS.DATA = {
    WORKERS,
    EQUIPMENT,
    ASSEMBLY_POINTS,
    ROUTES,
    CLSR_CATEGORIES,
    INDUCTION_BASE,
    INDUCTION_CANDIDATES,
    HOTSPOT_CLUSTERS
  };
})(typeof window !== 'undefined' ? window : globalThis);
