/**
 * Info tooltip (StatsMath PRO)
 * A single floating tooltip appended to <body>, so no card or container
 * can clip or cover it. Shows on hover / keyboard focus; click or tap pins it.
 * The formula text comes from data-formula (authored in index.html) and may contain HTML.
 */
(function () {
  'use strict';

  const GAP = 10;   // distance between icon and tooltip
  const EDGE = 8;   // minimum distance from viewport edges

  let tip = null;
  let current = null; // icon the tooltip currently belongs to
  let pinned = null;  // icon pinned by click / tap

  function ensureTip() {
    if (tip) return tip;
    tip = document.createElement('div');
    tip.className = 'info-floating';
    tip.setAttribute('role', 'tooltip');
    tip.setAttribute('aria-hidden', 'true');
    document.body.appendChild(tip);
    return tip;
  }

  function closestIcon(target) {
    return target && target.closest ? target.closest('.info-icon') : null;
  }

  function position(icon) {
    const t = ensureTip();
    const r = icon.getBoundingClientRect();
    const vw = document.documentElement.clientWidth || window.innerWidth;
    const vh = window.innerHeight;

    t.style.left = '0px';
    t.style.top = '0px';
    const tw = t.offsetWidth;
    const th = t.offsetHeight;

    let left = r.left + r.width / 2 - tw / 2;
    left = Math.max(EDGE, Math.min(left, vw - tw - EDGE));

    let top = r.top - th - GAP;           // prefer above the icon
    if (top < EDGE) top = r.bottom + GAP; // no room above: go below
    top = Math.min(top, vh - th - EDGE);

    t.style.left = left + 'px';
    t.style.top = top + 'px';
  }

  function show(icon) {
    const t = ensureTip();
    current = icon;
    t.innerHTML = icon.getAttribute('data-formula') || '';
    t.classList.add('visible');
    t.setAttribute('aria-hidden', 'false');
    position(icon);
  }

  function hide() {
    current = null;
    if (!tip) return;
    tip.classList.remove('visible');
    tip.setAttribute('aria-hidden', 'true');
  }

  // Hover (mouse) and touch preview
  document.addEventListener('pointerover', (e) => {
    const icon = closestIcon(e.target);
    if (icon && !pinned) show(icon);
  });

  document.addEventListener('pointerout', (e) => {
    const icon = closestIcon(e.target);
    if (icon && !pinned) hide();
  });

  // Keyboard focus
  document.addEventListener('focusin', (e) => {
    const icon = closestIcon(e.target);
    if (icon) show(icon);
  });

  document.addEventListener('focusout', (e) => {
    const icon = closestIcon(e.target);
    if (icon && !pinned) hide();
  });

  // Click / tap pins or unpins; tapping anywhere else unpins
  document.addEventListener('click', (e) => {
    const icon = closestIcon(e.target);
    if (icon) {
      if (pinned === icon) {
        pinned = null;
        hide();
      } else {
        pinned = icon;
        show(icon);
      }
    } else if (pinned) {
      pinned = null;
      hide();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      pinned = null;
      hide();
    }
  });

  // Follow the icon while scrolling or resizing
  function follow() {
    if (current) position(current);
  }
  window.addEventListener('scroll', follow, { passive: true, capture: true });
  window.addEventListener('resize', follow);
})();
