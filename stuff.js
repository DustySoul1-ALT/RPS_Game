// --- EXISTING VARIABLES ---
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
const overlay = document.getElementById("choice-buttons-overlay");

let running = false;
const img = new Image();
img.src = "./oldpaper.png";

const stopImg = new Image();
stopImg.src = "./choice.png";

// --- GLOBAL PROMISE RESOLVER ---
let resolveUserChoice = null;

// --- HITBOX RATIOS (for 1536x1024 image) ---
const HITBOXES = {
  Rock:     { left: 0.0325, top: 0.70, width: 0.1302, height: 0.20 },
  Paper:    { left: 0.4349, top: 0.70, width: 0.1302, height: 0.20 },
  Scissors: { left: 0.8373, top: 0.70, width: 0.1302, height: 0.20 }
};

// --- HITBOX POSITIONING ---
function positionHitboxes() {
  const canvasWidth = canvas.width;
  const canvasHeight = canvas.height;

  for (const move in HITBOXES) {
    const ratios = HITBOXES[move];
    const button = document.getElementById(`${move.toLowerCase()}-hitbox`);
    if (button) {
      button.style.left = `${canvasWidth * ratios.left}px`;
      button.style.top = `${canvasHeight * ratios.top}px`;
      button.style.width = `${canvasWidth * ratios.width}px`;
      button.style.height = `${canvasHeight * ratios.height}px`;
    }
  }
}

// --- CLICK HANDLER ---
function handleMoveClick(event) {
  const pressedButton = event.target.closest('.choice-hitbox');
  if (!pressedButton) return;

  const userMove = pressedButton.getAttribute('data-move');

  // Cleanup event listeners
  overlay.removeEventListener('click', handleMoveClick);
  window.removeEventListener('resize', drawAndPositionChoice);

  // Resolve promise if waiting
  if (resolveUserChoice) {
    resolveUserChoice(userMove);
    resolveUserChoice = null;
  }
}

// --- DRAW OLD PAPER BACKGROUND ---
export function draw() {
  if (!running) return;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;

  // Fix: wait for image to load before creating pattern
  if (img.complete && img.naturalWidth !== 0) {
    const pattern = ctx.createPattern(img, "repeat");
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    img.onload = draw;
  }
}

// --- SWITCH TO OLD PAPER MODE ---
export function oldPaper() {
  running = true;

  // Cleanup listeners from choiceBG
  window.removeEventListener('resize', drawAndPositionChoice);
  overlay.removeEventListener('click', handleMoveClick);

  if (img.complete) draw();
  window.addEventListener('resize', draw);
}

// --- DRAW CHOICE BACKGROUND ---
const drawAndPositionChoice = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;

  if (stopImg.complete && stopImg.naturalWidth !== 0) {
    ctx.drawImage(stopImg, 0, 0, canvas.width, canvas.height);
  } else {
    stopImg.onload = () => ctx.drawImage(stopImg, 0, 0, canvas.width, canvas.height);
  }

  positionHitboxes();
};

// --- CHOICE SCREEN (returns a Promise) ---
export function choiceBG() {
  running = false;

  // Cleanup old listeners
  window.removeEventListener('resize', draw);

  return new Promise(resolve => {
    resolveUserChoice = resolve;

    if (stopImg.complete) {
      drawAndPositionChoice();
    } else {
      stopImg.onload = drawAndPositionChoice;
    }

    window.addEventListener('resize', drawAndPositionChoice);
    overlay.addEventListener('click', handleMoveClick);
  });
}

// --- TOAST MESSAGES ---
export function showToast(text) {
  Toastify({
    text: text,
    duration: 1500,
    gravity: "top",
    position: "left",
    stopOnFocus: true,
    style: {
      background: "#2C3E50",
      color: "#795548",
      opacity: 1,
      border: "2px solid #795548"
    },
  }).showToast();
}
