import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CalorieTracker = ({ route, navigation }) => {
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

  const [waterIntake, setWaterIntake] = useState(0); // in glasses (250ml each)
  const [favoriteMeals, setFavoriteMeals] = useState([]);

  useEffect(() => {
    loadUserData();
  }, []);

  useEffect(() => {
    calculateDailyTotals();
  }, [meals]);

  useEffect(() => {
    if (meals.length > 0) {
      saveMeals();
    }
  }, [meals]);

  const loadUserData = async () => {
    try {
      const savedPlan = await AsyncStorage.getItem('userPlan');
      const savedUserData = await AsyncStorage.getItem('userData');
      const savedMeals = await AsyncStorage.getItem('todayMeals');
      const lastSaveDate = await AsyncStorage.getItem('lastSaveDate');
      const savedGamification = await AsyncStorage.getItem('gamification');
      const savedWaterIntake = await AsyncStorage.getItem('waterIntake');
      const savedWaterDate = await AsyncStorage.getItem('waterIntakeDate');
      const savedFavoriteMeals = await AsyncStorage.getItem('favoriteMeals');
      
      if (savedPlan) setPlan(JSON.parse(savedPlan));
      if (savedUserData) setUserData(JSON.parse(savedUserData));
      
      // Load gamification data
      if (savedGamification) {
        const gamData = JSON.parse(savedGamification);
        setGamification(gamData);
        checkAndUpdateStreak(gamData);
      }

      // Load favorite meals
      if (savedFavoriteMeals) {
        setFavoriteMeals(JSON.parse(savedFavoriteMeals));
      }
      
      // Load water intake (reset if new day)
      const today = new Date().toDateString();
      if (savedWaterIntake && savedWaterDate === today) {
        setWaterIntake(parseInt(savedWaterIntake));
      } else {
        setWaterIntake(0);
        await AsyncStorage.setItem('waterIntakeDate', today);
      }
      
      // Check if the saved meals are from today
      if (savedMeals && lastSaveDate === today) {
        setMeals(JSON.parse(savedMeals));
      } else {
        // Clear old meals if it's a new day
        await AsyncStorage.removeItem('todayMeals');
        await AsyncStorage.setItem('lastSaveDate', today);
        setMeals([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const saveMeals = async () => {
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem('todayMeals', JSON.stringify(meals));
      await AsyncStorage.setItem('lastSaveDate', today);
    } catch (error) {
      console.error('Error saving meals:', error);
    }
  };

  const saveGamification = async (gamData) => {
    try {
      await AsyncStorage.setItem('gamification', JSON.stringify(gamData));
    } catch (error) {
      console.error('Error saving gamification data:', error);
    }
  };

  const checkAndUpdateStreak = (gamData) => {
    const today = new Date().toDateString();
    const lastLog = gamData.lastLogDate;
    
    if (!lastLog) {
      // First time logging
      return gamData;
    }
    
    const lastLogDate = new Date(lastLog);
    const todayDate = new Date(today);
    const diffTime = todayDate - lastLogDate;
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      // Consecutive day - maintain streak
      return gamData;
    } else if (diffDays > 1) {
      // Streak broken - reset to 0
      const updatedGam = { ...gamData, streak: 0 };
      setGamification(updatedGam);
      saveGamification(updatedGam);
      return updatedGam;
    }
    
    return gamData;
  };

  const addPoints = (points, reason) => {
    const newPoints = gamification.points + points;
    const newLevel = Math.floor(newPoints / 100) + 1; // Level up every 100 points
    
    const updatedGam = {
      ...gamification,
      points: newPoints,
      level: newLevel,
    };
    
    setGamification(updatedGam);
    saveGamification(updatedGam);
    
    // Show alert for level up
    if (newLevel > gamification.level) {
      Alert.alert('🎉 Level Up!', `You're now Level ${newLevel}! Keep going!`);
    }
  };

  const updateStreak = () => {
    const today = new Date().toDateString();
    const lastLog = gamification.lastLogDate;
    
    if (lastLog === today) {
      // Already logged today
      return;
    }
    
    let newStreak = gamification.streak;
    
    if (!lastLog) {
      // First time logging
      newStreak = 1;
    } else {
      const lastLogDate = new Date(lastLog);
      const todayDate = new Date(today);
      const diffTime = todayDate - lastLogDate;
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Consecutive day
        newStreak = gamification.streak + 1;
      } else {
        // Streak broken
        newStreak = 1;
      }
    }
    
    const updatedGam = {
      ...gamification,
      streak: newStreak,
      lastLogDate: today,
    };
    
    setGamification(updatedGam);
    saveGamification(updatedGam);
    
    // Check for streak badges
    checkBadges(updatedGam);
  };

  const checkBadges = (gamData) => {
    const newBadges = [...gamData.badges];
    let badgeAwarded = false;
    
    // Streak badges
    if (gamData.streak >= 7 && !newBadges.includes('week_warrior')) {
      newBadges.push('week_warrior');
      badgeAwarded = true;
      Alert.alert('🎖️ Badge Unlocked!', '7-Day Streak! You earned "Week Warrior"!');
    }
    if (gamData.streak >= 30 && !newBadges.includes('month_master')) {
      newBadges.push('month_master');
      badgeAwarded = true;
      Alert.alert('🎖️ Badge Unlocked!', '30-Day Streak! You earned "Month Master"!');
    }
    
    // Meal count badges
    if (gamData.totalMealsLogged >= 10 && !newBadges.includes('novice_logger')) {
      newBadges.push('novice_logger');
      badgeAwarded = true;
      Alert.alert('🎖️ Badge Unlocked!', '10 Meals Logged! You earned "Novice Logger"!');
    }
    if (gamData.totalMealsLogged >= 50 && !newBadges.includes('dedicated_tracker')) {
      newBadges.push('dedicated_tracker');
      badgeAwarded = true;
      Alert.alert('🎖️ Badge Unlocked!', '50 Meals Logged! You earned "Dedicated Tracker"!');
    }
    if (gamData.totalMealsLogged >= 100 && !newBadges.includes('logging_legend')) {
      newBadges.push('logging_legend');
      badgeAwarded = true;
      Alert.alert('🎖️ Badge Unlocked!', '100 Meals Logged! You earned "Logging Legend"!');
    }
    
    // Points badges
    if (gamData.points >= 500 && !newBadges.includes('point_collector')) {
      newBadges.push('point_collector');
      badgeAwarded = true;
      Alert.alert('🎖️ Badge Unlocked!', '500 Points! You earned "Point Collector"!');
    }
    
    if (badgeAwarded) {
      const updatedGam = { ...gamData, badges: newBadges };
      setGamification(updatedGam);
      saveGamification(updatedGam);
    }
  };

  const getBadgeInfo = (badgeId) => {
    const badges = {
      week_warrior: { name: 'Week Warrior', emoji: '🔥', desc: '7-day streak' },
      month_master: { name: 'Month Master', emoji: '👑', desc: '30-day streak' },
      novice_logger: { name: 'Novice Logger', emoji: '📝', desc: '10 meals logged' },
      dedicated_tracker: { name: 'Dedicated Tracker', emoji: '💪', desc: '50 meals logged' },
      logging_legend: { name: 'Logging Legend', emoji: '🏆', desc: '100 meals logged' },
      point_collector: { name: 'Point Collector', emoji: '💎', desc: '500 points earned' },
    };
    return badges[badgeId] || { name: 'Unknown', emoji: '❓', desc: '' };
  };

  const addWater = async () => {
    const newWaterIntake = waterIntake + 1;
    setWaterIntake(newWaterIntake);
    
    try {
      const today = new Date().toDateString();
      await AsyncStorage.setItem('waterIntake', newWaterIntake.toString());
      await AsyncStorage.setItem('waterIntakeDate', today);
      
      // Award points for drinking water (every 4 glasses = 5 points)
      if (newWaterIntake % 4 === 0) {
        addPoints(5, 'Hydration milestone');
        Alert.alert('💧 Great Hydration!', '+5 points for drinking water!');
      }
    } catch (error) {
      console.error('Error saving water intake:', error);
    }
  };

  const removeWater = async () => {
    if (waterIntake > 0) {
      const newWaterIntake = waterIntake - 1;
      setWaterIntake(newWaterIntake);
      
      try {
        await AsyncStorage.setItem('waterIntake', newWaterIntake.toString());
      } catch (error) {
        console.error('Error saving water intake:', error);
      }
    }
  };

  const saveFavoriteMeal = async (meal) => {
    const mealToSave = {
      name: meal.name,
      calories: meal.calories,
      protein: meal.protein,
      carbs: meal.carbs,
      fats: meal.fats,
      type: meal.type,
      id: Date.now().toString(),
    };

    const updatedFavorites = [...favoriteMeals, mealToSave];
    setFavoriteMeals(updatedFavorites);

    try {
      await AsyncStorage.setItem('favoriteMeals', JSON.stringify(updatedFavorites));
      Alert.alert('⭐ Saved!', `${meal.name} added to favorites!`);
    } catch (error) {
      console.error('Error saving favorite meal:', error);
    }
  };

  const addFavoriteMeal = (favMeal) => {
    const newMeal = {
      ...favMeal,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
    };

    setMeals([...meals, newMeal]);
    
    // Award points
    addPoints(10, 'Meal logged');
    updateStreak();
    
    const updatedGam = {
      ...gamification,
      totalMealsLogged: gamification.totalMealsLogged + 1,
    };
    setGamification(updatedGam);
    saveGamification(updatedGam);
    checkBadges(updatedGam);
  };

  const removeFavoriteMeal = async (mealId) => {
    Alert.alert(
      'Remove Favorite',
      'Remove this meal from favorites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedFavorites = favoriteMeals.filter(m => m.id !== mealId);
            setFavoriteMeals(updatedFavorites);
            try {
              await AsyncStorage.setItem('favoriteMeals', JSON.stringify(updatedFavorites));
            } catch (error) {
              console.error('Error removing favorite meal:', error);
            }
          },
        },
      ]
    );
  };

  const calculateDailyTotals = () => {
    const totals = meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + parseFloat(meal.calories || 0),
        protein: acc.protein + parseFloat(meal.protein || 0),
        carbs: acc.carbs + parseFloat(meal.carbs || 0),
        fats: acc.fats + parseFloat(meal.fats || 0),
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
      timestamp: new Date().toISOString(),
    };

    setMeals([...meals, newMeal]);
    
    // Award points for logging meal
    addPoints(10, 'Meal logged');
    
    // Update streak
    updateStreak();
    
    // Update total meals logged
    const updatedGam = {
      ...gamification,
      totalMealsLogged: gamification.totalMealsLogged + 1,
    };
    setGamification(updatedGam);
    saveGamification(updatedGam);
    checkBadges(updatedGam);
    
    setShowAddMeal(false);
    resetCurrentMeal();
  };

  const resetCurrentMeal = () => {
    setCurrentMeal({
      name: '',
      calories: '',
      protein: '',
      carbs: '',
      fats: '',
      type: 'breakfast',
    });
  };

  const deleteMeal = async (mealId) => {
    Alert.alert(
      'Delete Meal',
      'Are you sure you want to delete this meal?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedMeals = meals.filter(m => m.id !== mealId);
            setMeals(updatedMeals);
          },
        },
      ]
    );
  };

  const resetProgress = async () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all your data and restart the onboarding. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove(['userData', 'userPlan', 'todayMeals', 'lastSaveDate', 'gamification']);
              navigation.navigate('OnboardingSurvey');
            } catch (error) {
              console.error('Error resetting data:', error);
            }
          },
        },
      ]
    );
  };

  const getProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (current, target) => {
    const percentage = (current / target) * 100;
    if (percentage < 80) return '#4CAF50';
    if (percentage < 100) return '#FFC107';
    return '#F44336';
  };

  const renderProgressRing = (label, current, target, unit) => {
    const percentage = getProgressPercentage(current, target);
    const color = getProgressColor(current, target);

    return (
      <View style={styles.progressRing}>
        <View style={styles.ringContainer}>
          <View style={[styles.ringBackground]}>
            <View
              style={[
                styles.ringFill,
                {
                  backgroundColor: color,
                  height: `${percentage}%`,
                },
              ]}
            />
          </View>
          <View style={styles.ringCenter}>
            <Text style={styles.ringValue}>{Math.round(current)}</Text>
            <Text style={styles.ringTarget}>/ {target}</Text>
          </View>
        </View>
        <Text style={styles.ringLabel}>{label}</Text>
        <Text style={styles.ringUnit}>{unit}</Text>
      </View>
    );
  };

  const renderMealsByType = (type) => {
    const typeMeals = meals.filter(m => m.type === type);
    if (typeMeals.length === 0) return null;

    const typeEmojis = {
      breakfast: '🍳',
      lunch: '🍱',
      dinner: '🍽️',
      snack: '🍎',
    };

    return (
      <View style={styles.mealSection}>
        <Text style={styles.mealTypeTitle}>
          {typeEmojis[type]} {type.charAt(0).toUpperCase() + type.slice(1)}
        </Text>
        {typeMeals.map(meal => (
          <TouchableOpacity
            key={meal.id}
            style={styles.mealCard}
            onLongPress={() => deleteMeal(meal.id)}
          >
            <View style={styles.mealInfo}>
              <Text style={styles.mealName}>{meal.name}</Text>
              <Text style={styles.mealMacros}>
                P: {meal.protein}g | C: {meal.carbs}g | F: {meal.fats}g
              </Text>
            </View>
            <Text style={styles.mealCalories}>{meal.calories} cal</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (!plan || !userData) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header with User Plan */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.headerTitle}>CaloClash</Text>
              <Text style={styles.headerSubtitle}>Welcome back, {userData.name}!</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('ProfileScreen', { userData, plan, gamification })}
            >
              <Text style={styles.profileButtonText}>👤 Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Disclaimer Banner */}
        <View style={styles.disclaimerBanner}>
          <Text style={styles.disclaimerBannerText}>
            ⚠️ This app is not a doctor. Consider verifying with a healthcare professional before use.
          </Text>
        </View>

        {/* Gamification Stats */}
        <View style={styles.gamificationCard}>
          <View style={styles.gamificationRow}>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statValue}>{gamification.points}</Text>
              <Text style={styles.statLabel}>Points</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>📊</Text>
              <Text style={styles.statValue}>Level {gamification.level}</Text>
              <Text style={styles.statLabel}>Current Level</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statValue}>{gamification.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
          </View>

          {/* Progress to next level */}
          <View style={styles.levelProgressContainer}>
            <Text style={styles.levelProgressText}>
              {gamification.points % 100}/100 to Level {gamification.level + 1}
            </Text>
            <View style={styles.levelProgressBar}>
              <View 
                style={[
                  styles.levelProgressFill, 
                  { width: `${(gamification.points % 100)}%` }
                ]} 
              />
            </View>
          </View>

          {/* Badges */}
          {gamification.badges.length > 0 && (
            <View style={styles.badgesContainer}>
              <Text style={styles.badgesTitle}>🎖️ Badges Earned:</Text>
              <View style={styles.badgesList}>
                {gamification.badges.map(badgeId => {
                  const badge = getBadgeInfo(badgeId);
                  return (
                    <View key={badgeId} style={styles.badge}>
                      <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                      <Text style={styles.badgeName}>{badge.name}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Water Tracking */}
        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <Text style={styles.waterTitle}>💧 Water Intake</Text>
            <Text style={styles.waterGoal}>{waterIntake}/8 glasses</Text>
          </View>
          
          <View style={styles.waterGlasses}>
            {[...Array(8)].map((_, index) => (
              <View
                key={index}
                style={[
                  styles.waterGlass,
                  index < waterIntake && styles.waterGlassFilled
                ]}
              >
                <Text style={styles.waterGlassText}>
                  {index < waterIntake ? '💧' : '⚪'}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.waterButtons}>
            <TouchableOpacity style={styles.waterButton} onPress={addWater}>
              <Text style={styles.waterButtonText}>+ Add Glass</Text>
            </TouchableOpacity>
            {waterIntake > 0 && (
              <TouchableOpacity style={styles.waterButtonRemove} onPress={removeWater}>
                <Text style={styles.waterButtonRemoveText}>- Remove</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.waterHint}>+5 points every 4 glasses!</Text>
        </View>

        {/* Favorite Meals Quick Add */}
        {favoriteMeals.length > 0 && (
          <View style={styles.favoritesCard}>
            <Text style={styles.favoritesTitle}>⭐ Quick Add Favorites</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {favoriteMeals.map((favMeal) => (
                <TouchableOpacity
                  key={favMeal.id}
                  style={styles.favoriteItem}
                  onPress={() => addFavoriteMeal(favMeal)}
                  onLongPress={() => removeFavoriteMeal(favMeal.id)}
                >
                  <Text style={styles.favoriteName}>{favMeal.name}</Text>
                  <Text style={styles.favoriteCalories}>{favMeal.calories} cal</Text>
                  <Text style={styles.favoriteTap}>Tap to add</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.favoritesHint}>Long press to remove</Text>
          </View>
        )}

        {/* Main Calorie Progress */}
        <View style={styles.mainProgress}>
          <Text style={styles.caloriesRemaining}>
            {Math.max(0, plan.calories - dailyTotals.calories)}
          </Text>
          <Text style={styles.caloriesLabel}>Calories Remaining</Text>
          
          <View style={styles.calorieBreakdown}>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownValue}>{plan.calories}</Text>
              <Text style={styles.breakdownLabel}>Goal</Text>
            </View>
            <Text style={styles.breakdownDivider}>-</Text>
            <View style={styles.breakdownItem}>
              <Text style={styles.breakdownValue}>{Math.round(dailyTotals.calories)}</Text>
              <Text style={styles.breakdownLabel}>Eaten</Text>
            </View>
            <Text style={styles.breakdownDivider}>=</Text>
            <View style={styles.breakdownItem}>
              <Text style={[styles.breakdownValue, { color: '#4CAF50' }]}>
                {Math.max(0, plan.calories - dailyTotals.calories)}
              </Text>
              <Text style={styles.breakdownLabel}>Left</Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.mainProgressBar}>
            <View
              style={[
                styles.mainProgressFill,
                {
                  width: `${getProgressPercentage(dailyTotals.calories, plan.calories)}%`,
                  backgroundColor: getProgressColor(dailyTotals.calories, plan.calories),
                },
              ]}
            />
          </View>
        </View>

        {/* Macros Progress */}
        <View style={styles.macrosContainer}>
          {renderProgressRing('Protein', dailyTotals.protein, plan.protein, 'g')}
          {renderProgressRing('Carbs', dailyTotals.carbs, plan.carbs, 'g')}
          {renderProgressRing('Fats', dailyTotals.fats, plan.fats, 'g')}
        </View>

        {/* Plan Details */}
        <View style={styles.planDetails}>
          <Text style={styles.planDetailsTitle}>Your Plan Details</Text>
          <View style={styles.planDetailsGrid}>
            <View style={styles.planDetailItem}>
              <Text style={styles.planDetailLabel}>BMR</Text>
              <Text style={styles.planDetailValue}>{plan.bmr} cal</Text>
            </View>
            <View style={styles.planDetailItem}>
              <Text style={styles.planDetailLabel}>TDEE</Text>
              <Text style={styles.planDetailValue}>{plan.tdee} cal</Text>
            </View>
            <View style={styles.planDetailItem}>
              <Text style={styles.planDetailLabel}>Goal</Text>
              <Text style={styles.planDetailValue}>
                {userData.goal.charAt(0).toUpperCase() + userData.goal.slice(1)}
              </Text>
            </View>
            <View style={styles.planDetailItem}>
              <Text style={styles.planDetailLabel}>Pace</Text>
              <Text style={styles.planDetailValue}>
                {userData.pace.charAt(0).toUpperCase() + userData.pace.slice(1)}
              </Text>
            </View>
          </View>
          
          {/* Reset Button */}
          <TouchableOpacity style={styles.resetButton} onPress={resetProgress}>
            <Text style={styles.resetButtonText}>🔄 Reset All Data</Text>
          </TouchableOpacity>
        </View>

        {/* Meals */}
        <View style={styles.mealsContainer}>
          <View style={styles.mealsHeader}>
            <Text style={styles.mealsTitle}>Today's Meals</Text>
            <View>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddMeal(true)}
              >
                <Text style={styles.addButtonText}>+ Add Meal</Text>
              </TouchableOpacity>
              <Text style={styles.pointsHint}>+10 points per meal</Text>
            </View>
          </View>

          {meals.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No meals logged yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Tap "+ Add Meal" to get started!
              </Text>
            </View>
          ) : (
            <>
              {renderMealsByType('breakfast')}
              {renderMealsByType('lunch')}
              {renderMealsByType('dinner')}
              {renderMealsByType('snack')}
            </>
          )}
        </View>
      </ScrollView>

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMeal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddMeal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Meal</Text>

            <Text style={styles.inputLabel}>Meal Type</Text>
            <View style={styles.mealTypeSelector}>
              {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.mealTypeButton,
                    currentMeal.type === type && styles.mealTypeButtonSelected,
                  ]}
                  onPress={() => setCurrentMeal({ ...currentMeal, type })}
                >
                  <Text
                    style={[
                      styles.mealTypeButtonText,
                      currentMeal.type === type && styles.mealTypeButtonTextSelected,
                    ]}
                  >
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Meal Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Chicken Salad"
              value={currentMeal.name}
              onChangeText={(text) => setCurrentMeal({ ...currentMeal, name: text })}
            />

            <Text style={styles.inputLabel}>Calories *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 350"
              keyboardType="numeric"
              value={currentMeal.calories}
              onChangeText={(text) => setCurrentMeal({ ...currentMeal, calories: text })}
            />

            <Text style={styles.inputLabel}>Protein (g)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 30"
              keyboardType="numeric"
              value={currentMeal.protein}
              onChangeText={(text) => setCurrentMeal({ ...currentMeal, protein: text })}
            />

            <Text style={styles.inputLabel}>Carbs (g)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 40"
              keyboardType="numeric"
              value={currentMeal.carbs}
              onChangeText={(text) => setCurrentMeal({ ...currentMeal, carbs: text })}
            />

            <Text style={styles.inputLabel}>Fats (g)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., 15"
              keyboardType="numeric"
              value={currentMeal.fats}
              onChangeText={(text) => setCurrentMeal({ ...currentMeal, fats: text })}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowAddMeal(false);
                  resetCurrentMeal();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddMeal}>
                <Text style={styles.saveButtonText}>Add Meal</Text>
              </TouchableOpacity>
            </View>
            
            {currentMeal.name && currentMeal.calories && (
              <TouchableOpacity 
                style={styles.saveFavoriteButton}
                onPress={() => saveFavoriteMeal(currentMeal)}
              >
                <Text style={styles.saveFavoriteButtonText}>⭐ Save as Favorite</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  profileButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  disclaimerBanner: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ffc107',
  },
  disclaimerBannerText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
  },
  gamificationCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  gamificationRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  levelProgressContainer: {
    marginTop: 8,
  },
  levelProgressText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  levelProgressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  levelProgressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  badgesContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  badgesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  badgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  badgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  mainProgress: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  caloriesRemaining: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  caloriesLabel: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
    marginBottom: 20,
  },
  calorieBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  breakdownItem: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  breakdownValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  breakdownDivider: {
    fontSize: 24,
    color: '#999',
    marginHorizontal: 4,
  },
  mainProgressBar: {
    width: '100%',
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  mainProgressFill: {
    height: '100%',
    borderRadius: 6,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  progressRing: {
    alignItems: 'center',
  },
  ringContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    marginBottom: 8,
  },
  ringBackground: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  ringFill: {
    width: '100%',
    borderRadius: 40,
  },
  ringCenter: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    bottom: 10,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  ringValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  ringTarget: {
    fontSize: 12,
    color: '#666',
  },
  ringLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  ringUnit: {
    fontSize: 12,
    color: '#666',
  },
  planDetails: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  planDetailsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  planDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  planDetailItem: {
    width: '50%',
    marginBottom: 12,
  },
  planDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  planDetailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  resetButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 14,
  },
  mealsContainer: {
    margin: 16,
  },
  mealsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  pointsHint: {
    fontSize: 10,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 4,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#999',
  },
  mealSection: {
    marginBottom: 20,
  },
  mealTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  mealCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  mealMacros: {
    fontSize: 12,
    color: '#666',
  },
  mealCalories: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 10,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mealTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  mealTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mealTypeButtonSelected: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  mealTypeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  mealTypeButtonTextSelected: {
    color: '#fff',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#f5f5f5',
    marginRight: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#4CAF50',
    marginLeft: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  saveFavoriteButton: {
    marginTop: 12,
    padding: 14,
    backgroundColor: '#FFC107',
    borderRadius: 10,
    alignItems: 'center',
  },
  saveFavoriteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  waterCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  waterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  waterGoal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2196F3',
  },
  waterGlasses: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  waterGlass: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterGlassFilled: {
    backgroundColor: '#E3F2FD',
  },
  waterGlassText: {
    fontSize: 20,
  },
  waterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  waterButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8,
  },
  waterButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  waterButtonRemove: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  waterButtonRemoveText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 14,
  },
  waterHint: {
    fontSize: 11,
    color: '#2196F3',
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '600',
  },
  favoritesCard: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  favoritesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  favoriteItem: {
    backgroundColor: '#FFF9E6',
    padding: 16,
    borderRadius: 12,
    marginRight: 12,
    width: 140,
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  favoriteName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  favoriteCalories: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFC107',
    marginBottom: 4,
  },
  favoriteTap: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  favoritesHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },
});

export default CalorieTracker;