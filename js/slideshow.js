// Loads all portfolio images from manifest.json, shuffles them,
// and swaps the featured image on the home page every 30 seconds.
// Pauses while the lightbox is open.

(async function () {
  const img = document.getElementById('featuredImg');
  if (!img) return;

  let manifest;
  try {
    const res = await fetch('media/manifest.json');
    if (!res.ok) throw new Error();
    manifest = await res.json();
  } catch {
    img.style.display = 'none';
    return;
  }

  // collect every image across all portfolios
  const images = [];
  for (const portfolio of manifest.portfolios ?? []) {
    for (const filename of portfolio.images ?? []) {
      images.push('media/' + portfolio.folder + '/' + encodeURIComponent(filename));
    }
  }

  if (images.length === 0) { img.style.display = 'none'; return; }

  // shuffle so it's different each visit
  for (let i = images.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [images[i], images[j]] = [images[j], images[i]];
  }

  let current = 0;
  img.src = images[0];
  img.onerror = advance; // skip broken images

  function advance() {
    if (window.lightboxIsOpen?.()) return;
    current = (current + 1) % images.length;
    img.src = images[current];
  }

  setInterval(advance, 30000);
})();
