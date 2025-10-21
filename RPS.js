import { showToast, mt } from "./stuff.js";

// Fate of Fists made by Mukilan M.
// Inspired by A Dark Room by DoubleSpeak Games and Hades by Supergiant Games

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
  const hpS = document.getElementById("hp");
  const api = {
    get: () => hpVal,
    set: (val) => {
      if (typeof val === 'number') hpVal = val;
      hpS.textContent = 'HP: ' + hpVal + '/' + maxHP;
    },
    getMax: () => maxHP,
    setMax: (val) => {
      if (typeof val === "number") maxHP = val;
      hpS.textContent = 'HP: ' + hpVal + '/' + maxHP;
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
// --- Localstorage Manager ---
const storage = (() => {
  return Object.freeze({
    add: (name, data) => localStorage.setItem(name, data),
    get: (name) => {
      return localStorage.getItem(name);
    }
  })
})();
const choiceChars = ["r", "p", "s"];

// --- Utility Functions ---

let enemyHP = 100;
let enemyMaxHP = 100;

function setEnemy(name, maxHP) {
  enemyMaxHP = maxHP;
  enemyHP = maxHP;
  document.getElementById("enemyName").innerText = `${name}`;
  updateEnemyBar();
}

function updateEnemyBar() {
  const bar = document.getElementById('enemyBar');
  let percent = (enemyHP / enemyMaxHP) * 100;
  percent = Math.max(0, Math.min(100, percent));
  bar.style.width = percent + "%";
}

function damageEnemy(amount) {
  enemyHP = Math.max(0, enemyHP - amount);
  updateEnemyBar();
}

function healEnemy(amount) {
  enemyHP = Math.min(enemyMaxHP, enemyHP + amount);
  updateEnemyBar();
}

function generateRanNum(min, max) {
  const rand = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
  return Math.floor(rand * (max - min + 1)) + min;
}

async function getKeyPress(chars) {
  return new Promise((resolve) => {
    function waitForKey(e) {
      if (chars.includes(e.key)) {
        document.removeEventListener('keydown', waitForKey);
        resolve(e.key); // resolves with the key pressed
      }
    }

    document.addEventListener('keydown', waitForKey);
  });
}

// --- QueueID Function ---
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

// --- Writer Function ---
function writer(text, speed = 120) {
  return new Promise(resolve => {
    const el = document.getElementById("writer");
    if (!el) return resolve();
    if (el.textContent.trim().toLowerCase() === text.trim().toLowerCase()) return resolve();
    el.textContent = "";
    let i = 0;
    function type() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else resolve();
    }
    type();
  });
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

function weightedRandom(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) return i;
  }
  return weights.length - 1;
}

// --- Outcome Function ---
async function outCome(outcome, enemy, ehp, mhp) {
  if (outcome === true) {
    if (hp.get() < hp.getMax()) hp.set(hp.get() + 1);
    await writer(`You won against a ${enemy}! Enemy HP: ${ehp}/${mhp}`);
  } else if (outcome === false) {
    hp.set(hp.get() - 1);
    if (hp.get() <= 0) {
      await writer(`You died against a ${enemy}. Game Over!`);
      Room.set(0);
    } else {
      await writer(`You lost against a ${enemy}. Your HP: ${hp.get()}/${hp.getMax()}`);
    }
  } else if (outcome === "tie") {
    await writer(`It's a tie! Enemy HP: ${ehp}/${mhp}`);
  } else if (outcome === null) {
    await writer(`A ${enemy} challenges you. Enemy HP: ${ehp}/${mhp}`);
  }
}

// --- Enemies ---
const enimies = {
  async fight(enemyName, weights, ehp, mhp) {
    await queueID();
    await outCome(null, enemyName, ehp, mhp);
    setEnemy(enemyName, mhp);

    const playerChoices = findChoices();
    const index = weightedRandom(weights);
    const playerFav = playerChoices[index];
    const counter = { r: "p", p: "s", s: "r" };
    const aiPick = counter[playerFav];

    const pChoice = await pickChoice();
    const outcome = compare(pChoice, aiPick);
    await outCome(outcome, enemyName, ehp, mhp);

    if (outcome === false || outcome === "tie") {
      if (outcome === false && ehp < mhp) healEnemy(1);
      await this.fight(enemyName, weights, ehp, mhp);
    }
    if (outcome === true) {
      if (Math.max(0, ehp - 1) === 0) {
        await writer(`You defeated the enemy!`, 120);
      } else {
        await writer(`You won! Enemy HP: ${ehp - 1}/${mhp}`);
        damageEnemy(1);
        await this.fight(enemyName, weights, ehp - 1, mhp);
      }
    }
  },

  3: async function() { await this.fight("Boss", [60, 30, 10], 5, 5); },
  2: async function() { await this.fight("Mini Boss", [55, 30, 15], 3, 3); },
  1: async function() { await this.fight("Wanderer", [50, 35, 15], 2, 2); },
  0: async function() { await this.fight("Goblin", [40, 40, 20], 1, 1); },
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

newRoom();
