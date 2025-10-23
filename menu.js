// --- GLOBAL CONSTANTS ---
const PROFILE_STORAGE_KEY = 'fof_profiles';

// --- GLOBAL DOM REFERENCES ---
const loadingSection = document.getElementById('loading-section');
const profileSection = document.getElementById('profile-section');
const menuSection = document.getElementById('menu-section');
const profileListEl = document.getElementById('profile-list');
const newProfileNameInput = document.getElementById('new-profile-name');
const noProfilesEl = document.getElementById('no-profiles');
const currentProfileNameEl = document.getElementById('current-profile-name');
const deleteProfileNameEl = document.getElementById('delete-profile-name');
let CURRENT_PROFILE_KEY = null;

// --- STATE VARIABLE ---
let currentProfile = null; 

// ===============================================
// I. UI & VIEW MANAGEMENT
// ===============================================

/**
 * Switches the active view/screen.
 * @param {string} viewName 'profile' or 'menu'
 */
function switchView(viewName) {
    // Hide all sections first
    [loadingSection, profileSection, menuSection].forEach(el => el.classList.add('hidden'));

    if (viewName === 'profile') {
        profileSection.classList.remove('hidden');
        loadProfiles();
    } else if (viewName === 'menu') {
        menuSection.classList.remove('hidden');
        currentProfileNameEl.textContent = currentProfile ? currentProfile.profileName : 'Unknown Hero';
        deleteProfileNameEl.textContent = currentProfile ? currentProfile.profileName : 'Unknown Hero';
    } else if (viewName === 'loading') {
        loadingSection.classList.remove('hidden');
    }
}

/**
 * Helper function to show a friendly, non-blocking toast notification.
 * @param {string} text The text to display.
 * @param {string} color A valid hex or Tailwind color.
 */
function showToast(text, color = '#3a2c1c') {
    Toastify({ 
        text: text, 
        duration: 3000, 
        style: { 
            background: color,
            fontFamily: 'monospace',
            borderRadius: '8px'
        },
        gravity: "bottom", 
        position: "right", 
    }).showToast();
}


// ===============================================
// II. LOCAL STORAGE & PROFILE MANAGEMENT
// ===============================================

/** Generates a simple pseudo-UUID for profile IDs. */
function generateUUID() {
    return 'xxxx-xxxx-4xxx-yxxx-xxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/** Loads all profiles from localStorage. Returns an object of profiles. */
function getProfiles() {
    try {
        const data = localStorage.getItem(PROFILE_STORAGE_KEY);
        return data ? JSON.parse(data) : {};
    } catch (e) {
        console.error("Error loading profiles from local storage:", e);
        return {};
    }
}

/** Saves the full profiles object back to localStorage. */
function saveProfiles(profiles) {
    try {
        localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
    } catch (e) {
        console.error("Error saving profiles to local storage:", e);
        showToast("Error saving data!", '#cc3333');
    }
}

/**
 * Loads and displays profiles for the user.
 */
function loadProfiles() {
    profileListEl.innerHTML = '';
    const profiles = getProfiles();
    const profileArray = Object.values(profiles);
    
    if (profileArray.length === 0) {
        noProfilesEl.classList.remove('hidden');
        return;
    }

    noProfilesEl.classList.add('hidden');
    
    profileArray.forEach(data => {
        const room = data.room || 1;
        const hp = data.playerHP || 5;
        const maxHP = data.playerMaxHP || 5;
        
        const profileCard = document.createElement('div');
        profileCard.className = 'profile-card flex justify-between items-center p-3 bg-white rounded-lg shadow-sm border border-parchment/50 cursor-pointer hover:bg-parchment/20 transition-all';
        profileCard.setAttribute('data-id', data.id);
        profileCard.innerHTML = `
            <div>
                <p class="font-bold text-lg">${data.profileName}</p>
                <p class="text-sm text-ink/70">Last Save: Room ${room} | HP: ${hp}/${maxHP}</p>
            </div>
        `;
        
        profileCard.addEventListener('click', () => selectProfile(data.id, data));
        profileListEl.appendChild(profileCard);
    });
}

function selectProfile(profileId, data) {
    currentProfile = data;
    CURRENT_PROFILE_KEY = profileId;
    
    document.querySelectorAll('.profile-card').forEach(card => card.classList.remove('selected'));

    const selectedCard = document.querySelector(`.profile-card[data-id="${profileId}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    setTimeout(() => {
        showToast(`Profile selected: ${data.profileName}`, '#007bff');
        switchView('menu');
    }, 300);
}
function createNewProfile() {
    const name = newProfileNameInput.value.trim();

    if (!name) {
        showToast("Please enter a character name.", '#cc3333');
        return;
    }
    if (name.length > 20) {
        showToast("Name is too long (max 20 characters).", '#cc3333');
        return;
    }

    const profiles = getProfiles();
    const profileId = generateUUID();

    const newProfileData = {
        id: profileId,
        profileName: name,
        room: 1,
        playerHP: 5,
        playerMaxHP: 5,
        inRun: false,
        gameDB: [],
        upgrades: {"Extra HP": 0, "Extra DMG": 0, "Shadow Clone": 0},
        coins: 0,
    };

    profiles[profileId] = newProfileData;
    saveProfiles(profiles);
    newProfileNameInput.value = '';
    loadProfiles(); 
    selectProfile(profileId, newProfileData);
}

function deleteCurrentProfile() {
    if (!currentProfile || !currentProfile.id) {
        showToast("No profile is currently selected for deletion.", '#cc3333');
        return;
    }

    if (confirm(`Are you sure you want to permanently delete the profile '${currentProfile.profileName}'? This cannot be undone.`)) {
        const profiles = getProfiles();
        delete profiles[currentProfile.id];
        saveProfiles(profiles);

        showToast(`Profile '${currentProfile.profileName}' deleted.`, '#cc3333');
        currentProfile = null;
        switchView('profile');
    }
}

// ===============================================
// III. EVENT HANDLERS & INITIALIZATION
// ===============================================

function handleStartGameClick() {
    window.location.replace(`https://dustysoul1-alt.github.io/RPS_Game/game?profileKey=${CURRENT_PROFILE_KEY}&storageKey=${localStorage.getItem(CURRENT_PROFILE_KEY)}`)
}
function upgradeHall() {
    window.location.replace(`https://dustysoul1-alt.github.io/RPS_Game/hall?profileKey=${CURRENT_PROFILE_KEY}&storageKey=${localStorage.getItem(CURRENT_PROFILE_KEY)}`)
}

document.getElementById('create-profile-btn').addEventListener('click', createNewProfile);
document.getElementById('start-game-btn').addEventListener('click', handleStartGameClick);
document.getElementById('change-profile-btn').addEventListener('click', () => switchView('profile'));
document.getElementById('delete-profile-btn').addEventListener('click', deleteCurrentProfile);
document.getElementById('upgrade-hall-btn').addEventListener('click', upgradeHall)

switchView('loading');
setTimeout(() => {
    switchView('profile');
}, 500);