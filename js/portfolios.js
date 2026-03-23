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
    const imageList = portfolio.images.map(filename => ({
      src:   '../media/' + portfolio.folder + '/' + encodeURIComponent(filename),
      label: filename.replace(/\.[^/.]+$/, '').replace(/#?_\d+\w*$/, '').trim()
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

    for (const { src, label } of imageList) {
      const item = document.createElement('div');
      item.className = 'portfolio-item';

      const img = document.createElement('img');
      img.src     = src;
      img.alt     = label;
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
          if (i >= 5) item.classList.toggle('hidden', !expanding);
        });
        btn.textContent = expanding ? 'Collapse' : 'Expand';
      });
      section.appendChild(btn);
    }

    container.appendChild(section);
  }
})();
