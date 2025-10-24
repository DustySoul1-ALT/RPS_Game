import { mt, weightedRandom, generateRanNum, setButtonsDisabled } from "./stuff.js";
import { data, manageProfileData, CURRENT_PROFILE_KEY, PROFILE_STORAGE_KEY, activePlayerProfile, DATA_ACTION } from "../data_manager.js";

// Fate of Fists made by Mukilan M.
// Inspired by A Dark Room by DoubleSpeak Games and Hades by Supergiant Games

// --- Get the Current Profile Key and Profile Storage Key
const params = new URLSearchParams(window.location.search);
const keys = [params.get("profileKey"), params.get("storageKey")]

// --- Document stuff
const enemyStatusEl = document.getElementById('enemy-status-text');
const enemyHpBarEl = document.getElementById('enemy-hp-bar');

activePlayerProfile = data(DATA_ACTION.LOAD, keys)

// --- Game Vars with Closures ---
const Room = (() => {
  let roomNum = 0;
  const roomInd = document.getElementById("room");
  const api = {
    get: () => roomNum,
    set: (val) => {
      if (typeof val === 'number') roomNum = val;
      roomInd.textContent = "Room: " + roomNum;
    }
  };
  return Object.freeze(api);
})();
Room.set(0);
const hp = (() => {
  let hpVal = 5;
  let maxHP = 5;
  const playerHpBarEl = document.getElementById("player-hp-bar")
  const hpSEl = document.getElementById("hp")
  
  const api = {
    get: () => hpVal,
    set: (val) => {
      // Clamps the new HP value to prevent exceeding maxHP
      if (typeof val === 'number') hpVal = Math.min(val, maxHP); 
      hpSEl.textContent = 'HP: ' + hpVal + '/' + maxHP;
      activePlayerProfile.playerHP = hpVal
      
      // Updates the visual HP bar
      const playerPercent = (hpVal / maxHP) * 100;
      playerHpBarEl.style.width = `${Math.max(0, playerPercent)}%`;
    },
    getMax: () => maxHP,
    setMax: (val) => {
      if (typeof val === "number") maxHP = val;
      hpSEl.textContent = 'HP: ' + hpVal + '/' + maxHP;
      // Updates the HP bar when max health changes
      const playerPercent = (hpVal / maxHP) * 100;
      playerHpBarEl.style.width = `${Math.max(0, playerPercent)}%`;
    }
  };
  return Object.freeze(api);
})();
hp.set(5);
// --- Queue ---
const queue = (() => {
  const queue = [];
  return Object.freeze({
    add: (val) => {
      if (queue.some(x => x === val)) return false;
      queue.push(val);
      return queue.length - 1;
    },
    get: () => [...queue],
    remove: (id) => {
      const index = queue.indexOf(id);
      if (index !== -1) queue.splice(index, 1);
    },
    clear: () => queue.length = 0,
  });
})();
// --- Game DB ---
const GameDB = (() => {
  const db = [];
  return Object.freeze({
    add: (val) => { if (choiceChars.includes(val)) db.push(val); },
    get: () => [...db],
    clear: () => db.length = 0,
  });
})();
const choiceChars = ["r", "p", "s"];

// --- Utility Functions ---
let enemyHP = 100;
let enemyMaxHP = 100;

const enemy = {
  set: (name, maxHP) => {
    enemyMaxHP = maxHP;
    enemyHP = maxHP;
    document.getElementById("enemyName").innerText = `${name}`;
    enemy.update();
  },
  update: () => {
    const el = document.getElementById('enemy-hp');
    const barEl = document.getElementById('enemy-hp-bar');
    el.textContent = `HP: ${enemyHP}/${enemyMaxHP}`;
    const enemyPercent = (enemyHP / enemyMaxHP) * 100;
    barEl.style.width = `${Math.max(0, enemyPercent)}%`;
  },
  damage: (amount) => {
    enemyHP = Math.max(0, enemyHP - amount);
    enemy.update();
  },
  heal: (amount) => {
    enemyHP = Math.min(enemyMaxHP, enemyHP + amount)
    enemy.update()
  }
}

