const test = require('node:test');
const assert = require('node:assert/strict');

global.window = {};
require('../app/js/data.js');
require('../app/js/store.js');

const { Store, getWorkerRows, getEvacDestination, getAlarmQueue, getActiveRoute, getComplianceStats, getHotspots } = global.window.JARAK_AMAN;

test('zone-scoped evacuation only evacuates Dermaga A and B workers', () => {
  const store = new Store();
  store.dispatch({ type: 'START_EVAC', hazard: 'tsunami', zone: 'dermaga', basis: 'bmkg', drill: false });
  const rows = getWorkerRows(store.getState());
  const andi = rows.find((r) => r.name === 'Andi'); // Dermaga A
  const joko = rows.find((r) => r.name === 'Joko'); // Lapangan C
  assert.equal(andi.inEvacZone, true);
  assert.equal(joko.inEvacZone, false);
  assert.equal(joko.status, 'Aktif');
});

test('gempa routes to area-timur and overflow >= 40 at gedung-b routes to area-timur', () => {
  const store = new Store();
  store.dispatch({ type: 'START_EVAC', hazard: 'gempa', zone: 'all', basis: 'lapangan', drill: false });
  assert.equal(getEvacDestination(store.getState()).id, 'area-timur');

  store.reset();
  for (let i = 0; i < 20; i++) {
    store.dispatch({ type: 'KIOSK_CHECKIN', name: `TKBM-${i}`, role: 'TKBM', cardId: `K-${i}`, passengers: 1, borrowedApd: false });
  }
  store.dispatch({ type: 'START_EVAC', hazard: 'tsunami', zone: 'all', basis: 'bmkg', drill: false });
  store.dispatch({ type: 'TOGGLE_FAST', fast: true });
  for (let t = 0; t < 35; t++) store.tick();
  store.getState().workers.filter((w) => !w.hasApp).forEach((w) => {
    store.dispatch({ type: 'MARSHAL_MARK_SAFE', workerId: w.id, pointId: 'gedung-b' });
  });
  const dest = getEvacDestination(store.getState());
  assert.equal(dest.id, 'area-timur');
  assert.equal(dest.overflowed, true);
});

test('kiosk check-in with passengers spawns linked rows and increments gate headcount', () => {
  const store = new Store();
  const before = store.getState().workers.length;
  store.dispatch({ type: 'KIOSK_CHECKIN', name: 'Slamet', role: 'Sopir truk', cardId: 'STID-9981', passengers: 2, borrowedApd: true });
  const workers = store.getState().workers;
  assert.equal(workers.length, before + 3);
  assert.equal(workers.some((w) => w.name === 'Penumpang 1 · STID-9981' && w.indStatus === 'pos_gate'), true);
});

test('non-linear mobile scenario jumps reset stale evac flags while preserving kiosk workers', () => {
  const store = new Store();
  store.dispatch({ type: 'KIOSK_CHECKIN', name: 'Bambang', role: 'TKBM', cardId: 'T-77', passengers: 0, borrowedApd: false });
  store.dispatch({ type: 'JUMP_SCENARIO', key: 'bmkg' });
  store.dispatch({ type: 'TOGGLE_WRONG_WAY' });
  assert.equal(store.getState().mobile.wrong, true);
  store.dispatch({ type: 'JUMP_SCENARIO', key: 'apdfail' });
  assert.equal(store.getState().phase, 'normal');
  assert.equal(store.getState().mobile.wrong, false);
  assert.equal(store.getState().workers.some((w) => w.name === 'Bambang'), true);
});

