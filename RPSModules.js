// Modules for Fate of the Fists game

// Database
const db = [];
// Allowed Chars
const choiceChars = ["r", "p", "s"];
const ynChars = ["y", "n"];
const menuChars = ["s", "p", "c"];
const stRoomChars = ["s", "e", "c"];
// Functions
function saveData(profile, data) {
  const saveKey = profile;
  const saveData = [data, db];
  localStorage.setItem(profile, JSON.stringify())
}
function loadData(profile) {
    const data = JSON.parse(localStorage.getItem(profile));
    db.push(...data[1]);
    return data[0];
}
function generateRanNum(min, max) {
    min = Math.ceil(min);
    max = Math.ceil(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function findChoices() {
    if (!Array.isArray(db)) { return; }

    let counts = { r: 0, p: 0, s: 0 };

    for (let choice of db) {
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
function pickChoice(choice) {
  const pChoice = choice.RPS();
  if (!choiceChars.includes(choice)) { return };
  const returnC = {
    rChoice: function() { return choice; },
    pChoice: function() { return pChoice }
  };
  return returnC;
}
function RPS(returnC) {
  if (!returnC.rChoice() || !returnC.pChoice()) { return }
  const pC = returnC.pChoice();
  const bC = returnC.rChoice();
  return compare(pC, bC);
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
const choice = {
  menu: function() {
    let c = prompt("Choose: s for start, p for changing profile, c for credits").toLowerCase();
    if (!c) return;
    if (!menuChars.includes(c)) return;
    return c;
  },
  yOrN: function() {
    let c = prompt("Choose: y for yes, n for no").toLowerCase();
    if (!c) return;
    if (!ynChars.includes(c)) return;
    return c;
  },
  RPS: function() {
    let c = prompt("Choose: r for rock, p for paper, s for scissors").toLowerCase();
    if (!c) return;
    if (!choiceChars.includes(c)) return;
    db.push(c);
    return c;
  },
  stRoom: function() {
    let c = prompt("Choose: S for start, E for Menu, C for quit").toLowerCase();
    if (!c) return;
    if (!choiceChars.includes(c)) return;
    return c;
  }
};
const menuC = {
  menu: function(newRoom) {
    const menuChoice = choice.menu();
    if (menuChoice === "s") { newRoom(); }
    if (menuChoice === "p") { menuC.changeProfile(); }
    if (menuChoice === "c") { menuC.credits(); }
  },
  changeProfile: function(profiles) {
    if (!profiles.get() || !profiles.set()) return;
    let profilesList = profiles.get();
    const profile = prompt("Enter profile name(Case sensitive):");
    if (profilesList.includes(profile)) {
        console.log("Profile found");
    } else () => {
        console.log("Profile not found, creating new profile");
        profiles.set(profile);
        profilesList = profiles.get();
    }
    return profile;
  },
  credits: function() {
    console.log("credits")
  }
};
const enimies = {
  // Starting Room
  startRoom: function(Room, newRoom) {
    const menuChoice = choice.stRoom();
    if (menuChoice === "s") { Room.set(1); newRoom(); }
    if (menuChoice === "e") { menuC.menu(); }
    if (menuChoice === "c") { return; }
  },
  // Boss
  3: function() {
    const playerC = choice.RPS();
    const botC = choiceChars[weightedRandom([33, 33, 33])];
    return compare(playerC, botC);
  },
  // Mini Boss
  2: function() {
    const playerC = choice.RPS();
    const botC = choiceChars[weightedRandom([45, 30, 25])];
    return compare(playerC, botC);
  },
  // Wanderer
  1: function() {
    const playerC = choice.RPS();
    const botC = choiceChars[weightedRandom([30, 45, 25])];
    return compare(playerC, botC);
  },
  // Hammer
  0: function() {
    const playerC = choice.RPS();
    const botC = choiceChars[weightedRandom([25, 30, 45])];
    return compare(playerC, botC);
  }
};



// Export
export { saveData, loadData, generateRanNum, findChoices, pickChoice, RPS, compare, weightedRandom, choice, menuC, enimies };