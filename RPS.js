// Fate of Fists made by Mukilan M.
// Inspired by A Dark Room by DoubleSpeak Games and Hades by Supergiant Games
import { showToast, choiceBG, oldPaper, draw } from "./stuff.js";

// --- Room Tracker ---
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
// --- Player HP ---
const hp = (() => {
  let hpVal = 5;
  let maxHP = 5;
  const hpS = document.getElementById("hp");
  const api = {
    get: () => hpVal,
    set: (val) => {
      if (typeof val === 'number') hpVal = val;
      hpS.textContent = `HP: ${hpVal}/${maxHP}`;
    },
    getMax: () => maxHP,
    setMax: (val) => {
      if (typeof val === 'number') maxHP = val;
      hpS.textContent = `HP: ${hpVal}/${maxHP}`;
    }
  };
  return Object.freeze(api);
})();
hp.set(5);
// --- Queue System ---
const queue = (() => {
  const arr = [];
  return Object.freeze({
    add: (val) => {
      if (arr.includes(val)) return false;
      arr.push(val);
      return arr.length - 1;
    },
    get: () => [...arr],
    remove: (id) => {
      const i = arr.indexOf(id);
      if (i !== -1) arr.splice(i, 1);
    },
    clear: () => (arr.length = 0),
  });
})();
// --- Game Database ---
const GameDB = (() => {
  const db = [];
  const valid = ["r", "p", "s"];
  return Object.freeze({
    add: (val) => { if (valid.includes(val)) db.push(val); },
    get: () => [...db],
    clear: () => (db.length = 0),
  });
})();
// --- Misc Globals ---
let save = {};
let load = {};
Object.freeze(save);
Object.freeze(load);
// --- Enemy Bar ---
let enemyHP = 100;
let enemyMaxHP = 100;
function setEnemy(name, maxHP) {
  enemyMaxHP = maxHP;
  enemyHP = maxHP;
  document.getElementById("enemyName").innerText = name;
  updateEnemyBar();
}
function updateEnemyBar() {
  const bar = document.getElementById("enemyBar");
  let percent = Math.max(0, Math.min(100, (enemyHP / enemyMaxHP) * 100));
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
// --- Utilities ---
function generateRanNum(min, max) {
  const rand = crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32;
  return Math.floor(rand * (max - min + 1)) + min;
}
async function keyPress(validInputs) {
  return new Promise(resolve => {
    function handler(e) {
      const input = e.key?.toLowerCase();
      if (validInputs.includes(input)) {
        document.removeEventListener("keydown", handler);
        resolve(input);
      }
    }
    document.addEventListener("keydown", handler);
  });
}
// --- Queue ID ---
async function queueID() {
  return new Promise(resolve => {
    let id = generateRanNum(0, 100);
    while (queue.add(id) === false) id = generateRanNum(0, 100);
    function checkQueue() {
      if (queue.get()[0] === id) {
        queue.remove(id);
        resolve(id);
      } else setTimeout(checkQueue, 50);
    }
    checkQueue();
  });
}
// --- Writer + Choices ---
function writer(text, speed = 60) {
  return new Promise(resolve => {
    const el = document.getElementById("writer");
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
function choices(text, speed = 60) {
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
  const counts = { r: 0, p: 0, s: 0 };
  for (let choice of GameDB.get()) {
    if (counts.hasOwnProperty(choice)) counts[choice]++;
  }
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const maxCount = sorted[0][1];
  const topChoices = sorted.filter(([_, c]) => c === maxCount).map(([ch]) => ch);
  return topChoices.length ? topChoices : ["r", "p", "s"];
}
async function pickChoice() {
  const playerMove = await choiceBG();
  oldPaper();
  const computerMove = findChoices();
  return {
    rChoice: () => computerMove,
    pChoice: () => playerMove,
  };
}
function compare(pc, bc) {
  if (pc === bc) return "tie";
  const outcomes = {
    r: { r: "tie", p: false, s: true },
    p: { r: true, p: "tie", s: false },
    s: { r: false, p: true, s: "tie" },
  };
  return outcomes[pc]?.[bc];
}

function weightedRandom(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let rand = Math.random() * total;
  for (let i = 0; i < weights.length; i++) {
    rand -= weights[i];
    if (rand <= 0) return i;
  }
  return weights.length - 1;
}
// --- Outcome ---
async function outCome(outcome, enemy, ehp, mhp) {
  switch (outcome) {
    case true:
      if (hp.get() < hp.getMax()) hp.set(hp.get() + 1);
      await writer(`You won against a ${enemy}! Enemy HP: ${ehp}/${mhp}`);
      break;
    case false:
      hp.set(hp.get() - 1);
      if (hp.get() <= 0) {
        await writer(`You died against a ${enemy}. Game Over!`);
        Room.set(0);
      } else {
        await writer(`You lost against a ${enemy}. Your HP: ${hp.get()}/${hp.getMax()}`);
      }
      break;
    case "tie":
      await writer(`It's a tie! Enemy HP: ${ehp}/${mhp}`);
      break;
    default:
      await writer(`A ${enemy} challenges you. Enemy HP: ${ehp}/${mhp}`);
  }
}
// --- Enemies ---
const enemies = {
  async fight(enemyName, weights, ehp, mhp) {
    await queueID();
    await outCome(null, enemyName, ehp, mhp);
    setEnemy(enemyName, mhp);

    const pick = await pickChoice();
    const playerChoices = findChoices();
    const index = weightedRandom(weights);
    const playerFav = playerChoices[index];
    const counter = { r: "p", p: "s", s: "r" };
    const aiPick = counter[playerFav];
    const pChoice = pick.pChoice();
    const outcome = compare(pChoice, aiPick);

    await outCome(outcome, enemyName, ehp, mhp);

    if (outcome === false || outcome === "tie") {
      if (outcome === false && ehp < mhp) healEnemy(1);
      return this.fight(enemyName, weights, ehp, mhp);
    }

    if (outcome === true) {
      if (ehp - 1 <= 0) {
        await writer(`You defeated the enemy!`);
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
    await enemies[enemyID]();
  }

  if (hp.get() > 0) {
    await new Promise(res => setTimeout(res, 500));
    Room.set(Room.get() + 1);
    await newRoom();
  }
}

newRoom();
