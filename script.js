function toggle(el) {
    el.classList.toggle('expanded');
    const body = el.querySelector('.phase-body');
    body.classList.toggle('open');
  }
  window.addEventListener('load', () => {
    const first = document.querySelector('.phase-inner');
    if (first) setTimeout(() => {
      first.classList.add('expanded');
      first.querySelector('.phase-body').classList.add('open');
    }, 1200);
  });