import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ route, navigation }) => {
  const { userData, plan, gamification } = route.params;

  const resetAllData = async () => {
    Alert.alert(
      'Reset Everything',
      'This will delete all your data and restart from scratch. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'userData',
                'userPlan',
                'todayMeals',
                'lastSaveDate',
                'gamification',
                'favoriteMeals',
                'waterIntake',
              ]);
              navigation.reset({
                index: 0,
                routes: [{ name: 'OnboardingSurvey' }],
              });
            } catch (error) {
              console.error('Error resetting data:', error);
            }
          },
        },
      ]
    );
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Profile & Stats</Text>
        </View>

        {/* User Info Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Personal Info</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name:</Text>
            <Text style={styles.infoValue}>{userData.name}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Gender:</Text>
            <Text style={styles.infoValue}>
              {userData.gender.charAt(0).toUpperCase() + userData.gender.slice(1)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Age:</Text>
            <Text style={styles.infoValue}>{userData.age} years</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Weight:</Text>
            <Text style={styles.infoValue}>
              {userData.weight} {userData.measurementSystem === 'metric' ? 'kg' : 'lbs'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Height:</Text>
            <Text style={styles.infoValue}>
              {userData.height} {userData.measurementSystem === 'metric' ? 'cm' : 'in'}
            </Text>
          </View>
        </View>

        {/* Gamification Stats */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎮 Gamification Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🏆</Text>
              <Text style={styles.statNumber}>{gamification.points}</Text>
              <Text style={styles.statLabel}>Total Points</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>📊</Text>
              <Text style={styles.statNumber}>{gamification.level}</Text>
              <Text style={styles.statLabel}>Level</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🔥</Text>
              <Text style={styles.statNumber}>{gamification.streak}</Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statEmoji}>🍽️</Text>
              <Text style={styles.statNumber}>{gamification.totalMealsLogged}</Text>
              <Text style={styles.statLabel}>Meals Logged</Text>
            </View>
          </View>
        </View>

        {/* Goals */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎯 Your Goals</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Primary Goal:</Text>
            <Text style={styles.infoValue}>
              {userData.goal.charAt(0).toUpperCase() + userData.goal.slice(1)} Weight
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pace:</Text>
            <Text style={styles.infoValue}>
              {userData.pace.charAt(0).toUpperCase() + userData.pace.slice(1)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Activity Level:</Text>
            <Text style={styles.infoValue}>
              {userData.activityLevel.charAt(0).toUpperCase() + userData.activityLevel.slice(1)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Daily Calories:</Text>
            <Text style={styles.infoValue}>{plan.calories} cal</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>BMR:</Text>
            <Text style={styles.infoValue}>{plan.bmr} cal</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>TDEE:</Text>
            <Text style={styles.infoValue}>{plan.tdee} cal</Text>
          </View>
        </View>

        {/* Badges */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🎖️ Achievements</Text>
          {gamification.badges.length === 0 ? (
            <Text style={styles.noBadgesText}>
              No badges yet! Keep logging meals to unlock achievements.
            </Text>
          ) : (
            <View style={styles.badgesGrid}>
              {gamification.badges.map(badgeId => {
                const badge = getBadgeInfo(badgeId);
                return (
                  <View key={badgeId} style={styles.badgeCard}>
                    <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
                    <Text style={styles.badgeName}>{badge.name}</Text>
                    <Text style={styles.badgeDesc}>{badge.desc}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Available Badges */}
          <Text style={styles.availableBadgesTitle}>Available Badges:</Text>
          <View style={styles.availableBadgesList}>
            {['week_warrior', 'month_master', 'novice_logger', 'dedicated_tracker', 'logging_legend', 'point_collector']
              .filter(id => !gamification.badges.includes(id))
              .map(badgeId => {
                const badge = getBadgeInfo(badgeId);
                return (
                  <View key={badgeId} style={styles.lockedBadge}>
                    <Text style={styles.lockedBadgeEmoji}>{badge.emoji}</Text>
                    <Text style={styles.lockedBadgeName}>{badge.name}</Text>
                    <Text style={styles.lockedBadgeDesc}>{badge.desc}</Text>
                  </View>
                );
              })}
          </View>
        </View>

        {/* Lifestyle */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💼 Lifestyle</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Occupation:</Text>
            <Text style={styles.infoValue}>
              {userData.occupation.charAt(0).toUpperCase() + userData.occupation.slice(1)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sleep:</Text>
            <Text style={styles.infoValue}>{userData.sleepHours} hours/night</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Exercise:</Text>
            <Text style={styles.infoValue}>
              {userData.exercisePreference.charAt(0).toUpperCase() + userData.exercisePreference.slice(1)}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Motivation:</Text>
            <Text style={styles.infoValue}>
              {userData.motivation.charAt(0).toUpperCase() + userData.motivation.slice(1)}
            </Text>
          </View>
        </View>

        {/* Dietary Restrictions */}
        {userData.dietaryRestrictions && userData.dietaryRestrictions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🥗 Dietary Restrictions</Text>
            <View style={styles.restrictionsList}>
              {userData.dietaryRestrictions.map((restriction, index) => (
                <View key={index} style={styles.restrictionTag}>
                  <Text style={styles.restrictionText}>{restriction}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Reset Button */}
        <TouchableOpacity style={styles.resetButton} onPress={resetAllData}>
          <Text style={styles.resetButtonText}>🔄 Reset All Data</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    backgroundColor: '#4CAF50',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    marginBottom: 10,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 0,
    marginTop: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    marginBottom: 12,
  },
  statEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noBadgesText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: '#e8f5e9',
    padding: 16,
    borderRadius: 12,
    marginRight: '4%',
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  badgeEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  badgeDesc: {
    fontSize: 11,
    color: '#666',
    textAlign: 'center',
  },
  availableBadgesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
    marginBottom: 12,
  },
  availableBadgesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  lockedBadge: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 12,
    marginRight: '4%',
    marginBottom: 12,
    alignItems: 'center',
    opacity: 0.6,
  },
  lockedBadgeEmoji: {
    fontSize: 32,
    marginBottom: 8,
    opacity: 0.5,
  },
  lockedBadgeName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
    marginBottom: 4,
  },
  lockedBadgeDesc: {
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
  },
  restrictionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  restrictionTag: {
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
  },
  restrictionText: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  resetButton: {
    margin: 16,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f44336',
  },
  resetButtonText: {
    color: '#f44336',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;