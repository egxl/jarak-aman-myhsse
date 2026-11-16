(function (root) {
  'use strict';
  const NS = (root.JARAK_AMAN = root.JARAK_AMAN || {});
  NS.Views = NS.Views || {};
  NS.Views.renderKiosk = function (el) { el.innerHTML = '<div class="card">Kiosk Gate (loading...)</div>'; };
})(window);
