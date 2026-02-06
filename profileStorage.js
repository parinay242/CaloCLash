/**
 * Multi-profile storage helper
 * Migrates legacy single-user data to profiles format
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const PROFILES_KEY = 'caloclash_profiles';
const ACTIVE_PROFILE_KEY = 'caloclash_activeProfileId';
const STORAGE_VERSION_KEY = 'caloclash_storageVersion';

const DEFAULT_GAMIFICATION = {
  points: 0,
  level: 1,
  streak: 0,
  lastLogDate: null,
  badges: [],
  totalMealsLogged: 0,
};

const generateProfileId = () => 'profile_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

/**
 * Migrate legacy single-user data to profiles format
 */
export const migrateFromLegacy = async () => {
  try {
    const version = await AsyncStorage.getItem(STORAGE_VERSION_KEY);
    if (version === '2') return; // Already migrated

    const userData = await AsyncStorage.getItem('userData');
    const userPlan = await AsyncStorage.getItem('userPlan');
    
    if (!userData || !userPlan) {
      await AsyncStorage.setItem(STORAGE_VERSION_KEY, '2');
      return;
    }

    const today = new Date().toDateString();
    const savedMeals = await AsyncStorage.getItem('todayMeals');
    const lastSaveDate = await AsyncStorage.getItem('lastSaveDate');
    const savedGamification = await AsyncStorage.getItem('gamification');
    const savedWaterIntake = await AsyncStorage.getItem('waterIntake');
    const savedWaterDate = await AsyncStorage.getItem('waterIntakeDate');
    const savedFavoriteMeals = await AsyncStorage.getItem('favoriteMeals');

    let parsedUserData, parsedPlan;
    try {
      parsedUserData = JSON.parse(userData);
      parsedPlan = JSON.parse(userPlan);
    } catch (e) {
      console.error('Migration parse error:', e);
      await AsyncStorage.setItem(STORAGE_VERSION_KEY, '2');
      return;
    }
    const safeParse = (str, fallback) => {
      try { return str ? JSON.parse(str) : fallback; } catch { return fallback; }
    };
    const profile = {
      id: generateProfileId(),
      name: parsedUserData.name || 'My Profile',
      userData: parsedUserData,
      plan: parsedPlan,
      todayMeals: safeParse(savedMeals, []),
      lastSaveDate: lastSaveDate || today,
      gamification: { ...DEFAULT_GAMIFICATION, ...safeParse(savedGamification, {}) },
      waterIntake: savedWaterIntake ? parseInt(savedWaterIntake, 10) : 0,
      waterIntakeDate: savedWaterDate || today,
      favoriteMeals: safeParse(savedFavoriteMeals, []),
    };

    const profiles = [profile];
    await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
    await AsyncStorage.setItem(STORAGE_VERSION_KEY, '2');

    // Remove legacy keys
    await AsyncStorage.multiRemove([
      'userData', 'userPlan', 'todayMeals', 'lastSaveDate',
      'gamification', 'favoriteMeals', 'waterIntake', 'waterIntakeDate'
    ]);
  } catch (error) {
    console.error('Migration error:', error);
  }
};

export const getProfiles = async () => {
  try {
    const data = await AsyncStorage.getItem(PROFILES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Error parsing profiles:', e);
    return [];
  }
};

export const getActiveProfileId = async () => {
  return await AsyncStorage.getItem(ACTIVE_PROFILE_KEY);
};

export const setActiveProfile = async (profileId) => {
  await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profileId);
};

export const getProfile = async (profileId) => {
  const profiles = await getProfiles();
  return profiles.find(p => p.id === profileId) || null;
};

export const saveProfile = async (profile) => {
  const profiles = await getProfiles();
  const index = profiles.findIndex(p => p.id === profile.id);
  if (index >= 0) {
    profiles[index] = { ...profile, name: profile.userData?.name || profile.name };
  } else {
    profiles.push({ ...profile, name: profile.userData?.name || profile.name });
  }
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
};

export const addProfile = async (userData, plan) => {
  const profile = {
    id: generateProfileId(),
    name: userData.name || 'New Profile',
    userData,
    plan,
    todayMeals: [],
    lastSaveDate: new Date().toDateString(),
    gamification: { ...DEFAULT_GAMIFICATION },
    waterIntake: 0,
    waterIntakeDate: new Date().toDateString(),
    favoriteMeals: [],
  };
  const profiles = await getProfiles();
  profiles.push(profile);
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
  await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, profile.id);
  return profile;
};

export const deleteProfile = async (profileId) => {
  const profiles = await getProfiles();
  const filtered = profiles.filter(p => p.id !== profileId);
  await AsyncStorage.setItem(PROFILES_KEY, JSON.stringify(filtered));
  
  const activeId = await getActiveProfileId();
  if (activeId === profileId && filtered.length > 0) {
    await AsyncStorage.setItem(ACTIVE_PROFILE_KEY, filtered[0].id);
  } else if (filtered.length === 0) {
    await AsyncStorage.removeItem(ACTIVE_PROFILE_KEY);
  }
};
