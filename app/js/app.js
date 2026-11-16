(function (root) {
  'use strict';

  const NS = (root.JARAK_AMAN = root.JARAK_AMAN || {});
  NS.Views = NS.Views || {};

  let activeView = 'split';
  let themeOverridden = false;
  let toastTimer = null;

  function parseQueryView() {
    try {
      const params = new URLSearchParams(root.location.search || '');
      const v = params.get('view');
      if (v && ['split', 'mobile', 'control', 'kiosk', 'marshal'].includes(v)) {
        return v;
      }
    } catch (_) {}
    return root.innerWidth && root.innerWidth < 1100 ? 'mobile' : 'split';
  }

  function applyTheme(theme) {
    const t = theme === 'light' ? 'light' : 'dark';
    document.documentElement.dataset.theme = t;
    const btn = document.getElementById('btn-theme-toggle');
    if (btn) btn.textContent = t === 'dark' ? 'Tema: Gelap' : 'Tema: Terang';
  }

  function showToast(msg) {
    const el = document.getElementById('global-toast');
    if (!el) return;
    el.textContent = msg;
    el.hidden = false;
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.hidden = true;
    }, 4000);
  }

  function renderAll(store) {
    const state = store.getState();
    const views = NS.Views;

    const pill = document.getElementById('shell-phase-pill');
    if (pill) {
      pill.className = 'shell-phase-pill' + (state.phase === 'evac' ? ' is-evac' : (state.phase === 'recovery' ? ' is-recovery' : ''));
      pill.textContent = state.phase === 'evac'
        ? (state.evacDrill ? 'LATIHAN · EVAKUASI' : 'EVAKUASI AKTIF')
        : (state.phase === 'recovery' ? 'PEMULIHAN' : 'NORMAL');
    }

    const fastBtn = document.getElementById('btn-fast-toggle');
    if (fastBtn) {
      fastBtn.classList.toggle('active', !!state.fast);
      fastBtn.textContent = state.fast ? 'Timer ×10' : 'Timer ×1';
    }

    const mMobile = document.getElementById('mount-mobile');
    const mControl = document.getElementById('mount-control');
    const mKiosk = document.getElementById('mount-kiosk');
    const mMarshal = document.getElementById('mount-marshal');

    if (mMobile && !mMobile.hidden && typeof views.renderMobile === 'function') {
      views.renderMobile(mMobile, state, store);
    }
    if (mControl && !mControl.hidden && typeof views.renderControl === 'function') {
      views.renderControl(mControl, state, store);
    }
    if (mKiosk && !mKiosk.hidden && typeof views.renderKiosk === 'function') {
      views.renderKiosk(mKiosk, state, store);
    }
    if (mMarshal && !mMarshal.hidden && typeof views.renderMarshal === 'function') {
      views.renderMarshal(mMarshal, state, store);
    }
  }

  function setView(viewId, store) {
    activeView = ['split', 'mobile', 'control', 'kiosk', 'marshal'].includes(viewId) ? viewId : 'split';
    const rootEl = document.getElementById('workspace-root');
    if (rootEl) {
      rootEl.className = `workspace-root mode-${activeView}`;
    }

    const showMap = {
      mobile: activeView === 'split' || activeView === 'mobile',
      control: activeView === 'split' || activeView === 'control',
      kiosk: activeView === 'kiosk',
      marshal: activeView === 'marshal'
    };

    Object.keys(showMap).forEach((k) => {
      const el = document.getElementById(`mount-${k}`);
      if (el) el.hidden = !showMap[k];
    });

    document.querySelectorAll('[data-view-btn]').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-view-btn') === activeView);
    });

    if (!themeOverridden) {
      const narrow = root.innerWidth && root.innerWidth < 768;
      applyTheme(narrow || activeView === 'mobile' || activeView === 'kiosk' ? 'light' : 'dark');
    }

    if (store) renderAll(store);
  }

  function initApp() {
    if (!NS.Store) return;
    const store = new NS.Store();
    NS.storeInstance = store;

    document.querySelectorAll('[data-view-btn]').forEach((btn) => {
      btn.addEventListener('click', () => setView(btn.getAttribute('data-view-btn'), store));
    });

    const themeBtn = document.getElementById('btn-theme-toggle');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        themeOverridden = true;
        const cur = document.documentElement.dataset.theme;
        applyTheme(cur === 'dark' ? 'light' : 'dark');
      });
    }

    const fastBtn = document.getElementById('btn-fast-toggle');
    if (fastBtn) {
      fastBtn.addEventListener('click', () => store.dispatch({ type: 'TOGGLE_FAST' }));
    }

    const resetBtn = document.getElementById('btn-demo-reset');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        store.reset();
        showToast('Demo direset ke kondisi awal (Data contoh Tanjung Priok)');
      });
    }

    store.subscribe(() => renderAll(store));
    setView(parseQueryView(), store);

    setInterval(() => store.tick(), 1000);
  }

  NS.App = { initApp, setView, applyTheme, showToast };
  document.addEventListener('DOMContentLoaded', initApp);
})(window);
