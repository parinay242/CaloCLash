import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { getProfile, saveProfile } from './profileStorage';

const { width } = Dimensions.get('window');

const CalorieTracker = ({ route, navigation }) => {
  const profileId = route.params?.profileId;
  const [plan, setPlan] = useState(null);
  const [userData, setUserData] = useState(null);
  const [meals, setMeals] = useState([]);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [currentMeal, setCurrentMeal] = useState({
    name: '',
    calories: '',
    protein: '',
    carbs: '',
    fats: '',
    type: 'breakfast',
  });

  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
  });

  const [gamification, setGamification] = useState({
    points: 0,
    level: 1,
    streak: 0,
    lastLogDate: null,
    badges: [],
    totalMealsLogged: 0,
  });

  const [waterIntake, setWaterIntake] = useState(0);
  const [favoriteMeals, setFavoriteMeals] = useState([]);
  const hasLoadedRef = useRef(false);

  // --- Initial Load ---
  useEffect(() => {
    if (profileId) loadUserData();
  }, [profileId]);

  useEffect(() => {
    calculateDailyTotals();
  }, [meals]);

  useEffect(() => {
    if (profileId && hasLoadedRef.current) saveMealsToStorage();
  }, [meals]);

  const loadUserData = async () => {
    hasLoadedRef.current = false;
    try {
      const profile = await getProfile(profileId);
      if (!profile) {
        navigation.reset({ index: 0, routes: [{ name: 'ProfileSelector' }] });
        return;
      }
      
      setPlan(profile.plan);
      setUserData(profile.userData);
      setFavoriteMeals(profile.favoriteMeals || []);
      
      // Update Streak Logic
      const initialGam = profile.gamification || { points: 0, level: 1, streak: 0, lastLogDate: null, badges: [], totalMealsLogged: 0 };
      const updatedGam = checkAndUpdateStreak(initialGam);
      setGamification(updatedGam);
      
      const today = new Date().toDateString();
      // Water logic
      if (profile.waterIntakeDate === today) {
        setWaterIntake(profile.waterIntake || 0);
      } else {
        setWaterIntake(0);
      }
      
      // Meal logic (Reset daily)
      if (profile.lastSaveDate === today && profile.todayMeals?.length) {
        setMeals(profile.todayMeals);
      } else {
        setMeals([]);
      }
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveMealsToStorage = async () => {
    const today = new Date().toDateString();
    await saveProfileData({ todayMeals: meals, lastSaveDate: today });
  };

  const saveProfileData = async (updates) => {
    if (!profileId) return;
    try {
      const profile = await getProfile(profileId);
      if (profile) {
        await saveProfile({ ...profile, ...updates });
      }
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  // --- Navigation & Management ---
  const handleSwitchProfile = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'ProfileSelector' }],
    });
  };

  const handleCreateNewProfile = () => {
    navigation.navigate('OnboardingSurvey');
  };

  // --- Core Functionality ---
  const checkAndUpdateStreak = (gamData) => {
    const today = new Date().toDateString();
    const lastLog = gamData.lastLogDate;
    if (!lastLog || lastLog === today) return gamData;

    const lastLogDate = new Date(lastLog);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate - lastLogDate) / (1000 * 60 * 60 * 24));

    if (diffDays > 1) {
      const resetGam = { ...gamData, streak: 0 };
      saveProfileData({ gamification: resetGam });
      return resetGam;
    }
    return gamData;
  };

  const calculateDailyTotals = () => {
    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (parseFloat(meal.calories) || 0),
        protein: acc.protein + (parseFloat(meal.protein) || 0),
        carbs: acc.carbs + (parseFloat(meal.carbs) || 0),
        fats: acc.fats + (parseFloat(meal.fats) || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
    setDailyTotals(totals);
  };

  const handleAddMeal = () => {
    if (!currentMeal.name || !currentMeal.calories) {
      Alert.alert('Required', 'Please enter meal name and calories');
      return;
    }

    const newMeal = {
      ...currentMeal,
      id: Date.now().toString(),
      calories: parseFloat(currentMeal.calories) || 0,
    };

    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    
    // Update Gamification
    const today = new Date().toDateString();
    let newStreak = gamification.streak;
    if (gamification.lastLogDate !== today) newStreak = (gamification.streak || 0) + 1;

    const updatedGam = {
      ...gamification,
      points: (gamification.points || 0) + 10,
      level: Math.floor(((gamification.points || 0) + 10) / 100) + 1,
      streak: newStreak,
      lastLogDate: today,
      totalMealsLogged: (gamification.totalMealsLogged || 0) + 1,
    };

    setGamification(updatedGam);
    saveProfileData({ gamification: updatedGam });
    setShowAddMeal(false);
    setCurrentMeal({ name: '', calories: '', protein: '', carbs: '', fats: '', type: 'breakfast' });
  };

  if (!plan || !userData) return <View style={styles.loadingContainer}><Text>Loading...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CaloClash</Text>
          <Text style={styles.headerSubtitle}>Logged in as {userData.name}</Text>
        </View>

        {/* Stats Section */}
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.statItem}><Text style={styles.statVal}>{gamification.points}</Text><Text style={styles.statLab}>Points</Text></View>
            <View style={styles.statItem}><Text style={styles.statVal}>Lvl {gamification.level}</Text><Text style={styles.statLab}>Rank</Text></View>
            <View style={styles.statItem}><Text style={styles.statVal}>{gamification.streak}🔥</Text><Text style={styles.statLab}>Streak</Text></View>
          </View>
        </View>

        {/* Macro Rings */}
        <View style={styles.macroContainer}>
          <View style={styles.macroRing}>
            <Text style={styles.macroVal}>{Math.round(dailyTotals.calories)}</Text>
            <Text style={styles.macroLab}>/ {plan.calories} kcal</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addMealBtn} onPress={() => setShowAddMeal(true)}>
          <Text style={styles.addMealBtnText}>+ LOG MEAL</Text>
        </TouchableOpacity>

        {/* Entries List */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Today's Logs</Text>
          {meals.map(m => (
            <View key={m.id} style={styles.mealItem}>
              <Text style={styles.mealNameText}>{m.name}</Text>
              <Text style={styles.mealCalText}>{m.calories} cal</Text>
            </View>
          ))}
        </View>

        {/* MANAGEMENT BUTTONS */}
        <View style={styles.managementContainer}>
          <TouchableOpacity style={styles.switchBtn} onPress={handleSwitchProfile}>
            <Text style={styles.switchBtnText}>👥 Switch Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.newBtn} onPress={handleCreateNewProfile}>
            <Text style={styles.newBtnText}>➕ Create New Profile</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* Add Meal Modal */}
      <Modal visible={showAddMeal} animationType="fade" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add Entry</Text>
            <TextInput style={styles.input} placeholder="Meal Name" value={currentMeal.name} onChangeText={t => setCurrentMeal({...currentMeal, name: t})} />
            <TextInput style={styles.input} placeholder="Calories" keyboardType="numeric" value={currentMeal.calories} onChangeText={t => setCurrentMeal({...currentMeal, calories: t})} />
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowAddMeal(false)}><Text style={{color: '#fff'}}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity style={styles.modalSave} onPress={handleAddMeal}><Text style={{color: '#fff'}}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scrollContent: { paddingBottom: 60 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#4CAF50', padding: 25, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#fff', opacity: 0.8 },
  statsCard: { backgroundColor: '#fff', margin: 15, padding: 15, borderRadius: 15, elevation: 3 },
  statRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statVal: { fontSize: 18, fontWeight: 'bold' },
  statLab: { fontSize: 12, color: '#666' },
  macroContainer: { alignItems: 'center', marginVertical: 20 },
  macroRing: { width: 150, height: 150, borderRadius: 75, borderWidth: 10, borderColor: '#4CAF50', justifyContent: 'center', alignItems: 'center' },
  macroVal: { fontSize: 24, fontWeight: 'bold' },
  macroLab: { fontSize: 12, color: '#888' },
  addMealBtn: { backgroundColor: '#4CAF50', marginHorizontal: 20, padding: 15, borderRadius: 12, alignItems: 'center' },
  addMealBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listSection: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 10 },
  mealItem: { backgroundColor: '#fff', padding: 12, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  mealNameText: { fontWeight: '500' },
  mealCalText: { color: '#4CAF50', fontWeight: 'bold' },
  
  // Management Buttons Styling
  managementContainer: { padding: 20, gap: 10 },
  switchBtn: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#4CAF50', padding: 15, borderRadius: 12, alignItems: 'center' },
  switchBtnText: { color: '#4CAF50', fontWeight: 'bold' },
  newBtn: { backgroundColor: '#007AFF', padding: 15, borderRadius: 12, alignItems: 'center' },
  newBtnText: { color: '#fff', fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalBox: { backgroundColor: '#fff', padding: 20, borderRadius: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  input: { borderWidth: 1, borderColor: '#eee', padding: 12, borderRadius: 8, marginBottom: 10 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  modalSave: { backgroundColor: '#4CAF50', padding: 12, borderRadius: 10, flex: 1, marginLeft: 5, alignItems: 'center' },
  modalCancel: { backgroundColor: '#888', padding: 12, borderRadius: 10, flex: 1, marginRight: 5, alignItems: 'center' },
});

export default CalorieTracker;