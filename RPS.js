import { saveData, loadData, generateRanNum, findChoices, pickChoice, RPS, compare, weightedRandom, choice, menuC, enimies } from './RPSModules.js';

// Fate of Fists made by Mukilan M.
// Inspiried by A Dark Room by DoubleSpeak Games("https://adarkroom.doublespeakgames.com/")

// Game Vars with Closures
const Room = (() => {
  let roomNum = 0; // private
  return {
    get: () => roomNum,
    set: (val) => { if (typeof val === 'number') roomNum = val; }
  };
})();
const Profiles = (() => {
  const profiles = []; // private
  return {
    get: () => profiles,
    set: (val) => { if (typeof val === 'object') profiles.push(val); },
  };
})();
const hp = (() => {
  let hpVal = 0; // private
  return {
    get: () => hpVal,
    set: (val) => { if (typeof val === 'number') hpVal = val; }
  };
})();

function newRoom() {
  if (Room.get() === 0) return;
  // Pick an enemy ID using weighted randomness
  let enemyID = weightedRandom([
    Room.get() * 2,   // Hammer
    Room.get() * 5,   // Wanderer
    Room.get() * 10,  // Mini Boss
    Room.get() * 25   // Boss
  ]);
  // Call the enemy’s function
  enimies[enemyID]();
  // Move to the next room
  Room.set(Room.get() + 1);
}


menuC.menu(newRoom, Profiles);