// Fate of Fists made by Mukilan M.
// Inspiried by A Dark Room by DoubleSpeak Games("https://adarkroom.doublespeakgames.com/")

// Game Vars with Closures
const Room = (() => {
  let roomNum = 0; // private
  const api = {
    get: () => roomNum,
    set: (val) => { if (typeof val === 'number') roomNum = val; }
  }
  return Object.freeze(api);
})();
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
  const api = {
    get: () => hpVal,
    set: (val) => { if (typeof val === 'number') hpVal = val; }
  };
  return Object.freeze(api);
})();
const gameState = (() => {
  let state = null;
  return Object.freeze({
    get: () => state,
    set: (val) => { state = val; }
  });
})

// Modules for Fate of the Fists game

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
  const pChoice = choice.RPS();
  if (!choiceChars.includes(choice)) { return };
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
    hp.set(hp.get() + 1);
    await writer(`You won against a ${enemy}! You gained 1 HP. Current HP: ${hp.get()}`, 60);
    Room.set(Room.get() + 1);
  } else if (outcome === false) {
    hp.set(hp.get() - 1);
    if (hp.get() > 0) {
      await writer(`You lost against a ${enemy}! You lost 1 HP. Current HP: ${hp.get()}`);
    }
    if (hp.get() === 0) {
      await writer(`You lost against a ${enemy} and have 0 HP left. You have died. Game Over! Refresh the page to play again.`, 60);
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
    await outCome(null, "Boss");
    const pick = pickChoice();
    const choice = pick.rChoice()[weightedRandom([33, 33, 33])];
    const outcome = compare(pick.pChoice(), choice);
    await outCome(outcome, "Boss");
  },
  // Mini Boss
  2: async function() {
    await outCome(null, "Mini Boss");
    const pick = pickChoice();
    const choice = pick.rChoice()[weightedRandom([34, 34, 32])];
    const outcome = compare(pick.pChoice(), choice);
    await outCome(outcome, "Mini Boss");
  },
  // Wanderer
  1: async function() {
    await outCome(null, "Wanderer");
    const pick = pickChoice();
    const choice = pick.rChoice()[weightedRandom([32, 35, 33])];
    const outcome = compare(pick.pChoice(), choice);
    await outCome(outcome, "Wanderer");
  },
  // Goblin
  0: async function() {
    await outCome(null, "Goblin");
    const pick = pickChoice();
    const choice = pick.rChoice()[weightedRandom([32, 33, 35])];
    const outcome = compare(pick.pChoice(), choice);
    await outCome(outcome, "Goblin");
  },
}
function newRoom() {
  if (Room.get() === 0) { Room.set(1); }
  const enemyChance = {
    boss: function() {
      let enemyChance = 0;
      if (Room.get() * 2 < 50) {
        enemyChance = Room.get() * 2;
      } else if (Room.get() * 2 > 50) {
        enemyChance = 50;
      }
      return enemyChance;
    },
    miniBoss: function() {
      let enemyChance = 0;
      if (Room.get() * 4 < 60) {
        enemyChance = Room.get() * 4;
      } else if (Room.get() * 2 > 60) {
        enemyChance = 60;
      }
      return enemyChance;
    },
    wanderer: function() {
      let enemyChance = 0;
      if (Room.get() * 5 < 70) {
        enemyChance = Room.get() * 5;
      } else if (Room.get() * 2 > 70) {
        enemyChance = 70;
      }
      return enemyChance;
    },
    goblin: function() {
      let enemyChance = 0;
      if (Room.get() * 6 < 75) {
        enemyChance = Room.get() * 6;
      } else if (Room.get() * 6 > 75) {
        enemyChance = 75;
      }
      return enemyChance;
    },
  };
  enimies[weightedRandom([enemyChance.goblin(), enemyChance.wanderer(), enemyChance.miniBoss(), enemyChance.boss()])]();
}