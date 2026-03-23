// Shared across all pages: email copy, lightbox, keyboard nav.

// --- email ---

function copyEmail() {
  const email = 'kmcvety@gmail.com';

  // try modern clipboard API first, fall back to execCommand
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

  const msg = document.getElementById('copyConfirm');
  if (msg) {
    msg.classList.add('show');
    setTimeout(() => msg.classList.remove('show'), 2200);
  }
}


// --- lightbox ---

let _images = []; // list of { src, label } for the current portfolio
let _index  = 0;

function openLightbox(src, label, images) {
  _images = images || [];
  _index  = Math.max(0, _images.findIndex(i => i.src === src));

  document.getElementById('lightboxImg').src = src;
  document.getElementById('lightboxCaption').textContent = label || '';
  document.getElementById('lightbox').classList.add('open');
  document.body.style.overflow = 'hidden';

  // hide arrows if there's nothing to navigate to
  const showArrows = _images.length > 1;
  document.getElementById('lightboxPrev').style.display = showArrows ? '' : 'none';
  document.getElementById('lightboxNext').style.display = showArrows ? '' : 'none';
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('open');
  document.getElementById('lightboxImg').src = '';
  document.getElementById('lightboxCaption').textContent = '';
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

// wire up lightbox buttons once the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const lb = document.getElementById('lightbox');
  if (!lb) return;

  lb.addEventListener('click', e => { if (e.target === lb) closeLightbox(); });
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', lightboxPrev);
  document.getElementById('lightboxNext').addEventListener('click', lightboxNext);
});

// keyboard: escape to close, arrows to navigate
document.addEventListener('keydown', e => {
  if (!document.getElementById('lightbox')?.classList.contains('open')) return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  lightboxPrev();
  if (e.key === 'ArrowRight') lightboxNext();
});

// used by slideshow.js to pause switching while lightbox is open
window.lightboxIsOpen = () =>
  document.getElementById('lightbox')?.classList.contains('open') ?? false;
