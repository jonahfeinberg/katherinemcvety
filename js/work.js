// Reads manifest.json and builds the work page with cover thumbnails.
// Clicking a thumbnail opens the full slideshow overlay with crossfade.

(async function () {
  const container = document.getElementById('workContainer');

  let manifest;
  try {
    const res = await fetch('../media/manifest.json');
    if (!res.ok) throw new Error();
    manifest = await res.json();
  } catch {
    container.innerHTML = '<p class="load-msg">No portfolios found.</p>';
    return;
  }

  if (!manifest.portfolios?.length) {
    container.innerHTML = '<p class="load-msg">No portfolios listed in manifest.json.</p>';
    return;
  }

  container.innerHTML = '';

  const grid = document.createElement('div');
  grid.className = 'work-grid';

  for (const [pi, portfolio] of manifest.portfolios.entries()) {
    const tnEntry = portfolio.images.find(i => i.thumbnail);
    const tnFile  = tnEntry ? tnEntry.thumbnail : null;
    const tnSrc   = tnFile
      ? '../media/' + portfolio.folder + '/' + encodeURIComponent(tnFile)
      : null;

    function cleanLabel(filename) {
      return filename
        .replace(/\.[^/.]+$/, '')       // strip extension
        .replace(/^\d+\./, '')          // strip leading number prefix e.g. 1.
        .replace(/^(TH_|TN_|T_)/i, '') // strip leading TH_ TN_ T_
        .replace(/[_#]+\d+\w*$/, '')   // strip trailing #1 _2 #_5 etc
        .replace(/[_#]+$/, '')          // strip any remaining trailing _ or #
        .replace("_", ' ')
        .trim();
    }

    const slideImages = portfolio.images
      .filter(i => i.image)
      .map(i => ({
        src:       '../media/' + portfolio.folder + '/' + encodeURIComponent(i.image),
        thumbnail: '../Thumbnails/' + encodeURIComponent(i.image),
        label:     cleanLabel(i.image)
      }));

    const card = document.createElement('div');
    card.className = 'work-card';

    // Stagger entrance
    card.style.animationDelay = (pi * 0.08) + 's';

    const titleRow = document.createElement('div');
    titleRow.className = 'work-card-title-row';

    const name = document.createElement('span');
    name.className = 'work-card-name';
    name.textContent = portfolio.name;

    const infoBtn = document.createElement('button');
    infoBtn.className = 'work-info-btn';
    infoBtn.setAttribute('aria-label', 'Portfolio description');
    infoBtn.innerHTML = '<svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" width="12" height="12"><circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.2"/><line x1="8" y1="7" x2="8" y2="11.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><circle cx="8" cy="4.75" r="0.75" fill="currentColor"/></svg>';

    const desc = document.createElement('p');
    desc.className = 'work-card-desc';
    desc.textContent = portfolio.description || '';

    titleRow.appendChild(name);
    card.appendChild(titleRow);

    /* info button + description — disabled for now
    infoBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = desc.classList.toggle('open');
      infoBtn.classList.toggle('active', isOpen);
    });

    if (portfolio.description) titleRow.appendChild(infoBtn);
    if (portfolio.description) card.appendChild(desc);
    */

    const thumb = document.createElement('div');
    thumb.className = 'work-thumb';

    if (tnSrc) {
      const img = document.createElement('img');
      img.src     = tnSrc;
      img.alt     = portfolio.name;
      img.onload  = () => thumb.classList.add('loaded');
      img.onerror = () => {
        // Thumbnail file missing — fall back to the first slide image
        if (slideImages.length) {
          img.src = slideImages[0].src;
        } else {
          thumb.classList.add('error');
        }
      };
      thumb.appendChild(img);
    } else {
      thumb.classList.add('no-image');
    }

    thumb.addEventListener('click', () => openSlideshow(slideImages, 0, portfolio.name, pi));
    card.appendChild(thumb);
    grid.appendChild(card);
  }

  container.appendChild(grid);

  // Trigger staggered entrance after a tick
  requestAnimationFrame(() => {
    grid.querySelectorAll('.work-card').forEach(card => card.classList.add('visible'));
  });


  // --- Slideshow ---

  const overlay  = document.getElementById('slideshowOverlay');
  const caption  = document.getElementById('slideshowCaption');
  const strip    = document.getElementById('slideshowStrip');
  const closeBtn = document.getElementById('slideshowClose');
  const prevBtn  = document.getElementById('slideshowPrev');
  const nextBtn  = document.getElementById('slideshowNext');

  // Replace static img with a crossfade wrapper
  const mainArea = document.querySelector('.slideshow-main');
  document.getElementById('slideshowImg')?.remove();

  const wrap = document.createElement('div');
  wrap.className = 'slideshow-img-wrap';
  mainArea.insertBefore(wrap, caption);

  // Two image slots for crossfade
  const imgA = document.createElement('img');
  const imgB = document.createElement('img');
  imgA.className = 'active';
  wrap.appendChild(imgA);
  wrap.appendChild(imgB);

  let useA = true;

  let _slides = [];
  let _idx    = 0;

  // Preload the images immediately adjacent to the current slide
  // so next/prev feel instant.
  function preloadNeighbors() {
    [-1, 1, 2].forEach(offset => {
      const i = (_idx + offset + _slides.length) % _slides.length;
      const p = new Image();
      p.src = _slides[i].src;
    });
  }

  // Build a list of all portfolios for switching
  const allPortfolios = manifest.portfolios.map(p => ({
    name: p.name,
    slides: p.images
      .filter(i => i.image)
      .map(i => ({
        src:       '../media/' + p.folder + '/' + encodeURIComponent(i.image),
        thumbnail: '../Thumbnails/' + encodeURIComponent(i.image),
        label:     (function cleanLabel(filename) {
          return filename
            .replace(/\.[^/.]+$/, '')
            .replace(/^\d+\./, '')
            .replace(/^(TH_|TN_|T_)/i, '')
            .replace(/[_#]+\d+\w*$/, '')
            .replace(/[_#]+$/, '')
            .trim();
        })(i.image)
      }))
  }));
  let _portfolioIdx = 0;

  const portfolioNameEl = document.getElementById('slideshowPortfolioName');
  const portfolioPrevBtn = document.getElementById('portfolioPrev');
  const portfolioNextBtn = document.getElementById('portfolioNext');

  function switchPortfolio(dir) {
    _portfolioIdx = (_portfolioIdx + dir + allPortfolios.length) % allPortfolios.length;
    const p = allPortfolios[_portfolioIdx];
    openSlideshow(p.slides, 0, p.name, _portfolioIdx);
  }

  portfolioPrevBtn?.addEventListener('click', () => switchPortfolio(-1));
  portfolioNextBtn?.addEventListener('click', () => switchPortfolio(1));

  function openSlideshow(slides, startIndex, portfolioName, portfolioIdx) {
    _slides = slides;
    _idx    = startIndex;
    if (portfolioIdx !== undefined) _portfolioIdx = portfolioIdx;
    buildStrip();

    if (portfolioNameEl) portfolioNameEl.textContent = portfolioName || '';

    // Show first image immediately (no crossfade on open)
    const { src, label } = _slides[_idx];
    imgA.src = src; imgA.className = 'active';
    imgB.src = '';  imgB.className = '';
    useA = true;
    caption.textContent = label || '';

    overlay.classList.add('open');
    requestAnimationFrame(() => overlay.classList.add('visible'));
    document.body.style.overflow = 'hidden';
    updateStrip();
    preloadNeighbors();
  }

  function closeSlideshow() {
    overlay.classList.remove('visible');
    setTimeout(() => {
      overlay.classList.remove('open');
      imgA.src = ''; imgB.src = '';
    }, 350);
    document.body.style.overflow = '';
  }

  function showSlide(idx) {
    _idx = (idx + _slides.length) % _slides.length;
    const { src, label } = _slides[_idx];

    imgA.src = src;
    imgA.className = 'active';
    imgB.src = '';
    imgB.className = '';
    useA = true;

    caption.textContent = label || '';
    updateStrip();
    preloadNeighbors();
  }

  function updateStrip() {
    strip.querySelectorAll('.strip-thumb').forEach((el, i) => {
      el.classList.toggle('active', i === _idx);
    });
    const active = strip.querySelector('.strip-thumb.active');
    if (active) active.scrollIntoView({ inline: 'center', behavior: 'smooth', block: 'nearest' });
  }

  // Strip thumbnails use data-src and are loaded lazily via IntersectionObserver
  // so opening a slideshow doesn't blast out requests for every image at once.
  // img.decode() ensures the image is fully decoded before being shown,
  // preventing partial/corrupted renders mid-decode.
  const stripObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const img = entry.target;
      if (img.dataset.src) {
        img.src = img.dataset.src;
        delete img.dataset.src;
        img.decode().then(() => {
          img.style.opacity = '1';
        }).catch(() => {
          img.style.opacity = '1';
        });
      }
      stripObserver.unobserve(img);
    });
  }, { root: strip, rootMargin: '0px 200px' });

  function buildStrip() {
    strip.innerHTML = '';
    _slides.forEach(({ src, thumbnail, label }, i) => {
      const t = document.createElement('div');
      t.className = 'strip-thumb';
      t.setAttribute('aria-label', label);
      const img = document.createElement('img');
      // Use the dedicated thumbnail for the strip; fall back to full src if missing.
      img.dataset.src = thumbnail || src;
      img.alt = label;
      img.style.opacity = '0';
      img.style.transition = 'opacity 0.2s ease';
      t.appendChild(img);
      t.addEventListener('click', () => showSlide(i));
      strip.appendChild(t);
      stripObserver.observe(img);
    });
  }

  closeBtn.addEventListener('click', closeSlideshow);
  prevBtn.addEventListener('click',  () => showSlide(_idx - 1));
  nextBtn.addEventListener('click',  () => showSlide(_idx + 1));

  overlay.addEventListener('click', e => {
    if (e.target === overlay) closeSlideshow();
  });

  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape')     closeSlideshow();
    if (e.key === 'ArrowLeft')  showSlide(_idx - 1);
    if (e.key === 'ArrowRight') showSlide(_idx + 1);
  });

})();