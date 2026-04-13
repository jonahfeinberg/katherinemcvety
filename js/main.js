// Shared: email copy, lightbox, scroll shadow, keyboard nav.

// --- scroll shadow on nav ---
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('scrolled', window.scrollY > 4);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
});


// --- email ---

function copyEmail() {
  const email = 'kmcvety@gmail.com';

  const copy = () => {
    const ta = document.createElement('textarea');
    ta.value = email;
    ta.style.cssText = 'position:fixed;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); } catch (e) {}
    document.body.removeChild(ta);
  };

  if (navigator.clipboard) {
    navigator.clipboard.writeText(email).catch(copy);
  } else {
    copy();
  }

  const msg = document.getElementById('copyConfirmNav');
  if (msg) {
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 2200);
  }
}


// --- lightbox (home page only) ---

let _images = [];
let _index  = 0;

function openLightbox(src, label, images) {
  _images = images || [];
  _index  = Math.max(0, _images.findIndex(i => i.src === src));

  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxCaption').textContent = label || '';

  const lb = document.getElementById('lightbox');
  lb.classList.add('open');
  requestAnimationFrame(() => lb.classList.add('visible'));
  document.body.style.overflow = 'hidden';

  const showArrows = _images.length > 1;
  document.getElementById('lightboxPrev').style.display = showArrows ? '' : 'none';
  document.getElementById('lightboxNext').style.display = showArrows ? '' : 'none';
}

function closeLightbox() {
  const lb = document.getElementById('lightbox');
  if (!lb) return;
  lb.classList.remove('visible');
  setTimeout(() => {
    lb.classList.remove('open');
    document.getElementById('lightboxImg').src = '';
    document.getElementById('lightboxCaption').textContent = '';
  }, 350);
  document.body.style.overflow = '';
}

function lightboxPrev() {
  if (_images.length < 2) return;
  _index = (_index - 1 + _images.length) % _images.length;
  const { src, label } = _images[_index];
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxCaption').textContent = label || '';
}

function lightboxNext() {
  if (_images.length < 2) return;
  _index = (_index + 1) % _images.length;
  const { src, label } = _images[_index];
  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxCaption').textContent = label || '';
}

document.addEventListener('DOMContentLoaded', () => {
  const lb = document.getElementById('lightbox');
  if (lb) {
    lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
    document.getElementById('lightboxClose')?.addEventListener('click', closeLightbox);
    document.getElementById('lightboxPrev')?.addEventListener('click', lightboxPrev);
    document.getElementById('lightboxNext')?.addEventListener('click', lightboxNext);
  }
});

document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox')?.classList.contains('open')) {
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowLeft')  lightboxPrev();
    if (e.key === 'ArrowRight') lightboxNext();
  }
});

window.lightboxIsOpen = () =>
  document.getElementById('lightbox')?.classList.contains('open') ?? false;
