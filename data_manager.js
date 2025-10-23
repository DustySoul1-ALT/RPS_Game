// --- LOCAL STORAGE KEYS (Must match the keys used in menu.js) ---
export let PROFILE_STORAGE_KEY = 'fof_profiles';
export let CURRENT_PROFILE_KEY = 'fof_current_profile_id';

// --- DATA ACTION TYPES ---
export const DATA_ACTION = {
    LOAD: 'load', // Action to retrieve the current profile
    SAVE: 'save'  // Action to overwrite the current profile data
};

// *************************************************************
// 1. THIS is where you store the object. 
// It is accessible by all functions in this file.
// *************************************************************
export let activePlayerProfile = null; 

// ===============================================
// CORE DATA MANAGEMENT FUNCTION
// ===============================================

/**
 * Manages loading and saving of the current active profile data using localStorage.
 * This function is the single entry point for all game data interactions.
 * * @param {string} action Must be either DATA_ACTION.LOAD or DATA_ACTION.SAVE.
 * @param {Object} [profileDataToSave=null] The profile object to save (only needed for SAVE action).
 * @returns {Object|null} The loaded profile object for the LOAD action, or null on failure.
 */
export function manageProfileData(action, profileDataToSave = null) {
    
    try {
        // 1. Get the ID of the profile the user selected on the menu page.
        const activeProfileId = localStorage.getItem(CURRENT_PROFILE_KEY);
        if (!activeProfileId) {
            console.error("Data action failed: No active profile ID found in local storage. Returning to menu.");
            // Note: In a real game, you would redirect to the menu here.
            return null;
        }

        // 2. Load ALL profiles from the main storage key.
        const allProfilesData = localStorage.getItem(PROFILE_STORAGE_KEY);
        let profiles = allProfilesData ? JSON.parse(allProfilesData) : {};
        
        
        if (action === DATA_ACTION.LOAD) {
            // --- LOAD LOGIC ---
            const profileToLoad = profiles[activeProfileId];
            if (profileToLoad) {
                console.log(`Profile Loaded: ${profileToLoad.profileName}, Room ${profileToLoad.room}`);
                
                // CRITICAL: Set the module-scoped variable for the rest of the game script
                activePlayerProfile = profileToLoad; 
                
                return profileToLoad; // Return the object for immediate use
            } else {
                console.error("Load failed: Profile data not found for ID:", activeProfileId);
                return null;
            }

        } else if (action === DATA_ACTION.SAVE) {
            // --- SAVE LOGIC ---
            if (!profileDataToSave || profileDataToSave.id !== activeProfileId) {
                console.error("Save failed: Mismatched or invalid profile data provided for saving.");
                return;
            }
            
            // 3. Update the specific profile within the collection
            profiles[activeProfileId] = profileDataToSave; 
            
            // 4. Save the entire collection back to localStorage
            localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profiles));
            console.log(`Progress Saved for '${profileDataToSave.profileName}'.`);
            
        } else {
            console.error("Invalid data action specified:", action);
        }

    } catch (e) {
        console.error("General data management error:", e);
        return null;
    }
}

// Renaming and exposing the function using your requested signature format (simplified)
/**
 * Primary game data access function.
 * * @param {string} typeD Action type: DATA_ACTION.LOAD or DATA_ACTION.SAVE.
 * @param {Object} [profileData] Required only for SAVE action, the updated profile object.
 * @returns {Object|null} Loaded profile object for LOAD action, or undefined/null.
 */
export function data(typeD, profileData = null) {
    // We only need the action type and optionally the data to save.
    // The profile ID is determined internally using CURRENT_PROFILE_KEY.
    return manageProfileData(typeD, profileData);
}
