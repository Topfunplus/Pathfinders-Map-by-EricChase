const mapContainer = document.getElementById('map-container');
const map = document.getElementById('map');
const hruler = document.getElementById('h-ruler');
const vruler = document.getElementById('v-ruler');
const legend = document.getElementById('legend');

const MAP_WIDTH = 8000;
const MAP_HEIGHT = 8000;

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 2.0;
const ZOOM_MULT = 0.05;

// dragging the map
let isDragging = false;
let startX = 0;
let startY = 0;

let oldMapContainerRect = mapContainer.getBoundingClientRect();

setTimeout(() => {
  setTransform({ x: 0, y: 0, scale: 0.1 });
  centerMapOnMapContainer();
  oldMapContainerRect = mapContainer.getBoundingClientRect();
}, 250);

// When the pointer is pressed down
mapContainer.addEventListener('pointerdown', (event) => {
  isDragging = true;
  startX = event.clientX;
  startY = event.clientY;
  map.setPointerCapture(event.pointerId);
});

// When the pointer moves
document.addEventListener('pointermove', (event) => {
  if (isDragging) {
    const { x, y } = parseTransform(map);

    const moveX = event.clientX - startX;
    const moveY = event.clientY - startY;

    setTransform({ x: x + moveX, y: y + moveY });

    startX = event.clientX;
    startY = event.clientY;
  }
});

// When the pointer is released
mapContainer.addEventListener('pointerup', () => {
  isDragging = false;
});

// Optionally handle pointercancel to stop dragging in case of any interruptions
mapContainer.addEventListener('pointercancel', () => {
  isDragging = false;
});

// Zoom in and out using the wheel event
mapContainer.addEventListener('wheel', (event) => {
  event.preventDefault();

  // Get the position of the cursor relative to the map container
  const rect = mapContainer.getBoundingClientRect();
  const container_distance_x = event.clientX - rect.left;
  const container_distance_y = event.clientY - rect.top;
  console.log(rect);
  console.log(container_distance_x, container_distance_y);

  const { x, y, scale } = parseTransform(map);

  const zoomIn = event.deltaY < 0;
  const x_distance = ((x - container_distance_x) / scale) * ZOOM_MULT;
  const y_distance = ((y - container_distance_y) / scale) * ZOOM_MULT;
  if (zoomIn) {
    if (scale < ZOOM_MAX) {
      setTransform({ x: x + x_distance, y: y + y_distance, scale: scale + ZOOM_MULT });
    }
  } else {
    if (scale > ZOOM_MIN) {
      setTransform({ x: x - x_distance, y: y - y_distance, scale: scale - ZOOM_MULT });
    }
  }
});

window.addEventListener('resize', () => {
  const newMapContainerRect = mapContainer.getBoundingClientRect();

  // this math took forever

  // basically, it's getting the centers of the old and new container sizes and
  // offsetting those distances to the map's left and top values

  const old_distance_x = 0.5 * oldMapContainerRect.width;
  const old_distance_y = 0.5 * oldMapContainerRect.height;
  const new_distance_x = 0.5 * newMapContainerRect.width;
  const new_distance_y = 0.5 * newMapContainerRect.height;

  const { x, y } = parseTransform(map);
  const x_distance = new_distance_x - (old_distance_x - x);
  const y_distance = new_distance_y - (old_distance_y - y);

  setTransform({ x: x_distance, y: y_distance });

  oldMapContainerRect = newMapContainerRect;
});

// Map Functions

function parseTransform(element) {
  const values = { scale: 1 };

  const scaleIndex = element.style.transform.indexOf('scale(');
  if (scaleIndex !== -1) {
    const scaleStart = scaleIndex + 'scale('.length;
    const scaleEnd = element.style.transform.indexOf(')', scaleStart);
    const scale = element.style.transform.slice(scaleStart, scaleEnd).trim();
    values.scale = Number.parseFloat(scale ?? 1);
  }

  // decided to go with left and top values instead
  //// const translateIndex = element.style.transform.indexOf('translate(');
  //// if (translateIndex !== -1) {
  ////   const translateStart = translateIndex + 'translate('.length;
  ////   const translateEnd = element.style.transform.indexOf(')', translateStart);
  ////   const [x, y] = element.style.transform.slice(translateStart, translateEnd).split(',');
  ////   values.x = Number.parseFloat(x ?? 0);
  ////   values.y = Number.parseFloat(y ?? 0);
  //// }

  values.x = Number.parseInt(map.style.left ?? 0);
  values.y = Number.parseInt(map.style.top ?? 0);

  return values;
}

/** @param {{ scale?: number, x?: number, y?: number }} params */
function setTransform({ scale, x, y }) {
  if (typeof scale === 'number') {
    map.style.transform = `scale(${scale})`;
    hruler.style.height = `${scale * 56}px`;
    vruler.style.width = `${scale * 56}px`;
    legend.style.top = `${60 + scale * 56}px`;
    legend.style.left = `${10 + scale * 56}px`;
  }
  if (typeof x === 'number') {
    map.style.left = `${x}px`;
    hruler.style.transform = `translate(${x}px)`;
  }
  if (typeof y === 'number') {
    map.style.top = `${y}px`;
    vruler.style.transform = `translate(0, ${y}px)`;
  }
}

// Map Container Coordinate Conversions
function mapContainerCoordinatesToPercentages(x, y) {
  const { width, height } = mapContainer.getBoundingClientRect();
  return {
    px: x / width,
    py: y / height,
  };
}
function percentagesToMapContainerCoordinates(px, py) {
  const { width, height } = mapContainer.getBoundingClientRect();
  return {
    x: px * width,
    y: py * height,
  };
}

// Map Coordinate Conversions
function mapCoordinatesToPercentages(x, y) {
  const { scale } = parseTransform(map);
  return {
    px: x / (MAP_WIDTH * scale),
    py: y / (MAP_HEIGHT * scale),
  };
}
function percentagesToMapCoordinates(px, py) {
  const { scale } = parseTransform(map);
  return {
    x: px * (MAP_WIDTH * scale),
    y: py * (MAP_HEIGHT * scale),
  };
}

function centerMapOnMapContainer() {
  const containerCenter = percentagesToMapContainerCoordinates(0.5, 0.5);
  const mapCenter = percentagesToMapCoordinates(0.5, 0.5);
  setTransform({ x: containerCenter.x - mapCenter.x, y: containerCenter.y - mapCenter.y });
}
