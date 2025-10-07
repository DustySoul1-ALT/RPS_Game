// Fate of Fists made by Mukilan M.
// Inspiried by A Dark Room by DoubleSpeak Games("https://adarkroom.doublespeakgames.com/")

// Game Vars with Closures
const Room = (() => {
  let roomNum = 0; // private
  const roomInd = document.getElementById("room")
  const api = {
    get: () => roomNum,
    set: (val) => {
      if (typeof val === 'number') roomNum = val;
      roomInd.textContent = "Room:" + roomNum;
    }
  }
  return Object.freeze(api);
})();
Room.set(0);
const Profiles = (() => {
  const profiles = []; // private
  const api = {
    get: () => profiles,
    set: (val) => { if (typeof val === 'object') profiles.push(val); },
  };
  return Object.freeze(api);
})();
const hp = (() => {
  let hpVal = 5; // private
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
const queue = (() => {
  const queue = [];
  return Object.freeze({
    add: (val) => {
      if (queue.find(val)) {
        return false;
      } else {
        queue.push(val)
      }
    },
    get: () => [...queue], // return a copy, not the actual array
    remove: (id) => {
      const index = db.indexOf(id);
      if (index !== -1) db.splice(index, 1);
    },
    clear: () => queue.length = 0,
  });
})();
// Database
const GameDB = (() => {
  const db = [];
  return Object.freeze({
    add: (val) => { if (choiceChars.includes(val)) db.push(val); },
    get: () => [...db], // return a copy, not the actual array
    clear: () => db.length = 0,
  });
})();
// Allowed Chars
const choiceChars = ["r", "p", "s"];
const ynChars = ["y", "n"];
const menuChars = ["s", "p", "c"];
const stRoomChars = ["s", "e", "c"];
// Functions
function encodeData(str) {
  return btoa(encodeURIComponent(str));
}
function decodeData(str) {
  return decodeURIComponent(atob(str));
}
async function hashString(str) {
  const buf = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest("SHA-256", buf);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}
async function saveData(profile, data) {
  if (typeof profile !== "string" || !profile.trim()) return;
  if (typeof data !== "object") return;

  const payload = {
    version: 1,
    timestamp: Date.now(),
    data,
  };

  const json = JSON.stringify(payload);
  const encoded = encodeData(json);
  const hash = await hashString(encoded); // checksum

  const final = JSON.stringify({
    hash,
    encoded,
  });

  localStorage.setItem(profile, final);
}
async function loadData(profile) {
  const raw = localStorage.getItem(profile);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed.hash || !parsed.encoded) throw new Error("Invalid format");

    const calcHash = await hashString(parsed.encoded);
    if (calcHash !== parsed.hash) throw new Error("Data integrity check failed");

    const decoded = decodeData(parsed.encoded);
    const payload = JSON.parse(decoded);

    if (payload.version !== 1 || typeof payload.data !== "object") {
      throw new Error("Invalid save file");
    }

    return payload.data;
  } catch (e) {
    console.error("Corrupted or tampered save file:", e);
    return null;
  }
}
function tween(v1, v2, time) {
  let val = v1 - v2;
  let rate = val / time;
  while (Math.abs(v1 - v2) > 0.001) {
    if (v1 > v2) {
      val = val + rate;
      v2 = val;
    }
    if (v1 < v2) {
      val = val - rate;
      v2 = val;
    }
  }
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
async function queueID() {
  return new Promise(resolve => {
    let id = generateRanNum(0, 100);
    let pos = queue.add(id);

    if (pos === false) {
      id = generateRanNum(0, 100);
      pos = queue.add(id);
    }

    function checkQueue() {
      const queueDB = queue.get();
      if (queueDB[0] === id) {
        resolve(id); // success
      } else {
        setTimeout(checkQueue, 50); // check again later, don’t block
      }
    }

    checkQueue();
  });
}
function writer(text, speed = 60) {
  return new Promise((resolve) => {
    const el = document.getElementById("writer");
    if (!el || typeof text !== "string") {
      console.error("Text or writer element not present");
      return resolve(); // resolve anyway to avoid hanging
    }

    el.textContent = "";
    let i = 0;

    function type() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        resolve(); // ✅ done typing
      }
    }

    type();
  });
}
function choices(text, speed = 60) {
  return new Promise((resolve) => {
    const el = document.getElementById("choices");
    if (!el || typeof text !== "string") {
      console.error("Text or writer element not present");
      return resolve(); // resolve anyway to avoid hanging
    }

    el.textContent = "";
    let i = 0;

    function type() {
      if (i < text.length) {
        el.textContent += text.charAt(i);
        i++;
        setTimeout(type, speed);
      } else {
        resolve(); // ✅ done typing
      }
    }

    type();
  });
}
function generateRanNum(min, max) {
  const rand = crypto.getRandomValues(new Uint32Array(1))[0] / 2**32;
  return Math.floor(rand * (max - min + 1)) + min;
}
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
    while (top3.length < 3) {
        let pick = pickRandomTie(remaining);
        top3.push(pick);
        remaining = remaining.filter(([choice]) => choice !== pick);
    }
    return top3;
}
function pickChoice() {
  choices("Press one of the following keys: R for rock, P for paper, S for scissors")
  const pChoice = keyPress(choiceChars);
  return {
    rChoice: function() { return findChoices(); },
    pChoice: function() { return pChoice; }
  };
}
function compare(pc, bc) {
  if (pc === bc) return "tie";
  if (pc === null) return false; // player loses if they didn’t pick
  if (bc === null) return true;  // player wins if bot didn’t pick
  const outcomes = {
    r: { r: "tie", p: false, s: true },
    p: { r: true, p: "tie", s: false },
    s: { r: false, p: true, s: "tie" }
  };
  return outcomes[pc][bc];
}
function weightedRandom(weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  const rand = Math.random() * total; // scale to total instead of 100

  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) return i;
  }
  return weights.length - 1; // fallback to last index
}
async function outCome(outcome, enemy) {
  let id;
  switch (enemy) {
    case "Goblin":
      id = 0;
      break;
    case "Wanderer":
      id = 1;
      break;
    case "Mini Boss":
      id = 2;
      break;
    case "Boss":
      id = 3;
      break;
    default:
      id = -1;
  }
  if (outcome === true) {
    if (hp.get() < hp.getMax()) {
      hp.set(hp.get() + 1);
      await writer(`You won against a ${enemy}! You gained 1 HP. Current HP: ${hp.get()}`, 60);
    }
    if (hp.get() === hp.getMax) {
      await writer('You won against a ' + enemy + '! But you are already at max hp. ' + hp.get() + '/' + hp.getMax())
    }
  } else if (outcome === false) {
    hp.set(hp.get() - 1);
    if (hp.get() > 0) {
      await writer(`You lost against a ${enemy}! You lost 1 HP. Current HP: ${hp.get()}`);
    }
    if (hp.get() === 0) {
      await writer(`You lost against a ${enemy} and have 0 HP left. You have died. Game Over!`, 60);
      Room.set(0);
    }
  } else if (outcome === "tie") {
    await writer(`It's a tie! No HP lost or gained. Current HP: ${hp.get()}`);
    enimies[id]();
  } else if (outcome === null) {
    await writer(`A ${enemy} challenges you. Current HP: ${hp.get()}`, 60);
  }
}
const enimies = {
  // Boss
  3: async function() {
    await queueID();
    await outCome(null, "Boss");
    const pick = pickChoice();
    const choice = pick.rChoice()[weightedRandom([33, 33, 33])];
    const pChoice = await pick.pChoice();
    const outcome = compare(pChoice, choice);
    await outCome(outcome, "Boss");
  },
  // Mini Boss
  2: async function() {
    await queueID();
    await outCome(null, "Mini Boss");
    const pick = pickChoice();
    const choice = pick.rChoice()[weightedRandom([34, 34, 32])];
    const pChoice = await pick.pChoice();
    const outcome = compare(pChoice, choice);
    await outCome(outcome, "Mini Boss");
  },
  // Wanderer
  1: async function() {
    await queueID();
    await outCome(null, "Wanderer");
    const pick = pickChoice();
    const choice = pick.rChoice()[weightedRandom([32, 35, 33])];
    const pChoice = await pick.pChoice();
    const outcome = compare(pChoice, choice);
    await outCome(outcome, "Wanderer");
  },
  // Goblin
  0: async function() {
    await queueID();
    await outCome(null, "Goblin");
    const pick = pickChoice();
    const choice = pick.rChoice()[weightedRandom([32, 33, 35])];
    const pChoice = await pick.pChoice();
    const outcome = compare(pChoice, choice);
    await outCome(outcome, "Goblin");
  },
}
async function newRoom() {
  if (Room.get() === 0) {
    Room.set(1);
  }
  const enemyChance = {
    boss: function() {
      return Math.min(Room.get() * 2, 50);
    },
    miniBoss: function() {
      return Math.min(Room.get() * 4, 60);
    },
    wanderer: function() {
      return Math.min(Room.get() * 5, 70);
    },
    goblin: function() {
      return Math.min(Room.get() * 6, 75);
    },
  }
  const enemyNum = generateRanNum(1, Math.min(Room.get(), 10));
  
  for (let i = 0; i < enemyNum; i++) {
    const pick = weightedRandom([
      enemyChance.goblin(), 
      enemyChance.wanderer(), 
      enemyChance.miniBoss()
    ]);
    await enimies[pick]();
  }
  setTimeout(newRoom, 500)
}

newRoom();