async function getKeyPress(validMoves) {
  return new Promise((resolve) => {
    function handleKey(e) {
      const key = e.key.toLowerCase();
      if (validMoves.includes(key)) {
        cleanup();
        resolve(key);
      }
    }

    function handleClick(e) {
      const btn = e.target.closest('button[data-move]');
      if (!btn) return;
      const move = btn.dataset.move;
      if (validMoves.includes(move)) {
        cleanup();
        resolve(move);
      }
    }

    function cleanup() {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('click', handleClick);
    }

    document.addEventListener('keydown', handleKey);
    document.addEventListener('click', handleClick);
  });
}


// --- Queue Function ---
async function queueID() {
  return new Promise(resolve => {
    let id = generateRanNum(0, 100);
    while (queue.add(id) === false) {
      id = generateRanNum(0, 100);
    }

    function checkQueue() {
      const queueDB = queue.get();
      if (queueDB[0] === id) {
        queue.remove(id);
        resolve(id);
      } else {
        setTimeout(checkQueue, 50);
      }
    }

    checkQueue();
  });
}

// --- Writer & Status Function ---

async function writer(text) {
  const FIXED_SPEED = 120;
  const writerEl = document.getElementById("writer")
  setButtonsDisabled(true);
  writerEl.innerHTML = '';
  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  writerEl.appendChild(cursor);
  for (let i = 0; i < text.length; i++) {
    writerEl.insertBefore(document.createTextNode(text.charAt(i)), cursor);
    await new Promise(resolve => setTimeout(resolve, FIXED_SPEED));
  }
  writerEl.removeChild(cursor);
  setButtonsDisabled(false);
}
async function status(text) {
    Toastify({ 
        text: text, 
        duration: 2000, 
        style: { background: "linear-gradient(to right, #007bff, #0056b3)" } 
    }).showToast();
    enemyStatusEl.textContent = text.replace(/<(.*?)>/g, '').substring(0, 30);
    return new Promise(resolve => resolve());
}

// --- RPS Logic ---
function findChoices() {
  let counts = { r: 0, p: 0, s: 0 };
  for (let choice of GameDB.get()) {
    if (counts.hasOwnProperty(choice)) counts[choice]++;
  }
  let sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);

  function pickRandomTie(pairs) {
    let maxCount = pairs[0][1];
    let tied = pairs.filter(([choice, count]) => count === maxCount);
    return tied[Math.floor(Math.random() * tied.length)][0];
  }

  let top3 = [];
  let remaining = [...sorted];
  while (top3.length < 3 && remaining.length > 0) {
    let pick = pickRandomTie(remaining);
    top3.push(pick);
    remaining = remaining.filter(([choice]) => choice !== pick);
  }

  return top3;
}

async function pickChoice() {
  await writer("Choose your move: (r)ock, (p)aper, (s)cissors");
  const playerMove = await getKeyPress(choiceChars);
  return playerMove;
}

function compare(pc, bc) {
  if (pc === bc) return "tie";
  const outcomes = {
    r: { r: "tie", p: false, s: true },
    p: { r: true, p: "tie", s: false },
    s: { r: false, p: true, s: "tie" }
  };
  return outcomes[pc][bc];
}

// --- Outcome Function ---
async function outCome(outcome, enemyN, ehp, mhp) {
  if (outcome === true) {
    if (hp.get() < hp.getMax()) hp.set(hp.get() + 1);
    await status(`You won against a ${enemyN}!`);
    enemy.damage(1)
  } else if (outcome === false) {
    hp.set(hp.get() - 1);
    if (hp.get() <= 0) {
      await status(`You died against a ${enemyN}. Game Over!`);
      Room.set(0);
    } else {
      await status(`You lost against a ${enemyN}.`);
      enemy.heal(1)
    }
  } else if (outcome === "tie") {
    await status(`It's a tie! Enemy HP: ${ehp}/${mhp}`);
  }
}

