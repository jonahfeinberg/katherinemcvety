// Reads manifest.json and builds the portfolios page.

(async function () {
  const container = document.getElementById('portfoliosContainer');

  let manifest;
  try {
    const res = await fetch('../media/manifest.json');
    if (!res.ok) throw new Error();
    manifest = await res.json();
  } catch {
    container.innerHTML = '<p class="load-msg">No portfolios found — see README.txt.</p>';
    return;
  }

  if (!manifest.portfolios?.length) {
    container.innerHTML = '<p class="load-msg">No portfolios listed in manifest.json.</p>';
    return;
  }

  container.innerHTML = '';

  for (const portfolio of manifest.portfolios) {
    // build the image list for this portfolio (used for lightbox arrow navigation)
    function cleanLabel(filename) {
      return filename
        .replace(/\.[^/.]+$/, '')       // strip extension
        .replace(/^\d+\./, '')          // strip leading number prefix e.g. 1.
        .replace(/^(TH_|TN_|T_)/i, '') // strip leading TH_ TN_ T_
        .replace(/[_#]+\d+\w*$/, '')   // strip trailing #1 _2 #_5 etc
        .replace(/[_#]+$/, '')          // strip any remaining trailing _ or #
        .trim();
    }

    const imageList = portfolio.images
      .filter(i => i.image)
      .map(i => ({
        src:   '../media/' + portfolio.folder + '/' + encodeURIComponent(i.image),
        label: cleanLabel(i.image)
      }));

    // section heading + divider
    const section = document.createElement('section');
    section.className = 'portfolio-section';
    section.innerHTML = `<h2>${portfolio.name}</h2><hr class="portfolio-divider">`;

    // grid of photos
    const outer = document.createElement('div');
    outer.className = 'portfolio-grid-outer';

    const grid = document.createElement('div');
    grid.className = 'portfolio-grid';

    for (const [idx, { src, label }] of imageList.entries()) {
      const item = document.createElement('div');
      item.className = 'portfolio-item';

      const img = document.createElement('img');
      // Images beyond the first 5 are hidden behind "Expand" — don't load them
      // until the user asks for them. Store src in data-src and swap on expand.
      if (idx < 5) {
        img.src = src;
        img.loading = 'lazy';
      } else {
        img.dataset.src = src;
      }
      img.alt     = label;
      img.decoding = 'async';
      img.onclick = () => openLightbox(src, label, imageList);
      img.onload  = () => { item.classList.add('loaded'); };
      img.onerror = () => { item.style.display = 'none'; };

      item.appendChild(img);
      grid.appendChild(item);
    }

    outer.appendChild(grid);
    section.appendChild(outer);

    // hide everything past the first 5
    const allItems = grid.querySelectorAll('.portfolio-item');
    allItems.forEach((item, i) => {
      if (i >= 5) item.classList.add('hidden');
    });

    const hasMore = allItems.length > 5;

    // expand / collapse button
    const btn = document.createElement('button');
    btn.className   = 'expand-btn';
    btn.textContent = 'Expand';

    if (hasMore) {
      btn.addEventListener('click', () => {
        const expanding = btn.textContent === 'Expand';
        allItems.forEach((item, i) => {
          if (i >= 5) {
            item.classList.toggle('hidden', !expanding);
            // Trigger lazy load for newly revealed images
            if (expanding) {
              const img = item.querySelector('img');
              if (img && img.dataset.src) {
                img.src = img.dataset.src;
                delete img.dataset.src;
              }
            }
          }
        });
        btn.textContent = expanding ? 'Collapse' : 'Expand';
      });
      section.appendChild(btn);
    }

    container.appendChild(section);
  }
})();