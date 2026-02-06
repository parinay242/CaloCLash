import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import OnboardingSurvey from './OnboardingSurvey';
import CalorieTracker from './CalorieTracker';
import ProfileScreen from './ProfileScreen';
import ProfileSelector from './ProfileSelector';
import { migrateFromLegacy, getProfiles, getActiveProfileId } from './profileStorage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const Stack = createStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('OnboardingSurvey');
  const [initialParams, setInitialParams] = useState({});

  useEffect(() => {
    checkUserData();
  }, []);

  const checkUserData = async () => {
    try {
      await migrateFromLegacy();
      const profiles = await getProfiles();
      const activeId = await getActiveProfileId();
      
      if (profiles.length === 0) {
        setInitialRoute('OnboardingSurvey');
      } else if (activeId) {
        const profile = profiles.find(p => p.id === activeId);
        if (profile) {
          setInitialRoute('CalorieTracker');
          setInitialParams({ profileId: activeId });
        } else {
          setInitialRoute('ProfileSelector');
        }
      } else {
        setInitialRoute('ProfileSelector');
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setInitialRoute('OnboardingSurvey');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{
          headerShown: false,
          cardStyle: { flex: 1 },
        }}
      >
        <Stack.Screen 
          name="OnboardingSurvey" 
          component={OnboardingSurvey} 
        />
        <Stack.Screen 
          name="ProfileSelector" 
          component={ProfileSelector}
        />
        <Stack.Screen 
          name="CalorieTracker" 
          component={CalorieTracker}
          initialParams={initialParams}
        />
        <Stack.Screen 
          name="ProfileScreen" 
          component={ProfileScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
});