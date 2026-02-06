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

  // --- Initialization ---
  useEffect(() => {
    if (profileId) loadUserData();
  }, [profileId]);

  useEffect(() => {
    calculateDailyTotals();
  }, [meals]);

  useEffect(() => {
    if (profileId && hasLoadedRef.current) saveMeals();
  }, [meals]);

  // --- Data Logic ---
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
      
      const initialGam = profile.gamification || { points: 0, level: 1, streak: 0, lastLogDate: null, badges: [], totalMealsLogged: 0 };
      const updatedGam = checkAndUpdateStreak(initialGam);
      setGamification(updatedGam);
      
      setFavoriteMeals(profile.favoriteMeals || []);
      
      const today = new Date().toDateString();
      if (profile.waterIntakeDate === today) {
        setWaterIntake(profile.waterIntake || 0);
      } else {
        setWaterIntake(0);
        await saveProfileData({ waterIntake: 0, waterIntakeDate: today });
      }
      
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

  const saveMeals = async () => {
    const today = new Date().toDateString();
    await saveProfileData({ todayMeals: meals, lastSaveDate: today });
  };

  // --- Gamification Logic ---
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

  const handleAddMeal = () => {
    if (!currentMeal.name || !currentMeal.calories) {
      Alert.alert('Required', 'Please enter meal name and calories');
      return;
    }

    const newMeal = {
      ...currentMeal,
      calories: parseFloat(currentMeal.calories) || 0,
      protein: parseFloat(currentMeal.protein) || 0,
      carbs: parseFloat(currentMeal.carbs) || 0,
      fats: parseFloat(currentMeal.fats) || 0,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    const updatedMeals = [...meals, newMeal];
    setMeals(updatedMeals);
    
    // Atomic Gamification Update
    const today = new Date().toDateString();
    let newStreak = gamification.streak;
    if (gamification.lastLogDate !== today) {
      newStreak = (gamification.streak || 0) + 1;
    }

    const newPoints = gamification.points + 10;
    const newLevel = Math.floor(newPoints / 100) + 1;
    
    const updatedGam = {
      ...gamification,
      points: newPoints,
      level: newLevel,
      streak: newStreak,
      lastLogDate: today,
      totalMealsLogged: (gamification.totalMealsLogged || 0) + 1,
    };

    setGamification(updatedGam);
    checkBadges(updatedGam);
    saveProfileData({ gamification: updatedGam });
    
    setShowAddMeal(false);
    resetCurrentMeal();
  };

  const checkBadges = (gamData) => {
    const newBadges = [...(gamData.badges || [])];
    let awarded = false;

    const milestones = [
      { id: 'week_warrior', criteria: gamData.streak >= 7, msg: '7-Day Streak!' },
      { id: 'novice_logger', criteria: gamData.totalMealsLogged >= 10, msg: '10 Meals Logged!' }
    ];

    milestones.forEach(m => {
      if (m.criteria && !newBadges.includes(m.id)) {
        newBadges.push(m.id);
        awarded = true;
        Alert.alert('🎖️ Badge Unlocked!', m.msg);
      }
    });

    if (awarded) {
      const finalGam = { ...gamData, badges: newBadges };
      setGamification(finalGam);
      saveProfileData({ gamification: finalGam });
    }
  };

  // --- Helper Functions ---
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

  const resetCurrentMeal = () => {
    setCurrentMeal({ name: '', calories: '', protein: '', carbs: '', fats: '', type: 'breakfast' });
  };

  const getProgressPercentage = (curr, target) => Math.min((curr / target) * 100, 100);

  const renderProgressRing = (label, current, target, unit) => (
    <View style={styles.progressRing}>
      <View style={styles.ringContainer}>
        <View style={styles.ringBackground}>
          <View style={[styles.ringFill, { height: `${getProgressPercentage(current, target)}%`, backgroundColor: '#4CAF50' }]} />
        </View>
        <View style={styles.ringCenter}>
          <Text style={styles.ringValue}>{Math.round(current)}</Text>
          <Text style={styles.ringTarget}>/ {target}</Text>
        </View>
      </View>
      <Text style={styles.ringLabel}>{label}</Text>
    </View>
  );

  if (!plan || !userData) return <View style={styles.loadingContainer}><Text>Loading...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CaloClash</Text>
          <Text style={styles.headerSubtitle}>Keep it up, {userData.name}!</Text>
        </View>

        <View style={styles.gamificationCard}>
          <View style={styles.gamificationRow}>
            <View style={styles.statBox}><Text style={styles.statEmoji}>🏆</Text><Text style={styles.statValue}>{gamification.points}</Text><Text style={styles.statLabel}>Points</Text></View>
            <View style={styles.statBox}><Text style={styles.statEmoji}>📊</Text><Text style={styles.statValue}>Lvl {gamification.level}</Text><Text style={styles.statLabel}>Level</Text></View>
            <View style={styles.statBox}><Text style={styles.statEmoji}>🔥</Text><Text style={styles.statValue}>{gamification.streak}</Text><Text style={styles.statLabel}>Streak</Text></View>
          </View>
        </View>

        <View style={styles.mainProgressCard}>
            <Text style={styles.caloriesRemaining}>{Math.max(0, Math.round(plan.calories - dailyTotals.calories))}</Text>
            <Text style={styles.caloriesLabel}>Calories Left Today</Text>
        </View>

        <View style={styles.macrosContainer}>
          {renderProgressRing('Protein', dailyTotals.protein, plan.protein, 'g')}
          {renderProgressRing('Carbs', dailyTotals.carbs, plan.carbs, 'g')}
          {renderProgressRing('Fats', dailyTotals.fats, plan.fats, 'g')}
        </View>

        <TouchableOpacity style={styles.bigAddButton} onPress={() => setShowAddMeal(true)}>
          <Text style={styles.bigAddButtonText}>+ LOG A MEAL</Text>
        </TouchableOpacity>

        <View style={styles.mealsContainer}>
            <Text style={styles.sectionTitle}>Today's Entries</Text>
            {meals.map(meal => (
                <View key={meal.id} style={styles.mealCard}>
                    <View>
                        <Text style={styles.mealName}>{meal.name}</Text>
                        <Text style={styles.mealType}>{meal.type}</Text>
                    </View>
                    <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                </View>
            ))}
        </View>
      </ScrollView>

      <Modal visible={showAddMeal} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>What did you eat?</Text>
            <TextInput style={styles.input} placeholder="Meal Name" value={currentMeal.name} onChangeText={t => setCurrentMeal({...currentMeal, name: t})} />
            <TextInput style={styles.input} placeholder="Calories" keyboardType="numeric" value={currentMeal.calories} onChangeText={t => setCurrentMeal({...currentMeal, calories: t})} />
            <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddMeal(false)}><Text style={styles.buttonText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveButton} onPress={handleAddMeal}><Text style={styles.buttonText}>Save</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  scrollContent: { paddingBottom: 40 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#4CAF50', padding: 25, borderBottomLeftRadius: 30, borderBottomRightRadius: 30 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: '#E8F5E9' },
  gamificationCard: { backgroundColor: '#fff', margin: 16, borderRadius: 20, padding: 20, elevation: 5 },
  gamificationRow: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statEmoji: { fontSize: 24 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#666' },
  mainProgressCard: { alignItems: 'center', marginVertical: 20 },
  caloriesRemaining: { fontSize: 64, fontWeight: 'bold', color: '#4CAF50' },
  caloriesLabel: { fontSize: 18, color: '#666' },
  macrosContainer: { flexDirection: 'row', justifyContent: 'space-around', marginHorizontal: 10 },
  progressRing: { alignItems: 'center', width: width / 3.5 },
  ringContainer: { width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  ringBackground: { width: '100%', height: '100%', borderRadius: 40, backgroundColor: '#E0E0E0', overflow: 'hidden', justifyContent: 'flex-end' },
  ringFill: { width: '100%', position: 'absolute' },
  ringCenter: { width: 66, height: 66, borderRadius: 33, backgroundColor: '#F2F2F7', justifyContent: 'center', alignItems: 'center' },
  ringValue: { fontWeight: 'bold' },
  ringTarget: { fontSize: 10, color: '#999' },
  ringLabel: { marginTop: 8, fontWeight: '600' },
  bigAddButton: { backgroundColor: '#4CAF50', margin: 16, padding: 18, borderRadius: 15, alignItems: 'center' },
  bigAddButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  mealsContainer: { padding: 16 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  mealCard: { backgroundColor: '#fff', padding: 15, borderRadius: 12, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mealName: { fontSize: 16, fontWeight: '600' },
  mealType: { fontSize: 12, color: '#999' },
  mealCalories: { fontWeight: 'bold', color: '#4CAF50' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#DDD', padding: 12, borderRadius: 10, marginBottom: 15 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between' },
  saveButton: { backgroundColor: '#4CAF50', padding: 15, borderRadius: 10, flex: 1, marginLeft: 5, alignItems: 'center' },
  cancelButton: { backgroundColor: '#FF5252', padding: 15, borderRadius: 10, flex: 1, marginRight: 5, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: 'bold' }
});

export default CalorieTracker;