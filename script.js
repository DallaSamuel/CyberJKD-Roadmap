function setExpanded(phaseInner, isExpanded) {
  const body = phaseInner.querySelector('.phase-body');
  const header = phaseInner.querySelector('.phase-header');
  phaseInner.classList.toggle('expanded', isExpanded);
  body.classList.toggle('open', isExpanded);
  if (header) header.setAttribute('aria-expanded', String(isExpanded));
}

function toggleResumeMenu(event) {
  event.stopPropagation();
  const menu = document.getElementById('resumeMenu');
  const btn = document.getElementById('resumeMenuButton');
  const isOpen = menu.classList.toggle('open');
  btn.setAttribute('aria-expanded', String(isOpen));
}

document.addEventListener('click', (e) => {
  const menu = document.getElementById('resumeMenu');
  const btn = document.getElementById('resumeMenuButton');
  if (!menu || !menu.classList.contains('open')) return;
  if (!menu.contains(e.target) && e.target !== btn) {
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
  }
});

// Auto-calculated progress badges — counts actual .op-row.done elements
// per phase instead of relying on a manually typed "X / Y DONE" string,
// so the count can never drift out of sync with the real project rows again.
function updateProgressCounts() {
  document.querySelectorAll('.phase-inner').forEach(phase => {
    const rows = phase.querySelectorAll('.ops-grid .op-row');
    if (!rows.length) return;
    const total = rows.length;
    const done = Array.from(rows).filter(r => r.classList.contains('done')).length;
    const badge = phase.querySelector('.phase-progress');
    if (!badge) return;
    badge.textContent = `${done} / ${total} DONE`;
    badge.classList.toggle('wip', done < total);
  });
}

updateProgressCounts();

// Fill the mission-status counters from the real rows (drift-proof).
function fillStats() {
  const rows = [...document.querySelectorAll('.op-row')];
  const gh = rows.filter(r => r.querySelector('a.done-badge[href*="github.com"]'));
  const complete = gh.filter(r => r.classList.contains('done')).length;
  const c = document.getElementById('statComplete');
  const d = document.getElementById('statDocumented');
  if (c) c.textContent = complete;
  if (d) d.textContent = gh.length;
}
fillStats();

// Honest per-phase progress strip — fills each segment by real completion.
function fillStrip() {
  const segs = document.querySelectorAll('#progressStrip .strip-seg');
  const legend = document.querySelectorAll('#stripLegend span');
  document.querySelectorAll('.phase-inner').forEach((ph, i) => {
    const rows = ph.querySelectorAll('.ops-grid .op-row');
    const total = rows.length || 1;
    const done = Array.from(rows).filter(r => r.classList.contains('done')).length;
    const pct = Math.round((done / total) * 100);
    const bar = segs[i] && segs[i].querySelector('i');
    if (bar) bar.style.width = pct + '%';
    if (legend[i]) legend[i].textContent = 'P0' + (i + 1) + ' ' + pct + '%';
  });
}
setTimeout(fillStrip, 120);

// Filter labs by status across every phase.
function filterOps(mode) {
  document.querySelectorAll('.filter-chip').forEach(b => b.classList.toggle('active', b.dataset.f === mode));
  const match = (r) =>
    mode === 'all'  ? true :
    mode === 'done' ? r.classList.contains('done') :
    mode === 'wip'  ? r.classList.contains('wip')  :
    (!r.classList.contains('done') && !r.classList.contains('wip'));
  document.querySelectorAll('.phase-inner').forEach(ph => {
    let any = false;
    ph.querySelectorAll('.op-row').forEach(r => {
      const show = match(r);
      r.style.display = show ? '' : 'none';
      if (show) any = true;
    });
    if (mode === 'all') {
      ph.style.display = '';
    } else {
      ph.style.display = any ? '' : 'none';
      setExpanded(ph, any);
    }
  });
}

// Scroll-driven UI: active phase chip (deterministic) + back-to-top.
const navChips = {};
document.querySelectorAll('.phase-nav-chip').forEach(c => {
  navChips[c.getAttribute('href').replace('#', '')] = c;
});
function updateActiveChip() {
  // The active phase is the last one whose top has scrolled above the nav line.
  let current = null;
  document.querySelectorAll('.phase-inner').forEach(p => {
    if (p.getBoundingClientRect().top - 90 <= 0) current = p.id;
  });
  Object.keys(navChips).forEach(id => navChips[id].classList.toggle('active', id === current));
}
function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function onScroll() {
  const btn = document.getElementById('backToTop');
  if (btn) btn.classList.toggle('show', window.scrollY > 600);
  updateActiveChip();
}
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('load', updateActiveChip);

function toggle(el) {
  const isExpanded = !el.classList.contains('expanded');
  setExpanded(el, isExpanded);
  saveState();
}

// Phase quick-nav: open the target phase, remember it, then scroll to it.
function jumpTo(event, id) {
  if (event) event.preventDefault();
  const target = document.getElementById(id);
  if (!target) return;
  setExpanded(target, true);
  saveState();
  setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 40);
  if (history.replaceState) history.replaceState(null, '', '#' + id);
}

function expandAll() {
  document.querySelectorAll('.phase-inner').forEach(p => setExpanded(p, true));
  saveState();
}

function collapseAll() {
  document.querySelectorAll('.phase-inner').forEach(p => setExpanded(p, false));
  saveState();
}

// State is keyed by each phase's stable data-phase id (e.g. "01"),
// not by array position — so inserting/reordering phases later
// can't desync a returning visitor's saved open/closed state.
function saveState() {
  const phases = document.querySelectorAll('.phase-inner');
  const state = {};
  phases.forEach(p => {
    const key = p.dataset.phase;
    if (key) state[key] = p.classList.contains('expanded');
  });
  localStorage.setItem('phaseState', JSON.stringify(state));
}

function applyDeepLink() {
  // Supports links like index.html#phase-03 to open and scroll to a specific phase.
  const hash = window.location.hash.replace('#', '');
  const match = hash.match(/^phase-(\d+)$/);
  if (!match) return false;

  const target = document.getElementById(`phase-${match[1]}`);
  if (!target) return false;

  setExpanded(target, true);
  setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  return true;
}

function restoreState() {
  const phases = document.querySelectorAll('.phase-inner');
  const saved = localStorage.getItem('phaseState');
  const hasDeepLink = /^phase-\d+$/.test(window.location.hash.replace('#', ''));

  if (saved) {
    let state;
    try {
      state = JSON.parse(saved);
    } catch (e) {
      state = null;
    }
    if (state && typeof state === 'object' && !Array.isArray(state)) {
      // Returning visitor — restore exactly how they left it, phase by phase.
      phases.forEach(p => {
        const key = p.dataset.phase;
        setExpanded(p, !!(key && state[key]));
      });
    } else if (Array.isArray(state)) {
      // Legacy positional format from an earlier version — migrate it once,
      // matched by position, then re-save keyed by phase id going forward.
      phases.forEach((p, i) => {
        setExpanded(p, !!state[i]);
      });
      saveState();
    }
  } else if (!hasDeepLink) {
    // First-ever visit, no saved state, no direct link — Phase 01 open only.
    if (phases[0]) {
      setTimeout(() => {
        setExpanded(phases[0], true);
        saveState();
      }, 800);
    }
  }

  // A direct link to a specific phase overrides the saved/default state.
  applyDeepLink();
}

window.addEventListener('load', restoreState);
