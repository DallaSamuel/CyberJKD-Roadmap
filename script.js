function toggle(el) {
  el.classList.toggle('expanded');
  const body = el.querySelector('.phase-body');
  body.classList.toggle('open');
  saveState();
}

function saveState() {
  const phases = document.querySelectorAll('.phase-inner');
  const state = Array.from(phases).map(p => p.classList.contains('expanded'));
  localStorage.setItem('phaseState', JSON.stringify(state));
}

function restoreState() {
  const saved = localStorage.getItem('phaseState');
  const phases = document.querySelectorAll('.phase-inner');

  if (saved) {
    const state = JSON.parse(saved);
    phases.forEach((p, i) => {
      if (state[i]) {
        p.classList.add('expanded');
        p.querySelector('.phase-body').classList.add('open');
      }
    });
  } else {
    // Default — Phase 01 open only
    if (phases[0]) {
      setTimeout(() => {
        phases[0].classList.add('expanded');
        phases[0].querySelector('.phase-body').classList.add('open');
        saveState();
      }, 800);
    }
  }
}

window.addEventListener('load', restoreState);
