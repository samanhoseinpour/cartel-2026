// create a container and set the full-size image as its background
function createOverlay(image) {
  const overlayImage = document.createElement('img');
  overlayImage.setAttribute('src', `${image.src}`);
  // `overlay = ...` with no declaration made this an implicit global: the last
  // overlay created leaked onto window for the page lifetime, and moveWithHover
  // read that global rather than its own caller's overlay — so with two
  // zoom-enabled product sections on one page, hovering one moved the other's.
  const overlay = document.createElement('div');
  prepareOverlay(overlay, overlayImage);

  image.style.opacity = '50%';
  toggleLoadingSpinner(image);

  overlayImage.onload = () => {
    toggleLoadingSpinner(image);
    image.parentElement.insertBefore(overlay, image);
    image.style.opacity = '100%';
  };

  return overlay;
}

function prepareOverlay(container, image) {
  container.setAttribute('class', 'image-magnify-full-size');
  container.setAttribute('aria-hidden', 'true');
  container.style.backgroundImage = `url('${image.src}')`;
  container.style.backgroundColor = 'var(--gradient-background)';
}

function toggleLoadingSpinner(image) {
  const loadingSpinner = image.parentElement.parentElement.querySelector(`.loading__spinner`);
  loadingSpinner.classList.toggle('hidden');
}

// `overlay` is now a parameter instead of the implicit global it used to read.
function moveWithHover(image, event, zoomRatio, overlay) {
  if (!overlay) return;
  // calculate mouse position
  const ratio = image.height / image.width;
  const container = event.target.getBoundingClientRect();
  const xPosition = event.clientX - container.left;
  const yPosition = event.clientY - container.top;
  const xPercent = `${xPosition / (image.clientWidth / 100)}%`;
  const yPercent = `${yPosition / ((image.clientWidth * ratio) / 100)}%`;

  // determine what to show in the frame
  overlay.style.backgroundPosition = `${xPercent} ${yPercent}`;
  overlay.style.backgroundSize = `${image.width * zoomRatio}px`;
}

function magnify(image, zoomRatio) {
  const overlay = createOverlay(image);
  overlay.onclick = () => overlay.remove();
  // rAF-coalesced: mousemove fires well above 60fps and each call does four
  // layout reads plus two style writes, so unthrottled it was doing that work
  // several times per rendered frame for no visible benefit.
  let frame = 0;
  let lastEvent = null;
  overlay.onmousemove = (event) => {
    lastEvent = event;
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      moveWithHover(image, lastEvent, zoomRatio, overlay);
    });
  };
  overlay.onmouseleave = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    overlay.remove();
  };
  return overlay;
}

function enableZoomOnHover(zoomRatio) {
  const images = document.querySelectorAll('.image-magnify-hover');
  images.forEach((image) => {
    image.onclick = (event) => {
      const overlay = magnify(image, zoomRatio);
      moveWithHover(image, event, zoomRatio, overlay);
    };
  });
}

enableZoomOnHover(2);
