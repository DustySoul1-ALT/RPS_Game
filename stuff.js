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
let resolveUserChoice;

// --- HITBOX RATIOS (for 1536x1024 image) ---
const HITBOXES = {
    Rock:     { left: 0.0325, top: 0.70, width: 0.1302, height: 0.20 },
    Paper:    { left: 0.4349, top: 0.70, width: 0.1302, height: 0.20 },
    Scissors: { left: 0.8373, top: 0.70, width: 0.1302, height: 0.20 }
};

// --- NEW HITBOX POSITIONING & CLICK LOGIC ---
/**
 * Calculates and sets the CSS (position and size) of the transparent buttons 
 * based on the current canvas dimensions and pre-calculated ratios.
 */
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

/**
 * Handles the click event on the overlay to detect which button was pressed.
 * This function resolves the Promise returned by choiceBG.
 */
function handleMoveClick(event) {
    const pressedButton = event.target.closest('.choice-hitbox');
    if (pressedButton) {
        const userMove = pressedButton.getAttribute('data-move'); 
        // 1. Clean up event listeners
        overlay.removeEventListener('click', handleMoveClick);
        window.removeEventListener("resize", drawAndPositionChoice);
        // 2. Resolve the Promise to return the move
        if (resolveUserChoice) {
            resolveUserChoice(userMove);
            resolveUserChoice = null;
        }
    }
}
export function draw() {
    if (!running) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
    const pattern = ctx.createPattern(img, "repeat");
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}
export function oldPaper() {
    running = true;  
    // Clean up listeners from choiceBG state
    window.removeEventListener("resize", drawAndPositionChoice);
    overlay.removeEventListener('click', handleMoveClick);   
    if (img.complete) draw();
    window.addEventListener("resize", draw);
}
const drawAndPositionChoice = () => {
    // Redraw the canvas
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(stopImg, 0, 0, canvas.width, canvas.height);
    
    // Position the hitboxes over the drawn image
    positionHitboxes(); 
};
/**
 * Sets up the choice screen and returns a Promise that resolves with the user's move.
 * @returns {Promise<string>} A promise that resolves to "Rock", "Paper", or "Scissors".
 */
export function choiceBG() {
    running = false;
    
    // Remove listeners from oldPaper state
    window.removeEventListener("resize", draw); 
    
    // Return a Promise that will resolve with the user's choice
    return new Promise(resolve => {
        // Store the resolve function so handleMoveClick can resolve it later
        resolveUserChoice = resolve; 
        
        // 1. Draw the screen and position the hitboxes
        if (stopImg.complete) {
            drawAndPositionChoice();
        } else {
            stopImg.onload = drawAndPositionChoice;
        }
        
        // 2. Add listeners for resize and click
        window.addEventListener("resize", drawAndPositionChoice);
        overlay.addEventListener('click', handleMoveClick);
    });
}