// --- Enemies ---
const enimies = {
  async fight(enemyName, weights, ehp, mhp, first) {
    await queueID();
    if (first === true) enemy.set(enemyName, mhp);
    else enemy.set(enemyName, ehp)

    const playerChoices = findChoices();
    const index = weightedRandom(weights);
    const playerFav = playerChoices[index];
    const counter = { r: "p", p: "s", s: "r" };
    const aiPick = counter[playerFav];

    const pChoice = await pickChoice();
    const outcome = compare(pChoice, aiPick);
    await outCome(outcome, enemyName, ehp, mhp);

    if (outcome === false || outcome === "tie") {
      await this.fight(enemyName, weights, ehp, mhp, false);
    }
    if (outcome === true) {
      if (Math.max(0, ehp - 1) === 0) {
        await writer(`You defeated the enemy!`, 120);
        activePlayerProfile.coins = activePlayerProfile.coins + generateRanNum(1, 10)
      } else {
        await writer(`You won!`);
        await this.fight(enemyName, weights, ehp - 1, mhp, false);
      }
    }
  },
  3: async function() { await this.fight("Boss", [60, 30, 10], 5, 5, true); },
  2: async function() { await this.fight("Mini Boss", [55, 30, 15], 3, 3, true); },
  1: async function() { await this.fight("Wanderer", [50, 35, 15], 2, 2), true; },
  0: async function() { await this.fight("Goblin", [40, 40, 20], 1, 1, true); },
};

// --- Room Loop ---
async function newRoom() {
  if (Room.get() === 0) Room.set(1);
  const enemyChance = [
    Math.min(Room.get() * 6, 75),
    Math.min(Room.get() * 5, 70),
    Math.min(Room.get() * 4, 60),
    Math.min(Room.get() * 2, 40)
  ];
  const enemyTypes = [0, 1, 2, 3];
  const enemyNum = generateRanNum(1, Math.min(Room.get(), 10));

  for (let i = 0; i < enemyNum; i++) {
    if (hp.get() <= 0) break;
    const pickIndex = weightedRandom(enemyChance);
    const enemyID = enemyTypes[pickIndex];
    await enimies[enemyID]();
  }

  if (hp.get() > 0) {
    await new Promise(res => setTimeout(res, 500));
    Room.set(Room.get() + 1);
    await newRoom();
  }
}

// --- Initialize the game ---
function initializeGame() {
  const loadedProfile = data(DATA_ACTION.LOAD, keys); 
  if (loadedProfile) {
      activePlayerProfile = loadedProfile;
      console.log(`Game starting for: ${activePlayerProfile.profileName}`);
      if (activePlayerProfile.inRun === true) console.log(`Resuming at Room: ${activePlayerProfile.room}`);
      newRoom();
  } else {
      alert("Error loading profile. Returning to menu.");
      window.location.href = '/'; 
  }
}

document.addEventListener('DOMContentLoaded', initializeGame);

function makeReactive(obj, callback) {
  return new Proxy(obj, {
    get(target, prop) {
      const value = target[prop];
      // Only wrap objects, not primitives
      if (value && typeof value === 'object' && !value.__isProxy) {
        target[prop] = makeReactive(value, callback);
        target[prop].__isProxy = true; // mark to avoid infinite recursion
      }
      return target[prop];
    },
    set(target, prop, value) {
      target[prop] = value;
      callback(target);
      return true;
    },
    deleteProperty(target, prop) {
      delete target[prop];
      callback(target);
      return true;
    }
  });
}
makeReactive(activePlayerProfile, () => {
    data(DATA_ACTION.SAVE, keys)
})

window.addEventListener('beforeunload', (event) => {
  data(DATA_ACTION.SAVE, keys)
});