test('marshal offline mode queues confirmations and flushes to control room when online', () => {
  const store = new Store();
  store.dispatch({ type: 'START_EVAC', hazard: 'tsunami', zone: 'all', basis: 'bmkg', drill: false });
  store.dispatch({ type: 'MARSHAL_SET_OFFLINE', offline: true });
  store.dispatch({ type: 'MARSHAL_MARK_SAFE', workerId: 'Oki', pointId: 'gedung-b' });
  assert.equal(store.getState().marshal.pendingQueue.length, 1);
  assert.notEqual(getWorkerRows(store.getState()).find((r) => r.name === 'Oki').status, 'Aman');
  store.dispatch({ type: 'MARSHAL_SET_OFFLINE', offline: false });
  assert.equal(store.getState().marshal.pendingQueue.length, 0);
  assert.equal(getWorkerRows(store.getState()).find((r) => r.name === 'Oki').status, 'Aman');
});

test('mobile near-miss report pushes live alarm, induction draft candidate, and increments hotspot', () => {
  const store = new Store();
  const baseCount = getHotspots(store.getState()).find((h) => h.id === 'hs-lapangan-c').count;
  store.dispatch({ type: 'SUBMIT_REPORT', category: 'nm', hasPhoto: true, anonymous: false, note: 'Nyaris terserempet di Lajur 4' });
  const alarms = getAlarmQueue(store.getState());
  assert.equal(alarms.some((a) => a.title.includes('Nyaris terserempet') || a.id.startsWith('live-nm')), true);
  assert.equal(store.getState().induction.candidates.some((c) => c.fromMobile === true), true);
  assert.equal(getHotspots(store.getState()).find((h) => h.id === 'hs-lapangan-c').count, baseCount + 1);
});

test('closed road switches tsunami route to backup route and BroadcastChannel error on file:// is safely ignored', () => {
  global.BroadcastChannel = function () { throw new Error('SecurityError'); };
  const store = new Store();
  store.dispatch({ type: 'START_EVAC', hazard: 'tsunami', zone: 'all', basis: 'bmkg', drill: false });
  const normalRoute = getActiveRoute(store.getState());
  store.dispatch({ type: 'TOGGLE_ROUTE_CLOSED' });
  const backupRoute = getActiveRoute(store.getState());
  assert.notEqual(normalRoute.id, backupRoute.id);
  assert.equal(backupRoute.isBackup, true);
  assert.ok(getComplianceStats(store.getState()).groups.length >= 4);
  delete global.BroadcastChannel;
});

test('countSafeAtPoint tracks gedung-b capacity separately when counting area-timur overflow', () => {
  const store = new Store();
  // Add 25 GPS-tracked workers who auto-arrive at t=30s
  for (let i = 0; i < 25; i++) {
    store.getState().workers.push({
      id: `gps-${i}`, name: `GPS-${i}`, role: 'TKBM', group: 'TKBM', zone: 'Lapangan C',
      x: 30, y: 50, locPerm: 'always', hasApp: true, heartbeatLost: false, indStatus: 'done', indTime: '07.15', arrive: 30
    });
  }
  store.dispatch({ type: 'START_EVAC', hazard: 'tsunami', zone: 'all', basis: 'bmkg', drill: false });
  store.dispatch({ type: 'TOGGLE_FAST', fast: true });
  for (let t = 0; t < 35; t++) store.tick();
  const s = store.getState();
  assert.equal(global.window.JARAK_AMAN.countSafeAtPoint(s, 'gedung-b'), 40);
  assert.ok(global.window.JARAK_AMAN.countSafeAtPoint(s, 'area-timur') > 0);
});

test('JUMP_SCENARIO clears stale timedOut flag from expired evacuation', () => {
  const store = new Store();
  store.dispatch({ type: 'START_EVAC', hazard: 'tsunami', zone: 'all', basis: 'bmkg', drill: false });
  store.dispatch({ type: 'TOGGLE_FAST', fast: true });
  for (let t = 0; t < 35; t++) store.tick();
  assert.equal(store.getState().timedOut, true);
  store.dispatch({ type: 'JUMP_SCENARIO', key: 'enter' });
  assert.equal(store.getState().timedOut, false);
});
