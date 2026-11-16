(function (root) {
  'use strict';

  const NS = (root.JARAK_AMAN = root.JARAK_AMAN || {});
  const D = NS.DATA;

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function createInitialState() {
    return {
      phase: 'normal', // 'normal' | 'evac' | 'recovery'
      evacSource: 'cmd', // 'cmd' | 'mandiri'
      evacHazard: 'tsunami', // 'tsunami' | 'gempa' | 'b3'
      evacZone: 'all', // 'all' | 'dermaga'
      evacBasis: 'bmkg', // 'bmkg' | 'lapangan' | 'langsung'
      evacDrill: false,
      evacLeft: 300,
      evacTotal: 300,
      timedOut: false,
      fast: false,
      routeClosed: false,
      cmdPost: 'utama', // 'utama' | 'cadangan'
      sarExported: false,
      confirmModalOpen: false,
      confirmDraft: { hazard: 'tsunami', zone: 'all', basis: 'bmkg', drill: false },
      activeControlTab: 'map', // 'map' | 'compliance' | 'induction'
      complianceFilter: 'all', // 'all' | 'pending' | 'apd' | 'noapp'
      selectedEntity: null, // { kind: 'worker'|'equip', id }
      workers: deepClone(D.WORKERS),
      handledAlarms: {},
      liveAlarms: [],
      hotspots: deepClone(D.HOTSPOT_CLUSTERS),
      induction: {
        stage: 'published', // 'published' | 'draft' | 'review'
        rev: 1,
        pubAt: '06.30',
        hiddenIds: {},
        draftIds: {},
        addedIds: {},
        candidates: deepClone(D.INDUCTION_CANDIDATES),
        rereadRequired: false,
        rereadAcked: false
      },
      mobile: {
        activeScenario: 'enter',
        screen: 'home', // outside|perm|home|ind|indDone|report|alert|safe|clear|sos|out
        os: 'ios', // 'ios' | 'android'
        evacView: 'app', // 'app' | 'other' | 'lock'
        islandOpen: false,
        wrong: false,
        locPerm: true,
        notifPerm: true,
        batExempt: true,
        indDone: true,
        indStep: 1,
        indShot: 'none', // 'none' | 'ok' | 'fail'
        indFailMode: false,
        shoes: false,
        gloves: false,
        quiz: null,
        rCat: null,
        rPhoto: false,
        rAnon: false,
        rNote: '',
        rOffline: false,
        toast: '',
        toastLeft: 0,
        safeAt: 0,
        sosReason: '',
        prevScreen: 'home'
      },
      marshal: {
        selectedPoint: 'gedung-b',
        offline: false,
        filter: 'all', // 'all' | 'pending' | 'safe'
        bulkSelected: {},
        pendingQueue: [], // queued actions while offline
        overrides: {} // workerId -> { status: 'Aman'|'Belum terkonfirmasi'|'Butuh bantuan', pointId, byMarshal: true, time }
      },
      kiosk: {
        lang: 'id', // 'id' | 'en'
        step: 1, // 1 | 2 | 3 | 4 (success)
        role: 'TKBM',
        name: '',
        cardId: '',
        passengers: 0,
        phone: '',
        understood: false,
        apdHelm: true,
        apdVest: true,
        apdShoes: true,
        borrowedApd: false,
        lastCheckin: null
      }
    };
  }

  function isWorkerInEvacZone(worker, state) {
    if (state.evacZone === 'all') return true;
    return worker.zone === 'Dermaga A' || worker.zone === 'Dermaga B';
  }

  function getEvacDestination(state) {
    if (state.evacHazard === 'gempa') {
      return Object.assign({}, D.ASSEMBLY_POINTS['area-timur'], { overflowed: false });
    }
    const gedungSafe = countSafeAtPoint(state, 'gedung-b');
    if (gedungSafe >= D.ASSEMBLY_POINTS['gedung-b'].cap) {
      return Object.assign({}, D.ASSEMBLY_POINTS['area-timur'], { overflowed: true });
    }
    return Object.assign({}, D.ASSEMBLY_POINTS['gedung-b'], { overflowed: false });
  }

  function countSafeAtPoint(state, pointId) {
    if (state.phase !== 'evac') return 0;
    const elapsed = state.evacTotal - state.evacLeft;
    let gedungCount = 0;
    let timurCount = 0;
    const addPoint = (pid) => {
      if (pid === 'gedung-b') gedungCount++;
      else if (pid === 'area-timur') timurCount++;
    };
    for (const w of state.workers) {
      if (!isWorkerInEvacZone(w, state)) continue;
      const ov = state.marshal.overrides[w.id];
      if (ov) {
        if (ov.status === 'Aman') addPoint(ov.pointId);
        continue;
      }
      if (w.id === 'Andi' && state.mobile.screen === 'safe') {
        const dest = state.evacHazard === 'gempa' ? 'area-timur' : 'gedung-b';
        addPoint(dest);
        continue;
      }
      if (w.baseSos || w.locPerm !== 'always' || !w.hasApp || w.heartbeatLost) continue;
      if (elapsed >= w.arrive) {
        const autoPoint = (state.evacHazard === 'gempa' || gedungCount >= D.ASSEMBLY_POINTS['gedung-b'].cap)
          ? 'area-timur'
          : 'gedung-b';
        addPoint(autoPoint);
      }
    }
    return pointId === 'gedung-b' ? gedungCount : timurCount;
  }

  function getActiveRoute(state) {
    const dest = getEvacDestination(state);
    if (state.evacHazard === 'gempa' || dest.overflowed) {
      return D.ROUTES.gempa;
    }
    if (state.evacHazard === 'b3') {
      return D.ROUTES.b3;
    }
    if (state.routeClosed) {
      return D.ROUTES.tsunamiBackup;
    }
    return D.ROUTES.tsunami;
  }

  function getWorkerRows(state) {
    const evac = state.phase === 'evac';
    const elapsed = evac ? state.evacTotal - state.evacLeft : 0;
    const dest = getEvacDestination(state);

    let safeAssignedGedung = 0;
    return state.workers.map((w, i) => {
      const hasLivePos = w.hasApp && w.locPerm === 'always' && !w.heartbeatLost;
      const inEvacZone = evac && isWorkerInEvacZone(w, state);
      const ov = state.marshal.overrides[w.id];
      let status, tone, rank, progress = 0, pointId = null;

      if (w.exited) {
        status = 'Di luar area';
        tone = 'muted';
        rank = 5;
      } else if (!inEvacZone) {
        if (!w.hasApp) { status = 'Tanpa aplikasi'; tone = 'muted'; rank = 2; }
        else if (w.heartbeatLost) { status = 'Tidak terpantau'; tone = 'muted'; rank = 2; }
        else if (w.locPerm === 'denied') { status = 'Izin lokasi ditolak'; tone = 'warn'; rank = 2; }
        else { status = 'Aktif'; tone = 'info'; rank = 3; }
      } else if (ov) {
        status = ov.status;
        pointId = ov.pointId || null;
        if (ov.status === 'Aman') { tone = 'safe'; rank = 4; progress = 1; }
        else if (ov.status === 'Butuh bantuan') { tone = 'crit'; rank = 0; }
        else { tone = state.timedOut ? 'crit' : 'warn'; rank = 1; }
      } else if (w.baseSos || (w.id === 'Andi' && state.mobile.screen === 'sos')) {
        status = 'Butuh bantuan';
        tone = 'crit';
        rank = 0;
      } else if (w.id === 'Andi' && state.mobile.screen === 'safe') {
        status = 'Aman';
        tone = 'safe';
        rank = 4;
        progress = 1;
        pointId = dest.id;
      } else if (hasLivePos && elapsed >= w.arrive) {
        status = 'Aman';
        tone = 'safe';
        rank = 4;
        progress = 1;
        if (state.evacHazard === 'gempa' || safeAssignedGedung >= D.ASSEMBLY_POINTS['gedung-b'].cap) {
          pointId = 'area-timur';
        } else {
          pointId = 'gedung-b';
          safeAssignedGedung++;
        }
      } else if (state.timedOut) {
        status = 'Belum keluar';
        tone = 'crit';
        rank = 1;
        progress = hasLivePos ? Math.min(0.85, elapsed / Math.max(1, w.arrive)) : 0;
      } else if (!hasLivePos) {
        status = 'Belum terkonfirmasi';
        tone = 'muted';
        rank = 2;
      } else {
        status = 'Menuju titik aman';
        tone = 'warn';
        rank = 2;
        progress = Math.min(0.95, elapsed / Math.max(1, w.arrive));
      }

      const targetPoint = pointId ? D.ASSEMBLY_POINTS[pointId] : dest;
      const tx = targetPoint.mapX + (i % 4) * 3.1;
      const ty = targetPoint.mapY + (Math.floor(i / 4) % 3) * 4.2;
      const curX = w.x + (tx - w.x) * progress;
      const curY = w.y + (ty - w.y) * progress;

      let indText = 'Belum';
      let indTone = 'warn';
      if (w.indStatus === 'done') { indText = `Selesai ${w.indTime || '07.15'}`; indTone = 'safe'; }
      else if (w.indStatus === 'apd_helm') { indText = 'APD tidak lengkap · helm'; indTone = 'crit'; }
      else if (w.indStatus === 'apd_vest') { indText = 'APD tidak lengkap · rompi'; indTone = 'crit'; }
      else if (w.indStatus === 'pos_gate') { indText = `Di pos gate · selesai ${w.indTime || '07.38'}`; indTone = 'safe'; }

      const locLabel = w.locPerm === 'denied' ? 'Ditolak · data gate' : (!w.hasApp ? 'Tanpa aplikasi' : (w.heartbeatLost ? 'Heartbeat hilang' : 'Selalu'));
      const posDesc = status === 'Aman'
        ? `${ov ? 'Petugas titik kumpul' : 'Geofence + petugas'} · ${targetPoint.name}`
        : (hasLivePos ? `GPS · ${(i * 7) % 25 + 3} dtk lalu` : (w.why || 'Data gate'));

      return Object.assign({}, w, {
        status,
        tone,
        rank,
        inEvacZone,
        hasLivePos,
        pointId,
        mapLeft: curX.toFixed(1) + '%',
        mapTop: curY.toFixed(1) + '%',
        indText,
        indTone,
        locLabel,
        posDesc,
        byMarshal: !!(ov && ov.byMarshal)
      });
    });
  }

  function getEquipmentRows(state) {
    const evac = state.phase === 'evac';
    const elapsed = evac ? state.evacTotal - state.evacLeft : 0;
    return D.EQUIPMENT.map((e) => {
      const inZone = evac && (state.evacZone === 'all' || e.zone === 'Dermaga A' || e.zone === 'Dermaga B');
      const stopped = inZone && elapsed >= e.stop;
      let status = 'Beroperasi';
      let tone = 'info';
      if (inZone) {
        if (stopped) { status = 'Berhenti, operator turun'; tone = 'muted'; }
        else if (elapsed >= 60) { status = 'Belum berhenti'; tone = 'crit'; }
        else { status = 'Menghentikan'; tone = 'warn'; }
      }
      return Object.assign({}, e, {
        status,
        tone,
        stopped,
        inZone,
        mapLeft: e.x + '%',
        mapTop: e.y + '%'
      });
    });
  }

  function getAlarmQueue(state) {
    const pad = (n) => String(n).padStart(2, '0');
    const evac = state.phase === 'evac';
    const elapsed = evac ? state.evacTotal - state.evacLeft : 0;
    const rows = getWorkerRows(state);
    const eq = getEquipmentRows(state);
    const base = [
      { id: 'nm1', sev: 'LAPORAN NEAR MISS (F12)', tone: 'warn', title: 'RS-07 mundur ±4 m dari Joko (TKBM)', meta: 'Lapangan C · 13.41 WIB · dilaporkan checker · tindak lanjut 24 jam' },
      { id: 'tt1', sev: 'PELANGGARAN (F12)', tone: 'warn', title: 'Sopir B 9123 turun di zona alat tanpa helm', meta: 'Blok C3 · 13.55 WIB · dicatat safety patrol' },
      { id: 'hb1', sev: 'TIDAK TERPANTAU', tone: 'muted', title: 'Tono (Sopir truk) · heartbeat hilang 7 menit', meta: 'Kemungkinan penghemat baterai · posisi terakhir Gate 3' }
    ];
    const shake = { id: 'gk1', sev: 'LAPORAN GUNCANGAN KUAT', tone: 'warn', title: '3 pengguna di Dermaga B menekan tombol guncangan kuat', meta: 'Masukan untuk komandan insiden (tidak memicu evakuasi otomatis)' };

    let list = state.liveAlarms.concat([shake], base);
    if (evac) {
      const extra = [];
      rows.filter((r) => r.status === 'Butuh bantuan').forEach((r) => {
        const age = Math.max(0, elapsed - 15);
        extra.push({
          id: `sos-${r.id}`,
          sev: 'BUTUH BANTUAN (SOS)',
          tone: 'crit',
          title: `${r.name} (${r.role}) · tombol SOS`,
          meta: `${r.zone} · detail lokasi hanya untuk tim penyelamat`,
          age
        });
      });
      eq.filter((e) => e.inZone && !e.stopped && elapsed >= 60).forEach((e) => {
        extra.push({
          id: `eq-${e.id}`,
          sev: 'ALAT BELUM BERHENTI',
          tone: 'crit',
          title: `${e.id} (${e.type}) · operator ${e.op} belum konfirmasi`,
          meta: 'Hubungi lewat radio · jauhkan pejalan kaki dari lajur'
        });
      });
      const timedOutNames = rows.filter((r) => r.status === 'Belum keluar').map((r) => r.name);
      if (state.timedOut && timedOutNames.length) {
        extra.push({
          id: 'bk-timeout',
          sev: 'BELUM KELUAR (TIMER HABIS)',
          tone: 'crit',
          title: `${timedOutNames.join(', ')} · belum tercatat Aman`,
          meta: 'Serahkan koordinat terakhir ke tim SAR / BPBD'
        });
      }
      list = extra.concat(list);
      if (state.evacDrill) {
        list = list.map((a) => Object.assign({}, a, { sev: `LATIHAN · ${a.sev}` }));
      }
    }

    return list.map((a) => {
      const h = state.handledAlarms[a.id];
      const ageTxt = a.age !== undefined ? `${Math.floor(a.age / 60)}:${pad(a.age % 60)}` : '';
      const late = a.age !== undefined && a.age > 60;
      const waitText = a.age !== undefined
        ? (late ? `Belum diambil alih ${ageTxt} · dieskalasi ke supervisor K3` : `Belum diambil alih ${ageTxt} · SLA 1:00`)
        : 'Belum ditangani';
      return Object.assign({}, a, {
        handledState: h || 'open',
        statusText: h === 'done' ? 'Selesai · ditutup' : (h === 'taken' ? 'Ditangani Anda' : waitText),
        escalated: !h && late,
        actionLabel: h === 'taken' ? 'Tandai selesai' : 'Ambil alih',
        showAction: h !== 'done'
      });
    });
  }

  function getComplianceStats(state) {
    const active = getWorkerRows(state).filter((w) => !w.exited);
    const groupsOrder = ['Pegawai', 'TKBM', 'Sopir', 'Tamu'];
    const groups = groupsOrder.map((g) => {
      const list = active.filter((w) => (w.group || 'Tamu') === g);
      const inducted = list.filter((w) => w.indStatus === 'done' || w.indStatus === 'pos_gate').length;
      const tracked = list.filter((w) => w.hasLivePos).length;
      const apdFail = list.filter((w) => w.indStatus === 'apd_helm' || w.indStatus === 'apd_vest').length;
      return {
        group: g,
        total: list.length,
        inducted,
        tracked,
        apdFail,
        pct: list.length ? Math.round((inducted / list.length) * 100) : 100
      };
    });
    const total = active.length;
    const inducted = active.filter((w) => w.indStatus === 'done' || w.indStatus === 'pos_gate').length;
    const tracked = active.filter((w) => w.hasLivePos).length;
    const apdFail = active.filter((w) => w.indStatus === 'apd_helm' || w.indStatus === 'apd_vest').length;
    const noApp = active.filter((w) => !w.hasApp).length;
    return { total, inducted, tracked, apdFail, noApp, groups };
  }

  function getHotspots(state) {
    return state.hotspots;
  }

  function Store() {
    this.state = createInitialState();
    this.listeners = new Set();
    this.channel = null;
    try {
      if (typeof root.BroadcastChannel === 'function') {
        this.channel = new root.BroadcastChannel('jarak-aman-v07');
        this.channel.onmessage = (ev) => {
          if (ev && ev.data && ev.data.type === 'SYNC_STATE' && ev.data.state) {
            this.state = ev.data.state;
            this._notify(false);
          }
        };
      }
    } catch (_) {
      this.channel = null;
    }
  }

  Store.prototype.getState = function () {
    return this.state;
  };

  Store.prototype.subscribe = function (fn) {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  Store.prototype._notify = function (broadcast) {
    if (broadcast && this.channel) {
      try {
        this.channel.postMessage({ type: 'SYNC_STATE', state: this.state });
      } catch (_) {
        // Ignore opaque file:// origin or closed channel errors
      }
    }
    this.listeners.forEach((fn) => fn(this.state));
  };

  Store.prototype.reset = function () {
    this.state = createInitialState();
    this._notify(true);
  };

  Store.prototype.restoreState = function (snapshot, broadcast) {
    this.state = snapshot ? deepClone(snapshot) : createInitialState();
    this._notify(!!broadcast);
  };

  Store.prototype.tick = function () {
    const s = this.state;
    let changed = false;
    if (s.phase === 'evac' && !s.timedOut) {
      const step = s.fast ? 10 : 1;
      const nextLeft = Math.max(0, s.evacLeft - step);
      s.evacLeft = nextLeft;
      s.timedOut = nextLeft === 0;
      changed = true;
    }
    if (s.mobile.screen === 'alert' && s.phase === 'evac' && !s.mobile.wrong) {
      const route = getActiveRoute(s);
      const totalLen = route.segments.reduce((acc, seg) => acc + seg.len, 0);
      const elapsed = s.evacTotal - s.evacLeft;
      if (elapsed * 1.5 >= totalLen) {
        s.mobile.screen = 'safe';
        s.mobile.safeAt = elapsed;
        s.mobile.evacView = 'app';
        s.mobile.islandOpen = false;
        changed = true;
      }
    }
    if (s.mobile.toastLeft > 0) {
      s.mobile.toastLeft -= 1;
      changed = true;
    }
    if (changed) this._notify(true);
  };

  Store.prototype.dispatch = function (action) {
    const s = this.state;
    switch (action.type) {
      case 'SET_VIEW_TAB':
        s.activeControlTab = action.tab;
        break;
      case 'SET_COMPLIANCE_FILTER':
        s.complianceFilter = action.filter;
        break;
      case 'SELECT_ENTITY':
        s.selectedEntity = action.entity;
        break;
      case 'OPEN_CONFIRM_MODAL':
        s.confirmModalOpen = !!action.open;
        break;
      case 'UPDATE_CONFIRM_DRAFT':
        s.confirmDraft = Object.assign({}, s.confirmDraft, action.patch);
        break;
      case 'START_EVAC': {
        s.phase = 'evac';
        s.confirmModalOpen = false;
        s.evacSource = action.source || 'cmd';
        s.evacHazard = action.hazard || s.confirmDraft.hazard;
        s.evacZone = action.zone || s.confirmDraft.zone;
        s.evacBasis = action.basis || s.confirmDraft.basis;
        s.evacDrill = action.drill !== undefined ? !!action.drill : s.confirmDraft.drill;
        s.evacLeft = s.evacTotal;
        s.timedOut = false;
        s.routeClosed = false;
        s.sarExported = false;
        s.handledAlarms = {};
        s.marshal.overrides = {};
        s.marshal.selectedPoint = s.evacHazard === 'gempa' ? 'area-timur' : 'gedung-b';
        const andi = s.workers.find((w) => w.id === 'Andi');
        if (andi && !andi.exited && isWorkerInEvacZone(andi, s)) {
          s.mobile.screen = 'alert';
          s.mobile.wrong = false;
          s.mobile.islandOpen = false;
          s.mobile.activeScenario = s.evacSource === 'mandiri' ? 'mandiri' : 'bmkg';
        }
        break;
      }
      case 'CANCEL_EVAC':
        s.phase = 'normal';
        s.confirmModalOpen = false;
        s.timedOut = false;
        s.routeClosed = false;
        s.handledAlarms = {};
        s.marshal.overrides = {};
        s.mobile.screen = 'home';
        s.mobile.toast = 'Perintah evakuasi dibatalkan oleh Ruang Kendali';
        s.mobile.toastLeft = 6;
        break;
      case 'END_EVAC':
        s.phase = 'recovery';
        s.timedOut = false;
        s.routeClosed = false;
        s.handledAlarms = {};
        s.mobile.screen = 'clear';
        s.mobile.islandOpen = false;
        break;
      case 'REOPEN_ZONES':
        s.phase = 'normal';
        s.cmdPost = 'utama';
        s.marshal.overrides = {};
        if (s.mobile.screen === 'clear' || s.mobile.screen === 'safe') {
          s.mobile.screen = 'home';
        }
        break;
      case 'TOGGLE_ROUTE_CLOSED':
        s.routeClosed = !s.routeClosed;
        break;
      case 'TOGGLE_CMD_POST':
        s.cmdPost = s.cmdPost === 'cadangan' ? 'utama' : 'cadangan';
        break;
      case 'TOGGLE_FAST':
        s.fast = action.fast !== undefined ? !!action.fast : !s.fast;
        break;
      case 'EXPORT_SAR':
        s.sarExported = true;
        break;
      case 'HANDLE_ALARM': {
        const cur = s.handledAlarms[action.id];
        s.handledAlarms[action.id] = cur === 'taken' ? 'done' : 'taken';
        break;
      }
      case 'SUBMIT_SHAKE': {
        s.liveAlarms.unshift({
          id: `live-shake-${Date.now()}`,
          sev: 'LAPORAN GUNCANGAN KUAT (MOBILE)',
          tone: 'warn',
          title: 'Andi (Checker · Dermaga A) merasakan guncangan kuat',
          meta: 'Baru saja · Evakuasi mandiri dimulai di HP pekerja; menunggu keputusan komandan'
        });
        s.phase = 'evac';
        s.evacSource = 'mandiri';
        s.evacHazard = 'gempa';
        s.evacZone = 'all';
        s.evacBasis = 'lapangan';
        s.evacLeft = s.evacTotal;
        s.timedOut = false;
        s.marshal.selectedPoint = 'area-timur';
        s.mobile.screen = 'alert';
        s.mobile.wrong = false;
        s.mobile.activeScenario = 'mandiri';
        break;
      }
      case 'TRIGGER_SOS': {
        const andi = s.workers.find((w) => w.id === 'Andi');
        if (andi) {
          s.marshal.overrides.Andi = { status: 'Butuh bantuan', pointId: null, byMarshal: false, time: '14.04' };
        }
        s.mobile.prevScreen = s.mobile.screen;
        s.mobile.screen = 'sos';
        s.mobile.sosReason = action.reason || 'Dikirim dari tombol Butuh bantuan.';
        break;
      }
      case 'CANCEL_SOS':
        if (s.marshal.overrides.Andi && s.marshal.overrides.Andi.status === 'Butuh bantuan') {
          delete s.marshal.overrides.Andi;
        }
        s.mobile.screen = s.mobile.prevScreen === 'alert' && s.phase === 'evac' ? 'alert' : 'home';
        break;
      case 'SUBMIT_REPORT': {
        const cat = D.CLSR_CATEGORIES.find((c) => c.id === action.category) || D.CLSR_CATEGORIES[0];
        const summary = (action.note && action.note.trim()) ? action.note.trim() : `${cat.title} di Lapangan C · Blok C3`;
        const reporter = action.anonymous ? 'Anonim' : 'Andi (Checker)';
        const idNum = 412 + s.liveAlarms.length + 1;
        s.liveAlarms.unshift({
          id: `live-nm-${idNum}`,
          sev: action.category === 'nm' ? 'LAPORAN NEAR MISS (F12)' : 'PELANGGARAN (F12)',
          tone: 'warn',
          title: `${summary}`,
          meta: `Lapangan C · Blok C3 · oleh ${reporter} · ${action.hasPhoto ? 'dengan foto' : 'tanpa foto'}`
        });
        s.induction.candidates.unshift({
          id: `cand-live-${idNum}`,
          fromMobile: true,
          src: `LAPORAN ${action.category === 'nm' ? 'NEAR MISS' : 'PELANGGARAN'} BARU (F12)`,
          cat: 'KEJADIAN TERBARU',
          text: `${summary} (dilaporkan ${reporter} via JARAK AMAN).`
        });
        const hs = s.hotspots.find((h) => h.id === cat.hotspotId);
        if (hs) hs.count += 1;
        s.mobile.screen = 'home';
        s.mobile.rCat = null;
        s.mobile.rPhoto = false;
        s.mobile.rAnon = false;
        s.mobile.rNote = '';
        s.mobile.toast = `Laporan terkirim ke HSSE · nomor LP-0${idNum} · masuk Antrean Ruang Kendali`;
        s.mobile.toastLeft = 6;
        break;
      }
      case 'TOGGLE_WRONG_WAY':
        s.mobile.wrong = !s.mobile.wrong;
        break;
      case 'SET_MOBILE_STATE':
        Object.assign(s.mobile, action.patch);
        if (action.patch && action.patch.indDone === true) {
          const andi = s.workers.find((w) => w.id === 'Andi');
          if (andi) { andi.indStatus = 'done'; andi.indTime = '07.15'; }
        } else if (action.patch && action.patch.indFailMode === false && action.patch.indShot === 'ok') {
          const andi = s.workers.find((w) => w.id === 'Andi');
          if (andi && andi.indStatus !== 'done') { andi.indStatus = 'pending'; }
        }
        break;
      case 'JUMP_SCENARIO': {
        const key = action.key;
        const andi = s.workers.find((w) => w.id === 'Andi');
        // Reset Andi & transient simulation flags deterministically while preserving Kiosk-added workers
        if (andi) {
          andi.exited = false;
          andi.locPerm = 'always';
          andi.indStatus = 'done';
          andi.indTime = '07.15';
        }
        delete s.marshal.overrides.Andi;
        s.timedOut = false;
        s.routeClosed = false;
        s.mobile.activeScenario = key;
        s.mobile.wrong = false;
        s.mobile.islandOpen = false;
        s.mobile.evacView = 'app';
        s.mobile.toast = '';
        s.mobile.toastLeft = 0;

        if (key === 'reg') {
          s.phase = 'normal';
          s.mobile.screen = 'perm';
          s.mobile.locPerm = false;
          s.mobile.notifPerm = false;
          s.mobile.batExempt = false;
        } else if (key === 'enter') {
          s.phase = 'normal';
          s.mobile.screen = 'home';
          s.mobile.indDone = false;
          s.mobile.indStep = 1;
          s.mobile.indShot = 'none';
          s.mobile.indFailMode = false;
          s.mobile.shoes = false;
          s.mobile.gloves = false;
          s.mobile.quiz = null;
          if (andi) andi.indStatus = 'pending';
          s.mobile.toast = 'JARAK AMAN aktif otomatis · cocok dengan transaksi Gate 3, 07.12 WIB';
          s.mobile.toastLeft = 8;
        } else if (key === 'induct' || key === 'apdfail') {
          const fail = key === 'apdfail';
          s.phase = 'normal';
          s.mobile.screen = 'ind';
          s.mobile.indDone = false;
          s.mobile.indStep = 1;
          s.mobile.indShot = fail ? 'fail' : 'none';
          s.mobile.indFailMode = fail;
          s.mobile.shoes = false;
          s.mobile.gloves = false;
          s.mobile.quiz = null;
          if (andi) andi.indStatus = fail ? 'apd_helm' : 'pending';
        } else if (key === 'mandiri') {
          s.phase = 'evac';
          s.evacSource = 'mandiri';
          s.evacHazard = 'gempa';
          s.evacZone = 'all';
          s.evacLeft = s.evacTotal;
          s.timedOut = false;
          s.marshal.selectedPoint = 'area-timur';
          s.mobile.screen = 'alert';
          if (!s.liveAlarms.some((a) => a.id === 'live-shake-demo')) {
            s.liveAlarms.unshift({
              id: 'live-shake-demo',
              sev: 'LAPORAN GUNCANGAN KUAT (MOBILE)',
              tone: 'warn',
              title: 'Andi (Checker · Dermaga A) merasakan guncangan kuat',
              meta: 'Baru saja · Evakuasi mandiri dimulai di HP pekerja; menunggu keputusan komandan'
            });
          }
        } else if (key === 'bmkg' || key === 'island') {
          s.phase = 'evac';
          s.evacSource = 'cmd';
          s.evacHazard = 'tsunami';
          s.evacZone = 'all';
          s.evacLeft = s.evacTotal;
          s.timedOut = false;
          s.marshal.selectedPoint = 'gedung-b';
          s.mobile.screen = 'alert';
          s.mobile.evacView = key === 'island' ? 'other' : 'app';
        } else if (key === 'arrive') {
          if (s.phase !== 'evac') {
            s.evacSource = 'cmd';
            s.evacHazard = 'tsunami';
            s.evacZone = 'all';
          }
          s.phase = 'evac';
          s.evacLeft = Math.max(60, s.evacTotal - 180);
          s.timedOut = false;
          s.mobile.screen = 'safe';
          s.mobile.safeAt = 180;
        } else if (key === 'report') {
          s.phase = 'normal';
          s.mobile.screen = 'report';
          s.mobile.rCat = null;
          s.mobile.rPhoto = false;
          s.mobile.rAnon = false;
          s.mobile.rNote = '';
        } else if (key === 'out') {
          s.phase = 'normal';
          s.mobile.screen = 'out';
          if (andi) andi.exited = true;
        }
        break;
      }
      case 'TOGGLE_INDUCTION_ITEM':
        s.induction.stage = 'draft';
        s.induction.hiddenIds[action.id] = !s.induction.hiddenIds[action.id];
        s.induction.draftIds[action.id] = true;
        break;
      case 'ADD_INDUCTION_CANDIDATE':
        s.induction.stage = 'draft';
        s.induction.addedIds[action.id] = true;
        s.induction.draftIds[action.id] = true;
        break;
      case 'SUBMIT_INDUCTION_HSSE':
        s.induction.stage = 'review';
        break;
      case 'APPROVE_INDUCTION':
        s.induction.stage = 'published';
        s.induction.rev += 1;
        s.induction.pubAt = s.phase === 'recovery' ? '14.40' : '13.59';
        s.induction.draftIds = {};
        if (s.induction.rereadRequired) {
          s.induction.rereadAcked = false;
        }
        break;
      case 'TOGGLE_REREAD':
        s.induction.rereadRequired = !s.induction.rereadRequired;
        break;
      case 'ACK_REREAD':
        s.induction.rereadAcked = true;
        s.mobile.toast = `Revisi ${s.induction.rev} info darurat telah dibaca`;
        s.mobile.toastLeft = 5;
        break;
      case 'KIOSK_SET':
        Object.assign(s.kiosk, action.patch);
        break;
      case 'KIOSK_CHECKIN': {
        const name = (action.name || s.kiosk.name || 'Pekerja Gate').trim();
        const role = action.role || s.kiosk.role || 'TKBM';
        const cardId = (action.cardId || s.kiosk.cardId || `G-${100 + s.workers.length}`).trim();
        const passengers = Math.max(0, Math.min(4, Number(action.passengers !== undefined ? action.passengers : s.kiosk.passengers) || 0));
        const group = role.indexOf('Sopir') >= 0 ? 'Sopir' : (role.indexOf('Tamu') >= 0 || role.indexOf('ABK') >= 0 ? 'Tamu' : 'TKBM');
        const id = `kiosk-${Date.now()}-${s.workers.length}`;
        const newEntry = {
          id,
          name,
          role,
          group,
          zone: 'Gate 3',
          x: 11 + (s.workers.length % 5) * 2.2,
          y: 83 + (s.workers.length % 3) * 2.5,
          locPerm: 'none',
          hasApp: false,
          heartbeatLost: false,
          indStatus: 'pos_gate',
          indTime: '14.00',
          arrive: 9999,
          cardId,
          borrowedApd: !!(action.borrowedApd !== undefined ? action.borrowedApd : s.kiosk.borrowedApd),
          why: `Di pos gate (${cardId}) · tanpa aplikasi`
        };
        s.workers.push(newEntry);
        for (let p = 1; p <= passengers; p++) {
          s.workers.push({
            id: `${id}-p${p}`,
            name: `Penumpang ${p} · ${cardId}`,
            role: `Pendamping ${role}`,
            group,
            zone: 'Gate 3',
            x: 12 + p * 2,
            y: 85,
            locPerm: 'none',
            hasApp: false,
            heartbeatLost: false,
            indStatus: 'pos_gate',
            indTime: '14.00',
            arrive: 9999,
            cardId,
            why: `Penumpang kendaraan ${cardId} · tanpa aplikasi`
          });
        }
        s.kiosk.lastCheckin = { name, role, cardId, passengers, borrowedApd: newEntry.borrowedApd, time: '14.00 WIB' };
        s.kiosk.step = 4;
        break;
      }
      case 'KIOSK_RESET_FLOW':
        s.kiosk.step = 1;
        s.kiosk.name = '';
        s.kiosk.cardId = '';
        s.kiosk.passengers = 0;
        s.kiosk.phone = '';
        s.kiosk.understood = false;
        s.kiosk.apdHelm = true;
        s.kiosk.apdVest = true;
        s.kiosk.apdShoes = true;
        s.kiosk.borrowedApd = false;
        break;
      case 'MARSHAL_SET_POINT':
        s.marshal.selectedPoint = action.pointId;
        break;
      case 'MARSHAL_SET_FILTER':
        s.marshal.filter = action.filter;
        break;
      case 'MARSHAL_TOGGLE_BULK':
        s.marshal.bulkSelected[action.workerId] = !s.marshal.bulkSelected[action.workerId];
        break;
      case 'MARSHAL_SET_OFFLINE':
        s.marshal.offline = !!action.offline;
        if (!s.marshal.offline && s.marshal.pendingQueue.length > 0) {
          s.marshal.pendingQueue.forEach((item) => {
            s.marshal.overrides[item.workerId] = {
              status: item.status,
              pointId: item.pointId,
              byMarshal: true,
              time: item.time
            };
          });
          s.marshal.pendingQueue = [];
        }
        break;
      case 'MARSHAL_MARK_SAFE':
      case 'MARSHAL_OVERRIDE_UNCONFIRMED':
      case 'MARSHAL_MARK_SOS': {
        const status = action.type === 'MARSHAL_MARK_SAFE'
          ? 'Aman'
          : (action.type === 'MARSHAL_MARK_SOS' ? 'Butuh bantuan' : 'Belum terkonfirmasi');
        const pointId = action.pointId || s.marshal.selectedPoint || 'gedung-b';
        const rec = { workerId: action.workerId, status, pointId, byMarshal: true, time: '14.05' };
        if (s.marshal.offline) {
          s.marshal.pendingQueue = s.marshal.pendingQueue.filter((q) => q.workerId !== action.workerId).concat([rec]);
        } else {
          s.marshal.overrides[action.workerId] = rec;
        }
        break;
      }
      case 'MARSHAL_BULK_SAFE': {
        const ids = Object.keys(s.marshal.bulkSelected).filter((id) => s.marshal.bulkSelected[id]);
        const pointId = action.pointId || s.marshal.selectedPoint || 'gedung-b';
        ids.forEach((id) => {
          const rec = { workerId: id, status: 'Aman', pointId, byMarshal: true, time: '14.05' };
          if (s.marshal.offline) {
            s.marshal.pendingQueue = s.marshal.pendingQueue.filter((q) => q.workerId !== id).concat([rec]);
          } else {
            s.marshal.overrides[id] = rec;
          }
        });
        s.marshal.bulkSelected = {};
        break;
      }
      default:
        break;
    }
    this._notify(true);
  };

  NS.Store = Store;
  NS.getWorkerRows = getWorkerRows;
  NS.getEquipmentRows = getEquipmentRows;
  NS.getAlarmQueue = getAlarmQueue;
  NS.getEvacDestination = getEvacDestination;
  NS.getActiveRoute = getActiveRoute;
  NS.getComplianceStats = getComplianceStats;
  NS.getHotspots = getHotspots;
  NS.isWorkerInEvacZone = isWorkerInEvacZone;
  NS.countSafeAtPoint = countSafeAtPoint;
})(typeof window !== 'undefined' ? window : globalThis);
