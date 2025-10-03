const db = [];
const choiceChars = [r, p, s];
const ynChars = [y, n];
const menuChars = [s, p, c];
const stRoomChars = [s, e, c];
let roomNum = 0;

function generateRanNum(min, max) {
    min = Math.ceil(min);
    max = Math.ceil(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
function findChoices(db) {
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
  const rand = Math.random() * 100; // scale to 100

  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (rand < cumulative) return i;
  }

  return null; // leftover chance if rand >= total
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
  menu: function() {
    const menuChoice = choice.menu();
    if (menuChoice === "s") { enimies.startRoom(); }
    if (menuChoice === "p") { menuC.changeProfile(); }
    if (menuChoice === "c") { menuC.credits(); }
  },
  changeProfile: function() {
    console.log("changeProfile")
  },
  credits: function() {
    console.log("credits")
  }
};
const enimies = {
    // Starting Room
    startRoom: function() {
      const menuChoice = choice.stRoom();
      if (menuChoice === "s") { newRoom(); }
      if (menuChoice === "e") { menuC.menu() }
      if (menuChoice === "c") { return; }
    },
    // Boss
    3: function() {
      const choices = findChoices(db);
      const pickC = pickChoice(weightedRandom([33, 33, 33]));
      return RPS(pickC);
    },
    // Mini Boss
    2: function() {
      const choices = findChoices(db);
      const pickC = pickChoice(weightedRandom([45, 30, 25]));
      return RPS(pickC);
    },
    // Wanderer
    1: function() {
      const choices = findChoices(db);
      const pickC = pickChoice(weightedRandom([30, 45, 25]));
      return RPS(pickC);
    },
    // Hammer
    0: function() {
      const choices = findChoices(db);
      const pickC = pickChoice(weightedRandom([25, 30, 45]));
      return RPS(pickC);
    }
}
function newRoom() {
  if(roomNum === 0) return;
  const enemyNum = generateRanNum(1, roomNum);
  let enemyID = weightedRandom([roomNum * 2, roomNum * 5, roomNum * 10, roomNum * 25]);
  enimies[enemyID]();
  roomNum++;
}
menuC.menu();
