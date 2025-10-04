import { saveData, loadData, generateRanNum, findChoices, pickChoice, RPS, compare, weightedRandom, choice, menuC, enimies, newRoom } from './RPSModules.js';

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

// Start Game
menuC.menu(Profiles);