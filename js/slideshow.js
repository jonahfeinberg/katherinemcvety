// Home page: crossfade between featured images every 30 seconds.

(async function () {
  const container = document.getElementById('featuredPhoto');
  const img = document.getElementById('featuredImg');
  if (!img || !container) return;

  let manifest;
  try {
    const res = await fetch('media/manifest.json');
    if (!res.ok) throw new Error();
    manifest = await res.json();
  } catch {
    img.style.display = 'none';
    return;
  }

  // collect only "image" entries across all portfolios
  const images = [];
  for (const portfolio of manifest.portfolios ?? []) {
    for (const entry of portfolio.images ?? []) {
      if (entry.image) {
        images.push('media/' + portfolio.folder + '/' + encodeURIComponent(entry.image));
      }
    }
  }

  if (images.length === 0) { img.style.display = 'none'; return; }

  // shuffle
  for (let i = images.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [images[i], images[j]] = [images[j], images[i]];
  }

  let current = 0;

  // Create a second img for crossfading
  const imgB = document.createElement('img');
  imgB.alt = 'Featured photograph';
  imgB.style.opacity = '0';
  imgB.onclick = () => openLightbox(imgB.src, '', []);
  container.appendChild(imgB);

  // Show first image
  img.src = images[0];
  img.style.opacity = '1';

  let useA = true; // which slot is currently visible

  function advance() {
    if (window.lightboxIsOpen?.()) return;
    current = (current + 1) % images.length;
    const next = images[current];

    if (useA) {
      // load into B, then crossfade A→B
      imgB.src = next;
      imgB.onload = () => {
        imgB.style.opacity = '1';
        img.style.opacity  = '0';
        useA = false;
      };
    } else {
      img.src = next;
      img.onload = () => {
        img.style.opacity  = '1';
        imgB.style.opacity = '0';
        useA = true;
      };
    }
  }

  img.onerror = advance;
  setInterval(advance, 30000);
})();
