import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { getProfiles, deleteProfile, setActiveProfile } from './profileStorage';

const ProfileSelector = ({ navigation }) => {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadProfiles = async () => {
    setLoading(true);
    const list = await getProfiles();
    setProfiles(list);
    setLoading(false);
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  const handleSelectProfile = async (profile) => {
    await setActiveProfile(profile.id);
    navigation.reset({
      index: 0,
      routes: [
        {
          name: 'CalorieTracker',
          params: { profileId: profile.id },
        },
      ],
    });
  };

  const handleAddNew = () => {
    navigation.navigate('OnboardingSurvey');
  };

  const handleDeleteProfile = (profile, e) => {
    if (e) e.stopPropagation?.();
    Alert.alert(
      'Delete Profile',
      `Are you sure you want to delete "${profile.name}"? All data for this profile will be permanently lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteProfile(profile.id);
            const list = await getProfiles();
            setProfiles(list);
            if (list.length === 0) {
              navigation.reset({
                index: 0,
                routes: [{ name: 'OnboardingSurvey' }],
              });
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>CaloClash</Text>
          <Text style={styles.headerSubtitle}>Choose a profile</Text>
        </View>

        <View style={styles.profileList}>
          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              style={styles.profileCard}
              onPress={() => handleSelectProfile(profile)}
              activeOpacity={0.7}
            >
              <View style={styles.profileInfo}>
                <Text style={styles.profileEmoji}>👤</Text>
                <View style={styles.profileDetails}>
                  <Text style={styles.profileName}>{profile.name}</Text>
                  <Text style={styles.profileMeta}>
                    Level {profile.gamification?.level || 1} • {profile.gamification?.streak || 0} day streak
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={(e) => handleDeleteProfile(profile, e)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.deleteButtonText}>🗑️</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Text style={styles.addButtonIcon}>+</Text>
          <Text style={styles.addButtonText}>Create New Account</Text>
        </TouchableOpacity>

        {profiles.length === 0 && (
          <Text style={styles.emptyText}>No profiles yet. Create one to get started!</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  profileList: {
    marginBottom: 24,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileEmoji: {
    fontSize: 36,
    marginRight: 16,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  profileMeta: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonText: {
    fontSize: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 18,
    borderRadius: 16,
  },
  addButtonIcon: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 24,
    fontSize: 16,
  },
});

export default ProfileSelector;
