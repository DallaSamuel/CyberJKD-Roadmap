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

function toggle(el) {
  const isExpanded = !el.classList.contains('expanded');
  setExpanded(el, isExpanded);
  saveState();
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
      phases.forEach(p => {
        const key = p.dataset.phase;
        if (key && state[key]) setExpanded(p, true);
      });
    } else if (Array.isArray(state)) {
      // Legacy positional format from an earlier version — migrate it once,
      // matched by position, then re-save keyed by phase id going forward.
      phases.forEach((p, i) => {
        if (state[i]) setExpanded(p, true);
      });
      saveState();
    }
  } else if (!hasDeepLink) {
    // Default (first-ever visit, no direct link to a phase) — Phase 01 open only
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
