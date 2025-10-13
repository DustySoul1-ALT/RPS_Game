import { showToast, choiceBG, oldPaper, draw } from "./stuff.js";

// Fate of Fists made by Mukilan M.
// Inspired by A Dark Room by DoubleSpeak Games and Hades by Supergiant games
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
      if (queue.some(x => x === val)) return false; // already in queue
      queue.push(val);
      return queue.length - 1; // return position
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
// --- Allowed Chars ---
const choiceChars = ["r", "p", "s"];
const ynChars = ["y", "n"];
const menuChars = ["s", "p", "c"];
const stRoomChars = ["s", "e", "c"];
// --- New types ---
let save;
let load;
Object.freeze(save)
Object.freeze(load)
// --- Utility Functions ---
let enemyHP = 100;
let enemyMaxHP = 100;
function setEnemy(name, maxHP) {
    enemyMaxHP = maxHP;
    enemyHP = maxHP; // start full
    document.getElementById("enemyName").innerText = `${name}`;
    updateEnemyBar();
}
function updateEnemyBar() {
    const bar = document.getElementById('enemyBar');
    let percent = (enemyHP / enemyMaxHP) * 100;
    if (percent < 0) percent = 0;
    if (percent > 100) percent = 100;
    bar.style.width = percent + "%";
}
function damageEnemy(amount) {
    enemyHP -= amount;
    if (enemyHP < 0) enemyHP = 0;
    updateEnemyBar();
}
function healEnemy(amount) {
    enemyHP += amount;
    if (enemyHP > enemyMaxHP) enemyHP = enemyMaxHP;
    updateEnemyBar();
}
function generateRanNum(min, max) {
  const rand = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
  return Math.floor(rand * (max - min + 1)) + min;
}
async function keyPress(validInputs) {
  return new Promise(resolve => {
    function handler(e) {
      const input = e.key?.toLowerCase() || e.target?.value?.toLowerCase();
      if (validInputs.includes(input)) {
        document.removeEventListener("keydown", handler);
        resolve(input);
      }
    }
    document.addEventListener("keydown", handler);
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
        queue.remove(id); // remove from queue before resolving
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
    if (el.textContent === text) return resolve();
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
// --- Choices Function ---
function choices(text, speed = 120) {
  return new Promise(resolve => {
    const el = document.getElementById("choices");
    if (!el) return resolve();
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
  const playerMove = await choiceBG();
  oldPaper()
  const computerMove = findChoices();
  return {
    rChoice: () => computerMove,
    pChoice: () => playerMove
  };
}
function compare(pc, bc) {
  if (pc === bc) return "tie";
  if (pc === null) return false;
  if (bc === null) return true;
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
async function outCome(outcome, enemy) {
  let id;
  switch (enemy) {
    case "Goblin": id = 0; break;
    case "Wanderer": id = 1; break;
    case "Mini Boss": id = 2; break;
    case "Boss": id = 3; break;
    default: id = -1;
  }

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
    await writer(`You lost against a ${enemy} Enemy HP: ${ehp}/${mhp}`);
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
    await outCome(null, enemyName);
    setEnemy(enemyName, mhp)

    const pick = pickChoice();
    const playerChoices = findChoices(); // returns something like ["r","p","s"]
    const index = weightedRandom(weights);
    const playerFav = playerChoices[index];
    const counter = { r: "p", p: "s", s: "r" };
    const aiPick = counter[playerFav];
    const pChoice = await pick.pChoice();
    const outcome = compare(pChoice, aiPick);

    await outCome(outcome, enemyName);

    // Repeat fight only if it's a tie or player loses (no HP involved)
    if (outcome === false || outcome === "tie") {
      if (outcome === false && ehp < mhp) {
        healEnemy(1)
      }
      await this.fight(enemyName, weights);
    }
    // Optional: announce win
    if (outcome === true) {
      if (Math.max(0, ehp - 1) === 0) {
        await writer(`You defeated the enemy!`, 120);
      } else {
        await writer(`You won! Enemy HP: ${ehp - 1}/${mhp}`);
        damageEnemy(1)
        await this.fight(enemyName, weights, ehp - 1, mhp)
      }
    }
  },

  3: async function() { // Boss
    await this.fight("Boss", [60, 30, 10], 5, 5);
  },
  2: async function() { // Mini Boss
    await this.fight("Mini Boss", [55, 30, 15], 3, 3);
  },
  1: async function() { // Wanderer
    await this.fight("Wanderer", [50, 35, 15], 2, 2);
  },
  0: async function() { // Goblin
    await this.fight("Goblin", [40, 40, 20], 1, 1);
  },
}
// --- New Room ---
async function newRoom() {
  if (Room.get() === 0) Room.set(1);
  const enemyChance = [
    Math.min(Room.get() * 6, 75), // Goblin
    Math.min(Room.get() * 5, 70), // Wanderer
    Math.min(Room.get() * 4, 60), // Mini Boss
    Math.min(Room.get() * 2, 40)  // Boss
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
